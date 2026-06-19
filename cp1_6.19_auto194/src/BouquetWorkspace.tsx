import { useRef, useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useFlowerStore } from './store';
import type { Flower } from './types';

export default function BouquetWorkspace() {
  const { selectedFlowers, removeFlower, reorderFlowers, clearBouquet } = useFlowerStore();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const getBouquetGradient = () => {
    if (selectedFlowers.length === 0) return 'linear-gradient(135deg, #FFE4E1 0%, #FFF5F0 100%)';
    const colors = selectedFlowers.map(f => f.color);
    return `linear-gradient(135deg, ${colors.join(', ')})`;
  };

  const getFlowerStats = () => {
    const counts: Record<string, { flower: Flower; count: number }> = {};
    selectedFlowers.forEach(f => {
      if (counts[f.id]) {
        counts[f.id].count++;
      } else {
        counts[f.id] = { flower: f, count: 1 };
      }
    });
    return Object.values(counts);
  };

  const stats = getFlowerStats();

  return (
    <motion.div
      className="bouquet-workspace"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="workspace-header">
        <div>
          <h2>💐 花束工作区</h2>
          <span className="workspace-subtitle">
            {selectedFlowers.length === 0
              ? '从左侧花材库选择花朵，打造专属花束'
              : `已选 ${selectedFlowers.length} 枝花材 · 共 ${stats.length} 种`}
          </span>
        </div>
        {selectedFlowers.length > 0 && (
          <motion.button
            className="clear-btn"
            onClick={clearBouquet}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            🗑 清空花束
          </motion.button>
        )}
      </div>

      <div className="bouquet-preview-wrapper">
        <motion.div
          className="bouquet-preview"
          style={{ background: getBouquetGradient() }}
          animate={{
            background: getBouquetGradient()
          }}
          transition={{ duration: 0.5 }}
        >
          <AnimatePresence>
            {selectedFlowers.length === 0 ? (
              <motion.div
                className="empty-preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <span className="empty-icon">🌷</span>
                <p>花束预览区</p>
                <span className="empty-hint">添加花材后此处将展示组合效果</span>
              </motion.div>
            ) : (
              <motion.div
                className="bouquet-flowers-display"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Reorder.Group
                  axis="x"
                  values={selectedFlowers}
                  onReorder={(newOrder) => {
                    if (draggedIndex !== null) {
                      const flower = selectedFlowers[draggedIndex];
                      const newIndex = newOrder.findIndex(f => f === flower);
                      if (newIndex !== -1 && draggedIndex !== newIndex) {
                        reorderFlowers(draggedIndex, newIndex);
                      }
                    }
                  }}
                  className="flowers-flow"
                  as="div"
                >
                  {selectedFlowers.map((flower, index) => (
                    <Reorder.Item
                      key={`${flower.id}-${index}`}
                      value={flower}
                      onDragStart={() => setDraggedIndex(index)}
                      onDragEnd={() => setDraggedIndex(null)}
                      dragListener={true}
                    >
                      <motion.div
                        className="flower-thumb"
                        layout
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                          opacity: 1,
                          scale: draggedIndex === index ? 1.15 : 1,
                          zIndex: draggedIndex === index ? 10 : 1
                        }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={{
                          type: 'spring',
                          stiffness: 400,
                          damping: 25,
                          duration: 0.2
                        }}
                        whileHover={{ scale: 1.05, y: -2 }}
                      >
                        <div
                          className="thumb-bg"
                          style={{ backgroundColor: flower.color }}
                        />
                        <span className="thumb-icon">{flower.icon}</span>
                        <motion.button
                          className="thumb-remove"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFlower(flower.id);
                          }}
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          ×
                        </motion.button>
                        {stats.find(s => s.flower.id === flower.id)?.count! > 1 && (
                          <span className="thumb-count">
                            ×{stats.find(s => s.flower.id === flower.id)?.count}
                          </span>
                        )}
                      </motion.div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="workspace-footer">
        <div className="stats-section">
          <h4>📊 花材统计</h4>
          {stats.length === 0 ? (
            <p className="stats-empty">暂无花材</p>
          ) : (
            <div className="stats-list" ref={scrollContainerRef}>
              {stats.map(({ flower, count }) => (
                <motion.div
                  key={flower.id}
                  className="stat-item"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  layout
                >
                  <div
                    className="stat-color"
                    style={{ backgroundColor: flower.color }}
                  />
                  <span className="stat-icon">{flower.icon}</span>
                  <span className="stat-name">{flower.name}</span>
                  <span className="stat-count">×{count}</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="tips-section">
          <h4>💡 搭配小贴士</h4>
          <ul className="tips-list">
            <li>同色系搭配更显和谐统一</li>
            <li>加入绿叶能增加层次感</li>
            <li>主花3-5枝搭配辅花更精致</li>
            <li>拖拽花材可调整排列顺序</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
