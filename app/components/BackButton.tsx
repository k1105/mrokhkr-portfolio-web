"use client";

import {usePathname} from "next/navigation";
import styles from "./BackButton.module.css";

const getIconBackgroundColor = (pathname: string): string => {
  const purplePages = ["/diary", "/request-a-job"];
  if (purplePages.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return "var(--purple-background)";
  }
  return "var(--yellow-background)";
};

export default function BackButton() {
  const pathname = usePathname();

  // ホームページでは表示しない
  if (pathname === "/") {
    return null;
  }

  // 一つ上の階層のパスを計算
  const segments = pathname.split("/").filter(Boolean);
  const parentPath = segments.length <= 1 ? "/" : "/" + segments.slice(0, -1).join("/");

  const bgColor = getIconBackgroundColor(pathname);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.dispatchEvent(
      new CustomEvent("page-transition-back", {
        detail: {href: parentPath, bgColor},
      }),
    );
  };

  return (
    <a href={parentPath} className={styles.backButton} aria-label="上の階層へ戻る" onClick={handleClick}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 112.5 112.5"
        className={styles.icon}
      >
        <circle cx="56.25" cy="56.25" r="56.25" fill={bgColor} />
        <g fill="none" stroke="#500a28" strokeLinejoin="round">
          <polyline points="31.94 58.67 53.55 58.67 26.52 85.7" />
          <line x1="53.55" y1="80.29" x2="53.55" y2="58.67" />
          <line x1="80.01" y1="53.83" x2="58.39" y2="53.83" />
          <polyline points="58.39 32.21 58.39 53.83 85.43 26.8" />
        </g>
      </svg>
    </a>
  );
}
