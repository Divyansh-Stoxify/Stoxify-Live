import type { LucideProps, LucideIcon } from "lucide-react";
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  BanknoteIcon,
  BellIcon,
  ChartBarIcon,
  ChartLineIcon,
  CheckIcon,
  ChevronRightIcon,
  CreditCardIcon,
  FileBadgeIcon,
  FileTextIcon,
  FlameIcon,
  FolderIcon,
  LinkIcon,
  ListChecksIcon,
  LockIcon,
  ReceiptIcon,
  ScaleIcon,
  SearchIcon,
  SendIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
  StoreIcon,
  TargetIcon,
  TimerIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  UsersIcon,
  WalletIcon,
  XIcon,
  ZapIcon,
} from "lucide-react";

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
  | "zap";

const icons: Record<IconName, LucideIcon> = {
  arrowRight: ArrowRightIcon,
  barChart: ChartBarIcon,
  badge: BadgeCheckIcon,
  banknote: BanknoteIcon,
  bell: BellIcon,
  check: CheckIcon,
  chevronRight: ChevronRightIcon,
  creditCard: CreditCardIcon,
  fileBadge: FileBadgeIcon,
  fileText: FileTextIcon,
  folder: FolderIcon,
  flame: FlameIcon,
  link: LinkIcon,
  lineChart: ChartLineIcon,
  listChecks: ListChecksIcon,
  lock: LockIcon,
  receipt: ReceiptIcon,
  scale: ScaleIcon,
  search: SearchIcon,
  send: SendIcon,
  shieldCheck: ShieldCheckIcon,
  sparkle: SparklesIcon,
  star: StarIcon,
  store: StoreIcon,
  target: TargetIcon,
  timer: TimerIcon,
  trendingDown: TrendingDownIcon,
  trendingUp: TrendingUpIcon,
  users: UsersIcon,
  wallet: WalletIcon,
  x: XIcon,
  zap: ZapIcon,
};

export function Icon({ name, strokeWidth = 1.8, ...props }: LucideProps & { name: IconName }) {
  const LucideIcon = icons[name];

  return <LucideIcon aria-hidden="true" strokeWidth={strokeWidth} {...props} />;
}
