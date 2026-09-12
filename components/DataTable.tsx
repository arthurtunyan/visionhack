import type { ReactNode } from "react";
import styles from "./DataTable.module.css";

export interface Column {
  key: string;
  header: string;
  /** Right-align numeric columns and add tabular numerals. */
  numeric?: boolean;
}

interface DataTableProps {
  columns: Column[];
  rows: Record<string, ReactNode>[];
  /** Distinct treatment for the "couldn't read" table. */
  variant?: "default" | "held";
  caption?: string;
}

export function DataTable({ columns, rows, variant = "default", caption }: DataTableProps) {
  return (
    <div className={styles.scroll}>
      <table className={styles.table} data-variant={variant}>
        {caption ? <caption className={styles.caption}>{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={col.numeric ? styles.numeric : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={col.numeric ? styles.numeric : undefined}
                  data-label={col.header}
                >
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
