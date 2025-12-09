"use client";

import Image from "next/image";
import Link from "next/link";
import HeaderImage from "../components/HeaderImage";
import styles from "./page.module.css";

export default function WorksPage() {
  return (
    <div className={styles.container}>
      <HeaderImage src="/header/header_works.svg" alt="Works Header" />
      <div className={styles.content}>
        <section className={styles.section}>
          <div className={styles.imageGrid}>
            <Link
              href="/works/visualizing-the-covid-19-pandemic"
              className={styles.imageItem}
            >
              <div className={styles.imageWrapper}>
                <Image
                  src="/works/works_thumbnail_0.png"
                  alt="Visualizing the COVID-19 pandemic"
                  width={1200}
                  height={800}
                  className={styles.image}
                />
              </div>
              <div className={styles.textContent}>
                <p>XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX</p>
              </div>
            </Link>
            <Link
              href="/works/visualizing-the-covid-19-pandemic"
              className={styles.imageItem}
            >
              <div className={styles.imageWrapper}>
                <Image
                  src="/works/works_thumbnail_1.png"
                  alt="Works"
                  width={1200}
                  height={800}
                  className={styles.image}
                />
              </div>
              <div className={styles.textContent}>
                <p>XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX</p>
              </div>
            </Link>
            <Link
              href="/works/visualizing-the-covid-19-pandemic"
              className={styles.imageItem}
            >
              <div className={styles.imageWrapper}>
                <Image
                  src="/works/works_thumbnail_2.png"
                  alt="Works"
                  width={1200}
                  height={800}
                  className={styles.image}
                />
              </div>
              <div className={styles.textContent}>
                <p>XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX</p>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
