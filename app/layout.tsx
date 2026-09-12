/**
 * Minimal root layout. This repo is API-only — the real frontend lives on
 * Framer and calls /api/scan cross-origin. Do not grow this into a UI.
 */
export const metadata = {
  title: "VisionHack API",
  description: "Invoice scanning API. The frontend is hosted separately on Framer.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
