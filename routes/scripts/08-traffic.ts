import { readFileSync, writeFileSync } from "node:fs";
import { loadEnvFile } from "node:process";
try {
  loadEnvFile(".env");
} catch {}
const places = JSON.parse(readFileSync("data/landmarks.json", "utf8")).filter(
  (p: { category: string }) => p.category !== "district",
);
const routes = [];
for (let i = 0; i < Math.min(places.length, 20); i++) {
  const a = places[i],
    b = places[(i + 7) % places.length];
  const response = await fetch(
    `${process.env.OSRM_URL ?? "http://localhost:" + (process.env.OSRM_PORT ?? 5000)}/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`,
  );
  const data = await response.json();
  if (data.code === "Ok")
    routes.push({
      coordinates: data.routes[0].geometry.coordinates,
      duration: data.routes[0].duration,
    });
}
writeFileSync("public/data/traffic.json", JSON.stringify(routes));
console.log(`Saved ${routes.length} local OSRM paths.`);
