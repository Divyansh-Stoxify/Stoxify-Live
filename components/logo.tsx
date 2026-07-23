import type React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type LogoVariant = "primary" | "reversed" | "monochrome" | "transparent";
export type LogoSize = "sm" | "md" | "lg" | "xl";

export interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: LogoVariant;
  size?: LogoSize | number;
  showIcon?: boolean;
  iconOnly?: boolean;
  href?: string;
  asLink?: boolean;
}

export interface LogoIconProps extends React.SVGProps<SVGSVGElement> {
  variant?: LogoVariant;
  size?: number;
}

/**
 * StoXify Brand Color Definitions (from Official Brand Guidelines)
 * Primary Dark Ink: #111827
 * Accent Blue X: #4F8CFF
 * Reversed Background: #0B192C
 * Reversed Text/White: #FFFFFF
 */

/**
 * LogoIcon: The signature dual-color "X" mark or emblem of StoXify
 */
export const LogoIcon = ({
  variant = "primary",
  size = 28,
  className,
  ...props
}: LogoIconProps) => {
  const isReversed = variant === "reversed";
  const isMonochrome = variant === "monochrome";

  const xColor = isMonochrome
    ? isReversed
      ? "#FFFFFF"
      : "#111827"
    : "#4F8CFF";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 select-none", className)}
      aria-label="StoXify Logo Icon"
      {...props}
    >
      {/* Left Stroke (\) */}
      <path
        d="M20 18 L80 82"
        stroke={xColor}
        strokeWidth="18"
        strokeLinecap="round"
      />
      {/* Right Stroke (/) */}
      <path
        d="M80 18 L20 82"
        stroke={xColor}
        strokeWidth="18"
        strokeLinecap="round"
      />
    </svg>
  );
};

/**
 * Logo: Full StoXify brand logo component with exact typography & color variants
 * - 01 Primary: White/Light background, Dark Ink #111827 text, Totally Blue X (#4F8CFF)
 * - 02 Reversed: Deep Navy background #0B192C, White text, Totally Blue X (#4F8CFF)
 * - 03 Monochrome: Single color #111827 (stamps, single-color print)
 * - 04 Transparent: Overlay use with Dark Ink #111827 text & Totally Blue X (#4F8CFF)
 */
export const Logo = ({
  variant = "primary",
  size = "md",
  showIcon = false,
  iconOnly = false,
  href,
  asLink = false,
  className,
  ...props
}: LogoProps) => {
  const isReversed = variant === "reversed";
  const isMonochrome = variant === "monochrome";

  // Text color based on variant
  const textColorClass = isReversed ? "text-white" : "text-[#111827]";
  const xColor = isMonochrome
    ? isReversed
      ? "#FFFFFF"
      : "#111827"
    : "#4F8CFF";

  // Font size mappings
  const fontSizeClass =
    typeof size === "number"
      ? ""
      : size === "sm"
      ? "text-lg tracking-tight"
      : size === "md"
      ? "text-xl tracking-tight"
      : size === "lg"
      ? "text-2xl tracking-tight"
      : "text-3xl tracking-tight";

  const customStyle =
    typeof size === "number" ? { fontSize: `${size}px` } : undefined;

  const content = iconOnly ? (
    <LogoIcon variant={variant} size={typeof size === "number" ? size : 28} />
  ) : (
    <div
      className={cn(
        "inline-flex items-center gap-2 font-sans font-extrabold select-none",
        textColorClass,
        fontSizeClass,
        className
      )}
      style={customStyle}
      {...props}
    >
      {showIcon && (
        <LogoIcon
          variant={variant}
          size={
            typeof size === "number"
              ? size
              : size === "sm"
              ? 20
              : size === "md"
              ? 24
              : size === "lg"
              ? 30
              : 36
          }
        />
      )}
      <span className="inline-flex items-center leading-none">
        <span>Sto</span>
        {/* Accent Blue Capital X */}
        <span className="relative inline-flex items-center justify-center px-[1px]">
          <svg
            className="inline-block"
            style={{
              height: "0.85em",
              width: "0.85em",
              verticalAlign: "-0.05em",
            }}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Left diagonal stroke (\) */}
            <path
              d="M 18,15 L 82,85"
              stroke={xColor}
              strokeWidth="20"
              strokeLinecap="square"
            />
            {/* Right diagonal stroke (/) */}
            <path
              d="M 82,15 L 18,85"
              stroke={xColor}
              strokeWidth="20"
              strokeLinecap="square"
            />
          </svg>
        </span>
        <span>ify</span>
      </span>
    </div>
  );

  if (asLink || href) {
    return (
      <Link href={href || "/"} className="inline-flex items-center focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
};

/**
 * LogoBrandCard: Helper component to showcase a specific variant matching the brand guideline UI
 */
export const LogoBrandCard = ({
  variant,
  title,
  subtitle,
}: {
  variant: LogoVariant;
  title: string;
  subtitle: string;
}) => {
  const isReversed = variant === "reversed";
  const bgClass = isReversed
    ? "bg-[#0B192C] text-white"
    : variant === "transparent"
    ? "bg-checkerboard border border-gray-200"
    : "bg-white border border-gray-100";

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 shadow-sm transition-all hover:shadow-md">
      <div
        className={cn(
          "flex h-44 items-center justify-center p-8",
          bgClass
        )}
      >
        <Logo variant={variant} size="xl" />
      </div>
      <div className="border-t border-gray-100 bg-gray-50/50 p-4">
        <div className="font-bold text-sm text-gray-900">{title}</div>
        <div className="text-xs text-gray-500">{subtitle}</div>
      </div>
    </div>
  );
};
