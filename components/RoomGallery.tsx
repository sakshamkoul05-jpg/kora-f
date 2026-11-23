"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import type { RoomPhoto } from "@/lib/room-photos";

/**
 * Room gallery: every photograph is shown whole, at its own aspect ratio —
 * nothing is cropped to fit a box, so the rooms read exactly as photographed.
 * Clicking any photo opens it full-screen, with arrows to move through the set.
 */
export function RoomGallery({ photos }: { photos: RoomPhoto[] }) {
  const [open, setOpen] = useState<number | null>(null);

  const close = useCallback(() => setOpen(null), []);
  const step = useCallback(
    (dir: 1 | -1) =>
      setOpen((cur) =>
        cur === null ? cur : (cur + dir + photos.length) % photos.length
      ),
    [photos.length]
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close, step]);

  if (photos.length === 0) return null;

  const [hero, ...rest] = photos;

  return (
    <>
      <div className="mt-8">
        <button
          type="button"
          onClick={() => setOpen(0)}
          className="block w-full cursor-zoom-in overflow-hidden rounded-[var(--radius-card)]"
          aria-label={`Open photo: ${hero.alt}`}
        >
          <Image
            src={hero.src}
            alt={hero.alt}
            width={hero.w}
            height={hero.h}
            className="h-auto w-full"
            sizes="(max-width: 1152px) 100vw, 1152px"
            priority
          />
        </button>

        {rest.length > 0 && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {rest.map((p, i) => (
              <button
                key={p.alt}
                type="button"
                onClick={() => setOpen(i + 1)}
                className="block cursor-zoom-in overflow-hidden rounded-[var(--radius-card)]"
                aria-label={`Open photo: ${p.alt}`}
              >
                <Image
                  src={p.src}
                  alt={p.alt}
                  width={p.w}
                  height={p.h}
                  className="h-auto w-full"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </button>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-ink/45">Tap any photo to see it full-screen.</p>
      </div>

      {open !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={photos[open].alt}
          onClick={close}
        >
          <Image
            src={photos[open].src}
            alt={photos[open].alt}
            width={photos[open].w}
            height={photos[open].h}
            className="max-h-[88vh] w-auto max-w-full object-contain"
            sizes="100vw"
          />
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition-colors hover:bg-white/25"
          >
            ×
          </button>
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
                aria-label="Previous photo"
                className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition-colors hover:bg-white/25"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
                aria-label="Next photo"
                className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition-colors hover:bg-white/25"
              >
                ›
              </button>
            </>
          )}
          <p className="absolute bottom-4 left-1/2 w-full max-w-2xl -translate-x-1/2 px-6 text-center text-sm text-white/85">
            {photos[open].alt} · {open + 1} of {photos.length}
          </p>
        </div>
      )}
    </>
  );
}
