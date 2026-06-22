import { useCallback } from 'react';
import { Plus } from 'lucide-react';
import { useStore } from '@/store/useStore';
import ExpiryBanner from '@/components/ExpiryBanner';
import StoragePanel from '@/components/StoragePanel';
import RecipePanel from '@/components/RecipePanel';
import WasteStats from '@/components/WasteStats';
import AddIngredientSidebar from '@/components/AddIngredientSidebar';
import type { MatchedRecipe } from '@/engine/recipeEngine';

export default function App() {
  const ingredients = useStore((s) => s.ingredients);
  const wasteRecords = useStore((s) => s.wasteRecords);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const addIngredient = useStore((s) => s.addIngredient);
  const removeIngredient = useStore((s) => s.removeIngredient);
  const updateIngredientQuantity = useStore((s) => s.updateIngredientQuantity);
  const consumeIngredients = useStore((s) => s.consumeIngredients);
  const openSidebar = useStore((s) => s.openSidebar);
  const closeSidebar = useStore((s) => s.closeSidebar);

  const handleAddIngredient = useCallback(
    (data: Parameters<typeof addIngredient>[0]) => {
      addIngredient(data);
    },
    [addIngredient],
  );

  const handleCook = useCallback(
    (recipe: MatchedRecipe) => {
      const items = recipe.availableIngredients.map((name) => {
        const ing = ingredients.find((i) => i.name === name);
        const recipeIng = recipe.ingredients.find((ri) => ri.name === name);
        return {
          name,
          quantity: recipeIng ? recipeIng.quantity : (ing ? 1 : 1),
        };
      });
      consumeIngredients(items);
    },
    [ingredients, consumeIngredients],
  );

  const handleUpdateQuantity = useCallback(
    (id: string, qty: number) => {
      if (qty <= 0) {
        removeIngredient(id);
      } else {
        updateIngredientQuantity(id, qty);
      }
    },
    [removeIngredient, updateIngredientQuantity],
  );

  return (
    <div className="min-h-screen bg-cream-100 font-sans">
      <header className="sticky top-0 z-30 bg-cream-50/80 backdrop-blur-md border-b border-cream-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-gray-800 tracking-tight">
              🧊 鲜存
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">冰箱食材管理与智能菜谱推荐</p>
          </div>
          <button
            type="button"
            onClick={openSidebar}
            className="flex items-center gap-2 rounded-full bg-category-vegetable px-5 py-2.5 text-sm font-medium text-white shadow-md hover:scale-105 active:scale-95 transition-transform"
          >
            <Plus size={16} />
            添加食材
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <ExpiryBanner ingredients={ingredients} />

        <StoragePanel
          ingredients={ingredients}
          onUpdateQuantity={handleUpdateQuantity}
          onRemove={removeIngredient}
        />

        <RecipePanel ingredients={ingredients} onCook={handleCook} />

        <WasteStats wasteRecords={wasteRecords} />
      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-xs text-gray-400">
        鲜存 · 减少浪费，从冰箱开始
      </footer>

      <AddIngredientSidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        onSubmit={handleAddIngredient}
      />
    </div>
  );
}
