/**
 * One-command verification for POST /api/scan.
 *
 *   npm run smoke                                  local server, full check
 *   npm run smoke -- ./path/to/invoice.jpg         local, custom image
 *   npm run smoke -- --url https://app.vercel.app  hit a deployed URL
 *
 * Local runs boot the production build, exercise the CORS preflight and every
 * request guard, then — only if ANTHROPIC_API_KEY is present — run the real
 * two-pass vision call and pretty-print the JSON.
 *
 * The key is used, never printed. Nothing here echoes its value.
 *
 * For the pure rule tests (no server, no key) run `npm test`.
 */
import { spawn } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// --- args -------------------------------------------------------------------
const argv = process.argv.slice(2);
let remoteUrl = null;
let imagePath = resolve(root, "fixtures/sample-invoice.png");
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--url") remoteUrl = argv[++i];
  else if (!argv[i].startsWith("--")) imagePath = resolve(process.cwd(), argv[i]);
}

if (!existsSync(imagePath)) {
  console.error(`Image not found: ${imagePath}`);
  process.exit(1);
}

const hasKey = Boolean(process.env.ANTHROPIC_API_KEY);
let passed = 0;
let failed = 0;

function check(name, ok, detail = "") {
  if (ok) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}
const section = (t) => console.log(`\n=== ${t} ===`);

