import type {Metadata} from "next";
import {Inter, Zen_Kaku_Gothic_New} from "next/font/google";
import Image from "next/image";
import {Suspense} from "react";
import "./globals.css";
import styles from "./layout.module.css";
import CircleBackground from "./components/CircleBackground";
import type {ContentThumbnail} from "./components/CircleBackground";
import BackButton from "./components/BackButton";
import Footer from "./components/Footer";
import GridOverlay from "./components/GridOverlay";
import PageTransitionOverlay from "./components/PageTransitionOverlay";
import SmoothScroll from "./components/SmoothScroll";
import Link from "next/link";
import {getWorks, getDiaries} from "../lib/notion";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const zenKakuGothicNew = Zen_Kaku_Gothic_New({
  variable: "--font-zen-kaku",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

import type {Viewport} from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://hikarumuraoka.com"),
  title: "Design Project of Hikaru Muraoka",
  description: "村岡光のデザインプロジェクト",
  openGraph: {
    title: "Design Project of Hikaru Muraoka",
    description: "村岡光のデザインプロジェクト",
    images: ["/ogp.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Design Project of Hikaru Muraoka",
    description: "村岡光のデザインプロジェクト",
    images: ["/ogp.png"],
  },
};

export const viewport: Viewport = {
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // ビルド時にworks・diaryを取得し、サムネイル付きのものから12件ランダムピック
  const [works, diaries] = await Promise.all([getWorks(), getDiaries()]);

  // サムネイル付きのコンテンツを統合（slugで重複排除）
  const contentItems: ContentThumbnail[] = [];
  const seen = new Set<string>();
  for (const w of works) {
    if (w.thumbnail && !seen.has(w.slug)) {
      seen.add(w.slug);
      contentItems.push({href: `/works/${w.slug}`, thumbnail: w.thumbnail});
    }
  }
  for (const d of diaries) {
    if (d.thumbnail && !seen.has(d.slug)) {
      seen.add(d.slug);
      contentItems.push({href: `/diary/${d.slug}`, thumbnail: d.thumbnail});
    }
  }

  // Fisher-Yatesシャッフル
  for (let i = contentItems.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [contentItems[i], contentItems[j]] = [contentItems[j], contentItems[i]];
  }
  const contentThumbnails = contentItems.slice(0, 12);

  return (
    <html lang="ja">
      <body
        className={`${inter.variable} ${zenKakuGothicNew.variable}`}
        suppressHydrationWarning
      >
        {/* 左上: title_en.svg */}
        <Link href="/" className={styles.headerTopLeft}>
          <Image
            src="/title_en.svg"
            alt="Title English"
            width={200}
            height={50}
            priority
          />
        </Link>

        {/* 右上: title.svg */}
        <Link href="/" className={styles.headerTopRight}>
          <Image
            src="/title.svg"
            alt="Title"
            width={20}
            height={300}
            priority
          />
        </Link>

        {/* 円の背景 */}
        <CircleBackground contentThumbnails={contentThumbnails} />
        <PageTransitionOverlay />
        <SmoothScroll />

        {/* 左下: 上の階層へ戻るボタン */}
        <BackButton />

        {children}
        <Footer />
        <Suspense fallback={null}>
          <GridOverlay />
        </Suspense>
      </body>
    </html>
  );
}
