import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { STYLES, WOODS, METALS } from '../data/catalog';
import { getWoodName, getMetalName, generateThumbnailSVG, getWoodColor } from '../utils/renderHelper';
import type { StyleId, HistoryEntry } from '../types';
import { useEffect, useState } from 'react';

interface PanelProps {
  onFavoriteAddResult?: (message: string, isError?: boolean) => void;
}

export const Panel = ({ onFavoriteAddResult }: PanelProps) => {
  const {
    styleId,
    woodId,
    metalId,
    setStyle,
    setWood,
    setMetal,
    getTopCombinations,
    applyCombination,
    addFavorite
  } = useAppStore();

  const [topCombos, setTopCombos] = useState<HistoryEntry[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);

  useEffect(() => {
    setTopCombos(getTopCombinations(styleId, 3));
  }, [styleId, getTopCombinations]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowRecommendations(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleStyleClick = (id: StyleId) => {
    setStyle(id);
  };

  const handleWoodClick = (id: string) => {
    setWood(id);
  };

  const handleMetalClick = (id: string) => {
    setMetal(id);
  };

  const handleApplyRecommendation = (entry: HistoryEntry) => {
    applyCombination(entry.woodId, entry.metalId);
  };

  const handleAddFavorite = () => {
    const result = addFavorite();
    if (onFavoriteAddResult && !result.success) {
      onFavoriteAddResult(result.message || '操作失败', true);
    } else if (onFavoriteAddResult && result.success) {
      onFavoriteAddResult('已添加到收藏夹');
    }
  };

  return (
    <motion.aside
      className="panel"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="panel-title">定制选择</h2>

      <section className="section">
        <h3 className="section-title">皮具款式</h3>
        <div className="style-buttons">
          {STYLES.map((style, index) => (
            <motion.button
              key={style.id}
              className={`style-btn ${styleId === style.id ? 'active' : ''}`}
              onClick={() => handleStyleClick(style.id)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              {style.name}
            </motion.button>
          ))}
        </div>
      </section>

      <section className="section">
        <h3 className="section-title">木材纹理</h3>
        <div className="material-grid">
          <AnimatePresence mode="popLayout">
            {WOODS.map((wood, index) => (
              <motion.div
                key={wood.id}
                className={`material-card wood-card ${
                  woodId === wood.id ? 'selected' : ''
                }`}
                onClick={() => handleWoodClick(wood.id)}
                whileHover={{ scale: 1.05, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.04, duration: 0.2 }}
              >
                <div
                  className="wood-swatch"
                  style={{ backgroundColor: wood.color }}
                />
                <span className="material-name">{wood.name}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      <section className="section">
        <h3 className="section-title">金属配件</h3>
        <div className="material-grid metal-grid">
          <AnimatePresence mode="popLayout">
            {METALS.map((metal, index) => (
              <motion.div
                key={metal.id}
                className={`material-card metal-card ${
                  metalId === metal.id ? 'selected' : ''
                }`}
                onClick={() => handleMetalClick(metal.id)}
                whileHover={{ scale: 1.05, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.04 + 0.1, duration: 0.2 }}
              >
                <div
                  className="metal-swatch"
                  style={{ backgroundColor: metal.color }}
                />
                <span className="material-name">{metal.name}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      <motion.button
        className="favorite-btn"
        onClick={handleAddFavorite}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <span className="heart-icon">♥</span> 收藏当前组合
      </motion.button>

      <section className="section recommendations-section">
        <h3 className="section-title">热门组合推荐</h3>
        <div className="recommendations-list">
          <AnimatePresence>
            {showRecommendations &&
              topCombos.map((combo, index) => (
                <motion.div
                  key={`${combo.woodId}-${combo.metalId}`}
                  className="recommendation-card"
                  onClick={() => handleApplyRecommendation(combo)}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                >
                  <div
                    className="recommendation-tag"
                    style={{ backgroundColor: getWoodColor(combo.woodId) }}
                  />
                  <div className="recommendation-info">
                    <span className="recommendation-name">
                      {getWoodName(combo.woodId)} + {getMetalName(combo.metalId)}
                    </span>
                    <span className="recommendation-count">
                      {combo.count} 人选择
                    </span>
                  </div>
                  <div
                    className="recommendation-thumb"
                    dangerouslySetInnerHTML={{
                      __html: generateThumbnailSVG(combo.woodId, combo.metalId, 36)
                    }}
                  />
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
      </section>
    </motion.aside>
  );
};
