"use client";

import Image from "next/image";
import {useEffect, useLayoutEffect, useState, useRef} from "react";
import {usePathname, useRouter} from "next/navigation";
import styles from "./CircleBackground.module.css";

export interface WorkThumbnail {
  slug: string;
  thumbnail: string;
}

interface Circle {
  x: number;
  y: number;
  r: number;
  type: "large" | "small";
  isSpecial: boolean;
  imageIndex?: number;
  imagePath?: string;
  workSlug?: string;
  initialRotation?: number;
  rotationDirection?: "clockwise" | "counterclockwise";
  // アニメーション用の個体差パラメータを追加
  animDelay?: number;
  animDuration?: number;
}

const MARGIN = 20;
const NUM_LARGE = 5;
const NUM_SMALL_NORMAL = 8;
const NUM_SMALL_SPECIAL = 2;
const SIZE_RATIO = 0.7;

const RED_CIRCLE_IMAGES = [
  "/nav/nav_about.svg",
  "/nav/nav_what_im_thinking.svg",
  "/nav/nav_media_archive.svg",
  "/nav/nav_request_a_job.svg",
  "/nav/nav_works.svg",
];

const IMAGE_TO_HREF: Record<string, string> = {
  "/nav/nav_about.svg": "/about",
  "/nav/nav_what_im_thinking.svg": "/diary",
  "/nav/nav_media_archive.svg": "/media-archive",
  "/nav/nav_request_a_job.svg": "/request-a-job",
  "/nav/nav_works.svg": "/works",
};

const HREF_TO_IMAGE: Record<string, string> = {
  "/about": "/nav/nav_about.svg",
  "/": "/nav/nav_what_im_thinking.svg",
  "/diary": "/nav/nav_what_im_thinking.svg",
  "/media-archive": "/nav/nav_media_archive.svg",
  "/request-a-job": "/nav/nav_request_a_job.svg",
  "/works": "/nav/nav_works.svg",
};

const SPECIAL_CIRCLE_IMAGES = [
  "/nav/nav_x.svg",
  "/nav/nav_instagram.svg",
];

const SPECIAL_EXTERNAL_LINKS: Record<string, string> = {
  "/nav/nav_x.svg": "https://x.com/mrhkokr",
  "/nav/nav_instagram.svg": "https://www.instagram.com/murahikaokaru/",
};

// 個別ページでも背景色を返すための関数
const getBackgroundColorForPath = (pathname: string): string | null => {
  if (pathname.startsWith("/works/")) {
    return "var(--yellow-background)";
  }
  if (pathname === "/diary" || pathname.startsWith("/diary/")) {
    return "var(--purple-background)";
  }
  return null;
};

const getBackgroundColor = (imagePath: string | undefined): string => {
  if (!imagePath) return "transparent";

  const yellowBackgrounds = [
    "/nav/nav_about.svg",
    "/nav/nav_media_archive.svg",
    "/nav/nav_works.svg",
  ];

  const pinkBackgrounds = [
    "/nav/nav_what_im_thinking.svg",
    "/nav/nav_request_a_job.svg",
  ];

  if (yellowBackgrounds.includes(imagePath)) {
    return "var(--yellow-background)";
  } else if (pinkBackgrounds.includes(imagePath)) {
    return "var(--purple-background)";
  }

  return "transparent";
};

interface CircleBackgroundProps {
  workThumbnails?: WorkThumbnail[];
}

