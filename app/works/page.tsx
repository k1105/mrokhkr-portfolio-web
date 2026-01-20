import Image from "next/image";
import Link from "next/link";
import { getWorks } from "../../lib/notion";
import styles from "./page.module.css";

export default async function WorksPage() {
  const works = await getWorks();

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <section className={styles.section}>
          <div className={styles.imageGrid}>
            {works.map((work) => (
              <Link
                key={work.id}
                href={`/works/${work.slug}`}
                className={styles.imageItem}
              >
                <div className={styles.imageWrapper}>
                  {work.thumbnail ? (
                    <Image
                      src={work.thumbnail}
                      alt={work.name}
                      width={1200}
                      height={800}
                      className={styles.image}
                    />
                  ) : (
                    <div className={styles.imagePlaceholder}>
                      No Image
                    </div>
                  )}
                </div>
                <div className={styles.textContent}>
                  <p>{work.name}</p>
                  {work.activity_period && (
                    <p>{work.activity_period}</p>
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
