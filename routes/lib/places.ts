import { sql, eq } from "drizzle-orm";
import { db, placesTable } from "./db";
import type { Coordinate, Place } from "./types";
import { distance } from "./geo";
import curated from "@/data/landmarks.json";
const localNames = new Map(curated.map((p) => [p.id, p.name_so]));
export function normalize(s: string) {
  return s
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f\u064b-\u065f\u0670]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/isbitaalka|isbitaal|isbitalka/g, "hospital")
    .replace(/degmada|dagmada/g, "district")
    .replace(/\bbenadir\b/g, "banadir")
    .replace(/\bmedina\b/g, "madina")
    .replace(/([aeiou])\1+/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}
function editDistance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let old = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const saved = row[j];
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        old + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      old = saved;
    }
  }
  return row[b.length];
}
export function matchScore(query: string, place: Place) {
  const q = normalize(query);
  if (!q) return 0;
  const tokens = q.split(" ").sort().join(" ");
  return Math.max(
    ...[place.name, ...place.aliases].map((alias) => {
      const n = normalize(alias);
      if (n === q || n.split(" ").sort().join(" ") === tokens) return 1;
      const similar = 1 - editDistance(q, n) / Math.max(q.length, n.length);
      return Math.max(similar, n.startsWith(q) && q.length > 2 ? 0.8 : 0);
    }),
  );
}
export function distinctPlaces<T extends Place>(ranked: T[]): T[] {
  const kept: T[] = [];
  for (const place of ranked) {
    const names = new Set([place.name, ...place.aliases].map(normalize));
    const duplicate = kept.some(
      (other) =>
        place.category !== "district" &&
        other.category !== "district" &&
        distance([place.lng, place.lat], [other.lng, other.lat]) <
          (other.source === "manual" ? 200 : 50) &&
        [other.name, ...other.aliases].some((name) =>
          names.has(normalize(name)),
        ),
    );
    if (!duplicate) kept.push(place);
  }
  return kept;
}
export async function searchPlaces(query: string, limit = 6): Promise<Place[]> {
  if (!query.trim() || query.length > 200) return [];
  const q = normalize(query);
  // Trigram indexes shortlist variants; exact alias rescoring preserves meaningful category words.
  const result =
    await db.execute(sql`SELECT *, greatest(similarity(name,${query}),word_similarity(${query},search_text)) AS db_score
  FROM places WHERE search_text % ${query} OR ${query} <% search_text OR source='manual'
  ORDER BY db_score DESC LIMIT 100`);
  const ranked = (result.rows as unknown as Place[])
    .map((p) => ({
      ...p,
      name_so: localNames.get(p.id),
      score: matchScore(q, p),
    }))
    .filter((p) => p.score > 0.2)
    .sort(
      (a, b) =>
        b.score - a.score ||
        Number(b.source === "manual") - Number(a.source === "manual") ||
        a.name.localeCompare(b.name),
    );
  return distinctPlaces(ranked).slice(0, limit);
}
export async function getPlace(id: string): Promise<Place | null> {
  const [p] = await db
    .select()
    .from(placesTable)
    .where(eq(placesTable.id, id))
    .limit(1);
  return p ? ({ ...p, name_so: localNames.get(p.id) } as Place) : null;
}
export async function allPlaces(): Promise<Place[]> {
  const rows = await db.select().from(placesTable);
  return rows.map((p) => ({ ...p, name_so: localNames.get(p.id) }) as Place);
}
// Completion ranking is separate from intent resolution confidence. Short
// prefixes should suggest places without making them automatic route matches.
export async function autocompletePlaces(query: string): Promise<Place[]> {
  const q = normalize(query);
  if (q.length < 2 || q.length > 200) return [];
  const places = await allPlaces();
  // Keep literal Somali prefixes too: "Isbi" should match "Isbitaalka"
  // before full-word normalization translates that category to "hospital".
  const literal = (value: string) => value.normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g, "").trim();
  const queries = [q, literal(query)];
  const ranked = places.map(place => {
    const names = [place.name, place.name_so ?? "", ...place.aliases].flatMap(name => [normalize(name), literal(name)]);
    const prefixScore = Math.max(...queries.flatMap(term => names.map(name => {
      if (name === term) return 1;
      if (name.startsWith(term)) return 0.95;
      const words = name.split(" ");
      if (term.split(" ").every(token => words.some(word => word.startsWith(token)))) return 0.85;
      return 0;
    })));
    const score = prefixScore || (q.length >= 4 ? matchScore(query, place) * 0.7 : 0);
    return { ...place, score };
  }).filter(place => place.score >= 0.5).sort((a, b) => b.score - a.score || Number(b.source === "manual") - Number(a.source === "manual") || a.name.localeCompare(b.name));
  return distinctPlaces(ranked).slice(0, 6);
}
export function needsChoice(matches: Place[]) {
  return (
    !matches.length ||
    (matches[0].score ?? 0) < 0.74 ||
    (matches.length > 1 &&
      (matches[0].score ?? 0) - (matches[1].score ?? 0) < 0.1)
  );
}
export async function nearestPlace(category: string, center: Coordinate) {
  const places = await allPlaces();
  return (
    places
      .filter((p) => p.category === category)
      .sort(
        (a, b) =>
          distance(center, [a.lng, a.lat]) - distance(center, [b.lng, b.lat]),
      )[0] ?? null
  );
}
