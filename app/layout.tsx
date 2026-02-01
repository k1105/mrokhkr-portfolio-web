import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import Image from "next/image";
import "./globals.css";
import styles from "./layout.module.css";
import CircleBackground from "./components/CircleBackground";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "村岡 光 - Portfolio",
  description: "村岡 光のポートフォリオサイト",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable}`}
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

        {children}
      </body>
    </html>
  );
}
