"use client";

import {useEffect, useState} from "react";
import {useSearchParams} from "next/navigation";
import styles from "./GridOverlay.module.css";

const COLUMNS = 10;

export default function GridOverlay() {
  const searchParams = useSearchParams();
  const [rows, setRows] = useState(0);

  const showGrid = searchParams.get("grid") === "true";

  useEffect(() => {
    if (!showGrid) return;
    const update = () => {
      const cellSize = window.innerWidth / COLUMNS;
      setRows(Math.ceil(window.innerHeight / cellSize));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [showGrid]);

  if (!showGrid || rows === 0) return null;

  return (
    <div className={styles.overlay}>
      <div
        className={styles.grid}
        style={{
          gridTemplateColumns: `repeat(${COLUMNS}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
        }}
      >
        {Array.from({length: COLUMNS * rows}, (_, i) => (
          <div key={i} className={styles.cell} />
        ))}
      </div>
    </div>
  );
}
