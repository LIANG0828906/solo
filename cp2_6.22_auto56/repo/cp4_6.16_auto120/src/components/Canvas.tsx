import { useRef, useEffect, useCallback, useState } from 'react';
import { useStore } from '../store';
import { Card } from './Card';
import './Canvas.css';

export function Canvas() {
  const {
    cards,
    canvasTransform,
    setCanvasTransform,
    selectCard,
    setEditingCard,
    showKnowledgeNetwork,
    getSimilarityPairs,
  } = useStore();

  const canvasRef = useRef<HTMLDivElement>(null);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, transformX: 0, transformY: 0 });
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);

  const similarityPairs = showKnowledgeNetwork ? getSimilarityPairs() : [];

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.2, Math.min(3, canvasTransform.scale * delta));

      const scaleChange = newScale / canvasTransform.scale;
      const newX = mouseX - (mouseX - canvasTransform.x) * scaleChange;
      const newY = mouseY - (mouseY - canvasTransform.y) * scaleChange;

      setCanvasTransform({
        x: newX,
        y: newY,
        scale: newScale,
      });
    },
    [canvasTransform, setCanvasTransform]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.target !== e.currentTarget && !(e.target as HTMLElement).classList.contains('canvas-grid')) {
        return;
      }

      selectCard(null);
      setEditingCard(null);
      isPanningRef.current = true;
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        transformX: canvasTransform.x,
        transformY: canvasTransform.y,
      };
    },
    [canvasTransform, selectCard, setEditingCard]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isPanningRef.current) return;

      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;

      setCanvasTransform({
        ...canvasTransform,
        x: panStartRef.current.transformX + dx,
        y: panStartRef.current.transformY + dy,
      });
    };

    const handleMouseUp = () => {
      isPanningRef.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [canvasTransform, setCanvasTransform]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  const getCardCenter = (cardId: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return { x: 0, y: 0 };
    return {
      x: card.x + card.width / 2,
      y: card.y + card.height / 2,
    };
  };

  const renderKnowledgeLines = () => {
    if (!showKnowledgeNetwork || similarityPairs.length === 0) return null;

    return (
      <svg className="knowledge-network" style={{ pointerEvents: 'none' }}>
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4a90d9" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#e8a0bf" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        {similarityPairs.map((pair, index) => {
          const pos1 = getCardCenter(pair.cardId1);
          const pos2 = getCardCenter(pair.cardId2);
          const midX = (pos1.x + pos2.x) / 2;
          const midY = (pos1.y + pos2.y) / 2 - 30;
          const isHovered = hoveredLine === index;
          const strokeWidth = isHovered ? 3 : 1.5;
          const opacity = isHovered ? 1 : 0.5;

          return (
            <g key={index} style={{ pointerEvents: 'stroke' }}>
              <path
                d={`M ${pos1.x} ${pos1.y} Q ${midX} ${midY} ${pos2.x} ${pos2.y}`}
                stroke="url(#lineGradient)"
                strokeWidth={strokeWidth}
                fill="none"
                opacity={opacity}
                style={{
                  cursor: 'pointer',
                  transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                }}
                onMouseEnter={() => setHoveredLine(index)}
                onMouseLeave={() => setHoveredLine(null)}
              />
              {isHovered && (
                <text
                  x={(pos1.x + pos2.x) / 2}
                  y={(pos1.y + pos2.y) / 2 - 35}
                  textAnchor="middle"
                  fill="#ff8c42"
                  fontSize="12"
                  fontWeight="600"
                >
                  {Math.round(pair.similarity * 100)}%
                </text>
              )}
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div
      ref={canvasRef}
      className="canvas-container"
      onMouseDown={handleMouseDown}
    >
      <div
        className="canvas-content"
        style={{
          transform: `translate(${canvasTransform.x}px, ${canvasTransform.y}px) scale(${canvasTransform.scale})`,
          transformOrigin: '0 0',
        }}
      >
        <div className="canvas-grid" />
        {renderKnowledgeLines()}
        {cards.map((card) => (
          <Card key={card.id} card={card} scale={canvasTransform.scale} />
        ))}
      </div>

      <div className="canvas-hint">
        <span>拖拽画布移动 · 滚轮缩放 · 双击卡片编辑</span>
      </div>
    </div>
  );
}
