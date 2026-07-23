"use client";

import { useCallback } from "react";
// @ts-ignore
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Star, MessageSquare } from "lucide-react";
import { Review } from "@/lib/types/review";

export function ReviewCarousel({ reviews }: { reviews: Review[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    dragFree: true,
    containScroll: "trimSnaps",
  });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-800 p-6 relative">
      {reviews.length === 0 ? (
        <div className="py-16 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            No reviews yet
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            Be the first to share your experience
          </p>
        </div>
      ) : (
        <>
          {reviews.length > 1 && (
            <>
              <button
                onClick={scrollPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/80 dark:bg-slate-800/80 shadow-md hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={scrollNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/80 dark:bg-slate-800/80 shadow-md hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-6">
              {reviews.map((review) => (
                <div
                  key={review.review_id}
                  className="basis-full md:basis-[calc(33.333%-16px)] grow-0 shrink-0 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-100 dark:border-slate-700"
                >
                  <div className="flex items-center gap-1 text-[var(--brand)] mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        fill={i < review.rating ? "currentColor" : "none"}
                        className={i >= review.rating ? "text-slate-300 dark:text-slate-600" : ""}
                      />
                    ))}
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-[15px] italic leading-relaxed mb-6">
                    &ldquo;{review.text}&rdquo;
                  </p>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400 dark:text-slate-500">
                    <span>{review.user_name || "Verified Subscriber"}</span>
                    <span>
                      {new Date(review.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
