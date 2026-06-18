import React, { useState, useEffect, useCallback } from 'react';
import { FiClock, FiCalendar, FiUser, FiStar, FiCheckCircle, FiAlertCircle, FiXCircle } from 'react-icons/fi';
import type { Reservation, ReservationStatus } from '@/types';
import { mockDataService } from '@/services/mockData';

interface ReservationListProps {
  userId?: string;
  isAdmin?: boolean;
  filterStatus?: ReservationStatus | 'all';
  onStatusChange?: () => void;
  onRatingSubmit?: () => void;
}

type FlashingCard = { id: string; type: 'success' | 'error' };

const formatDateCN = (dateStr: string): string => {
  const d = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(d, today)) return `今天 · ${dateStr}`;
  if (sameDay(d, tomorrow)) return `明天 · ${dateStr}`;
  return `${d.getMonth() + 1}月${d.getDate()}日 · ${dateStr}`;
};

const getStatusInfo = (status: ReservationStatus) => {
  switch (status) {
    case 'pending':
      return {
        label: '待使用',
        color: '#FF8C42',
        bg: 'rgba(255, 140, 66, 0.12)',
        border: 'rgba(255, 140, 66, 0.3)',
        icon: <FiClock />,
      };
    case 'completed':
      return {
        label: '已使用',
        color: '#4ADE80',
        bg: 'rgba(74, 222, 128, 0.12)',
        border: 'rgba(74, 222, 128, 0.3)',
        icon: <FiCheckCircle />,
      };
    case 'overdue':
      return {
        label: '已超时',
        color: '#F87171',
        bg: 'rgba(248, 113, 113, 0.12)',
        border: 'rgba(248, 113, 113, 0.3)',
        icon: <FiAlertCircle />,
      };
  }
};

