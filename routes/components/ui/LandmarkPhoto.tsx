import Image from "next/image";
import { landmarkMedia } from "@/config/landmark-media";
import type { Language } from "@/lib/types";

export default function LandmarkPhoto({ placeId, language }: {
  placeId: string;
  language: Language;
}) {
  const photo = landmarkMedia[placeId];
  if (!photo) return null;
  const so = language === "so";
  return (
    <figure className="landmark-photo">
      <a href={photo.src} target="_blank" rel="noreferrer"
        aria-label={so ? "Sawirka oo dhan fur" : "Open full photograph"}>
        <Image src={photo.src} alt={photo.cue[language]} width={600} height={400} unoptimized />
        <span>{so ? "SAWIR DHAB AH" : "REAL PHOTOGRAPH"} · {photo.date.slice(0, 4)}</span>
      </a>
      <figcaption>
        <a href={photo.sourceUrl} target="_blank" rel="noreferrer">{photo.author}</a>
        {" · "}<a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.license}</a>
        <small>{photo.date} · {so ? "Muuqaalku wuu isbeddeli karaa." : "Appearance may have changed."}</small>
      </figcaption>
    </figure>
  );
}
