import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RecipeCard } from './components/RecipeCard';
import { AddRecipeForm } from './components/AddRecipeForm';
import { RecipeDetail } from './components/RecipeDetail';
import { useAppStore } from '@/store/useAppStore';

export function RecipeModule() {
  const { recipes, searchQuery, selectedRecipeId, setSelectedRecipeId } = useAppStore();
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  const filteredRecipes = useMemo(() => {
    if (!searchQuery.trim()) return recipes;
    
    const query = searchQuery.toLowerCase();
    return recipes.filter((recipe) => {
      if (recipe.name.toLowerCase().includes(query)) return true;
      return recipe.ingredients.some((ing) =>
        ing.name.toLowerCase().includes(query)
      );
    });
  }, [recipes, searchQuery]);

  const selectedRecipe = useMemo(() => {
    if (!selectedRecipeId) return null;
    return recipes.find((r) => r.id === selectedRecipeId) || null;
  }, [recipes, selectedRecipeId]);

  return (
    <div style={{
      padding: 24,
      minWidth: 0,
      flex: 1,
      overflow: 'auto',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 700,
            color: '#2C3E50',
          }}>
            我的菜谱
          </h1>
          <p style={{
            margin: '4px 0 0 0',
            fontSize: 14,
            color: '#7F8C8D',
          }}>
            共 {filteredRecipes.length} 道菜谱
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsAddFormOpen(true)}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            backgroundColor: '#E67E22',
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#D35400';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#E67E22';
          }}
        >
          + 添加菜谱
        </motion.button>
      </div>

      <AnimatePresence mode="popLayout">
        <motion.div
          layout
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, 280px)',
            gap: 20,
            justifyContent: 'flex-start',
          }}
        >
          <AnimatePresence>
            {filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onClick={() => setSelectedRecipeId(recipe.id)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      {filteredRecipes.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#95A5A6',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>🍳</div>
          <p style={{ fontSize: 16, margin: 0 }}>
            {searchQuery ? '没有找到匹配的菜谱' : '还没有菜谱，快来添加第一道菜吧！'}
          </p>
        </motion.div>
      )}

      <AddRecipeForm
        isOpen={isAddFormOpen}
        onClose={() => setIsAddFormOpen(false)}
      />

      <RecipeDetail
        recipe={selectedRecipe}
        isOpen={!!selectedRecipe}
        onClose={() => setSelectedRecipeId(null)}
      />
    </div>
  );
}
