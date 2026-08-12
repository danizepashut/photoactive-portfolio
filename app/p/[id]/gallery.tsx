"use client";

import { useEffect, useRef, useState } from "react";
import styles from "@/app/p/[id]/portfolio.module.css";

export type GalleryPhoto = {
  id: string;
  title: string | null;
  url: string;
};

export function Gallery({ photos }: { photos: GalleryPhoto[] }) {
  const [view, setView] = useState<"linear" | "grid">("linear");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [visible, setVisible] = useState<boolean[]>(() =>
    photos.map(() => false),
  );

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = cellRefs.current.indexOf(
              entry.target as HTMLDivElement,
            );
            if (idx !== -1) {
              setVisible((prev) => {
                const next = [...prev];
                next[idx] = true;
                return next;
              });
            }
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -40px 0px" },
    );
    cellRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (lightboxIndex === null) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight")
        setLightboxIndex((i) => (i === null ? null : (i + 1) % photos.length));
      if (e.key === "ArrowLeft")
        setLightboxIndex((i) =>
          i === null ? null : (i - 1 + photos.length) % photos.length,
        );
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [lightboxIndex, photos.length]);

  const active = lightboxIndex !== null ? photos[lightboxIndex] : null;

  return (
    <>
      <div className={styles.stripHead}>
        <span>
          סדרה 01 <span className={styles.count}>· עבודות נבחרות</span>
        </span>
        <div
          className={styles.viewToggle}
          role="group"
          aria-label="אופן תצוגת הגלריה"
        >
          <button
            type="button"
            className={view === "linear" ? "active" : ""}
            onClick={() => setView("linear")}
          >
            רצף
          </button>
          <button
            type="button"
            className={view === "grid" ? "active" : ""}
            onClick={() => setView("grid")}
          >
            גריד
          </button>
        </div>
        <span>{photos.length} פריימים</span>
      </div>

      <div className={view === "grid" ? `${styles.roll} ${styles.rollGrid}` : styles.roll}>
        {photos.map((photo, i) => (
          <div
            key={photo.id}
            ref={(el) => {
              cellRefs.current[i] = el;
            }}
            className={`${styles.cell} ${visible[i] ? styles.inView : ""}`}
          >
            <span className={styles.cellNum}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <div
              className={styles.frame}
              onClick={() => setLightboxIndex(i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.title ?? ""}
                className={styles.frameImg}
              />
              <span className={styles.expand}>⤢</span>
            </div>
            <div className={styles.cap}>
              <b>{photo.title}</b>
            </div>
          </div>
        ))}
      </div>

      <div
        className={`${styles.lightbox} ${active ? styles.open : ""}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!active}
        aria-label="הגדלת תמונה"
      >
        <button
          type="button"
          className={styles.lightboxClose}
          onClick={() => setLightboxIndex(null)}
          aria-label="סגירה"
        >
          ×
        </button>
        <button
          type="button"
          className={`${styles.lightboxNav} prev`}
          onClick={() =>
            setLightboxIndex((i) =>
              i === null ? null : (i + 1) % photos.length,
            )
          }
          aria-label="התמונה הקודמת"
        >
          ‹
        </button>
        <div className={styles.lightboxFrame}>
          {active && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={active.url}
              alt={active.title ?? ""}
              className={styles.lightboxImg}
            />
          )}
        </div>
        <div className={styles.lightboxCap}>
          <b>{active?.title}</b>
        </div>
        <button
          type="button"
          className={`${styles.lightboxNav} next`}
          onClick={() =>
            setLightboxIndex((i) =>
              i === null ? null : (i - 1 + photos.length) % photos.length,
            )
          }
          aria-label="התמונה הבאה"
        >
          ›
        </button>
      </div>
    </>
  );
}
