import React, { useState, useCallback, useMemo } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import type { CookingMethod, IngredientEntry, NutritionInfo } from './types';
import { calculateNutrition } from './utils/nutritionCalc';
import RecipeEditor from './components/RecipeEditor';
import NutritionPanel from './components/NutritionPanel';

export default function App() {
  const [recipeName, setRecipeName] = useState('');
  const [cookingMethod, setCookingMethod] = useState<CookingMethod | null>(null);
  const [ingredients, setIngredients] = useState<IngredientEntry[]>([]);

  const nutrition = useMemo(() => calculateNutrition(ingredients), [ingredients]);

  const handleAddIngredient = useCallback((ingredient: IngredientEntry) => {
    setIngredients(prev => [...prev, ingredient]);
    toast.success(`已添加 ${ingredient.emoji} ${ingredient.name}`);
  }, []);

  const handleRemoveIngredient = useCallback((id: string) => {
    setIngredients(prev => {
      const removed = prev.find(i => i.id === id);
      if (removed) toast(`已移除 ${removed.emoji} ${removed.name}`, { icon: '🗑️' });
      return prev.filter(ing => ing.id !== id);
    });
  }, []);

  const handleUpdateGrams = useCallback((id: string, grams: number) => {
    setIngredients(prev => prev.map(ing => (ing.id === id ? { ...ing, grams } : ing)));
  }, []);

  const handleReorderIngredients = useCallback((fromIndex: number, toIndex: number) => {
    setIngredients(prev => {
      const next = [...prev];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, removed);
      return next;
    });
  }, []);

  return (
    <div className="app">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 1500,
          style: {
            background: '#4A3728',
            color: '#FAF3E0',
            borderRadius: '12px',
            fontSize: '14px',
          },
        }}
      />
      <header className="app-header">
        <div className="header-deco" />
        <div className="header-content">
          <h1 className="header-title">🧪 烹饪实验室</h1>
          <p className="header-subtitle">记录你的食谱创新之旅</p>
        </div>
        <div className="header-deco" />
      </header>
      <main className="app-content">
        <section className="content-left">
          <RecipeEditor
            recipeName={recipeName}
            cookingMethod={cookingMethod}
            ingredients={ingredients}
            onRecipeNameChange={setRecipeName}
            onCookingMethodChange={setCookingMethod}
            onAddIngredient={handleAddIngredient}
            onRemoveIngredient={handleRemoveIngredient}
            onUpdateGrams={handleUpdateGrams}
            onReorderIngredients={handleReorderIngredients}
          />
        </section>
        <aside className="content-right">
          <NutritionPanel nutrition={nutrition} />
        </aside>
      </main>
    </div>
  );
}
