import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Recipe } from '../types';
import { MATERIAL_INFO } from '../data/recipes';

interface NewRecipeModalProps {
  recipe: Recipe | null;
  onClose: () => void;
}

export const NewRecipeModal: React.FC<NewRecipeModalProps> = ({ recipe, onClose }) => {
  if (!recipe) return null;

  return (
    <AnimatePresence>
      {recipe && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="relative z-10"
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 10 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 20,
            }}
          >
            {/* 光芒效果 */}
            <motion.div
              className="absolute inset-0 -m-8 rounded-full"
              style={{
                background:
                  'radial-gradient(circle, rgba(255,215,0,0.4) 0%, transparent 70%)',
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* 羊皮纸卡片 */}
            <div
              className="relative rounded-lg p-8 max-w-sm w-full"
              style={{
                background: 'linear-gradient(135deg, #F5DEB3 0%, #FFF8DC 50%, #F5DEB3 100%)',
                boxShadow:
                  '0 10px 40px rgba(0,0,0,0.3), inset 0 0 30px rgba(139, 90, 43, 0.2)',
                border: '2px solid #8D6E63',
              }}
            >
              {/* 烧焦边缘效果 */}
              <div
                className="absolute inset-0 rounded-lg pointer-events-none"
                style={{
                  boxShadow:
                    'inset 0 0 20px rgba(139, 69, 19, 0.3), inset 0 0 40px rgba(139, 69, 19, 0.1)',
                }}
              />

              {/* 内容 */}
              <div className="relative text-center">
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className="text-4xl">📜</span>
                </motion.div>

                <motion.h2
                  className="text-2xl font-bold mt-4 mb-2"
                  style={{
                    color: '#5D4037',
                    fontFamily: 'serif',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                  }}
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  发现新配方！
                </motion.h2>

                <motion.div
                  className="my-6"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
                >
                  <div
                    className="mx-auto w-16 h-20 rounded-b-full rounded-t-sm relative overflow-hidden border-2 border-amber-700/50"
                    style={{
                      background: recipe.potionGradient,
                      boxShadow: `0 0 20px ${recipe.potionColor}60`,
                    }}
                  >
                    <div className="absolute top-1 left-2 w-2 h-10 rounded-full bg-white/30" />
                  </div>
                </motion.div>

                <motion.h3
                  className="text-xl font-bold text-amber-900 mb-2"
                  style={{ fontFamily: 'serif' }}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {recipe.name}
                </motion.h3>

                <motion.p
                  className="text-amber-800/70 text-sm mb-4"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  {recipe.effect}
                </motion.p>

                <motion.div
                  className="flex justify-center gap-3 mb-4"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  {recipe.materials.map((mat, i) => {
                    const info = MATERIAL_INFO[mat];
                    return (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <div
                          className="w-10 h-10 rounded-full border-2 border-amber-700/30 shadow"
                          style={{
                            background: info.gradient,
                            boxShadow: `0 0 8px ${info.color}40`,
                          }}
                        />
                        <span className="text-xs text-amber-800/70">
                          {info.name}
                        </span>
                      </div>
                    );
                  })}
                </motion.div>

                <motion.p
                  className="text-amber-800/60 text-xs italic mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  最佳温度: {recipe.optimalTemp.min}-{recipe.optimalTemp.max}°C
                  <br />
                  最佳搅拌: {recipe.optimalStir.min}-{recipe.optimalStir.max}
                </motion.p>

                <motion.button
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold shadow-lg"
                  style={{ fontFamily: 'serif' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.9 }}
                >
                  太棒了！
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
