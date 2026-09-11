import { allPlaces } from "@/lib/places";
export async function GET() {
  try {
    return Response.json({ places: await allPlaces() });
  } catch {
    return Response.json(
      { error: "Places database is unavailable." },
      { status: 503 },
    );
  }
}
