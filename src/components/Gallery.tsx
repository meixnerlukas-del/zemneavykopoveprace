"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

export type GalleryImage = { url: string; caption: string | null };

export default function Gallery({ images }: { images: GalleryImage[] }) {
  const [open, setOpen] = useState<number | null>(null);

  const close = useCallback(() => setOpen(null), []);
  const prev = useCallback(
    () => setOpen((i) => (i === null ? null : (i - 1 + images.length) % images.length)),
    [images.length],
  );
  const next = useCallback(
    () => setOpen((i) => (i === null ? null : (i + 1) % images.length)),
    [images.length],
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, prev, next]);

  if (images.length === 0) return null;

  return (
    <>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((img, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => setOpen(i)}
              className="group relative block aspect-[4/3] w-full overflow-hidden bg-concrete"
              aria-label={`Zväčšiť fotografiu ${i + 1}`}
            >
              <Image
                src={img.url}
                alt={img.caption ?? "Realizácia zemných a výkopových prác"}
                fill
                sizes="(max-width:640px) 50vw, 25vw"
                className="object-cover transition-transform group-hover:scale-105"
              />
            </button>
          </li>
        ))}
      </ul>

      {open !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-asphalt/95 p-4"
          role="dialog"
          aria-modal="true"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 text-paper hover:text-jcb"
            aria-label="Zavrieť"
          >
            <span className="text-3xl">×</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            className="absolute left-4 text-paper hover:text-jcb"
            aria-label="Predchádzajúca"
          >
            <span className="text-4xl">‹</span>
          </button>
          <div
            className="relative h-[80vh] w-[90vw] max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[open].url}
              alt={images[open].caption ?? "Realizácia zemných a výkopových prác"}
              fill
              sizes="90vw"
              className="object-contain"
            />
            {images[open].caption && (
              <p className="absolute bottom-0 left-0 right-0 bg-asphalt/80 p-3 text-center text-sm text-paper">
                {images[open].caption}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            className="absolute right-4 text-paper hover:text-jcb"
            aria-label="Ďalšia"
          >
            <span className="text-4xl">›</span>
          </button>
        </div>
      )}
    </>
  );
}
