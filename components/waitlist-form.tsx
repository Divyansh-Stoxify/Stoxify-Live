"use client";

import { FormEvent, useState } from "react";

import { Icon } from "./stoxify-icon";

export function WaitlistForm({
  className = "",
  successClassName = "",
  variant = "default",
}: {
  className?: string;
  successClassName?: string;
  /** "pill" is the rounded white bar used by the analyst hero. */
  variant?: "default" | "pill";
}) {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div
        className={[
          "mx-auto mt-3.5 flex max-w-[480px] items-center justify-center gap-2 rounded border border-[rgba(27,158,75,0.3)] bg-[rgba(27,158,75,0.15)] px-5 py-3 text-center text-[13px] text-[#34d399]",
          successClassName,
        ].join(" ")}
      >
        <Icon className="h-4 w-4" name="check" />
        You&apos;re on the list! We&apos;ll reach out when we launch.
      </div>
    );
  }

  if (variant === "pill") {
    return (
      <form
        className={[
          "mx-auto flex max-w-[520px] items-center gap-2 rounded-full bg-white p-[7px] pl-6 shadow-[0_8px_30px_rgba(3,10,28,0.35)] max-[560px]:flex-col max-[560px]:rounded-2xl max-[560px]:p-3 max-[560px]:pl-3",
          className,
        ].join(" ")}
        onSubmit={handleSubmit}
      >
        <input
          className="min-w-0 flex-1 bg-transparent py-2 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted-2)] max-[560px]:w-full max-[560px]:text-center"
          placeholder="johndoe@gmail.com"
          required
          type="email"
        />
        <button
          className="shrink-0 rounded-full border border-[var(--line)] bg-white px-6 py-2.5 text-[13.5px] font-semibold text-[var(--ink)] transition-colors hover:border-[var(--muted-2)] hover:bg-[var(--line-2)] max-[560px]:w-full"
          type="submit"
        >
          Join Waitlist
        </button>
      </form>
    );
  }

  return (
    <form
      className={[
        "mx-auto flex max-w-[480px] overflow-hidden rounded border border-white/20 max-[560px]:flex-col",
        className,
      ].join(" ")}
      onSubmit={handleSubmit}
    >
      <input
        className="min-w-0 flex-1 bg-white/[0.06] px-[18px] py-[13px] text-sm text-white outline-none placeholder:text-white/30"
        placeholder="Enter your work email"
        required
        type="email"
      />
      <button
        className="inline-flex items-center justify-center gap-2 bg-[var(--orange)] px-[22px] py-[13px] text-sm font-semibold text-white transition-colors hover:bg-[#EA6F0C]"
        type="submit"
      >
        Join the Waitlist
        <Icon className="h-4 w-4" name="arrowRight" />
      </button>
    </form>
  );
}
