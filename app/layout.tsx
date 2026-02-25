import type {Metadata} from "next";
import {Inter, Zen_Kaku_Gothic_New} from "next/font/google";
import Image from "next/image";
import {Suspense} from "react";
import "./globals.css";
import styles from "./layout.module.css";
import CircleBackground from "./components/CircleBackground";
import type {WorkThumbnail} from "./components/CircleBackground";
import BackButton from "./components/BackButton";
import Footer from "./components/Footer";
import GridOverlay from "./components/GridOverlay";
import Link from "next/link";
import {getWorks} from "../lib/notion";

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
  title: "Design Project of Muraoka Hikaru",
  description: "村岡 光のポートフォリオサイト",
};

export const viewport: Viewport = {
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // ビルド時にworksを取得し、サムネイル付きのものから8件ランダムピック
  const works = await getWorks();
  const worksWithThumbnails = works.filter((w) => w.thumbnail);
  const shuffled = [...worksWithThumbnails].sort(() => Math.random() - 0.5);
  const workThumbnails: WorkThumbnail[] = shuffled.slice(0, 8).map((w) => ({
    slug: w.slug,
    thumbnail: w.thumbnail!,
  }));

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
        <CircleBackground workThumbnails={workThumbnails} />

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
