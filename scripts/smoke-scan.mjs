/**
 * Smoke test for POST /api/scan.
 *
 *   npm run build && npm run smoke
 *
 * Phase 1 (no API key needed) — exercises the real undercounting rules against
 *   the compiled partition module.
 * Phase 2 (no API key needed) — boots the built server and exercises the
 *   request guards over real HTTP.
 * Phase 3 (needs ANTHROPIC_API_KEY) — one real two-pass vision call against
 *   fixtures/sample-invoice.png. SKIPPED, loudly, when no key is present.
 */
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

let passed = 0;
let failed = 0;

function check(name, condition, detail = "") {
  if (condition) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function section(title) {
  console.log(`\n=== ${title} ===`);
}

// ---------------------------------------------------------------------------
// Phase 1 — undercounting rules
// ---------------------------------------------------------------------------
section("Phase 1: undercounting rules (compiled from lib/)");

console.log("  building lib/rules -> .smoke-build ...");
const build = spawnSync("npx", ["tsc", "-p", "tsconfig.smoke.json"], {
  cwd: root,
  encoding: "utf8",
});
if (build.status !== 0) {
  console.error("  could not compile lib/rules:\n", build.stdout, build.stderr);
  process.exit(1);
}

const { partitionClassifiedItems } = require(resolve(root, ".smoke-build/rules/partition.js"));

/** Fully valid line unless overridden. */
function line(over = {}) {
  return {
    sourceLineText: "WHL MLK HOMOGENIZED",
    category: "dairy",
    variety: "whole milk",
    packCount: 6,
    quantity: 4,
    shelfStable: false,
    confidence: 0.95,
    excludeReason: null,
    ...over,
  };
}

{
  const { items, excluded } = partitionClassifiedItems([line()]);
  check("clean dairy line is counted", items.length === 1 && excluded.length === 0);
  check("stockingUnits = quantity x packCount", items[0]?.stockingUnits === 24, `got ${items[0]?.stockingUnits}`);
  check("dairy is perishable", items[0]?.perishable === true);
}
{
  // "25 LB CS" is a weight, not a unit count — packCount is unknowable.
  const { items, excluded } = partitionClassifiedItems([
    line({ sourceLineText: "ROMA TOMATOES", category: "produce", packCount: null }),
  ]);
  check("weight-only pack size is NOT counted", items.length === 0 && excluded.length === 1);
  check("excluded reason names the pack size", /pack size or quantity/i.test(excluded[0]?.reason ?? ""));
}
{
  const { items, excluded } = partitionClassifiedItems([
    line({ sourceLineText: "PAPER TOWELS 2PLY", excludeReason: "Not a food category." }),
  ]);
  check("model-excluded line is NOT counted", items.length === 0 && excluded.length === 1);
  check("model's own reason is preserved", excluded[0]?.reason === "Not a food category.");
}
{
  const { items, excluded } = partitionClassifiedItems([line({ confidence: 0.5 })]);
  check("below-threshold confidence is NOT counted", items.length === 0 && excluded.length === 1);
  check("low-confidence reason is reported", /low confidence/i.test(excluded[0]?.reason ?? ""));
}
{
  const { items } = partitionClassifiedItems([
    line({ sourceLineText: "BLACK BEANS CANNED", category: "protein", shelfStable: true, packCount: 24, quantity: 2 }),
  ]);
  check("shelf-stable protein is counted", items.length === 1);
  check("shelf-stable overrides perishable", items[0]?.perishable === false);
}
{
  const { items } = partitionClassifiedItems([
    line({ sourceLineText: "BROWN RICE LONG GRAIN", category: "grains", packCount: 8, quantity: 3 }),
  ]);
  check("grains are never perishable", items[0]?.perishable === false);
}
{
  const { items } = partitionClassifiedItems([line({ confidence: 1.7 })]);
  check("out-of-range confidence is clamped to 1", items[0]?.confidence === 1, `got ${items[0]?.confidence}`);
}
{
  const { items, excluded } = partitionClassifiedItems([line({ quantity: 2.5, packCount: 3 })]);
  check("fractional stocking units are NOT counted", items.length === 0 && excluded.length === 1);
}
{
  const { items, excluded } = partitionClassifiedItems([line({ quantity: 0 })]);
  check("zero quantity is NOT counted", items.length === 0 && excluded.length === 1);
}
{
  const { items, excluded } = partitionClassifiedItems([line({ quantity: -4 })]);
  check("negative quantity is NOT counted", items.length === 0 && excluded.length === 1);
}

// ---------------------------------------------------------------------------
// Phase 2 / 3 — live server
// ---------------------------------------------------------------------------
if (!existsSync(resolve(root, ".next"))) {
  console.error("\nNo .next build found. Run `npm run build` first.");
  process.exit(1);
}

const PORT = process.env.SMOKE_PORT ?? "3111";
const BASE = `http://127.0.0.1:${PORT}`;
const hasKey = Boolean(process.env.ANTHROPIC_API_KEY);

const server = spawn("npx", ["next", "start", "-p", PORT], {
  cwd: root,
  env: process.env,
  stdio: ["ignore", "pipe", "pipe"],
});
let serverLog = "";
server.stdout.on("data", (d) => (serverLog += d));
server.stderr.on("data", (d) => (serverLog += d));

async function waitForServer(timeoutMs = 40_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      // Any response at all means it's listening.
      await fetch(`${BASE}/api/scan`, { method: "POST" });
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  return false;
}

function pngFixture() {
  return readFileSync(resolve(root, "fixtures/sample-invoice.png"));
}

try {
  if (!(await waitForServer())) {
    console.error("\nServer did not start:\n", serverLog);
    process.exit(1);
  }

  section("Phase 2: request guards (no API key needed)");

  {
    const r = await fetch(`${BASE}/api/scan`, {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: "nope",
    });
    const b = await r.json();
    check("wrong content-type -> 400 bad_request", r.status === 400 && b.error?.code === "bad_request", `${r.status} ${b.error?.code}`);
  }
  {
    const form = new FormData();
    form.append("notimage", new Blob(["x"]), "x.txt");
    const r = await fetch(`${BASE}/api/scan`, { method: "POST", body: form });
    const b = await r.json();
    check("multipart without image field -> 400 no_image", r.status === 400 && b.error?.code === "no_image", `${r.status} ${b.error?.code}`);
  }
  {
    const r = await fetch(`${BASE}/api/scan`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mediaType: "image/png" }),
    });
    const b = await r.json();
    check("JSON without image -> 400 no_image", r.status === 400 && b.error?.code === "no_image", `${r.status} ${b.error?.code}`);
  }
  {
    const r = await fetch(`${BASE}/api/scan`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ image: "AAAA", mediaType: "application/pdf" }),
    });
    const b = await r.json();
    check("bad mediaType -> 415 unsupported_media_type", r.status === 415 && b.error?.code === "unsupported_media_type", `${r.status} ${b.error?.code}`);
  }
  {
    const form = new FormData();
    // 9 MB > the 8 MB cap.
    form.append("image", new Blob([new Uint8Array(9 * 1024 * 1024)], { type: "image/png" }), "big.png");
    const r = await fetch(`${BASE}/api/scan`, { method: "POST", body: form });
    const b = await r.json();
    check("oversize upload -> 413 payload_too_large", r.status === 413 && b.error?.code === "payload_too_large", `${r.status} ${b.error?.code}`);
  }

  if (!hasKey) {
    const form = new FormData();
    form.append("image", new Blob([pngFixture()], { type: "image/png" }), "invoice.png");
    const r = await fetch(`${BASE}/api/scan`, { method: "POST", body: form });
    const b = await r.json();
    check(
      "valid image without key -> 500 server_misconfigured",
      r.status === 500 && b.error?.code === "server_misconfigured",
      `${r.status} ${b.error?.code}`,
    );
  }

  section("Phase 3: live two-pass vision call");
  if (!hasKey) {
    console.log("  SKIPPED — ANTHROPIC_API_KEY is not set.");
    console.log("  This phase is the only real check that the model call works.");
    console.log("  Run `ANTHROPIC_API_KEY=sk-ant-... npm run smoke` before trusting the pipeline.");
  } else {
    const form = new FormData();
    form.append("image", new Blob([pngFixture()], { type: "image/png" }), "invoice.png");
    const started = Date.now();
    const r = await fetch(`${BASE}/api/scan`, { method: "POST", body: form });
    const b = await r.json();
    console.log(`  HTTP ${r.status} in ${Date.now() - started}ms`);
    console.log(JSON.stringify(b, null, 2));
    check("live scan returns 200", r.status === 200, `${r.status}`);
    check("live scan counted at least one item", Array.isArray(b.items) && b.items.length > 0);
    check(
      "non-food lines were not counted",
      Array.isArray(b.items) &&
        !b.items.some((i) => /paper towel|bleach/i.test(i.description ?? "")),
    );
  }
} finally {
  server.kill("SIGTERM");
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
