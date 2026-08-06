import type { Metadata } from "next";
import { SectionMark } from "@/components/Ornament";
import { placeImages } from "@/lib/image-credits";

export const metadata: Metadata = { title: "Photo Credits — Kora House" };

export default function CreditsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-20 md:px-8 md:py-28">
      <SectionMark eyebrow="Photo credits" variant="lotus" />
      <h1 className="display-xl mt-5">McLeodganj &amp; nearby</h1>
      <p className="lede mt-7">
        Photographs of the rooms, the balcony and the hosts belong to the
        property and are still to come from Rohitash and Ashish. Everything
        else on this site is real photography of McLeodganj and the
        surrounding valley, used under free licences from Wikimedia Commons
        and credited below.
      </p>

      <ul className="mt-14 border-t border-ink/10">
        {Object.values(placeImages).map((img) => (
          <li key={img.file} className="border-b border-ink/10 py-5">
            <p className="display-md">{img.title}</p>
            <p className="mt-1.5 text-sm text-ink-soft">
              {img.author} · {img.license} ·{" "}
              <a
                href={img.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="border-b border-maroon/40 text-maroon hover:border-maroon"
              >
                Source
              </a>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
