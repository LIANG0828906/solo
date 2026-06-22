import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { generateLeatherSVG } from '../utils/renderHelper';
import type { Combination } from '../types';

interface PreviewProps {
  showReplaceHint?: boolean;
  onReplaceFavorite?: (index: number) => void;
}

export const Preview = ({ showReplaceHint, onReplaceFavorite }: PreviewProps) => {
  const {
    styleId,
    woodId,
    metalId,
    rotateX,
    rotateY,
    setRotation,
    resetRotation,
    favorites,
    compareMode,
    compareCombination,
    toggleCompare,
    removeFavorite
  } = useAppStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ vx: 0, vy: 0 });
  const animationFrameRef = useRef<number>();
  const [svgKey, setSvgKey] = useState(0);

  const [compareSvgKey, setCompareSvgKey] = useState(0);

  useEffect(() => {
    setSvgKey((prev) => prev + 1);
  }, [styleId, woodId, metalId]);

  useEffect(() => {
    setCompareSvgKey((prev) => prev + 1);
  }, [compareCombination]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    velocityRef.current = { vx: 0, vy: 0 };
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grabbing';
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging.current) return;

      const deltaX = e.clientX - lastPos.current.x;
      const deltaY = e.clientY - lastPos.current.y;

      velocityRef.current = {
        vx: deltaX * 0.5,
        vy: deltaY * 0.3
      };

      const state = useAppStore.getState();
      const newY = state.rotateY + deltaX * 0.5;
      const newX = state.rotateX - deltaY * 0.3;

      setRotation(newX, newY);
      lastPos.current = { x: e.clientX, y: e.clientY };
    },
    [setRotation]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;

    if (containerRef.current) {
      containerRef.current.style.cursor = 'grab';
    }

    const animate = () => {
      const state = useAppStore.getState();
      const { vx, vy } = velocityRef.current;

      const damping = 0.95;
      const springStrength = 0.05;

      let newVx = vx * damping;
      let newVy = vy * damping - state.rotateX * springStrength;

      const newX = state.rotateX + newVy;
      const newY = state.rotateY + newVx;

      velocityRef.current = { vx: newVx, vy: newVy };
      setRotation(newX, newY);

      if (
        Math.abs(newVx) > 0.01 ||
        Math.abs(newVy) > 0.01 ||
        Math.abs(state.rotateX) > 0.1
      ) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        resetRotation();
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [setRotation, resetRotation]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleFavoriteClick = (fav: Combination, index: number) => {
    if (showReplaceHint && onReplaceFavorite) {
      onReplaceFavorite(index);
    } else {
      toggleCompare(fav);
    }
  };

  const handleCloseCompare = () => {
    toggleCompare(null);
  };

  const handleRemoveFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeFavorite(id);
  };

  const renderSvg = (combo: Combination | null, key: number) => {
    if (!combo) return null;

    const svgContent = generateLeatherSVG(
      combo.styleId,
      combo.woodId,
      combo.metalId,
      { width: 400, height: 300 }
    );

    return (
      <motion.div
        key={key}
        className="preview-svg-wrapper"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    );
  };

  const currentCombination: Combination = {
    id: 'current',
    styleId,
    woodId,
    metalId,
    timestamp: Date.now()
  };

  return (
    <motion.div
      className="preview-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <div className="preview-header">
        <h2 className="preview-title">实时预览</h2>
        {compareMode && (
          <motion.button
            className="close-compare-btn"
            onClick={handleCloseCompare}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            退出对比
          </motion.button>
        )}
      </div>

      <div
        ref={containerRef}
        className={`preview-stage ${compareMode ? 'compare-mode' : ''}`}
        onMouseDown={handleMouseDown}
        style={{ cursor: 'grab' }}
      >
        {compareMode ? (
          <div className="compare-wrapper">
            <div className="compare-item">
              <span className="compare-label">当前组合</span>
              <div
                className="compare-preview"
                style={{
                  transform: `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
                }}
              >
                <AnimatePresence mode="wait">
                  {renderSvg(currentCombination, svgKey)}
                </AnimatePresence>
              </div>
            </div>
            <div className="compare-divider" />
            <div className="compare-item">
              <span className="compare-label">收藏组合</span>
              <div
                className="compare-preview"
                style={{
                  transform: `perspective(800px) rotateX(${rotateX}deg) rotateY(${-rotateY}deg)`
                }}
              >
                <AnimatePresence mode="wait">
                  {renderSvg(compareCombination, compareSvgKey)}
                </AnimatePresence>
              </div>
            </div>
          </div>
        ) : (
          <motion.div
            className="preview-item"
            style={{
              transform: `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
            }}
            animate={{
              transform: `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
            }}
            transition={{ type: 'spring', stiffness: 100, damping: 30 }}
          >
            <AnimatePresence mode="wait">
              {renderSvg(currentCombination, svgKey)}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <div className="favorites-section">
        <h3 className="favorites-title">
          我的收藏
          <span className="favorites-count">({favorites.length}/6)</span>
          {showReplaceHint && (
            <span className="replace-hint"> - 点击要替换的收藏</span>
          )}
        </h3>
        <div className="favorites-grid">
          {favorites.map((fav, index) => (
            <motion.div
              key={fav.id}
              className={`favorite-card ${showReplaceHint ? 'replace-mode' : ''}`}
              onClick={() => handleFavoriteClick(fav, index)}
              whileHover={{ scale: 1.03, backgroundColor: '#F5F0E6' }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div
                className="favorite-thumb"
                dangerouslySetInnerHTML={{
                  __html: generateLeatherSVG(
                    fav.styleId,
                    fav.woodId,
                    fav.metalId,
                    { width: 100, height: 60 }
                  )
                }}
              />
              <button
                className="favorite-remove"
                onClick={(e) => handleRemoveFavorite(e, fav.id)}
                title="删除收藏"
              >
                ×
              </button>
            </motion.div>
          ))}
          {Array.from({ length: Math.max(0, 6 - favorites.length) }).map(
            (_, i) => (
              <motion.div
                key={`empty-${i}`}
                className="favorite-card empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: (favorites.length + i) * 0.05 }}
              >
                <span className="empty-text">空</span>
              </motion.div>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
};
