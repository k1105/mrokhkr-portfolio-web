import Image from "next/image";
import styles from "../media-archive/page.module.css";
import Link from "next/link";
import {getDiaries} from "@/lib/notion";

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${year}.${month}.${day}`;
}

export default async function DiaryPage() {
  const diaries = await getDiaries();

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <section className={styles.section}>
          <div className={styles.imageGrid}>
            {diaries.length === 0 && <p>現在、日記はありません。</p>}
            {diaries.map((diary) => (
              <Link
                key={diary.id}
                href={`/diary/${diary.slug}`}
                className={styles.imageItem}
              >
                <div className={styles.imageWrapper}>
                  {diary.thumbnail ? (
                    <Image
                      src={diary.thumbnail}
                      alt={diary.title}
                      width={400}
                      height={600}
                      className={styles.image}
                    />
                  ) : (
                    <div className={styles.image} />
                  )}
                </div>
                <div className={styles.textContent}>
                  <p>{diary.title}</p>
                  {diary.date && (
                    <p className={styles.date}>{formatDate(diary.date)}</p>
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
