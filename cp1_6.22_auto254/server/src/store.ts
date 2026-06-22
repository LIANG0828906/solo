import { v4 as uuidv4 } from 'uuid';
import type { Drink, Ingredient, Sale } from '@shared/types';

let drinks: Drink[] = [];
let ingredients: Ingredient[] = [];
let sales: Sale[] = [];

function nowISO(): string {
  return new Date().toISOString();
}

function initDefaultData(): void {
  const defaultIngredients: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>[] = [
    { name: '浓缩咖啡', stock: 5000, unit: 'ml', purchasePrice: 0.002, warningThreshold: 500 },
    { name: '牛奶', stock: 20000, unit: 'ml', purchasePrice: 0.001, warningThreshold: 2000 },
    { name: '南瓜泥', stock: 3000, unit: 'g', purchasePrice: 0.008, warningThreshold: 300 },
    { name: '肉桂粉', stock: 500, unit: 'g', purchasePrice: 0.015, warningThreshold: 50 },
    { name: '可可粉', stock: 800, unit: 'g', purchasePrice: 0.012, warningThreshold: 80 },
    { name: '香草糖浆', stock: 2000, unit: 'ml', purchasePrice: 0.005, warningThreshold: 200 },
    { name: '焦糖糖浆', stock: 2000, unit: 'ml', purchasePrice: 0.005, warningThreshold: 200 },
    { name: '榛果糖浆', stock: 1500, unit: 'ml', purchasePrice: 0.006, warningThreshold: 150 },
    { name: '红茶包', stock: 200, unit: '个', purchasePrice: 0.8, warningThreshold: 20 },
    { name: '抹茶粉', stock: 400, unit: 'g', purchasePrice: 0.05, warningThreshold: 40 },
    { name: '奶油', stock: 5000, unit: 'ml', purchasePrice: 0.003, warningThreshold: 500 },
    { name: '巧克力酱', stock: 1500, unit: 'g', purchasePrice: 0.01, warningThreshold: 150 },
  ];

  ingredients = defaultIngredients.map((ing) => ({
    id: uuidv4(),
    ...ing,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  }));

  const findIngredientByName = (name: string) => ingredients.find((i) => i.name === name);

  const defaultDrinks: Omit<Drink, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      name: '秋日南瓜拿铁',
      description: '融合南瓜泥与肉桂香的季节特调',
      category: 'seasonal',
      price: 38,
      costPrice: 12,
      ingredients: [
        { ingredientId: findIngredientByName('浓缩咖啡')!.id, ingredientName: '浓缩咖啡', amount: 30, unit: 'ml' },
        { ingredientId: findIngredientByName('牛奶')!.id, ingredientName: '牛奶', amount: 200, unit: 'ml' },
        { ingredientId: findIngredientByName('南瓜泥')!.id, ingredientName: '南瓜泥', amount: 30, unit: 'g' },
        { ingredientId: findIngredientByName('肉桂粉')!.id, ingredientName: '肉桂粉', amount: 2, unit: 'g' },
      ],
    },
    {
      name: '经典拿铁',
      description: '浓郁意式浓缩与丝滑牛奶的完美融合',
      category: 'classic',
      price: 28,
      costPrice: 8,
      ingredients: [
        { ingredientId: findIngredientByName('浓缩咖啡')!.id, ingredientName: '浓缩咖啡', amount: 30, unit: 'ml' },
        { ingredientId: findIngredientByName('牛奶')!.id, ingredientName: '牛奶', amount: 220, unit: 'ml' },
      ],
    },
    {
      name: '香草拿铁',
      description: '经典拿铁搭配香草风味，香甜顺滑',
      category: 'classic',
      price: 32,
      costPrice: 10,
      ingredients: [
        { ingredientId: findIngredientByName('浓缩咖啡')!.id, ingredientName: '浓缩咖啡', amount: 30, unit: 'ml' },
        { ingredientId: findIngredientByName('牛奶')!.id, ingredientName: '牛奶', amount: 200, unit: 'ml' },
        { ingredientId: findIngredientByName('香草糖浆')!.id, ingredientName: '香草糖浆', amount: 15, unit: 'ml' },
      ],
    },
    {
      name: '焦糖玛奇朵',
      description: '焦糖风味与意式浓缩的经典组合',
      category: 'classic',
      price: 35,
      costPrice: 12,
      ingredients: [
        { ingredientId: findIngredientByName('浓缩咖啡')!.id, ingredientName: '浓缩咖啡', amount: 30, unit: 'ml' },
        { ingredientId: findIngredientByName('牛奶')!.id, ingredientName: '牛奶', amount: 180, unit: 'ml' },
        { ingredientId: findIngredientByName('焦糖糖浆')!.id, ingredientName: '焦糖糖浆', amount: 20, unit: 'ml' },
        { ingredientId: findIngredientByName('奶油')!.id, ingredientName: '奶油', amount: 30, unit: 'ml' },
      ],
    },
    {
      name: '抹茶拿铁',
      description: '日式宇治抹茶与牛奶的清新邂逅',
      category: 'classic',
      price: 36,
      costPrice: 14,
      ingredients: [
        { ingredientId: findIngredientByName('抹茶粉')!.id, ingredientName: '抹茶粉', amount: 5, unit: 'g' },
        { ingredientId: findIngredientByName('牛奶')!.id, ingredientName: '牛奶', amount: 250, unit: 'ml' },
        { ingredientId: findIngredientByName('香草糖浆')!.id, ingredientName: '香草糖浆', amount: 10, unit: 'ml' },
      ],
    },
    {
      name: '冬日肉桂可可',
      description: '浓郁热可可搭配肉桂温暖冬日',
      category: 'seasonal',
      price: 32,
      costPrice: 10,
      ingredients: [
        { ingredientId: findIngredientByName('可可粉')!.id, ingredientName: '可可粉', amount: 25, unit: 'g' },
        { ingredientId: findIngredientByName('牛奶')!.id, ingredientName: '牛奶', amount: 200, unit: 'ml' },
        { ingredientId: findIngredientByName('肉桂粉')!.id, ingredientName: '肉桂粉', amount: 3, unit: 'g' },
        { ingredientId: findIngredientByName('奶油')!.id, ingredientName: '奶油', amount: 20, unit: 'ml' },
      ],
    },
  ];

  drinks = defaultDrinks.map((drink) => ({
    id: uuidv4(),
    ...drink,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  }));

  const baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0);

  for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
    const saleDate = new Date(baseDate);
    saleDate.setDate(saleDate.getDate() - dayOffset);
    const dateStr = saleDate.toISOString().split('T')[0];

    const orderCount = 30 + Math.floor(Math.random() * 40);

    for (let order = 0; order < orderCount; order++) {
      const numItems = 1 + Math.floor(Math.random() * 3);
      const items: Sale['items'] = [];
      const shuffledDrinks = [...drinks].sort(() => Math.random() - 0.5);

      for (let i = 0; i < numItems && i < shuffledDrinks.length; i++) {
        const drink = shuffledDrinks[i];
        const quantity = 1 + Math.floor(Math.random() * 2);
        const unitCost = drink.ingredients.reduce(
          (sum, ing) => sum + (ingredients.find((x) => x.id === ing.ingredientId)?.purchasePrice || 0) * ing.amount,
          0
        );
        items.push({
          drinkId: drink.id,
          drinkName: drink.name,
          quantity,
          unitPrice: drink.price,
          unitCost: Number(unitCost.toFixed(2)),
          subtotal: drink.price * quantity,
          totalCost: Number((unitCost * quantity).toFixed(2)),
        });
      }

      const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
      const totalCost = items.reduce((sum, item) => sum + item.totalCost, 0);

      sales.push({
        id: uuidv4(),
        items,
        totalAmount,
        totalCost,
        totalProfit: Number((totalAmount - totalCost).toFixed(2)),
        saleDate: dateStr,
        createdAt: saleDate.toISOString(),
      });
    }
  }
}

