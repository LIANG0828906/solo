import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { FontMetadata } from '../modules/FontManager';
import type { HistoryEntry } from '../types';

interface FontSidebarProps {
  fonts: FontMetadata[];
  loading: boolean;
  selectedFont: string;
  favorites: string[];
  history: HistoryEntry[];
  sidebarWidth: number;
  onFontSelect: (font: FontMetadata) => void;
  onSearch: (keyword: string) => void;
  onToggleFavorite: (fontFamily: string) => void;
  onHistorySelect: (entry: HistoryEntry) => void;
  getPreviewText: (font: FontMetadata) => string;
}

const HEADER_HEIGHT = 44;
const ITEM_HEIGHT = 64;
const BUFFER_ITEMS = 5;

type SidebarItem =
  | { type: 'fav-header' }
  | { type: 'font'; font: FontMetadata; isFavorite: true }
  | { type: 'all-header' }
  | { type: 'font'; font: FontMetadata; isFavorite: false }
  | { type: 'history-header' }
  | { type: 'history'; entry: HistoryEntry };

function getItemHeight(item: SidebarItem): number {
  if (item.type === 'fav-header' || item.type === 'all-header' || item.type === 'history-header') {
    return HEADER_HEIGHT;
  }
  return ITEM_HEIGHT;
}

