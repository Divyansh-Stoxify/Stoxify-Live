"use client";

import type { ReactNode } from "react";
import { ReactLenis } from "lenis/react";
import { usePathname } from "next/navigation";

export function LenisProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Bypass Lenis smooth scrolling inside full-screen dashboard/app shells
  // where scrolling is handled by nested scroll containers (overflow-y-auto).
  const isAppShell =
    pathname.startsWith("/trader") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/forgot-password");

  if (isAppShell) {
    return <>{children}</>;
  }

  return (
    <ReactLenis options={{ anchors: true, autoRaf: true }} root>
      {children}
    </ReactLenis>
  );
}
