import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const itemHeight = 64;
  const visibleCount = 20;

  useEffect(() => {
    onSearch(searchKeyword);
  }, [searchKeyword, onSearch]);

  const handleCopyFontName = useCallback((e: React.MouseEvent, fontFamily: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(fontFamily);
    setCopiedFont(fontFamily);
    setTimeout(() => setCopiedFont(null), 2000);
  }, []);

  const favoriteFonts = fonts.filter(f => favorites.includes(f.family));
  const regularFonts = fonts.filter(f => !favorites.includes(f.family));

  const allItems = [
    ...(showFavorites && favoriteFonts.length > 0 ? [{ type: 'fav-header' as const }] : []),
    ...(showFavorites ? favoriteFonts.map(f => ({ type: 'font' as const, font: f, isFavorite: true })) : []),
    { type: 'all-header' as const },
    ...regularFonts.map(f => ({ type: 'font' as const, font: f, isFavorite: false })),
    ...(history.length > 0 ? [{ type: 'history-header' as const }] : []),
    ...(showHistory ? history.map(h => ({ type: 'history' as const, entry: h })) : [])
  ];

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight));
  const endIndex = Math.min(allItems.length, startIndex + visibleCount + 5);
  const visibleItems = allItems.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  const renderItem = (item: typeof allItems[0], _index: number) => {
    if (item.type === 'fav-header') {
      return (
        <div
          key="fav-header"
          style={{
            height: 44,
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f0f4f8',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}
        >
          <span style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#4a6fa5',
            textTransform: 'uppercase',
            letterSpacing: 0.5
          }}>
            Favorites
            <span style={{
              marginLeft: 8,
              padding: '2px 8px',
              backgroundColor: '#4a6fa5',
              color: 'white',
              borderRadius: 10,
              fontSize: 11
            }}>{favoriteFonts.length}</span>
          </span>
          <button onClick={() => setShowFavorites(!showFavorites)} style={{ color: '#6b7c93' }}>
            {showFavorites ? '−' : '+'}
          </button>
        </div>
      );
    }

    if (item.type === 'all-header') {
      return (
        <div
          key="all-header"
          style={{
            height: 44,
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#f0f4f8',
            position: 'sticky',
            top: showFavorites && favoriteFonts.length > 0 ? 44 : 0,
            zIndex: 10
          }}
        >
          <span style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#4a6fa5',
            textTransform: 'uppercase',
            letterSpacing: 0.5
          }}>
            All Fonts
            <span style={{
              marginLeft: 8,
              padding: '2px 8px',
              backgroundColor: '#d1d9e6',
              color: '#4a6fa5',
              borderRadius: 10,
              fontSize: 11
            }}>{fonts.length}</span>
          </span>
        </div>
      );
    }

    if (item.type === 'history-header') {
      return (
        <div
          key="history-header"
          style={{
            height: 44,
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f0f4f8',
            borderTop: '1px solid #d1d9e6'
          }}
        >
          <span style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#ff6b6b',
            textTransform: 'uppercase',
            letterSpacing: 0.5
          }}>
            Recent Layouts
          </span>
          <button onClick={() => setShowHistory(!showHistory)} style={{ color: '#6b7c93' }}>
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
            height: itemHeight,
            padding: '12px 16px',
            cursor: 'pointer',
            borderBottom: '1px solid #f0f4f8',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 4,
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e8edf3';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          className="fade-in"
        >
          <div style={{
            fontSize: 13,
            fontWeight: 500,
            color: '#1e3a5f',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {item.entry.fontFamily}
          </div>
          <div style={{
            fontSize: 11,
            color: '#6b7c93',
            display: 'flex',
            gap: 12
          }}>
            <span>{item.entry.fontSize}px</span>
            <span>LH {item.entry.lineHeight}</span>
            <span>{timeStr}</span>
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
          height: itemHeight,
          padding: '12px 16px',
          cursor: 'pointer',
          backgroundColor: isSelected ? 'rgba(74, 111, 165, 0.1)' : 'transparent',
          borderBottom: '1px solid #f0f4f8',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          transition: 'background-color 0.2s',
          position: 'relative'
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
          gap: 4
        }}>
          <div style={{
            fontSize: 20,
            color: '#1e3a5f',
            fontFamily: `'${font.family}', sans-serif`,
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {previewText}
          </div>
          <div style={{
            fontSize: 12,
            color: '#6b7c93',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {font.family} · {font.category}
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4
        }}>
          <button
            onClick={(e) => handleCopyFontName(e, font.family)}
            style={{
              padding: 6,
              borderRadius: 4,
              color: '#6b7c93',
              fontSize: 14,
              opacity: copiedFont === font.family ? 1 : 0,
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
            title="Copy font name"
          >
            {copiedFont === font.family ? '✓ Copied!' : '📋'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(font.family);
            }}
            style={{
              padding: 6,
              borderRadius: 4,
              color: isFavorite ? '#ff6b6b' : '#6b7c93',
              fontSize: 16
            }}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorite ? '★' : '☆'}
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ width: sidebarWidth, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{
          padding: 16,
          borderBottom: '1px solid #d1d9e6'
        }}>
          <div className="skeleton" style={{
            height: 40,
            borderRadius: 6
          }} />
        </div>
        <div style={{ flex: 1, padding: 16, overflow: 'hidden' }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton" style={{
              height: itemHeight - 8,
              marginBottom: 8,
              borderRadius: 6
            }} />
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
        padding: 16,
        borderBottom: '1px solid #d1d9e6'
      }}>
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center'
        }}>
          <span style={{
            position: 'absolute',
            left: 12,
            color: '#6b7c93',
            fontSize: 16
          }}>🔍</span>
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Search fonts..."
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              fontSize: 14,
              border: '1px solid #d1d9e6',
              borderRadius: 6,
              backgroundColor: '#f7f9fc',
              transition: 'border-color 0.2s, background-color 0.2s'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#4a6fa5';
              e.target.style.backgroundColor = 'white';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d1d9e6';
              e.target.style.backgroundColor = '#f7f9fc';
            }}
          />
        </div>
      </div>

      <div
        ref={listRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          position: 'relative'
        }}
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      >
        {fonts.length === 0 ? (
          <div className="fade-in" style={{
            padding: 60,
            textAlign: 'center',
            color: '#6b7c93'
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <div style={{ fontSize: 14 }}>没有找到匹配的字体</div>
          </div>
        ) : (
          <div style={{
            height: allItems.length * itemHeight,
            position: 'relative'
          }}>
            <div style={{
              transform: `translateY(${offsetY}px)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0
            }}>
              {visibleItems.map((item, index) => renderItem(item, index))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FontSidebar;
