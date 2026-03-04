"use client";

import {useEffect, useState} from "react";
import {useSearchParams} from "next/navigation";
import styles from "./GridOverlay.module.css";

const COLUMNS_MOBILE = 10;
const COLUMNS_PC = 20;
const BREAKPOINT = 768;

export default function GridOverlay() {
  const searchParams = useSearchParams();
  const [rows, setRows] = useState(0);
  const [columns, setColumns] = useState(COLUMNS_MOBILE);

  const showGrid = searchParams.get("grid") === "true";

  useEffect(() => {
    if (!showGrid) return;
    const update = () => {
      const cols =
        window.innerWidth >= BREAKPOINT ? COLUMNS_PC : COLUMNS_MOBILE;
      setColumns(cols);
      const cellSize = window.innerWidth / cols;
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
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
        }}
      >
        {Array.from({length: columns * rows}, (_, i) => (
          <div key={i} className={styles.cell} />
        ))}
      </div>
    </div>
  );
}
