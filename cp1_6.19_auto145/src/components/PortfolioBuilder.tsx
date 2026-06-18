import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TAG_NAMES, TAG_COLORS, type TagName } from '../data/marketData';
import { usePortfolioContext } from '../hooks/usePortfolio';

export default function PortfolioBuilder() {
  const { portfolios, addPortfolio, removePortfolio } = usePortfolioContext();
  const [selectedTags, setSelectedTags] = useState<TagName[]>([]);
  const [draggedTag, setDraggedTag] = useState<TagName | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleTagClick = useCallback((tag: TagName) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      if (prev.length >= 6) return prev;
      return [...prev, tag];
    });
  }, []);

  const handleCreatePortfolio = useCallback(() => {
    if (selectedTags.length >= 3 && selectedTags.length <= 6 && portfolios.length < 3) {
      const success = addPortfolio(selectedTags);
      if (success) setSelectedTags([]);
    }
  }, [selectedTags, portfolios.length, addPortfolio]);

  const handleDragStart = useCallback((tag: TagName) => {
    setDraggedTag(tag);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(() => {
    if (draggedTag && !selectedTags.includes(draggedTag) && selectedTags.length < 6) {
      setSelectedTags((prev) => [...prev, draggedTag]);
    }
    setDraggedTag(null);
    setDragOver(false);
  }, [draggedTag, selectedTags]);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>投资组合构建</h2>

      <div style={styles.tagPool}>
        <p style={styles.sectionLabel}>选择标签 (3-6个)</p>
        <div style={styles.tagGrid}>
          {TAG_NAMES.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            const isInPortfolio = portfolios.some((p) => p.tags.includes(tag));
            const disabled = isInPortfolio && !isSelected;
            return (
              <motion.div
                key={tag}
                draggable={!disabled}
                onDragStart={() => handleDragStart(tag)}
                onClick={() => !disabled && handleTagClick(tag)}
                whileHover={!disabled ? { scale: 1.05, y: -2 } : {}}
                whileTap={!disabled ? { scale: 0.95 } : {}}
                animate={
                  isSelected
                    ? { scale: [1, 1.05, 1], transition: { duration: 0.3 } }
                    : {}
                }
                style={{
                  ...styles.tagCard,
                  backgroundColor: TAG_COLORS[tag],
                  opacity: disabled ? 0.35 : 1,
                  border: isSelected ? '2px solid #ffffff' : '2px solid transparent',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                }}
              >
                {tag}
              </motion.div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          ...styles.buildArea,
          borderColor: dragOver ? '#6C63FF' : '#2A2A50',
          borderStyle: dragOver ? 'solid' : 'dashed',
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <p style={styles.sectionLabel}>构建区 ({selectedTags.length}/6)</p>
        <div style={styles.buildTags}>
          <AnimatePresence>
            {selectedTags.map((tag) => (
              <motion.div
                key={tag}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 20 }}
                whileHover={{ scale: 1.05, y: -2 }}
                style={{ ...styles.tagCard, backgroundColor: TAG_COLORS[tag] }}
                onClick={() => handleTagClick(tag)}
              >
                {tag}
                <span style={styles.removeTag}>×</span>
              </motion.div>
            ))}
          </AnimatePresence>
          {selectedTags.length === 0 && (
            <p style={styles.placeholder}>拖拽或点击标签至此处</p>
          )}
        </div>
      </div>

      <motion.button
        style={{
          ...styles.createBtn,
          opacity: selectedTags.length >= 3 && portfolios.length < 3 ? 1 : 0.5,
          cursor:
            selectedTags.length >= 3 && portfolios.length < 3 ? 'pointer' : 'not-allowed',
        }}
        whileHover={
          selectedTags.length >= 3 && portfolios.length < 3
            ? { scale: 1.02, y: -2 }
            : {}
        }
        whileTap={
          selectedTags.length >= 3 && portfolios.length < 3 ? { scale: 0.95 } : {}
        }
        onClick={handleCreatePortfolio}
        disabled={selectedTags.length < 3 || portfolios.length >= 3}
      >
        创建组合 ({portfolios.length}/3)
      </motion.button>

      <div style={styles.portfolioList}>
        <AnimatePresence>
          {portfolios.map((p, idx) => (
            <motion.div
              key={p.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ ...styles.portfolioCard, borderLeft: `4px solid ${p.color}` }}
            >
              <div style={styles.portfolioHeader}>
                <span style={{ color: p.color, fontWeight: 700, fontSize: '15px' }}>
                  组合 {idx + 1}
                </span>
                <motion.button
                  style={styles.deleteBtn}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => removePortfolio(p.id)}
                >
                  删除
                </motion.button>
              </div>
              <div style={styles.portfolioTags}>
                {p.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      ...styles.miniTag,
                      backgroundColor: TAG_COLORS[tag],
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '20px',
    height: '100%',
    overflowY: 'auto',
  },
  title: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#D0D0E0',
    marginBottom: '20px',
  },
  tagPool: {
    marginBottom: '20px',
  },
  sectionLabel: {
    fontSize: '13px',
    color: '#8888AA',
    marginBottom: '10px',
  },
  tagGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  },
  tagCard: {
    width: '120px',
    height: '60px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    userSelect: 'none',
    position: 'relative',
    cursor: 'pointer',
  },
  removeTag: {
    position: 'absolute',
    top: '2px',
    right: '6px',
    fontSize: '14px',
    opacity: 0.7,
    cursor: 'pointer',
  },
  buildArea: {
    minHeight: '100px',
    background: '#1E1E3A',
    borderRadius: '12px',
    borderWidth: '1px',
    padding: '12px',
    marginBottom: '16px',
    transition: 'border-color 0.2s, border-style 0.2s',
  },
  buildTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    minHeight: '60px',
    alignItems: 'center',
  },
  placeholder: {
    color: '#555577',
    fontSize: '13px',
    margin: 0,
  },
  createBtn: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    background: '#6C63FF',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600,
    marginBottom: '20px',
  },
  portfolioList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  portfolioCard: {
    background: '#1E1E3A',
    borderRadius: '12px',
    padding: '12px',
    border: '1px solid #2A2A50',
  },
  portfolioHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  deleteBtn: {
    background: 'transparent',
    border: '1px solid #E74C3C',
    color: '#E74C3C',
    borderRadius: '4px',
    padding: '2px 8px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  portfolioTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  miniTag: {
    padding: '2px 8px',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '11px',
    fontWeight: 600,
  },
};
