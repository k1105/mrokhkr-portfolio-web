"use client";

import {useEffect, useRef, useState, useCallback} from "react";
import {usePathname, useRouter} from "next/navigation";

declare global {
  interface Window {
    __transitionCenters?: Record<string, {x: number; y: number}>;
  }
}

type Phase = "idle" | "forward-expand" | "forward-fadeout" | "back-fadein" | "back-navigate" | "back-shrink";

export default function PageTransitionOverlay() {
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<Phase>("idle");
  const bgColorRef = useRef<string>("transparent");
  const centerRef = useRef<{x: number; y: number}>({x: 0, y: 0});
  const targetHrefRef = useRef<string>("");
  const targetPathnameRef = useRef<string>("");

  const cancelAnim = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    cancelAnim();
    phaseRef.current = "idle";
    bgColorRef.current = "transparent";
    targetHrefRef.current = "";
    targetPathnameRef.current = "";
    setActive(false);
  }, [cancelAnim]);

  // ──────────────── Forward transition (circle expand) ────────────────
  useEffect(() => {
    const handleStart = (e: Event) => {
      if (phaseRef.current !== "idle") return;
      const {x, y, href, bgColor} = (e as CustomEvent).detail;

      // Store center for future back navigation
      if (!window.__transitionCenters) window.__transitionCenters = {};
      try {
        const url = new URL(href, window.location.origin);
        window.__transitionCenters[url.pathname] = {x, y};
      } catch {
        window.__transitionCenters[href] = {x, y};
      }

      phaseRef.current = "forward-expand";
      bgColorRef.current = bgColor;
      centerRef.current = {x, y};
      targetHrefRef.current = href;
      try {
        const url = new URL(href, window.location.origin);
        targetPathnameRef.current = url.pathname;
      } catch {
        targetPathnameRef.current = href;
      }

      setActive(true);
    };

    window.addEventListener("page-transition-start", handleStart);
    return () => window.removeEventListener("page-transition-start", handleStart);
  }, []);

  // Forward: run expand animation once active & in forward-expand phase
  useEffect(() => {
    if (!active || phaseRef.current !== "forward-expand") return;

    const el = overlayRef.current;
    if (!el) return;

    // Initialize overlay style
    el.style.opacity = "1";
    el.style.transition = "none";
    el.style.backgroundColor = bgColorRef.current;
    el.style.clipPath = `circle(0px at ${centerRef.current.x}px ${centerRef.current.y}px)`;

    const maxRadius = Math.sqrt(window.innerWidth ** 2 + window.innerHeight ** 2);
    const duration = 1600;
    const transitionThreshold = 0.85;
    const startTime = performance.now();
    let hasNavigated = false;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const radius = eased * maxRadius;

      if (el) {
        el.style.clipPath = `circle(${radius}px at ${centerRef.current.x}px ${centerRef.current.y}px)`;
      }

      if (progress >= transitionThreshold && !hasNavigated) {
        hasNavigated = true;
        window.dispatchEvent(new CustomEvent("page-transition-navigate"));
        router.push(targetHrefRef.current);
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnim();
  }, [active, router, cancelAnim]);

  // Forward: when pathname changes to target, start fade out
  useEffect(() => {
    if (phaseRef.current !== "forward-expand") return;
    if (!targetPathnameRef.current || pathname !== targetPathnameRef.current) return;

    phaseRef.current = "forward-fadeout";
    const el = overlayRef.current;
    if (!el) {
      cleanup();
      return;
    }

    el.style.transition = "opacity 0.4s ease-out";
    el.style.opacity = "0";

    const handleEnd = () => {
      el.removeEventListener("transitionend", handleEnd);
      cleanup();
    };
    el.addEventListener("transitionend", handleEnd);

    // Safety timeout
    const timer = setTimeout(() => {
      el.removeEventListener("transitionend", handleEnd);
      cleanup();
    }, 600);

    return () => {
      clearTimeout(timer);
      el.removeEventListener("transitionend", handleEnd);
    };
  }, [pathname, cleanup]);

  // ──────────────── Back transition (fade-in → shrink circle) ────────────────
  useEffect(() => {
    const handleBack = (e: Event) => {
      if (phaseRef.current !== "idle") return;
      const {href, bgColor} = (e as CustomEvent).detail;

      // Read stored center for current page, fallback to screen center
      const centers = window.__transitionCenters || {};
      const stored = centers[pathname];
      const cx = stored ? stored.x : window.innerWidth / 2;
      const cy = stored ? stored.y : window.innerHeight / 2;

      phaseRef.current = "back-fadein";
      bgColorRef.current = bgColor;
      centerRef.current = {x: cx, y: cy};
      targetHrefRef.current = href;
      try {
        const url = new URL(href, window.location.origin);
        targetPathnameRef.current = url.pathname;
      } catch {
        targetPathnameRef.current = href;
      }

      setActive(true);
    };

    window.addEventListener("page-transition-back", handleBack);
    return () => window.removeEventListener("page-transition-back", handleBack);
  }, [pathname]);

  // Back: phase 1 — fade in overlay
  useEffect(() => {
    if (!active || phaseRef.current !== "back-fadein") return;

    const el = overlayRef.current;
    if (!el) return;

    // Start fully transparent, full screen (no clip)
    el.style.clipPath = "none";
    el.style.opacity = "0";
    el.style.backgroundColor = bgColorRef.current;
    el.style.transition = "none";

    // Force layout so the transition triggers
    el.getBoundingClientRect();

    el.style.transition = "opacity 0.4s ease-in";
    el.style.opacity = "1";

    const handleFadeInEnd = () => {
      el.removeEventListener("transitionend", handleFadeInEnd);

      // Move to navigate phase
      phaseRef.current = "back-navigate";
      router.push(targetHrefRef.current);
    };
    el.addEventListener("transitionend", handleFadeInEnd);

    // Safety timeout
    const timer = setTimeout(() => {
      el.removeEventListener("transitionend", handleFadeInEnd);
      if (phaseRef.current === "back-fadein") {
        phaseRef.current = "back-navigate";
        router.push(targetHrefRef.current);
      }
    }, 600);

    return () => {
      clearTimeout(timer);
      el.removeEventListener("transitionend", handleFadeInEnd);
    };
  }, [active, router]);

  // Back: phase 2 — after navigation, skip fadeIn animations and shrink circle
  useEffect(() => {
    if (phaseRef.current !== "back-navigate") return;
    if (pathname !== targetPathnameRef.current) return;

    phaseRef.current = "back-shrink";

    // Finish all fadeIn CSS animations on the destination page so content is visible immediately
    try {
      const animations = document.getAnimations();
      for (const anim of animations) {
        if (anim instanceof CSSAnimation && anim.animationName.includes("fadeIn")) {
          anim.finish();
        }
      }
    } catch {
      // getAnimations may not be available in all environments
    }

    const el = overlayRef.current;
    if (!el) {
      cleanup();
      return;
    }

    // Set up circle clip at full size, then shrink to 0
    const maxRadius = Math.sqrt(window.innerWidth ** 2 + window.innerHeight ** 2);
    const cx = centerRef.current.x;
    const cy = centerRef.current.y;
    const duration = 800;

    el.style.transition = "none";
    el.style.opacity = "1";
    el.style.clipPath = `circle(${maxRadius}px at ${cx}px ${cy}px)`;

    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-in: slow start, fast end
      const eased = progress * progress;
      const radius = maxRadius * (1 - eased);

      el.style.clipPath = `circle(${radius}px at ${cx}px ${cy}px)`;

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        el.style.clipPath = `circle(0px at ${cx}px ${cy}px)`;
        cleanup();
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnim();
  }, [pathname, cleanup, cancelAnim]);

  if (!active) return null;

  return (
    <div
      ref={overlayRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100lvh",
        backgroundColor: bgColorRef.current,
        clipPath: "circle(0px at 0px 0px)",
        zIndex: 10,
        pointerEvents: "none",
      }}
    />
  );
}
