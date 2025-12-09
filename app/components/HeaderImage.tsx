"use client";

import Image from "next/image";
import styles from "./HeaderImage.module.css";

interface HeaderImageProps {
  src: string;
  alt?: string;
}

export default function HeaderImage({src, alt = "Header"}: HeaderImageProps) {
  return (
    <header className={styles.header}>
      <Image
        src={src}
        alt={alt}
        width={1444}
        height={1444}
        className={styles.headerImage}
        priority
      />
    </header>
  );
}
