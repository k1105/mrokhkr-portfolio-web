import Image from "next/image";
import styles from "./page.module.css";
import Link from "next/link";
import {getMediaArchives} from "@/lib/notion";

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${year}.${month}.${day}`;
}

export default async function MediaArchivePage() {
  const archives = await getMediaArchives();

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <section className={styles.section}>
          <div className={styles.imageGrid}>
            {archives.length === 0 && <p>現在、メディア掲載情報はありません。</p>}
            {archives.map((archive) => (
              <Link
                key={archive.id}
                href={archive.url ?? "#"}
                target={archive.url ? "_blank" : undefined}
                rel={archive.url ? "noopener noreferrer" : undefined}
                className={styles.imageItem}
              >
                <div className={styles.imageWrapper}>
                  {archive.thumbnail ? (
                    <Image
                      src={archive.thumbnail}
                      alt={archive.title}
                      fill
                      className={styles.image}
                    />
                  ) : (
                    <div className={styles.image} />
                  )}
                </div>
                <div className={styles.textContent}>
                  <p>{archive.title}</p>
                  {archive.date && (
                    <p className={styles.date}>{formatDate(archive.date)}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
