"use client";

import { FormEvent, useState } from "react";

import { Icon } from "./stoxify-icon";

export function WaitlistForm({
  className = "",
  successClassName = "",
}: {
  className?: string;
  successClassName?: string;
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
