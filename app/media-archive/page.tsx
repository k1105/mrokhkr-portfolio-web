"use client";

import Image from "next/image";
import HeaderImage from "../components/HeaderImage";
import styles from "./page.module.css";

export default function MediaArchivePage() {
  return (
    <div className={styles.container}>
      <HeaderImage
        src="/header/header_media_archive.svg"
        alt="Media Archive Header"
      />
      <div className={styles.content}>
        <section className={styles.section}>
          <div className={styles.imageGrid}>
            <div className={styles.imageItem}>
              <div className={styles.imageWrapper}>
                <Image
                  src="/event/event_thumbnail_0.png"
                  alt="「調整」のデザイン"
                  width={400}
                  height={600}
                  className={styles.image}
                />
              </div>
              <div className={styles.textContent}>
                <p>
                  「調整」のデザインー&ldquo;いろんな人がいる&rdquo;
                  をちからに変える コミュニケーション・メソッド
                </p>
              </div>
            </div>
            <div className={styles.imageItem}>
              <div className={styles.imageWrapper}>
                <Image
                  src="/event/event_thumbnail_1.png"
                  alt="「調整」のデザイン"
                  width={400}
                  height={600}
                  className={styles.image}
                />
              </div>
              <div className={styles.textContent}>
                <p>
                  「調整」のデザインー&ldquo;いろんな人がいる&rdquo;
                  をちからに変える コミュニケーション・メソッド
                </p>
              </div>
            </div>
            <div className={styles.imageItem}>
              <div className={styles.imageWrapper}>
                <Image
                  src="/event/event_thumbnail_2.png"
                  alt="「調整」のデザイン"
                  width={400}
                  height={600}
                  className={styles.image}
                />
              </div>
              <div className={styles.textContent}>
                <p>
                  「調整」のデザインー&ldquo;いろんな人がいる&rdquo;
                  をちからに変える コミュニケーション・メソッド
                </p>
              </div>
            </div>
            <div className={styles.imageItem}>
              <div className={styles.imageWrapper}>
                <Image
                  src="/event/event_thumbnail_3.png"
                  alt="東芝のデザイン DESIGNER"
                  width={800}
                  height={500}
                  className={styles.image}
                />
              </div>
              <div className={styles.textContent}>
                <p>東芝のデザイン DESIGNER | デザイナーの声</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
