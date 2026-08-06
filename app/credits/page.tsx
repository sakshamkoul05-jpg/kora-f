import type { Metadata } from "next";
import { placeImages } from "@/lib/image-credits";

export const metadata: Metadata = { title: "Photo Credits — Kora House" };

export default function CreditsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 md:px-8 md:py-24">
      <p className="eyebrow text-ink/50">Photo credits</p>
      <h1 className="mt-2 font-display text-4xl">McLeodganj &amp; nearby places</h1>
      <p className="mt-4 text-ink/70">
        Photos of the room, the balcony and the hosts are the property&apos;s
        own and are pending from Rohitash and Ashish. The location and
        culture photography used elsewhere on this site is real photography
        of McLeodganj and the surrounding area, used under free licences from
        Wikimedia Commons and credited below.
      </p>
      <ul className="mt-10 divide-y divide-ink/10">
        {Object.values(placeImages).map((img) => (
          <li key={img.file} className="py-4 text-sm">
            <p className="font-display text-base">{img.title}</p>
            <p className="mt-1 text-ink/60">
              {img.author} · {img.license} ·{" "}
              <a href={img.sourceUrl} target="_blank" rel="noreferrer" className="text-maroon underline underline-offset-4">
                Source
              </a>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
