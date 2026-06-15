import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Card } from '../types';
import { useAppContext } from '../App';

const rarityNames: Record<Card['rarity'], string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

const BUFFER_ROWS = 2;
const GAP_DESKTOP = 20;
const GAP_MOBILE = 12;

const CardGallery: React.FC = () => {
  const { cards } = useAppContext();
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [closing, setClosing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState<string>('all');
  const [costFilter, setCostFilter] = useState<string>('all');

  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [columns, setColumns] = useState(5);
  const [cardWidth, setCardWidth] = useState(0);
  const [cardHeight, setCardHeight] = useState(0);
  const [gap, setGap] = useState(GAP_DESKTOP);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [gridOffsetTop, setGridOffsetTop] = useState(0);
  const rafIdRef = useRef<number | null>(null);
  const initializedRef = useRef(false);

  const filteredCards = useMemo(() => {
    return cards.filter((c) => {
      const matchSearch = !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchRarity = rarityFilter === 'all' || c.rarity === rarityFilter;
      let matchCost = costFilter === 'all';
      if (!matchCost) {
        if (costFilter === '7+') matchCost = c.cost >= 7;
        else matchCost = c.cost === parseInt(costFilter);
      }
      return matchSearch && matchRarity && matchCost;
    });
  }, [cards, searchQuery, rarityFilter, costFilter]);

  const rowHeight = cardHeight + gap;
  const totalRows = columns > 0 ? Math.ceil(filteredCards.length / columns) : 0;
  const totalHeight = totalRows > 0 ? totalRows * rowHeight - gap : 0;

  const virtualScrollTop = useMemo(() => {
    return Math.max(0, scrollTop - gridOffsetTop);
  }, [scrollTop, gridOffsetTop]);

  const visibleRange = useMemo(() => {
    if (rowHeight <= 0 || columns <= 0 || viewportHeight <= 0) {
      return { startIndex: 0, endIndex: 0, startRow: 0 };
    }

    const startRow = Math.max(0, Math.floor(virtualScrollTop / rowHeight) - BUFFER_ROWS);
    const visibleRowsCount = Math.ceil(viewportHeight / rowHeight) + BUFFER_ROWS * 2;
    const endRow = Math.min(totalRows, startRow + visibleRowsCount);

    return {
      startIndex: startRow * columns,
      endIndex: Math.min(filteredCards.length, endRow * columns),
      startRow,
    };
  }, [virtualScrollTop, rowHeight, columns, viewportHeight, totalRows, filteredCards.length]);

  const offsetY = visibleRange.startRow * rowHeight;

  const updateLayout = useCallback(() => {
    if (!gridRef.current) return;

    const width = gridRef.current.clientWidth;
    const w = window.innerWidth;

    let cols: number;
    let g: number;

    if (w <= 767) {
      cols = 2;
      g = GAP_MOBILE;
    } else if (w <= 1279) {
      cols = 3;
      g = GAP_DESKTOP;
    } else {
      cols = 5;
      g = GAP_DESKTOP;
    }

    const cw = (width - g * (cols - 1)) / cols;
    const ch = (cw * 4) / 3;

    setColumns(cols);
    setGap(g);
    setCardWidth(cw);
    setCardHeight(ch);
  }, []);

  const updateScrollMetrics = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || !gridRef.current) return;

    const gridRect = gridRef.current.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    setViewportHeight(container.clientHeight);
    setGridOffsetTop(gridRect.top - containerRect.top + container.scrollTop);
  }, []);

  const handleScroll = useCallback(() => {
    if (rafIdRef.current !== null) return;

    rafIdRef.current = requestAnimationFrame(() => {
      const container = scrollContainerRef.current;
      if (container) {
        setScrollTop(container.scrollTop);
      }
      rafIdRef.current = null;
    });
  }, []);

  const findScrollContainer = useCallback((): HTMLElement => {
    let el: HTMLElement | null = gridRef.current;
    while (el) {
      const style = window.getComputedStyle(el);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
        return el;
      }
      el = el.parentElement;
    }
    return document.documentElement;
  }, []);

  const handleWindowResize = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }
    rafIdRef.current = requestAnimationFrame(() => {
      updateLayout();
      updateScrollMetrics();
      rafIdRef.current = null;
    });
  }, [updateLayout, updateScrollMetrics]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const init = () => {
      updateLayout();

      const container = findScrollContainer();
      scrollContainerRef.current = container;

      setScrollTop(container.scrollTop);
      updateScrollMetrics();

      container.addEventListener('scroll', handleScroll, { passive: true });

      const ro = new ResizeObserver(() => {
        updateLayout();
        updateScrollMetrics();
      });
      if (gridRef.current) ro.observe(gridRef.current);
      ro.observe(container);
      resizeObserverRef.current = ro;

      window.addEventListener('resize', handleWindowResize);
    };

    const rafId = requestAnimationFrame(init);

    return () => {
      cancelAnimationFrame(rafId);
      const container = scrollContainerRef.current;
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('resize', handleWindowResize);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      initializedRef.current = false;
    };
  }, [updateLayout, updateScrollMetrics, findScrollContainer, handleScroll, handleWindowResize]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setSelectedCard(null);
      setClosing(false);
    }, 300);
  };

  const visibleCards = useMemo(() => {
    return filteredCards.slice(visibleRange.startIndex, visibleRange.endIndex);
  }, [filteredCards, visibleRange.startIndex, visibleRange.endIndex]);

  return (
    <div>
      <div className="page-title">
        <span>🃏</span>
        <span>卡牌图鉴</span>
        <span style={{ fontSize: 16, fontWeight: 'normal', color: 'var(--text-secondary)', marginLeft: 8 }}>
          共 {filteredCards.length} 张 / {cards.length}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          type="text"
          className="filter-search"
          placeholder="🔍 搜索卡牌名称..."
          style={{ flex: 1, minWidth: 200, padding: '12px 16px' }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="filter-search"
          style={{ maxWidth: 160 }}
          value={rarityFilter}
          onChange={(e) => setRarityFilter(e.target.value)}
        >
          <option value="all">全部稀有度</option>
          <option value="common">普通</option>
          <option value="rare">稀有</option>
          <option value="epic">史诗</option>
          <option value="legendary">传说</option>
        </select>
        <select
          className="filter-search"
          style={{ maxWidth: 140 }}
          value={costFilter}
          onChange={(e) => setCostFilter(e.target.value)}
        >
          <option value="all">全部费用</option>
          {[0, 1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>{n}费</option>
          ))}
          <option value="7+">7费+</option>
        </select>
      </div>

      <div
        ref={gridRef}
        style={{
          position: 'relative',
          width: '100%',
          height: totalHeight,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            transform: `translateY(${offsetY}px)`,
            willChange: 'transform',
          }}
        >
          {visibleCards.map((card, i) => {
            const index = visibleRange.startIndex + i;
            const row = Math.floor(index / columns);
            const col = index % columns;
            const x = col * (cardWidth + gap);
            const y = (row - visibleRange.startRow) * rowHeight;

            return (
              <div
                key={card.id}
                className={`card-item rarity-${card.rarity}`}
                style={{
                  position: 'absolute',
                  left: x,
                  top: y,
                  width: cardWidth,
                  height: cardHeight,
                  margin: 0,
                }}
                onClick={() => setSelectedCard(card)}
              >
                <img
                  src={card.image}
                  alt={card.name}
                  className="card-image"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="card-body">
                  <div className="card-header-row">
                    <div className="card-cost">{card.cost}</div>
                    <span className="card-name">{card.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <span className={`card-rarity-tag rarity-tag-${card.rarity}`}>
                      {rarityNames[card.rarity]}
                    </span>
                  </div>
                  <div className="card-stats">
                    <span className="card-attack">⚔ {card.attack}</span>
                    <span className="card-health">❤ {card.health}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {filteredCards.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <div>未找到匹配的卡牌</div>
        </div>
      )}

      {selectedCard && (
        <div
          className={`modal-overlay ${closing ? 'closing' : ''}`}
          onClick={handleClose}
        >
          <div
            className="modal-content"
            style={{ borderColor: rarityBorderColor(selectedCard.rarity) }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-close" onClick={handleClose}>✕</div>
            <div className="modal-card-detail">
              <img
                src={selectedCard.image}
                alt={selectedCard.name}
                className="modal-card-image"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='300' viewBox='0 0 500 300'%3E%3Crect fill='%230f3460' width='500' height='300'/%3E%3Ctext fill='%23a0a0b0' font-family='Arial' font-size='48' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3E${encodeURIComponent(selectedCard.name)}%3C/text%3E%3C/svg%3E`;
                }}
              />
              <div className="modal-card-info">
                <div className="modal-card-name">
                  <div className="card-cost" style={{ width: 40, height: 40, fontSize: 20 }}>
                    {selectedCard.cost}
                  </div>
                  {selectedCard.name}
                  <span className={`card-rarity-tag rarity-tag-${selectedCard.rarity}`} style={{ fontSize: 14, padding: '4px 12px' }}>
                    {rarityNames[selectedCard.rarity]}
                  </span>
                </div>
                <div className="modal-card-attrs">
                  <div className="attr-item">
                    <span className="attr-label">攻击力</span>
                    <span className="attr-value" style={{ color: '#f87171' }}>⚔ {selectedCard.attack}</span>
                  </div>
                  <div className="attr-item">
                    <span className="attr-label">生命值</span>
                    <span className="attr-value" style={{ color: '#4ade80' }}>❤ {selectedCard.health}</span>
                  </div>
                </div>
                <div className="modal-card-skill">
                  <div className="skill-label">技能描述</div>
                  <div className="skill-text">{selectedCard.skill}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function rarityBorderColor(rarity: Card['rarity']): string {
  const map = { common: 'var(--common)', rare: 'var(--rare)', epic: 'var(--epic)', legendary: 'var(--legendary)' };
  return map[rarity];
}

export default CardGallery;
