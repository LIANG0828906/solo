import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useCardStore, Card, snapToGrid } from './store';

interface CanvasProps {
  canvasRef: React.RefObject<HTMLDivElement>;
}

interface DragState {
  isDragging: boolean;
  cardId: string | null;
  startX: number;
  startY: number;
  cardStartX: number;
  cardStartY: number;
  currentX: number;
  currentY: number;
}

const GRID_SIZE = 16;

const getCardStyle = (type: string): React.CSSProperties => {
  switch (type) {
    case 'text':
      return {
        minWidth: '200px',
        maxWidth: '300px',
        padding: '16px',
        backgroundColor: 'white',
        border: '2px solid #3B82F6',
        borderRadius: '8px',
        color: '#111827',
        fontSize: '14px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      };
    case 'image':
      return {
        width: '240px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        backgroundColor: 'transparent',
      };
    case 'voice':
      return {
        minWidth: '200px',
        maxWidth: '280px',
        padding: '16px',
        backgroundColor: '#7C3AED',
        borderRadius: '16px',
        color: 'white',
      };
    case 'todo':
      return {
        minWidth: '200px',
        maxWidth: '300px',
        padding: '12px 16px',
        backgroundColor: 'white',
        borderRadius: '8px',
        borderLeft: '4px solid #EF4444',
      };
    default:
      return {};
  }
};

const TextCardContent: React.FC<{ card: Card }> = ({ card }) => (
  <div style={{ fontSize: '14px', color: '#111827', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
    {card.content}
  </div>
);

const ImageCardContent: React.FC<{ card: Card }> = ({ card }) => (
  card.imageUrl ? (
    <img
      src={card.imageUrl}
      alt=""
      style={{ width: '100%', display: 'block', borderRadius: '12px' }}
      draggable={false}
    />
  ) : null
);

const VoiceCardContent: React.FC<{ card: Card }> = ({ card }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (!card.audioUrl) return;
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <button
        onClick={togglePlay}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: 'rgba(255,255,255,0.2)',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          transition: 'background-color 0.2s ease',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)')}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>语音片段</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '16px' }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: '2px',
                height: `${8 + (Math.sin(i * 0.5) + 1) * 6}px`,
                backgroundColor: 'rgba(255,255,255,0.6)',
                borderRadius: '1px',
              }}
            />
          ))}
        </div>
      </div>
      {card.audioUrl && <audio ref={audioRef} src={card.audioUrl} onEnded={() => setIsPlaying(false)} />}
    </div>
  );
};

const TodoCardContent: React.FC<{ card: Card; onToggle: () => void }> = ({ card, onToggle }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <div
      onClick={onToggle}
      style={{
        width: '20px',
        height: '20px',
        borderRadius: '4px',
        border: card.checked ? '2px solid #10B981' : '2px solid #D1D5DB',
        backgroundColor: card.checked ? '#10B981' : 'white',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '12px',
        flexShrink: 0,
        transition: 'all 0.2s ease',
      }}
    >
      {card.checked && '✓'}
    </div>
    <div
      style={{
        fontSize: '14px',
        color: card.checked ? '#9CA3AF' : '#111827',
        textDecoration: card.checked ? 'line-through' : 'none',
        flex: 1,
        wordBreak: 'break-word',
      }}
    >
      {card.content}
    </div>
  </div>
);

