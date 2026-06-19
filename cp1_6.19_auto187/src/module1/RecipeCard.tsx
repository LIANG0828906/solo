import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Recipe, FLAVOR_TAGS } from './types';
import { useRecipeStore } from '../store/useRecipeStore';
import { getGradientFromTags, getPrimaryTagColor } from '../utils/flavorUtils';
import { getFoodIcon } from '../assets/icons/FoodIcons';

function highlightText(text: string, search: string): React.ReactNode {
  if (!search.trim()) {
    return text;
  }

  const lowerText = text.toLowerCase();
  const lowerSearch = search.toLowerCase();
  const index = lowerText.indexOf(lowerSearch);

  if (index === -1) {
    return text;
  }

  return (
    <>
      {text.slice(0, index)}
      <mark style={{ backgroundColor: '#FFE66D', padding: '0 2px', borderRadius: '3px' }}>
        {text.slice(index, index + search.length)}
      </mark>
      {text.slice(index + search.length)}
    </>
  );
}

interface RecipeCardProps {
  recipe: Recipe;
  isHovered: boolean;
  isDimmed: boolean;
  searchText: string;
}

const RecipeCardComponent: React.FC<RecipeCardProps> = ({ recipe, isHovered, isDimmed, searchText }) => {
  const { setHoveredRecipe, selectRecipe, likeRecipe } = useRecipeStore();
  const gradient = getGradientFromTags(recipe.flavorTags);
  const primaryColor = getPrimaryTagColor(recipe.flavorTags);
  const tags = recipe.flavorTags
    .map((id) => FLAVOR_TAGS.find((t) => t.id === id))
    .filter((t): t is NonNullable<typeof t> => t !== undefined);

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          style={{
            color: i <= Math.round(rating) ? '#FFD93D' : '#D2B48C',
            fontSize: '14px',
          }}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <motion.div
      layout
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: isHovered ? 1.1 : 1,
        opacity: isDimmed ? 0.3 : 1,
        zIndex: isHovered ? 50 : 1,
      }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onMouseEnter={() => setHoveredRecipe(recipe.id)}
      onMouseLeave={() => setHoveredRecipe(null)}
      onClick={() => selectRecipe(recipe.id)}
      style={{
        position: 'absolute',
        width: '170px',
        background: gradient,
        borderRadius: '16px',
        padding: '14px',
        boxShadow: isHovered ? 'var(--shadow-card-hover)' : 'var(--shadow-card)',
        cursor: 'pointer',
        border: '2px dashed rgba(139, 111, 71, 0.3)',
        transformOrigin: 'center center',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-handwriting)',
          fontSize: '24px',
          fontWeight: 700,
          color: 'var(--color-text)',
          textAlign: 'center',
          marginBottom: '8px',
          lineHeight: 1.2,
        }}
      >
        {highlightText(recipe.name, searchText)}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '70px',
          margin: '4px 0 10px',
        }}
      >
        {getFoodIcon(recipe.icon, 60)}
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px',
          justifyContent: 'center',
          marginBottom: '10px',
        }}
      >
        {tags.map((tag) => (
          <span
            key={tag.id}
            style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '999px',
              background: tag.color,
              color: '#5C4033',
              fontWeight: 600,
              border: '1px solid rgba(92, 64, 51, 0.2)',
            }}
          >
            {tag.name}
          </span>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: 'var(--color-text)',
        }}
      >
        <div style={{ display: 'flex', gap: '1px' }}>{renderStars(recipe.rating)}</div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            likeRecipe(recipe.id);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            color: primaryColor,
            fontWeight: 600,
            padding: '2px 6px',
            borderRadius: '999px',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.5)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }}
        >
          <span>♥</span>
          <span>{recipe.likes}</span>
        </button>
      </div>

      {isHovered && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: '10px',
            paddingTop: '10px',
            borderTop: '1px dashed rgba(139, 111, 71, 0.3)',
            fontSize: '12px',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--color-text)' }}>
            食材：
          </div>
          <div style={{ color: 'var(--color-text-light)', lineHeight: 1.4 }}>
            {recipe.ingredients.slice(0, 4).join('、')}
            {recipe.ingredients.length > 4 && '...'}
          </div>
          <div style={{ fontWeight: 600, marginTop: '6px', marginBottom: '2px', color: 'var(--color-text)' }}>
            做法：
          </div>
          <div style={{ color: 'var(--color-text-light)', lineHeight: 1.4 }}>
            {recipe.steps[0]}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export const RecipeCard = memo(RecipeCardComponent);