export default function CircleBackground({ workThumbnails = [] }: CircleBackgroundProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [mounted, setMounted] = useState(false);
  const [circleScales, setCircleScales] = useState<number[]>([]);
  const [clickedNav, setClickedNav] = useState<number | null>(null);
  const [clipProgress, setClipProgress] = useState(0);
  const [gradientVisible, setGradientVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const navigatedViaCircleRef = useRef(false);
  const clipAnimationRef = useRef<number | null>(null);
  const circlesRef = useRef<Circle[]>([]);
  const isInitializedRef = useRef(false);
  const animationCompletedRef = useRef(false);

  // 現在のパスに基づいてactiveな円のインデックスを取得
  const getActiveCircleIndex = (): number | null => {
    const currentCircles = circlesRef.current;
    if (pathname === "/" || currentCircles.length === 0) return null;

    const imagePath = HREF_TO_IMAGE[pathname];
    if (!imagePath) return null;

    const index = currentCircles.findIndex((c) => c.imagePath === imagePath);
    return index !== -1 ? index : null;
  };

  const activeCircleIndex = getActiveCircleIndex();
  const isActive = activeCircleIndex !== null;

  // 円の生成（初期化）
  useEffect(() => {
    if (isInitializedRef.current) return;

    const packStep = (circles: Circle[], width: number, height: number) => {
      const aspectRatio = width / height;
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

      for (let i = 0; i < circles.length; i++) {
        const c1 = circles[i];

        if (c1.isSpecial) {
          if (lowestRed) {
            const dx = lowestRed.x - c1.x;
            const dy = lowestRed.y - c1.y;
            c1.x += dx * 0.05;
            c1.y += dy * 0.05 + 0.5;
          }
        } else {
          const baseGravity = 0.005;
          const gravityX = baseGravity / aspectRatio;
          const gravityY = baseGravity * aspectRatio;
          c1.x -= c1.x * gravityX;
          c1.y -= (c1.y - -20) * gravityY;
        }

        for (let j = 0; j < circles.length; j++) {
          if (i === j) continue;
          const c2 = circles[j];
          const dx = c1.x - c2.x;
          const dy = c1.y - c2.y;
          const d = Math.sqrt(dx * dx + dy * dy);

          let gap = 0;
          if (
            (c1.isSpecial && c2.type === "small" && !c2.isSpecial) ||
            (c2.isSpecial && c1.type === "small" && !c1.isSpecial)
          ) {
            gap = c1.r * 3.0;
          }

          const minDist = c1.r + c2.r + gap;
          if (d < minDist && d > 0) {
            const overlap = minDist - d;
            const force = overlap / 2;
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

      const thumbCount = Math.min(NUM_SMALL_NORMAL, workThumbnails.length);
      for (let i = 0; i < thumbCount; i++) {
        circles.push({
          x: (Math.random() - 0.5) * 2,
          y: (Math.random() - 0.5) * 2,
          r: baseR * SIZE_RATIO,
          type: "small",
          isSpecial: false,
          imageIndex: i,
          imagePath: workThumbnails[i].thumbnail,
          workSlug: workThumbnails[i].slug,
        });
      }

      for (let i = 0; i < NUM_SMALL_SPECIAL; i++) {
        circles.push({
          x: (Math.random() - 0.5) * 2,
          y: 100,
          r: baseR * SIZE_RATIO,
          type: "small",
          isSpecial: true,
          imagePath: SPECIAL_CIRCLE_IMAGES[i],
        });
      }

      const iterations = 3000;
      for (let i = 0; i < iterations; i++) {
        packStep(circles, width, height);
      }
      fitToScreen(circles, width, height);

      // ★修正: アニメーションの個体差（生命感）を事前に割り振る
      for (const circle of circles) {
        circle.initialRotation = Math.random() * 360;
        circle.rotationDirection =
          Math.random() < 0.5 ? "clockwise" : "counterclockwise";

        // 遅延: 0秒〜0.5秒の間で完全にランダム（ポコポコ感）
        circle.animDelay = Math.random() * 0.5;
        // 時間: 1.0秒〜1.4秒の間でばらつきを持たせる（個体差）
        circle.animDuration = 1.0 + Math.random() * 0.4;
      }

      return circles;
    };

    const updateCircles = () => {
      if (!containerRef.current) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const newCircles = generatePackedCircles(width, height);
      circlesRef.current = newCircles;
      setCircles(newCircles);

      const shouldSkipAnimation = pathname !== "/";

      if (animationCompletedRef.current || shouldSkipAnimation) {
        setCircleScales(new Array(newCircles.length).fill(1.0));
        animationCompletedRef.current = true;
      } else {
        setCircleScales(new Array(newCircles.length).fill(0));
      }

      setMounted(true);
      startTimeRef.current = null;
      isInitializedRef.current = true;
    };

    updateCircles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ★修正: 粘性と生命感のある登場アニメーション
  useEffect(() => {
    if (!mounted || circles.length === 0 || animationCompletedRef.current) {
      if (animationCompletedRef.current && circles.length > 0) {
        setCircleScales(new Array(circles.length).fill(1.0));
      }
      return;
    }

    // ★Easingの変更: Viscous Pop (粘性のあるポップ)
    // easeOutBackをベースに調整。
    // 細胞分裂のように「ググッと広がって、少し行き過ぎて(1.05)、ゆっくり戻る」動き。
    // 振動（Elastic）のような不安定さを排除。
    const viscousPop = (x: number): number => {
      const c1 = 1.2; // オーバーシュート量（小さいほど控えめな膨らみ）
      const c3 = c1 + 1;

      // tが1になる直前で膨らみ、最後に戻る
      return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
    };

    const animate = (currentTime: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = currentTime;
      }

      const elapsed = (currentTime - startTimeRef.current) / 1000;

      let allFinished = true;

      const newScales = circles.map((circle) => {
        // 事前に割り振ったランダムな遅延と時間を使用
        // これにより「波」ではなく「あちこちから湧き出る」動きになる
        const delay = circle.animDelay || 0;
        const duration = circle.animDuration || 1.2;

        // 時間の正規化
        const t = Math.max(0, Math.min(1, (elapsed - delay) / duration));

        if (t < 1) allFinished = false;
        if (t <= 0) return 0;
        if (t >= 1) return 1.0;

        return viscousPop(t);
      });

      setCircleScales(newScales);

      if (!allFinished) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setCircleScales(new Array(circles.length).fill(1.0));
        animationCompletedRef.current = true;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mounted, circles]);

  // パス変更監視
  useEffect(() => {
    if (isActive) {
      setClipProgress(1);
      if (clickedNav !== null) {
        setClickedNav(null);
      }
    } else if (pathname === "/") {
      if (clickedNav === null) {
        setClipProgress(0);
      }
    }
  }, [pathname, isActive, clickedNav]);

  // グラデーション表示制御
  // 直接ロード時: paint前に即表示（transition不要）
  useLayoutEffect(() => {
    if (pathname === "/") {
      setGradientVisible(false);
      return;
    }
    if (!navigatedViaCircleRef.current) {
      setGradientVisible(true);
    }
  }, [pathname]);

  // サークルクリック遷移時: paint後に表示（transitionが発動）
  useEffect(() => {
    if (pathname === "/" || !navigatedViaCircleRef.current) return;
    navigatedViaCircleRef.current = false;
    requestAnimationFrame(() => {
      setGradientVisible(true);
    });
  }, [pathname]);

  // クリック遷移アニメーション
  useEffect(() => {
    if (pathname !== "/" || clickedNav === null) return;

    const currentCircles = circlesRef.current;
    if (currentCircles.length === 0 || clickedNav >= currentCircles.length)
      return;

    const circle = currentCircles[clickedNav];
    if (!circle || !circle.imagePath) return;

    const href = IMAGE_TO_HREF[circle.imagePath];
    if (!href) return;

    const startTime = Date.now();
    const duration = 1600;
    const transitionThreshold = 0.85; // 85%の時点でページ遷移を開始
    let hasNavigated = false; // 遷移が実行されたかどうかのフラグ

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setClipProgress(eased);

      // 85%の時点でページ遷移を開始（円が開ききる前に遷移）
      if (progress >= transitionThreshold && !hasNavigated) {
        hasNavigated = true;
        router.push(href);
      }

      // アニメーションを継続して100%まで開く
      if (progress < 1) {
        clipAnimationRef.current = requestAnimationFrame(animate);
      }
    };

    clipAnimationRef.current = requestAnimationFrame(animate);

    return () => {
      if (clipAnimationRef.current) {
        cancelAnimationFrame(clipAnimationRef.current);
      }
    };
  }, [clickedNav, pathname, router]);

  const handleNavClick = (
    e: React.MouseEvent,
    circle: Circle,
    index: number,
  ) => {
    if (pathname !== "/") return;
    e.preventDefault();
    e.stopPropagation();
    const href = circle.imagePath ? IMAGE_TO_HREF[circle.imagePath] : null;
    if (!href || !circle.imagePath) return;

    navigatedViaCircleRef.current = true;
    setGradientVisible(false);
    setClickedNav(index);
    setClipProgress(0);
  };

  if (!mounted) {
    return (
      <div
        ref={containerRef}
        className={styles.container}
        suppressHydrationWarning
      />
    );
  }

  const getClipPath = (circle: Circle | null) => {
    if (!circle || typeof window === "undefined") return "none";
    const size = circle.r * 2 * 0.95;
    const radiusX = size / 2;
    const radiusY = radiusX * (81 / 80); // 80:81の比率
    const startRadiusX = radiusX;
    const startRadiusY = radiusY;
    const maxRadius = Math.sqrt(
      window.innerWidth ** 2 + window.innerHeight ** 2,
    );
    const currentRadiusX =
      startRadiusX + (maxRadius - startRadiusX) * clipProgress;
    const currentRadiusY =
      startRadiusY + (maxRadius * (81 / 80) - startRadiusY) * clipProgress;

    return `ellipse(${currentRadiusX}px ${currentRadiusY}px at ${circle.x}px ${circle.y}px)`;
  };

  const activeCircle = isActive ? circles[activeCircleIndex] : null;
  const clickedCircle = clickedNav !== null ? circles[clickedNav] : null;
  const displayCircle = activeCircle || clickedCircle;

  const pathBackgroundColor = getBackgroundColorForPath(pathname);
  const displayBackgroundColor = displayCircle?.imagePath
    ? getBackgroundColor(displayCircle.imagePath)
    : pathBackgroundColor || "transparent";

  const shouldShowBackground = displayCircle || pathBackgroundColor;

  return (
    <div
      ref={containerRef}
      className={styles.container}
      suppressHydrationWarning
    >
      {shouldShowBackground && (
        <>
          {/* 単色レイヤー: 円の展開アニメーション中に表示 */}
          <div
            className={styles.clipOverlay}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: displayBackgroundColor,
              clipPath: displayCircle ? getClipPath(displayCircle) : "none",
              zIndex: -1,
              pointerEvents: "none",
            }}
          >
            {displayCircle && displayCircle.imagePath && !gradientVisible && (
              <div
                style={{
                  position: "absolute",
                  left: `${displayCircle.x}px`,
                  top: `${displayCircle.y}px`,
                  transform: "translate(-50%, -50%)",
                  width: `${displayCircle.r * 2 * 0.95}px`,
                  height: `${displayCircle.r * 2 * 0.95}px`,
                }}
              >
                <div
                  className={
                    displayCircle.rotationDirection === "clockwise"
                      ? styles.circleMask
                      : styles.circleMaskCounterClockwise
                  }
                  style={{
                    width: "100%",
                    height: "100%",
                    clipPath: "ellipse(50% 50.625% at center)",
                    overflow: "hidden",
                    ["--initial-rotation" as string]: `${
                      displayCircle.initialRotation || 0
                    }deg`,
                  }}
                >
                  <Image
                    src={displayCircle.imagePath}
                    alt=""
                    width={displayCircle.r * 2 * 0.95}
                    height={displayCircle.r * 2 * 0.95}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          {/* グラデーションレイヤー: 展開完了後にフェードイン */}
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: `linear-gradient(${displayBackgroundColor}, #ffffff) no-repeat fixed`,
              opacity: gradientVisible ? 1 : 0,
              transition: "opacity 0.4s ease-out",
              zIndex: -1,
              pointerEvents: "none",
            }}
          />
        </>
      )}

      {circles.map((circle, index) => {
        const size = circle.r * 2 * 0.95;
        const initialRotation = circle.initialRotation || 0;
        const rotationDirection = circle.rotationDirection || "clockwise";
        const scale = circleScales[index] ?? 0;

        // will-changeでブラウザに最適化を促しつつ、
        // アニメーションをtransformのみに限定して描画負荷を下げる
        const wrapperStyle: React.CSSProperties = {
          position: "absolute",
          left: `${circle.x}px`,
          top: `${circle.y}px`,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: "center center",
          zIndex: -1,
          willChange: "transform",
        };
        const rotationClass =
          rotationDirection === "clockwise"
            ? styles.circleMask
            : styles.circleMaskCounterClockwise;

        // 個別ページ（/works/*など）では円を表示しない
        const isIndividualPage =
          (pathname.startsWith("/works/") && pathname !== "/works") ||
          (pathname.startsWith("/diary/") && pathname !== "/diary");
        const isHidden =
          isIndividualPage ||
          (pathname === "/" && clickedNav !== null && clickedNav !== index) ||
          (isActive && activeCircleIndex !== index);

        if (circle.isSpecial) {
          const externalHref = circle.imagePath
            ? SPECIAL_EXTERNAL_LINKS[circle.imagePath]
            : null;

          const specialContent = (
            <div
              className={rotationClass}
              style={{
                width: `${size}px`,
                height: `${size}px`,
                clipPath: "ellipse(50% 50.625% at center)",
                overflow: "hidden",
                backgroundColor: gradientVisible
                  ? "transparent"
                  : "var(--purple-background)",
                cursor: externalHref && pathname === "/" ? "pointer" : "default",
                ["--initial-rotation" as string]: `${initialRotation}deg`,
              }}
            >
              {circle.imagePath && (
                <Image
                  src={circle.imagePath}
                  alt=""
                  width={size}
                  height={size}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              )}
            </div>
          );

          return (
            <div
              key={`special-${index}`}
              style={{
                ...wrapperStyle,
                opacity: isHidden ? 0 : 1,
                transition: "opacity 0.2s",
                pointerEvents: pathname === "/" ? "auto" : "none",
              }}
              onClick={
                externalHref
                  ? () => window.open(externalHref, "_blank", "noopener,noreferrer")
                  : undefined
              }
            >
              {specialContent}
            </div>
          );
        } else if (circle.type === "large") {
          const href = circle.imagePath
            ? IMAGE_TO_HREF[circle.imagePath]
            : null;
          const backgroundColor = getBackgroundColor(circle.imagePath);

          const circleContent = (
            <div
              className={rotationClass}
              style={{
                width: `${size}px`,
                height: `${size}px`,
                clipPath: "ellipse(50% 50.625% at center)",
                overflow: "hidden",
                backgroundColor: gradientVisible
                  ? "transparent"
                  : backgroundColor,
                cursor: href && pathname === "/" ? "pointer" : "default",
                opacity: isHidden ? 0 : 1,
                transition: "opacity 0.2s",
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
              <div
                key={`large-${index}`}
                style={{
                  ...wrapperStyle,
                  opacity: isHidden ? 0 : 1,
                  transition: "opacity 0.2s",
                  pointerEvents:
                    pathname === "/" && clickedNav === null ? "auto" : "none",
                }}
                onClick={(e) => handleNavClick(e, circle, index)}
              >
                {circleContent}
              </div>
            );
          }

          return (
            <div key={`large-${index}`} style={wrapperStyle}>
              {circleContent}
            </div>
          );
        } else {
          const workHref = circle.workSlug
            ? `/works/${circle.workSlug}`
            : null;

          return (
            <div
              key={`small-${index}`}
              style={{
                ...wrapperStyle,
                opacity: isHidden ? 0 : 1,
                transition: "opacity 0.2s",
                cursor: workHref && pathname === "/" ? "pointer" : "default",
                pointerEvents: pathname === "/" ? "auto" : "none",
              }}
              onClick={
                workHref
                  ? () => router.push(workHref)
                  : undefined
              }
            >
              <div
                className={rotationClass}
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  clipPath: "ellipse(50% 50.625% at center)",
                  overflow: "hidden",
                  ["--initial-rotation" as string]: `${initialRotation}deg`,
                }}
              >
                {circle.imagePath && (
                  <Image
                    src={circle.imagePath}
                    alt=""
                    width={size}
                    height={size}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                )}
              </div>
            </div>
          );
        }
      })}
    </div>
  );
}
