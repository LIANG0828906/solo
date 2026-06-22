import React, { useRef, useEffect } from 'react';

export interface UserData {
  id: string;
  name: string;
  avatar: string;
  lang: 'zh' | 'en' | 'ja' | 'es';
  styles: string[];
  matchPercent: number;
  ideas: { id: string; text: string; lang: string; styles: string[] }[];
}

export const LANG_COLORS: Record<string, string> = {
  zh: '#DE2910',
  en: '#4FC3F7',
  ja: '#BC002D',
  es: '#FFC400',
};

export const LANG_LABELS: Record<string, string> = {
  zh: '中文',
  en: 'EN',
  ja: '日本語',
  es: 'ES',
};

interface UserCardProps {
  user: UserData;
  onCardClick: (user: UserData) => void;
}

function drawRing(canvas: HTMLCanvasElement, percent: number) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const size = canvas.width;
  const dpr = window.devicePixelRatio || 1;
  const center = size / (2 * dpr);
  const radius = center - 6;

  ctx.clearRect(0, 0, size, size);

  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 5;
  ctx.stroke();

  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + (Math.PI * 2 * percent / 100);

  const gradient = ctx.createConicGradient(startAngle, center, center);
  const colorStop = Math.max(0.01, percent / 100);
  gradient.addColorStop(0, '#FF4444');
  gradient.addColorStop(colorStop * 0.5, '#FFAA00');
  gradient.addColorStop(colorStop, '#44FF44');
  gradient.addColorStop(1, 'transparent');

  ctx.beginPath();
  ctx.arc(center, center, radius, startAngle, endAngle);

  let strokeColor = '#FF4444';
  if (percent > 70) strokeColor = '#44FF44';
  else if (percent > 40) strokeColor = '#FFAA00';

  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.stroke();

  ctx.fillStyle = '#FFF';
  ctx.font = `bold ${Math.round(11 * dpr)}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${percent}%`, center, center);
}

export default function UserCard({ user, onCardClick }: UserCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const dpr = window.devicePixelRatio || 1;
      canvasRef.current.width = 60 * dpr;
      canvasRef.current.height = 60 * dpr;
      drawRing(canvasRef.current, user.matchPercent);
    }
  }, [user.matchPercent]);

  return (
    <div
      onClick={() => onCardClick(user)}
      style={{
        width: 200,
        height: 260,
        background: '#252536',
        borderRadius: 16,
        padding: 16,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        transition: 'transform 0.2s, box-shadow 0.2s',
        flexShrink: 0,
        border: '1px solid #333348',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          border: `3px solid ${LANG_COLORS[user.lang]}`,
          overflow: 'hidden',
          background: '#1A1A2E',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
        }}
      >
        {user.avatar}
      </div>
      <div style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14, marginTop: 4 }}>
        {user.name}
      </div>
      <div
        style={{
          background: `linear-gradient(135deg, ${LANG_COLORS[user.lang]}, ${LANG_COLORS[user.lang]}88)`,
          color: '#FFF',
          padding: '2px 12px',
          borderRadius: 12,
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        {LANG_LABELS[user.lang]}
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
        {user.styles.map((s) => (
          <span
            key={s}
            style={{
              background: '#3A3A4E',
              color: '#B388FF',
              padding: '2px 8px',
              borderRadius: 8,
              fontSize: 10,
            }}
          >
            {s}
          </span>
        ))}
      </div>
      <canvas
        ref={canvasRef}
        style={{ width: 60, height: 60, marginTop: 4 }}
      />
    </div>
  );
}
