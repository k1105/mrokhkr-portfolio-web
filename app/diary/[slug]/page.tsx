import Image from "next/image";
import React from "react";
import {notFound} from "next/navigation";
import {
  getDiaryBySlug,
  getDiaries,
  getWorkContent,
  NotionRichTextContent,
} from "../../../lib/notion";
import styles from "../../works/[slug]/page.module.css";

function toYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (
      (u.hostname === "www.youtube.com" || u.hostname === "youtube.com") &&
      u.pathname === "/watch"
    ) {
      const v = u.searchParams.get("v");
      return v ? `https://www.youtube.com/embed/${v}` : null;
    }
    if (u.hostname === "youtu.be") {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (
      (u.hostname === "www.youtube.com" || u.hostname === "youtube.com") &&
      u.pathname.startsWith("/embed/")
    ) {
      return url;
    }
  } catch {
    // invalid URL
  }
  return null;
}

interface DiaryPageProps {
  params: Promise<{slug: string}>;
}

export async function generateStaticParams() {
  const diaries = await getDiaries();
  return diaries.map((diary) => ({
    slug: diary.slug,
  }));
}

function renderRichText(richText: NotionRichTextContent[]) {
  return richText.map((item, index) => {
    const {plain_text, href, annotations} = item;
    let content: React.ReactNode = plain_text;

    if (annotations) {
      if (annotations.bold) {
        content = <strong>{content}</strong>;
      }
      if (annotations.italic) {
        content = <em>{content}</em>;
      }
      if (annotations.strikethrough) {
        content = <s>{content}</s>;
      }
      if (annotations.underline) {
        content = <u>{content}</u>;
      }
      if (annotations.code) {
        content = <code>{content}</code>;
      }
    }

    if (href) {
      return (
        <a
          key={index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {content}
        </a>
      );
    }

    return <React.Fragment key={index}>{content}</React.Fragment>;
  });
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${year}.${month}.${day}`;
}

export default async function DiaryDetailPage({params}: DiaryPageProps) {
  const {slug} = await params;
  const diary = await getDiaryBySlug(slug);

  if (!diary) {
    notFound();
  }

  const content = await getWorkContent(diary.id);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={`${styles.title} global-text-lg`}>{diary.title}</h1>
          {diary.date && (
            <p className={`${styles.subtitle} global-text-sm`}>{formatDate(diary.date)}</p>
          )}
        </div>

        <div className={styles.contentWrapper}>
          {diary.thumbnail && (
            <div className={styles.imageWrapper}>
              <Image
                src={diary.thumbnail}
                alt={diary.title}
                width={600}
                height={400}
                className={styles.mainImage}
                priority
              />
            </div>
          )}

          <div className={styles.textContent}>
            {content.map((block, index) => {
              if (block.type === "heading") {
                const Tag = `h${block.level}` as "h1" | "h2" | "h3";
                return (
                  <Tag className={`${styles.heading} global-text-lg`} key={index}>
                    {renderRichText(block.rich_text)}
                  </Tag>
                );
              } else if (block.type === "text") {
                return <p className="global-text-md" key={index}>{renderRichText(block.rich_text)}</p>;
              } else if (block.type === "image") {
                return (
                  <div key={index} className={styles.contentImageWrapper}>
                    <Image
                      src={block.url}
                      alt={block.caption || ""}
                      width={600}
                      height={400}
                      className={styles.contentImage}
                    />
                    {block.caption && (
                      <p className={`${styles.imageCaption} global-text-sm`}>{block.caption}</p>
                    )}
                  </div>
                );
              } else if (block.type === "video") {
                const embedUrl = toYouTubeEmbedUrl(block.url);
                if (embedUrl) {
                  return (
                    <div key={index} className={styles.videoWrapper}>
                      <iframe
                        src={embedUrl}
                        title={block.caption || "YouTube video"}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                      {block.caption && (
                        <p className={`global-text-sm`}>{block.caption}</p>
                      )}
                    </div>
                  );
                }
                return null;
              } else if (block.type === "divider") {
                return <hr key={index} className={styles.divider} />;
              } else if (block.type === "spacer") {
                return <div key={index} className={styles.spacer} />;
              }
              return null;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
