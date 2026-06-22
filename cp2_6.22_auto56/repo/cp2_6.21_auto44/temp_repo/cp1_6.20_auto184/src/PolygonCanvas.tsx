import { useRef, useEffect, useCallback, useState } from 'react';
import type { Vertex, PolygonStyles } from './types';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GRID_SPACING,
  VERTEX_RADIUS,
  VERTEX_HOVER_RADIUS,
  APPEAR_ANIMATION_DURATION,
  DELETE_ANIMATION_DURATION,
} from './types';

interface PolygonCanvasProps {
  vertices: Vertex[];
  selectedVertexIndex: number | null;
  styles: PolygonStyles;
  onAddVertex: (x: number, y: number) => void;
  onUpdateVertex: (index: number, x: number, y: number) => void;
  onDeleteVertex: (index: number) => void;
  onSelectVertex: (index: number | null) => void;
  onUpdateVertexScale: (index: number, scale: number) => void;
  onRemoveVertexAfterAnimation: (index: number) => void;
}

export default function PolygonCanvas({
  vertices,
  selectedVertexIndex,
  styles,
  onAddVertex,
  onUpdateVertex,
  onDeleteVertex,
  onSelectVertex,
  onUpdateVertexScale,
  onRemoveVertexAfterAnimation,
}: PolygonCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [isDragging, setIsDragging] = useState(false);
  const [dragVertexIndex, setDragVertexIndex] = useState<number | null>(null);
  const [hoverVertexIndex, setHoverVertexIndex] = useState<number | null>(null);
  const [isHoveringCanvas, setIsHoveringCanvas] = useState(false);

  const getMousePos = useCallback((e: React.MouseEvent<HTMLCanvasElement> | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const findVertexAtPosition = useCallback(
    (x: number, y: number): number | null => {
      for (let i = vertices.length - 1; i >= 0; i--) {
        const v = vertices[i];
        if (v.isDeleting) continue;
        const dx = x - v.x;
        const dy = y - v.y;
        const hitRadius = VERTEX_HOVER_RADIUS + 4;
        if (dx * dx + dy * dy <= hitRadius * hitRadius) {
          return i;
        }
      }
      return null;
    },
    [vertices]
  );

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.strokeStyle = 'rgba(52, 152, 219, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SPACING) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }

    for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SPACING) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    ctx.restore();
  }, []);

  const drawPolygon = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const visibleVertices = vertices.filter((v) => !v.isDeleting);
      if (visibleVertices.length < 2) return;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(visibleVertices[0].x, visibleVertices[0].y);
      for (let i = 1; i < visibleVertices.length; i++) {
        ctx.lineTo(visibleVertices[i].x, visibleVertices[i].y);
      }
      if (visibleVertices.length >= 3) {
        ctx.closePath();
        ctx.fillStyle = styles.fillColor;
        ctx.fill();
      }
      ctx.strokeStyle = styles.strokeColor;
      ctx.lineWidth = styles.strokeWidth;
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
    },
    [vertices, styles]
  );

  const drawVertices = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      vertices.forEach((vertex, index) => {
        const scale = vertex.scale;
        if (scale <= 0) return;

        const isSelected = index === selectedVertexIndex;
        const isHovered = index === hoverVertexIndex;
        const isDragging = index === dragVertexIndex;
        const radius =
          (isSelected || isHovered || isDragging ? VERTEX_HOVER_RADIUS : VERTEX_RADIUS) * scale;

        ctx.save();

        ctx.beginPath();
        ctx.arc(vertex.x, vertex.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = vertex.color;
        ctx.fill();

        ctx.lineWidth = styles.vertexStrokeWidth;
        ctx.strokeStyle = vertex.strokeColor;
        ctx.stroke();

        if (isSelected || isDragging) {
          ctx.beginPath();
          ctx.arc(vertex.x, vertex.y, radius + 3, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(52, 152, 219, 0.6)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        ctx.restore();
      });
    },
    [vertices, selectedVertexIndex, hoverVertexIndex, dragVertexIndex, styles]
  );

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    drawGrid(ctx);
    drawPolygon(ctx);
    drawVertices(ctx);
  }, [drawGrid, drawPolygon, drawVertices]);

  useEffect(() => {
    let lastTime = 0;

    const animate = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      let needsUpdate = false;

      vertices.forEach((vertex, index) => {
        if (vertex.scale < 1 && !vertex.isDeleting) {
          const newScale = Math.min(1, vertex.scale + delta / APPEAR_ANIMATION_DURATION);
          onUpdateVertexScale(index, newScale);
          needsUpdate = true;
        } else if (vertex.isDeleting && vertex.scale > 0) {
          const newScale = Math.max(0, vertex.scale - delta / DELETE_ANIMATION_DURATION);
          onUpdateVertexScale(index, newScale);
          needsUpdate = true;
          if (newScale <= 0) {
            onRemoveVertexAfterAnimation(index);
          }
        }
      });

      render();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [vertices, render, onUpdateVertexScale, onRemoveVertexAfterAnimation]);

  useEffect(() => {
    render();
  }, [render]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const pos = getMousePos(e);
      const vertexIndex = findVertexAtPosition(pos.x, pos.y);

      if (vertexIndex !== null) {
        setIsDragging(true);
        setDragVertexIndex(vertexIndex);
        onSelectVertex(vertexIndex);
      }
    },
    [getMousePos, findVertexAtPosition, onSelectVertex]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const pos = getMousePos(e);
      const vertexIndex = findVertexAtPosition(pos.x, pos.y);
      setHoverVertexIndex(vertexIndex);

      if (isDragging && dragVertexIndex !== null) {
        onUpdateVertex(dragVertexIndex, pos.x, pos.y);
      }
    },
    [getMousePos, findVertexAtPosition, isDragging, dragVertexIndex, onUpdateVertex]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragVertexIndex(null);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isDragging) return;

      const pos = getMousePos(e);
      const vertexIndex = findVertexAtPosition(pos.x, pos.y);

      if (vertexIndex === null) {
        onAddVertex(pos.x, pos.y);
      } else {
        onSelectVertex(vertexIndex);
      }
    },
    [getMousePos, findVertexAtPosition, isDragging, onAddVertex, onSelectVertex]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const pos = getMousePos(e);
      const vertexIndex = findVertexAtPosition(pos.x, pos.y);

      if (vertexIndex !== null) {
        onDeleteVertex(vertexIndex);
        if (selectedVertexIndex === vertexIndex) {
          onSelectVertex(null);
        }
      }
    },
    [getMousePos, findVertexAtPosition, onDeleteVertex, selectedVertexIndex, onSelectVertex]
  );

  const handleMouseLeave = useCallback(() => {
    setIsHoveringCanvas(false);
    setHoverVertexIndex(null);
    if (isDragging) {
      setIsDragging(false);
      setDragVertexIndex(null);
    }
  }, [isDragging]);

  const handleMouseEnter = useCallback(() => {
    setIsHoveringCanvas(true);
  }, []);

  const cursor = isDragging ? 'move' : isHoveringCanvas && hoverVertexIndex === null ? 'crosshair' : 'default';

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="polygon-canvas"
      style={{ cursor }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    />
  );
}
