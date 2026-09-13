import { ProgramIcon } from "./ProgramIcon";
import styles from "./Badge.module.css";

type Tone = "light" | "dark";

interface BadgeProps {
  /** Programme abbreviation, e.g. SNAP, WIC, EPA. */
  abbr: string;
  /** Optional caption under the tile. */
  caption?: string;
  tone?: Tone;
  /** Tile size in px. Spec floor is 44px. */
  size?: number;
  /** Show the abbreviation under the tile, above any caption. */
  showAbbr?: boolean;
}

/**
 * A programme badge is a Ledger-drawn mark on a tile. The mark comes from our
 * own icon set — it is never an agency logo or seal, which would imply an
 * endorsement we don't have.
 */
export function Badge({
  abbr,
  caption,
  tone = "light",
  size = 58,
  showAbbr = false,
}: BadgeProps) {
  return (
    <span className={styles.wrap}>
      <span
        className={styles.tile}
        data-tone={tone}
        style={{ width: size, height: size }}
        title={abbr}
      >
        <ProgramIcon abbr={abbr} size={Math.round(size * 0.46)} />
      </span>
      {showAbbr ? <span className={styles.abbr}>{abbr}</span> : null}
      {caption ? <span className={styles.caption}>{caption}</span> : null}
    </span>
  );
}
