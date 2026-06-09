import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import type { Bubble, Cluster } from '../types';

interface BubbleCanvasProps {
  bubbles: Bubble[];
  clusters: Cluster[];
  highlightedCluster: string | null;
  filteredCluster: string | null;
  onUpdateBubble: (id: string, updates: Partial<Bubble>) => void;
  onDeleteBubble: (id: string) => void;
  onAnalyze: () => void;
}

interface DragState {
  isDragging: boolean;
  bubbleId: string | null;
  offsetX: number;
  offsetY: number;
}

interface AnimationState {
  [bubbleId: string]: {
    appearProgress: number;
    bounceProgress: number;
    deleteProgress: number;
  };
}

const BubbleItem: React.FC<{
  bubble: Bubble;
  clusterColor?: string;
  isHighlighted: boolean;
  isFiltered: boolean;
  animationState: { appearProgress: number; bounceProgress: number; deleteProgress: number };
  onMouseDown: (e: React.MouseEvent, id: string) => void;
  onTouchStart: (e: React.TouchEvent, id: string) => void;
  onDoubleClick: (id: string) => void;
  onDelete: (id: string) => void;
  onEditComplete: (id: string, content: string) => void;
  highlightAnimTime: number;
}> = memo(({
  bubble,
  clusterColor,
  isHighlighted,
  isFiltered,
  animationState,
  onMouseDown,
  onTouchStart,
  onDoubleClick,
  onDelete,
  onEditComplete,
  highlightAnimTime
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [editValue, setEditValue] = useState(bubble.content);

  useEffect(() => {
    if (bubble.isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [bubble.isEditing]);

  useEffect(() => {
    setEditValue(bubble.content);
  }, [bubble.content]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  };

  const getSentimentColor = (sentiment?: number) => {
    if (sentiment === undefined) return '#888';
    const green = Math.floor((sentiment / 100) * 255);
    const red = Math.floor((1 - sentiment / 100) * 255);
    return `rgb(${red}, ${green}, 0)`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onEditComplete(bubble.id, editValue);
    } else if (e.key === 'Escape') {
      onEditComplete(bubble.id, bubble.content);
    }
  };

  const appearY = (1 - animationState.appearProgress) * 50;
  const appearOpacity = animationState.appearProgress;

  const bounceScale = 1 + Math.sin(animationState.bounceProgress * Math.PI) * 0.1;
  const deleteScale = 1 - animationState.deleteProgress;
  const deleteOpacity = 1 - animationState.deleteProgress;

  const scale = bounceScale * deleteScale;
  const opacity = Math.min(appearOpacity, deleteOpacity);

  const glowIntensity = isHighlighted ? (Math.sin(highlightAnimTime * Math.PI * 2) * 0.5 + 0.5) : 0;

  const bubbleStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${bubble.x}px`,
    top: `${bubble.y}px`,
    transform: `translate(${appearY * 0}px, ${appearY}px) scale(${scale})`,
    opacity,
    backgroundColor: '#ffffff88',
    borderRadius: '12px',
    padding: '12px 16px',
    minWidth: '120px',
    maxWidth: '280px',
    cursor: bubble.isEditing ? 'text' : 'grab',
    userSelect: 'none',
    transition: bubble.isEditing ? 'box-shadow 0.2s ease' : 'none',
    boxShadow: bubble.isEditing
      ? `0 0 0 2px #2196f3, 0 4px 12px rgba(0,0,0,0.3)`
      : isHighlighted
        ? `0 0 ${10 + glowIntensity * 15}px ${clusterColor || '#2196f3'}, 0 4px 12px rgba(0,0,0,0.3)`
        : '0 2px 8px rgba(0,0,0,0.2)',
    willChange: 'transform, opacity',
    backdropFilter: 'blur(8px)',
    zIndex: isHighlighted ? 10 : 1
  };

  if (isFiltered && !isHighlighted) {
    bubbleStyle.opacity = opacity * 0.2;
  }

  return (
    <div
      style={bubbleStyle}
      onMouseDown={(e) => !bubble.isEditing && onMouseDown(e, bubble.id)}
      onTouchStart={(e) => !bubble.isEditing && onTouchStart(e, bubble.id)}
      onDoubleClick={() => !bubble.isEditing && onDoubleClick(bubble.id)}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(bubble.id);
        }}
        style={{
          position: 'absolute',
          top: '-8px',
          right: '-8px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: '#f44336',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          fontSize: '12px',
          lineHeight: '1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s ease',
          opacity: 0,
          transform: 'scale(0.8)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(0.8)';
          e.currentTarget.style.opacity = '0';
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
      >
        ×
      </button>

      {bubble.isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => onEditComplete(bubble.id, editValue)}
          style={{
            width: '100%',
            border: 'none',
            background: 'transparent',
            fontSize: '14px',
            color: '#1e1e1e',
            outline: 'none',
            fontFamily: 'inherit'
          }}
        />
      ) : (
        <div style={{ fontSize: '14px', color: '#1e1e1e', fontWeight: 500, wordBreak: 'break-word' }}>
          {bubble.content}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '11px' }}>
        <span style={{ color: '#666' }}>{formatTime(bubble.timestamp)}</span>
        <span style={{
          backgroundColor: bubble.source === 'voice' ? '#2196f3' : '#4caf50',
          color: 'white',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '10px'
        }}>
          {bubble.source === 'voice' ? '语音' : '文字'}
        </span>
      </div>

      {bubble.sentiment !== undefined && (
        <div style={{
          marginTop: '6px',
          fontSize: '10px',
          color: getSentimentColor(bubble.sentiment),
          fontWeight: 600,
          textAlign: 'center'
        }}>
          情感值: {bubble.sentiment}
        </div>
      )}
    </div>
  );
});

