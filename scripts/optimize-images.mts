import {Client} from "@notionhq/client";
import {isFullPage} from "@notionhq/client/build/src/helpers";
import sharp from "sharp";
import fs from "fs";
import path from "path";

const notion = new Client({auth: process.env.NOTION_TOKEN});

const WORKS_DB = process.env.NOTION_WORKS_DATASOURCE_ID!;
const MEDIA_DB = process.env.NOTION_MEDIA_ARCHIVES_DATASOURCE_ID!;
const DIARY_DB = process.env.NOTION_DIARY_DATASOURCE_ID!;
const CONTENTS_DB = process.env.NOTION_CONTENTS_DATASOURCE_ID!;

const PUBLIC_DIR = path.resolve("public/images");
const THUMBNAILS_DIR = path.join(PUBLIC_DIR, "thumbnails");
const BLOCKS_DIR = path.join(PUBLIC_DIR, "blocks");
const METADATA_PATH = path.join(PUBLIC_DIR, "metadata.json");

const MAX_WIDTH = 1200;
const QUALITY = 80;

interface Metadata {
  thumbnails: Record<string, {lastEdited: string}>;
  blocks: Record<string, {lastEdited: string}>;
}

function loadMetadata(): Metadata {
  if (fs.existsSync(METADATA_PATH)) {
    return JSON.parse(fs.readFileSync(METADATA_PATH, "utf-8"));
  }
  return {thumbnails: {}, blocks: {}};
}

function saveMetadata(metadata: Metadata) {
  fs.writeFileSync(METADATA_PATH, JSON.stringify(metadata, null, 2));
}

