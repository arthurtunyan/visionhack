"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Logo } from "@/components/Logo";
import styles from "./pitch.module.css";

const SLIDES = 9;

/**
 * Nine slides, about thirty seconds each. Arrow keys, space or the rail move
 * between them; it also prints one slide per sheet if the room has no screen.
 */
export function Deck() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLElement | null)[]>([]);

  const goTo = (i: number) => {
    const target = refs.current[Math.max(0, Math.min(SLIDES - 1, i))];
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(e.key)) {
        e.preventDefault();
        goTo(active + 1);
      } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) {
        e.preventDefault();
        goTo(active - 1);
      } else if (e.key === "Home") {
        goTo(0);
      } else if (e.key === "End") {
        goTo(SLIDES - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const i = refs.current.indexOf(entry.target as HTMLElement);
            if (i >= 0) setActive(i);
          }
        }
      },
      { threshold: 0.5 },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const slide = (i: number, ground: "paper" | "tint" | "coal", body: React.ReactNode) => (
    <section
      key={i}
      ref={(el) => {
        refs.current[i] = el;
      }}
      className={styles.slide}
      data-ground={ground}
    >
      <div className={styles.inner}>{body}</div>
    </section>
  );

  return (
    <>
      <div className={styles.deck}>
        {/* 1 — Title */}
        {slide(
          0,
          "paper",
          <>
            <Logo height={38} />
            <h1 className={styles.title} style={{ marginTop: 40 }}>
              A corner store needs eight licences to open the doors.
              <br />
              Most owners track them on a wall calendar.
            </h1>
            <p className={styles.say}>
              Ledger keeps every one of them from lapsing, and checks the shelves
              against the stocking rule that decides whether the store keeps
              taking food benefits.
            </p>
          </>,
        )}

        {/* 2 — The world as it is */}
        {slide(
          1,
          "tint",
          <>
            <div className={styles.num}>01 — the problem</div>
            <h2 className={styles.title}>
              Compliance is not one form. It is eighteen programmes on eighteen
              clocks.
            </h2>
            <p className={styles.say}>
              Federal, state and county, each with its own renewal date, its own
              filing office and its own inspector. None of them talk to each
              other. None of them remind you in time.
            </p>
            <div className={styles.figures}>
              <div className={styles.figure}>
                <span className={styles.figValue}>18</span>
                <span className={styles.figLabel}>
                  programmes a small retailer can be judged on, across three
                  levels of government
                </span>
              </div>
              <div className={styles.figure}>
                <span className={styles.figValue}>8</span>
                <span className={styles.figLabel}>
                  of them a typical grocery store holds at once, each renewing on
                  a different date
                </span>
              </div>
              <div className={styles.figure}>
                <span className={styles.figValue}>0</span>
                <span className={styles.figLabel}>
                  systems that show an owner all of them in one place today
                </span>
              </div>
            </div>
          </>,
        )}

        {/* 3 — How the rule actually works */}
        {slide(
          2,
          "paper",
          <>
            <div className={styles.num}>02 — how the rule works</div>
            <h2 className={styles.title}>
              The one that closes stores is a shelf count, not a form.
            </h2>
            <p className={styles.say}>
              To keep accepting SNAP, a store has to carry, at all times:{" "}
              <strong>
                seven varieties and twenty-one units in each of four staple
                categories
              </strong>{" "}
              — dairy, grains, protein, fruit and vegetables — with a perishable
              item in at least three of them.
            </p>
            <div className={styles.figures}>
              <div className={styles.figure}>
                <span className={styles.figValue}>7</span>
                <span className={styles.figLabel}>
                  varieties per category. A 24-pack is one variety, not 24
                </span>
              </div>
              <div className={styles.figure}>
                <span className={styles.figValue}>21</span>
                <span className={styles.figLabel}>
                  sellable units per category. A case counts as what is inside it
                </span>
              </div>
              <div className={styles.figure}>
                <span className={styles.figValue}>3 of 4</span>
                <span className={styles.figLabel}>
                  categories must hold something perishable
                </span>
              </div>
            </div>
            <p className={styles.say} style={{ marginTop: 28 }}>
              No one sends a warning letter. One slow week of produce and the
              store is under the line without knowing it.
            </p>
          </>,
        )}

        {/* 4 — What it costs */}
        {slide(
          3,
          "coal",
          <>
            <div className={styles.num}>03 — what it costs</div>
            <h2 className={styles.title}>
              The penalty is not a fine. It is the register going dark.
            </h2>
            <div className={styles.cols}>
              <div>
                <div className={styles.colHead} data-tone="bad">
                  When it goes wrong
                </div>
                <ul className={styles.list}>
                  <li>Authorization is withdrawn, not fined.</li>
                  <li>
                    Re-applying takes months, with the store trading the whole
                    time without benefit customers.
                  </li>
                  <li>
                    For a store where a large share of sales run through food
                    benefits, that is most of the revenue.
                  </li>
                  <li>
                    A lapsed health permit or tobacco licence closes the door on
                    its own terms, separately.
                  </li>
                </ul>
              </div>
              <div>
                <div className={styles.colHead} data-tone="bad">
                  Why it keeps happening
                </div>
                <ul className={styles.list}>
                  <li>The rules live in PDFs nobody reads twice.</li>
                  <li>Renewal letters arrive at the store and get lost.</li>
                  <li>
                    Nothing in the store measures the shelf against the rule.
                  </li>
                  <li>
                    The owner is working the counter, not auditing categories.
                  </li>
                </ul>
              </div>
            </div>
          </>,
        )}

        {/* 5 — What we built */}
        {slide(
          4,
          "paper",
          <>
            <div className={styles.num}>04 — what we built</div>
            <h2 className={styles.title}>Photograph the invoice. Get the answer.</h2>
            <div className={styles.steps}>
              {[
                {
                  t: "Enter your licences",
                  b: "Programme, reference number, renewal date. Ten minutes, once.",
                },
                {
                  t: "We build the calendar",
                  b: "Every date, with reminders at 90, 30 and 7 days and what each filing needs.",
                },
                {
                  t: "Scan a delivery",
                  b: "A photo of the wholesale invoice. We read the lines and count sellable units by category.",
                },
                {
                  t: "Get a pass or fail",
                  b: "Scored against the real thresholds, with the specific items that would fix a short category.",
                },
              ].map((s, i) => (
                <div key={s.t} className={styles.step}>
                  <span className={styles.stepNum}>{i + 1}</span>
                  <div className={styles.stepTitle}>{s.t}</div>
                  <p className={styles.stepBody}>{s.b}</p>
                </div>
              ))}
            </div>
          </>,
        )}

        {/* 6 — The thing worth demoing */}
        {slide(
          5,
          "tint",
          <>
            <div className={styles.num}>05 — the part that matters</div>
            <h2 className={styles.title}>It is built to undercount.</h2>
            <p className={styles.say}>
              Telling a store it passes when it does not is the expensive
              mistake. A case priced by weight has no unit count to read, so we
              list it with the reason instead of guessing.
            </p>
            <p className={styles.quoteBig}>
              A short count you can check beats a confident number that is wrong.
            </p>
            <div className={styles.figures}>
              <div className={styles.figure}>
                <span className={styles.figValue}>4</span>
                <span className={styles.figLabel}>
                  lines held back on the sample invoice, each with the reason
                </span>
              </div>
              <div className={styles.figure}>
                <span className={styles.figValue}>0</span>
                <span className={styles.figLabel}>
                  lines counted that the scan was not certain about
                </span>
              </div>
              <div className={styles.figure}>
                <span className={styles.figValue}>2</span>
                <span className={styles.figLabel}>
                  languages, because the person at the back door is often not the
                  owner
                </span>
              </div>
            </div>
          </>,
        )}

        {/* 7 — Cadence */}
        {slide(
          6,
          "paper",
          <>
            <div className={styles.num}>06 — living with it</div>
            <h2 className={styles.title}>
              Thirty seconds a delivery. Ten minutes on day one.
            </h2>
            <div className={styles.timeline}>
              {[
                ["Day one", "Enter the licences and photograph the certificates", "you"],
                ["Immediately", "Rules matched, calendar built, reminders set", "ledger"],
                ["Every delivery", "Photograph the invoice at the back door", "you"],
                ["Every Monday", "Digest of what is due and what moved", "ledger"],
                ["90 / 30 / 7 days", "Renewal reminders with the office and the fee", "ledger"],
                ["At renewal", "File with the agency, mark it filed", "you"],
                ["Quarterly", "We re-read the published requirements for changes", "ledger"],
              ].map(([when, what, who]) => (
                <div key={when} className={styles.tlRow}>
                  <span className={styles.tlWhen}>{when}</span>
                  <span>{what}</span>
                  <span className={styles.tlWho} data-who={who}>
                    {who === "ledger" ? "Ledger" : "The owner"}
                  </span>
                </div>
              ))}
            </div>
          </>,
        )}

        {/* 8 — Scope and honesty */}
        {slide(
          7,
          "coal",
          <>
            <div className={styles.num}>07 — the scope</div>
            <h2 className={styles.title}>Eighteen programmes. One calendar.</h2>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 14,
                margin: "34px 0 8px",
              }}
            >
              {[
                "SNAP",
                "WIC",
                "EBT",
                "FDA",
                "EPA",
                "OSHA",
                "DOT",
                "TTB",
                "ABC",
                "W&M",
                "BAR",
                "TRL",
                "RSP",
                "BOP",
                "CHP",
                "FIRE",
                "BTC",
                "CoO",
              ].map((abbr) => (
                <Badge key={abbr} abbr={abbr} size={46} tone="dark" />
              ))}
            </div>
            <div className={styles.cols}>
              <div>
                <div className={styles.colHead} data-tone="good">
                  What we do
                </div>
                <ul className={styles.list}>
                  <li>Track every date and condition, in one place.</li>
                  <li>Score the shelf against the published thresholds.</li>
                  <li>Name the specific items that fix a short category.</li>
                  <li>Keep the record an inspector will ask for.</li>
                </ul>
              </div>
              <div>
                <div className={styles.colHead} data-tone="bad">
                  What we do not do
                </div>
                <ul className={styles.list}>
                  <li>File anything with an agency on your behalf.</li>
                  <li>Decide whether you are authorized. Only the agency does.</li>
                  <li>Give legal advice.</li>
                  <li>Sell or share your scan data.</li>
                </ul>
              </div>
            </div>
          </>,
        )}

        {/* 9 — Close */}
        {slide(
          8,
          "paper",
          <>
            <div className={styles.num}>08 — see it</div>
            <h2 className={styles.title}>
              It runs today. Scan an invoice and watch the score move.
            </h2>
            <p className={styles.say}>
              The demo scores a real wholesale invoice against the real
              thresholds. The dashboard is live: change a date and the calendar
              moves with it. The coverage page will hand you an .ics of your own
              renewal dates before you sign up for anything.
            </p>
            <div className={styles.links}>
              <Button href="/demo" size="lg">
                Run the scan
              </Button>
              <Button href="/dashboard" variant="secondary" size="lg">
                Open the dashboard
              </Button>
              <Button href="/coverage" variant="secondary" size="lg">
                Take the calendar
              </Button>
            </div>
          </>,
        )}
      </div>

      <nav className={styles.rail} aria-label="Slides">
        {Array.from({ length: SLIDES }, (_, i) => (
          <button
            key={i}
            type="button"
            className={styles.railDot}
            data-active={i === active}
            aria-label={`Slide ${i + 1}`}
            aria-current={i === active}
            onClick={() => goTo(i)}
          />
        ))}
      </nav>
      <span className={styles.counter}>
        {String(active + 1).padStart(2, "0")} / {SLIDES}
      </span>
      <span className={styles.hint}>Arrow keys to move</span>
    </>
  );
}
