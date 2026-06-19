import { create } from 'zustand';
import type { RecipeSlot, Ingredient, RecipeCard, CustomerEmotion, FlavorProfile } from './types';
import { EMOTIONS, CUSTOMER_NAMES, CUSTOMER_AVATAR_COLORS } from './types';

interface TavernState {
  slots: RecipeSlot[];
  recipeBook: RecipeCard[];
  currentEmotion: CustomerEmotion;
  customerName: string;
  customerColors: string[];
  isMixing: boolean;
  currentCocktail: RecipeCard | null;
  lastMatchScore: number | null;
  showRecipeBook: boolean;

  addIngredient: (ingredient: Ingredient) => void;
  removeIngredient: (slotIndex: number) => void;
  adjustAmount: (slotIndex: number, delta: number) => void;
  clearSlots: () => void;
  startMix: () => void;
  finishMix: (card: RecipeCard) => void;
  resetCustomer: () => void;
  toggleRecipeBook: () => void;
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeRandomCustomer(): { emotion: CustomerEmotion; name: string; colors: string[] } {
  return {
    emotion: randomFrom(EMOTIONS),
    name: randomFrom(CUSTOMER_NAMES),
    colors: randomFrom(CUSTOMER_AVATAR_COLORS),
  };
}

export function computeProfile(slots: RecipeSlot[]): FlavorProfile {
  let totalAmount = 0;
  let alcohol = 0;
  let sweetness = 0;
  let sourness = 0;
  let bitterness = 0;

  for (const slot of slots) {
    if (!slot.ingredient) continue;
    const w = slot.amount;
    totalAmount += w;
    alcohol += slot.ingredient.alcohol * w;
    sweetness += slot.ingredient.sweetness * w;
    sourness += slot.ingredient.sourness * w;
    bitterness += slot.ingredient.bitterness * w;
  }

  if (totalAmount === 0) {
    return { alcohol: 0, sweetness: 0, sourness: 0, bitterness: 0 };
  }

  return {
    alcohol: Math.min(100, alcohol / totalAmount),
    sweetness: Math.min(100, sweetness / totalAmount),
    sourness: Math.min(100, sourness / totalAmount),
    bitterness: Math.min(100, bitterness / totalAmount),
  };
}

export function blendColors(slots: RecipeSlot[]): string {
  const valid = slots.filter(s => s.ingredient);
  if (valid.length === 0) return '#2A1A4A';
  let r = 0, g = 0, b = 0, totalW = 0;
  for (const s of valid) {
    const hex = s.ingredient!.color.replace('#', '');
    const cr = parseInt(hex.substring(0, 2), 16);
    const cg = parseInt(hex.substring(2, 4), 16);
    const cb = parseInt(hex.substring(4, 6), 16);
    r += cr * s.amount;
    g += cg * s.amount;
    b += cb * s.amount;
    totalW += s.amount;
  }
  if (totalW === 0) return '#2A1A4A';
  return `#${Math.round(r / totalW).toString(16).padStart(2, '0')}${Math.round(g / totalW).toString(16).padStart(2, '0')}${Math.round(b / totalW).toString(16).padStart(2, '0')}`;
}

export function computeMatchScore(profile: FlavorProfile, emotion: CustomerEmotion): number {
  const t = emotion.target;
  const diff =
    Math.abs(profile.alcohol - t.alcohol) / 100 +
    Math.abs(profile.sweetness - t.sweetness) / 100 +
    Math.abs(profile.sourness - t.sourness) / 100 +
    Math.abs(profile.bitterness - t.bitterness) / 100;
  const similarity = 1 - diff / 4;
  return Math.max(0, Math.min(1, similarity));
}

function flavorDistance(a: FlavorProfile, b: FlavorProfile): number {
  return Math.sqrt(
    Math.pow(a.alcohol - b.alcohol, 2) +
    Math.pow(a.sweetness - b.sweetness, 2) +
    Math.pow(a.sourness - b.sourness, 2) +
    Math.pow(a.bitterness - b.bitterness, 2)
  );
}

export function findClosestRecipe(target: RecipeCard, book: RecipeCard[]): RecipeCard | null {
  let best: RecipeCard | null = null;
  let bestDist = Infinity;
  for (const other of book) {
    if (other.id === target.id) continue;
    const d = flavorDistance(target.profile, other.profile);
    if (d < bestDist) {
      bestDist = d;
      best = other;
    }
  }
  return best;
}

const initialCustomer = makeRandomCustomer();

export const useTavernStore = create<TavernState>((set, get) => ({
  slots: [
    { ingredient: null, amount: 0 },
    { ingredient: null, amount: 0 },
    { ingredient: null, amount: 0 },
  ],
  recipeBook: [],
  currentEmotion: initialCustomer.emotion,
  customerName: initialCustomer.name,
  customerColors: initialCustomer.colors,
  isMixing: false,
  currentCocktail: null,
  lastMatchScore: null,
  showRecipeBook: false,

  addIngredient: (ingredient) => set((state) => {
    const idx = state.slots.findIndex(s => !s.ingredient);
    if (idx === -1) return {};
    const newSlots = [...state.slots];
    newSlots[idx] = { ingredient, amount: 30 };
    return { slots: newSlots };
  }),

  removeIngredient: (slotIndex) => set((state) => {
    const newSlots = [...state.slots];
    newSlots[slotIndex] = { ingredient: null, amount: 0 };
    return { slots: newSlots };
  }),

  adjustAmount: (slotIndex, delta) => set((state) => {
    const newSlots = [...state.slots];
    const slot = newSlots[slotIndex];
    if (!slot.ingredient) return {};
    const newAmount = Math.max(5, Math.min(100, slot.amount + delta));
    newSlots[slotIndex] = { ...slot, amount: newAmount };
    return { slots: newSlots };
  }),

  clearSlots: () => set({
    slots: [
      { ingredient: null, amount: 0 },
      { ingredient: null, amount: 0 },
      { ingredient: null, amount: 0 },
    ],
    currentCocktail: null,
  }),

  startMix: () => set({ isMixing: true }),

  finishMix: (card) => set((state) => ({
    isMixing: false,
    currentCocktail: card,
    recipeBook: [card, ...state.recipeBook],
    lastMatchScore: card.matchScore,
  })),

  resetCustomer: () => {
    const c = makeRandomCustomer();
    set({
      currentEmotion: c.emotion,
      customerName: c.name,
      customerColors: c.colors,
      lastMatchScore: null,
    });
    get().clearSlots();
  },

  toggleRecipeBook: () => set((s) => ({ showRecipeBook: !s.showRecipeBook })),
}));
