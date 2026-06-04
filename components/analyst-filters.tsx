"use client";

import { useState } from "react";

const filters = ["All", "Intraday", "Swing Trading", "F&O", "Positional", "Equity"];

export function AnalystFilters() {
  const [activeFilter, setActiveFilter] = useState("All");

  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {filters.map((filter) => {
        const active = activeFilter === filter;

        return (
          <button
            className={[
              "rounded-full border-[1.5px] px-4 py-[7px] text-[13px] font-semibold transition-colors",
              active
                ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                : "border-[var(--line)] bg-transparent text-[var(--muted)] hover:border-[var(--brand)] hover:bg-[var(--brand)] hover:text-white",
            ].join(" ")}
            key={filter}
            onClick={() => setActiveFilter(filter)}
            type="button"
          >
            {filter}
          </button>
        );
      })}
    </div>
  );
}
