import { motion, AnimatePresence } from 'framer-motion';
import type { Recipe } from '@/types';
import { getCategoryName } from '@/utils/recipeParser';

interface RecipeDetailProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RecipeDetail({ recipe, isOpen, onClose }: RecipeDetailProps) {
  if (!recipe) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(44, 62, 80, 0.5)',
              zIndex: 100,
            }}
            onClick={onClose}
          />
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: 400,
              height: '100vh',
              backgroundColor: 'rgba(44, 62, 80, 0.8)',
              backdropFilter: 'blur(10px)',
              zIndex: 101,
              overflowY: 'auto',
              boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{
              height: 180,
              backgroundColor: recipe.coverColor,
              position: 'relative',
            }}>
              <button
                onClick={onClose}
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: 20,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                ×
              </button>
              <div style={{
                position: 'absolute',
                bottom: 20,
                left: 24,
                right: 24,
              }}>
                <h2 style={{
                  margin: 0,
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                }}>
                  {recipe.name}
                </h2>
                <div style={{
                  marginTop: 8,
                  display: 'flex',
                  gap: 12,
                }}>
                  <span style={{
                    fontSize: 13,
                    color: 'rgba(255, 255, 255, 0.9)',
                  }}>
                    {recipe.ingredients.length} 种食材
                  </span>
                  <span style={{
                    fontSize: 13,
                    color: 'rgba(255, 255, 255, 0.9)',
                  }}>
                    {recipe.steps.length} 个步骤
                  </span>
                </div>
              </div>
            </div>

            <div style={{
              padding: '24px',
              color: '#FFFFFF',
            }}>
              <div style={{ marginBottom: 24 }}>
                <h3 style={{
                  margin: '0 0 12px 0',
                  fontSize: 16,
                  fontWeight: 600,
                  color: '#FFF8F0',
                  paddingLeft: 8,
                  borderLeft: '4px solid #E67E22',
                }}>
                  食材清单
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                }}>
                  {recipe.ingredients.map((ing) => (
                    <div
                      key={ing.id}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: 8,
                        fontSize: 13,
                      }}
                    >
                      <div style={{ color: '#FFFFFF', fontWeight: 500 }}>
                        {ing.name}
                      </div>
                      <div style={{
                        fontSize: 11,
                        color: 'rgba(255, 255, 255, 0.6)',
                        marginTop: 2,
                      }}>
                        {ing.quantity} {ing.unit} · {getCategoryName(ing.category)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 style={{
                  margin: '0 0 12px 0',
                  fontSize: 16,
                  fontWeight: 600,
                  color: '#FFF8F0',
                  paddingLeft: 8,
                  borderLeft: '4px solid #E67E22',
                }}>
                  烹饪步骤
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {recipe.steps.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      style={{
                        display: 'flex',
                        gap: 12,
                        padding: '12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: 10,
                      }}
                    >
                      <span style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: '#E67E22',
                        color: '#FFFFFF',
                        fontSize: 12,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {index + 1}
                      </span>
                      <p style={{
                        margin: 0,
                        fontSize: 13,
                        lineHeight: 1.6,
                        color: 'rgba(255, 255, 255, 0.9)',
                      }}>
                        {step}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
