import { useState, useRef, useEffect, useCallback } from 'react';
import { useStallService } from '@/modules/map/stallService';
import { useFavorites } from '@/context/FavoritesContext';
import LazyImage from '@/components/LazyImage';
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

function CarouselItem({ product }: { product: Product }) {
  return (
    <div
      style={{
        minWidth: '100%',
        scrollSnapAlign: 'start',
        padding: '0 4px',
        height: '100%'
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          borderRadius: '16px',
          overflow: 'hidden',
          background: '#f5f5f5'
        }}
      >
        <LazyImage
          src={product.image}
          alt={product.name}
          style={{ borderRadius: '16px' }}
        />
        {product.isHot && (
          <div style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            padding: '6px 14px',
            background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
            color: 'white',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: '0 2px 8px rgba(255,107,107,0.4)',
            zIndex: 2
          }}>
            🔥 热销爆款
          </div>
        )}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '20px 16px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
          color: 'white',
          zIndex: 2
        }}>
          <div style={{
            fontSize: '18px',
            fontWeight: 700,
            marginBottom: '6px'
          }}>
            {product.name}
          </div>
          <div style={{
            fontSize: '22px',
            fontWeight: 700,
            color: '#FFD700'
          }}>
            ¥{product.price.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StallDetail() {
  const { selectedStall, setSelectedStallId, toggleStallStatus } = useStallService();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const carouselRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);
  const isDragging = useRef(false);

  const isVisible = selectedStall !== null;
  const stall = selectedStall;

  useEffect(() => {
    if (stall) {
      setCurrentSlide(0);
      setShowChat(false);
      setChatMessage('');
    }
  }, [stall?.id]);

  const scrollToSlide = useCallback((index: number) => {
    if (!carouselRef.current || !stall) return;
    if (index < 0 || index >= stall.products.length) return;

    const startTime = performance.now();
    const startLeft = carouselRef.current.scrollLeft;
    const targetLeft = carouselRef.current.clientWidth * index;
    const distance = targetLeft - startLeft;
    const duration = 180;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      if (carouselRef.current) {
        carouselRef.current.scrollLeft = startLeft + distance * easeProgress;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
    setCurrentSlide(index);
  }, [stall]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = touchStartX.current;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    touchCurrentX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!stall || !isDragging.current) return;
    isDragging.current = false;

    const diff = touchStartX.current - touchCurrentX.current;
    const threshold = 40;

    if (Math.abs(diff) > threshold) {
      if (diff > 0 && currentSlide < stall.products.length - 1) {
        scrollToSlide(currentSlide + 1);
      } else if (diff < 0 && currentSlide > 0) {
        scrollToSlide(currentSlide - 1);
      }
    }
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    setChatMessage('');
  };

  if (!stall) return null;

  return (
    <>
      <div
        onClick={() => setSelectedStallId(null)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
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
          maxWidth: '460px',
          height: '100vh',
          background: '#FFF8E7',
          zIndex: 1000,
          transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          overflowY: 'auto',
          overflowX: 'hidden',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{
          position: 'sticky',
          top: 0,
          background: 'rgba(255, 248, 231, 0.97)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          zIndex: 10,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(139,115,85,0.12)'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#8B7355',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>🛍️</span>
            摊位详情
          </h2>
          <button
            onClick={() => setSelectedStallId(null)}
            aria-label="关闭"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'rgba(139,115,85,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              color: '#8B7355',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(139,115,85,0.18)';
              e.currentTarget.style.transform = 'scale(1.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(139,115,85,0.08)';
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
            padding: '18px',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
          }}>
            <div style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${stall.markerColor}, ${stall.markerColor}dd)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '34px',
              flexShrink: 0,
              boxShadow: `0 4px 16px ${stall.markerColor}40`,
              border: '3px solid white'
            }}>
              {stall.ownerAvatar}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '8px',
                flexWrap: 'wrap'
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
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'white',
                  background: stall.markerColor,
                  letterSpacing: '0.5px'
                }}>
                  {CATEGORY_LABELS[stall.category]}
                </span>
              </div>
              <div style={{
                fontSize: '14px',
                color: '#888',
                marginBottom: '10px'
              }}>
                👤 摊主：{stall.owner}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                fontSize: '14px',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {renderStars(stall.rating)}
                  <span style={{ color: '#666', fontWeight: 600, marginLeft: '2px' }}>
                    {stall.rating.toFixed(1)}
                  </span>
                </div>
                <span style={{
                  color: '#8B7355',
                  fontWeight: 500,
                  padding: '2px 8px',
                  background: 'rgba(139,115,85,0.08)',
                  borderRadius: '8px'
                }}>
                  📍 {stall.distance}m
                </span>
                <span style={{
                  color: '#7CB342',
                  fontWeight: 500
                }}>
                  🛍️ {stall.products.length}件
                </span>
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <button
              onClick={() => setShowChat(!showChat)}
              style={{
                flex: 1,
                padding: '13px 16px',
                borderRadius: '14px',
                fontSize: '15px',
                fontWeight: 600,
                background: showChat ? '#8B7355' : 'linear-gradient(135deg, #7CB342, #8BC34A)',
                color: 'white',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: showChat
                  ? '0 4px 12px rgba(139,115,85,0.35)'
                  : '0 4px 12px rgba(124,179,66,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
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
                padding: '13px 16px',
                borderRadius: '14px',
                fontSize: '15px',
                fontWeight: 600,
                background: stall.isOpen ? 'white' : '#f5f5f5',
                color: stall.isOpen ? '#7CB342' : '#aaa',
                border: `2px solid ${stall.isOpen ? '#7CB342' : '#e0e0e0'}`,
                transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
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
              padding: '18px',
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              animation: 'fadeInUp 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
              <div style={{
                fontSize: '13px',
                color: '#888',
                marginBottom: '12px',
                fontWeight: 500
              }}>
                💬 实时消息
              </div>
              <div style={{
                fontSize: '14px',
                color: '#555',
                marginBottom: '14px',
                padding: '12px 14px',
                background: '#f8f5f0',
                borderRadius: '0 12px 12px 12px',
                lineHeight: 1.5,
                maxWidth: '85%'
              }}>
                👋 您好呀！欢迎光临<span style={{ color: '#8B7355', fontWeight: 600 }}>{stall.name}</span>～
                有什么想了解的随时问我哦！
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="输入消息，和摊主聊聊..."
                  style={{
                    flex: 1,
                    padding: '11px 16px',
                    borderRadius: '22px',
                    border: '2px solid #eee',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    background: '#fafafa'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#7CB342';
                    e.target.style.background = 'white';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#eee';
                    e.target.style.background = '#fafafa';
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  style={{
                    padding: '11px 20px',
                    borderRadius: '22px',
                    background: chatMessage.trim()
                      ? 'linear-gradient(135deg, #7CB342, #8BC34A)'
                      : '#ccc',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                    cursor: chatMessage.trim() ? 'pointer' : 'not-allowed'
                  }}
                  onMouseEnter={(e) => {
                    if (chatMessage.trim()) e.currentTarget.style.transform = 'scale(1.05)';
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
            padding: '18px',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            marginBottom: '20px'
          }}>
            <h4 style={{
              fontSize: '15px',
              fontWeight: 600,
              color: '#8B7355',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>📝</span>
              摊主简介
            </h4>
            <p style={{
              fontSize: '14px',
              color: '#666',
              lineHeight: 1.7,
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
              marginBottom: '16px'
            }}>
              <h4 style={{
                fontSize: '17px',
                fontWeight: 700,
                color: '#333',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>🎁</span>
                精选商品
                <span style={{
                  fontSize: '13px',
                  color: '#999',
                  fontWeight: 500
                }}>
                  ({stall.products.length}件)
                </span>
              </h4>
              <span style={{
                fontSize: '12px',
                color: '#bbb',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span>👆</span>
                左右滑动
              </span>
            </div>

            <div style={{
              position: 'relative',
              borderRadius: '16px',
              marginBottom: '16px'
            }}>
              <div
                ref={carouselRef}
                style={{
                  display: 'flex',
                  width: '100%',
                  height: '280px',
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  scrollSnapType: 'x mandatory',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch',
                  borderRadius: '16px'
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {stall.products.map((product) => (
                  <CarouselItem key={product.id} product={product} />
                ))}
              </div>

              <style>{`
                div::-webkit-scrollbar {
                  display: none;
                }
              `}</style>

              {stall.products.length > 1 && (
                <>
                  <button
                    onClick={() => currentSlide > 0 && scrollToSlide(currentSlide - 1)}
                    aria-label="上一张"
                    style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: currentSlide > 0
                        ? 'rgba(255,255,255,0.95)'
                        : 'rgba(255,255,255,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      color: '#8B7355',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
                      cursor: currentSlide > 0 ? 'pointer' : 'default',
                      transition: 'all 0.2s ease',
                      border: 'none',
                      pointerEvents: currentSlide > 0 ? 'auto' : 'none',
                      zIndex: 3
                    }}
                    onMouseEnter={(e) => {
                      if (currentSlide > 0) {
                        e.currentTarget.style.transform = 'translateY(-50%) scale(1.12)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                    }}
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => currentSlide < stall.products.length - 1 && scrollToSlide(currentSlide + 1)}
                    aria-label="下一张"
                    style={{
                      position: 'absolute',
                      right: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: currentSlide < stall.products.length - 1
                        ? 'rgba(255,255,255,0.95)'
                        : 'rgba(255,255,255,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      color: '#8B7355',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
                      cursor: currentSlide < stall.products.length - 1 ? 'pointer' : 'default',
                      transition: 'all 0.2s ease',
                      border: 'none',
                      pointerEvents: currentSlide < stall.products.length - 1 ? 'auto' : 'none',
                      zIndex: 3
                    }}
                    onMouseEnter={(e) => {
                      if (currentSlide < stall.products.length - 1) {
                        e.currentTarget.style.transform = 'translateY(-50%) scale(1.12)';
                      }
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
              marginBottom: '22px'
            }}>
              {stall.products.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollToSlide(idx)}
                  aria-label={`第${idx + 1}张图片`}
                  style={{
                    width: currentSlide === idx ? '28px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    background: currentSlide === idx ? '#8B7355' : '#d4c4b0',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    padding: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                />
              ))}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '14px'
            }}>
              {stall.products.map((product, idx) => {
                const isFav = isFavorite(product.id);
                const isActive = currentSlide === idx;
                return (
                  <div
                    key={product.id}
                    onClick={() => scrollToSlide(idx)}
                    style={{
                      position: 'relative',
                      background: 'white',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      boxShadow: isActive
                        ? '0 4px 18px rgba(139,115,85,0.25)'
                        : '0 2px 10px rgba(0,0,0,0.06)',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      border: isActive ? '2px solid #8B7355' : '2px solid transparent',
                      transform: isActive ? 'scale(1.02)' : 'scale(1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.03)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = isActive ? 'scale(1.02)' : 'scale(1)';
                    }}
                  >
                    <div style={{
                      width: '100%',
                      height: '100px',
                      background: '#f5f5f5',
                      overflow: 'hidden'
                    }}>
                      <LazyImage
                        src={product.image}
                        alt={product.name}
                      />
                    </div>
                    <div style={{ padding: '12px' }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#333',
                        marginBottom: '6px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {product.name}
                        {product.isHot && (
                          <span style={{
                            marginLeft: '6px',
                            fontSize: '10px',
                            color: '#FF6B6B',
                            fontWeight: 700
                          }}>
                            HOT
                          </span>
                        )}
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <span style={{
                          fontSize: '16px',
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
                          aria-label={isFav ? '取消收藏' : '收藏'}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                            background: isFav
                              ? 'rgba(255,107,107,0.12)'
                              : 'rgba(0,0,0,0.04)',
                            border: 'none',
                            padding: 0
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          {isFav ? '❤️' : '🤍'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{
          position: 'sticky',
          bottom: 0,
          padding: '14px 20px',
          background: 'rgba(255, 248, 231, 0.97)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(139,115,85,0.1)',
          zIndex: 10
        }}>
          <button
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #8B7355, #A1887F)',
              color: 'white',
              fontSize: '16px',
              fontWeight: 700,
              transition: 'all 0.25s ease',
              boxShadow: '0 4px 16px rgba(139,115,85,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.015)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            🧭 导航到摊位
          </button>
        </div>
      </div>
    </>
  );
}
