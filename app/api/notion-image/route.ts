import {Client} from "@notionhq/client";
import {NextRequest, NextResponse} from "next/server";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

export async function GET(request: NextRequest) {
  const {searchParams} = request.nextUrl;
  const pageId = searchParams.get("pageId");
  const blockId = searchParams.get("blockId");
  const property = searchParams.get("property") || "thumbnail";

  let imageUrl: string | null = null;

  if (blockId) {
    // ブロック画像: blockIdからNotionブロックを取得して画像URLを得る
    const block = await notion.blocks.retrieve({block_id: blockId});
    const blockData = block as Record<string, unknown>;
    if (blockData.type === "image") {
      const imageData = blockData.image as {
        type?: string;
        file?: {url: string};
        external?: {url: string};
      };
      imageUrl =
        imageData?.type === "file"
          ? (imageData.file?.url ?? null)
          : (imageData?.external?.url ?? null);
    }
  } else if (pageId) {
    // サムネイル: pageIdからNotionページを取得してプロパティの画像URLを得る
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
      imageUrl =
        fileObj.type === "file"
          ? (fileObj.file?.url ?? null)
          : (fileObj.external?.url ?? null);
    }
  }

  if (!imageUrl) {
    return new NextResponse("Image not found", {status: 404});
  }

  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    return new NextResponse("Failed to fetch image", {status: 502});
  }

  const contentType =
    imageResponse.headers.get("content-type") || "image/jpeg";
  const imageBuffer = await imageResponse.arrayBuffer();

  return new NextResponse(imageBuffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, s-maxage=2592000, max-age=86400",
    },
  });
}
