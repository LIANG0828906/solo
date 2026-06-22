import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppProvider } from './store';
import RecipeList from './recipes/RecipeList';
import RecipeDetail from './recipes/RecipeDetail';
import InventoryPanel from './inventory/InventoryPanel';
import PredictionPanel from './inventory/PredictionPanel';
import { Recipe } from './types';
import './App.css';

function AppContent() {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const handleSelectRecipe = useCallback((recipe: Recipe) => {
    setSelectedRecipe(recipe);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedRecipe(null);
  }, []);

  return (
    <div className="app-container">
      <motion.nav
        className="navbar"
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className="navbar-content">
          <div className="nav-brand">
            <span className="brand-icon">🍳</span>
            <span className="brand-name">团队食谱协作</span>
          </div>
          <div className="nav-links">
            <a href="#" className="nav-link">食谱库</a>
            <a href="#" className="nav-link">食材库存</a>
            <a href="#" className="nav-link">智能预测</a>
            <a href="#" className="nav-link">关于我们</a>
          </div>
        </div>
      </motion.nav>

      <main className="main-content">
        <div className="content-wrapper">
          <RecipeList onSelectRecipe={handleSelectRecipe} />
          <div className="sidebar">
            <InventoryPanel />
            <PredictionPanel />
          </div>
        </div>
      </main>

      <AnimatePresence>
        {selectedRecipe && (
          <RecipeDetail
            recipe={selectedRecipe}
            onClose={handleCloseDetail}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
