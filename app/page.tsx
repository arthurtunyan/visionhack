/**
 * Placeholder root page so Vercel has something to serve. The real UI is on
 * Framer; this repo is API-only. Do not build the frontend here.
 */
export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: 32, lineHeight: 1.5 }}>
      <h1 style={{ fontSize: 20, margin: 0 }}>VisionHack API</h1>
      <p style={{ color: "#555" }}>
        API-only deployment. The interface is hosted separately on Framer.
      </p>
      <p style={{ color: "#555" }}>
        Endpoint: <code>POST /api/scan</code>
      </p>
    </main>
  );
}
