import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useCardStore, Card, snapPositionToGrid, GRID_SIZE, CardPosition } from './store';

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

const getCardBorderRadius = (type: string): string => {
  switch (type) {
    case 'text': return '8px';
    case 'image': return '12px';
    case 'voice': return '16px';
    case 'todo': return '8px';
    default: return '8px';
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

interface CardItemProps {
  card: Card;
  isDragging: boolean;
  isOtherDragging: boolean;
  currentX: number;
  currentY: number;
  onMouseDown: (e: React.MouseEvent, card: Card) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onToggleTodo: (id: string) => void;
  onAnimationEnd: (id: string) => void;
}

const CardItem: React.FC<CardItemProps> = ({
  card,
  isDragging,
  isOtherDragging,
  currentX,
  currentY,
  onMouseDown,
  onRemove,
  onDuplicate,
  onToggleTodo,
  onAnimationEnd,
}) => {
  const cardStyle = getCardStyle(card.type);
  const [isEntered, setIsEntered] = useState(!card.isNew);

  useEffect(() => {
    if (card.isNew && !isEntered) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsEntered(true);
          setTimeout(() => onAnimationEnd(card.id), 200);
        });
      });
    }
  }, [card.isNew, card.id, isEntered, onAnimationEnd]);

  const getContentComponent = () => {
    switch (card.type) {
      case 'text':
        return <TextCardContent card={card} />;
      case 'image':
        return <ImageCardContent card={card} />;
      case 'voice':
        return <VoiceCardContent card={card} />;
      case 'todo':
        return <TodoCardContent card={card} onToggle={() => onToggleTodo(card.id)} />;
      default:
        return null;
    }
  };

  const transformValue = card.isNew && !isEntered
    ? `translate(-100px, -100px) scale(0.8) rotate(${card.rotation}deg)`
    : `translate(0, 0) scale(1) rotate(${card.rotation}deg)`;

  const opacityValue = card.isNew && !isEntered ? 0 : 1;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${currentX}px`,
        top: `${currentY}px`,
        transform: transformValue,
        opacity: isDragging ? 0.7 : isOtherDragging ? 0.3 : opacityValue,
        transition: isDragging
          ? 'opacity 0.1s ease'
          : card.isNew
          ? 'transform 0.2s ease, opacity 0.2s ease'
          : 'opacity 0.15s ease, transform 0.15s ease',
        zIndex: isDragging ? 50 : 10,
        cursor: 'grab',
        userSelect: 'none',
      }}
      onMouseDown={(e) => onMouseDown(e, card)}
    >
      <div style={cardStyle}>
        {getContentComponent()}
      </div>

      <div
        className="card-actions"
        style={{
          position: 'absolute',
          right: '-8px',
          bottom: '-8px',
          display: 'flex',
          gap: '4px',
          opacity: 0,
          transition: 'opacity 0.15s ease',
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate(card.id);
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
            onRemove(card.id);
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

  const snappedPosition = useMemo<CardPosition | null>(() => {
    if (!dragState.isDragging || !dragState.cardId || !gridEnabled) return null;
    return snapPositionToGrid({ x: dragState.currentX, y: dragState.currentY });
  }, [dragState.isDragging, dragState.cardId, dragState.currentX, dragState.currentY, gridEnabled]);

  const draggingCard = useMemo(() => {
    if (!dragState.cardId) return null;
    return cards.find((c) => c.id === dragState.cardId) || null;
  }, [dragState.cardId, cards]);

  const handleMouseDown = useCallback((e: React.MouseEvent, card: Card) => {
    e.preventDefault();
    e.stopPropagation();

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
  }, []);

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

    const finalX = snapPositionToGrid({
      x: dragStateRef.current.currentX,
      y: dragStateRef.current.currentY,
    }).x;
    const finalY = snapPositionToGrid({
      x: dragStateRef.current.currentX,
      y: dragStateRef.current.currentY,
    }).y;

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

  const handleAnimationEnd = useCallback((cardId: string) => {
    markCardAsSeen(cardId);
  }, [markCardAsSeen]);

  const handleToggleTodo = useCallback((id: string) => {
    const card = cards.find((c) => c.id === id);
    if (card) {
      updateCard(id, { checked: !card.checked });
    }
  }, [cards, updateCard]);

  const gridStyle: React.CSSProperties = {
    backgroundImage: `
      linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
    `,
    backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
    opacity: showGrid ? 1 : 0,
    transition: 'opacity 0.3s ease',
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
  };

  return (
    <>
      <div
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: '#1F2937',
          overflow: 'auto',
        }}
      >
        <style>{`
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
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            transition: 'transform 0.15s ease',
          }}
        >
          <div style={gridStyle} />

          {snappedPosition && draggingCard && (
            <div
              style={{
                position: 'absolute',
                left: `${snappedPosition.x}px`,
                top: `${snappedPosition.y}px`,
                width: draggingCard.type === 'image' ? '240px' : 'auto',
                minWidth: '200px',
                minHeight: '40px',
                border: '2px dashed #3B82F6',
                borderRadius: getCardBorderRadius(draggingCard.type),
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                opacity: 0.6,
                pointerEvents: 'none',
                zIndex: 5,
                transition: 'left 0.05s ease, top 0.05s ease',
              }}
            />
          )}

          {cards.map((card) => {
            const isDragging = dragState.isDragging && dragState.cardId === card.id;
            const isOtherDragging = dragState.isDragging && dragState.cardId !== card.id;

            let currentX = card.position.x;
            let currentY = card.position.y;

            if (isDragging) {
              currentX = dragState.currentX;
              currentY = dragState.currentY;
            }

            return (
              <CardItem
                key={card.id}
                card={card}
                isDragging={isDragging}
                isOtherDragging={isOtherDragging}
                currentX={currentX}
                currentY={currentY}
                onMouseDown={handleMouseDown}
                onRemove={removeCard}
                onDuplicate={duplicateCard}
                onToggleTodo={handleToggleTodo}
                onAnimationEnd={handleAnimationEnd}
              />
            );
          })}
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
            transition: 'all 0.1s ease',
          }}
        >
          {Math.round(zoom * 100)}%
        </span>
        <input
          type="range"
          min="25"
          max="200"
          value={zoom * 100}
          onInput={(e) => setZoom(Number(e.target.value) / 100)}
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
