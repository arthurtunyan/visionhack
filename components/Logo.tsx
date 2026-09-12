import Image from "next/image";

interface LogoProps {
  variant?: "lockup" | "mark";
  inverse?: boolean;
  height?: number;
  className?: string;
}

const SRC = {
  lockup: { light: "/ledger-lockup.svg", dark: "/ledger-lockup-inverse.svg" },
  mark: { light: "/ledger-mark.svg", dark: "/ledger-mark-inverse.svg" },
};

/** Ratios from the source SVG viewBoxes (lockup ~ 232x64, mark 64x64). */
const RATIO = { lockup: 232 / 64, mark: 1 };

export function Logo({
  variant = "lockup",
  inverse = false,
  height = 26,
  className,
}: LogoProps) {
  const src = SRC[variant][inverse ? "dark" : "light"];
  const width = Math.round(height * RATIO[variant]);
  return (
    <Image
      src={src}
      alt="Ledger"
      width={width}
      height={height}
      className={className}
      priority
    />
  );
}
