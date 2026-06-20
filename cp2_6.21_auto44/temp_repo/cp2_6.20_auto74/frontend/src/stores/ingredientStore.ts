import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { Ingredient } from '../types';

interface IngredientState {
  ingredients: Ingredient[];
  addIngredient: (ingredient: Omit<Ingredient, 'id'>) => void;
  removeIngredient: (id: string) => void;
  updateIngredient: (id: string, updates: Partial<Ingredient>) => void;
  getExpiringSoon: () => Ingredient[];
  getIngredientByName: (name: string) => Ingredient | undefined;
}

const mockIngredients: Ingredient[] = [
  {
    id: uuidv4(),
    name: '西红柿',
    quantity: 500,
    unit: 'g',
    expireDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
    category: '蔬菜',
  },
  {
    id: uuidv4(),
    name: '鸡蛋',
    quantity: 600,
    unit: 'g',
    expireDate: dayjs().add(10, 'day').format('YYYY-MM-DD'),
    category: '蛋类',
  },
  {
    id: uuidv4(),
    name: '鸡胸肉',
    quantity: 300,
    unit: 'g',
    expireDate: dayjs().add(2, 'day').format('YYYY-MM-DD'),
    category: '肉类',
  },
  {
    id: uuidv4(),
    name: '土豆',
    quantity: 800,
    unit: 'g',
    expireDate: dayjs().add(15, 'day').format('YYYY-MM-DD'),
    category: '蔬菜',
  },
  {
    id: uuidv4(),
    name: '青椒',
    quantity: 200,
    unit: 'g',
    expireDate: dayjs().add(3, 'day').format('YYYY-MM-DD'),
    category: '蔬菜',
  },
  {
    id: uuidv4(),
    name: '米饭',
    quantity: 2000,
    unit: 'g',
    expireDate: dayjs().add(30, 'day').format('YYYY-MM-DD'),
    category: '主食',
  },
  {
    id: uuidv4(),
    name: '牛肉',
    quantity: 250,
    unit: 'g',
    expireDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
    category: '肉类',
  },
  {
    id: uuidv4(),
    name: '豆腐',
    quantity: 400,
    unit: 'g',
    expireDate: dayjs().add(2, 'day').format('YYYY-MM-DD'),
    category: '豆制品',
  },
];

export const useIngredientStore = create<IngredientState>((set, get) => ({
  ingredients: mockIngredients,

  addIngredient: (ingredient) =>
    set((state) => ({
      ingredients: [...state.ingredients, { ...ingredient, id: uuidv4() }],
    })),

  removeIngredient: (id) =>
    set((state) => ({
      ingredients: state.ingredients.filter((i) => i.id !== id),
    })),

  updateIngredient: (id, updates) =>
    set((state) => ({
      ingredients: state.ingredients.map((i) =>
        i.id === id ? { ...i, ...updates } : i
      ),
    })),

  getExpiringSoon: () => {
    const { ingredients } = get();
    const today = dayjs();
    return ingredients.filter((i) => {
      const expireDay = dayjs(i.expireDate);
      const diffDays = expireDay.diff(today, 'day');
      return diffDays <= 3 && diffDays >= 0;
    });
  },

  getIngredientByName: (name) => {
    const { ingredients } = get();
    return ingredients.find(
      (i) => i.name.toLowerCase() === name.toLowerCase()
    );
  },
}));
