import { Client } from "@notionhq/client";
import { isFullPage } from "@notionhq/client/build/src/helpers";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const dataSourceId = process.env.NOTION_DATA_SOURCE_ID;

export interface NotionWork {
  id: string;
  name: string;
  category: string;
  thumbnail: string | null;
  activity_period: string;
  visibility: boolean;
  slug: string;
}

export interface NotionRichTextContent {
  plain_text: string;
  href?: string | null;
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
    color?: string;
  };
}

export type WorkContentBlock =
  | { type: "text"; rich_text: NotionRichTextContent[] }
  | { type: "image"; url: string; caption: string }
  | { type: "divider" };

// Notion API からの型定義（最小限）
interface NotionRichTextItem {
  plain_text: string;
  href?: string | null;
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
    color?: string;
  };
}

async function fetchAllWorks(): Promise<NotionWork[]> {
  if (!dataSourceId) {
    throw new Error("NOTION_DATA_SOURCE_ID is not set");
  }

  const res = await notion.dataSources.query({
    data_source_id: dataSourceId,
    page_size: 100,
  });

  const pages = res.results.filter(isFullPage);
  const works: NotionWork[] = [];

  for (const page of pages) {
    // Extract name from title property
    const nameProperty = page.properties.name;
    if (nameProperty?.type !== "title") continue;
    const name =
      nameProperty.title
        .map((t: NotionRichTextItem) => t.plain_text)
        .join("") || "";

    // Extract category from select property
    const categoryProperty = page.properties.category;
    if (categoryProperty?.type !== "select") continue;
    const category = categoryProperty.select?.name || "";

    // Extract thumbnail from files property
    const thumbnailProperty = page.properties.thumbnail;
    let thumbnailUrl: string | null = null;

    if (
      thumbnailProperty?.type === "files" &&
      thumbnailProperty.files.length > 0
    ) {
      const fileObj = thumbnailProperty.files[0];
      if (fileObj.type === "file") {
        thumbnailUrl = fileObj.file.url;
      } else if (fileObj.type === "external") {
        thumbnailUrl = fileObj.external.url;
      }
    }

    // Extract activity_period from rich_text property
    const activityPeriodProperty = page.properties.activity_period;
    const activityPeriod =
      activityPeriodProperty?.type === "rich_text"
        ? activityPeriodProperty.rich_text
            .map((t: NotionRichTextItem) => t.plain_text)
            .join("")
        : "";

    // Extract visibility from checkbox property
    const visibilityProperty = page.properties.visibility;
    const visibility =
      visibilityProperty?.type === "checkbox"
        ? visibilityProperty.checkbox
        : false;

    // Filter out works that are not visible
    if (!visibility) continue;

    // Generate slug from page id
    const slug = page.id.replace(/-/g, "");

    works.push({
      id: page.id,
      name,
      category,
      thumbnail: thumbnailUrl,
      activity_period: activityPeriod,
      visibility,
      slug,
    });
  }

  return works;
}

// キャッシュロジック
let cachedWorks: NotionWork[] | null = null;
let cachePromise: Promise<NotionWork[]> | null = null;

export async function getWorks(): Promise<NotionWork[]> {
  if (cachedWorks) return cachedWorks;
  if (cachePromise) return cachePromise;

  cachePromise = fetchAllWorks().then((works) => {
    cachedWorks = works;
    return works;
  });

  return cachePromise;
}

export async function getWorkBySlug(slug: string): Promise<NotionWork | null> {
  const works = await getWorks();
  return works.find((work) => work.slug === slug) || null;
}

export async function getWorkById(id: string): Promise<NotionWork | null> {
  const works = await getWorks();
  return works.find((work) => work.id === id) || null;
}

// ページのブロックからrich_textコンテンツと画像を取得
export async function getWorkContent(
  pageId: string
): Promise<WorkContentBlock[]> {
  const blocks = await notion.blocks.children.list({
    block_id: pageId,
  });

  const content: WorkContentBlock[] = [];

  for (const block of blocks.results) {
    const blockType = (block as { type?: string }).type;
    
    // テキストブロック（段落、見出し、リストなど）
    if (
      blockType === "paragraph" ||
      blockType === "heading_1" ||
      blockType === "heading_2" ||
      blockType === "heading_3" ||
      blockType === "bulleted_list_item" ||
      blockType === "numbered_list_item" ||
      blockType === "quote" ||
      blockType === "callout"
    ) {
      const blockData = (block as Record<string, unknown>)[
        blockType
      ] as {
        rich_text?: NotionRichTextItem[];
      };
      if (blockData?.rich_text && blockData.rich_text.length > 0) {
        content.push({
          type: "text",
          rich_text: blockData.rich_text.map((item) => ({
            plain_text: item.plain_text,
            href: item.href,
            annotations: item.annotations,
          })),
        });
      }
    }
    
    // 画像ブロック
    if (blockType === "image") {
      const imageData = (block as Record<string, unknown>).image as {
        type?: string;
        file?: { url: string };
        external?: { url: string };
        caption?: NotionRichTextItem[];
      };
      
      const imageUrl =
        imageData?.type === "file"
          ? imageData.file?.url
          : imageData?.external?.url;
      
      const caption =
        imageData?.caption
          ?.map((item: NotionRichTextItem) => item.plain_text)
          .join("") || "";

      if (imageUrl) {
        content.push({
          type: "image",
          url: imageUrl,
          caption,
        });
      }
    }
    
    // Dividerブロック
    if (blockType === "divider") {
      content.push({
        type: "divider",
      });
    }
  }

  return content;
}
