import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useStallService } from '@/modules/map/stallService';
import { useFavorites } from '@/context/FavoritesContext';
import LazyImage from '@/components/LazyImage';
import { CATEGORY_LABELS } from '@/types';

const CAROUSEL_DURATION = 180; // ms - 目标<200ms

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
      stars.push(<span key={i} style={{ color: '#E0E0E0' }}>★</span>);
    }
  }
  return stars;
}

interface SwitchStats {
  lastDuration: number | null;
  frameCount: number;
}

export default function StallDetail() {
  const { selectedStall, setSelectedStallId, toggleStallStatus } = useStallService();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [switchStats, setSwitchStats] = useState<SwitchStats>({ lastDuration: null, frameCount: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const frameCountRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  const isFav = selectedStall ? isFavorite(selectedStall.id) : false;
  const favCount = favorites.length;

  useEffect(() => {
    setCurrentSlide(0);
  }, [selectedStall?.id]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const scrollToSlide = useCallback((index: number) => {
    if (!carouselRef.current || !selectedStall) return;
    if (index < 0 || index >= selectedStall.products.length) return;
    if (isAnimating) return;

    setIsAnimating(true);
    frameCountRef.current = 0;

    const startTime = performance.now();
    const startLeft = carouselRef.current.scrollLeft;
    const targetLeft = carouselRef.current.clientWidth * index;
    const distance = targetLeft - startLeft;
    const duration = CAROUSEL_DURATION;

    const animate = (currentTime: number) => {
      frameCountRef.current += 1;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      carouselRef.current.scrollLeft = startLeft + distance * easeProgress;

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        const actualDuration = performance.now() - startTime;
        setSwitchStats({
          lastDuration: actualDuration,
          frameCount: frameCountRef.current
        });
        setCurrentSlide(index);
        setIsAnimating(false);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [selectedStall, isAnimating]);

  const goToPrev = useCallback(() => {
    if (!selectedStall) return;
    const newIndex = (currentSlide - 1 + selectedStall.products.length) % selectedStall.products.length;
    scrollToSlide(newIndex);
  }, [currentSlide, selectedStall, scrollToSlide]);

  const goToNext = useCallback(() => {
    if (!selectedStall) return;
    const newIndex = (currentSlide + 1) % selectedStall.products.length;
    scrollToSlide(newIndex);
  }, [currentSlide, selectedStall, scrollToSlide]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext();
      else goToPrev();
    }
  };

  const handleToggleFavorite = useCallback(() => {
    if (selectedStall) {
      const t0 = performance.now();
      toggleFavorite(selectedStall.id);
      console.log(`[收藏性能] 切换收藏耗时: ${(performance.now() - t0).toFixed(2)}ms`);
    }
  }, [selectedStall, toggleFavorite]);

  const handleToggleStatus = useCallback(() => {
    if (selectedStall) {
      const t0 = performance.now();
      toggleStallStatus(selectedStall.id);
      const elapsed = performance.now() - t0;
      console.log(`[状态切换性能] ${selectedStall.name} 状态切换耗时: ${elapsed.toFixed(2)}ms`);
    }
  }, [selectedStall, toggleStallStatus]);

  const detailProducts = selectedStall?.products || [];

  if (!selectedStall) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#aaa',
        padding: 40,
        textAlign: 'center',
        background: 'linear-gradient(180deg, #fdfbf7, #f5f0e8)'
      }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>👆</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#8B7355', marginBottom: 6 }}>
          点击左侧摊位卡片
        </div>
        <div style={{ fontSize: 14, color: '#bbb' }}>
          查看摊位详情和商品信息
        </div>
        <div style={{
          marginTop: 24,
          padding: '12px 20px',
          background: 'white',
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          fontSize: 13,
          color: '#999'
        }}>
          当前已收藏 <span style={{ color: '#E91E63', fontWeight: 700 }}>{favCount}</span> 个摊位
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'white',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative',
      transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
      filter: selectedStall.isOpen ? 'none' : 'grayscale(15%)',
      opacity: selectedStall.isOpen ? 1 : 0.92
    }}>
      {!selectedStall.isOpen && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          zIndex: 100,
          padding: '12px 20px',
          background: 'linear-gradient(135deg, rgba(158,158,158,0.95), rgba(176,176,176,0.95))',
          color: 'white',
          textAlign: 'center',
          fontWeight: 600,
          fontSize: 14,
          backdropFilter: 'blur(8px)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8
        }}>
          <span style={{ fontSize: 18 }}>⚪</span>
          该摊位已收摊，商品暂不营业
        </div>
      )}

      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #f0ebe3',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        background: selectedStall.isOpen
          ? 'linear-gradient(135deg, #fdfaf5, #f9f5ed)'
          : 'linear-gradient(135deg, #f5f5f5, #f0f0f0)',
        transition: 'background 0.3s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setSelectedStallId(null)}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: 'none',
              background: 'white',
              cursor: 'pointer',
              fontSize: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f5f0e8';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ✕
          </button>
          <div>
            <div style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#333',
              marginBottom: 2
            }}>
              {selectedStall.name}
            </div>
            <div style={{
              fontSize: 12,
              color: '#999',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              {CATEGORY_LABELS[selectedStall.category]}
              <span>·</span>
              {selectedStall.products.length}件商品
            </div>
          </div>
        </div>
        <button
          onClick={handleToggleFavorite}
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            fontSize: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isFav
              ? 'linear-gradient(135deg, #E91E63, #F06292)'
              : 'white',
            boxShadow: isFav
              ? '0 4px 14px rgba(233,30,99,0.35)'
              : '0 2px 8px rgba(0,0,0,0.08)',
            transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
            transform: isFav ? 'scale(1.08)' : 'scale(1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = isFav ? 'scale(1.15)' : 'scale(1.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = isFav ? 'scale(1.08)' : 'scale(1)';
          }}
          title={isFav ? '取消收藏' : '加入收藏'}
        >
          {isFav ? '❤️' : '🤍'}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingTop: selectedStall.isOpen ? 0 : 48 }}>
        <div style={{
          position: 'relative',
          width: '100%',
          background: '#f5f5f5'
        }}>
          <div
            ref={carouselRef}
            style={{
              display: 'flex',
              overflowX: 'scroll',
              scrollSnapType: 'x mandatory',
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch',
              scrollBehavior: 'auto'
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {detailProducts.map((product) => (
              <div
                key={product.id}
                style={{
                  flex: '0 0 100%',
                  height: 280,
                  scrollSnapAlign: 'start',
                  position: 'relative'
                }}
              >
                <LazyImage src={product.image} alt={product.name} />
                {product.isHot && (
                  <div style={{
                    position: 'absolute',
                    top: 16,
                    left: 16,
                    padding: '6px 14px',
                    borderRadius: 20,
                    fontSize: 12,
                    color: 'white',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
                    boxShadow: '0 4px 12px rgba(255,107,107,0.4)'
                  }}>
                    🔥 热销商品
                  </div>
                )}
              </div>
            ))}
          </div>

          {detailProducts.length > 1 && (
            <>
              <button
                onClick={goToPrev}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: 12,
                  transform: 'translateY(-50%)',
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.92)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#666',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(6px)',
                  zIndex: 10
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.92)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                }}
              >
                ‹
              </button>
              <button
                onClick={goToNext}
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: 12,
                  transform: 'translateY(-50%)',
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.92)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#666',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(6px)',
                  zIndex: 10
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.92)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                }}
              >
                ›
              </button>

              <div style={{
                position: 'absolute',
                bottom: 14,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: 8,
                zIndex: 10
              }}>
                {detailProducts.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => scrollToSlide(i)}
                    style={{
                      width: currentSlide === i ? 24 : 8,
                      height: 8,
                      borderRadius: 4,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                      background: currentSlide === i
                        ? 'white'
                        : 'rgba(255,255,255,0.5)',
                      boxShadow: currentSlide === i
                        ? '0 2px 6px rgba(0,0,0,0.2)'
                        : 'none'
                    }}
                  />
                ))}
              </div>
            </>
          )}

          {switchStats.lastDuration !== null && (
            <div style={{
              position: 'absolute',
              top: 16,
              right: 16,
              padding: '4px 10px',
              borderRadius: 10,
              fontSize: 11,
              fontWeight: 600,
              color: switchStats.lastDuration < 200 ? '#7CB342' : '#FF9800',
              background: switchStats.lastDuration < 200
                ? 'rgba(124,179,66,0.92)'
                : 'rgba(255,152,0,0.92)',
              backdropFilter: 'blur(6px)',
              zIndex: 10,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}>
              ⚡ {switchStats.lastDuration.toFixed(0)}ms / {switchStats.frameCount}帧
            </div>
          )}
        </div>

        <div style={{ padding: 20 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 16
          }}>
            <div style={{ flex: 1 }}>
              <h2 style={{
                fontSize: 22,
                fontWeight: 700,
                color: '#333',
                margin: '0 0 8px 0',
                lineHeight: 1.3
              }}>
                {detailProducts[currentSlide]?.name}
              </h2>
              <div style={{
                fontSize: 13,
                color: '#999',
                lineHeight: 1.6
              }}>
                {detailProducts[currentSlide]?.description}
              </div>
            </div>
            <div style={{
              textAlign: 'right',
              marginLeft: 16,
              flexShrink: 0
            }}>
              <div style={{
                fontSize: 28,
                fontWeight: 800,
                color: '#E65100',
                marginBottom: 2
              }}>
                ¥{detailProducts[currentSlide]?.price}
              </div>
              <div style={{
                fontSize: 12,
                color: '#bbb'
              }}>
                已售 {detailProducts[currentSlide]?.sales} 件
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 16px',
            background: '#fdfaf5',
            borderRadius: 14,
            marginBottom: 20
          }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${selectedStall.markerColor}, ${selectedStall.markerColor}dd)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              flexShrink: 0,
              boxShadow: `0 4px 12px ${selectedStall.markerColor}40`,
              border: '3px solid white',
              transition: 'filter 0.3s ease',
              filter: selectedStall.isOpen ? 'none' : 'grayscale(40%)'
            }}>
              {selectedStall.ownerAvatar}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 15,
                fontWeight: 600,
                color: '#333',
                marginBottom: 4
              }}>
                {selectedStall.owner}
                <span style={{
                  fontSize: 11,
                  color: '#999',
                  fontWeight: 500,
                  marginLeft: 6
                }}>
                  · 摊主
                </span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13
              }}>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  {renderStars(selectedStall.rating)}
                  <span style={{ color: '#8B7355', fontWeight: 600, marginLeft: 4 }}>
                    {selectedStall.rating.toFixed(1)}
                  </span>
                </span>
                <span style={{ color: '#ddd' }}>|</span>
                <span style={{ color: '#888' }}>📍 {selectedStall.distance}m</span>
              </div>
            </div>
            <button
              onClick={handleToggleStatus}
              style={{
                padding: '8px 14px',
                borderRadius: 18,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                transition: 'all 0.3s ease',
                background: selectedStall.isOpen
                  ? 'linear-gradient(135deg, #7CB342, #9CCC65)'
                  : 'linear-gradient(135deg, #9E9E9E, #BDBDBD)',
                color: 'white',
                boxShadow: selectedStall.isOpen
                  ? '0 4px 10px rgba(124,179,66,0.35)'
                  : '0 2px 6px rgba(0,0,0,0.15)',
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
              {selectedStall.isOpen ? '🟢 营业中' : '⚪ 已收摊'}
            </button>
          </div>

          <div style={{
            padding: '16px',
            background: '#faf8f4',
            borderRadius: 14,
            marginBottom: 20
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
              <span>📝</span>
              摊位介绍
            </div>
            <p style={{
              fontSize: 13,
              color: '#666',
              lineHeight: 1.8,
              margin: 0
            }}>
              {selectedStall.description}
            </p>
          </div>

          <div style={{
            padding: '16px',
            background: '#f5f9ff',
            borderRadius: 14,
            marginBottom: 20
          }}>
            <div style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#1976D2',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <span>🎯</span>
              性能监控
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10
            }}>
              <div style={{
                background: 'white',
                padding: '10px 12px',
                borderRadius: 10,
                fontSize: 12
              }}>
                <div style={{ color: '#999', marginBottom: 4 }}>轮播切换</div>
                <div style={{
                  color: switchStats.lastDuration !== null && switchStats.lastDuration < 200
                    ? '#7CB342'
                    : '#FF9800',
                  fontWeight: 700,
                  fontSize: 16
                }}>
                  {switchStats.lastDuration !== null ? `${switchStats.lastDuration.toFixed(0)}ms` : '--'}
                </div>
              </div>
              <div style={{
                background: 'white',
                padding: '10px 12px',
                borderRadius: 10,
                fontSize: 12
              }}>
                <div style={{ color: '#999', marginBottom: 4 }}>收藏商品数</div>
                <div style={{
                  color: '#E91E63',
                  fontWeight: 700,
                  fontSize: 16
                }}>
                  {favCount} 件
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        padding: '14px 20px',
        borderTop: '1px solid #f0ebe3',
        display: 'flex',
        gap: 10,
        background: 'white',
        flexShrink: 0
      }}>
        <button
          onClick={handleToggleFavorite}
          style={{
            flex: 1,
            padding: '14px 20px',
            borderRadius: 14,
            border: isFav ? '2px solid #E91E63' : '2px solid #E0E0E0',
            background: isFav ? '#fff0f5' : 'white',
            cursor: 'pointer',
            fontSize: 15,
            fontWeight: 600,
            color: isFav ? '#E91E63' : '#666',
            transition: 'all 0.25s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {isFav ? '❤️ 已收藏' : '🤍 收藏摊位'}
        </button>
        <button
          style={{
            flex: 2,
            padding: '14px 20px',
            borderRadius: 14,
            border: 'none',
            background: selectedStall.isOpen
              ? 'linear-gradient(135deg, #8B7355, #A1887F)'
              : 'linear-gradient(135deg, #BDBDBD, #E0E0E0)',
            color: 'white',
            cursor: selectedStall.isOpen ? 'pointer' : 'not-allowed',
            fontSize: 15,
            fontWeight: 600,
            transition: 'all 0.25s ease',
            boxShadow: selectedStall.isOpen
              ? '0 4px 14px rgba(139,115,85,0.35)'
              : 'none'
          }}
          onMouseEnter={(e) => {
            if (selectedStall.isOpen) {
              e.currentTarget.style.transform = 'scale(1.02)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          disabled={!selectedStall.isOpen}
        >
          {selectedStall.isOpen ? '💬 在线沟通' : '🔒 已收摊'}
        </button>
      </div>

      <style>{`
        div[style*="overflowX: scroll"]::-webkit-scrollbar {
          display: none;
        }
        div[style*="overflowY: auto"]::-webkit-scrollbar {
          width: 4px;
        }
        div[style*="overflowY: auto"]::-webkit-scrollbar-thumb {
          background: #ddd;
          border-radius: 2px;
        }

        @media (max-width: 768px) {
          /* 移动端详情面板优化 */
        }
      `}</style>
    </div>
  );
}
