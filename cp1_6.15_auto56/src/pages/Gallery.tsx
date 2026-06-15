import { useReducer, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Artwork } from '../types';

interface State {
  artworks: Artwork[];
  sort: 'hot' | 'latest' | 'price_asc' | 'price_desc';
  material: string;
  minPrice: number;
  maxPrice: number;
  page: number;
  totalPages: number;
  loading: boolean;
  initialLoading: boolean;
  filterVisible: boolean;
}

type Action =
  | { type: 'SET_ARTWORKS'; payload: Artwork[] }
  | { type: 'APPEND_ARTWORKS'; payload: Artwork[] }
  | { type: 'SET_SORT'; payload: string }
  | { type: 'SET_MATERIAL'; payload: string }
  | { type: 'SET_PRICE_RANGE'; payload: { min: number; max: number } }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_TOTAL_PAGES'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INITIAL_LOADING'; payload: boolean }
  | { type: 'TOGGLE_FILTER'; payload: boolean };

const initialState: State = {
  artworks: [],
  sort: 'latest',
  material: 'all',
  minPrice: 0,
  maxPrice: 10000,
  page: 1,
  totalPages: 1,
  loading: false,
  initialLoading: true,
  filterVisible: true,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_ARTWORKS':
      return { ...state, artworks: Array.isArray(action.payload) ? action.payload : [] };
    case 'APPEND_ARTWORKS':
      const newItems = Array.isArray(action.payload) ? action.payload : [];
      return { ...state, artworks: [...(state.artworks || []), ...newItems] };
    case 'SET_SORT':
      return { ...state, sort: action.payload as State['sort'], page: 1 };
    case 'SET_MATERIAL':
      return { ...state, material: action.payload, page: 1 };
    case 'SET_PRICE_RANGE':
      return { ...state, minPrice: action.payload.min, maxPrice: action.payload.max, page: 1 };
    case 'SET_PAGE':
      return { ...state, page: action.payload };
    case 'SET_TOTAL_PAGES':
      return { ...state, totalPages: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_INITIAL_LOADING':
      return { ...state, initialLoading: action.payload };
    case 'TOGGLE_FILTER':
      return { ...state, filterVisible: action.payload };
    default:
      return state;
  }
}

const CARD_HEIGHT = 280;
const CARD_GAP = 20;
const ESTIMATED_ROW_HEIGHT = CARD_HEIGHT + CARD_GAP;
const BUFFER_ROWS = 3;

