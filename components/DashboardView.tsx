import { Badge } from "@/components/Badge";
import { CategoryBar } from "@/components/CategoryBar";
import { Pill } from "@/components/Pill";
import { StatRing } from "@/components/StatRing";
import { Logo } from "@/components/Logo";
import styles from "./DashboardView.module.css";

type RowTone = "bad" | "warn" | "ok";

const PERMITS: {
  abbr: string;
  name: string;
  ref: string;
  due: string;
  status: string;
  tone: RowTone;
}[] = [
  {
    abbr: "CHP",
    name: "County health permit",
    ref: "LA-HP-44192",
    due: "21 Sep 2026",
    status: "9 days",
    tone: "bad",
  },
  {
    abbr: "SNAP",
    name: "SNAP retailer authorization",
    ref: "FNS 0271883",
    due: "4 Nov 2026",
    status: "Stocking review",
    tone: "warn",
  },
  {
    abbr: "TRL",
    name: "Tobacco retail licence",
    ref: "CDTFA 77-210",
    due: "31 Dec 2026",
    status: "110 days",
    tone: "ok",
  },
  {
    abbr: "W&M",
    name: "Weights and measures",
    ref: "LA-WM-8821",
    due: "14 Jun 2027",
    status: "On file",
    tone: "ok",
  },
  {
    abbr: "ABC",
    name: "Off-sale beer and wine",
    ref: "ABC 20-551903",
    due: "1 Aug 2027",
    status: "On file",
    tone: "ok",
  },
  {
    abbr: "BTC",
    name: "Business tax certificate",
    ref: "LA-BTC-30117",
    due: "31 Jan 2027",
    status: "142 days",
    tone: "ok",
  },
  {
    abbr: "EBT",
    name: "EBT benefit acceptance",
    ref: "Terminal 4471",
    due: "Continuous",
    status: "Active",
    tone: "ok",
  },
  {
    abbr: "WIC",
    name: "WIC vendor authorization",
    ref: "CA-WIC-6612",
    due: "30 Sep 2026",
    status: "Price list due",
    tone: "warn",
  },
];

/** The product view: what a store owner sees after signing in. */
export function DashboardView() {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <Logo variant="mark" height={22} />
          <span>Rivera&apos;s Corner Market</span>
        </div>
        <nav className={styles.nav}>
          <span data-active="true">Overview</span>
          <span>Permits</span>
          <span>Renewals</span>
          <span>Scans</span>
          <span>Stores</span>
        </nav>
        <div className={styles.sideCard}>
          <span className={styles.sideLabel}>Next due</span>
          <span className={styles.sideValue}>County health permit</span>
          <span className={styles.sideMeta}>21 Sep 2026 · 9 days</span>
        </div>
      </aside>

      <div className={styles.main}>
        <div className={styles.topRow}>
          <div>
            <h2 className={styles.h2}>Overview</h2>
            <p className={styles.sub}>8 licences tracked · 1 needs attention this week</p>
          </div>
          <Pill tone="bad">1 action needed</Pill>
        </div>

        <div className={styles.cards}>
          <div className={styles.card}>
            <span className={styles.cardLabel}>Licences held</span>
            <span className={`${styles.cardValue} tnum`}>8</span>
            <span className={styles.cardMeta}>All entered and verified</span>
          </div>
          <div className={styles.card}>
            <span className={styles.cardLabel}>Due in 30 days</span>
            <span className={`${styles.cardValue} tnum`} data-alert="true">
              2
            </span>
            <span className={styles.cardMeta}>Health permit, WIC price list</span>
          </div>
          <div className={styles.card}>
            <span className={styles.cardLabel}>Last invoice scan</span>
            <span className={`${styles.cardValue} tnum`}>12 Sep</span>
            <span className={styles.cardMeta}>84 units counted</span>
          </div>
        </div>

        <div className={styles.split}>
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>SNAP stocking review</h3>
            <div className={styles.scoreRow}>
              <StatRing percent={75} size={124} tone="bad" label="clear" />
              <div className={styles.bars}>
                <CategoryBar name="Dairy" count={4} target={7} index={0} />
                <CategoryBar name="Grains" count={7} target={7} index={1} />
                <CategoryBar name="Protein" count={7} target={7} index={2} />
                <CategoryBar name="Produce" count={7} target={7} index={3} />
              </div>
            </div>
            <p className={styles.panelNote}>
              Dairy is 3 varieties and 7 units short. The other three categories clear.
            </p>
          </div>

          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>This week</h3>
            <ol className={styles.todo}>
              <li>
                <Pill tone="bad">9 days</Pill>
                <span>Renew the county health permit</span>
              </li>
              <li>
                <Pill tone="warn">18 days</Pill>
                <span>File the WIC price list</span>
              </li>
              <li>
                <Pill tone="warn">Before 4 Nov</Pill>
                <span>Add 3 dairy varieties</span>
              </li>
            </ol>
          </div>
        </div>

        <div className={styles.panel}>
          <h3 className={styles.panelTitle}>Every licence, one calendar</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Programme</th>
                <th>Reference</th>
                <th>Next date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {PERMITS.map((p) => (
                <tr key={p.ref}>
                  <td>
                    <span className={styles.permitCell}>
                      <Badge abbr={p.abbr} size={36} />
                      <span>
                        <span className={styles.permitName}>{p.name}</span>
                        <span className={styles.permitAbbr}>{p.abbr}</span>
                      </span>
                    </span>
                  </td>
                  <td className={styles.mono}>{p.ref}</td>
                  <td className={styles.mono}>{p.due}</td>
                  <td>
                    <Pill tone={p.tone}>{p.status}</Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
