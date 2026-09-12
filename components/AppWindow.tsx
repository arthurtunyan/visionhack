import type { ReactNode } from "react";
import styles from "./AppWindow.module.css";

interface AppWindowProps {
  url?: string;
  children: ReactNode;
  className?: string;
}

export function AppWindow({ url = "app.ledger.co", children, className }: AppWindowProps) {
  return (
    <div className={[styles.window, className].filter(Boolean).join(" ")}>
      <div className={styles.chrome}>
        <span className={styles.dots} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className={styles.url}>{url}</span>
        <span className={styles.spacer} aria-hidden="true" />
      </div>
      <div className={styles.body}>{children}</div>
    </div>
  );
}
