import type { PlaceImage } from "@/lib/image-credits";

/**
 * Small, unobtrusive attribution — satisfies CC BY / CC BY-SA terms without
 * competing with the photo itself.
 *
 * VISIBLE BY DEFAULT ON TOUCH. It used to be `opacity-0` until hover, which
 * meant that on any phone or tablet — no hover, ever — the attribution simply
 * never appeared. These are CC BY and CC BY-SA photographs and the licence
 * requires credit to be visible to the person looking at the image, so on
 * small screens it is always shown at a low but readable opacity, and only
 * from `sm` upward does it hide until hover.
 *
 * Padding is also larger on touch: at py-0.5 the link was a 14px tap target,
 * under half the 24px minimum.
 */
export function PhotoCredit({ image, className }: { image: PlaceImage; className?: string }) {
  return (
    <a
      href={image.sourceUrl}
      target="_blank"
      rel="noreferrer"
      className={`absolute bottom-2 right-2 rounded-[3px] bg-ink/60 px-2 py-1 text-[11px] leading-tight text-mist/90 opacity-90 backdrop-blur-sm transition-opacity sm:bg-ink/50 sm:px-1.5 sm:py-0.5 sm:text-[10px] sm:leading-none sm:text-mist/80 sm:opacity-0 sm:hover:opacity-100 sm:group-hover:opacity-100 ${className ?? ""}`}
    >
      {image.author} · {image.license}
    </a>
  );
}
