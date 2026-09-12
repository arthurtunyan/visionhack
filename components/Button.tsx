import type { ReactNode } from "react";
import Link from "next/link";
import styles from "./Button.module.css";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

interface BaseProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

interface LinkButton extends BaseProps {
  href: string;
}

interface ActionButton extends BaseProps {
  href?: undefined;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
}

type ButtonProps = LinkButton | ActionButton;

export function Button(props: ButtonProps) {
  const { variant = "primary", size = "md", className, children } = props;
  const cls = [styles.btn, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(" ");

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={cls}>
        {children}
      </Link>
    );
  }

  const { type = "button", onClick, disabled } = props as ActionButton;
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}
