import { useState, useEffect, useCallback, useRef } from 'react';
import { openDB, IDBPDatabase, DBSchema } from 'idb';
import type {
  Ingredient,
  Recipe,
  WeeklyPlanItem,
  ShoppingListItem,
} from '../types';
import { defaultIngredients, defaultRecipes } from '../data/defaultData';

interface FridgeDB extends DBSchema {
  ingredients: {
    key: number;
    value: Ingredient;
    indexes: { 'by-name': string; 'by-category': string; 'by-expiry': string };
  };
  recipes: {
    key: number;
    value: Recipe;
    indexes: { 'by-name': string };
  };
  weeklyPlan: {
    key: number;
    value: WeeklyPlanItem;
    indexes: { 'by-date': string; 'by-mealType': string };
  };
  shoppingList: {
    key: number;
    value: ShoppingListItem;
    indexes: { 'by-name': string; 'by-category': string };
  };
}

const DB_NAME = 'fridge-manager-db';
const DB_VERSION = 1;

export function useIndexedDB<T extends { id?: number }>(storeName: keyof FridgeDB) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const dbRef = useRef<IDBPDatabase<FridgeDB> | null>(null);

  const initDB = useCallback(async () => {
    if (dbRef.current) return dbRef.current;

    const db = await openDB<FridgeDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('ingredients')) {
          const ingredientsStore = db.createObjectStore('ingredients', {
            keyPath: 'id',
            autoIncrement: true,
          });
          ingredientsStore.createIndex('by-name', 'name');
          ingredientsStore.createIndex('by-category', 'category');
          ingredientsStore.createIndex('by-expiry', 'expiryDate');
        }

        if (!db.objectStoreNames.contains('recipes')) {
          const recipesStore = db.createObjectStore('recipes', {
            keyPath: 'id',
            autoIncrement: true,
          });
          recipesStore.createIndex('by-name', 'name');
        }

        if (!db.objectStoreNames.contains('weeklyPlan')) {
          const weeklyPlanStore = db.createObjectStore('weeklyPlan', {
            keyPath: 'id',
            autoIncrement: true,
          });
          weeklyPlanStore.createIndex('by-date', 'date');
          weeklyPlanStore.createIndex('by-mealType', 'mealType');
        }

        if (!db.objectStoreNames.contains('shoppingList')) {
          const shoppingListStore = db.createObjectStore('shoppingList', {
            keyPath: 'id',
            autoIncrement: true,
          });
          shoppingListStore.createIndex('by-name', 'name');
          shoppingListStore.createIndex('by-category', 'category');
        }
      },
    });

    dbRef.current = db;
    return db;
  }, []);

  const initializeWithDefaults = useCallback(async () => {
    const db = await initDB();
    const ingredientsCount = await db.count('ingredients');
    const recipesCount = await db.count('recipes');

    if (ingredientsCount === 0) {
      const tx = db.transaction('ingredients', 'readwrite');
      await Promise.all(
        defaultIngredients.map((ing) => tx.store.add(ing as Ingredient))
      );
      await tx.done;
    }

    if (recipesCount === 0) {
      const tx = db.transaction('recipes', 'readwrite');
      await Promise.all(
        defaultRecipes.map((recipe) => tx.store.add(recipe as Recipe))
      );
      await tx.done;
    }
  }, [initDB]);

  const refreshData = useCallback(async () => {
    const db = await initDB();
    const allData = await db.getAll(storeName);
    setData(allData as T[]);
  }, [initDB, storeName]);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      await initDB();
      if (storeName === 'ingredients' || storeName === 'recipes') {
        await initializeWithDefaults();
      }
      if (mounted) {
        await refreshData();
        setLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [initDB, initializeWithDefaults, refreshData, storeName]);

  const addItem = useCallback(
    async (item: Omit<T, 'id'>): Promise<number> => {
      const db = await initDB();
      const id = await db.add(storeName, item as T);
      await refreshData();
      return Number(id);
    },
    [initDB, refreshData, storeName]
  );

  const updateItem = useCallback(
    async (id: number, item: Partial<T>): Promise<void> => {
      const db = await initDB();
      const existing = await db.get(storeName, id);
      if (existing) {
        await db.put(storeName, { ...existing, ...item, id } as T);
        await refreshData();
      }
    },
    [initDB, refreshData, storeName]
  );

  const deleteItem = useCallback(
    async (id: number): Promise<void> => {
      const db = await initDB();
      await db.delete(storeName, id);
      await refreshData();
    },
    [initDB, refreshData, storeName]
  );

  const getItem = useCallback(
    async (id: number): Promise<T | undefined> => {
      const db = await initDB();
      const item = await db.get(storeName, id);
      return item as T | undefined;
    },
    [initDB, storeName]
  );

  const bulkAdd = useCallback(
    async (items: Omit<T, 'id'>[]): Promise<void> => {
      const db = await initDB();
      const tx = db.transaction(storeName, 'readwrite');
      await Promise.all(items.map((item) => tx.store.add(item as T)));
      await tx.done;
      await refreshData();
    },
    [initDB, refreshData, storeName]
  );

  const clearAll = useCallback(async (): Promise<void> => {
    const db = await initDB();
    await db.clear(storeName);
    await refreshData();
  }, [initDB, refreshData, storeName]);

  return {
    data,
    loading,
    addItem,
    updateItem,
    deleteItem,
    getItem,
    bulkAdd,
    clearAll,
    refreshData,
  };
}
