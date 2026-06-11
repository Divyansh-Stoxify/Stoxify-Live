"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function LogoutButton({ className, children }: LogoutButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleLogout = async () => {
    setIsPending(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <button className={className} disabled={isPending} onClick={handleLogout} type="button">
      {isPending ? "Signing out…" : (children ?? "Sign out")}
    </button>
  );
}
