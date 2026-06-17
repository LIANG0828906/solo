import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  RecipeData,
  Ratio,
  PropertyValue,
  MaterialType,
  PropertyType,
} from '../types';
import { computeProperties } from './recipeUtils';

const STORAGE_KEY = 'material-resonance-favorites';

function loadFavorites(): RecipeData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveFavorites(favorites: RecipeData[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch {}
}

function makeDefaultRatios(): Ratio[] {
  return [
    { material: MaterialType.Wood, value: 25 },
    { material: MaterialType.Metal, value: 25 },
    { material: MaterialType.Ceramic, value: 25 },
    { material: MaterialType.Plastic, value: 25 },
  ];
}

export const PRESET_RECIPES: RecipeData[] = [
  {
    id: uuidv4(),
    name: '均衡配方',
    ratios: [
      { material: MaterialType.Wood, value: 25 },
      { material: MaterialType.Metal, value: 25 },
      { material: MaterialType.Ceramic, value: 25 },
      { material: MaterialType.Plastic, value: 25 },
    ],
    properties: [],
    favorited: false,
    createdAt: Date.now(),
  },
  {
    id: uuidv4(),
    name: '高强合金',
    ratios: [
      { material: MaterialType.Wood, value: 5 },
      { material: MaterialType.Metal, value: 60 },
      { material: MaterialType.Ceramic, value: 30 },
      { material: MaterialType.Plastic, value: 5 },
    ],
    properties: [],
    favorited: false,
    createdAt: Date.now(),
  },
  {
    id: uuidv4(),
    name: '柔韧复合',
    ratios: [
      { material: MaterialType.Wood, value: 20 },
      { material: MaterialType.Metal, value: 10 },
      { material: MaterialType.Ceramic, value: 5 },
      { material: MaterialType.Plastic, value: 65 },
    ],
    properties: [],
    favorited: false,
    createdAt: Date.now(),
  },
  {
    id: uuidv4(),
    name: '经济轻量',
    ratios: [
      { material: MaterialType.Wood, value: 40 },
      { material: MaterialType.Metal, value: 5 },
      { material: MaterialType.Ceramic, value: 10 },
      { material: MaterialType.Plastic, value: 45 },
    ],
    properties: [],
    favorited: false,
    createdAt: Date.now(),
  },
];

interface RecipeState {
  ratios: Ratio[];
  properties: PropertyValue[];
  favorites: RecipeData[];
  setRatio: (material: MaterialType, value: number) => void;
  addFavorite: () => void;
  removeFavorite: (id: string) => void;
  loadRecipe: (ratios: Ratio[]) => void;
  resetRatios: () => void;
}

export const useRecipeStore = create<RecipeState>((set, get) => ({
  ratios: makeDefaultRatios(),
  properties: computeProperties(makeDefaultRatios()),
  favorites: loadFavorites(),

  setRatio: (material: MaterialType, value: number) => {
    const ratios = get().ratios.map((r) =>
      r.material === material ? { ...r, value } : r
    );
    const properties = computeProperties(ratios);
    set({ ratios, properties });
  },

  addFavorite: () => {
    const { ratios, properties, favorites } = get();
    const recipe: RecipeData = {
      id: uuidv4(),
      name: `配方 ${favorites.length + 1}`,
      ratios: [...ratios],
      properties: [...properties],
      favorited: true,
      createdAt: Date.now(),
    };
    const next = [...favorites, recipe];
    saveFavorites(next);
    set({ favorites: next });
  },

  removeFavorite: (id: string) => {
    const next = get().favorites.filter((f) => f.id !== id);
    saveFavorites(next);
    set({ favorites: next });
  },

  loadRecipe: (ratios: Ratio[]) => {
    const properties = computeProperties(ratios);
    set({ ratios: [...ratios], properties });
  },

  resetRatios: () => {
    const ratios = makeDefaultRatios();
    const properties = computeProperties(ratios);
    set({ ratios, properties });
  },
}));