function Gallery() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(4);
  const [scrollTop, setScrollTop] = useState(0);
  const [gridOffsetTop, setGridOffsetTop] = useState(0);
  const [fadeKey, setFadeKey] = useState(0);
  const rafRef = useRef<number | null>(null);

  const getColumns = useCallback(() => {
    const width = window.innerWidth;
    if (width < 768) return 1;
    if (width < 1024) return 2;
    if (width < 1200) return 3;
    return 4;
  }, []);

  const updateOffset = useCallback(() => {
    if (gridRef.current) {
      const rect = gridRef.current.getBoundingClientRect();
      setGridOffsetTop(rect.top + window.scrollY);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setColumns(getColumns());
      updateOffset();
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getColumns, updateOffset]);

  useEffect(() => {
    updateOffset();
  }, [(state.artworks || []).length, updateOffset]);

  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(() => {
        setScrollTop(window.scrollY);
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const fetchArtworks = useCallback(async (page: number, append = false) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { data } = await api.get('/artworks', {
        params: {
          sort: state.sort,
          material: state.material,
          minPrice: state.minPrice,
          maxPrice: state.maxPrice,
          page,
          limit: 20,
        },
      });
      if (append) {
        dispatch({ type: 'APPEND_ARTWORKS', payload: data.items });
      } else {
        dispatch({ type: 'SET_ARTWORKS', payload: data.items });
        setFadeKey(prev => prev + 1);
      }
      dispatch({ type: 'SET_TOTAL_PAGES', payload: data.totalPages });
      dispatch({ type: 'SET_INITIAL_LOADING', payload: false });
    } catch (error) {
      console.error('Failed to fetch artworks:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.sort, state.material, state.minPrice, state.maxPrice]);

  useEffect(() => {
    fetchArtworks(1, false);
  }, [state.sort, state.material, state.minPrice, state.maxPrice]);

  useEffect(() => {
    if (state.page > 1) {
      fetchArtworks(state.page, true);
    }
  }, [state.page]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && state.page < state.totalPages && !state.loading) {
          dispatch({ type: 'SET_PAGE', payload: state.page + 1 });
        }
      },
      { threshold: 0.1 }
    );
    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }
    return () => {
      observerRef.current?.disconnect();
    };
  }, [state.page, state.totalPages, state.loading]);

  const handleSortChange = (sort: string) => {
    dispatch({ type: 'SET_SORT', payload: sort });
  };

  const handleMaterialChange = (material: string) => {
    dispatch({ type: 'SET_MATERIAL', payload: material });
  };

  const handlePriceChange = (min: number, max: number) => {
    dispatch({ type: 'SET_PRICE_RANGE', payload: { min, max } });
  };

  const { visibleItems, paddingTop, totalHeight } = useMemo(() => {
    const items = state.artworks || [];
    const safeColumns = Math.max(columns, 1);
    const rowCount = items.length > 0 ? Math.ceil(items.length / safeColumns) : 0;
    const viewportHeight = window.innerHeight;
    const scrollOffset = Math.max(0, scrollTop - gridOffsetTop);
    
    const startRow = Math.max(0, Math.floor(scrollOffset / ESTIMATED_ROW_HEIGHT) - BUFFER_ROWS);
    const visibleRows = Math.ceil(viewportHeight / ESTIMATED_ROW_HEIGHT) + BUFFER_ROWS * 2;
    const endRow = Math.min(rowCount, startRow + visibleRows);
    
    const startIndex = startRow * safeColumns;
    const endIndex = Math.min(items.length, endRow * safeColumns);
    
    const visible = items.slice(startIndex, endIndex).map((item, idx) => ({
      item,
      index: startIndex + idx,
    }));
    
    return {
      visibleItems: visible,
      paddingTop: startRow * ESTIMATED_ROW_HEIGHT,
      totalHeight: rowCount * ESTIMATED_ROW_HEIGHT,
    };
  }, [state.artworks, columns, scrollTop, gridOffsetTop]);

  const materials = [
    { value: 'all', label: '全部材质' },
    { value: '木质', label: '木质' },
    { value: '树脂', label: '树脂' },
    { value: '石膏', label: '石膏' },
    { value: '其他', label: '其他' },
  ];

  const sortOptions = [
    { value: 'latest', label: '最新发布' },
    { value: 'hot', label: '热度排行' },
    { value: 'price_asc', label: '价格从低到高' },
    { value: 'price_desc', label: '价格从高到低' },
  ];

  return (
    <div className="container" style={{ paddingTop: '30px', paddingBottom: '60px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--accent-gold)', marginBottom: '10px' }}>
          微缩景观展览大厅
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          探索微缩世界的无限可能 · 每一件作品都是匠人之心的结晶
        </p>
      </div>

      {/* 筛选面板 */}
      <div className="frosted-card filter-panel" style={{ padding: '20px 24px', marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          {/* 排序 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '14px', whiteSpace: 'nowrap' }}>排序:</span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {sortOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleSortChange(opt.value)}
                  className="sort-btn"
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: state.sort === opt.value ? '1px solid var(--accent-gold)' : '1px solid var(--card-border)',
                    background: state.sort === opt.value ? 'rgba(212, 160, 23, 0.15)' : 'transparent',
                    color: state.sort === opt.value ? 'var(--accent-gold)' : 'var(--text-secondary)',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 筛选 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>材质:</span>
              <select
                value={state.material}
                onChange={e => handleMaterialChange(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--card-border)',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {materials.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px', whiteSpace: 'nowrap' }}>价格区间:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  value={state.minPrice}
                  onChange={e => handlePriceChange(Number(e.target.value), state.maxPrice)}
                  style={{
                    width: '80px',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--card-border)',
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                  placeholder="最低"
                />
                <span style={{ color: 'var(--text-muted)' }}>-</span>
                <input
                  type="number"
                  value={state.maxPrice}
                  onChange={e => handlePriceChange(state.minPrice, Number(e.target.value))}
                  style={{
                    width: '80px',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--card-border)',
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                  placeholder="最高"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 作品网格 - 虚拟列表 */}
      {state.initialLoading ? (
        <div className="gallery-grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: `${CARD_HEIGHT}px` }} />
          ))}
        </div>
      ) : state.artworks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <p>暂无符合条件的作品</p>
        </div>
      ) : (
        <div
          ref={gridRef}
          className="virtual-list-container"
          style={{ position: 'relative', minHeight: '400px', height: `${totalHeight}px` }}
        >
          <div
            key={fadeKey}
            className="gallery-grid virtual-grid"
            style={{
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
              gap: `${CARD_GAP}px`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              transform: `translateY(${paddingTop}px)`,
            }}
          >
            {visibleItems.map(({ item, index }) => (
              <ArtworkCard
                key={item.id}
                artwork={item}
                index={index}
                onClick={() => navigate(`/artwork/${item.id}`)}
              />
            ))}
          </div>

          {/* 加载更多触发器 */}
          <div 
            ref={loadMoreRef} 
            style={{ 
              position: 'absolute',
              bottom: '20px',
              left: 0,
              right: 0,
              height: '60px',
            }} 
          />

          {/* 加载中指示器 */}
          {state.loading && (
            <div style={{ 
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              textAlign: 'center',
              padding: '20px 0',
              background: 'linear-gradient(to top, var(--bg-primary), transparent)'
            }}>
              <div className="loading-spinner" />
              <span style={{ color: 'var(--text-muted)', fontSize: '13px', marginLeft: '10px' }}>加载中...</span>
            </div>
          )}
        </div>
      )}

      <style>{`
        .virtual-list-container {
          overflow: visible;
          will-change: transform;
        }
        .virtual-grid {
          will-change: transform;
          contain: layout style;
        }
        .gallery-grid {
          display: grid;
        }
        .fade-grid {
          animation: fadeGrid 0.5s ease;
        }
        @keyframes fadeGrid {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .artwork-card {
          height: ${CARD_HEIGHT}px;
          cursor: pointer;
          perspective: 1000px;
          opacity: 0;
          animation: cardFadeIn 0.4s ease forwards;
          animation-delay: calc(var(--delay) * 0.05s);
          will-change: transform;
        }
        @keyframes cardFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          transform-style: preserve-3d;
        }
        .artwork-card:hover .card-inner {
          transform: rotateY(180deg);
        }
        .card-front, .card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          border-radius: var(--radius-md);
          overflow: hidden;
        }
        .card-front {
          background: var(--card-bg);
          backdrop-filter: blur(8px);
          border: 1px solid var(--card-border);
        }
        .card-back {
          background: linear-gradient(135deg, rgba(212, 160, 23, 0.95), rgba(184, 137, 18, 0.95));
          transform: rotateY(180deg);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }
        .card-image {
          width: 100%;
          height: 75%;
          object-fit: cover;
        }
        .card-info {
          padding: 12px 14px;
        }
        .card-name {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .card-likes {
          font-size: 12px;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .card-back-price {
          font-size: 28px;
          font-weight: 700;
          color: var(--bg-primary);
          margin-bottom: 8px;
        }
        .card-back-price span {
          font-size: 16px;
        }
        .card-back-material {
          background: rgba(42, 42, 42, 0.2);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          color: var(--bg-primary);
          margin-bottom: 16px;
        }
        .card-back-seller {
          font-size: 13px;
          color: rgba(42, 42, 42, 0.7);
        }
        .card-back-view {
          margin-top: 16px;
          padding: 8px 20px;
          background: var(--bg-primary);
          color: var(--accent-gold);
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
        }
        .loading-spinner {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 2px solid var(--card-border);
          border-top-color: var(--accent-gold);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          vertical-align: middle;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .filter-panel {
          position: sticky;
          top: 70px;
          z-index: 50;
        }
        @media (max-width: 768px) {
          .gallery-grid {
            grid-template-columns: 1fr !important;
          }
          .artwork-card {
            height: auto !important;
            min-height: 280px;
          }
        }
      `}</style>
    </div>
  );
}

function ArtworkCard({ artwork, index, onClick }: { artwork: Artwork; index: number; onClick: () => void }) {
  return (
    <div
      className="artwork-card"
      onClick={onClick}
      style={{ '--delay': index % 20 } as React.CSSProperties}
    >
      <div className="card-inner">
        <div className="card-front frosted-card">
          <img src={artwork.images[0]} alt={artwork.name} className="card-image" loading="lazy" />
          <div className="card-info">
            <div className="card-name">{artwork.name}</div>
            <div className="card-likes">
              <span>❤️</span>
              <span>{artwork.likes}</span>
            </div>
          </div>
        </div>
        <div className="card-back">
          <div className="card-back-price">
            <span>¥</span>{artwork.price}
          </div>
          <div className="card-back-material">{artwork.material}</div>
          <div className="card-back-seller">{artwork.sellerName}</div>
          <div className="card-back-view">查看详情 →</div>
        </div>
      </div>
    </div>
  );
}

export default Gallery;
