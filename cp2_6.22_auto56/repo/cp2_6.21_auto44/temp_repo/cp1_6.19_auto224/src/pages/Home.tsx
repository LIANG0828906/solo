import { useEffect } from 'react';
import FridgePanel from '@/components/FridgePanel';
import RecipePanel from '@/components/RecipePanel';
import ShoppingDrawer from '@/components/ShoppingDrawer';
import { useStore } from '@/store/useStore';

export default function Home() {
  const {
    ingredients,
    recipes,
    preferences,
    selectedRecipe,
    shoppingList,
    shoppingListId,
    isDrawerOpen,
    isLoading,
    loadIngredients,
    addIngredientAction,
    updateIngredientAction,
    deleteIngredientAction,
    fetchRecommendations,
    selectRecipe,
    togglePreference,
    updateShoppingItem,
    removeShoppingItem,
    addShoppingItemNote,
    setDrawerOpen,
    generateShareLink,
  } = useStore();

  useEffect(() => {
    loadIngredients();
  }, [loadIngredients]);

  useEffect(() => {
    if (ingredients.length > 0) {
      fetchRecommendations();
    }
  }, [ingredients.length, fetchRecommendations]);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[var(--bg)] md:flex-row">
      <FridgePanel />
      <RecipePanel />
      <ShoppingDrawer />
    </div>
  );
}