BubbleItem.displayName = 'BubbleItem';

const BubbleCanvas: React.FC<BubbleCanvasProps> = ({
  bubbles,
  clusters,
  highlightedCluster,
  filteredCluster,
  onUpdateBubble,
  onDeleteBubble,
  onAnalyze
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<DragState>({ isDragging: false, bubbleId: null, offsetX: 0, offsetY: 0 });
  const animationRef = useRef<number>(0);
  const animationStateRef = useRef<AnimationState>({});
  const lastTimeRef = useRef<number>(0);
  const [, forceUpdate] = useState(0);
  const [highlightAnimTime, setHighlightAnimTime] = useState(0);

  const getClusterColor = useCallback((clusterName?: string) => {
    if (!clusterName) return undefined;
    return clusters.find(c => c.name === clusterName)?.color;
  }, [clusters]);

  const ensureAnimationState = useCallback((bubbleId: string) => {
    if (!animationStateRef.current[bubbleId]) {
      animationStateRef.current[bubbleId] = {
        appearProgress: 0,
        bounceProgress: 0,
        deleteProgress: 0
      };
    }
    return animationStateRef.current[bubbleId];
  }, []);

  const animate = useCallback((currentTime: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = currentTime;
    const deltaTime = (currentTime - lastTimeRef.current) / 1000;
    lastTimeRef.current = currentTime;

    let needsUpdate = false;

    for (const bubble of bubbles) {
      const state = ensureAnimationState(bubble.id);

      if (state.appearProgress < 1) {
        state.appearProgress = Math.min(1, state.appearProgress + deltaTime / 0.3);
        needsUpdate = true;
      }

      if (bubble.isBouncing && state.bounceProgress < 1) {
        state.bounceProgress = Math.min(1, state.bounceProgress + deltaTime / 0.2);
        if (state.bounceProgress >= 1) {
          onUpdateBubble(bubble.id, { isBouncing: false });
        }
        needsUpdate = true;
      }

      if (bubble.isDeleting && state.deleteProgress < 1) {
        state.deleteProgress = Math.min(1, state.deleteProgress + deltaTime / 0.3);
        needsUpdate = true;
      }
    }

    setHighlightAnimTime(prev => (prev + deltaTime * 2) % 1);

    if (needsUpdate) {
      forceUpdate(prev => prev + 1);
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [bubbles, ensureAnimationState, onUpdateBubble]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  const handleMouseDown = useCallback((e: React.MouseEvent, bubbleId: string) => {
    e.preventDefault();
    const bubble = bubbles.find(b => b.id === bubbleId);
    if (!bubble || bubble.isEditing) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    dragStateRef.current = {
      isDragging: true,
      bubbleId,
      offsetX: e.clientX - rect.left - bubble.x,
      offsetY: e.clientY - rect.top - bubble.y
    };
  }, [bubbles]);

  const handleTouchStart = useCallback((e: React.TouchEvent, bubbleId: string) => {
    const touch = e.touches[0];
    const bubble = bubbles.find(b => b.id === bubbleId);
    if (!bubble || bubble.isEditing) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    dragStateRef.current = {
      isDragging: true,
      bubbleId,
      offsetX: touch.clientX - rect.left - bubble.x,
      offsetY: touch.clientY - rect.top - bubble.y
    };
  }, [bubbles]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStateRef.current.isDragging || !dragStateRef.current.bubbleId) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const newX = Math.max(0, Math.min(rect.width - 150, e.clientX - rect.left - dragStateRef.current.offsetX));
      const newY = Math.max(0, Math.min(rect.height - 100, e.clientY - rect.top - dragStateRef.current.offsetY));

      onUpdateBubble(dragStateRef.current.bubbleId, { x: newX, y: newY });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!dragStateRef.current.isDragging || !dragStateRef.current.bubbleId) return;

      const touch = e.touches[0];
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const newX = Math.max(0, Math.min(rect.width - 150, touch.clientX - rect.left - dragStateRef.current.offsetX));
      const newY = Math.max(0, Math.min(rect.height - 100, touch.clientY - rect.top - dragStateRef.current.offsetY));

      onUpdateBubble(dragStateRef.current.bubbleId, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      dragStateRef.current.isDragging = false;
      dragStateRef.current.bubbleId = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [onUpdateBubble]);

  const handleDoubleClick = useCallback((id: string) => {
    onUpdateBubble(id, { isEditing: true });
  }, [onUpdateBubble]);

  const handleEditComplete = useCallback((id: string, content: string) => {
    onUpdateBubble(id, { content, isEditing: false, isBouncing: true });
    const state = animationStateRef.current[id];
    if (state) {
      state.bounceProgress = 0;
    }
    setTimeout(() => onAnalyze(), 300);
  }, [onUpdateBubble, onAnalyze]);

  const canvasStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    background: `
      radial-gradient(circle at 20% 30%, rgba(33, 150, 243, 0.05) 0%, transparent 50%),
      radial-gradient(circle at 80% 70%, rgba(76, 175, 80, 0.05) 0%, transparent 50%),
      radial-gradient(circle at 50% 50%, rgba(255, 152, 0, 0.03) 0%, transparent 60%)
    `
  };

  const sortedBubbles = [...bubbles].sort((a, b) => a.createdAt - b.createdAt);

  return (
    <div ref={containerRef} style={canvasStyle}>
      {sortedBubbles.map(bubble => {
        const state = ensureAnimationState(bubble.id);
        const isHighlighted = highlightedCluster !== null && bubble.cluster === highlightedCluster;
        const isFiltered = filteredCluster !== null && bubble.cluster !== filteredCluster;
        const clusterColor = getClusterColor(bubble.cluster);

        return (
          <BubbleItem
            key={bubble.id}
            bubble={bubble}
            clusterColor={clusterColor}
            isHighlighted={isHighlighted}
            isFiltered={isFiltered}
            animationState={state}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onDoubleClick={handleDoubleClick}
            onDelete={onDeleteBubble}
            onEditComplete={handleEditComplete}
            highlightAnimTime={highlightAnimTime}
          />
        );
      })}

      {bubbles.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#666',
          fontSize: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>💡</div>
          <div>点击下方麦克风按钮开始记录创意</div>
        </div>
      )}
    </div>
  );
};

export default BubbleCanvas;
