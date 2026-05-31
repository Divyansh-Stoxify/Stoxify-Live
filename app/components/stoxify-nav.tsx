"use client";

import Link from "next/link";
import { useState } from "react";

import { Icon } from "./stoxify-icon";

function cx(...classes: Array<string | false>) {
  return classes.filter(Boolean).join(" ");
}

export function StoxifyNav({
  active = "home",
  ctaHref = "#",
  ctaLabel = "Join Waitlist",
  ctaVariant = "primary",
}: {
  active?: "home" | "analysts";
  ctaHref?: string;
  ctaLabel?: string;
  ctaVariant?: "primary" | "orange";
}) {
  const [open, setOpen] = useState(false);

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
          className="flex shrink-0 items-center gap-2 font-sans text-[21px] font-extrabold tracking-[-0.5px] text-[var(--ink)]"
          href="/"
          onClick={closeMenu}
        >
          <span className="h-2 w-2 rounded-full bg-[var(--brand)]" />
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

        <div className="ml-auto flex gap-2 max-[860px]:ml-0">
          <Link
            className="inline-flex items-center justify-center gap-2 rounded border border-[var(--line)] bg-transparent px-5 py-[9px] text-[13px] font-medium text-[var(--muted)] transition-colors hover:border-[var(--muted-2)] hover:bg-[var(--line-2)] hover:text-[var(--ink)] max-[860px]:hidden"
            href="#"
          >
            Log In
          </Link>
          <Link className={ctaClass} href={ctaHref}>
            {ctaLabel}
            <Icon className="h-3.5 w-3.5" name="arrowRight" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
