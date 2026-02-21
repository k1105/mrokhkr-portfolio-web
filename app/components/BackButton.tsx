"use client";

import Image from "next/image";
import Link from "next/link";
import {usePathname} from "next/navigation";
import styles from "./BackButton.module.css";

export default function BackButton() {
  const pathname = usePathname();

  // ホームページでは表示しない
  if (pathname === "/") {
    return null;
  }

  // 一つ上の階層のパスを計算
  const segments = pathname.split("/").filter(Boolean);
  const parentPath = segments.length <= 1 ? "/" : "/" + segments.slice(0, -1).join("/");

  return (
    <Link href={parentPath} className={styles.backButton}>
      <Image
        src="/pinchout_icon.svg"
        alt="上の階層へ戻る"
        width={48}
        height={48}
        className={styles.icon}
      />
    </Link>
  );
}
