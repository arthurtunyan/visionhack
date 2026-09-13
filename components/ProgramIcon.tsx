interface ProgramIconProps {
  /** Programme abbreviation, e.g. SNAP, WIC, EPA. */
  abbr: string;
  size?: number;
}

/**
 * Ledger's own mark for each programme we track. These are drawn here, in
 * house, and are deliberately nothing like an agency logo or seal: using a
 * real one would imply an endorsement we don't have (see NON_AFFILIATION).
 */
const PATHS: Record<string, React.ReactNode> = {
  // Shopping basket — food benefits.
  SNAP: (
    <>
      <path d="M3.5 8.5h17l-1.7 9a2 2 0 0 1-2 1.6H7.2a2 2 0 0 1-2-1.6z" />
      <path d="M8.5 8.5 11 4m5.5 4.5L14 4" />
      <path d="M9.5 12.5v3m5-3v3" />
    </>
  ),
  // Bottle and apple — vendor food list.
  WIC: (
    <>
      <path d="M7.5 4.5h3v2.2l1.2 1.6v9.2a2 2 0 0 1-2 2H8.3a2 2 0 0 1-2-2V8.3l1.2-1.6z" />
      <path d="M6.3 11.5h5.4" />
      <path d="M17.4 9.2c1.7 0 2.8 1.4 2.8 3.5 0 2.8-1.5 6-2.8 6-.5 0-.8-.3-1.4-.3s-.9.3-1.4.3c-1.3 0-2.4-2.4-2.4-4.6" />
      <path d="M17.4 9.2V7" />
    </>
  ),
  // Payment card with a chip.
  EBT: (
    <>
      <rect x="2.8" y="5.5" width="18.4" height="13" rx="2.2" />
      <path d="M2.8 9.8h18.4" />
      <rect x="6" y="12.4" width="4" height="3.2" rx="0.8" />
    </>
  ),
  // Leaf over water — environment.
  EPA: (
    <>
      <path d="M19 4.5c0 7.4-3.4 11-8.4 11A4.6 4.6 0 0 1 6 10.9C6 6.6 11 4.5 19 4.5z" />
      <path d="M7.5 15.5C10 12 13.5 9.3 17 8" />
      <path d="M3 19.5c1.5 0 1.5 1 3 1s1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1" />
    </>
  ),
  // Hard hat — workplace safety.
  OSHA: (
    <>
      <path d="M3.6 16.5a8.4 8.4 0 0 1 16.8 0z" />
      <path d="M9.2 16.5V6.4a1.4 1.4 0 0 1 1.4-1.4h2.8a1.4 1.4 0 0 1 1.4 1.4v10.1" />
      <path d="M2.5 19.5h19" />
    </>
  ),
  // Bottle with a label band — alcohol licence.
  ABC: (
    <>
      <path d="M9.4 2.8h5.2v3.4l1.9 2.8v10.6a2 2 0 0 1-2 2H9.5a2 2 0 0 1-2-2V9l1.9-2.8z" />
      <path d="M7.5 11.4h9m-9 4.6h9" />
    </>
  ),
  // Box on a truck bed — hazmat shipping.
  DOT: (
    <>
      <path d="M1.8 6.5h11.4v10.2H1.8z" />
      <path d="M13.2 10h4l3 3.4v3.3h-7z" />
      <circle cx="6.4" cy="18.6" r="1.9" />
      <circle cx="16.8" cy="18.6" r="1.9" />
      <path d="M5.6 9.6h3.8v3.8H5.6z" />
    </>
  ),
  // Clipboard with a tick — health inspection.
  CHP: (
    <>
      <path d="M6.5 5.5H5a1.6 1.6 0 0 0-1.6 1.6v11.4A1.6 1.6 0 0 0 5 20.1h14a1.6 1.6 0 0 0 1.6-1.6V7.1A1.6 1.6 0 0 0 19 5.5h-1.5" />
      <rect x="8.2" y="3.3" width="7.6" height="4" rx="1.2" />
      <path d="m8.4 13.6 2.5 2.5 4.7-5" />
    </>
  ),
  // Balance scale — weights and measures.
  "W&M": (
    <>
      <path d="M12 4.2v15.3" />
      <path d="M7 19.5h10" />
      <path d="M4.4 7.6h15.2" />
      <path d="M4.4 7.6 1.8 13.4h5.2zM19.6 7.6 17 13.4h5.2" />
      <path d="M1.8 13.4a2.6 2.6 0 0 0 5.2 0M17 13.4a2.6 2.6 0 0 0 5.2 0" />
    </>
  ),
  // Cigarette and smoke — tobacco retail.
  TRL: (
    <>
      <rect x="2.6" y="14.4" width="14.6" height="4.4" rx="1.2" />
      <path d="M13.4 14.4v4.4" />
      <rect x="18.4" y="14.4" width="3" height="4.4" rx="1.2" />
      <path d="M16.4 11.4c1.8-1.2 1.8-3 0-4.2s-1.8-3 0-4.2" />
      <path d="M20.4 11.4c1.3-1 1.3-2.4 0-3.4" />
    </>
  ),
  // Sealed federal permit.
  TTB: (
    <>
      <circle cx="12" cy="10.2" r="5.6" />
      <path d="M9.6 10.4 11.3 12l3.2-3.2" />
      <path d="m8.6 15 -1.2 6 4.6-2.4 4.6 2.4-1.2-6" />
    </>
  ),
  // Facility building — food facility registration.
  FDA: (
    <>
      <path d="M3.4 20.1V9.4l8.6-5 8.6 5v10.7z" />
      <path d="M2 20.1h20" />
      <path d="M12 15.8V9.4m-3.2 3.2h6.4" />
    </>
  ),
  // Wrench — automotive repair.
  BAR: (
    <>
      <path d="M15.4 3.6a5.2 5.2 0 0 0-4 8.7L4.8 18.9a1.8 1.8 0 0 0 2.5 2.5l6.6-6.6a5.2 5.2 0 0 0 6.4-6.9l-2.9 2.9-2.8-.7-.7-2.8z" />
    </>
  ),
  // Receipt — seller's permit and resale.
  RSP: (
    <>
      <path d="M5.4 3.4h13.2v17.2l-2.6-1.6-2.6 1.6-2.6-1.6-2.6 1.6-2.8-1.6z" />
      <path d="M8.6 8.2h6.8m-6.8 4h6.8" />
    </>
  ),
  // Mortar and pestle — pharmacy.
  BOP: (
    <>
      <path d="M5.2 9.6h13.6v2.2a6.8 6.8 0 0 1-13.6 0z" />
      <path d="M12 18.6v2.2" />
      <path d="M8 20.8h8" />
      <path d="M9 9.6 14.6 4a2.4 2.4 0 0 1 3.4 3.4l-2.2 2.2" />
    </>
  ),
  // Flame — fire marshal.
  FIRE: (
    <>
      <path d="M12 2.8c3.4 3.4 6.4 6 6.4 10.2a6.4 6.4 0 1 1-12.8 0c0-2 .9-3.6 2.2-5.2.6 1.2 1.4 2 2.4 2.4-.4-2.6.4-5 1.8-7.4z" />
      <path d="M12 20.4a3 3 0 0 1-1.4-5.6c.3.7.8 1.2 1.4 1.5.6-.9.9-1.9.9-3 1 1.2 2 2.4 2 4.1a3 3 0 0 1-2.9 3z" />
    </>
  ),
  // Stamped tax certificate.
  BTC: (
    <>
      <path d="M5 3.4h9.6L19 7.8v12.8H5z" />
      <path d="M14.2 3.6v4.4h4.4" />
      <path d="M8.4 12.4h7.2m-7.2 4h4.4" />
    </>
  ),
  // Door and key — certificate of occupancy.
  CoO: (
    <>
      <path d="M4.4 20.6V4.4a1 1 0 0 1 1-1h9.2a1 1 0 0 1 1 1v16.2" />
      <path d="M2.8 20.6h18.4" />
      <circle cx="12.6" cy="12.4" r="1.2" />
    </>
  ),
};

const FALLBACK = (
  <>
    <path d="M4 4.6h16v14.8H4z" />
    <path d="M8 9.4h8m-8 5h5" />
  </>
);

export function ProgramIcon({ abbr, size = 24 }: ProgramIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[abbr] ?? FALLBACK}
    </svg>
  );
}
