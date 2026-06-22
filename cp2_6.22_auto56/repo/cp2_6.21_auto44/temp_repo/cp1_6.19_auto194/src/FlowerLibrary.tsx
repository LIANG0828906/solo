import { motion, AnimatePresence } from 'framer-motion';
import { useFlowerStore } from './store';
import type { Flower } from './types';

export default function FlowerLibrary() {
  const { flowers, selectedFlowers, addFlower } = useFlowerStore();

  const isSelected = (flowerId: string) =>
    selectedFlowers.some(f => f.id === flowerId);

  const handleAdd = (flower: Flower) => {
    addFlower(flower);
  };

  return (
    <motion.div
      className="flower-library"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="library-header">
        <h2>🌸 花材库</h2>
        <span className="flower-count">共 {flowers.length} 种花材</span>
      </div>

      <div className="flower-grid">
        <AnimatePresence mode="popLayout">
          {flowers.map((flower, index) => (
            <motion.div
              key={flower.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{
                duration: 0.3,
                delay: index * 0.03,
                type: 'spring',
                stiffness: 300,
                damping: 25
              }}
              className={`flower-card ${isSelected(flower.id) ? 'selected' : ''}`}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <div className="flower-preview">
                <div
                  className="flower-color-dot"
                  style={{ backgroundColor: flower.color }}
                />
                <span className="flower-icon">{flower.icon}</span>
              </div>

              <div className="flower-info">
                <h3 className="flower-name">{flower.name}</h3>

                <div className="color-row">
                  <span className="color-label">颜色</span>
                  <div
                    className="color-block"
                    style={{ backgroundColor: flower.color }}
                    title={flower.color}
                  />
                </div>

                <p className="flower-meaning">{flower.meaning}</p>

                <div className="flower-tags">
                  {flower.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="mini-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <motion.button
                className={`add-btn ${isSelected(flower.id) ? 'added' : ''}`}
                onClick={() => handleAdd(flower)}
                whileTap={{ scale: 0.95 }}
              >
                {isSelected(flower.id) ? '✓ 已添加' : '+ 加入花束'}
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