function mediaTypeFor(p) {
  const ext = p.toLowerCase().split(".").pop();
  return { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" }[ext] ?? "image/jpeg";
}

function imageForm() {
  const form = new FormData();
  form.append("image", new Blob([readFileSync(imagePath)], { type: mediaTypeFor(imagePath) }), "invoice");
  return form;
}

/** POST the image and pretty-print whatever comes back. */
async function runScan(base) {
  const started = Date.now();
  const res = await fetch(`${base}/api/scan`, { method: "POST", body: imageForm() });
  const body = await res.json().catch(() => null);
  console.log(`  HTTP ${res.status} in ${Date.now() - started}ms`);
  console.log(JSON.stringify(body, null, 2));

  check("returns 200", res.status === 200, `got ${res.status}`);
  if (body?.ok) {
    check("counted at least one item", Array.isArray(body.items) && body.items.length > 0);
    check(
      "non-food lines were not counted",
      !body.items.some((i) => /paper towel|bleach|cleaner/i.test(i.description ?? "")),
    );
    check(
      "accessory foods contribute zero units",
      body.items.filter((i) => i.accessory).every((i) => i.stockingUnits === 0),
    );
    check("varietyCounts covers all four categories",
      body.varietyCounts && ["dairy", "grains", "protein", "produce"].every((c) => typeof body.varietyCounts[c] === "number"));
    check(
      "scorecard agrees with varietyCounts",
      Array.isArray(body.scorecard?.categories) &&
        body.scorecard.categories.length === 4 &&
        body.scorecard.categories.every((c) => c.varietiesFound === body.varietyCounts[c.category]),
    );
    check(
      "scorecardEs has the same numbers as scorecard",
      body.scorecardEs?.overallStatus === body.scorecard?.overallStatus &&
        body.scorecardEs?.totalUnits === body.scorecard?.totalUnits &&
        body.scorecardEs?.fixes?.length === body.scorecard?.fixes?.length,
    );
  }
  return body;
}

// --- remote mode ------------------------------------------------------------
if (remoteUrl) {
  section(`Deployed scan: ${remoteUrl}`);
  console.log(`  image: ${imagePath}`);
  await runScan(remoteUrl.replace(/\/$/, ""));
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

// --- local mode -------------------------------------------------------------
if (!existsSync(resolve(root, ".next"))) {
  console.error("No .next build found. Run `npm run build` first.");
  process.exit(1);
}

const PORT = process.env.SMOKE_PORT ?? "3111";
const BASE = `http://127.0.0.1:${PORT}`;
// detached so we can kill the whole process group — npx does not forward
// SIGTERM to the next-server child, which otherwise keeps holding the port
// and makes the next run silently test a stale build.
const server = spawn("npx", ["next", "start", "-p", PORT], {
  cwd: root,
  env: process.env,
  stdio: ["ignore", "pipe", "pipe"],
  detached: true,
});
let serverLog = "";
server.stdout.on("data", (d) => (serverLog += d));
server.stderr.on("data", (d) => (serverLog += d));

async function waitForServer(timeoutMs = 40_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await fetch(`${BASE}/api/scan`, { method: "OPTIONS" });
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  return false;
}

try {
  if (!(await waitForServer())) {
    console.error("Server did not start:\n", serverLog);
    process.exit(1);
  }

  section("CORS preflight (the Framer frontend depends on this)");
  {
    const r = await fetch(`${BASE}/api/scan`, {
      method: "OPTIONS",
      headers: { origin: "https://example.framer.website", "access-control-request-method": "POST" },
    });
    check("OPTIONS returns 204", r.status === 204, `got ${r.status}`);
    check("allows the requesting origin", Boolean(r.headers.get("access-control-allow-origin")));
    check("allows POST", /POST/.test(r.headers.get("access-control-allow-methods") ?? ""));
    check("allows Content-Type", /content-type/i.test(r.headers.get("access-control-allow-headers") ?? ""));
  }
  {
    const r = await fetch(`${BASE}/api/scan`, { method: "POST", headers: { origin: "https://example.framer.website", "content-type": "text/plain" }, body: "x" });
    check("error responses also carry CORS headers", Boolean(r.headers.get("access-control-allow-origin")));
  }

  section("Request guards");
  const cases = [
    ["wrong content-type -> 400", { headers: { "content-type": "text/plain" }, body: "nope" }, 400, "bad_request"],
    ["JSON without image -> 400", { headers: { "content-type": "application/json" }, body: JSON.stringify({ mediaType: "image/png" }) }, 400, "no_image"],
    ["bad mediaType -> 415", { headers: { "content-type": "application/json" }, body: JSON.stringify({ image: "AAAA", mediaType: "application/pdf" }) }, 415, "unsupported_media_type"],
  ];
  for (const [name, init, status, code] of cases) {
    const r = await fetch(`${BASE}/api/scan`, { method: "POST", ...init });
    const b = await r.json();
    check(name, r.status === status && b.error?.code === code, `${r.status} ${b.error?.code}`);
  }
  {
    const form = new FormData();
    form.append("notimage", new Blob(["x"]), "x.txt");
    const r = await fetch(`${BASE}/api/scan`, { method: "POST", body: form });
    const b = await r.json();
    check("multipart without image field -> 400", r.status === 400 && b.error?.code === "no_image", `${r.status} ${b.error?.code}`);
  }
  {
    const form = new FormData();
    form.append("image", new Blob([new Uint8Array(9 * 1024 * 1024)], { type: "image/png" }), "big.png");
    const r = await fetch(`${BASE}/api/scan`, { method: "POST", body: form });
    const b = await r.json();
    check("oversize upload -> 413", r.status === 413 && b.error?.code === "payload_too_large", `${r.status} ${b.error?.code}`);
  }

  if (!hasKey) {
    const r = await fetch(`${BASE}/api/scan`, { method: "POST", body: imageForm() });
    const b = await r.json();
    check("missing key -> 500 server_misconfigured", r.status === 500 && b.error?.code === "server_misconfigured", `${r.status} ${b.error?.code}`);
    check("the error tells the deployer to redeploy", /redeploy/i.test(b.error?.message ?? ""));
    check("the error never contains a key value", !/sk-ant-/i.test(JSON.stringify(b)));
  }

  section("Live two-pass vision call");
  if (!hasKey) {
    console.log("  SKIPPED — ANTHROPIC_API_KEY is not set in this environment.");
    console.log("  This is the ONLY check that the model call actually works.");
    console.log("  Whoever holds the key should run:");
    console.log("    npm run build && ANTHROPIC_API_KEY=... npm run smoke");
  } else {
    console.log(`  image: ${imagePath}`);
    await runScan(BASE);
  }
} finally {
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {
    server.kill("SIGTERM");
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
