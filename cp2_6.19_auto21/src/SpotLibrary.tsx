import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Spot, SpotCategory, CATEGORY_COLORS, SPOTS, filterSpots } from './data';
import { useRouteStore } from './store';

const CATEGORIES: (SpotCategory | '全部')[] = ['全部', '景点', '餐厅', '博物馆'];

function StarRating({ rating }: { rating: number }) {
  return (
    <span style={{ color: '#f5a623', fontSize: 12, letterSpacing: 1 }}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  );
}

interface SpotCardProps {
  spot: Spot;
  onDragStart: (e: React.DragEvent, spot: Spot) => void;
  animating: boolean;
}

function SpotCard({ spot, onDragStart, animating }: SpotCardProps) {
  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      onDragStart(e, spot);
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'copy';
      }
      const el = e.currentTarget as HTMLElement;
      setTimeout(() => {
        el.style.opacity = '0.4';
      }, 0);
    },
    [spot, onDragStart]
  );

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    const el = e.currentTarget as HTMLElement;
    el.style.opacity = '1';
  }, []);

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={{
        background: '#fff',
        borderRadius: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        cursor: 'grab',
        transition: animating ? 'transform 0.2s ease, opacity 0.2s ease' : 'transform 0.15s ease',
        transform: animating ? 'scale(0.92)' : 'scale(1)',
        opacity: animating ? 0 : 1,
      }}
      onMouseEnter={(e) => {
        if (!animating) (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        if (!animating) (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
    >
      <div style={{ width: '100%', height: 100, overflow: 'hidden', position: 'relative' }}>
        <img
          src={spot.thumbnail}
          alt={spot.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          loading="lazy"
        />
        <span
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            background: CATEGORY_COLORS[spot.category],
            color: '#fff',
            fontSize: 11,
            padding: '2px 8px',
            borderRadius: 10,
            fontWeight: 600,
          }}
        >
          {spot.category}
        </span>
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{spot.name}</div>
        <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5, marginBottom: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {spot.description}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <StarRating rating={spot.rating} />
          <span style={{ fontSize: 11, color: '#aaa' }}>{spot.visitDuration}分钟</span>
        </div>
      </div>
    </div>
  );
}

interface SpotLibraryProps {
  onDragStart: (e: React.DragEvent, spot: Spot) => void;
}

export default function SpotLibrary({ onDragStart }: SpotLibraryProps) {
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState<SpotCategory | '全部'>('全部');
  const [animKey, setAnimKey] = useState(0);
  const lastFilterRef = useRef('');

  const filtered = useMemo(() => {
    const result = filterSpots(SPOTS, keyword, category);
    const filterKey = `${keyword}-${category}`;
    if (filterKey !== lastFilterRef.current) {
      lastFilterRef.current = filterKey;
      setAnimKey((k) => k + 1);
    }
    return result;
  }, [keyword, category]);

  const handleKeywordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value);
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e8e4dc' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>景点库</h2>
        <input
          type="text"
          placeholder="搜索景点名称..."
          value={keyword}
          onChange={handleKeywordChange}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: 8,
            fontSize: 13,
            outline: 'none',
            background: '#fff',
            marginBottom: 10,
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#4a90d9')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#ddd')}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                padding: '4px 12px',
                borderRadius: 14,
                border: 'none',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: category === cat ? CATEGORY_COLORS[cat as SpotCategory] || '#555' : '#eee',
                color: category === cat ? '#fff' : '#666',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 16px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 12,
          alignContent: 'start',
        }}
      >
        {filtered.map((spot, i) => (
          <div
            key={spot.id}
            style={{
              animation: animKey > 0 ? `fadeScaleIn 0.2s ease ${i * 30}ms both` : 'none',
            }}
          >
            <SpotCard spot={spot} onDragStart={onDragStart} animating={false} />
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#aaa', padding: 40, fontSize: 14 }}>
            没有找到匹配的景点
          </div>
        )}
      </div>
      <style>{`
        @keyframes fadeScaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
