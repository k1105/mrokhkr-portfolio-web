"use client";

import {useRef, useState, useEffect, type ReactNode} from "react";
import styles from "./page.module.css";

export default function FadeText({children}: {children: ReactNode}) {
  const ref = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // 兄弟の imageWrapper 内の img 要素を取得
    const img = el.previousElementSibling?.querySelector("img");

    const check = () => {
      // 画像の描画幅をテキストコンテナの幅として設定
      if (img && img.clientWidth > 0) {
        el.style.width = `${img.clientWidth}px`;
      }
      setOverflowing(el.scrollWidth > el.clientWidth);
    };

    check();

    const observer = new ResizeObserver(check);
    if (img) observer.observe(img);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${styles.textContent} ${overflowing ? styles.textFade : ""}`}
    >
      {children}
    </div>
  );
}
