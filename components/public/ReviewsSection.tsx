"use client";

import useSWR from "swr";
import { Star, Loader2 } from "lucide-react";
import { ReviewCarousel } from "./ReviewCarousel";
import { AddReviewForm } from "./AddReviewForm";
import { Review, ReviewStats } from "@/lib/types/review";

interface ReviewsSectionProps {
  analystId: string;
  analystName: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ReviewsSection({ analystId, analystName }: ReviewsSectionProps) {
  const { data, error, isLoading } = useSWR<{
    success: boolean;
    data: {
      reviews: Review[];
      stats: ReviewStats;
    };
  }>(`/api/public/reviews/${analystId}`, fetcher);

  if (error) {
    return (
      <div className="text-center py-10 text-red-500">
        Failed to load reviews. Please try again later.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-[var(--brand)]" size={40} />
      </div>
    );
  }

  const reviews = data?.data.reviews || [];
  const stats = data?.data.stats || { total: 0, averageRating: 0 };

  return (
    <>
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Subscriber Reviews
        </h2>
        {stats.total > 0 && (
          <div className="flex items-center justify-center gap-1 text-[var(--brand)]">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                size={20}
                fill={
                  i <= Math.round(stats.averageRating) ? "currentColor" : "none"
                }
                className={
                  i > Math.round(stats.averageRating)
                    ? "text-slate-200 dark:text-slate-700"
                    : ""
                }
              />
            ))}
            <span className="ml-2 text-slate-700 dark:text-slate-300 font-bold text-lg">
              {stats.averageRating.toFixed(1)}
            </span>
            <span className="ml-1 text-slate-500 dark:text-slate-400 text-sm">
              ({stats.total} {stats.total === 1 ? "review" : "reviews"})
            </span>
          </div>
        )}
      </div>

      <ReviewCarousel reviews={reviews} />

      <div className="mt-10 max-w-lg mx-auto">
        <AddReviewForm analystId={analystId} analystName={analystName} />
      </div>
    </>
  );
}
