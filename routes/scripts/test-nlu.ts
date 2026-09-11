import { readFile, writeFile } from "node:fs/promises";
const cases = JSON.parse(await readFile("data/nlu-cases.json", "utf8")) as {
  text: string;
  origin: string | null;
  destination: string;
  language: string;
}[];
const only = process.argv
  .find((a) => a.startsWith("--only="))
  ?.slice(7)
  .split(",")
  .map(Number);
const previous: Record<string, unknown>[] = only
  ? JSON.parse(await readFile("data/reports/nlu-live.json", "utf8"))
  : [];
const report: Record<string, unknown>[] = previous.filter(
  (r) => !only?.includes(Number(r.index) + 1),
);
let next = 0;
async function worker() {
  while (next < cases.length) {
    const index = next++;
    if (only && !only.includes(index + 1)) continue;
    const c = cases[index],
      start = performance.now();
    try {
      const response = await fetch("http://localhost:4319/api/understand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: c.text }),
      });
      const intent = await response.json();
      if (!response.ok) throw new Error(intent.error);
      const resolved = await fetch("http://localhost:4319/api/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent, center: [45.34, 2.04] }),
      }).then((r) => r.json());
      const destination =
          resolved.destination?.id ??
          (resolved.destinationChoices?.length ? "ambiguous" : null),
        origin = resolved.origin?.id ?? null;
      const pass =
        destination === c.destination &&
        origin === c.origin &&
        intent.language === c.language;
      const result = {
        index,
        pass,
        text: c.text,
        intent,
        expected: c,
        actual: { origin, destination },
        ms: Math.round(performance.now() - start),
      };
      report.push(result);
      console.log(
        `${pass ? "PASS" : "FAIL"} ${index + 1}: ${c.text} (${result.ms} ms)${pass ? "" : " " + JSON.stringify(result.actual)}`,
      );
    } catch (e) {
      report.push({ index, pass: false, text: c.text, error: String(e) });
      console.log(`FAIL ${index + 1}: ${String(e)}`);
    }
  }
}
await Promise.all([worker(), worker(), worker()]);
report.sort((a, b) => Number(a.index) - Number(b.index));
await writeFile("data/reports/nlu-live.json", JSON.stringify(report, null, 2));
await writeFile(
  "docs/nlu-tests.md",
  "# Live NLU cases\n\nEach case calls OpenRouter once, then resolves against local Postgres. This is a live integration check, not a mocked parser test.\n\nRun `npx tsx scripts/test-nlu.ts` with the app and Docker running.\n\n| Request | Origin | Destination | Language | Live result |\n| --- | --- | --- | --- | --- |\n" +
    cases
      .map(
        (c, i) =>
          `| ${c.text} | ${c.origin ?? "Current map centre"} | ${c.destination} | ${c.language} | ${report[i]?.pass ? "PASS" : "FAIL"} |`,
      )
      .join("\n") +
    "\n\nDetailed timings and returned intents: `data/reports/nlu-live.json`.\n",
);
if (report.some((r) => !r.pass)) process.exitCode = 1;
