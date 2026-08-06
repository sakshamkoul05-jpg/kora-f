import type { PlaceImage } from "@/lib/image-credits";

// Small, unobtrusive attribution — satisfies CC BY / CC BY-SA terms without
// competing with the photo itself.
export function PhotoCredit({ image, className }: { image: PlaceImage; className?: string }) {
  return (
    <a
      href={image.sourceUrl}
      target="_blank"
      rel="noreferrer"
      className={`absolute bottom-2 right-2 rounded-[3px] bg-ink/50 px-1.5 py-0.5 text-[10px] leading-none text-mist/80 opacity-0 backdrop-blur-sm transition-opacity hover:opacity-100 group-hover:opacity-100 ${className ?? ""}`}
    >
      {image.author} · {image.license}
    </a>
  );
}
