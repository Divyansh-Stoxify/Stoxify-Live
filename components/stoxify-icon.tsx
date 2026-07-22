import type React from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Award,
  BadgeCheck,
  Ban,
  Banknote,
  BarChart2,
  Bell,
  Bold,
  Bookmark,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  CreditCard,
  Download,
  Edit3,
  Eye,
  EyeOff,
  FileCheck,
  FileText,
  Flame,
  FolderOpen,
  Grid,
  Headphones,
  HelpCircle,
  IndianRupee,
  Italic,
  Landmark,
  LayoutGrid,
  LineChart,
  Link as LinkIcon,
  List,
  ListChecks,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Phone,
  Plus,
  Power,
  Receipt,
  RotateCw,
  Scale,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Target,
  Ticket,
  Timer,
  Trash2,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  | "bookmark"
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

export type IconState = "default" | "active" | "success" | "danger" | "warning";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName;
  state?: IconState;
  active?: boolean;
  size?: number | string;
  strokeWidth?: number;
  title?: string;
  className?: string;
}

const lucideIconMap: Record<IconName, React.ComponentType<any>> = {
  activity: Activity,
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  ban: Ban,
  bank: Landmark,
  barChart: BarChart2,
  badge: Award,
  banknote: Banknote,
  bookmark: Bookmark,
  bell: Bell,
  check: Check,
  chevronRight: ChevronRight,
  chevronDown: ChevronDown,
  circleCheck: CheckCircle2,
  creditCard: CreditCard,
  download: Download,
  edit: Edit3,
  eye: Eye,
  eyeOff: EyeOff,
  fileBadge: FileCheck,
  fileText: FileText,
  flame: Flame,
  folder: FolderOpen,
  gear: Settings,
  google: (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 11.3 21.9 10.6 21.7 9.9H12V14.1H17.5C16.8 16.3 14.6 18 12 18C8.7 18 6 15.3 6 12C6 8.7 8.7 6 12 6C13.5 6 14.9 6.6 16 7.5L19 4.5C17.1 2.8 14.7 1.8 12 1.8C6.4 1.8 1.8 6.4 1.8 12C1.8 17.6 6.4 22 12 22Z" />
    </svg>
  ),
  apple: (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 20.5C10.5 20.5 9.5 19.5 8.5 19.5C7.5 19.5 6 20.5 4.5 20.5C3 20.5 1.5 18 1.5 14C1.5 10 4 7.5 6.5 7.5C8 7.5 9 8.5 10 8.5C11 8.5 12 7.5 14 7.5C15.5 7.5 17.5 8.5 18.5 10C15.5 11.5 16 15.5 19 16.5C18 18.5 16.5 20.5 15 20.5C14 20.5 13 19.5 12 20.5Z" />
      <path d="M12 7.5C12 5.5 13.5 3.5 15.5 3.5C16 5.5 14.5 7.5 12 7.5Z" />
    </svg>
  ),
  link: LinkIcon,
  layoutDashboard: LayoutGrid,
  lineChart: LineChart,
  listChecks: ListChecks,
  lock: Lock,
  logout: LogOut,
  mail: Mail,
  phone: Phone,
  plus: Plus,
  power: Power,
  receipt: Receipt,
  refresh: RotateCw,
  rupee: IndianRupee,
  scale: Scale,
  search: Search,
  send: Send,
  shieldCheck: ShieldCheck,
  sparkle: Sparkles,
  star: Star,
  store: Store,
  target: Target,
  timer: Clock,
  trendingDown: TrendingDown,
  trendingUp: TrendingUp,
  user: User,
  users: Users,
  wallet: Wallet,
  x: X,
  zap: Zap,
  helpCircle: HelpCircle,
  headset: Headphones,
  loader: Loader2,
  bold: Bold,
  italic: Italic,
  list: List,
  grid: Grid,
  trash: Trash2,
  ticket: Ticket,
};

/**
 * Icon: Official StoXify Outline-Only Iconography System
 * Guidelines:
 * 1. Outline only — never filled (fill="none")
 * 2. 1.5–2px stroke weight, rounded linecaps & linejoins (strokeWidth=1.75, strokeLinecap="round", strokeLinejoin="round")
 * 3. State Colors:
 *    - Default: #111827
 *    - Active: #1A5CC8
 *    - Success: #16A34A
 *    - Danger: #DC2626
 *    - Warning: #D97706
 */
export function Icon({
  name,
  state,
  active = false,
  size = 18,
  strokeWidth = 1.75,
  className,
  style,
  ...props
}: IconProps) {
  const IconComponent = lucideIconMap[name] || HelpCircle;

  // Determine state color according to brand guidelines
  const currentState: IconState = active ? "active" : state ?? "default";

  const stateColorClass =
    currentState === "active"
      ? "text-[#1A5CC8]"
      : currentState === "success"
      ? "text-[#16A34A]"
      : currentState === "danger"
      ? "text-[#DC2626]"
      : currentState === "warning"
      ? "text-[#D97706]"
      : "";

  return (
    <IconComponent
      size={size}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      className={cn("shrink-0 transition-colors", stateColorClass, className)}
      style={style}
      {...props}
    />
  );
}
