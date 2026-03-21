"use client";

import {useRef, useState, useEffect, useCallback} from "react";
import styles from "./page.module.css";

interface HorizontalScrollCarouselProps {
  className?: string;
  children: React.ReactNode;
  [key: string]: unknown;
}

export default function HorizontalScrollCarousel({
  className,
  children,
  ...props
}: HorizontalScrollCarouselProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, {passive: true});
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  const scroll = (direction: "left" | "right") => {
    const el = ref.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <div className={styles.carouselContainer}>
      <div ref={ref} className={className} {...props}>
        {children}
      </div>
      <button
        className={`${styles.carouselButton} ${styles.carouselButtonLeft}`}
        onClick={() => scroll("left")}
        aria-label="前へ"
        style={{visibility: canScrollLeft ? "visible" : "hidden"}}
      >
        ‹
      </button>
      <button
        className={`${styles.carouselButton} ${styles.carouselButtonRight}`}
        onClick={() => scroll("right")}
        aria-label="次へ"
        style={{visibility: canScrollRight ? "visible" : "hidden"}}
      >
        ›
      </button>
    </div>
  );
}
