import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../store';
import { Recipe } from '../types';
import './RecipeList.css';

interface RecipeListProps {
  onSelectRecipe: (recipe: Recipe) => void;
}

const RecipeList: React.FC<RecipeListProps> = memo(function RecipeList({ onSelectRecipe }) {
  const { state, dispatch } = useApp();

  const handleLike = (e: React.MouseEvent, recipeId: string) => {
    e.stopPropagation();
    dispatch({ type: 'LIKE_RECIPE', payload: recipeId });
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <motion.div
      className="recipe-list"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <h2 className="recipe-list-title">团队食谱库</h2>
      <div className="recipe-grid">
        {state.recipes.map((recipe) => (
          <motion.div
            key={recipe.id}
            className="recipe-card"
            variants={item}
            whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.15)' }}
            transition={{ duration: 0.3 }}
            onClick={() => onSelectRecipe(recipe)}
          >
            <div className="recipe-card-header">
              <h3 className="recipe-card-name">{recipe.name}</h3>
            </div>
            <div className="recipe-card-body">
              <div className="recipe-card-time">
                <span className="recipe-card-icon">⏱️</span>
                <span>{recipe.cookTime}</span>
              </div>
              <div className="recipe-card-ingredients">
                {recipe.ingredients.slice(0, 3).map((ing, idx) => (
                  <span key={idx} className="ingredient-tag">
                    {ing.name}
                  </span>
                ))}
                {recipe.ingredients.length > 3 && (
                  <span className="ingredient-tag more">
                    +{recipe.ingredients.length - 3}
                  </span>
                )}
              </div>
            </div>
            <div className="recipe-card-footer">
              <button
                className="like-btn"
                onClick={(e) => handleLike(e, recipe.id)}
              >
                <span className="like-icon">❤️</span>
                <span className="like-count">{recipe.likes}</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
});

export default RecipeList;
