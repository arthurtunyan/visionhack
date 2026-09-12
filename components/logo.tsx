/* The brand lockup is shipped as an SVG with an outlined wordmark, so it never
 * depends on a font. On paper white we use the standard (non-inverse) file. */
export function Logo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/ledger-lockup.svg"
      alt="Ledger"
      className={className}
      draggable={false}
    />
  );
}