export default function Canvas({ canvasRef }: CanvasProps) {
  const cards = useCardStore((state) => state.cards);
  const zoom = useCardStore((state) => state.zoom);
  const gridEnabled = useCardStore((state) => state.gridEnabled);
  const moveCard = useCardStore((state) => state.moveCard);
  const removeCard = useCardStore((state) => state.removeCard);
  const duplicateCard = useCardStore((state) => state.duplicateCard);
  const updateCard = useCardStore((state) => state.updateCard);
  const setZoom = useCardStore((state) => state.setZoom);
  const markCardAsSeen = useCardStore((state) => state.markCardAsSeen);

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    cardId: null,
    startX: 0,
    startY: 0,
    cardStartX: 0,
    cardStartY: 0,
    currentX: 0,
    currentY: 0,
  });

  const dragStateRef = useRef(dragState);
  dragStateRef.current = dragState;

  const showGrid = gridEnabled && zoom >= 0.8;

  const handleMouseDown = useCallback((e: React.MouseEvent, card: Card) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDragState({
      isDragging: true,
      cardId: card.id,
      startX: e.clientX,
      startY: e.clientY,
      cardStartX: card.position.x,
      cardStartY: card.position.y,
      currentX: card.position.x,
      currentY: card.position.y,
    });
  }, [canvasRef]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStateRef.current.isDragging || !dragStateRef.current.cardId) return;

    const dx = (e.clientX - dragStateRef.current.startX) / zoom;
    const dy = (e.clientY - dragStateRef.current.startY) / zoom;

    const newX = dragStateRef.current.cardStartX + dx;
    const newY = dragStateRef.current.cardStartY + dy;

    setDragState((prev) => ({
      ...prev,
      currentX: newX,
      currentY: newY,
    }));
  }, [zoom]);

  const handleMouseUp = useCallback(() => {
    if (!dragStateRef.current.isDragging || !dragStateRef.current.cardId) return;

    const finalX = snapToGrid(dragStateRef.current.currentX);
    const finalY = snapToGrid(dragStateRef.current.currentY);

    moveCard(dragStateRef.current.cardId, { x: finalX, y: finalY });

    setDragState({
      isDragging: false,
      cardId: null,
      startX: 0,
      startY: 0,
      cardStartX: 0,
      cardStartY: 0,
      currentX: 0,
      currentY: 0,
    });
  }, [moveCard]);

  useEffect(() => {
    if (dragState.isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  const handleCardLoad = useCallback((cardId: string) => {
    setTimeout(() => {
      markCardAsSeen(cardId);
    }, 300);
  }, [markCardAsSeen]);

  const renderCard = (card: Card) => {
    const isDragging = dragState.isDragging && dragState.cardId === card.id;
    const isOtherDragging = dragState.isDragging && dragState.cardId !== card.id;

    let currentX = card.position.x;
    let currentY = card.position.y;

    if (isDragging) {
      currentX = dragState.currentX;
      currentY = dragState.currentY;
    }

    const cardStyle = getCardStyle(card.type);

    const getContentComponent = () => {
      switch (card.type) {
        case 'text':
          return <TextCardContent card={card} />;
        case 'image':
          return <ImageCardContent card={card} />;
        case 'voice':
          return <VoiceCardContent card={card} />;
        case 'todo':
          return (
            <TodoCardContent
              card={card}
              onToggle={() => updateCard(card.id, { checked: !card.checked })}
            />
          );
        default:
          return null;
      }
    };

    const getAnimationStyle = (): React.CSSProperties => {
      if (!card.isNew) return {};

      handleCardLoad(card.id);

      return {
        animation: 'flyIn 0.2s ease forwards',
        transformOrigin: 'top left',
      };
    };

    return (
      <div
        key={card.id}
        style={{
          position: 'absolute',
          left: `${currentX}px`,
          top: `${currentY}px`,
          transform: `rotate(${card.rotation}deg)`,
          opacity: isDragging ? 0.7 : isOtherDragging ? 0.3 : 1,
          transition: isDragging ? 'none' : 'opacity 0.15s ease, transform 0.15s ease',
          zIndex: isDragging ? 50 : 10,
          cursor: 'grab',
          userSelect: 'none',
          ...getAnimationStyle(),
        }}
        onMouseDown={(e) => handleMouseDown(e, card)}
      >
        <div style={cardStyle}>
          {getContentComponent()}
        </div>

        <div
          style={{
            position: 'absolute',
            right: '-8px',
            bottom: '-8px',
            display: 'flex',
            gap: '4px',
            opacity: isDragging ? 0 : 0,
            transition: 'opacity 0.15s ease',
          }}
          className="card-actions"
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              duplicateCard(card.id);
            }}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#6B7280',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4B5563')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#6B7280')}
            title="复制"
          >
            ⎘
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeCard(card.id);
            }}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#6B7280',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#EF4444')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#6B7280')}
            title="删除"
          >
            ✕
          </button>
        </div>
      </div>
    );
  };

  const gridStyle: React.CSSProperties = showGrid
    ? {
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
        `,
        backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
      }
    : {};

  return (
    <>
      <div
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: '#1F2937',
          overflow: 'auto',
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
          transition: 'transform 0.15s ease',
          ...gridStyle,
        }}
      >
        <style>{`
          @keyframes flyIn {
            0% {
              opacity: 0;
              transform: translate(-50%, -50%) scale(0.8);
            }
            100% {
              opacity: 1;
              transform: translate(0, 0) scale(1);
            }
          }
          .card-actions {
            opacity: 0;
          }
          div:hover > .card-actions {
            opacity: 1;
          }
        `}</style>
        <div
          style={{
            position: 'relative',
            minWidth: '3000px',
            minHeight: '2000px',
            padding: '40px',
          }}
        >
          {cards.map(renderCard)}
        </div>
      </div>

      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '10px 20px',
          backgroundColor: '#1F2937',
          borderRadius: '12px',
          zIndex: 100,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: '14px',
            fontWeight: 500,
            minWidth: '50px',
            textAlign: 'center',
          }}
        >
          {Math.round(zoom * 100)}%
        </span>
        <input
          type="range"
          min="25"
          max="200"
          value={zoom * 100}
          onChange={(e) => setZoom(Number(e.target.value) / 100)}
          style={{
            width: '200px',
            height: '6px',
            borderRadius: '3px',
            background: '#374151',
            outline: 'none',
            WebkitAppearance: 'none',
            cursor: 'pointer',
          }}
        />
        <button
          onClick={() => setZoom(1)}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: '#374151',
            color: 'white',
            cursor: 'pointer',
            fontSize: '12px',
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4B5563')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#374151')}
        >
          重置
        </button>
      </div>
    </>
  );
}
