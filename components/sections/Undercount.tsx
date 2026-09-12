import { Section } from "@/components/Section";
import { Reveal } from "@/components/Reveal";
import { CountUp } from "@/components/CountUp";
import { DataTable } from "@/components/DataTable";
import styles from "./sections.module.css";

const COLUMNS = [
  { key: "line", header: "Line" },
  { key: "pack", header: "Pack" },
  { key: "why", header: "Why it was not counted" },
];

const ROWS = [
  { line: "ROMA TOMATOES", pack: "25 LB CS", why: "Priced by weight — no unit count" },
  { line: "YELLOW ONIONS JUMBO", pack: "50 LB SACK", why: "Priced by weight — no unit count" },
  { line: "SWEET CREAM BUTTER", pack: "36 x 4 OZ", why: "Accessory food — counts for nothing" },
  { line: "PAPER TOWELS 2PLY", pack: "30 ROLL", why: "Not a staple category" },
];

export function Undercount() {
  return (
    <Section ground="paper">
      <div className={styles.ucGrid}>
        <div className={styles.ucLeft}>
          <Reveal>
            <h2 className="display">Built to undercount.</h2>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="body">
              Telling a store it passes when it doesn&apos;t is the expensive
              mistake. A case priced by weight has no unit count to read, so Ledger
              lists it with the reason instead of inventing a number.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className={styles.ucRule} />
            <div className={`${styles.ucBigNum} tnum`}>
              <CountUp to={4} />
            </div>
            <p className={styles.ucCaption}>lines held back on this invoice</p>
            <p className={styles.ucSub}>Four held back beats one wrong total.</p>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <DataTable columns={COLUMNS} rows={ROWS} />
        </Reveal>
      </div>
    </Section>
  );
}
