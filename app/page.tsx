"use client";

import Image from "next/image";
import Link from "next/link";
import {useEffect, useState, useRef} from "react";
import styles from "./page.module.css";

interface Circle {
  x: number;
  y: number;
  r: number;
  type: "large" | "small";
  isSpecial: boolean;
  imageIndex?: number; // 青い円用の画像インデックス
  imagePath?: string; // 赤い円用の画像パス
  initialRotation?: number; // 初期回転角度（度）
  rotationDirection?: "clockwise" | "counterclockwise"; // 回転方向
}

const MARGIN = 20;
const NUM_LARGE = 5;
const NUM_SMALL_NORMAL = 8;
const NUM_SMALL_SPECIAL = 2;
const SIZE_RATIO = 0.7;

// 赤い円用の画像パスと遷移先のマッピング
const RED_CIRCLE_IMAGES = [
  "/nav/nav_about.svg",
  "/nav/nav_contact.svg",
  "/nav/nav_media_archive.svg",
  "/nav/nav_request_a_job.svg",
  "/nav/nav_works.svg",
];

// 画像パスに対応する遷移先
const IMAGE_TO_HREF: Record<string, string> = {
  "/nav/nav_about.svg": "/about",
  "/nav/nav_contact.svg": "/",
  "/nav/nav_media_archive.svg": "/media-archive",
  "/nav/nav_request_a_job.svg": "/request-a-job",
  "/nav/nav_works.svg": "/works",
};

