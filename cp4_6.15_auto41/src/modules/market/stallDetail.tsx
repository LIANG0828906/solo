import { useState, useRef, useEffect, useCallback } from 'react';
import { useStallService } from '@/modules/map/stallService';
import { useFavorites } from '@/context/FavoritesContext';
import { CATEGORY_LABELS, Product } from '@/types';

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

function ProductCarouselImage({ product }: { product: Product }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      flexShrink: 0,
      background: '#f5f5f5',
      borderRadius: '12px',
      overflow: 'hidden'
    }}>
      {!loaded && (
        <div className="skeleton" style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '12px'
        }} />
      )}
      <img
        src={product.image}
        alt={product.name}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }}
      />
      {product.isHot && (
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          padding: '4px 12px',
          background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
          color: 'white',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 600,
          boxShadow: '0 2px 8px rgba(255,107,107,0.4)'
        }}>
          🔥 热销
        </div>
      )}
    </div>
  );
}

export default function StallDetail() {
  const { selectedStall, setSelectedStallId, toggleStallStatus } = useStallService();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);

  const isVisible = selectedStall !== null;
  const stall = selectedStall;

  useEffect(() => {
    if (stall) {
      setCurrentSlide(0);
      setShowChat(false);
    }
  }, [stall?.id]);

  const scrollToSlide = useCallback((index: number) => {
    if (!carouselRef.current || !stall) return;
    const slideWidth = carouselRef.current.clientWidth;
    carouselRef.current.scrollTo({
      left: slideWidth * index,
      behavior: 'smooth'
    });
    setCurrentSlide(index);
  }, [stall]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = touchStartX.current;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchCurrentX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!stall) return;
    const diff = touchStartX.current - touchCurrentX.current;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0 && currentSlide < stall.products.length - 1) {
        scrollToSlide(currentSlide + 1);
      } else if (diff < 0 && currentSlide > 0) {
        scrollToSlide(currentSlide - 1);
      }
    }
  };

  if (!stall) return null;

  return (
    <>
      <div
        onClick={() => setSelectedStallId(null)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 999,
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: isVisible ? 'auto' : 'none'
        }}
      />

      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '100%',
          maxWidth: '480px',
          height: '100vh',
          background: '#FFF8E7',
          zIndex: 1000,
          transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          overflowY: 'auto',
          overflowX: 'hidden',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{
          position: 'sticky',
          top: 0,
          background: 'rgba(255, 248, 231, 0.95)',
          backdropFilter: 'blur(10px)',
          zIndex: 10,
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(139,115,85,0.15)'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#8B7355',
            margin: 0
          }}>
            🛍️ 摊位详情
          </h2>
          <button
            onClick={() => setSelectedStallId(null)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(139,115,85,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(139,115,85,0.2)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(139,115,85,0.1)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ✕
          </button>
        </div>

        <div style={{
          padding: '20px',
          flex: 1
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px',
            marginBottom: '20px',
            padding: '16px',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: stall.markerColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              {stall.ownerAvatar}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '6px'
              }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#333',
                  margin: 0
                }}>
                  {stall.name}
                </h3>
                <span style={{
                  padding: '2px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  color: 'white',
                  background: stall.markerColor
                }}>
                  {CATEGORY_LABELS[stall.category]}
                </span>
              </div>
              <div style={{
                fontSize: '14px',
                color: '#888',
                marginBottom: '8px'
              }}>
                摊主：{stall.owner}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {renderStars(stall.rating)}
                  <span style={{ color: '#666', fontWeight: 600 }}>
                    {stall.rating.toFixed(1)}
                  </span>
                </div>
                <span style={{ color: '#8B7355', fontWeight: 500 }}>
                  📍 {stall.distance}m
                </span>
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '20px'
          }}>
            <button
              onClick={() => setShowChat(!showChat)}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 600,
                background: showChat ? '#8B7355' : '#7CB342',
                color: 'white',
                transition: 'all 0.25s ease',
                boxShadow: showChat ? '0 2px 8px rgba(139,115,85,0.3)' : '0 2px 8px rgba(124,179,66,0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              💬 在线沟通
            </button>
            <button
              onClick={() => toggleStallStatus(stall.id)}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 600,
                background: stall.isOpen ? '#fff' : '#f0f0f0',
                color: stall.isOpen ? '#7CB342' : '#999',
                border: stall.isOpen ? '2px solid #7CB342' : '2px solid #ddd',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {stall.isOpen ? '🟢 营业中' : '⚪ 已收摊'}
            </button>
          </div>

          {showChat && (
            <div style={{
              marginBottom: '20px',
              padding: '16px',
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              animation: 'fadeInUp 0.3s ease-out'
            }}>
              <div style={{
                fontSize: '14px',
                color: '#666',
                marginBottom: '12px',
                padding: '12px',
                background: '#f8f5f0',
                borderRadius: '12px'
              }}>
                👋 您好！欢迎来到{stall.name}，有什么可以帮您的吗？
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="输入消息..."
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '20px',
                    border: '1px solid #e0e0e0',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#7CB342';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e0e0e0';
                  }}
                />
                <button
                  style={{
                    padding: '10px 18px',
                    borderRadius: '20px',
                    background: '#7CB342',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 600,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  发送
                </button>
              </div>
            </div>
          )}

          <div style={{
            padding: '16px',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            marginBottom: '20px'
          }}>
            <h4 style={{
              fontSize: '15px',
              fontWeight: 600,
              color: '#8B7355',
              marginBottom: '10px'
            }}>
              📝 摊主简介
            </h4>
            <p style={{
              fontSize: '14px',
              color: '#666',
              lineHeight: 1.6,
              margin: 0
            }}>
              {stall.description}
            </p>
          </div>

          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px'
            }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: 700,
                color: '#333',
                margin: 0
              }}>
                🎁 商品列表 ({stall.products.length})
              </h4>
              <span style={{ fontSize: '12px', color: '#999' }}>
                左右滑动查看更多
              </span>
            </div>

            <div style={{
              position: 'relative',
              borderRadius: '16px',
              overflow: 'hidden',
              marginBottom: '16px'
            }}>
              <div
                ref={carouselRef}
                style={{
                  display: 'flex',
                  width: '100%',
                  height: '280px',
                  overflowX: 'auto',
                  scrollSnapType: 'x mandatory',
                  scrollbarWidth: 'none',
                  WebkitOverflowScrolling: 'touch'
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {stall.products.map((product) => (
                  <div
                    key={product.id}
                    style={{
                      minWidth: '100%',
                      scrollSnapAlign: 'start',
                      padding: '0 4px'
                    }}
                  >
                    <ProductCarouselImage product={product} />
                  </div>
                ))}
              </div>

              {stall.products.length > 1 && (
                <>
                  <button
                    onClick={() => currentSlide > 0 && scrollToSlide(currentSlide - 1)}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: currentSlide > 0 ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      color: '#8B7355',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      cursor: currentSlide > 0 ? 'pointer' : 'default',
                      transition: 'all 0.2s ease',
                      pointerEvents: currentSlide > 0 ? 'auto' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (currentSlide > 0) e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                    }}
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => currentSlide < stall.products.length - 1 && scrollToSlide(currentSlide + 1)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: currentSlide < stall.products.length - 1 ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      color: '#8B7355',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      cursor: currentSlide < stall.products.length - 1 ? 'pointer' : 'default',
                      transition: 'all 0.2s ease',
                      pointerEvents: currentSlide < stall.products.length - 1 ? 'auto' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (currentSlide < stall.products.length - 1) e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                    }}
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '20px'
            }}>
              {stall.products.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollToSlide(idx)}
                  style={{
                    width: currentSlide === idx ? '24px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    background: currentSlide === idx ? '#8B7355' : '#d4c4b0',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />
              ))}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px'
            }}>
              {stall.products.map((product, idx) => (
                <div
                  key={product.id}
                  onClick={() => scrollToSlide(idx)}
                  style={{
                    position: 'relative',
                    background: 'white',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    transition: 'all 0.25s ease',
                    border: currentSlide === idx ? '2px solid #8B7355' : '2px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                  }}
                >
                  <div style={{
                    width: '100%',
                    height: '100px',
                    background: '#f5f5f5',
                    overflow: 'hidden'
                  }}>
                    <img
                      src={product.image}
                      alt={product.name}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                  <div style={{ padding: '10px' }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#333',
                      marginBottom: '4px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {product.name}
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <span style={{
                        fontSize: '15px',
                        fontWeight: 700,
                        color: '#E74C3C'
                      }}>
                        ¥{product.price.toFixed(2)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(product.id);
                        }}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                          transition: 'all 0.2s ease',
                          background: isFavorite(product.id) ? 'rgba(255,107,107,0.1)' : 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        {isFavorite(product.id) ? '❤️' : '🤍'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
