import { useEffect, useRef, useState, useCallback } from 'react';
import type { RadarDimension } from '@/types';
import { RADAR_LABELS } from '@/types';

interface CanvasRadarProps {
  scores: Record<RadarDimension, number>;
  size?: number;
  editable?: boolean;
  onChange?: (scores: Record<RadarDimension, number>) => void;
}

const DIMENSIONS: RadarDimension[] = ['frontend', 'backend', 'design', 'dataAnalysis', 'softSkills'];
const FILL_COLOR = 'rgba(99, 102, 241, 0.63)';
const STROKE_COLOR = '#4F46E5';
const GRID_COLOR = '#E5E7EB';
const TEXT_COLOR = '#6B7280';

export function CanvasRadar({
  scores,
  size = 300,
  editable = false,
  onChange,
}: CanvasRadarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [localScores, setLocalScores] = useState(scores);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const animationRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);

  useEffect(() => {
    setLocalScores(scores);
  }, [scores]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 50;
    const angleStep = (Math.PI * 2) / DIMENSIONS.length;

    ctx.clearRect(0, 0, size, size);

    for (let i = 5; i >= 1; i--) {
      const r = (radius / 5) * i;
      ctx.beginPath();
      ctx.strokeStyle = GRID_COLOR;
      ctx.lineWidth = 1;
      for (let j = 0; j <= DIMENSIONS.length; j++) {
        const angle = j * angleStep - Math.PI / 2;
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);
        if (j === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.stroke();
    }

    for (let i = 0; i < DIMENSIONS.length; i++) {
      const angle = i * angleStep - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + radius * Math.cos(angle),
        centerY + radius * Math.sin(angle)
      );
      ctx.strokeStyle = GRID_COLOR;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.beginPath();
    for (let i = 0; i < DIMENSIONS.length; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const score = localScores[DIMENSIONS[i]] / 100;
      const r = radius * score;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fillStyle = FILL_COLOR;
    ctx.fill();
    ctx.strokeStyle = STROKE_COLOR;
    ctx.lineWidth = 2;
    ctx.stroke();

    for (let i = 0; i < DIMENSIONS.length; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const score = localScores[DIMENSIONS[i]] / 100;
      const r = radius * score;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = STROKE_COLOR;
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.fillStyle = TEXT_COLOR;
    ctx.font = '13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i < DIMENSIONS.length; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const labelRadius = radius + 30;
      const x = centerX + labelRadius * Math.cos(angle);
      const y = centerY + labelRadius * Math.sin(angle);
      ctx.fillText(RADAR_LABELS[DIMENSIONS[i]], x, y);
    }
  }, [size, localScores]);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (timestamp - lastFrameRef.current >= 33) {
        draw();
        lastFrameRef.current = timestamp;
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [draw]);

  const getPositionOnCanvas = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    []
  );

  const findNearestVertex = useCallback(
    (x: number, y: number): number | null => {
      const centerX = size / 2;
      const centerY = size / 2;
      const radius = size / 2 - 50;
      const angleStep = (Math.PI * 2) / DIMENSIONS.length;
      const threshold = 20;

      for (let i = 0; i < DIMENSIONS.length; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const score = localScores[DIMENSIONS[i]] / 100;
        const r = radius * score;
        const vx = centerX + r * Math.cos(angle);
        const vy = centerY + r * Math.sin(angle);
        
        const dist = Math.sqrt((x - vx) ** 2 + (y - vy) ** 2);
        if (dist < threshold) {
          return i;
        }
      }
      return null;
    },
    [size, localScores]
  );

  const updateScoreFromPosition = useCallback(
    (index: number, x: number, y: number) => {
      const centerX = size / 2;
      const centerY = size / 2;
      const radius = size / 2 - 50;
      const angleStep = (Math.PI * 2) / DIMENSIONS.length;
      const fixedAngle = index * angleStep - Math.PI / 2;
      
      const dx = x - centerX;
      const dy = y - centerY;
      
      const dist = Math.sqrt(dx * dx + dy * dy);
      const projectedDist = dist * Math.cos(Math.atan2(dy, dx) - fixedAngle);
      
      const newValue = Math.max(0, Math.min(100, (projectedDist / radius) * 100));
      
      setLocalScores((prev) => {
        const updated = {
          ...prev,
          [DIMENSIONS[index]]: Math.round(newValue),
        };
        return updated;
      });
    },
    [size]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!editable) return;
      
      const { x, y } = getPositionOnCanvas(e);
      const index = findNearestVertex(x, y);
      
      if (index !== null) {
        setDraggingIndex(index);
        e.preventDefault();
      }
    },
    [editable, getPositionOnCanvas, findNearestVertex]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (draggingIndex === null) return;
      
      const { x, y } = getPositionOnCanvas(e);
      updateScoreFromPosition(draggingIndex, x, y);
    },
    [draggingIndex, getPositionOnCanvas, updateScoreFromPosition]
  );

  const handleMouseUp = useCallback(() => {
    if (draggingIndex !== null) {
      onChange?.(localScores);
      setDraggingIndex(null);
    }
  }, [draggingIndex, localScores, onChange]);

  useEffect(() => {
    if (editable && draggingIndex !== null) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [editable, draggingIndex, handleMouseMove, handleMouseUp]);

  return (
    <div className="radar-container">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="radar-canvas"
        onMouseDown={handleMouseDown}
        style={{ cursor: editable ? 'pointer' : 'default' }}
      />
    </div>
  );
}
