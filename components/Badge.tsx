import styles from "./Badge.module.css";

type Tone = "light" | "dark";

interface BadgeProps {
  /** Programme abbreviation, e.g. SNAP, WIC, EPA. Rendered as text, never an image. */
  abbr: string;
  /** Optional caption under the tile. */
  caption?: string;
  tone?: Tone;
  /** Tile size in px. Spec floor is 44px. */
  size?: number;
}

/**
 * A programme badge is a typographic tile. It MUST NEVER render an agency
 * logo or seal — see brand rules and the non-affiliation line.
 */
export function Badge({ abbr, caption, tone = "light", size = 58 }: BadgeProps) {
  return (
    <span className={styles.wrap}>
      <span
        className={styles.tile}
        data-tone={tone}
        style={{ width: size, height: size }}
      >
        {abbr}
      </span>
      {caption ? <span className={styles.caption}>{caption}</span> : null}
    </span>
  );
}
