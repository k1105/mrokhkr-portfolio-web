"use client";

import Image from "next/image";
import HeaderImage from "../components/HeaderImage";
import styles from "./page.module.css";

export default function About() {
  return (
    <div className={styles.container}>
      <HeaderImage src="/header/header_about.svg" alt="About Header" />
      <div className={styles.content}>
        <div className={styles.profileImageWrapper}>
          <Image
            src="/profile.png"
            alt="村岡光"
            width={300}
            height={300}
            className={styles.profileImage}
            priority
          />
        </div>
        <div className={styles.profileInfo}>
          <h1 className={styles.name}>
            村岡光 <span className={styles.nameEn}>Muraoka Hikaru</span>
          </h1>
          <p className={styles.profession}>
            グラフィックデザイナー/ワークショップデザイナー
          </p>

          <div className={styles.description}>
            <p>
              会社員としてのデザイナーとして働きながら、フリーランスやNPO（一般社団法人）での個人活動も行っています。
            </p>
            <p>
              最近は、他者との関係性や対話、場づくりに関心があり、視覚表現や体験設計、言葉の編集など、これまでのデザインの実践を手がかりに探究しています。
            </p>
          </div>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>略歴 Biography</h2>
            <ul className={styles.list}>
              <li>1999年 宮城県うまれ</li>
              <li>2022年 東北芸術工科大学グラフィックデザイン学科 卒業</li>
              <li>2022年~ 株式会社東芝 DX・デザイン & コミュニケーション部</li>
              <li>2024年~ 一般社団法人 NO YOUTH NO JAPAN デザインチーム</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>受賞歴 Awards</h2>
            <ul className={styles.list}>
              <li>2020年 Adobe CCJ UIUX デザインコンペ 最優秀賞</li>
              <li>2020年 総務省統計局 統計グラフコンクール入選</li>
              <li>
                2022年 東北芸術工科大学グラフィックデザイン学科 卒業制作展 最優秀賞
              </li>
              <li>2022年 CHINA NEW ONE AWARD ファイナリスト</li>
              <li>2022年 GOOD DESIGN NEW HOPE AWARD 入賞</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
