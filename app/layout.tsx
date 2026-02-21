import type {Metadata} from "next";
import {Inter, Zen_Kaku_Gothic_New} from "next/font/google";
import Image from "next/image";
import "./globals.css";
import styles from "./layout.module.css";
import CircleBackground from "./components/CircleBackground";
import BackButton from "./components/BackButton";
import Link from "next/link";

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
  title: "村岡 光 - Portfolio",
  description: "村岡 光のポートフォリオサイト",
};

export const viewport: Viewport = {
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
            width={50}
            height={200}
            priority
          />
        </Link>

        {/* 円の背景 */}
        <CircleBackground />

        {/* 左下: 上の階層へ戻るボタン */}
        <BackButton />

        {children}
      </body>
    </html>
  );
}
