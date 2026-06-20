export interface FlavorTag {
  id: string;
  name: string;
  color: string;
  gradient: string;
  x: number;
  y: number;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  cookingMethod: string;
  flavorTags: string[];
  rating: number;
  likes: number;
  description: string;
  steps: string[];
  icon: string;
  createdAt: number;
}

export interface RecipePosition {
  recipeId: string;
  x: number;
  y: number;
}

export type CookingMethod = '炒' | '煮' | '蒸' | '烤' | '煎' | '炖' | '凉拌';

export const FLAVOR_TAGS: FlavorTag[] = [
  {
    id: 'sour',
    name: '酸爽',
    color: '#FFD93D',
    gradient: 'linear-gradient(135deg, #FFF3B0 0%, #FFD93D 100%)',
    x: -0.8,
    y: 0.2,
  },
  {
    id: 'sweet',
    name: '甜腻',
    color: '#FF6B9D',
    gradient: 'linear-gradient(135deg, #FFD1DC 0%, #FF6B9D 100%)',
    x: 0.8,
    y: 0.5,
  },
  {
    id: 'spicy',
    name: '麻辣',
    color: '#FF6B35',
    gradient: 'linear-gradient(135deg, #FFB38A 0%, #FF6B35 50%, #E63946 100%)',
    x: -0.3,
    y: 0.9,
  },
  {
    id: 'savory',
    name: '咸鲜',
    color: '#6BCB77',
    gradient: 'linear-gradient(135deg, #C8F7D0 0%, #6BCB77 100%)',
    x: 0.1,
    y: 0.6,
  },
  {
    id: 'light',
    name: '清淡',
    color: '#A8E6CF',
    gradient: 'linear-gradient(135deg, #E8F8F0 0%, #A8E6CF 100%)',
    x: 0.0,
    y: -0.7,
  },
];

export const COOKING_METHODS: CookingMethod[] = ['炒', '煮', '蒸', '烤', '煎', '炖', '凉拌'];

export const FOOD_ICONS: { [key: string]: string } = {
  tomato: 'tomato',
  chili: 'chili',
  fish: 'fish',
  meat: 'meat',
  vegetable: 'vegetable',
  egg: 'egg',
  noodle: 'noodle',
  rice: 'rice',
  soup: 'soup',
  dessert: 'dessert',
};
