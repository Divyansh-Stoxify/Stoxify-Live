import type { CSSProperties, HTMLAttributes } from "react";

export type IconName =
  | "arrowRight"
  | "barChart"
  | "bell"
  | "badge"
  | "banknote"
  | "check"
  | "chevronRight"
  | "creditCard"
  | "fileBadge"
  | "fileText"
  | "folder"
  | "flame"
  | "link"
  | "lineChart"
  | "listChecks"
  | "lock"
  | "mail"
  | "receipt"
  | "scale"
  | "search"
  | "send"
  | "shieldCheck"
  | "sparkle"
  | "star"
  | "store"
  | "target"
  | "timer"
  | "trendingDown"
  | "trendingUp"
  | "users"
  | "wallet"
  | "x"
  | "zap"
  | "eye"
  | "eyeOff"
  | "google"
  | "apple";

const icons: Record<IconName, string> = {
  arrowRight: "fa-solid fa-arrow-right",
  barChart: "fa-solid fa-chart-column",
  badge: "fa-solid fa-certificate",
  banknote: "fa-solid fa-money-bill-wave",
  bell: "fa-solid fa-bell",
  check: "fa-solid fa-check",
  chevronRight: "fa-solid fa-chevron-right",
  creditCard: "fa-solid fa-credit-card",
  eye: "fa-solid fa-eye",
  eyeOff: "fa-solid fa-eye-slash",
  fileBadge: "fa-solid fa-file-circle-check",
  fileText: "fa-solid fa-file-lines",
  flame: "fa-solid fa-fire",
  folder: "fa-solid fa-folder-open",
  google: "fa-brands fa-google",
  apple: "fa-brands fa-apple",
  link: "fa-solid fa-link",
  lineChart: "fa-solid fa-chart-line",
  listChecks: "fa-solid fa-list-check",
  lock: "fa-solid fa-lock",
  mail: "fa-solid fa-envelope",
  receipt: "fa-solid fa-receipt",
  scale: "fa-solid fa-scale-balanced",
  search: "fa-solid fa-magnifying-glass",
  send: "fa-solid fa-paper-plane",
  shieldCheck: "fa-solid fa-shield-halved",
  sparkle: "fa-solid fa-wand-magic-sparkles",
  star: "fa-solid fa-star",
  store: "fa-solid fa-store",
  target: "fa-solid fa-bullseye",
  timer: "fa-solid fa-stopwatch",
  trendingDown: "fa-solid fa-arrow-trend-down",
  trendingUp: "fa-solid fa-arrow-trend-up",
  users: "fa-solid fa-users",
  wallet: "fa-solid fa-wallet",
  x: "fa-solid fa-xmark",
  zap: "fa-solid fa-bolt",
};

function getFontSize(className?: string): CSSProperties["fontSize"] {
  if (!className) return undefined;

  const arbitraryHeight = className.match(/(?:^|\s)h-\[([^\]]+)\]/);
  if (arbitraryHeight) return arbitraryHeight[1];

  const spacingHeight = className.match(/(?:^|\s)h-(\d+(?:\.\d+)?)(?:\s|$)/);
  if (!spacingHeight) return undefined;

  return `${Number(spacingHeight[1]) * 0.25}rem`;
}

export function Icon({
  name,
  className,
  style,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { name: IconName }) {
  const fontSize = getFontSize(className);

  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center justify-center leading-none ${className ?? ""}`}
      style={{ fontSize, ...style }}
      {...props}
    >
      <i className={`${icons[name]} fa-fw`} />
    </span>
  );
}
