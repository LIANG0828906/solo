import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Card } from './components/Card';
import { CardForm } from './components/CardForm';
import { useCanvasTransform } from './engine/canvasEngine';
import { useCardStore } from './data/cardStore';
import { PRESET_COLORS, MIN_WINDOW_WIDTH } from './types/card';
import type { Card as CardType } from './types/card';
import './App.css';

function App() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showPackModal, setShowPackModal] = useState(false);
  const [packName, setPackName] = useState('');
  const { transform, handleWheel, handleMouseDown, resetTransform } =
    useCanvasTransform();

  const canvasRef = useRef<HTMLDivElement>(null);

  const getFilteredCards = useCardStore((state) => state.getFilteredCards);
  const filterByKeyword = useCardStore((state) => state.filterByKeyword);
  const filterByColor = useCardStore((state) => state.filterByColor);
  const clearFilters = useCardStore((state) => state.clearFilters);
  const filter = useCardStore((state) => state.filter);
  const cards = useCardStore((state) => state.cards);
  const selectedCardIds = useCardStore((state) => state.selectedCardIds);
  const toggleCardSelection = useCardStore((state) => state.toggleCardSelection);
  const clearSelection = useCardStore((state) => state.clearSelection);
  const packCards = useCardStore((state) => state.packCards);
  const collections = useCardStore((state) => state.collections);

  const filteredCards = useMemo(() => {
    const result = getFilteredCards();
    return result.sort((a, b) => b.createdAt - a.createdAt);
  }, [getFilteredCards]);

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === canvasRef.current) {
        clearSelection();
      }
      handleMouseDown(e);
    },
    [handleMouseDown, clearSelection]
  );

  const handleCardClick = useCallback(
    (e: React.MouseEvent, cardId: string) => {
      if (e.shiftKey) {
        e.stopPropagation();
        toggleCardSelection(cardId);
      }
    },
    [toggleCardSelection]
  );

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    filterByKeyword(e.target.value);
  };

  const handleColorFilterClick = (color: string | null) => {
    if (filter.color === color) {
      filterByColor(null);
    } else {
      filterByColor(color);
    }
  };

  const handlePackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (packName.trim() && selectedCardIds.length > 0) {
      packCards(packName.trim(), [...selectedCardIds]);
      setPackName('');
      setShowPackModal(false);
    }
  };

  const isFilterActive = filter.keyword || filter.color;

  const canvasStyle = useMemo(
    () => ({
      transform: `translate3d(${transform.offsetX}px, ${transform.offsetY}px, 0) scale(${transform.scale})`,
      transformOrigin: '0 0',
      textRendering:
        transform.scale < 1 ? 'optimizeSpeed' : 'optimizeLegibility',
    }),
    [transform]
  );

  return (
    <div className="app-container">
      <div
        className="canvas-container"
        ref={canvasRef}
        onWheel={handleWheel}
        onMouseDown={handleCanvasMouseDown}
      >
        <div className="canvas-content" style={canvasStyle}>
          {filteredCards.map((card: CardType) => (
            <div
              key={card.id}
              onClick={(e) => handleCardClick(e, card.id)}
              className={`card-container-wrapper ${selectedCardIds.includes(card.id) ? 'selected' : ''}`}
            >
              <Card
                card={card}
                scale={transform.scale}
                otherCards={filteredCards}
              />
            </div>
          ))}

          {filteredCards.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">✏️</div>
              <h3 className="empty-state-title">
                {isFilterActive ? '没有找到匹配的卡片' : '开始捕捉你的灵感'}
              </h3>
              <p className="empty-state-desc">
                {isFilterActive
                  ? '尝试调整搜索关键词或颜色筛选'
                  : '点击左上角的 + 按钮创建你的第一张灵感卡片'}
              </p>
              {isFilterActive && (
                <button
                  className="btn btn-primary"
                  onClick={clearFilters}
                >
                  清除筛选
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <button
        className="floating-btn"
        onClick={() => setIsFormOpen(true)}
        aria-label="新建卡片"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>

      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="app-title">灵感速写板</h1>
          <p className="app-subtitle">共 {cards.length} 张卡片</p>
        </div>

        <div className="sidebar-section">
          <label className="sidebar-label">搜索</label>
          <div className="search-input-wrapper">
            <svg
              className="search-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="关键词搜索..."
              value={filter.keyword}
              onChange={handleKeywordChange}
              autoComplete="off"
            />
          </div>
        </div>

        <div className="sidebar-section">
          <label className="sidebar-label">颜色标签</label>
          <div className="color-filter-list">
            <button
              className={`color-filter-item ${filter.color === null ? 'active-all' : ''}`}
              onClick={() => handleColorFilterClick(null)}
            >
              <span className="color-filter-swatch all-swatch">
                <span className="all-icon">≡</span>
              </span>
              <span className="color-filter-name">全部</span>
              <span className="color-filter-count">{cards.length}</span>
            </button>
            {PRESET_COLORS.map((color) => {
              const count = cards.filter((c) => c.color === color).length;
              return (
                <button
                  key={color}
                  className={`color-filter-item ${filter.color === color ? 'active' : ''}`}
                  onClick={() => handleColorFilterClick(color)}
                >
                  <span
                    className="color-filter-swatch"
                    style={{ backgroundColor: color }}
                  />
                  <span className="color-filter-name">{color}</span>
                  <span className="color-filter-count">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {selectedCardIds.length > 0 && (
          <div className="sidebar-section selection-section">
            <div className="selection-header">
              <span className="selection-count">
                已选择 {selectedCardIds.length} 张卡片
              </span>
              <button
                className="btn-clear-selection"
                onClick={clearSelection}
              >
                清除
              </button>
            </div>
            <button
              className="btn btn-primary btn-full"
              onClick={() => setShowPackModal(true)}
            >
              打包成合集
            </button>
          </div>
        )}

        {collections.length > 0 && (
          <div className="sidebar-section">
            <label className="sidebar-label">合集</label>
            <div className="collection-list">
              {collections.map((col) => (
                <div key={col.id} className="collection-item">
                  <span className="collection-name">{col.name}</span>
                  <span className="collection-count">
                    {col.cardIds.length} 张
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="sidebar-footer">
          <div className="zoom-controls">
            <button
              className="zoom-btn"
              onClick={() => {
                const wheelEvent = {
                  shiftKey: true,
                  deltaY: -100,
                  preventDefault: () => {},
                  currentTarget: canvasRef.current || document.body,
                  clientX: window.innerWidth / 2,
                  clientY: window.innerHeight / 2,
                } as unknown as React.WheelEvent;
                handleWheel(wheelEvent);
              }}
              aria-label="放大"
            >
              +
            </button>
            <span className="zoom-level">{Math.round(transform.scale * 100)}%</span>
            <button
              className="zoom-btn"
              onClick={() => {
                const wheelEvent = {
                  shiftKey: true,
                  deltaY: 100,
                  preventDefault: () => {},
                  currentTarget: canvasRef.current || document.body,
                  clientX: window.innerWidth / 2,
                  clientY: window.innerHeight / 2,
                } as unknown as React.WheelEvent;
                handleWheel(wheelEvent);
              }}
              aria-label="缩小"
            >
              −
            </button>
            <button
              className="zoom-btn reset-btn"
              onClick={resetTransform}
              aria-label="重置视图"
            >
              ⟲
            </button>
          </div>
          <div className="shortcuts-hint">
            <p><kbd>Shift</kbd> + 滚轮：缩放</p>
            <p><kbd>Ctrl</kbd> + 拖拽：移动卡片</p>
            <p><kbd>Shift</kbd> + 点击：多选</p>
          </div>
        </div>
      </aside>

      <CardForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />

      {showPackModal && (
        <div className="modal-overlay">
          <div className="modal-container small-modal">
            <h2 className="modal-title">打包成合集</h2>
            <form onSubmit={handlePackSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label">合集名称</label>
                <input
                  type="text"
                  className="form-input"
                  value={packName}
                  onChange={(e) => setPackName(e.target.value)}
                  placeholder="为这个合集起个名字..."
                  autoFocus
                  maxLength={50}
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPackModal(false)}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!packName.trim()}
                >
                  创建合集
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
