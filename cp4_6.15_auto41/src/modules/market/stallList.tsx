import { useMemo, useState, useEffect } from 'react';
import { useStallService } from '@/modules/map/stallService';
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
      stars.push(<span key={i} style={{ color: '#FFD700' }}>★</span>);
    } else if (i === fullStars && hasHalf) {
      stars.push(<span key={i} style={{ color: '#FFD700' }}>☆</span>);
    } else {
      stars.push(<span key={i} style={{ color: '#DDD' }}>★</span>);
    }
  }
  return stars;
}

function StallCard({ stall, onClick }: { stall: Stall; onClick: () => void }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const hotProduct = stall.products.find(p => p.isHot) || stall.products[0];

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: stall.isOpen ? 1 : 0.6,
        animation: 'fadeInUp 0.4s ease-out forwards'
      }}
      onMouseEnter={(e) => {
        if (stall.isOpen) {
          e.currentTarget.style.transform = 'scale(1.02)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
      }}
    >
      {!stall.isOpen && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.3)',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '12px'
        }}>
          <span style={{
            background: 'rgba(255,255,255,0.95)',
            padding: '6px 16px',
            borderRadius: '20px',
            fontSize: '13px',
            color: '#666',
            fontWeight: 500
          }}>
            已收摊
          </span>
        </div>
      )}

      <div style={{
        width: '100%',
        height: '140px',
        background: '#f5f5f5',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {hotProduct && !imageLoaded && (
          <div className="skeleton" style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }} />
        )}
        {hotProduct && (
          <img
            src={hotProduct.image}
            alt={hotProduct.name}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: imageLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease'
            }}
          />
        )}
        <div style={{
          position: 'absolute',
          top: '8px',
          left: '8px',
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '11px',
          color: 'white',
          fontWeight: 500,
          background: CATEGORY_COLORS[stall.category],
          boxShadow: '0 1px 4px rgba(0,0,0,0.15)'
        }}>
          {CATEGORY_LABELS[stall.category]}
        </div>
        {stall.isOpen && (
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            color: 'white',
            background: 'rgba(124, 179, 66, 0.95)',
            fontWeight: 500
          }}>
            营业中
          </div>
        )}
      </div>

      <div style={{ padding: '12px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '8px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: stall.markerColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            flexShrink: 0,
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
          }}>
            {stall.ownerAvatar}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: 600,
              fontSize: '15px',
              color: '#333',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginBottom: '2px'
            }}>
              {stall.name}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#888'
            }}>
              {stall.owner}
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px'
        }}>
          <div style={{ fontSize: '13px' }}>
            {renderStars(stall.rating)}
            <span style={{ color: '#999', marginLeft: '4px', fontSize: '12px' }}>
              {stall.rating.toFixed(1)}
            </span>
          </div>
          <div style={{
            fontSize: '12px',
            color: '#8B7355',
            fontWeight: 500
          }}>
            🛍️ {stall.products.length}件商品
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '10px',
          borderTop: '1px solid #f0f0f0'
        }}>
          <span style={{
            fontSize: '13px',
            color: '#666'
          }}>
            📍 {stall.distance}m
          </span>
          <span style={{
            fontSize: '12px',
            color: '#7CB342',
            fontWeight: 500
          }}>
            查看详情 →
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

  const [renderKey, setRenderKey] = useState(0);

  useEffect(() => {
    setRenderKey(prev => prev + 1);
  }, [sortType, activeCategories.size]);

  const categories: Category[] = ['handcraft', 'books', 'clothing', 'electronics', 'food'];

  const displayStalls = useMemo(() => filteredStalls, [filteredStalls]);

  return (
    <div style={{
      padding: '16px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: '16px',
        padding: '12px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        <span style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#8B7355',
          alignSelf: 'center',
          marginRight: '4px'
        }}>
          分类筛选：
        </span>
        {categories.map(cat => {
          const isActive = activeCategories.has(cat);
          return (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'all 0.25s ease',
                background: isActive ? CATEGORY_COLORS[cat] : '#f5f5f5',
                color: isActive ? 'white' : '#666',
                border: isActive ? `2px solid ${CATEGORY_COLORS[cat]}` : '2px solid transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          );
        })}
      </div>

      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '16px'
      }}>
        <span style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#8B7355',
          alignSelf: 'center',
          marginRight: '4px'
        }}>
          排序：
        </span>
        {SORT_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setSortType(opt.value)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'all 0.25s ease',
              background: sortType === opt.value ? '#8B7355' : 'white',
              color: sortType === opt.value ? 'white' : '#666',
              boxShadow: sortType === opt.value ? '0 2px 8px rgba(139,115,85,0.3)' : '0 2px 8px rgba(0,0,0,0.08)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {opt.icon} {opt.label}
          </button>
        ))}
      </div>

      <div
        key={renderKey}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px'
        }}
      >
        {displayStalls.map((stall, index) => (
          <div
            key={stall.id}
            style={{
              animationDelay: `${Math.min(index * 50, 400)}ms`
            }}
          >
            <StallCard
              stall={stall}
              onClick={() => setSelectedStallId(stall.id)}
            />
          </div>
        ))}
      </div>

      {displayStalls.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#999'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏚️</div>
          <div style={{ fontSize: '16px' }}>暂无符合条件的摊位</div>
          <div style={{ fontSize: '14px', marginTop: '8px' }}>请尝试选择其他分类</div>
        </div>
      )}
    </div>
  );
}
