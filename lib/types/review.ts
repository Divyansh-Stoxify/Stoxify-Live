export interface Review {
  review_id: string;
  user_id: string;
  user_name: string;
  analyst_id: string;
  rating: number;
  text: string;
  created_at: string;
}

export interface ReviewStats {
  total: number;
  averageRating: number;
}
