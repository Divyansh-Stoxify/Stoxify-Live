"use client";

import { motion } from "motion/react";

import { cn } from "@/lib/utils";

export function FloatingPaths({ position }: { position: number }) {
  const bands = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    delay: i * -0.45,
    duration: 12 + (i % 7),
    opacity: 0.04 + i * 0.006,
    offset: i * 5 * position,
    width: 42 + i * 3,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {bands.map((band) => (
        <motion.div
          aria-hidden="true"
          className={cn(
            "absolute h-px origin-left rounded-full bg-primary/40",
            position > 0 ? "left-[-12%]" : "right-[-12%]"
          )}
          initial={{ opacity: band.opacity, x: band.offset, y: 210 - band.id * 10 }}
          animate={{
            opacity: [band.opacity, band.opacity * 2, band.opacity],
            x: [band.offset, band.offset + 80 * position, band.offset],
            y: [210 - band.id * 10, 120 - band.id * 3, 210 - band.id * 10],
          }}
          key={band.id}
          style={{
            top: `${12 + band.id * 4}%`,
            width: `${band.width}%`,
            transform: `rotate(${position > 0 ? -12 : 12}deg)`,
          }}
          transition={{
            delay: band.delay,
            duration: band.duration,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}
