"use client";

import {useState, useEffect, useRef} from "react";
import {usePathname} from "next/navigation";
import Link from "next/link";
import styles from "./HamburgerMenu.module.css";

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const pathname = usePathname();
  const prevPathnameRef = useRef(pathname);

  // ページ遷移時にメニューを閉じる
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      if (isOpen) {
        // 0.5s遅延してからフェードアウトを開始
        const delayTimer = setTimeout(() => {
          setIsClosing(true);
          setIsOpen(false);
          setTimeout(() => {
            setIsClosing(false);
          }, 300);
        }, 200);
        return () => {
          clearTimeout(delayTimer);
        };
      }
    }
  }, [pathname, isOpen]);

  const toggleMenu = () => {
    if (isOpen) {
      setIsClosing(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsClosing(false);
      }, 300); // アニメーション時間と合わせる
    } else {
      setIsOpen(true);
    }
  };

  const closeMenu = () => {
    if (isOpen) {
      // 0.5s遅延してからフェードアウトを開始
      setTimeout(() => {
        setIsClosing(true);
        setTimeout(() => {
          setIsOpen(false);
          setIsClosing(false);
        }, 300);
      }, 500);
    }
  };

  const menuItems = [
    {text: "トップページ", href: "/"},
    {text: "村岡光ってどんな人?", href: "/about"},
    {text: "つくっているもの・こと", href: "/works"},
    {text: "考えていること", href: "/media-archive"},
    {text: "仕事をたのんでみる", href: "/request-a-job"},
  ];

  return (
    <>
      {/* ハンバーガーメニューボタン */}
      <div className={styles.headerBottomLeft} onClick={toggleMenu}>
        <div className={styles.hamburgerMenu}>
          <div className={styles.hamburgerLine} />
          <div className={styles.hamburgerLine} />
          <div className={styles.hamburgerLine} />
        </div>
      </div>

      {/* メニューオーバーレイ */}
      {(isOpen || isClosing) && (
        <div
          className={`${styles.menuOverlay} ${isClosing ? styles.closing : ""}`}
          onClick={toggleMenu}
        >
          <div
            className={styles.menuContent}
            onClick={(e) => e.stopPropagation()}
          >
            {menuItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={styles.menuItem}
                onClick={closeMenu}
              >
                {item.text}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
