import { test, after } from "node:test";
import assert from "node:assert/strict";
import { searchPlaces, needsChoice, normalize } from "../lib/places";
import { pool } from "../lib/db";
after(() => pool.end());
for (const q of ["isbitaalka madiina", "medina hospital", "مستشفى المدينة"])
  test(`Canonical Madina Hospital: ${q}`, async () => {
    const m = await searchPlaces(q);
    assert.equal(m[0].id, "madina-hospital");
    assert.equal(needsChoice(m), false);
  });
test("Hospital and district remain ambiguous without category", async () => {
  const m = await searchPlaces("Madina");
  assert.equal(needsChoice(m), true);
  assert.deepEqual(
    new Set(m.slice(0, 2).map((p) => p.id)),
    new Set(["madina-hospital", "wadajir"]),
  );
});
test("Somali double vowels and category word ordering", () => {
  assert.equal(normalize("Isbitaalka Banaadir"), "hospital banadir");
});
test("A poor match cannot silently choose a place", async () =>
  assert.equal(needsChoice(await searchPlaces("flibbertigibbet")), true));
test("Known beach wins over nearby restaurants", async () =>
  assert.equal((await searchPlaces("Liido"))[0].id, "liido-beach"));

test("duplicate map objects consolidate but different Kalkaal locations require a choice", async () => {
  for (const query of ["KM4", "Villa Somalia", "Suuqa Bakaaraha"]) {
    const matches = await searchPlaces(query);
    assert.equal(needsChoice(matches), false, query);
  }
  const hospitals = await searchPlaces("Kalkaal Hospital");
  assert.equal(needsChoice(hospitals), true);
  assert.equal(hospitals[0].id, "kalkaal-hospital");
  assert.ok(hospitals[1].id.startsWith("osm-"));
});

test("autocomplete ranks short names and Somali category prefixes without irrelevant matches", async () => {
  const { autocompletePlaces } = await import("../lib/places");
  assert.equal((await autocompletePlaces("Li"))[0].id, "liido-beach");
  assert.ok((await autocompletePlaces("Isbi")).every(p => ["hospital", "clinic"].includes(p.category)));
  assert.equal((await autocompletePlaces("Isbitaalka Ban"))[0].id, "banadir-hospital");
  assert.deepEqual(await autocompletePlaces("zzzzqqqq"), []);
  const branches = await autocompletePlaces("Kalkaal");
  assert.ok(branches.some(p => p.id === "kalkaal-hospital"));
  assert.ok(branches.some(p => p.id.startsWith("osm-")));
});

test("Jamhuriya resolves by English, Somali and JUST aliases to the mapped university site", async () => {
  for (const query of ["Jamhuriya University", "Jaamacadda Jamhuuriya", "JUST"]) {
    const matches = await searchPlaces(query);
    assert.equal(matches[0].id, "jamhuriya-university", query);
    assert.equal(needsChoice(matches), false, query);
    assert.equal(matches[0].osm_id, "w1373512386");
    assert.equal(matches[0].district, "Hodan");
  }
});
