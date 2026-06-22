import type { Card as CardType } from '@/types';
import { THEMES } from '@/constants/themes';
import { useCardStore } from '@/store/cards';
import { Edit3, BadgeCheck } from 'lucide-react';

interface Props {
  card: CardType;
  index: number;
  isExporting: boolean;
  isCurrentExport: boolean;
  exportIndex: number;
  onMouseDown?: (e: React.MouseEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  dragging?: boolean;
  dragOver?: boolean;
  hideExtras?: boolean;
}

export default function Card({
  card,
  index,
  isExporting,
  isCurrentExport,
  exportIndex,
  onMouseDown,
  onTouchStart,
  dragging,
  dragOver,
  hideExtras,
}: Props) {
  const theme = THEMES[card.theme];
  const openEditor = useCardStore((s) => s.openEditor);

  const wrapperStyle: React.CSSProperties = hideExtras
    ? {
        width: 1280,
        height: 720,
        background: theme.bg,
        borderRadius: 0,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: theme.font,
      }
    : {
        width: 240,
        height: 320,
        background: theme.bg,
        borderRadius: 12,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: theme.font,
        cursor: dragging ? 'grabbing' : 'grab',
        transform: dragOver ? 'translateX(6px)' : undefined,
        transition: 'transform 0.18s ease-out',
        boxShadow: dragging ? 'none' : '0 4px 14px rgba(0,0,0,0.08)',
      };

  return (
    <div
      className={`card-item ${dragging ? 'drag-chosen' : ''} ${dragOver && !dragging ? 'drag-ghost' : ''}`}
      style={wrapperStyle}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onClick={(e) => {
        if (!hideExtras && !dragging) {
          e.stopPropagation();
          openEditor(card.id);
        }
      }}
    >
      {hideExtras ? null : (
        <div
          className="absolute top-2 right-2 z-10 opacity-0 hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            openEditor(card.id);
          }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: theme.accent, cursor: 'pointer' }}
            title="编辑卡片"
          >
            <Edit3 size={13} />
          </div>
        </div>
      )}

      {isCurrentExport && !hideExtras && (
        <div className="export-progress-overlay">
          正在导出第 {exportIndex + 1} 张...
        </div>
      )}

      <div
        style={{
          width: '100%',
          height: hideExtras ? '55%' : '52%',
          backgroundImage: `url(${card.imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            background: card.theme === 'business'
              ? 'linear-gradient(to bottom, rgba(26,26,46,0.1), rgba(26,26,46,0.7))'
              : 'linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.1))',
          }}
        />
      </div>

      <div
        style={{
          padding: hideExtras ? '36px 56px 56px' : '14px 16px 30px',
          color: theme.fg,
          height: hideExtras ? '45%' : '48%',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <p
          style={{
            fontSize: hideExtras ? 34 : 15,
            fontWeight: 600,
            lineHeight: hideExtras ? 1.5 : 1.55,
            margin: 0,
            letterSpacing: 0.3,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: hideExtras ? 6 : 4,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {card.text}
        </p>
        {hideExtras && (
          <div
            style={{
              marginTop: 'auto',
              fontSize: 18,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: theme.accent,
            }}
          >
            <BadgeCheck size={22} />
            <span>{theme.name}主题 · 知识卡片</span>
          </div>
        )}
      </div>

      {!hideExtras && (
        <div
          className="theme-badge"
          style={{
            backgroundColor: card.theme === 'business' ? 'rgba(212,175,55,0.9)' : card.theme === 'cartoon' ? 'rgba(255,112,67,0.9)' : 'rgba(108,99,255,0.9)',
            color: '#fff',
          }}
        >
          {theme.badge}
        </div>
      )}

      {hideExtras && (
        <div
          style={{
            position: 'absolute',
            left: 56,
            top: 40,
            padding: '6px 14px',
            borderRadius: 20,
            fontSize: 14,
            fontWeight: 700,
            backgroundColor: theme.accent,
            color: '#fff',
            letterSpacing: 1,
          }}
        >
          {theme.name}
        </div>
      )}

      {hideExtras && (
        <div
          style={{
            position: 'absolute',
            right: 56,
            top: 40,
            fontSize: 64,
            fontWeight: 800,
            color: theme.accent,
            opacity: 0.15,
            fontFamily: 'Georgia, serif',
          }}
        >
          #{String(index + 1).padStart(2, '0')}
        </div>
      )}
    </div>
  );
}