initDefaultData();

export const store = {
  getDrinks: (): Drink[] => drinks,
  getDrinkById: (id: string): Drink | undefined => drinks.find((d) => d.id === id),
  addDrink: (drink: Omit<Drink, 'id' | 'createdAt' | 'updatedAt'>): Drink => {
    const newDrink: Drink = {
      id: uuidv4(),
      ...drink,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };
    drinks.push(newDrink);
    return newDrink;
  },
  updateDrink: (id: string, updates: Partial<Drink>): Drink | undefined => {
    const index = drinks.findIndex((d) => d.id === id);
    if (index === -1) return undefined;
    drinks[index] = { ...drinks[index], ...updates, updatedAt: nowISO() };
    return drinks[index];
  },
  deleteDrink: (id: string): boolean => {
    const index = drinks.findIndex((d) => d.id === id);
    if (index === -1) return false;
    drinks.splice(index, 1);
    return true;
  },

  getIngredients: (): Ingredient[] => ingredients,
  getIngredientById: (id: string): Ingredient | undefined => ingredients.find((i) => i.id === id),
  getIngredientByName: (name: string): Ingredient | undefined => ingredients.find((i) => i.name === name),
  addIngredient: (ingredient: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>): Ingredient => {
    const newIngredient: Ingredient = {
      id: uuidv4(),
      ...ingredient,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };
    ingredients.push(newIngredient);
    return newIngredient;
  },
  updateIngredient: (id: string, updates: Partial<Ingredient>): Ingredient | undefined => {
    const index = ingredients.findIndex((i) => i.id === id);
    if (index === -1) return undefined;
    ingredients[index] = { ...ingredients[index], ...updates, updatedAt: nowISO() };
    return ingredients[index];
  },
  deleteIngredient: (id: string): boolean => {
    const index = ingredients.findIndex((i) => i.id === id);
    if (index === -1) return false;
    ingredients.splice(index, 1);
    return true;
  },
  deductStock: (ingredientId: string, amount: number): boolean => {
    const ingredient = ingredients.find((i) => i.id === ingredientId);
    if (!ingredient || ingredient.stock < amount) return false;
    ingredient.stock = Number((ingredient.stock - amount).toFixed(2));
    ingredient.updatedAt = nowISO();
    return true;
  },

  getSales: (): Sale[] => sales,
  getSalesByDate: (dateStr: string): Sale[] => sales.filter((s) => s.saleDate === dateStr),
  getSalesByDateRange: (startDate: string, endDate: string): Sale[] =>
    sales.filter((s) => s.saleDate >= startDate && s.saleDate <= endDate),
  addSale: (sale: Omit<Sale, 'id' | 'createdAt'>): Sale => {
    const newSale: Sale = {
      id: uuidv4(),
      ...sale,
      createdAt: nowISO(),
    };
    sales.push(newSale);
    return newSale;
  },
};
