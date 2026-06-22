import React, { useState, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { extractImagery, extractTitle } from '../engine/poemParser';

const InputPanel: React.FC = () => {
  const {
    currentPoem,
    currentImagery,
    isAnimating,
    setPoem,
    setImagery,
    setIsAnimating,
    addToGallery,
    brushDensity,
    theme,
    animSpeed,
    removeImageryItem,
    setSelectedImagery,
    selectedImagery,
  } = useAppStore();

  const [isFavorited, setIsFavorited] = useState(false);

  const handleGenerate = useCallback(() => {
    if (!currentPoem.trim()) return;
    const imagery = extractImagery(currentPoem);
    const keywords = imagery.map((i) => i.keyword);
    const uniqueKeywords = [...new Set(keywords)];
    setImagery(uniqueKeywords);
    setIsAnimating(true);
    setIsFavorited(false);
  }, [currentPoem, setImagery, setIsAnimating]);

  const handleFavorite = useCallback(() => {
    if (!isFavorited && isAnimating) {
      const canvas = document.querySelector('canvas');
      const thumbnail = canvas ? canvas.toDataURL('image/png') : '';
      const title = extractTitle(currentPoem);
      addToGallery({
        title,
        poem: currentPoem,
        imagery: currentImagery,
        thumbnail,
        annotation: '',
        brushDensity,
        theme,
        animSpeed,
      });
      setIsFavorited(true);
    }
  }, [isFavorited, isAnimating, currentPoem, currentImagery, brushDensity, theme, animSpeed, addToGallery]);

  const handleTagClick = useCallback(
    (keyword: string) => {
      setSelectedImagery(selectedImagery === keyword ? null : keyword);
    },
    [selectedImagery, setSelectedImagery]
  );

  const handleRemoveTag = useCallback(
    (keyword: string, e: React.MouseEvent) => {
      e.stopPropagation();
      removeImageryItem(keyword);
    },
    [removeImageryItem]
  );

  return (
    <div style={styles.panel}>
      <div style={styles.titleBar}>
        <h2 style={styles.title}>诗意水墨</h2>
        <span style={styles.subtitle}>Poetic Ink</span>
      </div>

      <div style={styles.inputArea}>
        <textarea
          style={styles.textarea}
          placeholder="请输入一首诗词"
          value={currentPoem}
          onChange={(e) => setPoem(e.target.value)}
          rows={5}
        />
        <div style={styles.buttonRow}>
          <button
            style={{
              ...styles.generateBtn,
              ...(currentPoem.trim() ? {} : styles.generateBtnDisabled),
            }}
            onClick={handleGenerate}
            disabled={!currentPoem.trim()}
          >
            生成画作
          </button>
          <button
            style={{
              ...styles.favBtn,
              ...(isFavorited ? styles.favBtnActive : {}),
            }}
            onClick={handleFavorite}
            title="收藏"
          >
            {isFavorited ? '★' : '☆'}
          </button>
        </div>
      </div>

      {currentImagery.length > 0 && (
        <div style={styles.imagerySection}>
          <div style={styles.imageryTitle}>意象标签</div>
          <div style={styles.tagList}>
            {currentImagery.map((keyword) => (
              <div
                key={keyword}
                style={{
                  ...styles.tag,
                  ...(selectedImagery === keyword ? styles.tagSelected : {}),
                }}
                onClick={() => handleTagClick(keyword)}
              >
                <span>{keyword}</span>
                <span style={styles.tagRemove} onClick={(e) => handleRemoveTag(keyword, e)}>
                  ×
                </span>
              </div>
            ))}
          </div>
          {selectedImagery && (
            <div style={styles.decomposeHint}>
              正在查看「{selectedImagery}」分解视图
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  panel: {
    width: 340,
    background: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: 12,
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignSelf: 'flex-start',
  },
  titleBar: {
    background: 'rgba(255,248,230,0.7)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    borderBottom: '1px solid #d4a574',
    padding: '14px 18px',
  },
  title: {
    margin: 0,
    fontFamily: '"Ma Shan Zheng", "KaiTi", "STKaiti", serif',
    fontSize: 22,
    color: '#333',
    fontWeight: 'normal',
  },
  subtitle: {
    fontSize: 11,
    color: '#999',
    letterSpacing: 2,
  },
  inputArea: {
    padding: 16,
  },
  textarea: {
    width: '100%',
    minHeight: 100,
    border: '1px solid #ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    fontFamily: '"KaiTi", "STKaiti", serif',
    lineHeight: 1.7,
    resize: 'vertical',
    outline: 'none',
    background: '#fafaf5',
    color: '#333',
    boxSizing: 'border-box' as const,
  },
  buttonRow: {
    display: 'flex',
    gap: 10,
    marginTop: 12,
  },
  generateBtn: {
    flex: 1,
    background: 'linear-gradient(135deg, #2d6a4f, #52b788)',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: '10px 0',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    letterSpacing: 2,
  },
  generateBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  favBtn: {
    width: 42,
    height: 42,
    border: '1px solid #ddd',
    borderRadius: 10,
    background: '#fff',
    fontSize: 20,
    cursor: 'pointer',
    color: '#ccc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  favBtnActive: {
    color: '#f0a030',
    borderColor: '#f0a030',
    background: '#fffdf0',
  },
  imagerySection: {
    padding: '0 16px 16px',
  },
  imageryTitle: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
  },
  tagList: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 6,
  },
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 2,
    background: '#f0f0f0',
    borderRadius: 14,
    padding: '3px 8px 3px 10px',
    fontSize: 13,
    color: '#555',
    cursor: 'pointer',
    transition: 'all 0.2s',
    userSelect: 'none' as const,
  },
  tagSelected: {
    background: '#d4e8d0',
    color: '#2d6a4f',
    fontWeight: 600,
  },
  tagRemove: {
    fontSize: 14,
    color: '#bbb',
    cursor: 'pointer',
    paddingLeft: 2,
    lineHeight: 1,
  },
  decomposeHint: {
    marginTop: 8,
    fontSize: 12,
    color: '#2d6a4f',
    fontStyle: 'italic',
  },
};

export default InputPanel;
