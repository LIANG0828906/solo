import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FLAVOR_TAGS } from '../module1/types';
import { useRecipeStore } from '../store/useRecipeStore';
import { getGradientFromTags, getPrimaryTagColor } from '../utils/flavorUtils';
import { getFoodIcon } from '../assets/icons/FoodIcons';

export const RecipeModal: React.FC = () => {
  const { recipes, selectedRecipeId, selectRecipe, likeRecipe } = useRecipeStore();

  const recipe = recipes.find((r) => r.id === selectedRecipeId);

  const renderStars = (rating: number) => {
    return (
      <div style={{ display: 'flex', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} style={{ color: i <= Math.round(rating) ? '#FFD93D' : '#D2B48C', fontSize: '18px' }}>
            ★
          </span>
        ))}
      </div>
    );
  };

  if (!recipe) return null;

  const gradient = getGradientFromTags(recipe.flavorTags);
  const primaryColor = getPrimaryTagColor(recipe.flavorTags);
  const tags = recipe.flavorTags
    .map((id) => FLAVOR_TAGS.find((t) => t.id === id))
    .filter((t): t is NonNullable<typeof t> => t !== undefined);

  return (
    <AnimatePresence>
      {selectedRecipeId && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => selectRecipe(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: '#00000080',
              zIndex: 200,
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '90%',
              maxWidth: '480px',
              maxHeight: '90vh',
              zIndex: 201,
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 24px 80px rgba(0, 0, 0, 0.4)',
            }}
          >
            <div
              style={{
                background: gradient,
                padding: '24px',
                textAlign: 'center',
                position: 'relative',
              }}
            >
              <button
                onClick={() => selectRecipe(null)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.5)',
                  border: 'none',
                  fontSize: '16px',
                  color: '#5C4033',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                {getFoodIcon(recipe.icon, 80)}
              </div>

              <h2
                style={{
                  fontFamily: 'var(--font-handwriting)',
                  fontSize: '40px',
                  color: '#5C4033',
                  fontWeight: 700,
                  marginBottom: '8px',
                }}
              >
                {recipe.name}
              </h2>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '12px' }}>
                {tags.map((tag) => (
                  <span
                    key={tag.id}
                    style={{
                      fontSize: '13px',
                      padding: '4px 12px',
                      borderRadius: '999px',
                      background: 'rgba(255, 255, 255, 0.6)',
                      color: '#5C4033',
                      fontWeight: 600,
                    }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
                {renderStars(recipe.rating)}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.1 }}
                  onClick={() => likeRecipe(recipe.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 12px',
                    borderRadius: '999px',
                    background: 'rgba(255, 255, 255, 0.6)',
                    color: primaryColor,
                    fontWeight: 700,
                    fontSize: '14px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  ♥ {recipe.likes}
                </motion.button>
              </div>
            </div>

            <div
              style={{
                background: '#FEFAF0',
                padding: '24px',
                maxHeight: '50vh',
                overflowY: 'auto',
              }}
            >
              <p
                style={{
                  fontSize: '15px',
                  color: '#5C4033',
                  lineHeight: 1.6,
                  marginBottom: '20px',
                  padding: '12px',
                  background: '#F5E6C8',
                  borderRadius: '10px',
                  borderLeft: '3px solid #D2B48C',
                }}
              >
                📝 {recipe.description}
              </p>

              <div style={{ marginBottom: '20px' }}>
                <h3
                  style={{
                    fontFamily: 'var(--font-handwriting)',
                    fontSize: '24px',
                    color: '#5C4033',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  🥗 食材清单
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {recipe.ingredients.map((ing, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '4px 12px',
                        background: '#FFFFFF',
                        borderRadius: '999px',
                        border: '1.5px dashed #D2B48C',
                        fontSize: '13px',
                        color: '#5C4033',
                      }}
                    >
                      {ing}
                    </span>
                  ))}
                </div>
                <div
                  style={{
                    marginTop: '8px',
                    fontSize: '13px',
                    color: '#8B7355',
                  }}
                >
                  烹饪方式：{recipe.cookingMethod}
                </div>
              </div>

              <div>
                <h3
                  style={{
                    fontFamily: 'var(--font-handwriting)',
                    fontSize: '24px',
                    color: '#5C4033',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  👨‍🍳 烹饪步骤
                </h3>
                <ol style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {recipe.steps.map((step, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      style={{
                        display: 'flex',
                        gap: '12px',
                        padding: '10px 12px',
                        background: '#FFFFFF',
                        borderRadius: '10px',
                        border: '1px solid #E8D5B0',
                        lineHeight: 1.5,
                      }}
                    >
                      <span
                        style={{
                          flexShrink: 0,
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          background: primaryColor,
                          color: '#5C4033',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '13px',
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span style={{ fontSize: '14px', color: '#5C4033', flex: 1 }}>{step}</span>
                    </motion.li>
                  ))}
                </ol>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
