import React, { useEffect } from 'react';
import { WinRecord } from '../types';
import { RARITY_COLORS } from '../utils';

interface NotificationBarProps {
  records: WinRecord[];
  onRemove: (id: string) => void;
}

const MAX_VISIBLE = 5;
const VERTICAL_GAP = 60;
const ANIMATION_DURATION = 5000;

const NotificationBar: React.FC<NotificationBarProps> = ({ records, onRemove }) => {
  const visibleRecords = records.slice(0, MAX_VISIBLE);

  return (
    <div
      style={{
        position: 'fixed',
        top: '100px',
        left: 0,
        width: '100%',
        pointerEvents: 'none',
        zIndex: 100,
        overflow: 'hidden',
      }}
    >
      {visibleRecords.map((record, index) => (
        <DanmakuItem
          key={record.id}
          record={record}
          index={index}
          onComplete={() => onRemove(record.id)}
        />
      ))}

      <style>{`
        @keyframes danmaku-slide {
          from {
            transform: translate3d(100vw, 0, 0);
          }
          to {
            transform: translate3d(-100%, 0, 0);
          }
        }

        @keyframes fade-out {
          0%, 80% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }

        .danmaku-item {
          animation: danmaku-slide 5s linear forwards, fade-out 5s linear forwards;
          will-change: transform, opacity;
        }

        @media (max-width: 480px) {
          .danmaku-item {
            font-size: 12px !important;
            max-width: calc(100vw - 32px) !important;
          }
        }
      `}</style>
    </div>
  );
};

interface DanmakuItemProps {
  record: WinRecord;
  index: number;
  onComplete: () => void;
}

const DanmakuItem: React.FC<DanmakuItemProps> = ({ record, index, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, ANIMATION_DURATION);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const rarityColors = RARITY_COLORS[record.prizeRarity] || RARITY_COLORS.common;

  return (
    <div
      className="danmaku-item"
      style={{
        position: 'absolute',
        top: `${index * VERTICAL_GAP}px`,
        left: 0,
        height: '48px',
        padding: '0 24px',
        borderRadius: '24px',
        background: rarityColors.bg,
        color: '#ffffff',
        fontWeight: 600,
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        whiteSpace: 'nowrap',
        pointerEvents: 'auto',
      }}
    >
      <span style={{ fontSize: '20px' }}>{record.prizeIcon}</span>
      <span>恭喜 {record.userName} 获得 {record.prizeName}</span>
    </div>
  );
};

export default React.memo(NotificationBar);
