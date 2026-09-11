import type { Place } from "./types";
export type PlaceRole = "origin" | "destination";
export interface Completion {
  start: number;
  end: number;
  query: string;
  role: PlaceRole;
}
export interface PlaceSelection {
  role: PlaceRole;
  label: string;
  place: Place;
}
export type SelectedPlaces = Partial<Record<PlaceRole, Place>>;

// Only identify the editable place span. Submitted travel intent still uses NLU.
export function completionRanges(text: string): Completion[] {
  const marker = /\b(from|to|at|ilaa|ka tag|ka imaanaya|waxaan joogaa|joogaa|waxaan rabaa(?: inaan tago)?|rabaa(?: inaan tago)?|inaan tago|tago|tagaa|i gee)\s+/gi;
  const markers = [...text.matchAll(marker)];
  const boundaries = [{ start: 0, marker: "" }, ...markers.map(m => ({
    start: m.index! + m[0].length, marker: m[1].toLowerCase(),
  }))];
  return boundaries.flatMap((boundary, i) => {
    const end = markers[i]?.index ?? text.length;
    const raw = text.slice(boundary.start, end);
    const leading = raw.match(/^[\s,]+/)?.[0].length ?? 0;
    const trailing = raw.match(/[\s,.!?]+$/)?.[0].length ?? 0;
    const start = boundary.start + leading, finish = Math.max(start, end - trailing);
    if (finish <= start) return [];
    const role: PlaceRole = /^(from|at|ka tag|ka imaanaya|waxaan joogaa|joogaa)$/.test(boundary.marker)
      || (!boundary.marker && /^(to|ilaa)$/.test(markers[0]?.[1].toLowerCase() ?? "")) ? "origin" : "destination";
    return [{ start, end: finish, query: text.slice(start, finish), role }];
  });
}
export function completionAt(text: string, caret = text.length): Completion | null {
  const range = completionRanges(text).find(r => caret >= r.start && caret <= r.end);
  if (!range) return null;
  const query = text.slice(range.start, caret).trim();
  return query.length >= 2 && query.length <= 200 ? { ...range, query } : null;
}
export function completePlace(text: string, range: Completion, label: string) {
  return { text: text.slice(0, range.start) + label + text.slice(range.end), caret: range.start + label.length };
}
export function selectedPlaces(text: string, selections: PlaceSelection[]): SelectedPlaces {
  const ranges = completionRanges(text), selected: SelectedPlaces = {};
  for (const selection of selections) {
    // Editing a selected name invalidates that choice, while editing the other
    // endpoint preserves it. Never carry a stale branch into a new request.
    if (ranges.some(r => r.role === selection.role && r.query === selection.label)) selected[selection.role] = selection.place;
  }
  return selected;
}
