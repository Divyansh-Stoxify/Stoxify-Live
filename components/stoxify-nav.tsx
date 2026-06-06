"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { userCookieNames } from "@/lib/auth/cookies";

import { Icon } from "./stoxify-icon";

type NavUser = {
  user_id?: string;
  name?: string;
  email?: string;
  phone?: string;
} | null;

function getUserLabel(user: Exclude<NavUser, null>): string {
  return user.name?.trim() || user.email?.trim() || user.phone?.trim() || user.user_id?.trim() || "Account";
}

function getInitials(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "A";
  if (parts.length === 1) {
    const compact = parts[0].replace(/[^a-zA-Z0-9]/g, "");
    return (compact || parts[0]).slice(0, 2).toUpperCase();
  }
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function normalizeNavUser(value: unknown): Exclude<NavUser, null> | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  const user = {
    user_id: typeof candidate.user_id === "string" ? candidate.user_id : "",
    name: typeof candidate.name === "string" ? candidate.name : "",
    email: typeof candidate.email === "string" ? candidate.email : "",
    phone: typeof candidate.phone === "string" ? candidate.phone : "",
  };
  return user.name || user.email || user.phone || user.user_id ? user : null;
}

function readCookieNavUser(): Exclude<NavUser, null> | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie
    .split("; ")
    .find((r) => r.startsWith(`${userCookieNames.userInfo}=`))
    ?.split("=")
    .slice(1)
    .join("=");

  if (!raw) return null;

  try {
    return normalizeNavUser(JSON.parse(decodeURIComponent(raw)));
  } catch {
    return null;
  }
}

function useNavUser(): NavUser {
  const [user, setUser] = useState<NavUser>(() => readCookieNavUser());

  useEffect(() => {
    if (user) return;

    const controller = new AbortController();

    void fetch("/api/auth/me", {
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json().catch(() => null)) as { user?: unknown } | null;
      })
      .then((data) => {
        const parsed = normalizeNavUser(data?.user);
        if (parsed) setUser(parsed);
      })
      .catch(() => {
        // ignore missing/expired sessions
      });

    return () => controller.abort();
  }, [user]);

  return user;
}

function cx(...classes: Array<string | false>) {
  return classes.filter(Boolean).join(" ");
}

export function StoxifyNav({
  active = "home",
  ctaHref = "/signup",
  ctaLabel = "Join Waitlist",
  ctaVariant = "primary",
}: {
  active?: "home" | "analysts";
  ctaHref?: string;
  ctaLabel?: string;
  ctaVariant?: "primary" | "orange";
}) {
  const [open, setOpen] = useState(false);
  const navUser = useNavUser();
  const navUserLabel = navUser ? getUserLabel(navUser) : "";

  const closeMenu = () => setOpen(false);
  const activeLink =
    "block rounded-md bg-[var(--brand-light)] px-3 py-1.5 text-sm font-medium text-[var(--brand)] transition-colors hover:bg-[var(--brand-light)] max-[860px]:px-3.5 max-[860px]:py-2.5 max-[860px]:text-[15px]";
  const inactiveLink =
    "block rounded-md px-3 py-1.5 text-sm font-medium text-[var(--muted)] transition-colors hover:bg-[var(--line-2)] hover:text-[var(--ink)] max-[860px]:px-3.5 max-[860px]:py-2.5 max-[860px]:text-[15px]";
  const ctaClass =
    ctaVariant === "orange"
      ? "inline-flex items-center justify-center gap-2 rounded bg-[var(--orange)] px-5 py-[9px] text-[13px] font-medium text-white transition-all hover:-translate-y-px hover:bg-[#EA6F0C] hover:shadow-[0_4px_16px_rgba(249,115,22,0.35)]"
      : "inline-flex items-center justify-center gap-2 rounded bg-[var(--brand)] px-5 py-[9px] text-[13px] font-medium text-white transition-all hover:-translate-y-px hover:bg-[var(--brand-dark)] hover:shadow-[0_4px_16px_rgba(31,122,224,0.35)]";

  return (
    <nav className="fixed inset-x-0 top-0 z-[200] flex h-[66px] items-center border-b border-[var(--line)] bg-white/90 backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-[1200px] items-center gap-10 px-10 max-[860px]:px-6">
        <Link
          className="flex shrink-0 items-center font-sans text-[21px] font-extrabold tracking-[-0.5px] text-[var(--ink)]"
          href="/"
          onClick={closeMenu}
        >
          Stoxify
        </Link>

        <ul
          className={cx(
            "flex flex-1 list-none items-center gap-1 max-[860px]:fixed max-[860px]:inset-x-0 max-[860px]:top-[66px] max-[860px]:z-[199] max-[860px]:flex-col max-[860px]:items-stretch max-[860px]:gap-0.5 max-[860px]:border-b max-[860px]:border-[var(--line)] max-[860px]:bg-white/95 max-[860px]:px-4 max-[860px]:py-3 max-[860px]:backdrop-blur-2xl",
            open ? "max-[860px]:flex" : "max-[860px]:hidden"
          )}
        >
          <li>
            <Link
              className={active === "home" ? activeLink : inactiveLink}
              href="/"
              onClick={closeMenu}
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              className={active === "analysts" ? activeLink : inactiveLink}
              href="/for-analysts"
              onClick={closeMenu}
            >
              For Research Analysts
            </Link>
          </li>
        </ul>

        <button
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className="ml-auto hidden flex-col gap-[5px] p-1.5 max-[860px]:flex"
          onClick={() => setOpen((value) => !value)}
          type="button"
        >
          <span
            className={cx(
              "block h-0.5 w-[22px] origin-center rounded-full bg-[var(--ink)] transition-transform",
              open && "translate-y-[7px] rotate-45"
            )}
          />
          <span
            className={cx(
              "block h-0.5 w-[22px] origin-center rounded-full bg-[var(--ink)] transition-all",
              open && "scale-x-0 opacity-0"
            )}
          />
          <span
            className={cx(
              "block h-0.5 w-[22px] origin-center rounded-full bg-[var(--ink)] transition-transform",
              open && "-translate-y-[7px] -rotate-45"
            )}
          />
        </button>

        <div className="ml-auto flex items-center gap-2 max-[860px]:ml-0">
          {navUser ? (
            <Link
              href="/dashboard"
              title={navUserLabel}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-[11px] font-extrabold text-white hover:opacity-90 transition-opacity select-none max-[860px]:hidden"
            >
              {getInitials(navUserLabel)}
            </Link>
          ) : (
            <Link
              className="inline-flex items-center justify-center gap-2 rounded border border-[var(--line)] bg-transparent px-5 py-[9px] text-[13px] font-medium text-[var(--muted)] transition-colors hover:border-[var(--muted-2)] hover:bg-[var(--line-2)] hover:text-[var(--ink)] max-[860px]:hidden"
              href="/login"
            >
              Log In
            </Link>
          )}
          <Link className={ctaClass} href={navUser ? "/dashboard" : ctaHref}>
            {navUser ? "Dashboard" : ctaLabel}
            <Icon className="h-3.5 w-3.5" name="arrowRight" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
