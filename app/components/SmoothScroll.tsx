"use client";

import {useEffect} from "react";
import Lenis from "lenis";

const isMobile = () => window.matchMedia("(max-width: 768px)").matches;

export default function SmoothScroll() {
  useEffect(() => {
    if (isMobile()) return;

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
  }, []);

  return null;
}
