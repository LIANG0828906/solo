import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { GalleryManager, StickerData } from './GalleryManager';

const COLORS_32 = [
  '#000000', '#4A4A4A', '#808080', '#C0C0C0', '#FFFFFF', '#FF0000', '#8B0000', '#DC143C',
  '#FF8C00', '#FF4500', '#FFD700', '#FFFFE0', '#008000', '#00FF00', '#006400', '#808000',
  '#00FFFF', '#008080', '#0000FF', '#00008B', '#000080', '#87CEEB', '#800080', '#EE82EE',
  '#FF00FF', '#FFC0CB', '#FF69B4', '#A52A2A', '#D2691E', '#D2B48C', '#FF7F50', '#FA8072',
];

const COLOR_NAMES: Record<string, string> = {
  '#000000': 'Black', '#4A4A4A': 'Dark Gray', '#808080': 'Gray', '#C0C0C0': 'Silver',
  '#FFFFFF': 'White', '#FF0000': 'Red', '#8B0000': 'Dark Red', '#DC143C': 'Crimson',
  '#FF8C00': 'Orange', '#FF4500': 'Dark Orange', '#FFD700': 'Gold', '#FFFFE0': 'Light Yellow',
  '#008000': 'Green', '#00FF00': 'Lime', '#006400': 'Dark Green', '#808000': 'Olive',
  '#00FFFF': 'Cyan', '#008080': 'Teal', '#0000FF': 'Blue', '#00008B': 'Dark Blue',
  '#000080': 'Navy', '#87CEEB': 'Sky Blue', '#800080': 'Purple', '#EE82EE': 'Violet',
  '#FF00FF': 'Magenta', '#FFC0CB': 'Pink', '#FF69B4': 'Hot Pink', '#A52A2A': 'Brown',
  '#D2691E': 'Chocolate', '#D2B48C': 'Tan', '#FF7F50': 'Coral', '#FA8072': 'Salmon',
};

interface GalleryViewProps {
  galleryManager: GalleryManager;
  newStickerId?: string | null;
  onDeleted?: () => void;
}

const ITEM_SIZE = 200;
const GAP = 16;
const COLS = 4;
const ROW_HEIGHT = ITEM_SIZE + GAP + 40;
const BUFFER_ROWS = 2;

