"use client";

import { useRef, useState } from "react";
import { LoaderCircleIcon, SearchIcon, XIcon } from "lucide-react";

import { Input } from "@/components/ui/input";

type Props = {
  onSearch: (q: string) => void;
  initialValue?: string;
  placeholder?: string;
  isLoading?: boolean;
};

export function SearchInput({
  onSearch,
  initialValue = "",
  placeholder = "Search",
  isLoading,
}: Props) {
  const [value, setValue] = useState(initialValue);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setValue(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSearch(next);
    }, 300);
  }

  function clear() {
    setValue("");
    onSearch("");
  }

  return (
    <div className="relative w-full">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="pl-8 pr-8"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
      />
      {isLoading && value ? (
        <LoaderCircleIcon className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
      ) : value ? (
        <button
          type="button"
          onClick={clear}
          className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <XIcon className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
