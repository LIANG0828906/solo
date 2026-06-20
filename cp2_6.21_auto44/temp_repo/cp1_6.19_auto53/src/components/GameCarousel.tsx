import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { FiChevronLeft, FiChevronRight, FiStar, FiUsers, FiClock } from 'react-icons/fi';
import type { Game, User } from '@/types';
import { mockDataService } from '@/services/mockData';

interface GameCarouselProps {
  currentUser: User;
  onReservationCreated?: () => void;
  compact?: boolean;
}

export const GameCarousel: React.FC<GameCarouselProps> = ({
  currentUser,
  onReservationCreated,
  compact = false,
}) => {
  const [games, setGames] = useState<Game[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState<Game | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    refreshGames();
  }, []);

  const refreshGames = useCallback(() => {
    setGames(mockDataService.getGames());
  }, []);

  useEffect(() => {
    if (games.length <= 1 || compact) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % games.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [games.length, compact]);

  const toggleCard = (id: string) => {
    setFlippedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const goTo = (dir: number) => {
    if (!games.length) return;
    setCurrentIndex((prev) => (prev + dir + games.length) % games.length);
  };

  const openReservation = (game: Game) => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    setStartTime('09:00');
    setEndTime('11:00');
    setShowModal(game);
  };

  const submitReservation = async () => {
    if (!showModal || !selectedDate || !startTime || !endTime) return;
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 200));

    mockDataService.createReservation({
      userId: currentUser.id,
      gameId: showModal.id,
      gameName: showModal.name,
      userName: currentUser.name,
      date: selectedDate,
      startTime,
      endTime,
    });

    toast.success(`预约成功！${showModal.name} · ${selectedDate} ${startTime}-${endTime}`, {
      duration: 3000,
      style: {
        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
        color: '#fff',
        borderRadius: '12px',
        padding: '14px 20px',
        boxShadow: '0 10px 40px rgba(34, 197, 94, 0.3)',
      },
    });

    setIsSubmitting(false);
    setShowModal(null);
    refreshGames();
    onReservationCreated?.();
  };

  const renderVisibleCards = () => {
    if (compact) {
      return games.slice(0, 3).map((game) => renderCard(game, false));
    }
    if (games.length <= 3) {
      return games.map((game, i) => renderCard(game, i === currentIndex));
    }
    const indices = [
      (currentIndex - 1 + games.length) % games.length,
      currentIndex,
      (currentIndex + 1) % games.length,
    ];
    return indices.map((i, pos) => renderCard(games[i], pos === 1, pos));
  };

  const renderCard = (game: Game, isCenter: boolean, position?: number) => {
    const isFlipped = flippedCards.has(game.id);
    let transform = '';
    let opacity = 1;
    let zIndex = 1;

    if (!compact && games.length > 3 && position !== undefined) {
      if (position === 0) {
        transform = 'translateX(-40%) scale(0.85)';
        opacity = 0.6;
        zIndex = 0;
      } else if (position === 2) {
        transform = 'translateX(40%) scale(0.85)';
        opacity = 0.6;
        zIndex = 0;
      } else {
        zIndex = 2;
      }
    }

    return (
      <div
        key={game.id}
        className={`carousel-card ${isCenter ? 'center' : ''}`}
        style={{
          width: compact ? '280px' : '360px',
          height: compact ? '320px' : '440px',
          transform,
          opacity,
          zIndex,
          perspective: '1000px',
          cursor: 'pointer',
          transition: 'all 0.3s ease-out',
          flexShrink: 0,
        }}
        onClick={() => !compact && toggleCard(game.id)}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
              borderRadius: '20px',
              overflow: 'hidden',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              background: 'rgba(45, 45, 68, 0.75)',
              border: '1px solid rgba(124, 111, 247, 0.2)',
              boxShadow: isCenter
                ? '0 20px 60px rgba(124, 111, 247, 0.25)'
                : '0 10px 30px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.2s ease-out',
            }}
            className="card-front"
            onMouseEnter={(e) => {
              if (isCenter && !compact) {
                (e.currentTarget.parentElement?.parentElement as HTMLElement).style.transform =
                  `${transform} scale(1.05)`;
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget.parentElement?.parentElement as HTMLElement).style.transform =
                transform;
            }}
          >
            <div style={{ position: 'relative', height: compact ? '50%' : '55%', overflow: 'hidden' }}>
              <img
                src={game.image}
                alt={game.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCBmaWxsPSIjMkQyRDQ0IiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iI0UwRTBFMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuabtOaWuea4rOijhTwvdGV4dD48L3N2Zz4=';
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(to top, rgba(30, 30, 46, 0.95) 0%, rgba(30, 30, 46, 0.4) 50%, transparent 100%)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #7C6FF7, #9D94FA)',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(124, 111, 247, 0.4)',
                }}
              >
                {game.category}
              </div>
              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  background: 'rgba(255, 140, 66, 0.9)',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                <FiStar fill="#FDE047" stroke="#FDE047" /> {game.avgRating}
              </div>
            </div>
            <div style={{ padding: compact ? '16px' : '24px', height: compact ? '50%' : '45%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3
                  style={{
                    fontSize: compact ? '18px' : '22px',
                    fontWeight: 700,
                    marginBottom: '8px',
                    color: '#fff',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {game.name}
                </h3>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    color: '#9B9BB0',
                    fontSize: '13px',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FiUsers /> {game.players}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    🔥 热度 {game.popularity}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: compact ? '8px' : '16px' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openReservation(game);
                  }}
                  style={{
                    flex: 1,
                    padding: compact ? '10px' : '12px 20px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #7C6FF7, #6366F1)',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: compact ? '13px' : '14px',
                    transition: 'all 0.2s ease-out',
                    boxShadow: '0 4px 16px rgba(124, 111, 247, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                  onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.96)')}
                  onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(124, 111, 247, 0.5)';
                  }}
                >
                  <FiClock /> 立即预约
                </button>
                {!compact && (
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      background: 'rgba(124, 111, 247, 0.15)',
                      color: '#7C6FF7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                    }}
                    title="点击翻转查看详情"
                  >
                    ⟳
                  </div>
                )}
              </div>
            </div>
          </div>

          <div
            style={{
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              borderRadius: '20px',
              padding: '28px',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              background: 'rgba(45, 45, 68, 0.85)',
              border: '1px solid rgba(255, 140, 66, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              boxShadow: '0 20px 60px rgba(255, 140, 66, 0.15)',
            }}
          >
            <div
              style={{
                fontSize: '28px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #FF8C42, #FBBF24)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '16px',
                letterSpacing: '-0.02em',
              }}
            >
              {game.name}
            </div>
            <div
              style={{
                width: '40px',
                height: '3px',
                borderRadius: '2px',
                background: 'linear-gradient(90deg, #7C6FF7, #FF8C42)',
                marginBottom: '20px',
              }}
            />
            <p
              style={{
                color: '#9B9BB0',
                lineHeight: 1.8,
                fontSize: '14px',
                marginBottom: '20px',
              }}
            >
              {game.description}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: 'auto' }}>
              <div
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  background: 'rgba(124, 111, 247, 0.1)',
                  border: '1px solid rgba(124, 111, 247, 0.2)',
                }}
              >
                <div style={{ color: '#9B9BB0', fontSize: '12px', marginBottom: '4px' }}>游玩人数</div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '16px' }}>{game.players}</div>
              </div>
              <div
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  background: 'rgba(255, 140, 66, 0.1)',
                  border: '1px solid rgba(255, 140, 66, 0.2)',
                }}
              >
                <div style={{ color: '#9B9BB0', fontSize: '12px', marginBottom: '4px' }}>综合评分</div>
                <div style={{ color: '#FF8C42', fontWeight: 700, fontSize: '16px' }}>
                  {game.avgRating} / 5.0
                </div>
              </div>
            </div>
            <div
              style={{
                marginTop: '12px',
                textAlign: 'center',
                color: '#6B6B85',
                fontSize: '12px',
              }}
            >
              ← 点击卡片翻转返回
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      {!compact && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '28px',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #fff 0%, #9B9BB0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em',
              }}
            >
              🔥 热门棋盘游戏
            </h2>
            <p style={{ color: '#6B6B85', marginTop: '4px', fontSize: '14px' }}>
              精选高口碑游戏，翻转卡片查看详情
            </p>
          </div>
        </div>
      )}

      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: compact ? 'flex-start' : 'center',
          overflowX: compact ? 'auto' : 'visible',
          gap: compact ? '16px' : '0',
          padding: compact ? '8px 0' : '20px 0',
          scrollbarWidth: 'none',
        }}
        className="carousel-container"
      >
        {!compact && games.length > 1 && (
          <button
            onClick={() => goTo(-1)}
            style={{
              position: 'absolute',
              left: 0,
              zIndex: 10,
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(45, 45, 68, 0.9)',
              border: '1px solid var(--divider)',
              color: '#E0E0E0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              transition: 'all 0.2s ease-out',
              backdropFilter: 'blur(10px)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(124, 111, 247, 0.8)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(45, 45, 68, 0.9)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
          >
            <FiChevronLeft />
          </button>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: compact ? '0' : '0',
            minWidth: 'fit-content',
          }}
        >
          {renderVisibleCards()}
        </div>

        {!compact && games.length > 1 && (
          <button
            onClick={() => goTo(1)}
            style={{
              position: 'absolute',
              right: 0,
              zIndex: 10,
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(45, 45, 68, 0.9)',
              border: '1px solid var(--divider)',
              color: '#E0E0E0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              transition: 'all 0.2s ease-out',
              backdropFilter: 'blur(10px)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(124, 111, 247, 0.8)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(45, 45, 68, 0.9)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
          >
            <FiChevronRight />
          </button>
        )}
      </div>

      {!compact && games.length > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '24px',
          }}
          className="carousel-dots"
        >
          {games.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              style={{
                width: i === currentIndex ? '32px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background:
                  i === currentIndex
                    ? 'linear-gradient(90deg, #7C6FF7, #FF8C42)'
                    : 'var(--divider)',
                transition: 'all 0.3s ease-out',
                cursor: 'pointer',
                border: 'none',
                padding: 0,
              }}
            />
          ))}
        </div>
      )}

      {showModal && (
        <div
          className="fade-in"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(15, 15, 25, 0.8)',
            backdropFilter: 'blur(8px)',
            padding: '20px',
          }}
          onClick={() => !isSubmitting && setShowModal(null)}
        >
          <div
            className="slide-up"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '480px',
              background: 'var(--bg-card)',
              borderRadius: '24px',
              padding: '32px',
              border: '1px solid var(--divider)',
              boxShadow: '0 30px 80px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{
                  fontSize: '12px',
                  color: '#7C6FF7',
                  fontWeight: 600,
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                预约游戏
              </div>
              <h3
                style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#fff',
                  letterSpacing: '-0.02em',
                }}
              >
                {showModal.name}
              </h3>
              <div style={{ color: '#9B9BB0', marginTop: '6px', fontSize: '14px' }}>
                {showModal.category} · {showModal.players}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--divider)', paddingTop: '24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    color: '#9B9BB0',
                    fontSize: '13px',
                    marginBottom: '8px',
                    fontWeight: 500,
                  }}
                >
                  选择日期
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--divider)',
                    color: '#fff',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.2s ease-out',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#7C6FF7')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--divider)')}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      color: '#9B9BB0',
                      fontSize: '13px',
                      marginBottom: '8px',
                      fontWeight: 500,
                    }}
                  >
                    开始时间
                  </label>
                  <select
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--divider)',
                      color: '#fff',
                      fontSize: '15px',
                      outline: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-out',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#7C6FF7')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--divider)')}
                  >
                    {Array.from({ length: 14 }, (_, i) => {
                      const h = 8 + i;
                      return `${h.toString().padStart(2, '0')}:00`;
                    }).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      color: '#9B9BB0',
                      fontSize: '13px',
                      marginBottom: '8px',
                      fontWeight: 500,
                    }}
                  >
                    结束时间
                  </label>
                  <select
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--divider)',
                      color: '#fff',
                      fontSize: '15px',
                      outline: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-out',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#7C6FF7')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--divider)')}
                  >
                    {Array.from({ length: 14 }, (_, i) => {
                      const h = 9 + i;
                      return `${h.toString().padStart(2, '0')}:00`;
                    }).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div
                style={{
                  marginTop: '20px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'rgba(124, 111, 247, 0.1)',
                  border: '1px solid rgba(124, 111, 247, 0.2)',
                  fontSize: '13px',
                  color: '#9B9BB0',
                }}
              >
                📍 预约后请前往社区活动中心领取棋盘，使用完毕请及时归还
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
              <button
                onClick={() => setShowModal(null)}
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '12px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--divider)',
                  color: '#9B9BB0',
                  fontWeight: 600,
                  fontSize: '14px',
                  transition: 'all 0.2s ease-out',
                  opacity: isSubmitting ? 0.5 : 1,
                }}
                onMouseDown={(e) => !isSubmitting && (e.currentTarget.style.transform = 'scale(0.97)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                取消
              </button>
              <button
                onClick={submitReservation}
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #7C6FF7, #6366F1)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '14px',
                  transition: 'all 0.2s ease-out',
                  boxShadow: '0 6px 20px rgba(124, 111, 247, 0.4)',
                  opacity: isSubmitting ? 0.7 : 1,
                }}
                onMouseDown={(e) => !isSubmitting && (e.currentTarget.style.transform = 'scale(0.97)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 10px 28px rgba(124, 111, 247, 0.5)';
                  }
                }}
              >
                {isSubmitting ? '提交中...' : '✓ 确认预约'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .carousel-dots {
            display: none !important;
          }
          .carousel-container {
            justify-content: flex-start !important;
            overflow-x: auto !important;
            padding: 8px 4px !important;
          }
          .carousel-card {
            width: 280px !important;
            height: 360px !important;
            transform: none !important;
            opacity: 1 !important;
            z-index: 1 !important;
          }
          .card-front {
            transform: none !important;
          }
        }
        .carousel-container::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};