async function downloadAndOptimize(
  url: string,
  outputPath: string,
): Promise<boolean> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Failed to fetch: ${url} (${res.status})`);
      return false;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    await sharp(buffer)
      .resize({width: MAX_WIDTH, withoutEnlargement: true})
      .webp({quality: QUALITY})
      .toFile(outputPath);
    return true;
  } catch (e) {
    console.warn(`Failed to optimize: ${url}`, e);
    return false;
  }
}

// Notion file property から実際のURLを取得
async function getThumbnailUrl(
  pageId: string,
  property: string,
): Promise<string | null> {
  const page = await notion.pages.retrieve({page_id: pageId});
  const pageData = page as {properties: Record<string, unknown>};
  const prop = pageData.properties[property] as {
    type?: string;
    files?: Array<{
      type: string;
      file?: {url: string};
      external?: {url: string};
    }>;
  };
  if (prop?.type === "files" && prop.files && prop.files.length > 0) {
    const fileObj = prop.files[0];
    return fileObj.type === "file"
      ? (fileObj.file?.url ?? null)
      : (fileObj.external?.url ?? null);
  }
  return null;
}

// ブロック画像の実際のURLを取得
async function getBlockImageUrl(blockId: string): Promise<string | null> {
  const block = await notion.blocks.retrieve({block_id: blockId});
  const blockData = block as Record<string, unknown>;
  if (blockData.type === "image") {
    const imageData = blockData.image as {
      type?: string;
      file?: {url: string};
      external?: {url: string};
    };
    return imageData?.type === "file"
      ? (imageData.file?.url ?? null)
      : (imageData?.external?.url ?? null);
  }
  return null;
}

// Rate limit対策: 簡易ディレイ
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface PageInfo {
  id: string;
  lastEdited: string;
  hasThumbnail: boolean;
}

interface BlockImageInfo {
  blockId: string;
  pageLastEdited: string;
}

async function collectPages(
  dataSourceId: string,
): Promise<PageInfo[]> {
  const res = await notion.dataSources.query({
    data_source_id: dataSourceId,
    page_size: 100,
  });

  const pages = res.results.filter(isFullPage);
  const result: PageInfo[] = [];

  for (const page of pages) {
    // visibility チェック
    const visibilityProp = page.properties.visibility;
    if (visibilityProp?.type === "checkbox" && !visibilityProp.checkbox) {
      continue;
    }

    const thumbnailProp = page.properties.thumbnail;
    const hasThumbnail =
      thumbnailProp?.type === "files" &&
      thumbnailProp.files.length > 0 &&
      thumbnailProp.files[0].type === "file";

    result.push({
      id: page.id,
      lastEdited: page.last_edited_time,
      hasThumbnail,
    });
  }

  return result;
}

async function collectBlockImages(
  pageId: string,
  pageLastEdited: string,
): Promise<BlockImageInfo[]> {
  const blocks = await notion.blocks.children.list({block_id: pageId});
  const images: BlockImageInfo[] = [];

  for (const block of blocks.results) {
    const b = block as {type?: string; id: string; image?: {type?: string}};
    if (b.type === "image" && b.image?.type === "file") {
      images.push({blockId: b.id, pageLastEdited});
    }
  }

  return images;
}

async function main() {
  console.log("Starting image optimization...");

  // ディレクトリ作成
  fs.mkdirSync(THUMBNAILS_DIR, {recursive: true});
  fs.mkdirSync(BLOCKS_DIR, {recursive: true});

  const metadata = loadMetadata();
  const newMetadata: Metadata = {thumbnails: {}, blocks: {}};

  // 1. 全ページを収集
  console.log("Collecting pages from Notion...");
  const [worksPages, mediaPages, diaryPages] = await Promise.all([
    collectPages(WORKS_DB),
    collectPages(MEDIA_DB),
    collectPages(DIARY_DB),
  ]);

  const allPages = [...worksPages, ...mediaPages, ...diaryPages];
  console.log(`Found ${allPages.length} pages with potential thumbnails`);

  // 2. サムネイルの処理
  let thumbnailCount = 0;
  for (const page of allPages) {
    if (!page.hasThumbnail) continue;

    const outputPath = path.join(THUMBNAILS_DIR, `${page.id}.webp`);
    const cached = metadata.thumbnails[page.id];

    // キャッシュが有効ならスキップ
    if (
      cached &&
      cached.lastEdited === page.lastEdited &&
      fs.existsSync(outputPath)
    ) {
      newMetadata.thumbnails[page.id] = cached;
      continue;
    }

    console.log(`Processing thumbnail: ${page.id}`);
    await delay(350); // Rate limit
    const url = await getThumbnailUrl(page.id, "thumbnail");
    if (url) {
      const success = await downloadAndOptimize(url, outputPath);
      if (success) {
        newMetadata.thumbnails[page.id] = {lastEdited: page.lastEdited};
        thumbnailCount++;
      }
    }
  }
  console.log(`Optimized ${thumbnailCount} thumbnails`);

  // 3. ブロック画像の収集と処理
  console.log("Collecting block images...");

  // Works と Diary の詳細ページ + About ページのブロック画像を収集
  const blockImages: BlockImageInfo[] = [];

  // Works detail pages
  for (const page of worksPages) {
    await delay(350);
    const images = await collectBlockImages(page.id, page.lastEdited);
    blockImages.push(...images);
  }

  // Diary detail pages
  for (const page of diaryPages) {
    await delay(350);
    const images = await collectBlockImages(page.id, page.lastEdited);
    blockImages.push(...images);
  }

  // About page
  try {
    const contentsRes = await notion.dataSources.query({
      data_source_id: CONTENTS_DB,
      page_size: 100,
    });
    const contentsPages = contentsRes.results.filter(isFullPage);
    const aboutPage = contentsPages.find((p) => {
      const nameProp = p.properties.Name || p.properties.name;
      if (nameProp?.type !== "title") return false;
      return (
        nameProp.title.map((t: {plain_text: string}) => t.plain_text).join("") ===
        "About"
      );
    });
    if (aboutPage) {
      await delay(350);
      const images = await collectBlockImages(
        aboutPage.id,
        aboutPage.last_edited_time,
      );
      blockImages.push(...images);
    }
  } catch (e) {
    console.warn("Failed to fetch About page blocks:", e);
  }

  console.log(`Found ${blockImages.length} block images`);

  let blockCount = 0;
  for (const img of blockImages) {
    const outputPath = path.join(BLOCKS_DIR, `${img.blockId}.webp`);
    const cached = metadata.blocks[img.blockId];

    if (
      cached &&
      cached.lastEdited === img.pageLastEdited &&
      fs.existsSync(outputPath)
    ) {
      newMetadata.blocks[img.blockId] = cached;
      continue;
    }

    console.log(`Processing block image: ${img.blockId}`);
    await delay(350);
    const url = await getBlockImageUrl(img.blockId);
    if (url) {
      const success = await downloadAndOptimize(url, outputPath);
      if (success) {
        newMetadata.blocks[img.blockId] = {lastEdited: img.pageLastEdited};
        blockCount++;
      }
    }
  }
  console.log(`Optimized ${blockCount} block images`);

  // 4. 不要な画像を削除
  const validThumbnailFiles = new Set(
    allPages
      .filter((p) => p.hasThumbnail)
      .map((p) => `${p.id}.webp`),
  );
  const validBlockFiles = new Set(blockImages.map((b) => `${b.blockId}.webp`));

  for (const file of fs.readdirSync(THUMBNAILS_DIR)) {
    if (!validThumbnailFiles.has(file)) {
      fs.unlinkSync(path.join(THUMBNAILS_DIR, file));
      console.log(`Removed stale thumbnail: ${file}`);
    }
  }
  for (const file of fs.readdirSync(BLOCKS_DIR)) {
    if (!validBlockFiles.has(file)) {
      fs.unlinkSync(path.join(BLOCKS_DIR, file));
      console.log(`Removed stale block image: ${file}`);
    }
  }

  // 5. メタデータ保存
  saveMetadata(newMetadata);

  console.log("Image optimization complete!");
}

main().catch((err) => {
  console.error("Image optimization failed:", err);
  process.exit(1);
});
