import {Client} from "@notionhq/client";
import {isFullPage} from "@notionhq/client/build/src/helpers";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const dataSourceId = process.env.NOTION_WORKS_DATASOURCE_ID;
const mediaArchivesDataSourceId =
  process.env.NOTION_MEDIA_ARCHIVES_DATASOURCE_ID;
const diaryDataSourceId = process.env.NOTION_DIARY_DATASOURCE_ID;

export interface NotionWork {
  id: string;
  sortId: number;
  name: string;
  category: string;
  thumbnail: string | null;
  activity_period: string;
  visibility: boolean;
  slug: string;
}

export interface NotionMediaArchive {
  id: string;
  title: string;
  date: string | null;
  url: string | null;
  thumbnail: string | null;
}

export interface NotionDiary {
  id: string;
  title: string;
  date: string | null;
  thumbnail: string | null;
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
  | {type: "text"; rich_text: NotionRichTextContent[]}
  | {type: "image"; url: string; caption: string}
  | {type: "divider"};

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
    throw new Error("NOTION_WORKS_DATASOURCE_ID is not set");
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
        thumbnailUrl = `/api/notion-image?pageId=${page.id}&property=thumbnail`;
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

    // Extract id (number) property
    const idProperty = page.properties.id;
    const sortId =
      idProperty?.type === "number" ? (idProperty.number ?? 0) : 0;

    // Filter out works that are not visible
    if (!visibility) continue;

    // Generate slug from page id
    const slug = page.id.replace(/-/g, "");

    works.push({
      id: page.id,
      sortId,
      name,
      category,
      thumbnail: thumbnailUrl,
      activity_period: activityPeriod,
      visibility,
      slug,
    });
  }

  // id降順でソート
  works.sort((a, b) => b.sortId - a.sortId);

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
  pageId: string,
): Promise<WorkContentBlock[]> {
  const blocks = await notion.blocks.children.list({
    block_id: pageId,
  });

  const content: WorkContentBlock[] = [];

  for (const block of blocks.results) {
    const blockType = (block as {type?: string}).type;

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
      const blockData = (block as Record<string, unknown>)[blockType] as {
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
        file?: {url: string};
        external?: {url: string};
        caption?: NotionRichTextItem[];
      };

      const imageUrl =
        imageData?.type === "file"
          ? `/api/notion-image?blockId=${(block as {id: string}).id}`
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

async function fetchAllMediaArchives(): Promise<NotionMediaArchive[]> {
  if (!mediaArchivesDataSourceId) {
    throw new Error("NOTION_MEDIA_ARCHIVES_DATASOURCE_ID is not set");
  }

  const res = await notion.dataSources.query({
    data_source_id: mediaArchivesDataSourceId,
    page_size: 100,
  });

  const pages = res.results.filter(isFullPage);
  const archives: NotionMediaArchive[] = [];

  for (const page of pages) {
    // Extract title from title property
    const titleProperty = page.properties.title;
    if (titleProperty?.type !== "title") continue;
    const title =
      titleProperty.title
        .map((t: NotionRichTextItem) => t.plain_text)
        .join("") || "";

    // Extract visibility from checkbox property
    const visibilityProperty = page.properties.visibility;
    const visibility =
      visibilityProperty?.type === "checkbox"
        ? visibilityProperty.checkbox
        : false;

    if (!visibility) continue;

    // Extract date from date property
    const dateProperty = page.properties.date;
    const date =
      dateProperty?.type === "date" ? dateProperty.date?.start ?? null : null;

    // Extract url from url property
    const urlProperty = page.properties.url;
    const url =
      urlProperty?.type === "url" ? urlProperty.url ?? null : null;

    // Extract thumbnail from files property
    const thumbnailProperty = page.properties.thumbnail;
    let thumbnailUrl: string | null = null;

    if (
      thumbnailProperty?.type === "files" &&
      thumbnailProperty.files.length > 0
    ) {
      const fileObj = thumbnailProperty.files[0];
      if (fileObj.type === "file") {
        thumbnailUrl = `/api/notion-image?pageId=${page.id}&property=thumbnail`;
      } else if (fileObj.type === "external") {
        thumbnailUrl = fileObj.external.url;
      }
    }

    archives.push({
      id: page.id,
      title,
      date,
      url,
      thumbnail: thumbnailUrl,
    });
  }

  return archives;
}

// Media Archives キャッシュロジック
let cachedMediaArchives: NotionMediaArchive[] | null = null;
let mediaArchivesCachePromise: Promise<NotionMediaArchive[]> | null = null;

export async function getMediaArchives(): Promise<NotionMediaArchive[]> {
  if (cachedMediaArchives) return cachedMediaArchives;
  if (mediaArchivesCachePromise) return mediaArchivesCachePromise;

  mediaArchivesCachePromise = fetchAllMediaArchives().then((archives) => {
    cachedMediaArchives = archives;
    return archives;
  });

  return mediaArchivesCachePromise;
}

async function fetchAllDiaries(): Promise<NotionDiary[]> {
  if (!diaryDataSourceId) {
    throw new Error("NOTION_DIARY_DATASOURCE_ID is not set");
  }

  const res = await notion.dataSources.query({
    data_source_id: diaryDataSourceId,
    page_size: 100,
  });

  const pages = res.results.filter(isFullPage);
  const diaries: NotionDiary[] = [];

  for (const page of pages) {
    // Extract title from title property
    const titleProperty = page.properties.title;
    if (titleProperty?.type !== "title") continue;
    const title =
      titleProperty.title
        .map((t: NotionRichTextItem) => t.plain_text)
        .join("") || "";

    // Extract visibility from checkbox property
    const visibilityProperty = page.properties.visibility;
    const visibility =
      visibilityProperty?.type === "checkbox"
        ? visibilityProperty.checkbox
        : false;

    if (!visibility) continue;

    // Extract date from date property
    const dateProperty = page.properties.date;
    const date =
      dateProperty?.type === "date" ? dateProperty.date?.start ?? null : null;

    // Extract thumbnail from files property
    const thumbnailProperty = page.properties.thumbnail;
    let thumbnailUrl: string | null = null;

    if (
      thumbnailProperty?.type === "files" &&
      thumbnailProperty.files.length > 0
    ) {
      const fileObj = thumbnailProperty.files[0];
      if (fileObj.type === "file") {
        thumbnailUrl = `/api/notion-image?pageId=${page.id}&property=thumbnail`;
      } else if (fileObj.type === "external") {
        thumbnailUrl = fileObj.external.url;
      }
    }

    // Generate slug from page id
    const slug = page.id.replace(/-/g, "");

    diaries.push({
      id: page.id,
      title,
      date,
      thumbnail: thumbnailUrl,
      slug,
    });
  }

  return diaries;
}

// Diary キャッシュロジック
let cachedDiaries: NotionDiary[] | null = null;
let diaryCachePromise: Promise<NotionDiary[]> | null = null;

export async function getDiaries(): Promise<NotionDiary[]> {
  if (cachedDiaries) return cachedDiaries;
  if (diaryCachePromise) return diaryCachePromise;

  diaryCachePromise = fetchAllDiaries().then((diaries) => {
    cachedDiaries = diaries;
    return diaries;
  });

  return diaryCachePromise;
}

export async function getDiaryBySlug(
  slug: string,
): Promise<NotionDiary | null> {
  const diaries = await getDiaries();
  return diaries.find((diary) => diary.slug === slug) || null;
}
