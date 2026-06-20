import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useGradientStore } from '../store/useGradientStore';
import { colorEngine } from '../engine/ColorEngine';
import type { SavedGradient } from '../types';

const COLUMN_WIDTH = 280;
const GAP = 16;

interface CardPosition {
  top: number;
  left: number;
  height: number;
}

const GalleryPanel: React.FC = () => {
  const { favorites, removeFavorite, applyFavorite } = useGradientStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const columnCount = useMemo(() => {
    if (containerWidth === 0) return 3;
    return Math.max(1, Math.floor((containerWidth + GAP) / (COLUMN_WIDTH + GAP)));
  }, [containerWidth]);

  const cardHeights = useMemo(() => {
    return new Map<string, number>();
  }, []);

  const positions = useMemo(() => {
    const startTime = performance.now();

    const result = new Map<string, CardPosition>();
    const columnHeights = Array(columnCount).fill(0);

    favorites.forEach((item) => {
      const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));
      const baseHeight = cardHeights.get(item.id) || 200;
      const isExpanded = expandedId === item.id;
      const height = isExpanded ? baseHeight + 100 : baseHeight;

      result.set(item.id, {
        top: columnHeights[shortestColumn],
        left: shortestColumn * (COLUMN_WIDTH + GAP),
        height
      });

      columnHeights[shortestColumn] += height + GAP;
    });

    const elapsed = performance.now() - startTime;
    if (elapsed > 50) {
      console.warn(`瀑布流布局计算耗时: ${elapsed.toFixed(2)}ms，超过50ms阈值`);
    }

    return result;
  }, [favorites, columnCount, expandedId, cardHeights]);

  const totalHeight = useMemo(() => {
    const heights = Array.from(positions.values()).map((p) => p.top + p.height);
    return Math.max(0, ...heights);
  }, [positions]);

  const handleCardClick = useCallback(
    (e: React.MouseEvent, item: SavedGradient) => {
      const target = e.target as HTMLElement;
      if (
        target.closest('.gallery-card__code') ||
        target.closest('.gallery-card__delete') ||
        target.closest('.gallery-card__apply')
      ) {
        return;
      }
      setExpandedId(expandedId === item.id ? null : item.id);
    },
    [expandedId]
  );

  const handleCopyCode = useCallback(
    async (item: SavedGradient) => {
      const css = colorEngine.generateCSSGradient(item);
      try {
        await navigator.clipboard.writeText(css);
        setCopiedId(item.id);
        setTimeout(() => setCopiedId(null), 2000);
      } catch {
        const textarea = document.createElement('textarea');
        textarea.value = css;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopiedId(item.id);
        setTimeout(() => setCopiedId(null), 2000);
      }
    },
    []
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      removeFavorite(id);
      if (expandedId === id) {
        setExpandedId(null);
      }
    },
    [removeFavorite, expandedId]
  );

  const handleApply = useCallback(
    (e: React.MouseEvent, item: SavedGradient) => {
      e.stopPropagation();
      applyFavorite(item);
    },
    [applyFavorite]
  );

  const cssGradients = useMemo(() => {
    const map = new Map<string, string>();
    favorites.forEach((item) => {
      map.set(item.id, colorEngine.generateCSSGradient(item));
    });
    return map;
  }, [favorites]);

  if (favorites.length === 0) {
    return (
      <div className="gallery-panel gallery-panel--empty">
        <div className="gallery-panel__empty-icon">🎨</div>
        <div className="gallery-panel__empty-title">暂无收藏</div>
        <div className="gallery-panel__empty-desc">点击上方「收藏」按钮保存您喜欢的渐变</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="gallery-panel">
      <div className="gallery-panel__header">
        <h3 className="gallery-panel__title">我的收藏</h3>
        <span className="gallery-panel__count">{favorites.length} 个渐变</span>
      </div>
      <div
        className="gallery-panel__grid"
        style={{
          height: totalHeight,
          width: columnCount * COLUMN_WIDTH + (columnCount - 1) * GAP
        }}
      >
        {favorites.map((item) => {
          const position = positions.get(item.id);
          const css = cssGradients.get(item.id) || '';
          const isExpanded = expandedId === item.id;
          const isCopied = copiedId === item.id;

          if (!position) return null;

          return (
            <div
              key={item.id}
              className={`gallery-card ${isExpanded ? 'gallery-card--expanded' : ''}`}
              style={{
                top: position.top,
                left: position.left,
                width: COLUMN_WIDTH
              }}
              onClick={(e) => handleCardClick(e, item)}
            >
              <div
                className="gallery-card__thumbnail"
                style={{ background: css }}
              />
              <div className="gallery-card__info">
                <div className="gallery-card__meta">
                  <span className="gallery-card__stops">{item.stops.length} 个色标</span>
                  <span className="gallery-card__angle">{item.angle}°</span>
                </div>
                <div
                  className={`gallery-card__code ${isCopied ? 'gallery-card__code--copied' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyCode(item);
                  }}
                  title="点击复制CSS代码"
                >
                  <code>{isCopied ? '已复制 ✓' : css.slice(0, 40) + '...'}</code>
                </div>
              </div>
              {isExpanded && (
                <div className="gallery-card__expanded">
                  <div className="gallery-card__full-code">
                    <div className="gallery-card__code-title">CSS 代码</div>
                    <pre className="gallery-card__code-block">
                      <code>background: {css};</code>
                    </pre>
                    <button
                      className="gallery-card__copy-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyCode(item);
                      }}
                    >
                      {isCopied ? '已复制 ✓' : '复制代码'}
                    </button>
                  </div>
                  <div className="gallery-card__colors">
                    <div className="gallery-card__colors-title">色标</div>
                    <div className="gallery-card__color-list">
                      {item.stops.map((stop) => (
                        <div key={stop.id} className="gallery-card__color-item">
                          <div
                            className="gallery-card__color-dot"
                            style={{ backgroundColor: stop.color }}
                          />
                          <span className="gallery-card__color-value">{stop.color}</span>
                          <span className="gallery-card__color-pos">{stop.position}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="gallery-card__actions">
                    <button
                      className="gallery-card__apply"
                      onClick={(e) => handleApply(e, item)}
                    >
                      应用此渐变
                    </button>
                    <button
                      className="gallery-card__delete"
                      onClick={(e) => handleDelete(e, item.id)}
                    >
                      删除
                    </button>
                  </div>
                </div>
              )}
              {!isExpanded && (
                <button
                  className="gallery-card__delete gallery-card__delete--floating"
                  onClick={(e) => handleDelete(e, item.id)}
                  title="删除收藏"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GalleryPanel;
