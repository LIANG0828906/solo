import { create } from 'zustand';
import { get, set } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import { ShoppingItem, Ingredient } from '../types';
import { getIngredientPrice } from '../data/mockRecipes';

interface ListState {
  items: ShoppingItem[];
  initStore: () => Promise<void>;
  addItem: (item: Omit<ShoppingItem, 'id'>) => Promise<void>;
  addIngredientFromRecipe: (ingredient: Ingredient) => Promise<void>;
  addMissingIngredients: (ingredients: Ingredient[], ownedIngredients: string[]) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  togglePurchased: (id: string) => Promise<void>;
  updateItemQuantity: (id: string, quantity: number) => Promise<void>;
  updateItemPrice: (id: string, price: number) => Promise<void>;
  clearPurchased: () => Promise<void>;
  getTotalPrice: () => number;
}

export const useListStore = create<ListState>((set, getState) => ({
  items: [],

  initStore: async () => {
    const storedItems = await get<ShoppingItem[]>('shoppingList');
    set({ items: storedItems || [] });
  },

  addItem: async (item) => {
    const { items } = getState();
    const existingIndex = items.findIndex(
      (i) => i.name === item.name && !i.purchased
    );

    let newItems: ShoppingItem[];
    if (existingIndex >= 0) {
      newItems = [...items];
      newItems[existingIndex] = {
        ...newItems[existingIndex],
        quantity: newItems[existingIndex].quantity + item.quantity,
      };
    } else {
      newItems = [...items, { ...item, id: uuidv4() }];
    }

    set({ items: newItems });
    await set('shoppingList', newItems);
  },

  addIngredientFromRecipe: async (ingredient) => {
    const price = getIngredientPrice(ingredient.name) * ingredient.quantity;
    await getState().addItem({
      name: ingredient.name,
      emoji: ingredient.emoji,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      price,
      purchased: false,
    });
  },

  addMissingIngredients: async (ingredients, ownedIngredients) => {
    const missing = ingredients.filter(
      (ing) => !ownedIngredients.includes(ing.name)
    );
    for (const ing of missing) {
      await getState().addIngredientFromRecipe(ing);
    }
  },

  removeItem: async (id) => {
    const { items } = getState();
    const newItems = items.filter((i) => i.id !== id);
    set({ items: newItems });
    await set('shoppingList', newItems);
  },

  togglePurchased: async (id) => {
    const { items } = getState();
    const newItems = items.map((i) =>
      i.id === id ? { ...i, purchased: !i.purchased } : i
    );
    set({ items: newItems });
    await set('shoppingList', newItems);
  },

  updateItemQuantity: async (id, quantity) => {
    const { items } = getState();
    const newItems = items.map((i) =>
      i.id === id ? { ...i, quantity } : i
    );
    set({ items: newItems });
    await set('shoppingList', newItems);
  },

  updateItemPrice: async (id, price) => {
    const { items } = getState();
    const newItems = items.map((i) => (i.id === id ? { ...i, price } : i));
    set({ items: newItems });
    await set('shoppingList', newItems);
  },

  clearPurchased: async () => {
    const { items } = getState();
    const newItems = items.filter((i) => !i.purchased);
    set({ items: newItems });
    await set('shoppingList', newItems);
  },

  getTotalPrice: () => {
    const { items } = getState();
    return items.reduce((sum, item) => sum + (item.purchased ? 0 : item.price), 0);
  },
}));
