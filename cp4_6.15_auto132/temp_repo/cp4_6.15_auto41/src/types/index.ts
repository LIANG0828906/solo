export type Category = 'handcraft' | 'books' | 'clothing' | 'electronics' | 'food';

export const CATEGORY_LABELS: Record<Category, string> = {
  handcraft: '手工艺品',
  books: '二手书籍',
  clothing: '衣物',
  electronics: '电子小物',
  food: '食品'
};

export const CATEGORY_COLORS: Record<Category, string> = {
  handcraft: '#D4A574',
  books: '#6B8E23',
  clothing: '#E67E22',
  electronics: '#3498DB',
  food: '#E74C3C'
};

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  isHot?: boolean;
}

export interface Stall {
  id: string;
  name: string;
  owner: string;
  ownerAvatar: string;
  category: Category;
  description: string;
  products: Product[];
  rating: number;
  createdAt: number;
  position: {
    lat: number;
    lng: number;
  };
  markerColor: string;
  markerIcon: string;
  isOpen: boolean;
  distance?: number;
}

export type SortType = 'distance' | 'rating' | 'latest';

export interface AppTheme {
  primary: string;
  secondary: string;
  background: string;
}

export interface FavoritesContextType {
  favorites: string[];
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
}

export interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
}
