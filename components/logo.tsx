import type React from "react";

import { cn } from "@/lib/utils";

export const LogoIcon = ({ className, ...props }: React.ComponentProps<"span">) => (
  <span
    aria-hidden="true"
    className={cn(
      "inline-flex size-7 items-center justify-center rounded-lg bg-primary text-sm font-black text-primary-foreground",
      className
    )}
    {...props}
  >
    S
  </span>
);

export const Logo = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div
    className={cn(
      "inline-flex items-center gap-2 font-sans text-lg font-extrabold tracking-tight",
      className
    )}
    {...props}
  >
    <span>Stoxify</span>
  </div>
);
