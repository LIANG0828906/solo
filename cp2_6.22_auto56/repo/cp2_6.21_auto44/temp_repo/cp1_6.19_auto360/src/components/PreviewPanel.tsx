import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useContentStore } from '../store/useContentStore';
import { getIconById, getAllIconIds } from '../utils/svgIcons';
import { getComplementaryColor } from '../utils/splitContent';

const transitionVariants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slide: {
    initial: { x: 100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -100, opacity: 0 },
  },
  flip: {
    initial: { rotateX: -90, opacity: 0 },
    animate: { rotateX: 0, opacity: 1 },
    exit: { rotateX: 90, opacity: 0 },
  },
  zoom: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 1.2, opacity: 0 },
  },
};

function Card({ 
  card, 
  index, 
  isHighlighted,
  onClick 
}: { 
  card: any; 
  index: number;
  isHighlighted: boolean;
  onClick: () => void;
}) {
  const [iconKey, setIconKey] = useState(0);
  const iconColor = getComplementaryColor(card.themeColor);
  
  const iconSvg = getIconById(card.iconId);
  const coloredSvg = iconSvg.replace(
    '<svg',
    `<svg style="color: ${iconColor}"`
  );

  const handleReplaceIcon = (e: React.MouseEvent) => {
    e.stopPropagation();
    useContentStore.getState().setIconPickerFor(card.id);
  };

  return (
    <motion.div
      id={card.id}
      className={`card-item ${isHighlighted ? 'highlighted' : ''}`}
      style={{ backgroundColor: card.themeColor }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ scale: 1.02, y: -4 }}
      onClick={onClick}
    >
      <div className="card-header">
        <div className="card-icon-wrapper">
          <motion.div
            key={iconKey}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="card-icon"
            dangerouslySetInnerHTML={{ __html: coloredSvg }}
          />
        </div>
        <div className="card-index">{index + 1}</div>
      </div>
      
      <div className="card-content">
        <div className="card-text">{card.text}</div>
      </div>
      
      <div className="card-footer">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="replace-icon-btn"
          onClick={handleReplaceIcon}
        >
          更换图标
        </motion.button>
      </div>
      
      {isHighlighted && (
        <motion.div
          className="highlight-glow"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}

function IconPicker({ 
  cardId, 
  onClose 
}: { 
  cardId: string;
  onClose: () => void; 
}) {
  const iconIds = getAllIconIds();
  const { replaceIcon } = useContentStore();

  const handleSelect = (iconId: string) => {
    replaceIcon(cardId, iconId);
    onClose();
  };

  return (
    <motion.div
      className="icon-picker-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="icon-picker-modal"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>选择图标</h3>
        <div className="icon-grid">
          {iconIds.map((iconId) => (
            <motion.button
              key={iconId}
              className="icon-option"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelect(iconId)}
              dangerouslySetInnerHTML={{ __html: getIconById(iconId) }}
            />
          ))}
        </div>
        <motion.button
          className="close-picker-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
        >
          关闭
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

function FullscreenViewer() {
  const { 
    cards, 
    fullscreenIndex, 
    setFullscreenIndex, 
    toggleFullscreen,
    transitionEffect,
    isIconPickerFor,
    setIconPickerFor
  } = useContentStore();
  
  const [direction, setDirection] = useState(0);
  const currentCard = cards[fullscreenIndex];
  
  if (!currentCard) return null;

  const iconColor = getComplementaryColor(currentCard.themeColor);
  const iconSvg = getIconById(currentCard.iconId);
  const coloredSvg = iconSvg.replace(
    '<svg',
    `<svg style="color: ${iconColor}"`
  );

  const goPrev = () => {
    setDirection(-1);
    setFullscreenIndex(fullscreenIndex - 1);
  };

  const goNext = () => {
    setDirection(1);
    setFullscreenIndex(fullscreenIndex + 1);
  };

  const variants = transitionVariants[transitionEffect] || transitionVariants.fade;

  const handleReplaceIcon = () => {
    setIconPickerFor(currentCard.id);
  };

  return (
    <motion.div
      className="fullscreen-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => toggleFullscreen()}
    >
      <motion.button
        className="fullscreen-close"
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => {
          e.stopPropagation();
          toggleFullscreen();
        }}
      >
        ✕
      </motion.button>

      <div className="fullscreen-card-wrapper" onClick={(e) => e.stopPropagation()}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentCard.id}
            className="fullscreen-card"
            style={{ backgroundColor: currentCard.themeColor }}
            initial={variants.initial}
            animate={variants.animate}
            exit={variants.exit}
            transition={{ duration: 0.5 }}
          >
            <div className="card-header">
              <div className="card-icon-wrapper">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, ease: 'easeOut', delay: 0.2 }}
                  className="card-icon"
                  dangerouslySetInnerHTML={{ __html: coloredSvg }}
                />
              </div>
              <div className="card-index">{fullscreenIndex + 1} / {cards.length}</div>
            </div>
            
            <div className="card-content">
              <div className="card-text">{currentCard.text}</div>
            </div>
            
            <div className="card-footer">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="replace-icon-btn"
                onClick={handleReplaceIcon}
              >
                更换图标
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {fullscreenIndex > 0 && (
        <motion.button
          className="nav-btn nav-prev"
          whileHover={{ scale: 1.1, x: -4 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
        >
          ‹
        </motion.button>
      )}

      {fullscreenIndex < cards.length - 1 && (
        <motion.button
          className="nav-btn nav-next"
          whileHover={{ scale: 1.1, x: 4 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
        >
          ›
        </motion.button>
      )}

      <AnimatePresence>
        {isIconPickerFor && (
          <IconPicker cardId={isIconPickerFor} onClose={() => setIconPickerFor(null)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AnimationControlBar() {
  const { 
    transitionEffect, 
    setTransition, 
    cards,
    isExporting,
    setExporting
  } = useContentStore();

  const transitions = [
    { id: 'fade', name: '淡入淡出', icon: '◐' },
    { id: 'slide', name: '向左滑动', icon: '→' },
    { id: 'flip', name: '向下翻页', icon: '↕' },
    { id: 'zoom', name: '缩放', icon: '⊙' },
  ];

  const handleExport = async () => {
    if (cards.length === 0) return;
    
    setExporting(true);
    
    try {
      const { cards: cardData, currentTheme, currentFont, transitionEffect: transition } = useContentStore.getState();
      
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cards: cardData,
          theme: currentTheme,
          font: currentFont,
          transition: transition,
        }),
      });
      
      const data = await response.json();
      
      const blob = new Blob([data.html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '拆文成卡.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('导出失败:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <motion.div 
      className="animation-control-bar"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.3, type: 'spring' }}
    >
      <div className="control-section">
        <span className="control-label">过渡效果</span>
        <div className="transition-options">
          {transitions.map((t) => (
            <motion.button
              key={t.id}
              className={`transition-btn ${transitionEffect === t.id ? 'active' : ''}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTransition(t.id as any)}
            >
              <span className="transition-icon">{t.icon}</span>
              <span className="transition-name">{t.name}</span>
            </motion.button>
          ))}
        </div>
      </div>
      
      <div className="control-section">
        <motion.button
          className="export-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleExport}
          disabled={isExporting || cards.length === 0}
        >
          {isExporting ? '导出中...' : '📥 导出HTML'}
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function PreviewPanel() {
  const { 
    cards, 
    highlightedCardId, 
    toggleFullscreen,
    isFullscreen,
    currentTheme,
    currentFont,
    isIconPickerFor,
    setIconPickerFor
  } = useContentStore();

  const themeStyles: Record<string, { bg: string; text: string; radius: number }> = {
    light: { bg: '#f5f5f5', text: '#333', radius: 8 },
    warm: { bg: '#FFF8E7', text: '#5D4E37', radius: 14 },
    dark: { bg: '#1a1a2e', text: '#e0e0e0', radius: 20 },
  };

  const fontStyles: Record<string, string> = {
    noto: "'Noto Sans SC', sans-serif",
    kuaile: "'ZCOOL KuaiLe', cursive",
    serif: "'Noto Serif SC', serif",
  };

  const theme = themeStyles[currentTheme];
  const font = fontStyles[currentFont];

  return (
    <motion.div 
      className="preview-panel"
      style={{ 
        backgroundColor: theme.bg,
        color: theme.text,
        '--card-radius': `${theme.radius}px`,
        fontFamily: font,
      } as React.CSSProperties}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="preview-header">
        <h2 className="preview-title">卡片预览</h2>
        <div className="preview-subtitle">
          点击卡片可全屏查看
        </div>
      </div>
      
      <div className="preview-scroll-container preview-scroll-container-outer">
        {cards.length === 0 ? (
          <div className="empty-state">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="empty-icon"
            >
              📝
            </motion.div>
            <p>在左侧编辑区粘贴内容</p>
            <p>点击"自动拆分"生成卡片</p>
          </div>
        ) : (
          <div className="cards-waterfall preview-scroll-container">
            {cards.map((card, index) => (
              <Card
                key={card.id}
                card={card}
                index={index}
                isHighlighted={card.id === highlightedCardId}
                onClick={() => toggleFullscreen(card.id)}
              />
            ))}
          </div>
        )}
      </div>
      
      <AnimationControlBar />

      <AnimatePresence>
        {isFullscreen && <FullscreenViewer />}
      </AnimatePresence>

      <AnimatePresence>
        {isIconPickerFor && !isFullscreen && (
          <IconPicker cardId={isIconPickerFor} onClose={() => setIconPickerFor(null)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
