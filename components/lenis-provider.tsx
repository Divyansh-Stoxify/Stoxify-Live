"use client";

import type { ReactNode } from "react";
import { ReactLenis } from "lenis/react";

export function LenisProvider({ children }: { children: ReactNode }) {
  return (
    <ReactLenis options={{ anchors: true, autoRaf: true }} root>
      {children}
    </ReactLenis>
  );
}
