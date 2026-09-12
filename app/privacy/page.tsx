import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { NON_AFFILIATION } from "@/lib/site-content";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How Ledger handles invoice photographs and store data.",
};

export default function PrivacyPage() {
  return (
    <>
      <Nav />
      <main>
        <PageHeader eyebrow="Legal" title="Privacy." />
        <Section ground="paper">
          <div className={styles.prose}>
            <p className={styles.updated}>Last updated 12 September 2026</p>

            <h2>What we collect</h2>
            <p>
              Ledger works from two things: the invoice photographs you upload and
              the permit details you enter. We store the transcribed line items and
              the resulting scorecards. We do not sell this data.
            </p>

            <h2>Invoice photographs</h2>
            <p>
              A photo is used to read its line items and is then retained only so you
              can review the scan that produced a scorecard. You can delete a scan,
              and its photo, at any time.
            </p>

            <h2>What we don&apos;t do</h2>
            <p>
              We do not share your data with any agency or programme.{" "}
              <strong>{NON_AFFILIATION}</strong> No scorecard is an authorization
              decision, and none is reported to anyone but you.
            </p>

            <h2>Contact</h2>
            <p>Questions about privacy: privacy@ledger.co</p>
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
