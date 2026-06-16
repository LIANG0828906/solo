import React, { useCallback, useEffect, useRef } from 'react';
import { Track } from '../store/useStore';

interface RecordCardProps {
  track: Track;
  size?: 'small' | 'medium' | 'large';
  draggable?: boolean;
  isFlashing?: boolean;
  onDragStart?: (track: Track, e: React.DragEvent) => void;
  onDragEnd?: () => void;
  onClick?: (track: Track) => void;
}

const RecordCard: React.FC<RecordCardProps> = React.memo(({
  track,
  size = 'medium',
  draggable = false,
  isFlashing = false,
  onDragStart,
  onDragEnd,
  onClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragImageRef = useRef<HTMLDivElement | null>(null);

  const sizeMap = {
    small: { width: 50, height: 50 },
    medium: { width: 120, height: 140 },
    large: { width: 200, height: 200 },
  };

  const dimensions = sizeMap[size];

  const drawCover = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const { coverColors, coverPattern } = track;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 2;

    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, coverColors[0]);
    gradient.addColorStop(0.5, coverColors[1]);
    gradient.addColorStop(1, coverColors[2]);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.clip();

    ctx.globalAlpha = 0.3;

    switch (coverPattern) {
      case 'circles':
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2;
          const r = radius * 0.3;
          const x = centerX + Math.cos(angle) * r;
          const y = centerY + Math.sin(angle) * r;
          const circleRadius = radius * 0.15;

          ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#000000';
          ctx.beginPath();
          ctx.arc(x, y, circleRadius, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case 'triangles':
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          const r = radius * 0.4;
          const x = centerX + Math.cos(angle) * r;
          const y = centerY + Math.sin(angle) * r;
          const triSize = radius * 0.2;

          ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#000000';
          ctx.beginPath();
          ctx.moveTo(x, y - triSize);
          ctx.lineTo(x - triSize * 0.866, y + triSize * 0.5);
          ctx.lineTo(x + triSize * 0.866, y + triSize * 0.5);
          ctx.closePath();
          ctx.fill();
        }
        break;

      case 'squares':
        for (let i = 0; i < 4; i++) {
          const angle = (i / 4) * Math.PI * 2;
          const r = radius * 0.35;
          const x = centerX + Math.cos(angle) * r;
          const y = centerY + Math.sin(angle) * r;
          const sqSize = radius * 0.25;

          ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#000000';
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle + Math.PI / 4);
          ctx.fillRect(-sqSize / 2, -sqSize / 2, sqSize, sqSize);
          ctx.restore();
        }
        break;

      case 'waves':
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          const baseY = centerY - radius * 0.3 + i * radius * 0.3;
          for (let x = centerX - radius; x < centerX + radius; x += 2) {
            const waveY = baseY + Math.sin(x * 0.05) * 8;
            if (x === centerX - radius) {
              ctx.moveTo(x, waveY);
            } else {
              ctx.lineTo(x, waveY);
            }
          }
          ctx.stroke();
        }
        break;
    }

    ctx.restore();

    const centerRadius = radius * 0.2;
    ctx.fillStyle = '#E63946';
    ctx.beginPath();
    ctx.arc(centerX, centerY, centerRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(centerX, centerY, centerRadius * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }, [track]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    drawCover(ctx, dimensions.width, dimensions.height);
  }, [drawCover, dimensions.width, dimensions.height]);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(track, e);
    }

    if (dragImageRef.current) {
      e.dataTransfer.setDragImage(dragImageRef.current, 60, 70);
    }

    e.dataTransfer.effectAllowed = 'move';
  }, [track, onDragStart]);

  const handleDragEnd = useCallback(() => {
    if (onDragEnd) {
      onDragEnd();
    }
  }, [onDragEnd]);

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(track);
    }
  }, [track, onClick]);

  if (size === 'small') {
    return (
      <div
        style={{
          width: dimensions.width,
          height: dimensions.height,
          borderRadius: '8px',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: dimensions.width,
            height: dimensions.height,
            display: 'block',
            borderRadius: '8px',
          }}
        />
      </div>
    );
  }

  return (
    <>
      <div
        draggable={draggable}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleClick}
        style={{
          width: dimensions.width,
          height: dimensions.height,
          borderRadius: '12px',
          position: 'relative',
          cursor: draggable ? 'grab' : onClick ? 'pointer' : 'default',
          overflow: 'hidden',
          boxShadow: isFlashing
            ? '0 0 20px 4px rgba(255, 215, 0, 0.8)'
            : '0 4px 12px rgba(0, 0, 0, 0.4)',
          border: isFlashing ? '2px solid #FFD700' : 'none',
          transition: 'box-shadow 0.2s ease, transform 0.2s ease, border 0.2s ease',
          willChange: 'transform, opacity',
        }}
        onMouseEnter={(e) => {
          if (draggable || onClick) {
            e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
        }}
        onMouseDown={(e) => {
          if (draggable) {
            e.currentTarget.style.transform = 'translateY(-2px) scale(0.98)';
            e.currentTarget.style.cursor = 'grabbing';
          }
        }}
        onMouseUp={(e) => {
          if (draggable) {
            e.currentTarget.style.cursor = 'grab';
          }
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: dimensions.width,
            height: dimensions.width,
            display: 'block',
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.1) 100%)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '40%',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 100%)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '8px 10px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
            color: '#ffffff',
            fontFamily: 'monospace',
            fontSize: '11px',
          }}
        >
          <div
            style={{
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textShadow: '0 1px 2px rgba(0,0,0,0.8)',
            }}
          >
            {track.title}
          </div>
          <div
            style={{
              fontSize: '10px',
              opacity: 0.8,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {track.artist}
          </div>
        </div>
      </div>

      {draggable && (
        <div
          ref={dragImageRef}
          style={{
            position: 'absolute',
            left: '-9999px',
            top: '-9999px',
            width: dimensions.width,
            height: dimensions.height,
            filter: 'blur(2px)',
            opacity: 0.6,
            pointerEvents: 'none',
          }}
        >
          <canvas
            width={dimensions.width * 2}
            height={dimensions.height * 2}
            ref={(el) => {
              if (el) {
                const ctx = el.getContext('2d');
                if (ctx) {
                  ctx.scale(2, 2);
                  drawCover(ctx, dimensions.width, dimensions.width);
                }
              }
            }}
            style={{
              width: dimensions.width,
              height: dimensions.width,
              display: 'block',
            }}
          />
        </div>
      )}
    </>
  );
});

RecordCard.displayName = 'RecordCard';

export default RecordCard;