export const GalleryView: React.FC<GalleryViewProps> = ({ galleryManager, newStickerId, onDeleted }) => {
  const [stickers, setStickers] = useState<StickerData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedSticker, setSelectedSticker] = useState<StickerData | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const filteredStickers = useMemo(() => {
    let result = [...stickers];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(q));
    }
    result.sort((a, b) => sortOrder === 'desc' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt);
    return result;
  }, [stickers, searchQuery, sortOrder]);

  const totalRows = Math.ceil(filteredStickers.length / COLS);
  const totalHeight = totalRows * ROW_HEIGHT + GAP;

  const startRow = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_ROWS);
  const visibleRows = Math.ceil(containerHeight / ROW_HEIGHT) + BUFFER_ROWS * 2;
  const endRow = Math.min(totalRows, startRow + visibleRows);

  const visibleStickers = useMemo(() => {
    const result: (StickerData & { row: number; col: number })[] = [];
    for (let row = startRow; row < endRow; row++) {
      for (let col = 0; col < COLS; col++) {
        const idx = row * COLS + col;
        if (idx < filteredStickers.length) {
          result.push({ ...filteredStickers[idx], row, col });
        }
      }
    }
    return result;
  }, [filteredStickers, startRow, endRow]);

  const loadStickers = useCallback(async () => {
    const data = await galleryManager.loadAllStickers();
    setStickers(data);
  }, [galleryManager]);

  useEffect(() => {
    loadStickers();
  }, [loadStickers]);

  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      setScrollTop(scrollRef.current.scrollTop);
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    ro.observe(el);
    setContainerHeight(el.clientHeight);
    return () => ro.disconnect();
  }, []);

  const handleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = await galleryManager.toggleFavorite(id);
    if (updated) {
      setStickers(prev => prev.map(s => s.id === id ? updated : s));
      if (selectedSticker?.id === id) {
        setSelectedSticker(updated);
      }
    }
  };

  const handleDelete = async (id: string) => {
    await galleryManager.deleteSticker(id);
    setSelectedSticker(null);
    loadStickers();
    onDeleted?.();
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="gallery-container">
      <div className="gallery-toolbar">
        <input
          className="gallery-search"
          type="text"
          placeholder="搜索贴纸..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <select
          className="gallery-sort"
          value={sortOrder}
          onChange={e => setSortOrder(e.target.value as 'desc' | 'asc')}
        >
          <option value="desc">最新优先</option>
          <option value="asc">最早优先</option>
        </select>
      </div>
      <div className="gallery-grid-scroll" ref={scrollRef} onScroll={handleScroll}>
        <div className="gallery-grid-inner" style={{ height: totalHeight, position: 'relative' }}>
          {visibleStickers.map(s => {
            const isNew = s.id === newStickerId;
            const top = s.row * ROW_HEIGHT + GAP;
            const left = s.col * (ITEM_SIZE + GAP) + GAP;
            return (
              <div
                key={s.id}
                className={`gallery-card${isNew ? ' gallery-card-new' : ''}`}
                style={{ position: 'absolute', top, left, width: ITEM_SIZE, height: ITEM_SIZE }}
                onClick={() => setSelectedSticker(s)}
              >
                <div className="gallery-card-img-wrap">
                  <img src={s.imageData} alt={s.name} className="gallery-card-img" />
                </div>
                <div className="gallery-card-overlay">
                  <span className="gallery-card-name">{s.name}</span>
                  <span className="gallery-card-date">{formatDate(s.createdAt)}</span>
                </div>
              </div>
            );
          })}
          {filteredStickers.length === 0 && (
            <div className="gallery-empty">
              {searchQuery ? '没有找到匹配的贴纸' : '还没有贴纸，去创作一个吧！'}
            </div>
          )}
        </div>
      </div>

      {selectedSticker && (
        <div className="detail-overlay" onClick={() => setSelectedSticker(null)}>
          <div className="detail-modal" onClick={e => e.stopPropagation()}>
            <div className="detail-image-section">
              <div className="detail-image-wrap" style={{ transform: `scale(${zoomLevel})` }}>
                <img src={selectedSticker.imageData} alt={selectedSticker.name} className="detail-image" />
              </div>
              <div className="detail-zoom-controls">
                <button className="detail-zoom-btn" onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.25))}>−</button>
                <span className="detail-zoom-level">{Math.round(zoomLevel * 100)}%</span>
                <button className="detail-zoom-btn" onClick={() => setZoomLevel(z => Math.min(3, z + 0.25))}>+</button>
              </div>
            </div>
            <div className="detail-info-section">
              <h2 className="detail-name">{selectedSticker.name}</h2>
              <p className="detail-date">创建时间：{formatDate(selectedSticker.createdAt)}</p>
              <div className="detail-fav-row">
                <button
                  className={`detail-fav-btn${selectedSticker.isFavorited ? ' favorited' : ''}`}
                  onClick={e => handleFavorite(selectedSticker.id, e)}
                >
                  <svg viewBox="0 0 24 24" width="28" height="28" className="heart-icon">
                    <path
                      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                      fill={selectedSticker.isFavorited ? '#FF4757' : 'none'}
                      stroke={selectedSticker.isFavorited ? '#FF4757' : '#999'}
                      strokeWidth="2"
                    />
                  </svg>
                </button>
                <span className="detail-fav-count">{selectedSticker.likes}</span>
              </div>
              <button className="detail-delete-btn" onClick={() => handleDelete(selectedSticker.id)}>
                删除贴纸
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { COLORS_32, COLOR_NAMES };
