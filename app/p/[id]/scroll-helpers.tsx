"use client";

import { useEffect, useState } from "react";
import styles from "@/app/p/[id]/portfolio.module.css";

const SCROLL_THRESHOLD = 480;

export function ScrollHelpers({ displayName }: { displayName: string | null }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > SCROLL_THRESHOLD);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <button
        type="button"
        onClick={scrollToTop}
        className={`${styles.miniHeader} ${visible ? styles.visible : ""}`}
        aria-hidden={!visible}
        tabIndex={visible ? 0 : -1}
      >
        <span className={styles.miniHeaderName}>{displayName}</span>
        <span className={styles.miniHeaderHint}>חזרה למעלה ↑</span>
      </button>

      <button
        type="button"
        onClick={scrollToTop}
        className={`${styles.backToTop} ${visible ? styles.visible : ""}`}
        aria-hidden={!visible}
        tabIndex={visible ? 0 : -1}
        aria-label="חזרה לראש העמוד"
      >
        ↑
      </button>
    </>
  );
}
