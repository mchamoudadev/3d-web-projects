import assets from "./landmark-media.json";
export interface LandmarkMedia {
  src: string;
  title: string;
  sourceUrl: string;
  license: string;
  licenseUrl: string;
  author: string;
  date: string;
  cue: { en: string; so: string };
}
export const landmarkMedia: Record<string, LandmarkMedia> = assets;
