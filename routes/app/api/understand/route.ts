import { inputSchema, understand } from "@/lib/nlu";
export async function POST(request: Request) {
  let input;
  try {
    input = inputSchema.parse(await request.json());
  } catch {
    return Response.json(
      { error: "Enter a journey request of 2 to 500 characters." },
      { status: 400 },
    );
  }
  try {
    return Response.json(await understand(input.text));
  } catch (e) {
    return Response.json(
      {
        error:
          e instanceof Error ? e.message : "Could not understand the request.",
      },
      { status: 502 },
    );
  }
}
