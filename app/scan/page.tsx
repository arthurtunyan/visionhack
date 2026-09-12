"use client";

/**
 * Photograph an invoice, get a staple-stocking scorecard.
 *
 * The image is downscaled in the browser before it is posted. A phone photo is
 * routinely 4-8 MB, the route caps uploads well below that, and the model reads
 * a 1600px invoice as well as a 4000px one.
 *
 * When the server has no key the demo does not die: it shows a clearly labelled
 * sample scorecard so the flow can still be walked through.
 */
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { MOCK_RESULT, type ScanResult } from "@/lib/mock-data";
import { SNAP_RULE } from "@/lib/compliance";
import type { ExcludedItem, ScanResponse } from "@/lib/types";
import { Card, Page, PageHead, Pill } from "@/components/Shell";
import { useStore } from "@/components/useStore";

/** Longest edge, in pixels, that we post. */
const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.82;

async function downscale(file: File): Promise<Blob> {
  // Anything the browser cannot decode goes up untouched and the route decides.
  if (typeof createImageBitmap !== "function") return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 2_000_000) return file;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
  );
  return blob ?? file;
}

const FRIENDLY_ERROR: Record<string, string> = {
  server_misconfigured: "The scanner has no API key on this deployment yet.",
  payload_too_large: "That image is too large even after downscaling. Try a tighter crop.",
  unsupported_media_type: "That file type is not an image the scanner reads.",
  no_image: "No image came through. Pick a file and try again.",
  rate_limited: "The model is rate limited right now. Wait a moment and scan again.",
  upstream_unreachable: "Could not reach the model. Check the connection and try again.",
  model_refused: "The model would not read that image. Try a clearer photo of the invoice.",
  unparseable_model_output: "The model's answer came back malformed. Scanning again usually fixes it.",
};

/**
 * Renders the backend's scorecard as returned. Nothing here re-scores: the
 * verdict, the counts and the fix list all come from the response. The only
 * numbers this component supplies are the denominators, and those are imported
 * from the same rule engine the backend scored with.
 */
