import { motion, AnimatePresence } from 'framer-motion';
import { useFlowerStore } from './store';
import { getEmotionColor } from './data';
import type { Bouquet, EmotionTagType } from './types';

export default function RecommendationPanel() {
  const {
    emotionTags,
    recommendedBouquets,
    activeTag,
    setActiveTag,
    applyBouquet
  } = useFlowerStore();

  const handleTagClick = (tag: EmotionTagType) => {
    if (activeTag === tag) {
      setActiveTag(null);
    } else {
      setActiveTag(tag);
    }
  };

  const handleApplyBouquet = (bouquet: Bouquet) => {
    applyBouquet(bouquet);
  };

  const filteredBouquets = activeTag
    ? recommendedBouquets.filter(b => b.tags.includes(activeTag))
    : recommendedBouquets;

  return (
    <motion.div
      className="recommendation-panel"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <div className="panel-header">
        <h2>🎯 智能推荐</h2>
        <span className="panel-subtitle">AI情感分析 & 搭配建议</span>
      </div>

      <div className="tags-section">
        <h3>
          🏷️ 情感标签
          {activeTag && (
            <button className="clear-tag-btn" onClick={() => setActiveTag(null)}>
              清除筛选
            </button>
          )}
        </h3>

        <AnimatePresence mode="popLayout">
          {emotionTags.length === 0 ? (
            <motion.div
              key="empty-tags"
              className="empty-tags"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <span>添加花材后自动生成情感标签</span>
            </motion.div>
          ) : (
            <motion.div
              className="tag-cloud"
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {emotionTags.map((tag, index) => {
                const isActive = activeTag === tag.name;
                const fontSize = 12 + Math.max(0, (tag.score - 20) / 15);
                return (
                  <motion.button
                    key={tag.name}
                    className={`emotion-tag ${isActive ? 'active' : ''}`}
                    style={{
                      backgroundColor: tag.color,
                      fontSize: `${fontSize}px`
                    }}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.05,
                      type: 'spring',
                      stiffness: 400,
                      damping: 20
                    }}
                    whileHover={{ scale: 1.08, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleTagClick(tag.name)}
                  >
                    <span className="tag-name">{tag.name}</span>
                    <span className="tag-score">{tag.score}%</span>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="bouquet-rec-section">
        <h3>
          💐 推荐花束
          {filteredBouquets.length !== recommendedBouquets.length && (
            <span className="filter-hint">
              （筛选后 {filteredBouquets.length} 款）
            </span>
          )}
        </h3>

        <AnimatePresence mode="popLayout">
          {filteredBouquets.length === 0 ? (
            <motion.div
              key="empty-bouquets"
              className="empty-bouquets"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <span>暂无匹配的花束推荐</span>
            </motion.div>
          ) : (
            <div className="bouquet-rec-list">
              {filteredBouquets.map((bouquet, index) => (
                <motion.div
                  key={bouquet.id}
                  className="bouquet-rec-card"
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.08,
                    type: 'spring',
                    stiffness: 300,
                    damping: 25
                  }}
                  whileHover={{
                    y: -6,
                    boxShadow: '0 12px 32px rgba(233, 30, 99, 0.15)',
                    transition: { duration: 0.2 }
                  }}
                  onClick={() => handleApplyBouquet(bouquet)}
                >
                  <div
                    className="bouquet-thumbnail"
                    style={{
                      background: `linear-gradient(135deg, ${bouquet.thumbnailColors.join(', ')})`
                    }}
                  >
                    <div className="bouquet-flower-icons">
                      {bouquet.flowerIds.slice(0, 3).map((id, i) => {
                        const flower = useFlowerStore.getState().flowers.find(f => f.id === id);
                        return flower ? (
                          <span
                            key={`${id}-${i}`}
                            className="bouquet-icon"
                            style={{ zIndex: 3 - i }}
                          >
                            {flower.icon}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>

                  <div className="bouquet-card-info">
                    <h4 className="bouquet-name">{bouquet.name}</h4>
                    <div className="bouquet-card-tags">
                      {bouquet.tags.map(tag => (
                        <span
                          key={tag}
                          className="bouquet-tag"
                          style={{
                            backgroundColor: `${getEmotionColor(tag)}22`,
                            color: getEmotionColor(tag),
                            border: activeTag === tag ? `2px solid ${getEmotionColor(tag)}` : '2px solid transparent'
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="apply-hint">点击应用此搭配 →</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
