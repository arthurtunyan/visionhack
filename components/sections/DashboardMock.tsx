import { CategoryBar } from "@/components/CategoryBar";
import { Pill } from "@/components/Pill";
import { StatRing } from "@/components/StatRing";
import styles from "./DashboardMock.module.css";

/**
 * Static preview of the scorecard, shown inside the hero AppWindow.
 *
 * The counts here have to stay consistent with the ring and the fix row, and
 * with the real threshold: three categories at 7 varieties and dairy short by
 * two is what "75% passing, 3 of 4" actually describes.
 */
export function DashboardMock() {
  return (
    <div className={styles.mock}>
      <div className={styles.sidebar}>
        <div className={styles.brandRow}>Corner Market</div>
        <nav className={styles.nav}>
          <span data-active="true">Scorecard</span>
          <span>Permits</span>
          <span>Renewals</span>
          <span>History</span>
        </nav>
        <div className={styles.sideStat}>
          <span className={styles.sideStatLabel}>Next due</span>
          <span className={styles.sideStatValue}>Health permit</span>
          <span className={styles.sideStatMeta}>9 days</span>
        </div>
      </div>

      <div className={styles.main}>
        <div className={styles.header}>
          <div>
            <div className={styles.eyebrow}>WEEKLY SCORECARD</div>
            <h3 className={styles.title}>SNAP stocking review</h3>
          </div>
          <Pill tone="bad">Action needed</Pill>
        </div>

        <div className={styles.grid}>
          <div className={styles.ringCard}>
            <StatRing percent={75} size={132} label="Passing" />
            <p className={styles.ringNote}>3 of 4 categories meet the threshold.</p>
          </div>
          <div className={styles.bars}>
            <CategoryBar name="Dairy" count={5} index={0} />
            <CategoryBar name="Grains" count={7} index={1} />
            <CategoryBar name="Protein" count={7} index={2} />
            <CategoryBar name="Produce" count={7} index={3} />
          </div>
        </div>

        <div className={styles.fixRow}>
          <span className={styles.fixDot} aria-hidden="true" />
          <span className={styles.fixText}>Add 2 dairy varieties</span>
          <span className={styles.fixMeta}>Blocks review</span>
        </div>
      </div>
    </div>
  );
}
