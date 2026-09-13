import Link from "next/link";
import { Logo } from "./Logo";
import { FOOTER_COLUMNS, NON_AFFILIATION } from "@/lib/site-content";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brandCol}>
          <Logo height={40} />
          <p className={styles.tagline}>
            Permit and stocking compliance for independent retailers.
          </p>
        </div>

        <div className={styles.columns}>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className={styles.column}>
              <h3 className={styles.colTitle}>{col.title}</h3>
              <ul className={styles.colLinks}>
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={styles.colLink}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.legal}>
        <p className={styles.nonAffiliation}>{NON_AFFILIATION}</p>
        <div className={styles.meta}>
          <span>© 2026 Ledger</span>
          <span>Los Angeles, CA</span>
        </div>
      </div>
    </footer>
  );
}
