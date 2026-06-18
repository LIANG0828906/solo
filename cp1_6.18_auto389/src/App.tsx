import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';

const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })));
const RecipeDetailPage = lazy(() =>
  import('@/pages/RecipeDetailPage').then((m) => ({ default: m.RecipeDetailPage }))
);
const AddRecipePage = lazy(() =>
  import('@/pages/AddRecipePage').then((m) => ({ default: m.AddRecipePage }))
);
const ShoppingListPage = lazy(() =>
  import('@/pages/ShoppingListPage').then((m) => ({ default: m.ShoppingListPage }))
);

const LoadingFallback = () => (
  <div className="container page-wrapper" style={{ textAlign: 'center', color: '#999' }}>
    加载中...
  </div>
);

export const App: React.FC = () => {
  return (
    <Router>
      <Navbar />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/recipe/:id" element={<RecipeDetailPage />} />
          <Route path="/add" element={<AddRecipePage />} />
          <Route path="/shopping" element={<ShoppingListPage />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;
