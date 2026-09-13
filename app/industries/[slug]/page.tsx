import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Section } from "@/components/Section";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/Badge";
import { Reveal } from "@/components/Reveal";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Pricing } from "@/components/sections/Pricing";
import { CtaBand } from "@/components/sections/CtaBand";
import { INDUSTRIES, getIndustry } from "@/lib/site-content";
import styles from "./industry.module.css";

export function generateStaticParams() {
  return INDUSTRIES.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const industry = getIndustry(slug);
  if (!industry) return { title: "Industry not found" };
  return {
    title: `${industry.name}: permit & stocking tracking`,
    description: industry.intro,
  };
}

export default async function IndustryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const industry = getIndustry(slug);
  if (!industry) notFound();

  return (
    <>
      <Nav />
      <main>
        <PageHeader
          eyebrow={industry.name}
          title={industry.headline}
          intro={industry.intro}
        >
          <div className={styles.badges}>
            {industry.badges.map((b) => (
              <Badge key={b} abbr={b} size={52} showAbbr />
            ))}
          </div>
        </PageHeader>

        <Section ground="tint">
          <div className={styles.risksHead}>
            <Reveal>
              <h2 className="display">What actually goes wrong.</h2>
            </Reveal>
          </div>
          <div className={styles.risks}>
            {industry.risks.map((risk, i) => (
              <Reveal as="div" key={risk.title} delay={i * 0.05}>
                <div className={styles.riskCard}>
                  <span className={styles.riskNum}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className={styles.riskTitle}>{risk.title}</h3>
                  <p className="body mute">{risk.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Section>

        <HowItWorks />
        <Pricing />
        <CtaBand title={`See where your ${industry.name.toLowerCase()} store stands.`} />
      </main>
      <Footer />
    </>
  );
}