function Scorecard({
  result,
  excluded,
  sample,
}: {
  result: ScanResult;
  excluded: ExcludedItem[];
  sample: boolean;
}) {
  const passed = result.overallStatus === "pass";
  return (
    <>
      {sample ? (
        <div className="notice notice-warn">
          <strong>Sample scorecard.</strong> This is fixture data, not a reading of your
          invoice. Set <code>OPENROUTER_API_KEY</code> in the Vercel project settings and
          redeploy to scan for real.
        </div>
      ) : null}

      <Card title={`Scorecard — ${result.storeName}`}>
        <div className="stat-row">
          <div>
            <div className="stat-label">Verdict</div>
            <div style={{ marginTop: 4 }}>
              <Pill status={passed ? "ok" : "critical"}>
                {passed ? "Meets the standard" : "Short of the standard"}
              </Pill>
            </div>
          </div>
          <div>
            <div className="stat-label">Total stocking units</div>
            <div className="stat-value num">
              {result.totalUnits} / {SNAP_RULE.totalUnits}
            </div>
          </div>
          <div>
            <div className="stat-label">Categories with a perishable</div>
            <div className="stat-value num">
              {result.perishableCategoriesMet} / {SNAP_RULE.perishableCategoriesRequired}
            </div>
          </div>
          <div>
            <div className="stat-label">Scanned</div>
            <div className="stat-value num">{result.scanDate}</div>
          </div>
        </div>
      </Card>

      {result.categories.map((c) => {
        const met = c.varietiesFound >= SNAP_RULE.varietiesPerCategory;
        return (
          <Card key={c.category} title={c.label}>
            <div className="stat-row">
              <div>
                <div className="stat-label">Varieties</div>
                <div className="stat-value num">
                  {c.varietiesFound} / {SNAP_RULE.varietiesPerCategory}
                </div>
              </div>
              <div>
                <div className="stat-label">Units</div>
                <div className="stat-value num">{c.unitsFound}</div>
              </div>
              <div>
                <div className="stat-label">Perishable</div>
                <div style={{ marginTop: 4 }}>
                  <Pill status={c.hasPerishable ? "ok" : "soon"}>
                    {c.hasPerishable ? "Yes" : "None"}
                  </Pill>
                </div>
              </div>
              <div>
                <div className="stat-label">Status</div>
                <div style={{ marginTop: 4 }}>
                  <Pill status={met ? "ok" : "critical"}>{met ? "Met" : "Short"}</Pill>
                </div>
              </div>
            </div>
            {c.items.length > 0 ? (
              <table className="table" style={{ marginTop: 14 }}>
                <thead>
                  <tr>
                    <th>Counted on the invoice</th>
                    <th style={{ width: 190 }}>Variety</th>
                    <th style={{ width: 70 }}>Units</th>
                  </tr>
                </thead>
                <tbody>
                  {c.items.map((item) => (
                    <tr key={`${c.category}-${item.name}`}>
                      <td>{item.name}</td>
                      <td>{item.variety}</td>
                      <td className="num">{item.units}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </Card>
        );
      })}

      {excluded.length > 0 ? (
        <Card title="Seen but not counted">
          <p className="card-note">
            These lines were read off the invoice and deliberately left out of the score.
            They stay visible so nothing looks lost, and they never count toward a category.
          </p>
          <table className="table" style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>Line on the invoice</th>
                <th style={{ width: 320 }}>Why it was left out</th>
              </tr>
            </thead>
            <tbody>
              {excluded.map((item) => (
                <tr key={item.description}>
                  <td>{item.description}</td>
                  <td>{item.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : null}

      {result.fixes.length > 0 ? (
        <Card title="What to add">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 110 }}>Category</th>
                <th style={{ width: 300 }}>Add</th>
                <th>Why it helps</th>
              </tr>
            </thead>
            <tbody>
              {result.fixes.map((fix) => (
                <tr key={fix.itemSuggestion}>
                  <td>{fix.category}</td>
                  <td style={{ fontWeight: 500 }}>{fix.itemSuggestion}</td>
                  <td>{fix.whyItHelps}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : null}

      <p className="caveat">
        This is a preparation estimate, not an official USDA or FNS determination. Only
        FNS decides whether a store meets the standard.
      </p>
    </>
  );
}

export default function Scan() {
  const { store } = useStore();
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [resultEs, setResultEs] = useState<ScanResult | null>(null);
  const [excluded, setExcluded] = useState<ExcludedItem[]>([]);
  const [locale, setLocale] = useState<"en" | "es">("en");
  const [sample, setSample] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onPick(file: File) {
    setError(null);
    setResult(null);
    setResultEs(null);
    setExcluded([]);
    setSample(false);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(file);
    });
    setBusy(true);
    try {
      const blob = await downscale(file);
      const form = new FormData();
      form.append("image", blob, "invoice.jpg");
      if (store?.name) form.append("storeName", store.name);

      const res = await fetch("/api/scan", { method: "POST", body: form });
      const body = (await res.json()) as ScanResponse;

      if (body.ok) {
        setResult(body.scorecard);
        setResultEs(body.scorecardEs);
        setExcluded(body.excluded);
        return;
      }
      const code = body.error.code;
      setError(FRIENDLY_ERROR[code] ?? body.error.message);
      // Without a key there is nothing to demo, so show the fixture instead.
      if (code === "server_misconfigured") {
        setResult(MOCK_RESULT);
        setSample(true);
      }
    } catch {
      setError("The scan request failed before it reached the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page>
      <PageHead title="Scan an invoice">
        Photograph a delivery invoice and it is scored against the staple-stocking
        standard. Orders from the last {SNAP_RULE.recentOrderWindowDays} days count toward
        stock, which is what makes an invoice evidence.
      </PageHead>

      <Card title="The invoice">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onPick(file);
          }}
        />
        <div className="btn-row" style={{ marginTop: 0 }}>
          <button
            type="button"
            className="btn"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? "Reading…" : "Choose or photograph an invoice"}
          </button>
          {result ? (
            <Link className="btn btn-secondary" href="/c/snap">
              Open the stocking calculator
            </Link>
          ) : null}
          {resultEs ? (
            <button
              type="button"
              className="btn btn-secondary"
              // Both languages came back on the one scan, so this never refetches.
              onClick={() => setLocale((l) => (l === "en" ? "es" : "en"))}
            >
              {locale === "en" ? "Ver en español" : "View in English"}
            </button>
          ) : null}
        </div>

        {preview ? (
          <div style={{ marginTop: 14 }}>
            <Image
              src={preview}
              alt="The invoice being scanned"
              width={280}
              height={280}
              unoptimized
              style={{
                width: 280,
                height: "auto",
                border: "1px solid var(--line)",
                borderRadius: "var(--radius)",
              }}
            />
          </div>
        ) : (
          <p className="card-note" style={{ marginTop: 12 }}>
            Nothing scanned yet. The photo is sent to the scanner and is not stored.
          </p>
        )}

        {error ? (
          <div className="notice notice-fail" style={{ marginTop: 14 }}>
            <strong>Scan failed.</strong> {error}
          </div>
        ) : null}
      </Card>

      {result ? (
        <Scorecard
          result={locale === "es" && resultEs ? resultEs : result}
          excluded={excluded}
          sample={sample}
        />
      ) : null}
    </Page>
  );
}
