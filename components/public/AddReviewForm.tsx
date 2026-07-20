'use client';

import { useState, useEffect } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { useSWRConfig } from 'swr';
import { toast } from 'sonner';

interface AddReviewFormProps {
  analystId: string;
  analystName: string;
}

interface UserInfo {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  state: string;
  user_type: string;
}

function useUserInfo(): UserInfo | null {
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    try {
      const raw = document.cookie
        .split('; ')
        .find((c) => c.startsWith('stoxify_user_info='))
        ?.split('=')
        .slice(1)
        .join('=');
      if (raw) setUser(JSON.parse(decodeURIComponent(raw)));
    } catch {
      setUser(null);
    }
  }, []);

  return user;
}

export function AddReviewForm({ analystId, analystName }: AddReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user = useUserInfo();
  const { mutate } = useSWRConfig();

  if (!user) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 text-center border border-slate-200 dark:border-slate-800">
        <p className="text-slate-600 dark:text-slate-400 font-medium">
          Log in to leave a review for {analystName}
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    if (reviewText.trim().length < 10) {
      toast.error('Review must be at least 10 characters long');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          analyst_id: analystId,
          rating,
          text: reviewText.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Your session has expired. Please log in again.');
        }
        throw new Error(data.error || 'Failed to submit review');
      }

      toast.success('Review submitted successfully!');
      setRating(0);
      setReviewText('');
      
      // Revalidate the reviews cache
      mutate(`/api/public/reviews/${analystId}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-800 p-6 relative overflow-hidden">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
        Leave a Review
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Rating
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star
                  size={24}
                  fill={star <= (hoverRating || rating) ? 'currentColor' : 'none'}
                  className={
                    star <= (hoverRating || rating)
                      ? 'text-[var(--brand)]'
                      : 'text-slate-300 dark:text-slate-600'
                  }
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Your Review
          </label>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder={`Share your experience with ${analystName}'s trades...`}
            rows={4}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition-all resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[var(--brand)] hover:bg-[#00c3ff] text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Submitting...
            </>
          ) : (
            'Post Review'
          )}
        </button>
      </form>
    </div>
  );
}
