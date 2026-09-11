import { autocompletePlaces, searchPlaces } from "@/lib/places";
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const q = params.get("q") ?? "";
  if (q.length > 200)
    return Response.json({ error: "Search is too long." }, { status: 400 });
  try {
    return Response.json({ places: await (params.get("autocomplete") === "1" ? autocompletePlaces(q) : searchPlaces(q)) });
  } catch {
    return Response.json(
      { error: "Places database is unavailable. Start Docker Compose." },
      { status: 503 },
    );
  }
}
