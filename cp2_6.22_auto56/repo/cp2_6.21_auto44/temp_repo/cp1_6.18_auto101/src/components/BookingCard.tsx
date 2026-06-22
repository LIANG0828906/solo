import React, { memo, useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Clock, MapPin, Timer } from 'lucide-react';
import type { Booking } from '../types';
import { scheduleIdleQR } from '../utils/QRGenerator';

interface BookingCardProps {
  booking: Booking;
  onCancel: (bookingId: string) => void;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getCountdown(endTime: number): { text: string; isUrgent: boolean } {
  const now = Date.now();
  const diff = endTime - now;
  if (diff <= 0) return { text: '已过期', isUrgent: true };

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (hours > 0) {
    return { text: `${hours}小时 ${minutes}分`, isUrgent: hours < 1 };
  }
  if (minutes > 0) {
    return { text: `${minutes}分 ${seconds}秒`, isUrgent: minutes < 15 };
  }
  return { text: `${seconds}秒`, isUrgent: true };
}

const BookingCardComponent: React.FC<BookingCardProps> = ({ booking, onCancel }) => {
  const [showQR, setShowQR] = useState(false);
  const [countdown, setCountdown] = useState(() => getCountdown(booking.endTime));

  useEffect(() => {
    scheduleIdleQR(() => setShowQR(true));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getCountdown(booking.endTime));
    }, 1000);
    return () => clearInterval(timer);
  }, [booking.endTime]);

  return (
    <div
      style={{
        width: 250,
        backgroundColor: '#2D2D44',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
        position: 'relative',
      }}
    >
      <button
        className="btn-hover"
        onClick={() => onCancel(booking.id)}
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          width: 28,
          height: 28,
          borderRadius: '50%',
          border: 'none',
          backgroundColor: 'rgba(255, 107, 107, 0.15)',
          color: '#FF6B6B',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#E55A5A';
          e.currentTarget.style.color = '#fff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 107, 107, 0.15)';
          e.currentTarget.style.color = '#FF6B6B';
        }}
      >
        <X size={14} />
      </button>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: 'rgba(78, 205, 196, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MapPin size={20} color="#4ECDC4" />
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#E0E0E0', lineHeight: 1.1 }}>
            {booking.seatNumber}
          </div>
          <div style={{ fontSize: 12, color: '#A0A0B0' }}>
            {booking.zone}区 · {booking.duration}小时
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          marginBottom: 12,
          padding: 10,
          backgroundColor: 'rgba(99, 110, 114, 0.15)',
          borderRadius: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={13} color="#A0A0B0" />
          <span style={{ fontSize: 12, color: '#A0A0B0', flex: 1 }}>开始时间</span>
          <span style={{ fontSize: 12, color: '#E0E0E0', fontWeight: 500 }}>
            {formatTime(booking.startTime)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Timer size={13} color={countdown.isUrgent ? '#FF6B6B' : '#A0A0B0'} />
          <span style={{ fontSize: 12, color: '#A0A0B0', flex: 1 }}>剩余时间</span>
          <span
            style={{
              fontSize: 13,
              color: countdown.isUrgent ? '#FF6B6B' : '#4ECDC4',
              fontWeight: 700,
            }}
          >
            {countdown.text}
          </span>
        </div>
      </div>

      {booking.reminderSent && (
        <div
          style={{
            fontSize: 11,
            color: '#A0A0B0',
            marginBottom: 10,
            textAlign: 'center',
          }}
        >
          ✓ 到馆提醒已发送
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: 10,
          backgroundColor: '#fff',
          borderRadius: 8,
        }}
      >
        {showQR ? (
          <QRCodeSVG
            value={booking.qrCodeData}
            size={110}
            bgColor="#FFFFFF"
            fgColor="#1A1A2E"
            level="M"
          />
        ) : (
          <div
            style={{
              width: 110,
              height: 110,
              backgroundColor: 'rgba(99, 110, 114, 0.1)',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                border: '2px solid #A0A0B0',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 11,
          color: '#A0A0B0',
          textAlign: 'center',
        }}
      >
        入场凭证 · 请在入馆时出示
      </div>
    </div>
  );
};

export const BookingCard = memo(BookingCardComponent, (prev, next) => {
  return (
    prev.booking.id === next.booking.id &&
    prev.booking.endTime === next.booking.endTime &&
    prev.booking.reminderSent === next.booking.reminderSent &&
    prev.onCancel === next.onCancel
  );
});
