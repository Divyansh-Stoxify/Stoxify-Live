"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, ChevronDownIcon, SearchIcon, UserCheckIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  selectedAnalyst: string;
  onSelectAnalyst: (analystName: string) => void;
  analysts: string[];
  placeholder?: string;
};

export function AnalystSearchFilter({
  selectedAnalyst,
  onSelectAnalyst,
  analysts,
  placeholder = "All Research Analysts",
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredList = analysts.filter((a) =>
    a.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayLabel =
    selectedAnalyst === "all" ? placeholder : selectedAnalyst;

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`h-8 gap-2 text-xs font-semibold px-3 border transition-all ${
            selectedAnalyst !== "all"
              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "bg-card text-foreground hover:bg-accent/50"
          }`}
        >
          <UserCheckIcon className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="max-w-[140px] truncate">{displayLabel}</span>
          <ChevronDownIcon className="size-3 text-foreground/60 shrink-0" />
        </Button>

        {selectedAnalyst !== "all" && (
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            onClick={() => onSelectAnalyst("all")}
            className="size-6 text-foreground/60 hover:text-foreground"
            title="Reset to All Analysts"
          >
            <XIcon className="size-3" />
          </Button>
        )}
      </div>

      {/* Searchable Dropdown Popup */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-1.5 w-64 rounded-lg border bg-popover text-popover-foreground shadow-lg ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95">
          <div className="p-2 border-b">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search analyst name..."
                className="h-8 pl-8 text-xs bg-background"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto p-1 text-xs">
            <button
              type="button"
              onClick={() => {
                onSelectAnalyst("all");
                setIsOpen(false);
                setSearchTerm("");
              }}
              className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 font-medium transition-colors hover:bg-accent/60 ${
                selectedAnalyst === "all" ? "bg-emerald-500/10 font-bold text-emerald-600 dark:text-emerald-400" : "text-foreground/80"
              }`}
            >
              <span>{placeholder}</span>
              {selectedAnalyst === "all" && <CheckIcon className="size-3.5 text-emerald-600" />}
            </button>

            {filteredList.length === 0 ? (
              <p className="p-3 text-center text-[11px] text-muted-foreground">
                No analyst found matching &ldquo;{searchTerm}&rdquo;
              </p>
            ) : (
              filteredList.map((analyst) => {
                const isSelected = selectedAnalyst === analyst;
                return (
                  <button
                    key={analyst}
                    type="button"
                    onClick={() => {
                      onSelectAnalyst(analyst);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                    className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 font-medium transition-colors hover:bg-muted ${
                      isSelected ? "bg-emerald-500/10 text-emerald-600 font-bold" : "text-foreground"
                    }`}
                  >
                    <span className="truncate">{analyst}</span>
                    {isSelected && <CheckIcon className="size-3.5 text-emerald-600" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