const FontSidebar: React.FC<FontSidebarProps> = ({
  fonts,
  loading,
  selectedFont,
  favorites,
  history,
  sidebarWidth,
  onFontSelect,
  onSearch,
  onToggleFavorite,
  onHistorySelect,
  getPreviewText
}) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [scrollTop, setScrollTop] = useState(0);
  const [copiedFont, setCopiedFont] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(true);
  const [showHistory, setShowHistory] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onSearch(searchKeyword);
  }, [searchKeyword, onSearch]);

  const handleCopyFontName = useCallback((e: React.MouseEvent, fontFamily: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(fontFamily);
    setCopiedFont(fontFamily);
    setTimeout(() => setCopiedFont(null), 2000);
  }, []);

  const favoriteFonts = useMemo(() => 
    fonts.filter(f => favorites.includes(f.family)),
    [fonts, favorites]
  );
  
  const regularFonts = useMemo(() => 
    fonts.filter(f => !favorites.includes(f.family)),
    [fonts, favorites]
  );

  const items = useMemo<SidebarItem[]>(() => {
    const result: SidebarItem[] = [];
    if (showFavorites && favoriteFonts.length > 0) {
      result.push({ type: 'fav-header' });
      favoriteFonts.forEach(f => {
        result.push({ type: 'font', font: f, isFavorite: true });
      });
    }
    result.push({ type: 'all-header' });
    regularFonts.forEach(f => {
      result.push({ type: 'font', font: f, isFavorite: false });
    });
    if (history.length > 0) {
      result.push({ type: 'history-header' });
      if (showHistory) {
        history.forEach(h => {
          result.push({ type: 'history', entry: h });
        });
      }
    }
    return result;
  }, [showFavorites, favoriteFonts, regularFonts, history, showHistory]);

  const { cumulativeHeights, totalHeight } = useMemo(() => {
    const heights: number[] = [];
    let total = 0;
    for (const item of items) {
      heights.push(total);
      total += getItemHeight(item);
    }
    return { cumulativeHeights: heights, totalHeight: total };
  }, [items]);

  const { startIndex, endIndex, offsetY } = useMemo(() => {
    if (items.length === 0) {
      return { startIndex: 0, endIndex: 0, offsetY: 0 };
    }
    
    let start = 0;
    let end = items.length;
    
    while (start < end - 1) {
      const mid = Math.floor((start + end) / 2);
      if (cumulativeHeights[mid] + getItemHeight(items[mid]) < scrollTop) {
        start = mid;
      } else {
        end = mid;
      }
    }
    const startIdx = Math.max(0, start - BUFFER_ITEMS);
    
    const viewportHeight = listRef.current?.clientHeight ?? 600;
    const scrollBottom = scrollTop + viewportHeight;
    let endIdx = startIdx;
    while (endIdx < items.length && cumulativeHeights[endIdx] < scrollBottom + 100) {
      endIdx++;
    }
    endIdx = Math.min(items.length, endIdx + BUFFER_ITEMS);
    
    return {
      startIndex: startIdx,
      endIndex: endIdx,
      offsetY: cumulativeHeights[startIdx] ?? 0
    };
  }, [items, cumulativeHeights, scrollTop]);

  const visibleItems = useMemo(() => 
    items.slice(startIndex, endIndex).map((item, idx) => ({
      item,
      globalIndex: startIndex + idx,
      itemOffset: cumulativeHeights[startIndex + idx] - offsetY
    })),
    [items, startIndex, endIndex, cumulativeHeights, offsetY]
  );

  const renderItem = (item: SidebarItem, globalIndex: number, topOffset: number) => {
    const height = getItemHeight(item);
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      top: topOffset,
      left: 0,
      right: 0,
      height
    };

    if (item.type === 'fav-header') {
      return (
        <div
          key="fav-header"
          style={{
            ...baseStyle,
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f0f4f8',
            borderBottom: '1px solid #d1d9e6',
            zIndex: 5
          }}
        >
          <span style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#4a6fa5',
            textTransform: 'uppercase',
            letterSpacing: 0.5
          }}>
            ⭐ Favorites
            <span style={{
              marginLeft: 8,
              padding: '2px 8px',
              backgroundColor: '#4a6fa5',
              color: 'white',
              borderRadius: 10,
              fontSize: 11,
              fontWeight: 700
            }}>{favoriteFonts.length}</span>
          </span>
          <button 
            onClick={() => setShowFavorites(!showFavorites)} 
            style={{ 
              color: '#6b7c93',
              width: 28,
              height: 28,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 'bold'
            }}
          >
            {showFavorites ? '−' : '+'}
          </button>
        </div>
      );
    }

    if (item.type === 'all-header') {
      return (
        <div
          key={`all-header-${globalIndex}`}
          style={{
            ...baseStyle,
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#f0f4f8',
            borderBottom: '1px solid #d1d9e6',
            zIndex: 4
          }}
        >
          <span style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#4a6fa5',
            textTransform: 'uppercase',
            letterSpacing: 0.5
          }}>
            📚 All Fonts
            <span style={{
              marginLeft: 8,
              padding: '2px 8px',
              backgroundColor: '#d1d9e6',
              color: '#4a6fa5',
              borderRadius: 10,
              fontSize: 11,
              fontWeight: 700
            }}>{fonts.length}</span>
          </span>
        </div>
      );
    }

    if (item.type === 'history-header') {
      return (
        <div
          key={`history-header`}
          style={{
            ...baseStyle,
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#fff5f5',
            borderTop: '2px solid #ff6b6b',
            borderBottom: '1px solid #d1d9e6'
          }}
        >
          <span style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#ff6b6b',
            textTransform: 'uppercase',
            letterSpacing: 0.5
          }}>
            🕐 Recent Layouts
          </span>
          <button 
            onClick={() => setShowHistory(!showHistory)} 
            style={{ 
              color: '#6b7c93',
              width: 28,
              height: 28,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 'bold'
            }}
          >
            {showHistory ? '−' : '+'}
          </button>
        </div>
      );
    }

    if (item.type === 'history') {
      const date = new Date(item.entry.timestamp);
      const timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      return (
        <div
          key={item.entry.id}
          onClick={() => onHistorySelect(item.entry)}
          style={{
            ...baseStyle,
            padding: '12px 16px',
            cursor: 'pointer',
            borderBottom: '1px solid #f0f4f8',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 4,
            transition: 'background-color 0.2s',
            backgroundColor: '#fffaf7'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#ffe8e0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#fffaf7';
          }}
        >
          <div style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#1e3a5f',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            🔤 {item.entry.fontFamily}
          </div>
          <div style={{
            fontSize: 11,
            color: '#6b7c93',
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap'
          }}>
            <span>📏 {item.entry.fontSize}px</span>
            <span>📐 {item.entry.lineHeight}</span>
            <span style={{ color: '#ff6b6b' }}>⏰ {timeStr}</span>
          </div>
        </div>
      );
    }

    const { font, isFavorite } = item;
    const previewText = getPreviewText(font);
    const isSelected = selectedFont === font.family;

    return (
      <div
        key={font.family}
        onClick={() => onFontSelect(font)}
        style={{
          ...baseStyle,
          padding: '10px 16px',
          cursor: 'pointer',
          backgroundColor: isSelected ? 'rgba(74, 111, 165, 0.12)' : 'transparent',
          borderBottom: '1px solid #f0f4f8',
          borderLeft: isSelected ? '3px solid #4a6fa5' : '3px solid transparent',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          transition: 'background-color 0.15s, border-left-color 0.15s'
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = '#e8edf3';
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        <div style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          justifyContent: 'center'
        }}>
          <div style={{
            fontSize: 22,
            color: '#1e3a5f',
            fontFamily: `'${font.family}', sans-serif`,
            lineHeight: 1.15,
            height: 26,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {previewText}
          </div>
          <div style={{
            fontSize: 11,
            color: '#6b7c93',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'flex',
            gap: 6,
            alignItems: 'center'
          }}>
            <span style={{ fontWeight: 500, color: '#4a6fa5' }}>{font.family}</span>
            <span>·</span>
            <span style={{
              fontSize: 10,
              padding: '1px 6px',
              backgroundColor: '#f0f4f8',
              borderRadius: 3,
              textTransform: 'capitalize'
            }}>{font.category}</span>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          opacity: copiedFont === font.family || isSelected ? 1 : 0,
          transition: 'opacity 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
        >
          <button
            onClick={(e) => handleCopyFontName(e, font.family)}
            style={{
              padding: 6,
              borderRadius: 4,
              color: copiedFont === font.family ? '#27ae60' : '#6b7c93',
              fontSize: 13,
              minWidth: 28,
              textAlign: 'center'
            }}
            title="Copy font name"
          >
            {copiedFont === font.family ? '✓' : '📋'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(font.family);
            }}
            style={{
              padding: 6,
              borderRadius: 4,
              color: isFavorite ? '#ff6b6b' : '#c0c8d4',
              fontSize: 18,
              minWidth: 28,
              textAlign: 'center',
              transition: 'color 0.15s, transform 0.15s'
            }}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {isFavorite ? '★' : '☆'}
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ 
        width: sidebarWidth, 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        backgroundColor: 'white'
      }}>
        <div style={{
          padding: 16,
          borderBottom: '1px solid #d1d9e6'
        }}>
          <div className="skeleton" style={{
            height: 40,
            borderRadius: 6
          }} />
        </div>
        
        <div style={{ 
          flex: 1, 
          padding: '20px 16px', 
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: 20
          }}>
            <div style={{
              fontSize: 14,
              color: '#6b7c93',
              marginBottom: 8,
              fontWeight: 500
            }}>
              <span style={{ animation: 'pulse 1.5s infinite' }}>⏳</span> Loading fonts...
            </div>
            <div style={{
              fontSize: 11,
              color: '#a0aec0'
            }}>
              正在加载字体数据，请稍候...
            </div>
          </div>
          
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div className="skeleton" style={{
                height: ITEM_HEIGHT - 8,
                borderRadius: 8
              }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: sidebarWidth,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'white',
      borderRight: '1px solid #d1d9e6'
    }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #d1d9e6',
        backgroundColor: '#fafbfc'
      }}>
        <div style={{
          fontSize: 11,
          color: '#6b7c93',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 8
        }}>
          🔎 搜索字体
        </div>
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center'
        }}>
          <span style={{
            position: 'absolute',
            left: 12,
            color: '#a0aec0',
            fontSize: 14
          }}>🔍</span>
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="输入字体名或分类..."
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              fontSize: 14,
              border: '2px solid #d1d9e6',
              borderRadius: 8,
              backgroundColor: 'white',
              transition: 'border-color 0.2s, box-shadow 0.2s'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#4a6fa5';
              e.target.style.boxShadow = '0 0 0 3px rgba(74, 111, 165, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d1d9e6';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>

      <div
        ref={listRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          position: 'relative',
          WebkitOverflowScrolling: 'touch'
        }}
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      >
        {fonts.length === 0 ? (
          <div className="fade-in" style={{
            padding: '60px 24px',
            textAlign: 'center',
            color: '#6b7c93'
          }}>
            <div style={{ 
              fontSize: 56, 
              marginBottom: 16,
              opacity: 0.5
            }}>🔍</div>
            <div style={{ 
              fontSize: 16, 
              fontWeight: 600, 
              color: '#4a6fa5',
              marginBottom: 8
            }}>
              没有找到匹配的字体
            </div>
            <div style={{ 
              fontSize: 13, 
              color: '#a0aec0'
            }}>
              试试其他关键词，或者清除搜索条件
            </div>
          </div>
        ) : (
          <div style={{
            height: totalHeight,
            position: 'relative'
          }}>
            {visibleItems.map(({ item, globalIndex, itemOffset }) => 
              renderItem(item, globalIndex, itemOffset)
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FontSidebar;
