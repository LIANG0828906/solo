import React, { useState, useEffect, useCallback } from 'react';
import RecipeList from './components/RecipeList';
import RecipeForm from './components/RecipeForm';
import RecipeDetail from './components/RecipeDetail';
import { fetchRecipes, Recipe } from './utils/api';

type View = 'list' | 'form' | 'detail';

interface AppState {
  view: View;
  recipes: Recipe[];
  selectedId: string | null;
  editId: string | null;
  loading: boolean;
}

export default function App() {
  const [state, setState] = useState<AppState>({
    view: 'list',
    recipes: [],
    selectedId: null,
    editId: null,
    loading: true,
  });

  const loadRecipes = useCallback(async () => {
    try {
      const recipes = await fetchRecipes();
      setState((prev) => ({ ...prev, recipes, loading: false }));
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  const navigateToList = useCallback(() => {
    setState((prev) => ({ ...prev, view: 'list', selectedId: null, editId: null }));
  }, []);

  const navigateToForm = useCallback((editId?: string) => {
    setState((prev) => ({ ...prev, view: 'form', editId: editId || null, selectedId: null }));
  }, []);

  const navigateToDetail = useCallback((id: string) => {
    setState((prev) => ({ ...prev, view: 'detail', selectedId: id, editId: null }));
  }, []);

  const handleRecipeSaved = useCallback(() => {
    loadRecipes();
    navigateToList();
  }, [loadRecipes, navigateToList]);

  const handleRecipeDeleted = useCallback(() => {
    loadRecipes();
    navigateToList();
  }, [loadRecipes, navigateToList]);

  const handleBackToList = useCallback(() => {
    navigateToList();
  }, []);

  const handleEdit = useCallback((id: string) => {
    navigateToForm(id);
  }, [navigateToForm]);

  if (state.loading) {
    return (
      <>
        <header className="app-header">
          <h1 onClick={handleBackToList}>
            🍳 食谱管理<span>Recipe Manager</span>
          </h1>
        </header>
        <div className="main-content">
          <div className="loading">加载中...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <header className="app-header">
        <h1 onClick={handleBackToList}>
          🍳 食谱管理<span>Recipe Manager</span>
        </h1>
        {state.view === 'list' && (
          <button className="btn-add" onClick={() => navigateToForm()}>
            ＋ 添加食谱
          </button>
        )}
      </header>
      <div className="main-content">
        {state.view === 'list' && (
          <RecipeList
            recipes={state.recipes}
            onSelect={navigateToDetail}
            onAdd={() => navigateToForm()}
          />
        )}
        {state.view === 'form' && (
          <RecipeForm
            recipes={state.recipes}
            editId={state.editId}
            onSaved={handleRecipeSaved}
            onCancel={handleBackToList}
          />
        )}
        {state.view === 'detail' && state.selectedId && (
          <RecipeDetail
            recipeId={state.selectedId}
            recipes={state.recipes}
            onBack={handleBackToList}
            onEdit={handleEdit}
            onDeleted={handleRecipeDeleted}
          />
        )}
      </div>
    </>
  );
}
