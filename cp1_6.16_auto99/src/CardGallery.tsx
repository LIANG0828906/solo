import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SilhouetteCard, Point } from './types';

interface CardGalleryProps {
  cards: SilhouetteCard[];
  currentVertices: Point[];
  onCardClick: (card: SilhouetteCard) => void;
  onTimerSave?: () => void;
  isRecording?: boolean;
}

const CardGallery: React.FC<CardGalleryProps> = ({
  cards,
  currentVertices,
  onCardClick,
  onTimerSave,
  isRecording = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardCanvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const hasTriggeredSaveRef = useRef<boolean>(false);

  const sortedCards = [...cards].sort((a, b) => b.createdAt - a.createdAt);

  const formatTime = (ms: number): string => {
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;
  };

  const drawTrajectory = useCallback((ctx: CanvasRenderingContext2D, vertices: Point[], width: number, height: number) => {
    if (vertices.length < 2) return;

    const minX = Math.min(...vertices.map(v => v.x));
    const maxX = Math.max(...vertices.map(v => v.x));
    const minY = Math.min(...vertices.map(v => v.y));
    const maxY = Math.max(...vertices.map(v => v.y));

    const vertexWidth = maxX - minX || 1;
    const vertexHeight = maxY - minY || 1;
    const scale = Math.min((width - 40) / vertexWidth, (height - 40) / vertexHeight);
    const offsetX = (width - vertexWidth * scale) / 2 - minX * scale;
    const offsetY = (height - vertexHeight * scale) / 2 - minY * scale;

    ctx.beginPath();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const firstPoint = vertices[0];
    ctx.moveTo(firstPoint.x * scale + offsetX, firstPoint.y * scale + offsetY);

    for (let i = 1; i < vertices.length; i++) {
      const point = vertices[i];
      ctx.lineTo(point.x * scale + offsetX, point.y * scale + offsetY);
    }

    ctx.closePath();
    ctx.stroke();
  }, []);

  const drawCardThumbnail = useCallback((canvas: HTMLCanvasElement, card: SilhouetteCard) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (card.vertices.length < 2) return;

    const minX = Math.min(...card.vertices.map(v => v.x));
    const maxX = Math.max(...card.vertices.map(v => v.x));
    const minY = Math.min(...card.vertices.map(v => v.y));
    const maxY = Math.max(...card.vertices.map(v => v.y));

    const vertexWidth = maxX - minX || 1;
    const vertexHeight = maxY - minY || 1;
    const scale = Math.min((width - 20) / vertexWidth, (height - 20) / vertexHeight);
    const offsetX = (width - vertexWidth * scale) / 2 - minX * scale;
    const offsetY = (height - vertexHeight * scale) / 2 - minY * scale;

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate((card.rotation * Math.PI) / 180);
    ctx.translate(-width / 2, -height / 2);

    ctx.beginPath();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';

    const firstPoint = card.vertices[0];
    ctx.moveTo(firstPoint.x * scale + offsetX, firstPoint.y * scale + offsetY);

    for (let i = 1; i < card.vertices.length; i++) {
      const point = card.vertices[i];
      ctx.lineTo(point.x * scale + offsetX, point.y * scale + offsetY);
    }

    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(10, 25, 47, 0.7)';
    ctx.beginPath();
    const radius = 12;
    ctx.moveTo(radius, 0);
    ctx.lineTo(width - radius, 0);
    ctx.quadraticCurveTo(width, 0, width, radius);
    ctx.lineTo(width, height - radius);
    ctx.quadraticCurveTo(width, height, width - radius, height);
    ctx.lineTo(radius, height);
    ctx.quadraticCurveTo(0, height, 0, height - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.fill();

    drawTrajectory(ctx, currentVertices, width, height);
  }, [currentVertices, drawTrajectory]);

  useEffect(() => {
    sortedCards.forEach(card => {
      const canvas = cardCanvasRefs.current.get(card.id);
      if (canvas) {
        drawCardThumbnail(canvas, card);
      }
    });
  }, [sortedCards, drawCardThumbnail]);

  useEffect(() => {
    if (isRecording) {
      startTimeRef.current = performance.now() - elapsedTime;
      hasTriggeredSaveRef.current = false;

      const updateTimer = () => {
        const now = performance.now();
        const elapsed = now - startTimeRef.current;
        setElapsedTime(elapsed);

        if (elapsed >= 20 * 60 * 1000 && !hasTriggeredSaveRef.current) {
          hasTriggeredSaveRef.current = true;
          onTimerSave?.();
        }

        animationFrameRef.current = requestAnimationFrame(updateTimer);
      };

      animationFrameRef.current = requestAnimationFrame(updateTimer);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRecording, onTimerSave]);

  const setCardCanvasRef = (cardId: string) => (canvas: HTMLCanvasElement | null) => {
    if (canvas) {
      cardCanvasRefs.current.set(cardId, canvas);
    } else {
      cardCanvasRefs.current.delete(cardId);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
      padding: '16px',
      boxSizing: 'border-box',
    }}>
      <div style={{
        width: '260px',
        height: '120px',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      }}>
        <canvas
          ref={canvasRef}
          width={260}
          height={120}
          style={{ display: 'block' }}
        />
      </div>

      <div style={{
        fontSize: '24px',
        fontFamily: 'monospace',
        fontWeight: 'bold',
        color: '#ffffff',
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
        letterSpacing: '2px',
      }}>
        {formatTime(elapsedTime)}
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxHeight: 'calc(100vh - 280px)',
        overflowY: 'auto',
        padding: '8px',
        boxSizing: 'border-box',
      }}>
        {sortedCards.map(card => (
          <div
            key={card.id}
            onClick={() => onCardClick(card)}
            style={{
              width: '150px',
              height: '100px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              border: '2px solid rgba(200, 200, 200, 0.5)',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <canvas
              ref={setCardCanvasRef(card.id)}
              width={140}
              height={90}
              style={{ display: 'block' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CardGallery;
