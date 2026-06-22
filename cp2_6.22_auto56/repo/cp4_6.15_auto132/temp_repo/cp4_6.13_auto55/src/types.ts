export interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  steps: string;
  imageUrl: string;
  likes: number;
  author: string;
  cuisineTags: string[];
}

export interface RecommendationResult {
  recipe: Recipe;
  matchScore: number;
}
