import React, { memo, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Fragment } from '@/modules/puzzleManager';
import { useGameStore } from '@/store/gameStore';
import { useDragHandlers } from '@/modules/dragModule';

interface FragmentCardProps {
  fragment: Fragment;
  isDragging: boolean;
  flashRed: boolean;
}

const FragmentCard: React.FC<FragmentCardProps> = memo(({ fragment, isDragging, flashRed }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: fragment.id,
    disabled: fragment.isCorrect,
  });

  const cardTransform = useMemo(() => {
    if (!transform) {
      return `rotate(${fragment.rotation}deg)`;
    }
    return `${CSS.Translate.toString(transform)} rotate(${fragment.rotation}deg)`;
  }, [transform, fragment.rotation]);

  const style: React.CSSProperties = {
    width: 260,
    transform: cardTransform,
    opacity: isDragging ? 0.4 : 1,
    cursor: fragment.isCorrect ? 'not-allowed' : 'grab',
    position: 'relative',
    willChange: 'transform, opacity',
    transition: isDragging ? 'none' : 'all 0.15s ease-out',
  };

  const cardStyle: React.CSSProperties = {
    width: '100%',
    height: 'auto',
    minHeight: 80,
    backgroundColor: '#ffffff',
    borderRadius: 'var(--radius-card)',
    border: `1px solid ${
      fragment.isCorrect
        ? '#22c55e'
        : flashRed
        ? '#ef4444'
        : '#e2e8f0'
    }`,
    padding: 8,
    position: 'relative',
    overflow: 'hidden',
    zIndex: 1,
  };

  const shadowStyle: React.CSSProperties = {
    position: 'absolute',
    top: 3,
    left: 3,
    right: -3,
    bottom: -3,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 'var(--radius-card)',
    opacity: isDragging ? 0.3 : 0,
    zIndex: -1,
    pointerEvents: 'none',
    transform: `rotate(${fragment.rotation}deg)`,
    willChange: 'opacity',
    transition: 'opacity 0.15s ease-out',
  };

  const contentStyle: React.CSSProperties = {
    width: '100%',
    height: fragment.height * (244 / fragment.width),
    maxHeight: 140,
    backgroundColor: fragment.bgColor,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 500,
    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
    position: 'relative',
    zIndex: 2,
  };

  const checkmarkStyle: React.CSSProperties = {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    backgroundColor: '#22c55e',
    borderRadius: '50%',
    display: fragment.isCorrect ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 700,
    animation: 'checkmark 0.3s ease-out',
    zIndex: 10,
  };

  const labelStyle: React.CSSProperties = {
    marginTop: 8,
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    position: 'relative',
    zIndex: 2,
  };

  const cardClass = flashRed ? 'fragment-card fragment-card-shake' : 'fragment-card';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="fragment-item"
      {...attributes}
      {...listeners}
    >
      <div className={cardClass} style={cardStyle}>
        <div style={shadowStyle} />
        <div style={checkmarkStyle}>✓</div>
        <div className="fragment-content" style={contentStyle}>
          {fragment.name}
        </div>
        <div style={labelStyle}>{fragment.name}</div>
      </div>
    </div>
  );
});

FragmentCard.displayName = 'FragmentCard';

const FragmentPanel: React.FC = () => {
  const { fragments, flashRed } = useGameStore();
  const { isDragging, draggingId } = useDragHandlers();

  const panelStyle: React.CSSProperties = {
    width: 280,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRight: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    overflowY: 'auto',
    overflowX: 'hidden',
    flexShrink: 0,
  };

  const headerStyle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 600,
    color: '#0f172a',
    marginBottom: 4,
  };

  const unplacedFragments = fragments.filter((f) => !f.isCorrect);

  return (
    <div className="fragment-panel" style={panelStyle}>
      <h2 style={headerStyle}>可用碎片</h2>
      {unplacedFragments.map((fragment) => (
        <FragmentCard
          key={fragment.id}
          fragment={fragment}
          isDragging={isDragging && draggingId === fragment.id}
          flashRed={flashRed === fragment.id}
        />
      ))}
      {unplacedFragments.length === 0 && (
        <div
          style={{
            color: '#64748b',
            fontSize: 14,
            textAlign: 'center',
            padding: 20,
          }}
        >
          所有碎片已放置完成
        </div>
      )}
      <style>{`
        .fragment-card:hover {
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          transform: translateY(-4px);
        }
        .fragment-card:active {
          cursor: grabbing;
        }
        .fragment-card-shake {
          animation: shake 0.2s ease-in-out;
        }
        .fragment-item {
          will-change: transform;
        }
        @media (max-width: 1000px) {
          .fragment-panel {
            width: 180px !important;
          }
          .fragment-item {
            width: 160px !important;
          }
          .fragment-card {
            width: 100% !important;
          }
          .fragment-content {
            font-size: 10px !important;
          }
        }
        @media (max-width: 768px) {
          .fragment-panel {
            width: 100% !important;
            height: 200px !important;
            flex-direction: row !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
            border-right: none !important;
            border-bottom: 1px solid #e2e8f0 !important;
          }
          .fragment-item {
            width: 140px !important;
            flex-shrink: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default memo(FragmentPanel);
