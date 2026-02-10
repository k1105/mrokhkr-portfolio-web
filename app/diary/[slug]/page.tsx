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
          <h1 className={styles.title}>{diary.title}</h1>
          {diary.date && (
            <p className={styles.subtitle}>{formatDate(diary.date)}</p>
          )}
        </div>

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
            if (block.type === "text") {
              return <p key={index}>{renderRichText(block.rich_text)}</p>;
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
                    <p className={styles.imageCaption}>{block.caption}</p>
                  )}
                </div>
              );
            } else if (block.type === "divider") {
              return <div key={index} className={styles.divider} />;
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
}
