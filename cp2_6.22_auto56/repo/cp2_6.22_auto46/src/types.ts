export interface Product {
  id: string;
  name: string;
  category: 'fruit' | 'vegetable' | 'meat' | 'seafood';
  price: number;
  rating: number;
  totalSales: number;
  stock: number;
  maxStock: number;
  hotScore: number;
  profitPercent: number;
  feedbackCount: number;
  positiveFeedback: number;
  positiveRate: number;
}

export interface ProductDetail extends Product {
  cost: number;
  salesHistory: { date: string; sales: number }[];
  ratingDistribution: number[];
  reviews: Review[];
}

export interface Review {
  id: string;
  user: string;
  rating: number;
  content: string;
  date: string;
}

export interface ProductQuery {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sortBy?: 'hotScore' | 'sales' | 'rating' | 'profit';
  sortOrder?: 'asc' | 'desc';
}

export interface ProductsResponse {
  total: number;
  products: Product[];
}

export interface FeedbackResponse {
  success: boolean;
  productId: string;
  feedbackCount: number;
  positiveFeedback: number;
  hotScore: number;
}

export interface Recommendation {
  id: string;
  name: string;
  category: string;
  hotScore: number;
  reason: string;
}

export interface RecommendationsResponse {
  recommendations: Recommendation[];
}
