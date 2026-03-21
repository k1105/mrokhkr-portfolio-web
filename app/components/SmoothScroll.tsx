"use client";

import {useEffect} from "react";
import {usePathname} from "next/navigation";
import Lenis from "lenis";

const isMobile = () => window.matchMedia("(max-width: 768px)").matches;

const DISABLED_PATHS = ["/works"];

export default function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (isMobile()) return;
    if (DISABLED_PATHS.some((p) => pathname === p)) return;

    const lenis = new Lenis({
      lerp: 0.1,
      wheelMultiplier: 0.8,
      syncTouch: true,
      syncTouchLerp: 0.075,
      touchInertiaExponent: 1.7,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, [pathname]);

  return null;
}
