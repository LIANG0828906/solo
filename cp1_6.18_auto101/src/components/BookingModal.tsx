import React, { useState, useEffect, useCallback } from 'react';
import { X, Clock, MapPin } from 'lucide-react';
import { useSeatStore } from '../stores/seatStore';
import type { BookingDuration } from '../types';

export const BookingModal: React.FC = () => {
  const isOpen = useSeatStore((state) => state.isBookingModalOpen);
  const selectedSeatId = useSeatStore((state) => state.selectedSeatId);
  const seats = useSeatStore((state) => state.seats);
  const closeModal = useSeatStore((state) => state.closeBookingModal);
  const bookSeat = useSeatStore((state) => state.bookSeat);

  const [duration, setDuration] = useState<BookingDuration>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedSeat = selectedSeatId ? seats.find((s) => s.id === selectedSeatId) : null;

  useEffect(() => {
    if (isOpen) {
      setDuration(1);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleConfirm = useCallback(() => {
    if (!selectedSeat || isSubmitting) return;
    setIsSubmitting(true);
    setTimeout(() => {
      bookSeat(selectedSeat.id, duration);
      setIsSubmitting(false);
    }, 150);
  }, [selectedSeat, duration, isSubmitting, bookSeat]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        closeModal();
      }
    },
    [closeModal]
  );

  if (!isOpen || !selectedSeat) return null;

  const durations: BookingDuration[] = [1, 2, 4];

  return (
    <div
      className="animate-fade-in"
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="glass animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 320,
          backgroundColor: 'rgba(30, 30, 46, 0.8)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: 16,
          padding: 24,
          position: 'relative',
          border: '1px solid rgba(99, 110, 114, 0.2)',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.4)',
        }}
      >
        <button
          onClick={closeModal}
          className="btn-hover"
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'rgba(99, 110, 114, 0.2)',
            color: '#A0A0B0',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={16} />
        </button>

        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#E0E0E0',
              marginBottom: 4,
            }}
          >
            预约确认
          </div>
          <div style={{ fontSize: 13, color: '#A0A0B0' }}>请选择预约时长</div>
        </div>

        <div
          style={{
            backgroundColor: 'rgba(99, 110, 114, 0.15)',
            borderRadius: 10,
            padding: 14,
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <MapPin size={16} color="#4ECDC4" />
            <span style={{ fontSize: 16, fontWeight: 700, color: '#E0E0E0' }}>
              {selectedSeat.seatNumber}
            </span>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 4,
                backgroundColor: 'rgba(78, 205, 196, 0.15)',
                color: '#4ECDC4',
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {selectedSeat.zone}区
            </span>
          </div>
          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#A0A0B0', flexWrap: 'wrap' }}>
            {selectedSeat.tags.windowView && (
              <span>🪟 窗口位</span>
            )}
            {selectedSeat.tags.powerOutlet && (
              <span>⚡ 电源位</span>
            )}
            {selectedSeat.tags.quietZone && (
              <span>🤫 安静区</span>
            )}
            {!selectedSeat.tags.windowView && !selectedSeat.tags.powerOutlet && !selectedSeat.tags.quietZone && (
              <span>标准座位</span>
            )}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              color: '#A0A0B0',
              marginBottom: 10,
            }}
          >
            <Clock size={14} />
            <span>预约时长</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {durations.map((d) => (
              <button
                key={d}
                className="btn-hover"
                onClick={() => setDuration(d)}
                style={{
                  flex: 1,
                  height: 42,
                  borderRadius: 8,
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: duration === d ? '#4ECDC4' : 'rgba(99, 110, 114, 0.25)',
                  color: duration === d ? '#fff' : '#E0E0E0',
                  transition: 'background-color 0.2s ease',
                }}
              >
                {d} 小时
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 14px',
            borderRadius: 10,
            backgroundColor: 'rgba(99, 110, 114, 0.12)',
            marginBottom: 20,
          }}
        >
          <span style={{ fontSize: 13, color: '#A0A0B0' }}>使用至</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#4ECDC4' }}>
            {new Date(Date.now() + duration * 60 * 60 * 1000).toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        <button
          className="btn-hover"
          onClick={handleConfirm}
          disabled={isSubmitting}
          style={{
            width: '100%',
            height: 48,
            borderRadius: 10,
            border: 'none',
            backgroundColor: isSubmitting ? '#636E72' : '#4ECDC4',
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s ease',
            letterSpacing: 1,
          }}
          onMouseEnter={(e) => {
            if (!isSubmitting) e.currentTarget.style.backgroundColor = '#6DD5D5';
          }}
          onMouseLeave={(e) => {
            if (!isSubmitting) e.currentTarget.style.backgroundColor = '#4ECDC4';
          }}
        >
          {isSubmitting ? '处理中...' : '确认预约'}
        </button>
      </div>
    </div>
  );
};
