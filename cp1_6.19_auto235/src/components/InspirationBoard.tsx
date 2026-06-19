import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useDesignStore, LayoutType } from '../store/useDesignStore';
import { isWarmColor, generateGradient } from '../utils/colorUtils';
import { getFontFamily, getRecommendedFontPairs, sampleText, layoutTitles, layoutAuthors } from '../utils/fontUtils';

const layoutTypes: LayoutType[] = ['text-center', 'image-top', 'image-bg'];
const layoutLabels: Record<LayoutType, string> = {
  'text-center': '文字居中',
  'image-top': '图文上下',
  'image-bg': '图片背景'
};

export const InspirationBoard: React.FC = () => {
  const primaryColors = useDesignStore(state => state.primaryColors);
  const accentColors = useDesignStore(state => state.accentColors);
  const fontPairs = useDesignStore(state => state.fontPairs);
  const setFontPairs = useDesignStore(state => state.setFontPairs);
  const selectedLayout = useDesignStore(state => state.selectedLayout);
  const expandedLayout = useDesignStore(state => state.expandedLayout);
  const setSelectedLayout = useDesignStore(state => state.setSelectedLayout);
  const setExpandedLayout = useDesignStore(state => state.setExpandedLayout);

  const [modalIndex, setModalIndex] = useState(0);

  useEffect(() => {
    if (primaryColors.length > 0) {
      const isWarm = isWarmColor(primaryColors[0].hex);
      const pairs = getRecommendedFontPairs(isWarm);
      setFontPairs(pairs);
    }
  }, [primaryColors, setFontPairs]);

  const handleLayoutClick = (index: number) => {
    setModalIndex(index);
    setSelectedLayout(layoutTypes[index]);
    setExpandedLayout(true);
  };

  const handleCloseModal = () => {
    setExpandedLayout(false);
    setSelectedLayout(null);
  };

  const handlePrevLayout = () => {
    setModalIndex(prev => (prev - 1 + layoutTypes.length) % layoutTypes.length);
  };

  const handleNextLayout = () => {
    setModalIndex(prev => (prev + 1) % layoutTypes.length);
  };

  const getGradientForCard = (index: number) => {
    if (primaryColors.length === 0 || accentColors.length === 0) {
      return 'linear-gradient(135deg, #4A90D9 0%, #FF6B6B 100%)';
    }
    const fromColor = primaryColors[index % primaryColors.length]?.hex || primaryColors[0].hex;
    const toColor = accentColors[index % accentColors.length]?.hex || accentColors[0].hex;
    return generateGradient(fromColor, toColor);
  };

  const getBackgroundColor = (index: number) => {
    if (primaryColors.length === 0) return '#4A90D9';
    return primaryColors[index % primaryColors.length]?.hex || primaryColors[0].hex;
  };

  if (primaryColors.length === 0) {
    return (
      <div className="font-pairs-section">
        <h3 className="section-title">字体搭配 & 布局参考</h3>
        <div style={{
          padding: '24px',
          textAlign: 'center',
          color: 'var(--color-text-secondary)',
          fontSize: '13px',
          background: 'var(--color-white)',
          borderRadius: '8px',
          border: '1px dashed var(--color-panel-border)'
        }}>
          请上传图片以生成配色方案和字体推荐
        </div>
      </div>
    );
  }

  return (
    <div className="inspiration-board">
      <div className="font-pairs-section">
        <h3 className="section-title">字体搭配推荐</h3>
        <div className="font-cards-container">
          {fontPairs.map((pair, index) => (
            <motion.div
              key={pair.id}
              className="font-card"
              style={{ background: getGradientForCard(index) }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div
                className="font-card-title"
                style={{ fontFamily: getFontFamily(pair.titleFont) }}
              >
                书籍标题示例
              </div>
              <div
                className="font-card-body"
                style={{ fontFamily: getFontFamily(pair.bodyFont) }}
              >
                {sampleText}
              </div>
              <div className="font-card-footer">
                {pair.titleFont} + {pair.bodyFont}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="layout-section">
        <h3 className="section-title">封面布局参考</h3>
        <div className="layout-thumbs-container">
          {layoutTypes.map((type, index) => (
            <motion.div
              key={type}
              className={`layout-thumb ${type}`}
              onClick={() => handleLayoutClick(index)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 + 0.3 }}
            >
              <div className="layout-thumb-label">{layoutLabels[type]}</div>
              <div
                className="layout-thumb-content"
                style={{ backgroundColor: getBackgroundColor(index) }}
              >
                <div className="layout-thumb-title">{layoutTitles[index]}</div>
                <div className="layout-thumb-author">{layoutAuthors[index]}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {expandedLayout && (
          <motion.div
            className="layout-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseModal}
          >
            <motion.div
              className={`layout-modal ${layoutTypes[modalIndex]}`}
              style={{ backgroundColor: getBackgroundColor(modalIndex) }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="layout-close-btn" onClick={handleCloseModal}>
                <X size={24} />
              </button>
              <button className="layout-nav-btn prev" onClick={handlePrevLayout}>
                <ChevronLeft size={24} />
              </button>
              <button className="layout-nav-btn next" onClick={handleNextLayout}>
                <ChevronRight size={24} />
              </button>
              <div className="layout-modal-content">
                <div className="layout-modal-title">{layoutTitles[modalIndex]}</div>
                <div className="layout-modal-author">{layoutAuthors[modalIndex]}</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
