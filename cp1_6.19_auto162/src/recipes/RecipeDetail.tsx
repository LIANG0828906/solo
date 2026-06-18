import React, { memo, useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Recipe, Editor, EventType, FlyingIngredient } from '../types';
import { eventBus } from '../eventBus';
import './RecipeDetail.css';

interface RecipeDetailProps {
  recipe: Recipe;
  onClose: () => void;
}

const RecipeDetail: React.FC<RecipeDetailProps> = memo(function RecipeDetail({ recipe, onClose }) {
  const [selectedEditor, setSelectedEditor] = useState<Editor | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleIngredientClick = useCallback((ingredientName: string, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    
    const flyingData: FlyingIngredient = {
      name: ingredientName,
      startX: rect.left + rect.width / 2,
      startY: rect.top + rect.height / 2,
      endX: window.innerWidth - 170,
      endY: 200,
    };
    
    eventBus.emit(EventType.INGREDIENT_CLICK, flyingData);
  }, []);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.3,
        staggerChildren: 0.1,
      },
    },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const stepVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: 'easeOut',
      },
    }),
  };

  return (
    <AnimatePresence>
      <motion.div
        className="recipe-detail-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="recipe-detail-modal"
          ref={contentRef}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <motion.button
            className="close-btn"
            onClick={onClose}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            ✕
          </motion.button>

          <motion.div className="recipe-detail-image" variants={itemVariants}>
            <div className="image-placeholder">
              <span className="food-icon">🍳</span>
              <span className="recipe-name-overlay">{recipe.name}</span>
            </div>
          </motion.div>

          <motion.div className="recipe-detail-header" variants={itemVariants}>
            <h2 className="recipe-detail-title">{recipe.name}</h2>
            <div className="recipe-detail-meta">
              <span className="meta-item">⏱️ {recipe.cookTime}</span>
              <span className="meta-item">❤️ {recipe.likes} 人喜欢</span>
            </div>
          </motion.div>

          <motion.div className="recipe-detail-section" variants={itemVariants}>
            <h3 className="section-title">🥗 配料清单</h3>
            <div className="ingredients-list">
              {recipe.ingredients.map((ing, idx) => (
                <motion.div
                  key={idx}
                  className="ingredient-row"
                  whileHover={{ backgroundColor: '#FFE4B5' }}
                  transition={{ duration: 0.2 }}
                  onClick={(e) => handleIngredientClick(ing.name, e)}
                >
                  <span className="ingredient-name">{ing.name}</span>
                  <span className="ingredient-amount">{ing.amount}</span>
                </motion.div>
              ))}
            </div>
            <p className="ingredient-hint">💡 点击食材可添加到库存</p>
          </motion.div>

          <motion.div className="recipe-detail-section" variants={itemVariants}>
            <h3 className="section-title">👨‍🍳 制作步骤</h3>
            <div className="steps-list">
              {recipe.steps.map((step, idx) => (
                <motion.div
                  key={idx}
                  className="step-item"
                  custom={idx}
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <div className="step-number">{idx + 1}</div>
                  <p className="step-text">{step}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div className="recipe-detail-section collaboration-section" variants={itemVariants}>
            <h3 className="section-title">👥 协作编辑</h3>
            <div className="editors-list">
              {recipe.editors.map((editor, idx) => (
                <motion.div
                  key={idx}
                  className="editor-item"
                  whileHover={{ y: -2 }}
                  onClick={() => setSelectedEditor(editor)}
                >
                  <div className="editor-avatar">
                    <span>{editor.name.charAt(0)}</span>
                  </div>
                  <div className="editor-info">
                    <span className="editor-name">{editor.name}</span>
                    <span className="editor-time">{formatDate(editor.editTime)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <AnimatePresence>
            {selectedEditor && (
              <motion.div
                className="editor-popup"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => setSelectedEditor(null)}
              >
                <div className="popup-content" onClick={(e) => e.stopPropagation()}>
                  <div className="popup-avatar">
                    <span>{selectedEditor.name.charAt(0)}</span>
                  </div>
                  <h4>{selectedEditor.name}</h4>
                  <p>最近编辑：{formatDate(selectedEditor.editTime)}</p>
                  <p className="edit-record">贡献了 3 条食谱修改</p>
                  <button className="popup-close" onClick={() => setSelectedEditor(null)}>
                    关闭
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

export default RecipeDetail;
