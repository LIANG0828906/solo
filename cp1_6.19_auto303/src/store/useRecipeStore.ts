import { create } from 'zustand';
import type {
  RecipeState,
  RecipeStore,
  Ingredient,
  SynthesisItem,
  Nutrition,
  NutrientPercentages,
  Flavor,
  RecipeScore,
  SavedCard,
} from '../types';
import { FOOD_DATABASE } from '../utils/foodData';

const STORAGE_KEY = 'recipe-lab-cards';
const MAX_CARDS = 50;

const loadSavedCards = (): SavedCard[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    console.warn('Failed to load saved cards from localStorage');
  }
  return [];
};

const saveCardsToStorage = (cards: SavedCard[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  } catch {
    console.warn('Failed to save cards to localStorage');
  }
};

const initialState: RecipeState = {
  ingredients: FOOD_DATABASE,
  synthesisItems: [],
  selectedFlavors: [],
  savedCards: loadSavedCards(),
  currentRecipeName: '',
  editingCardId: null,
};

export const useRecipeStore = create<RecipeStore>()((set, get) => ({
  ...initialState,

  addIngredient: (ingredient: Ingredient) => {
    const { synthesisItems } = get();
    const existing = synthesisItems.find(
      (item: SynthesisItem) => item.ingredient.id === ingredient.id
    );
    if (existing) {
      set({
        synthesisItems: synthesisItems.map((item: SynthesisItem) =>
          item.ingredient.id === ingredient.id
            ? { ...item, quantity: item.quantity + 50 }
            : item
        ),
      });
    } else {
      set({
        synthesisItems: [
          ...synthesisItems,
          { ingredient, quantity: ingredient.category === 'seasoning' ? 10 : 100 },
        ],
      });
    }
  },

  removeIngredient: (ingredientId: string) => {
    const { synthesisItems } = get();
    set({
      synthesisItems: synthesisItems.filter(
        (item: SynthesisItem) => item.ingredient.id !== ingredientId
      ),
    });
  },

  updateQuantity: (ingredientId: string, quantity: number) => {
    const { synthesisItems } = get();
    set({
      synthesisItems: synthesisItems.map((item: SynthesisItem) =>
        item.ingredient.id === ingredientId
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      ),
    });
  },

  toggleFlavor: (flavor: Flavor) => {
    const { selectedFlavors } = get();
    if (selectedFlavors.includes(flavor)) {
      set({
        selectedFlavors: selectedFlavors.filter((f: Flavor) => f !== flavor),
      });
    } else {
      set({
        selectedFlavors: [...selectedFlavors, flavor],
      });
    }
  },

  setRecipeName: (name: string) => {
    set({ currentRecipeName: name });
  },

  saveCard: () => {
    const state = get();
    if (state.synthesisItems.length === 0) return;

    const totalNutrition = state.getTotalNutrition();
    const score = state.calculateScore();
    const mainIngredient = state.getMainIngredient();
    if (!mainIngredient) return;

    const allFlavors: Flavor[] = [
      ...new Set([
        ...state.selectedFlavors,
        ...state.synthesisItems.flatMap((item: SynthesisItem) => item.ingredient.flavors),
      ]),
    ];

    const newCard: SavedCard = {
      id: state.editingCardId || `card-${Date.now()}`,
      name: state.currentRecipeName || `${mainIngredient.name}创意料理`,
      items: state.synthesisItems,
      flavors: allFlavors,
      totalNutrition,
      score,
      mainIngredient,
      createdAt: Date.now(),
    };

    let savedCards = state.savedCards.filter((c: SavedCard) => c.id !== newCard.id);
    savedCards = [newCard, ...savedCards];

    if (savedCards.length > MAX_CARDS) {
      savedCards = savedCards.slice(0, MAX_CARDS);
    }

    set({
      savedCards,
      synthesisItems: [],
      selectedFlavors: [],
      currentRecipeName: '',
      editingCardId: null,
    });

    saveCardsToStorage(savedCards);
  },

  loadCardForEdit: (cardId: string) => {
    const { savedCards } = get();
    const card = savedCards.find((c: SavedCard) => c.id === cardId);
    if (card) {
      set({
        synthesisItems: card.items,
        selectedFlavors: card.flavors,
        currentRecipeName: card.name,
        editingCardId: cardId,
      });
    }
  },

  clearSynthesis: () => {
    set({
      synthesisItems: [],
      selectedFlavors: [],
      currentRecipeName: '',
      editingCardId: null,
    });
  },

  deleteCard: (cardId: string) => {
    const { savedCards } = get();
    const newCards = savedCards.filter((c: SavedCard) => c.id !== cardId);
    set({ savedCards: newCards });
    saveCardsToStorage(newCards);
  },

  getTotalNutrition: (): Nutrition => {
    const { synthesisItems } = get();
    return synthesisItems.reduce(
      (total: Nutrition, item: SynthesisItem) => {
        const factor = item.quantity / 100;
        return {
          calories: total.calories + item.ingredient.nutrition.calories * factor,
          protein: total.protein + item.ingredient.nutrition.protein * factor,
          carbs: total.carbs + item.ingredient.nutrition.carbs * factor,
          fat: total.fat + item.ingredient.nutrition.fat * factor,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  },

  getNutrientPercentages: (): NutrientPercentages => {
    const nutrition = get().getTotalNutrition();
    const proteinCal = nutrition.protein * 4;
    const carbsCal = nutrition.carbs * 4;
    const fatCal = nutrition.fat * 9;
    const total = proteinCal + carbsCal + fatCal;

    if (total === 0) {
      return { protein: 33.33, carbs: 33.33, fat: 33.33 };
    }

    return {
      protein: Math.round((proteinCal / total) * 10000) / 100,
      carbs: Math.round((carbsCal / total) * 10000) / 100,
      fat: Math.round((fatCal / total) * 10000) / 100,
    };
  },

  getMissingFlavors: (): Flavor[] => {
    const { synthesisItems, selectedFlavors } = get();
    const allFlavors: Flavor[] = [
      ...new Set([
        ...selectedFlavors,
        ...synthesisItems.flatMap((item: SynthesisItem) => item.ingredient.flavors),
      ]),
    ];

    const idealFlavors: Flavor[] = ['salty', 'umami'];
    const missing: Flavor[] = [];

    for (const flavor of idealFlavors) {
      if (!allFlavors.includes(flavor)) {
        missing.push(flavor);
      }
    }

    if (synthesisItems.length >= 2 && allFlavors.length < 3) {
      const enhanceFlavors: Flavor[] = ['sweet', 'sour', 'spicy'];
      for (const flavor of enhanceFlavors) {
        if (!allFlavors.includes(flavor) && !missing.includes(flavor)) {
          missing.push(flavor);
        }
      }
    }

    return missing;
  },

  getRecommendedSeasonings: (): Ingredient[] => {
    const { ingredients, synthesisItems } = get();
    const missingFlavors = get().getMissingFlavors();
    const existingIds = new Set(synthesisItems.map((item: SynthesisItem) => item.ingredient.id));

    const recommendations: Ingredient[] = [];
    for (const flavor of missingFlavors) {
      const seasoning = ingredients.find(
        (ing: Ingredient) =>
          ing.category === 'seasoning' &&
          ing.flavors.includes(flavor) &&
          !existingIds.has(ing.id) &&
          !recommendations.some((r: Ingredient) => r.id === ing.id)
      );
      if (seasoning) {
        recommendations.push(seasoning);
      }
    }

    return recommendations.slice(0, 3);
  },

  calculateScore: (): RecipeScore => {
    const { synthesisItems, selectedFlavors } = get();
    const nutrition = get().getTotalNutrition();
    const percentages = get().getNutrientPercentages();

    const allFlavors = new Set([
      ...selectedFlavors,
      ...synthesisItems.flatMap((item: SynthesisItem) => item.ingredient.flavors),
    ]);

    const nutritionScore = (() => {
      const balance =
        100 -
        (Math.abs(percentages.protein - 30) +
          Math.abs(percentages.carbs - 40) +
          Math.abs(percentages.fat - 30)) /
          3;
      const calorieScore =
        nutrition.calories > 200 && nutrition.calories < 800
          ? 100
          : Math.max(0, 100 - Math.abs(500 - nutrition.calories) / 5);
      return Math.round((balance + calorieScore) / 2);
    })();

    const tasteScore = Math.round(
      (allFlavors.size / 6) * 60 + (synthesisItems.length > 1 ? 40 : 0)
    );

    const categorySet = new Set(synthesisItems.map((item: SynthesisItem) => item.ingredient.category));
    const creativityScore = Math.round(
      (categorySet.size / 4) * 50 + (allFlavors.size / 6) * 30 + Math.random() * 20
    );

    const difficultyScore = Math.round(
      Math.min(100, synthesisItems.length * 10 + allFlavors.size * 5)
    );

    const colorEmojis = ['🥦', '🥕', '🍅', '🫑', '🍄', '🥬', '🌶️'];
    const colorCount = synthesisItems.filter((item: SynthesisItem) =>
      colorEmojis.includes(item.ingredient.emoji)
    ).length;
    const appearanceScore = Math.round(
      (colorCount / 4) * 60 + (synthesisItems.length > 2 ? 40 : 20)
    );

    return {
      taste: Math.min(100, Math.max(0, tasteScore)),
      nutrition: Math.min(100, Math.max(0, nutritionScore)),
      creativity: Math.min(100, Math.max(0, creativityScore)),
      difficulty: Math.min(100, Math.max(0, difficultyScore)),
      appearance: Math.min(100, Math.max(0, appearanceScore)),
    };
  },

  getMainIngredient: (): Ingredient | null => {
    const { synthesisItems } = get();
    if (synthesisItems.length === 0) return null;

    const nonSeasoning = synthesisItems.filter(
      (item: SynthesisItem) => item.ingredient.category !== 'seasoning'
    );

    const items = nonSeasoning.length > 0 ? nonSeasoning : synthesisItems;
    return items.reduce((max: SynthesisItem, item: SynthesisItem) =>
      item.quantity > max.quantity ? item : max
    ).ingredient;
  },
}));