export default function Home() {
  const [circles, setCircles] = useState<Circle[]>([]);
  const [mounted, setMounted] = useState(false);
  const [circleScales, setCircleScales] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const packStep = (circles: Circle[], width: number, height: number) => {
      const aspectRatio = width / height;

      // 1. 「最も下にある赤い円」を見つける
      let lowestRed: Circle | null = null;
      let maxY = -Infinity;

      for (const c of circles) {
        if (c.type === "large") {
          if (c.y > maxY) {
            maxY = c.y;
            lowestRed = c;
          }
        }
      }

      // 2. 物理計算ループ
      for (let i = 0; i < circles.length; i++) {
        const c1 = circles[i];

        if (c1.isSpecial) {
          // --- 特殊な円（緑）の挙動 ---
          if (lowestRed) {
            // A. アンカー引力：一番下の赤円に向かって強く引き寄せる
            const dx = lowestRed.x - c1.x;
            const dy = lowestRed.y - c1.y;

            // 常に少し下方向(y+)へ力を加え、赤円の「底」へ誘導する
            c1.x += dx * 0.05; // X方向は素直に寄る
            c1.y += dy * 0.05 + 0.5; // Y方向は寄りつつ、常に「下へ落ちる力」を加える
          }
        } else {
          // --- 通常の円（赤・青）の挙動 ---
          // 画面アスペクト比に応じた重力
          const baseGravity = 0.005;
          const gravityX = baseGravity / aspectRatio;
          const gravityY = baseGravity * aspectRatio;

          // 赤と青は少し上(-20)を目指して集まる
          c1.x -= c1.x * gravityX;
          c1.y -= (c1.y - -20) * gravityY;
        }

        // --- 3. 衝突解決（ここが配置の要） ---
        for (let j = 0; j < circles.length; j++) {
          if (i === j) continue;
          const c2 = circles[j];

          const dx = c1.x - c2.x;
          const dy = c1.y - c2.y;
          const d = Math.sqrt(dx * dx + dy * dy);

          // バリア距離の計算
          let gap = 0;

          // 緑(Special) と 青(Small Normal) は非常に仲が悪い（大きなバリア）
          // これにより緑は青の集団に入り込めず、赤の表面に押し出される
          if (
            (c1.isSpecial && c2.type === "small" && !c2.isSpecial) ||
            (c2.isSpecial && c1.type === "small" && !c1.isSpecial)
          ) {
            gap = c1.r * 3.0;
          }

          const minDist = c1.r + c2.r + gap;

          if (d < minDist && d > 0) {
            const overlap = minDist - d;
            const force = overlap / 2; // 反発力

            const nx = dx / d;
            const ny = dy / d;

            c1.x += nx * force;
            c1.y += ny * force;
          }
        }
      }
    };

    const fitToScreen = (circles: Circle[], width: number, height: number) => {
      let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;
      for (const c of circles) {
        minX = Math.min(minX, c.x - c.r);
        maxX = Math.max(maxX, c.x + c.r);
        minY = Math.min(minY, c.y - c.r);
        maxY = Math.max(maxY, c.y + c.r);
      }

      const clusterW = maxX - minX;
      const clusterH = maxY - minY;
      const targetW = width - MARGIN * 2;
      const targetH = height - MARGIN * 2;

      const finalScale = Math.min(targetW / clusterW, targetH / clusterH);
      const clusterCenterX = (minX + maxX) / 2;
      const clusterCenterY = (minY + maxY) / 2;

      for (const c of circles) {
        const relX = (c.x - clusterCenterX) * finalScale;
        const relY = (c.y - clusterCenterY) * finalScale;
        c.x = width / 2 + relX;
        c.y = height / 2 + relY;
        c.r *= finalScale;
      }
    };

    const generatePackedCircles = (width: number, height: number) => {
      const circles: Circle[] = [];
      const baseR = 10;

      // 1. 大きい円 (赤)
      for (let i = 0; i < NUM_LARGE; i++) {
        circles.push({
          x: (Math.random() - 0.5) * 2,
          y: (Math.random() - 0.5) * 2,
          r: baseR,
          type: "large",
          isSpecial: false,
          imagePath: RED_CIRCLE_IMAGES[i],
        });
      }

      // 2. 普通の小さい円 (青)
      for (let i = 0; i < NUM_SMALL_NORMAL; i++) {
        circles.push({
          x: (Math.random() - 0.5) * 2,
          y: (Math.random() - 0.5) * 2,
          r: baseR * SIZE_RATIO,
          type: "small",
          isSpecial: false,
          imageIndex: i,
        });
      }

      // 3. 特殊な小さい円 (緑) - 最初は遠くに置いておく
      for (let i = 0; i < NUM_SMALL_SPECIAL; i++) {
        circles.push({
          x: (Math.random() - 0.5) * 2,
          y: 100,
          r: baseR * SIZE_RATIO,
          type: "small",
          isSpecial: true,
        });
      }

      // 物理演算
      const iterations = 3000;
      for (let i = 0; i < iterations; i++) {
        packStep(circles, width, height);
      }

      fitToScreen(circles, width, height);

      // 各円にランダムな初期回転角度と回転方向を割り当て
      for (const circle of circles) {
        circle.initialRotation = Math.random() * 360;
        circle.rotationDirection =
          Math.random() < 0.5 ? "clockwise" : "counterclockwise";
      }

      return circles;
    };

    const updateCircles = () => {
      if (!containerRef.current) return;

      const width = window.innerWidth;
      const height = window.innerHeight;
      const newCircles = generatePackedCircles(width, height);
      setCircles(newCircles);
      setCircleScales(new Array(newCircles.length).fill(0));
      setMounted(true);
      startTimeRef.current = null;
    };

    updateCircles();
    window.addEventListener("resize", updateCircles);

    return () => {
      window.removeEventListener("resize", updateCircles);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // アニメーションループ
  useEffect(() => {
    if (!mounted || circles.length === 0) return;

    // Bouncyアニメーションのイージング関数
    const easeOutBounce = (t: number): number => {
      if (t < 1 / 2.75) {
        return 7.5625 * t * t;
      } else if (t < 2 / 2.75) {
        return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
      } else if (t < 2.5 / 2.75) {
        return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
      } else {
        return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
      }
    };

    // Bouncyアニメーション（0→1.1→1.0）
    const bouncyScale = (t: number): number => {
      if (t < 0.7) {
        // 0→1.1まで
        const normalizedT = t / 0.7;
        return normalizedT * 1.1;
      } else {
        // 1.1→1.0まで
        const normalizedT = (t - 0.7) / 0.3;
        const eased = easeOutBounce(normalizedT);
        return 1.1 - eased * 0.1;
      }
    };

    const animate = (currentTime: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = currentTime;
      }

      const elapsed = (currentTime - startTimeRef.current) / 1000; // 秒単位
      const duration = 0.8; // アニメーション時間（秒）
      const delayPerCircle = 0.05; // 各円の遅延（秒）

      // 左上から順にソートしたインデックス配列を作成
      const sortedIndices = circles
        .map((circle, index) => ({circle, index}))
        .sort((a, b) => {
          if (Math.abs(a.circle.y - b.circle.y) > 1) {
            return a.circle.y - b.circle.y;
          }
          return a.circle.x - b.circle.x;
        })
        .map((item) => item.index);

      const newScales = circles.map((_, index) => {
        const delayIndex = sortedIndices.indexOf(index);
        const delay = delayIndex * delayPerCircle;
        const t = Math.max(0, Math.min(1, (elapsed - delay) / duration));

        if (t <= 0) return 0;
        if (t >= 1) return 1.0;
        return bouncyScale(t);
      });

      setCircleScales(newScales);

      // すべてのアニメーションが完了していない場合は続行
      if (newScales.some((scale) => scale < 1.0)) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mounted, circles]);

  if (!mounted) {
    return (
      <div
        ref={containerRef}
        className={styles.container}
        suppressHydrationWarning
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={styles.container}
      suppressHydrationWarning
    >
      {circles.map((circle, index) => {
        const size = circle.r * 2 * 0.95; // 0.95倍に縮小
        const initialRotation = circle.initialRotation || 0;
        const rotationDirection = circle.rotationDirection || "clockwise";
        const scale = circleScales[index] ?? 0;
        // 中心座標を保持しながらスケールを適用
        // circle.x, circle.yは円の中心座標なので、translate(-50%, -50%)で正確に配置
        const wrapperStyle: React.CSSProperties = {
          position: "absolute",
          left: `${circle.x}px`,
          top: `${circle.y}px`,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: "center center",
        };
        const rotationClass =
          rotationDirection === "clockwise"
            ? styles.circleMask
            : styles.circleMaskCounterClockwise;

        if (circle.isSpecial) {
          // 緑の円 → グレーの円
          return (
            <div key={`special-${index}`} style={wrapperStyle}>
              <div
                className={rotationClass}
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  borderRadius: "50%",
                  backgroundColor: "#888",
                  ["--initial-rotation" as string]: `${initialRotation}deg`,
                }}
              />
            </div>
          );
        } else if (circle.type === "large") {
          // 赤い円 → SVG画像（クリック可能）
          const href = circle.imagePath
            ? IMAGE_TO_HREF[circle.imagePath]
            : null;
          const circleContent = (
            <div
              className={rotationClass}
              style={{
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: "50%",
                overflow: "hidden",
                cursor: href ? "pointer" : "default",
                ["--initial-rotation" as string]: `${initialRotation}deg`,
              }}
            >
              <Image
                src={circle.imagePath || ""}
                alt=""
                width={size}
                height={size}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
          );

          if (href) {
            return (
              <div key={`large-${index}`} style={wrapperStyle}>
                <Link
                  href={href}
                  style={{
                    textDecoration: "none",
                    display: "block",
                  }}
                >
                  {circleContent}
                </Link>
              </div>
            );
          }

          return (
            <div key={`large-${index}`} style={wrapperStyle}>
              {circleContent}
            </div>
          );
        } else {
          // 青い円 → PNG画像（正円でクロップ）
          return (
            <div key={`small-${index}`} style={wrapperStyle}>
              <div
                className={rotationClass}
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  borderRadius: "50%",
                  overflow: "hidden",
                  ["--initial-rotation" as string]: `${initialRotation}deg`,
                }}
              >
                <Image
                  src={`/nav/nav_works_${circle.imageIndex}.png`}
                  alt=""
                  width={size}
                  height={size}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
            </div>
          );
        }
      })}
    </div>
  );
}
