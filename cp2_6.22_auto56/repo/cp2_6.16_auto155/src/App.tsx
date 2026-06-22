import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import HomePage from '@/pages/HomePage';
import AllRecipesPage from '@/pages/AllRecipesPage';
import RecipeDetailPage from '@/pages/RecipeDetailPage';
import NewRecipePage from '@/pages/NewRecipePage';
import { useRecipeStore } from '@/store/recipeStore';

export default function App() {
  const init = useRecipeStore(state => state.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1, marginTop: 56 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/recipes" element={<AllRecipesPage />} />
          <Route path="/recipes/new" element={<NewRecipePage />} />
          <Route path="/recipes/:id" element={<RecipeDetailPage />} />
        </Routes>
      </main>
    </div>
  );
}
