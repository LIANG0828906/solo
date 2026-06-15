export interface FlavorProfile {
  sweet: number;
  spicy: number;
  sour: number;
}

export interface Comment {
  id: string;
  userName: string;
  content: string;
  emoji: string;
  createdAt: string;
}

export interface Recipe {
  id: string;
  name: string;
  cuisine: string;
  difficulty: '简单' | '中等' | '困难';
  cookTime: number;
  flavorProfile: FlavorProfile;
  ingredients: string[];
  steps: string[];
  coverImage: string;
  story: string;
  likes: number;
  createdAt: string;
  comments: Comment[];
}

export interface UserProfile {
  id: string;
  userName: string;
  flavorProfile: FlavorProfile;
  registeredAt: string;
}

export interface RecipeFilters {
  cuisine: string;
  difficulty: string;
  cookTimeRange: string;
}

export interface RecipeWithMatch extends Recipe {
  matchPercentage: number;
}
