import { z } from "zod";
import { intentSchema } from "@/lib/nlu";
import { resolveIntent } from "@/lib/resolve";
const schema = z.object({
  intent: intentSchema,
  center: z.tuple([
    z.number().min(45.25).max(45.42),
    z.number().min(1.98).max(2.12),
  ]),
});
export async function POST(request: Request) {
  let input;
  try {
    input = schema.parse(await request.json());
  } catch {
    return Response.json(
      { error: "Invalid journey or map centre." },
      { status: 400 },
    );
  }
  try {
    return Response.json(await resolveIntent(input.intent, input.center));
  } catch {
    return Response.json(
      { error: "Places database is unavailable." },
      { status: 503 },
    );
  }
}
