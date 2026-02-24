import Image from "next/image";
import React from "react";
import {notFound} from "next/navigation";
import {
  getWorkBySlug,
  getWorks,
  getWorkContent,
  NotionRichTextContent,
} from "../../../lib/notion";
import styles from "./page.module.css";

interface WorkPageProps {
  params: Promise<{slug: string}>;
}

export async function generateStaticParams() {
  const works = await getWorks();
  return works.map((work) => ({
    slug: work.slug,
  }));
}

function renderRichText(richText: NotionRichTextContent[]) {
  return richText.map((item, index) => {
    const {plain_text, href, annotations} = item;
    let content: React.ReactNode = plain_text;

    if (annotations) {
      // アノテーションをネストして適用
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
        <a key={index} href={href} target="_blank" rel="noopener noreferrer">
          {content}
        </a>
      );
    }

    return <React.Fragment key={index}>{content}</React.Fragment>;
  });
}

export default async function WorkPage({params}: WorkPageProps) {
  const {slug} = await params;
  const work = await getWorkBySlug(slug);

  if (!work) {
    notFound();
  }

  const content = await getWorkContent(work.id);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>{work.name}</h1>
          <p className={styles.subtitle}>
            <span className={styles.category}>{work.category}</span>
            {work.activity_period && (
              <span className={styles.activityPeriod}>
                {work.activity_period}
              </span>
            )}
          </p>
        </div>

        {work.thumbnail && (
          <div className={styles.imageWrapper}>
            <Image
              src={work.thumbnail}
              alt={work.name}
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