export const ReservationList: React.FC<ReservationListProps> = ({
  userId,
  isAdmin = false,
  filterStatus = 'all',
  onStatusChange,
  onRatingSubmit,
}) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [flashingCards, setFlashingCards] = useState<FlashingCard[]>([]);
  const [fadingIds, setFadingIds] = useState<Set<string>>(new Set());
  const [pulsingStars, setPulsingStars] = useState<{ resId: string; star: number } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const refresh = useCallback(() => {
    let list: Reservation[];
    if (userId) {
      list = mockDataService.getReservationsByUserId(userId);
    } else {
      list = mockDataService.getReservations();
    }
    if (filterStatus !== 'all') {
      list = list.filter((r) => r.status === filterStatus);
    }
    setReservations(list);
    setCurrentPage(1);
  }, [userId, filterStatus]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleStatusUpdate = (
    id: string,
    status: 'completed' | 'overdue',
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setFlashingCards((prev) => [
      ...prev,
      { id, type: status === 'completed' ? 'success' : 'error' },
    ]);

    setTimeout(() => {
      setFadingIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
    }, status === 'completed' ? 800 : 1000);

    setTimeout(() => {
      mockDataService.updateReservationStatus(id, status);
      setFlashingCards((prev) => prev.filter((f) => f.id !== id));
      setFadingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      refresh();
      onStatusChange?.();
    }, 1200);
  };

  const handleRating = (reservationId: string, rating: number) => {
    setPulsingStars({ resId: reservationId, star: rating });
    setTimeout(() => {
      mockDataService.addRating(reservationId, rating);
      setPulsingStars(null);
      refresh();
      onRatingSubmit?.();
    }, 300);
  };

  const groupByDate = () => {
    if (!isAdmin) return null;
    const groups: Map<string, Reservation[]> = new Map();
    reservations.forEach((r) => {
      if (!groups.has(r.date)) groups.set(r.date, []);
      groups.get(r.date)!.push(r);
    });
    return groups;
  };

  const totalPages = Math.max(1, Math.ceil(reservations.length / pageSize));
  const pagedReservations = !isAdmin
    ? reservations.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : [];

  const renderCard = (reservation: Reservation) => {
    const statusInfo = getStatusInfo(reservation.status);
    const flashing = flashingCards.find((f) => f.id === reservation.id);
    const isFading = fadingIds.has(reservation.id);

    return (
      <div
        key={reservation.id}
        className={`${
          flashing?.type === 'success'
            ? 'flash-green'
            : flashing?.type === 'error'
            ? 'flash-red'
            : ''
        } ${isFading ? 'fade-out' : ''}`}
        onClick={() => setExpandedId((prev) => (prev === reservation.id ? null : reservation.id))}
        style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: `1px solid ${expandedId === reservation.id ? 'rgba(124, 111, 247, 0.4)' : 'var(--divider)'}`,
          padding: '20px',
          cursor: isAdmin ? 'pointer' : 'default',
          transition: 'all 0.25s ease-out',
          position: 'relative',
          overflow: 'hidden',
        }}
        onMouseEnter={(e) => {
          if (isAdmin) {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(124, 111, 247, 0.15)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = '';
          e.currentTarget.style.boxShadow = '';
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <h4
                style={{
                  fontSize: '17px',
                  fontWeight: 700,
                  color: '#fff',
                  letterSpacing: '-0.01em',
                }}
              >
                {reservation.gameName}
              </h4>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  background: statusInfo.bg,
                  border: `1px solid ${statusInfo.border}`,
                  color: statusInfo.color,
                  fontSize: '12px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                {statusInfo.icon} {statusInfo.label}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '16px',
                color: '#9B9BB0',
                fontSize: '13px',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <FiCalendar /> {formatDateCN(reservation.date)}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <FiClock /> {reservation.startTime} - {reservation.endTime}
              </span>
              {isAdmin && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <FiUser /> {reservation.userName}
                </span>
              )}
            </div>
          </div>

          {isAdmin && reservation.status === 'pending' && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ display: 'flex', gap: '8px' }}
            >
              <button
                onClick={(e) => handleStatusUpdate(reservation.id, 'completed', e)}
                title="标记已归还"
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(74, 222, 128, 0.12)',
                  border: '1px solid rgba(74, 222, 128, 0.3)',
                  color: '#4ADE80',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.2s ease-out',
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(74, 222, 128, 0.2)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
              >
                <FiCheckCircle /> 已归还
              </button>
              <button
                onClick={(e) => handleStatusUpdate(reservation.id, 'overdue', e)}
                title="标记超时"
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(248, 113, 113, 0.12)',
                  border: '1px solid rgba(248, 113, 113, 0.3)',
                  color: '#F87171',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.2s ease-out',
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(248, 113, 113, 0.2)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
              >
                <FiXCircle /> 超时
              </button>
            </div>
          )}
        </div>

        {(expandedId === reservation.id || (!isAdmin && reservation.status === 'completed')) && (
          <div
            className="fade-in"
            style={{
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid var(--divider)',
            }}
          >
            {reservation.status === 'completed' && (
              <div>
                <div
                  style={{
                    color: '#9B9BB0',
                    fontSize: '13px',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <FiStar fill="#FDE047" stroke="#FDE047" /> 为本次使用打分：
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isActive = (reservation.rating ?? 0) >= star;
                    const isPulsing =
                      pulsingStars?.resId === reservation.id && pulsingStars.star === star;
                    return (
                      <button
                        key={star}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!reservation.rating) handleRating(reservation.id, star);
                        }}
                        className={isPulsing ? 'pulse-animation' : ''}
                        disabled={!!reservation.rating}
                        style={{
                          fontSize: '28px',
                          color: isActive ? '#FDE047' : '#3A3A55',
                          transition: 'all 0.15s ease-out',
                          cursor: reservation.rating ? 'default' : 'pointer',
                          lineHeight: 1,
                          background: 'none',
                          border: 'none',
                          padding: '4px',
                        }}
                        onMouseEnter={(e) => {
                          if (!reservation.rating)
                            e.currentTarget.style.transform = 'scale(1.15)';
                        }}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      >
                        ★
                      </button>
                    );
                  })}
                  {reservation.rating && (
                    <span
                      style={{
                        marginLeft: '10px',
                        color: '#6B6B85',
                        fontSize: '13px',
                        alignSelf: 'center',
                      }}
                    >
                      感谢您的 {reservation.rating} 星评价！
                    </span>
                  )}
                </div>
              </div>
            )}

            {isAdmin && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    background: 'var(--bg-primary)',
                  }}
                >
                  <div style={{ color: '#6B6B85', fontSize: '12px', marginBottom: '4px' }}>
                    预约编号
                  </div>
                  <div style={{ color: '#fff', fontSize: '13px', fontFamily: 'monospace' }}>
                    {reservation.id}
                  </div>
                </div>
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    background: 'var(--bg-primary)',
                  }}
                >
                  <div style={{ color: '#6B6B85', fontSize: '12px', marginBottom: '4px' }}>
                    创建时间
                  </div>
                  <div style={{ color: '#fff', fontSize: '13px' }}>
                    {reservation.createdAt}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (isAdmin) {
    const groups = groupByDate();
    if (!groups || groups.size === 0) {
      return (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#6B6B85',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
          <div style={{ fontSize: '16px' }}>暂无预约记录</div>
        </div>
      );
    }

    const sortedDates = Array.from(groups.keys()).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {sortedDates.map((date, idx) => (
          <div key={date}>
            {idx > 0 && (
              <div
                style={{
                  height: '1px',
                  background: '#3A3A55',
                  marginBottom: '24px',
                }}
              />
            )}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background:
                    date === new Date().toISOString().split('T')[0]
                      ? 'linear-gradient(135deg, #7C6FF7, #FF8C42)'
                      : '#3A3A55',
                  boxShadow:
                    date === new Date().toISOString().split('T')[0]
                      ? '0 0 12px rgba(124, 111, 247, 0.6)'
                      : 'none',
                }}
              />
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                {formatDateCN(date)}
              </h3>
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: '20px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--divider)',
                  color: '#9B9BB0',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                {groups.get(date)!.length} 条
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginLeft: '16px',
                paddingLeft: '20px',
                borderLeft: '2px solid var(--divider)',
              }}
            >
              {groups.get(date)!.map((r) => renderCard(r))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#6B6B85',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
        <div style={{ fontSize: '16px' }}>该分类暂无预约记录</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
        {pagedReservations.map((r) => renderCard(r))}
      </div>

      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: currentPage === 1 ? 'var(--bg-card)' : 'rgba(124, 111, 247, 0.1)',
              border: `1px solid ${currentPage === 1 ? 'var(--divider)' : 'rgba(124, 111, 247, 0.3)'}`,
              color: currentPage === 1 ? '#6B6B85' : '#7C6FF7',
              fontSize: '16px',
              transition: 'all 0.2s ease-out',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (currentPage !== 1) {
                e.currentTarget.style.background = 'rgba(124, 111, 247, 0.2)';
                e.currentTarget.style.transform = 'scale(1.08)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              if (currentPage !== 1) {
                e.currentTarget.style.background = 'rgba(124, 111, 247, 0.1)';
              }
            }}
            onMouseDown={(e) => {
              if (currentPage !== 1) e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onMouseUp={(e) => {
              if (currentPage !== 1) e.currentTarget.style.transform = 'scale(1.08)';
            }}
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
            const isActive = page === currentPage;
            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                style={{
                  minWidth: '40px',
                  height: '40px',
                  padding: '0 14px',
                  borderRadius: '12px',
                  background: isActive
                    ? 'linear-gradient(135deg, #7C6FF7, #6366F1)'
                    : 'var(--bg-card)',
                  border: `1px solid ${isActive ? 'transparent' : 'var(--divider)'}`,
                  color: isActive ? '#fff' : '#9B9BB0',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'all 0.2s ease-out',
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 4px 14px rgba(124, 111, 247, 0.4)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(124, 111, 247, 0.15)';
                    e.currentTarget.style.color = '#7C6FF7';
                    e.currentTarget.style.transform = 'scale(1.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--bg-card)';
                    e.currentTarget.style.color = '#9B9BB0';
                  }
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
              >
                {page}
              </button>
            );
          })}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background:
                currentPage === totalPages ? 'var(--bg-card)' : 'rgba(124, 111, 247, 0.1)',
              border: `1px solid ${
                currentPage === totalPages ? 'var(--divider)' : 'rgba(124, 111, 247, 0.3)'
              }`,
              color: currentPage === totalPages ? '#6B6B85' : '#7C6FF7',
              fontSize: '16px',
              transition: 'all 0.2s ease-out',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (currentPage !== totalPages) {
                e.currentTarget.style.background = 'rgba(124, 111, 247, 0.2)';
                e.currentTarget.style.transform = 'scale(1.08)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              if (currentPage !== totalPages) {
                e.currentTarget.style.background = 'rgba(124, 111, 247, 0.1)';
              }
            }}
            onMouseDown={(e) => {
              if (currentPage !== totalPages) e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onMouseUp={(e) => {
              if (currentPage !== totalPages) e.currentTarget.style.transform = 'scale(1.08)';
            }}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
};
