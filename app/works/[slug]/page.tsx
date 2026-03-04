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

interface CategoryInfo {
  param: string;
  display: string;
  search: string;
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
  const CATEGORIES: CategoryInfo[] = [
    {
      param: "visual-communication",
      display: "伝えるものをつくる・Visual Communication",
      search: "伝えるものをつくる",
    },
    {
      param: "workshops-facilitation",
      display: "関わりあう場をつくる・Workshop & Fieldwork",
      search: "関わりあう場をつくる",
    },
    {
      param: "books-editorial",
      display: "読みものをつくる・Publishing",
      search: "読みものをつくる",
    },
    {
      param: "study-research",
      display: "試して、研究する・Study & Research",
      search: "試して、研究する",
    },
  ];

  if (!work) {
    notFound();
  }

  const content = await getWorkContent(work.id);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={`${styles.title} global-text-lg`}>{work.name}</h1>
          <p className={`${styles.subtitle} global-text-sm`}>
            <span className={styles.category}>
              {
                CATEGORIES.find((category) => category.search === work.category)
                  ?.display
              }
            </span>
            {work.activity_period && (
              <span className={styles.activityPeriod}>
                {work.activity_period}
              </span>
            )}
          </p>
        </div>

        <div className={styles.contentWrapper}>
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
                return (
                  <p className={`global-text-md`} key={index}>
                    {renderRichText(block.rich_text)}
                  </p>
                );
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
                      <p className={`global-text-sm`}>{block.caption}</p>
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
    </div>
  );
}
