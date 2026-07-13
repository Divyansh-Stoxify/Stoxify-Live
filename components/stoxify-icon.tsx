import type { CSSProperties, HTMLAttributes } from "react";

export type IconName =
  | "activity"
  | "arrowLeft"
  | "arrowRight"
  | "ban"
  | "bank"
  | "barChart"
  | "bell"
  | "badge"
  | "banknote"
  | "check"
  | "chevronRight"
  | "chevronDown"
  | "circleCheck"
  | "creditCard"
  | "download"
  | "edit"
  | "fileBadge"
  | "fileText"
  | "folder"
  | "flame"
  | "gear"
  | "link"
  | "layoutDashboard"
  | "lineChart"
  | "listChecks"
  | "lock"
  | "logout"
  | "mail"
  | "phone"
  | "plus"
  | "power"
  | "receipt"
  | "refresh"
  | "rupee"
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
  | "user"
  | "users"
  | "wallet"
  | "x"
  | "zap"
  | "eye"
  | "eyeOff"
  | "google"
  | "apple"
  | "helpCircle"
  | "headset"
  | "bold"
  | "italic"
  | "list"
  | "grid"
  | "trash"
  | "ticket"
  | "loader";

const icons: Record<IconName, string> = {
  activity: "fa-solid fa-wave-square",
  arrowLeft: "fa-solid fa-arrow-left",
  arrowRight: "fa-solid fa-arrow-right",
  ban: "fa-solid fa-ban",
  bank: "fa-solid fa-building-columns",
  barChart: "fa-solid fa-chart-column",
  badge: "fa-solid fa-certificate",
  banknote: "fa-solid fa-money-bill-wave",
  bell: "fa-solid fa-bell",
  check: "fa-solid fa-check",
  chevronRight: "fa-solid fa-chevron-right",
  chevronDown: "fa-solid fa-chevron-down",
  circleCheck: "fa-solid fa-circle-check",
  creditCard: "fa-solid fa-credit-card",
  download: "fa-solid fa-download",
  edit: "fa-solid fa-pen-to-square",
  eye: "fa-solid fa-eye",
  eyeOff: "fa-solid fa-eye-slash",
  fileBadge: "fa-solid fa-file-circle-check",
  fileText: "fa-solid fa-file-lines",
  flame: "fa-solid fa-fire",
  folder: "fa-solid fa-folder-open",
  gear: "fa-solid fa-gear",
  google: "fa-brands fa-google",
  apple: "fa-brands fa-apple",
  link: "fa-solid fa-link",
  layoutDashboard: "fa-solid fa-grip",
  lineChart: "fa-solid fa-chart-line",
  listChecks: "fa-solid fa-list-check",
  lock: "fa-solid fa-lock",
  logout: "fa-solid fa-right-from-bracket",
  mail: "fa-solid fa-envelope",
  phone: "fa-solid fa-phone",
  plus: "fa-solid fa-plus",
  power: "fa-solid fa-power-off",
  receipt: "fa-solid fa-receipt",
  refresh: "fa-solid fa-arrows-rotate",
  rupee: "fa-solid fa-indian-rupee-sign",
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
  user: "fa-solid fa-user",
  users: "fa-solid fa-users",
  wallet: "fa-solid fa-wallet",
  x: "fa-solid fa-xmark",
  zap: "fa-solid fa-bolt",
  helpCircle: "fa-solid fa-circle-question",
  headset: "fa-solid fa-headset",
  loader: "fa-solid fa-spinner",
  bold: "fa-solid fa-bold",
  italic: "fa-solid fa-italic",
  list: "fa-solid fa-list",
  grid: "fa-solid fa-border-all",
  trash: "fa-solid fa-trash",
  ticket: "fa-solid fa-ticket",
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
