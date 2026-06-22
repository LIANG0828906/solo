import { memo } from 'react';
import type { Smell } from '../types';
import { EMOTION_COLORS } from '../types';

interface SmellCardProps {
  smell: Smell;
  onSelect?: (smell: Smell) => void;
  style?: React.CSSProperties;
}

const SmellCard = memo(function SmellCard({ smell, onSelect, style }: SmellCardProps) {
  const emotionColor = EMOTION_COLORS[smell.emotion];

  return (
    <div
      onClick={() => onSelect?.(smell)}
      style={{
        ...style,
        background: '#34495E',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 2px 8px #00000030',
        cursor: 'pointer',
        transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
        transform: 'translateY(0)',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 6px 20px #00000050';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px #00000030';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '2px',
            backgroundColor: emotionColor,
            flexShrink: 0
          }}
        />
        <span
          style={{
            color: '#ECF0F1',
            fontSize: '16px',
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {smell.name}
        </span>
      </div>

      <p
        style={{
          color: '#ECF0F1',
          fontSize: '14px',
          lineHeight: '1.6',
          margin: '0 0 12px 0',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}
      >
        {smell.description}
      </p>

      <div
        style={{
          height: '20px',
          borderRadius: '4px',
          background: `linear-gradient(90deg, ${smell.color}, ${adjustColor(smell.color, 40)})`
        }}
      />
    </div>
  );
});

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export default SmellCard;
