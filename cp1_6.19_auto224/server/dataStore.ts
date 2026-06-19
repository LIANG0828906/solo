import { Ingredient, ShoppingList } from './types';
import { v4 as uuidv4 } from 'uuid';

class DataStore {
  private ingredients: Map<string, Ingredient>;
  private shoppingLists: Map<string, ShoppingList>;

  constructor() {
    this.ingredients = new Map();
    this.shoppingLists = new Map();
    this.initializeData();
  }

  private initializeData() {
    const today = new Date();
    const addDays = (days: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    };

    const sampleIngredients: Ingredient[] = [
      { id: uuidv4(), name: '番茄', quantity: 5, unit: '个', category: '蔬菜', expiryDate: addDays(2) },
      { id: uuidv4(), name: '鸡蛋', quantity: 12, unit: '个', category: '蛋类', expiryDate: addDays(15) },
      { id: uuidv4(), name: '猪肉', quantity: 500, unit: '克', category: '肉类', expiryDate: addDays(-1) },
      { id: uuidv4(), name: '土豆', quantity: 4, unit: '个', category: '蔬菜', expiryDate: addDays(10) },
      { id: uuidv4(), name: '青椒', quantity: 6, unit: '个', category: '蔬菜', expiryDate: addDays(1) },
      { id: uuidv4(), name: '西兰花', quantity: 2, unit: '棵', category: '蔬菜', expiryDate: addDays(3) },
      { id: uuidv4(), name: '米饭', quantity: 1000, unit: '克', category: '主食', expiryDate: addDays(30) },
      { id: uuidv4(), name: '豆腐', quantity: 400, unit: '克', category: '豆制品', expiryDate: addDays(0) },
    ];

    sampleIngredients.forEach(ing => this.ingredients.set(ing.id, ing));
  }

  getIngredients(): Ingredient[] {
    return Array.from(this.ingredients.values());
  }

  getIngredientById(id: string): Ingredient | undefined {
    return this.ingredients.get(id);
  }

  addIngredient(ingredient: Omit<Ingredient, 'id'>): Ingredient {
    const newIngredient: Ingredient = { ...ingredient, id: uuidv4() };
    this.ingredients.set(newIngredient.id, newIngredient);
    return newIngredient;
  }

  updateIngredient(id: string, updates: Partial<Ingredient>): Ingredient | undefined {
    const ingredient = this.ingredients.get(id);
    if (!ingredient) return undefined;
    const updated = { ...ingredient, ...updates };
    this.ingredients.set(id, updated);
    return updated;
  }

  deleteIngredient(id: string): boolean {
    return this.ingredients.delete(id);
  }

  addShoppingList(items: ShoppingList['items']): ShoppingList {
    const shareId = Math.random().toString(36).substring(2, 10);
    const shoppingList: ShoppingList = {
      id: uuidv4(),
      shareId,
      items,
      createdAt: new Date().toISOString(),
    };
    this.shoppingLists.set(shoppingList.id, shoppingList);
    this.shoppingLists.set(shareId, shoppingList);
    return shoppingList;
  }

  getShoppingListByIdOrShareId(id: string): ShoppingList | undefined {
    return this.shoppingLists.get(id);
  }
}

export const dataStore = new DataStore();
