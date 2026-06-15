import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import HomePage from '@/pages/HomePage';
import CommunityPage from '@/pages/CommunityPage';
import RecipeDetailPage from '@/pages/RecipeDetailPage';
import CreateRecipePage from '@/pages/CreateRecipePage';
import { useRecipeStore } from '@/modules/recipes/RecipeStore';
import { usePostStore } from '@/modules/community/PostStore';

const App: React.FC = () => {
  const initRecipes = useRecipeStore((s) => s.init);
  const initPosts = usePostStore((s) => s.init);

  useEffect(() => {
    initRecipes();
    initPosts();
  }, [initRecipes, initPosts]);

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/recipe/:id" element={<RecipeDetailPage />} />
            <Route path="/create" element={<CreateRecipePage />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </main>
        <footer className="py-6 text-center text-xs text-cocoa-200 border-t border-cream-200 bg-cream-100/50">
          <p className="mb-1">
            🍳 家的味道 · 家庭食谱分享平台
          </p>
          <p className="opacity-70">
            用 ❤️ 记录每一道传家菜 · IndexedDB 本地持久化存储
          </p>
        </footer>
      </div>
    </BrowserRouter>
  );
};

export default App;
