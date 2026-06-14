import { useMemo, useState, useEffect, useRef } from 'react';
import { useStallService } from '@/modules/map/stallService';
import LazyImage from '@/components/LazyImage';
import { CATEGORY_LABELS, CATEGORY_COLORS, Category, SortType, Stall } from '@/types';

const SORT_OPTIONS: { value: SortType; label: string; icon: string }[] = [
  { value: 'distance', label: '距离最近', icon: '📍' },
  { value: 'rating', label: '评分最高', icon: '⭐' },
  { value: 'latest', label: '最新发布', icon: '🆕' }
];

function renderStars(rating: number) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  const stars = [];

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(<span key={i} style={{ color: '#FFD700', fontSize: '13px' }}>★</span>);
    } else if (i === fullStars && hasHalf) {
      stars.push(<span key={i} style={{ color: '#FFD700', fontSize: '13px' }}>☆</span>);
    } else {
      stars.push(<span key={i} style={{ color: '#E0E0E0', fontSize: '13px' }}>★</span>);
    }
  }
  return stars;
}

function StallCard({ stall, onClick, index }: { stall: Stall; onClick: () => void; index: number }) {
  const hotProduct = stall.products.find(p => p.isHot) || stall.products[0];
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 40);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      style={{
        position: 'relative',
        background: 'white',
        borderRadius: '14px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        cursor: stall.isOpen ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: isVisible ? (stall.isOpen ? 1 : 0.55) : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(16px)',
        animation: 'none'
      }}
      onMouseEnter={(e) => {
        if (stall.isOpen) {
          e.currentTarget.style.transform = 'translateY(-4px) scale(1.015)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(139,115,85,0.18)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = isVisible ? 'translateY(0)' : 'translateY(16px)';
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
      }}
    >
      {!stall.isOpen && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.25)',
          zIndex: 20,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: '30%',
          borderRadius: '14px',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)'
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            padding: '8px 20px',
            borderRadius: '24px',
            fontSize: '13px',
            color: '#888',
            fontWeight: 600,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>⚪</span>
            已收摊
          </div>
        </div>
      )}

      <div style={{
        width: '100%',
        height: '140px',
        background: '#f5f5f5',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {hotProduct && (
          <LazyImage
            src={hotProduct.image}
            alt={hotProduct.name}
          />
        )}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          padding: '4px 12px',
          borderRadius: '14px',
          fontSize: '11px',
          color: 'white',
          fontWeight: 600,
          background: `linear-gradient(135deg, ${CATEGORY_COLORS[stall.category]}, ${CATEGORY_COLORS[stall.category]}dd)`,
          boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
          zIndex: 10,
          letterSpacing: '0.5px'
        }}>
          {CATEGORY_LABELS[stall.category]}
        </div>
        {stall.isOpen && (
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            padding: '4px 10px',
            borderRadius: '14px',
            fontSize: '11px',
            color: 'white',
            background: 'rgba(124, 179, 66, 0.95)',
            fontWeight: 600,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backdropFilter: 'blur(4px)'
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'white',
              animation: 'pulse 2s infinite'
            }} />
            营业中
          </div>
        )}
        {hotProduct?.isHot && stall.isOpen && (
          <div style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            padding: '3px 8px',
            borderRadius: '10px',
            fontSize: '10px',
            color: 'white',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
            zIndex: 10,
            boxShadow: '0 2px 6px rgba(255,107,107,0.4)'
          }}>
            🔥 热销
          </div>
        )}
      </div>

      <div style={{ padding: '14px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '10px'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${stall.markerColor}, ${stall.markerColor}dd)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            flexShrink: 0,
            boxShadow: `0 2px 8px ${stall.markerColor}40`,
            border: '2px solid white'
          }}>
            {stall.ownerAvatar}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: 700,
              fontSize: '15px',
              color: '#333',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginBottom: '3px'
            }}>
              {stall.name}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#999'
            }}>
              摊主 · {stall.owner}
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          padding: '8px 10px',
          background: '#faf8f4',
          borderRadius: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {renderStars(stall.rating)}
            <span style={{
              color: '#8B7355',
              fontWeight: 700,
              fontSize: '13px',
              marginLeft: '4px'
            }}>
              {stall.rating.toFixed(1)}
            </span>
          </div>
          <div style={{
            fontSize: '12px',
            color: '#666',
            fontWeight: 500
          }}>
            🛍️ {stall.products.length}件
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '10px',
          borderTop: '1px solid #f0ebe3'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '13px',
            color: '#8B7355',
            fontWeight: 600
          }}>
            <span>📍</span>
            {stall.distance}m
          </div>
          <span style={{
            fontSize: '12px',
            color: stall.isOpen ? '#7CB342' : '#bbb',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'color 0.3s ease'
          }}>
            {stall.isOpen ? '查看详情' : '暂不营业'}
            {stall.isOpen && <span>→</span>}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function StallList() {
  const {
    filteredStalls,
    setSelectedStallId,
    activeCategories,
    toggleCategory,
    sortType,
    setSortType
  } = useStallService();

  const [listKey, setListKey] = useState(0);

  useEffect(() => {
    setListKey(prev => prev + 1);
  }, [sortType, activeCategories.size]);

  const categories: Category[] = ['handcraft', 'books', 'clothing', 'electronics', 'food'];
  const categoryIcons: Record<Category, string> = {
    handcraft: '🎨',
    books: '📚',
    clothing: '👕',
    electronics: '💻',
    food: '🍪'
  };

  const displayStalls = useMemo(() => filteredStalls, [filteredStalls]);
  const openCount = displayStalls.filter(s => s.isOpen).length;
  const closedCount = displayStalls.length - openCount;

  return (
    <div style={{
      padding: '16px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <div style={{
        padding: '16px',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        marginBottom: '16px'
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#8B7355',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span>🏷️</span>
          分类筛选
        </div>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          {categories.map(cat => {
            const isActive = activeCategories.has(cat);
            const count = filteredStalls.filter(s => s.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 500,
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: isActive
                    ? `linear-gradient(135deg, ${CATEGORY_COLORS[cat]}, ${CATEGORY_COLORS[cat]}dd)`
                    : '#f5f5f5',
                  color: isActive ? 'white' : '#666',
                  border: isActive
                    ? `2px solid ${CATEGORY_COLORS[cat]}`
                    : '2px solid transparent',
                  boxShadow: isActive
                    ? `0 4px 12px ${CATEGORY_COLORS[cat]}40`
                    : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <span>{categoryIcons[cat]}</span>
                {CATEGORY_LABELS[cat]}
                <span style={{
                  fontSize: '11px',
                  opacity: isActive ? 0.9 : 0.6,
                  background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.05)',
                  padding: '1px 6px',
                  borderRadius: '10px'
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '14px'
      }}>
        <div style={{
          fontSize: '15px',
          fontWeight: 700,
          color: '#333',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>🎪</span>
          全部摊位
          <span style={{
            fontSize: '13px',
            color: '#999',
            fontWeight: 500
          }}>
            ({openCount}营业中
            {closedCount > 0 && ` / ${closedCount}已收摊`})
          </span>
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '18px',
        flexWrap: 'wrap'
      }}>
        {SORT_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setSortType(opt.value)}
            style={{
              padding: '8px 16px',
              borderRadius: '18px',
              fontSize: '13px',
              fontWeight: 600,
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              background: sortType === opt.value
                ? 'linear-gradient(135deg, #8B7355, #A1887F)'
                : 'white',
              color: sortType === opt.value ? 'white' : '#666',
              boxShadow: sortType === opt.value
                ? '0 4px 12px rgba(139,115,85,0.3)'
                : '0 2px 8px rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <span>{opt.icon}</span>
            {opt.label}
          </button>
        ))}
      </div>

      <div
        key={listKey}
        className="stall-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '16px'
        }}
      >
        {displayStalls.map((stall, index) => (
          <StallCard
            key={stall.id}
            stall={stall}
            index={index}
            onClick={() => stall.isOpen && setSelectedStallId(stall.id)}
          />
        ))}
      </div>

      {displayStalls.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          color: '#999'
        }}>
          <div style={{
            fontSize: '56px',
            marginBottom: '16px'
          }}>
            🏚️
          </div>
          <div style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#666',
            marginBottom: '8px'
          }}>
            暂无符合条件的摊位
          </div>
          <div style={{
            fontSize: '14px',
            color: '#aaa'
          }}>
            试试选择其他分类吧～
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .stall-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
