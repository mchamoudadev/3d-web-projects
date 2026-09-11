import { pool } from "@/lib/db";
export async function GET() {
  const checks = await Promise.allSettled([
    pool.query("SELECT count(*) FROM places"),
    fetch(
      `http://127.0.0.1:${process.env.OSRM_PORT ?? 5000}/nearest/v1/driving/45.34,2.04`,
      { signal: AbortSignal.timeout(2000) },
    ),
  ]);
  return Response.json({
    database: checks[0].status === "fulfilled",
    routing: checks[1].status === "fulfilled" && checks[1].value.ok,
    nlu: Boolean(process.env.OPENROUTER_API_KEY),
  });
}
