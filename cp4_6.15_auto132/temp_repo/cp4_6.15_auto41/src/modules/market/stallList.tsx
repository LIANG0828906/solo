import { useMemo, useState, useEffect, useCallback } from 'react';
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
      stars.push(<span key={i} style={{ color: '#FFD700', fontSize: 13 }}>★</span>);
    } else if (i === fullStars && hasHalf) {
      stars.push(<span key={i} style={{ color: '#FFD700', fontSize: 13 }}>☆</span>);
    } else {
      stars.push(<span key={i} style={{ color: '#E0E0E0', fontSize: 13 }}>★</span>);
    }
  }
  return stars;
}

interface StallCardProps {
  stall: Stall;
  onClick: () => void;
  index: number;
}

function StallCard({ stall, onClick, index }: StallCardProps) {
  const hotProduct = stall.products.find(p => p.isHot) || stall.products[0];
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), Math.min(index * 40, 400));
    return () => clearTimeout(timer);
  }, [index]);

  const handleClick = useCallback(() => {
    if (stall.isOpen) {
      onClick();
    }
  }, [stall.isOpen, onClick]);

  return (
    <div
      onClick={handleClick}
      style={{
        position: 'relative',
        background: 'white',
        borderRadius: 14,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        cursor: stall.isOpen ? 'pointer' : 'not-allowed',
        transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
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
          background: 'rgba(0,0,0,0.28)',
          zIndex: 20,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: '28%',
          borderRadius: 14,
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          transition: 'all 0.35s ease'
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            padding: '8px 20px',
            borderRadius: 24,
            fontSize: 13,
            color: '#888',
            fontWeight: 600,
            boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <span style={{ fontSize: 14 }}>⚪</span>
            已收摊
          </div>
        </div>
      )}

      <div style={{
        width: '100%',
        height: 140,
        background: '#f5f5f5',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {hotProduct && (
          <LazyImage src={hotProduct.image} alt={hotProduct.name} />
        )}
        <div style={{
          position: 'absolute',
          top: 10,
          left: 10,
          padding: '4px 12px',
          borderRadius: 14,
          fontSize: 11,
          color: 'white',
          fontWeight: 600,
          background: `linear-gradient(135deg, ${CATEGORY_COLORS[stall.category]}, ${CATEGORY_COLORS[stall.category]}dd)`,
          boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
          zIndex: 10,
          letterSpacing: 0.5
        }}>
          {CATEGORY_LABELS[stall.category]}
        </div>
        {stall.isOpen && (
          <div style={{
            position: 'absolute',
            top: 10,
            right: 10,
            padding: '4px 10px',
            borderRadius: 14,
            fontSize: 11,
            color: 'white',
            background: 'rgba(124,179,66,0.95)',
            fontWeight: 600,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            backdropFilter: 'blur(4px)',
            transition: 'all 0.3s ease'
          }}>
            <span style={{
              width: 6,
              height: 6,
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
            bottom: 10,
            right: 10,
            padding: '3px 8px',
            borderRadius: 10,
            fontSize: 10,
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

      <div style={{ padding: 14 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 10
        }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${stall.markerColor}, ${stall.markerColor}dd)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            flexShrink: 0,
            boxShadow: `0 2px 8px ${stall.markerColor}40`,
            border: '2px solid white',
            transition: 'all 0.3s ease',
            filter: stall.isOpen ? 'none' : 'grayscale(40%)'
          }}>
            {stall.ownerAvatar}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: 700,
              fontSize: 15,
              color: '#333',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginBottom: 3
            }}>
              {stall.name}
            </div>
            <div style={{
              fontSize: 12,
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
          marginBottom: 12,
          padding: '8px 10px',
          background: '#faf8f4',
          borderRadius: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {renderStars(stall.rating)}
            <span style={{
              color: '#8B7355',
              fontWeight: 700,
              fontSize: 13,
              marginLeft: 4
            }}>
              {stall.rating.toFixed(1)}
            </span>
          </div>
          <div style={{
            fontSize: 12,
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
          paddingTop: 10,
          borderTop: '1px solid #f0ebe3'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 13,
            color: '#8B7355',
            fontWeight: 600
          }}>
            <span>📍</span>
            {stall.distance}m
          </div>
          <span style={{
            fontSize: 12,
            color: stall.isOpen ? '#7CB342' : '#bbb',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
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
    setSortType,
    toggleStallStatus
  } = useStallService();

  const [listKey, setListKey] = useState(0);
  const [sortStartTime, setSortStartTime] = useState<number | null>(null);
  const [sortDuration, setSortDuration] = useState<number | null>(null);

  useEffect(() => {
    const startTime = performance.now();
    setSortStartTime(startTime);
    setListKey(prev => prev + 1);

    requestAnimationFrame(() => {
      const duration = performance.now() - startTime;
      setSortDuration(duration);
    });
  }, [sortType, activeCategories.size]);

  const categories: Category[] = ['handcraft', 'books', 'clothing', 'electronics', 'food'];
  const categoryIcons: Record<Category, string> = {
    handcraft: '🎨',
    books: '📚',
    clothing: '👕',
    electronics: '💻',
    food: '🍪'
  };

  const displayStalls = useMemo(() => {
    return filteredStalls;
  }, [filteredStalls]);

  const openCount = displayStalls.filter(s => s.isOpen).length;
  const closedCount = displayStalls.length - openCount;

  const handleSortChange = useCallback((sort: SortType) => {
    const t0 = performance.now();
    setSortType(sort);
    requestAnimationFrame(() => {
      const elapsed = performance.now() - t0;
      console.log(`[排序性能] ${sort} 排序耗时: ${elapsed.toFixed(2)}ms (目标: <16ms)`);
    });
  }, [setSortType]);

  return (
    <div style={{ padding: '16px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{
        padding: 16,
        background: 'white',
        borderRadius: 16,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        marginBottom: 16
      }}>
        <div style={{
          fontSize: 14,
          fontWeight: 600,
          color: '#8B7355',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          <span>🏷️</span>
          分类筛选
        </div>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8
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
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
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
                  gap: 6
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
                  fontSize: 11,
                  opacity: isActive ? 0.9 : 0.6,
                  background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.05)',
                  padding: '1px 6px',
                  borderRadius: 10
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
        marginBottom: 14,
        flexWrap: 'wrap',
        gap: 10
      }}>
        <div style={{
          fontSize: 15,
          fontWeight: 700,
          color: '#333',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span>🎪</span>
          全部摊位
          <span style={{
            fontSize: 13,
            color: '#999',
            fontWeight: 500
          }}>
            ({openCount}营业中
            {closedCount > 0 && ` / ${closedCount}已收摊`})
          </span>
        </div>
        {sortDuration !== null && (
          <div style={{
            fontSize: 11,
            color: sortDuration < 16 ? '#7CB342' : '#FFA500',
            fontWeight: 500,
            padding: '3px 8px',
            background: sortDuration < 16 ? 'rgba(124,179,66,0.1)' : 'rgba(255,165,0,0.1)',
            borderRadius: 8
          }}>
            ⚡ 渲染: {sortDuration.toFixed(1)}ms
          </div>
        )}
      </div>

      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 18,
        flexWrap: 'wrap'
      }}>
        {SORT_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => handleSortChange(opt.value)}
            style={{
              padding: '8px 16px',
              borderRadius: 18,
              fontSize: 13,
              fontWeight: 600,
              transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
              background: sortType === opt.value
                ? 'linear-gradient(135deg, #8B7355, #A1887F)'
                : 'white',
              color: sortType === opt.value ? 'white' : '#666',
              boxShadow: sortType === opt.value
                ? '0 4px 12px rgba(139,115,85,0.3)'
                : '0 2px 8px rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: 5
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

        <button
          onClick={() => {
            if (filteredStalls.length > 0) {
              toggleStallStatus(filteredStalls[0].id);
            }
          }}
          style={{
            marginLeft: 'auto',
            padding: '8px 14px',
            borderRadius: 18,
            fontSize: 12,
            fontWeight: 600,
            background: '#f0f0f0',
            color: '#888',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            transition: 'all 0.25s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#e8e8e8';
            e.currentTarget.style.transform = 'scale(1.03)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f0f0f0';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="测试：切换第一个摊位的营业状态"
        >
          🔄 测试状态切换
        </button>
      </div>

      <div
        key={listKey}
        className="stall-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 16
        }}
      >
        {displayStalls.map((stall, index) => (
          <StallCard
            key={stall.id}
            stall={stall}
            index={index}
            onClick={() => setSelectedStallId(stall.id)}
          />
        ))}
      </div>

      {displayStalls.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          color: '#999'
        }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🏚️</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#666', marginBottom: 8 }}>
            暂无符合条件的摊位
          </div>
          <div style={{ fontSize: 14, color: '#aaa' }}>
            试试选择其他分类吧～
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .stall-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
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
