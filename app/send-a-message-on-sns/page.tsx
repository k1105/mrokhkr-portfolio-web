"use client";

import { useEffect, useRef, useCallback } from "react";
import Script from "next/script";
import HeaderImage from "../components/HeaderImage";
import styles from "./page.module.css";

// TypeScriptの型定義
declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (element?: HTMLElement) => void;
      };
    };
  }
}

export default function SendAMessageOnSNSPage() {
  const twitterTimelineRef = useRef<HTMLDivElement>(null);

  // Twitterウィジェットをロードする関数
  const loadTwitterWidget = useCallback(() => {
    if (window.twttr?.widgets && twitterTimelineRef.current) {
      // 特定の要素内だけをスキャンして描画させる（パフォーマンスとバグ防止のため）
      window.twttr.widgets.load(twitterTimelineRef.current);
    }
  }, []);

  useEffect(() => {
    // コンポーネントがマウントされた時（ページ遷移で戻ってきた時など）に実行
    // スクリプトが既にロード済みの場合に対応
    loadTwitterWidget();
  }, [loadTwitterWidget]);

  return (
    <div className={styles.container}>
      {/* Twitterのスクリプト読み込み */}
      <Script
        src="https://platform.twitter.com/widgets.js"
        strategy="lazyOnload"
        onLoad={() => {
          // スクリプトのロード完了時に実行
          loadTwitterWidget();
        }}
      />

      <HeaderImage
        src="/header/header_about.svg"
        alt="Send a message on SNS Header"
      />

      <div className={styles.content}>
        <div className={styles.snsContainer}>
          {/* Instagram Section */}
          <section className={styles.snsSection}>
            <h2 className={styles.sectionTitle}>Instagram</h2>
            <div className={styles.instagramContainer}>
              {/* 注: Instagramの「投稿一覧」を埋め込む公式ウィジェットは廃止されました。
                一覧を表示したい場合は、SnapWidgetなどの外部サービスを利用し、
                ここにiframeタグを配置するのが一般的です。
                現在はプロフィールへのリッチなリンクとして実装しています。
              */}
              <a
                href="https://www.instagram.com/murahikaokaru/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.instagramLink}
              >
                <div className={styles.instagramIconPlaceholder}>
                  {/* アイコン画像などがあればここに配置 */}
                  📸
                </div>
                <div>
                  <span className={styles.instagramHandle}>@murahikaokaru</span>
                  <p className={styles.instagramDescription}>
                    Instagramで最新の作品や日常のデザイン活動を共有しています。
                    <span className={styles.instagramText}>フォローする</span>
                  </p>
                </div>
              </a>
            </div>
          </section>

          {/* Twitter (X) Section */}
          <section className={styles.snsSection}>
            <h2 className={styles.sectionTitle}>X (Twitter)</h2>
            {/* refをここに付与して、この中だけをtwttr.widgets.loadの対象にする */}
            <div className={styles.twitterContainer} ref={twitterTimelineRef}>
              <a
                className="twitter-timeline"
                data-height="600"
                data-theme="light"
                href="https://twitter.com/mrhkokr?ref_src=twsrc%5Etfw"
              >
                Tweets by @mrhkokr
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}