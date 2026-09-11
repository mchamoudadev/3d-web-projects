import { test } from "node:test";
import assert from "node:assert/strict";
import { completePlace, completionAt, selectedPlaces } from "../lib/autocomplete";
import type { Place } from "../lib/types";
const branch = { id: "chosen-branch" } as Place;

test("completion preserves an origin after the destination being edited", () => {
  const text = "Take me to Ban from Liido";
  const range = completionAt(text, text.indexOf(" from"))!;
  assert.equal(range.query, "Ban");
  assert.equal(range.role, "destination");
  assert.equal(completePlace(text, range, "Banadir Hospital").text, "Take me to Banadir Hospital from Liido");
});
test("Somali route clauses and reversed English endpoints retain their roles", () => {
  assert.equal(completionAt("Waxaan joogaa Lii")?.role, "origin");
  assert.equal(completionAt("Waxaan joogaa Liido, waxaan rabaa inaan tago Isbi")?.query, "Isbi");
  assert.equal(completionAt("Liido ilaa Ban")?.role, "destination");
  assert.equal(completionAt("Banadir Hospital from Lii")?.role, "origin");
});
test("replacing a partial name at the caret preserves the following clause", () => {
  const text = "From Liido to Banadir Hospital", range = completionAt(text, 8)!;
  assert.equal(completePlace(text, range, "KM4 junction").text, "From KM4 junction to Banadir Hospital");
  assert.equal(completionAt("B"), null);
  assert.equal(completionAt("From Liido to "), null);
});
test("an explicitly chosen hospital branch survives other edits but not changes to its name", () => {
  const pins = [{ role: "destination" as const, label: "Kalkaal Hospital", place: branch }];
  assert.equal(selectedPlaces("From Liido to Kalkaal Hospital", pins).destination?.id, branch.id);
  assert.equal(selectedPlaces("From KM4 to Kalkaal Hospital", pins).destination?.id, branch.id);
  assert.equal(selectedPlaces("From KM4 to Madina Hospital", pins).destination, undefined);
  assert.equal(selectedPlaces("From Kalkaal Hospital to Liido", pins).destination, undefined);
});
