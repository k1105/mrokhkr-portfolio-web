"use client";

import Image from "next/image";
import HeaderImage from "../../components/HeaderImage";
import styles from "./page.module.css";

export default function VisualizingCovid19Page() {
  return (
    <div className={styles.container}>
      <HeaderImage src="/header/header_works.svg" alt="Works Header" />
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>Visualizing the COVID-19 pandemic</h1>
          <p className={styles.subtitle}>Diagram / 2022.2.12</p>
        </div>
        
        <div className={styles.imageWrapper}>
          <Image
            src="/works/works_thumbnail_0.png"
            alt="Visualizing the COVID-19 pandemic"
            width={1200}
            height={800}
            className={styles.mainImage}
            priority
          />
        </div>

        <div className={styles.textContent}>
          <p>
            XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
          </p>
          <p>
            XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
          </p>
          <p>
            XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
          </p>
          <p>
            XXXXXXXXXXXXXXXXXXXX
          </p>
        </div>
      </div>
    </div>
  );
}

