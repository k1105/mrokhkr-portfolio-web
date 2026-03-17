import Image from "next/image";
import React from "react";
import {getAboutContent, NotionRichTextContent} from "../../lib/notion";
import styles from "./page.module.css";

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
        <a key={index} href={href} target="_blank" rel="noopener noreferrer">
          {content}
        </a>
      );
    }

    return <React.Fragment key={index}>{content}</React.Fragment>;
  });
}

export default async function About() {
  const content = await getAboutContent();

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.profileImageWrapper}>
          <Image
            src="/profile.jpg"
            alt="村岡光"
            width={300}
            height={300}
            className={styles.profileImage}
            priority
          />
        </div>
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
              return (
                <p className="global-text-md" key={index}>
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
                    <p className="global-text-sm">{block.caption}</p>
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
                      <p className="global-text-sm">{block.caption}</p>
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
  );
}
