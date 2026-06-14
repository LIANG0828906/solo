import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useStarStore } from '../store/useStarStore';
import { searchStars } from '../utils/stardata';
import { StarData } from '../types';

export default function SearchBar() {
  const { stars, searchQuery, setSearchQuery, flyToStar, highlightedStarId, setHighlightedStarId } = useStarStore();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchStars(stars, searchQuery).slice(0, 8);
  }, [stars, searchQuery]);

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);
    
    if (index === -1) return text;
    
    return (
      <>
        {text.slice(0, index)}
        <span style={{ color: '#00d4ff', fontWeight: 600 }}>
          {text.slice(index, index + query.length)}
        </span>
        {text.slice(index + query.length)}
      </>
    );
  };

  const handleSelect = (star: StarData) => {
    flyToStar(star);
    setIsFocused(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setSearchQuery('');
    setHighlightedStarId(null);
    inputRef.current?.focus();
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (results.length > 0 && isFocused) {
      setHighlightedStarId(results[0].id);
    }
  }, [results, isFocused, setHighlightedStarId]);

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 400 }}>
      <div 
        className="glass-panel"
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 16px',
          transition: 'all 0.3s ease',
          boxShadow: isFocused ? '0 0 20px rgba(0, 212, 255, 0.3)' : '0 4px 20px rgba(0, 0, 0, 0.3)',
          borderColor: isFocused ? 'rgba(0, 212, 255, 0.5)' : 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <Search 
          size={18} 
          style={{ 
            color: isFocused ? '#00d4ff' : 'rgba(255,255,255,0.5)',
            marginRight: 10,
            transition: 'color 0.3s ease',
            flexShrink: 0,
          }} 
        />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="搜索恒星名称或星座..."
          style={{
            flex: 1,
            background: 'transparent',
            color: 'white',
            fontSize: 14,
            padding: 0,
          }}
        />
        {searchQuery && (
          <button
            onClick={handleClear}
            style={{
              background: 'transparent',
              color: 'rgba(255,255,255,0.5)',
              display: 'flex',
              alignItems: 'center',
              padding: 4,
              borderRadius: '50%',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isFocused && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="glass-panel animate-fade-in"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            maxHeight: 320,
            overflowY: 'auto',
            zIndex: 1000,
            padding: 6,
          }}
        >
          {results.map((star, index) => (
            <div
              key={star.id}
              onClick={() => handleSelect(star)}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                transition: 'all 0.2s ease',
                background: highlightedStarId === star.id ? 'rgba(0, 212, 255, 0.15)' : 'transparent',
                animationDelay: `${index * 30}ms`,
                opacity: 0,
                animation: `fadeInUp 0.3s ease forwards ${index * 30}ms`,
              }}
              onMouseEnter={(e) => {
                if (highlightedStarId !== star.id) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                }
                setHighlightedStarId(star.id);
              }}
              onMouseLeave={(e) => {
                if (highlightedStarId !== star.id) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: star.color,
                  boxShadow: `0 0 8px ${star.color}`,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'white', fontSize: 14, fontWeight: 500 }}>
                  {highlightText(star.name, searchQuery)}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 }}>
                  {highlightText(star.nameCn, searchQuery)} · {star.constellationCn}
                </div>
              </div>
              <div style={{ 
                color: 'rgba(255,255,255,0.4)', 
                fontSize: 12,
                flexShrink: 0,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {star.apparentMagnitude.toFixed(2)}m
              </div>
            </div>
          ))}
        </div>
      )}

      {isFocused && searchQuery.trim() && results.length === 0 && (
        <div
          className="glass-panel animate-fade-in"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            padding: '20px',
            textAlign: 'center',
            zIndex: 1000,
          }}
        >
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
            未找到匹配的恒星
          </div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 4 }}>
            试试输入其他恒星名称或星座
          </div>
        </div>
      )}
    </div>
  );
}
