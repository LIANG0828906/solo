import React, { useRef, useEffect, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { usePathStore } from '../store/usePathStore';
import type { BezierNode, Point, RippleEffect } from '../types';

interface CanvasViewProps {
  className?: string;
}

const NODE_SIZE = 8;
const NODE_HIT_RADIUS = 12;
const TOUCH_HIT_RADIUS = 24;
const RIPPLE_DURATION = 400;

export const CanvasView: React.FC<CanvasViewProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>(0);
  const [ripples, setRipples] = useState<RippleEffect[]>([]);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [isTouchDevice] = useState(() => (typeof navigator !== 'undefined' ? navigator.maxTouchPoints > 0 : false));

  const {
    paths,
    selectedPathId,
    hoveredNodeId,
    draggingNodeId,
    imageCanvas,
    imageTransform,
    setHoveredNode,
    setDraggingNode,
    updateNode,
    setImageTransform,
  } = usePathStore();

  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [draggedPathId, setDraggedPathId] = useState<string | null>(null);

  const hitRadius = isTouchDevice ? TOUCH_HIT_RADIUS : NODE_HIT_RADIUS;

  const screenToImage = useCallback(
    (screenX: number, screenY: number): Point => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      const x = (screenX - rect.left - imageTransform.x) / imageTransform.scale;
      const y = (screenY - rect.top - imageTransform.y) / imageTransform.scale;
      return { x, y };
    },
    [imageTransform]
  );

  const findNodeAtPosition = useCallback(
    (imgX: number, imgY: number): { pathId: string; node: BezierNode } | null => {
      for (const path of paths) {
        for (const node of path.nodes) {
          const dx = imgX - node.x;
          const dy = imgY - node.y;
          if (dx * dx + dy * dy <= hitRadius * hitRadius) {
            return { pathId: path.id, node };
          }
        }
      }
      return null;
    },
    [paths, hitRadius]
  );

  const addRipple = useCallback((x: number, y: number) => {
    const ripple: RippleEffect = {
      id: uuidv4(),
      x,
      y,
      startTime: performance.now(),
    };
    setRipples(prev => [...prev, ripple]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== ripple.id));
    }, RIPPLE_DURATION);
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(imageTransform.x, imageTransform.y);
    ctx.scale(imageTransform.scale, imageTransform.scale);

    if (imageCanvas) {
      ctx.drawImage(imageCanvas, 0, 0);
    }

    for (const path of paths) {
      const isSelected = path.id === selectedPathId;
      ctx.strokeStyle = isSelected ? path.color.replace('0.7', '1') : path.color;
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      const nodes = path.nodes;
      const n = nodes.length;
      const maxIndex = path.isClosed ? n : n - 1;

      if (n > 0) {
        ctx.moveTo(nodes[0].x, nodes[0].y);
        for (let i = 0; i < maxIndex; i++) {
          const p0 = nodes[i];
          const p3 = nodes[(i + 1) % n];
          const p1 = p0.controlOut || p0;
          const p2 = p3.controlIn || p3;
          ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
        }
        if (path.isClosed) {
          ctx.closePath();
        }
      }
      ctx.stroke();

      for (const node of nodes) {
        const isHovered = node.id === hoveredNodeId;
        const isDragging = node.id === draggingNodeId;
        const nodeColor = isDragging ? '#f1c40f' : isHovered ? '#f39c12' : '#e74c3c';
        const size = isHovered || isDragging ? NODE_SIZE + 4 : NODE_SIZE;

        ctx.fillStyle = nodeColor;
        ctx.fillRect(node.x - size / 2, node.y - size / 2, size, size);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(node.x - size / 2, node.y - size / 2, size, size);
      }
    }

    ctx.restore();

    const now = performance.now();
    for (const ripple of ripples) {
      const elapsed = now - ripple.startTime;
      if (elapsed >= RIPPLE_DURATION) continue;
      const progress = elapsed / RIPPLE_DURATION;
      const scale = 1 + progress * 2;
      const alpha = 1 - progress;
      const size = NODE_SIZE * 2 * scale;

      ctx.strokeStyle = `rgba(241, 196, 15, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(
        ripple.x * imageTransform.scale + imageTransform.x,
        ripple.y * imageTransform.scale + imageTransform.y,
        size / 2,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }

    if (hoveredNodeId && !draggingNodeId) {
      for (const path of paths) {
        const node = path.nodes.find(n => n.id === hoveredNodeId);
        if (node) {
          const screenX = node.x * imageTransform.scale + imageTransform.x;
          const screenY = node.y * imageTransform.scale + imageTransform.y;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.fillRect(screenX + 10, screenY - 30, 100, 24);
          ctx.fillStyle = '#ffffff';
          ctx.font = '12px monospace';
          ctx.fillText(`(${Math.round(node.x)}, ${Math.round(node.y)})`, screenX + 16, screenY - 12);
          break;
        }
      }
    }
  }, [paths, selectedPathId, hoveredNodeId, draggingNodeId, imageCanvas, imageTransform, ripples]);

  useEffect(() => {
    const animate = () => {
      render();
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [render]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setCanvasSize({ width: Math.floor(width), height: Math.floor(height) });
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const imgPos = screenToImage(e.clientX, e.clientY);
      const found = findNodeAtPosition(imgPos.x, imgPos.y);

      if (found) {
        setDraggedPathId(found.pathId);
        setDraggingNode(found.node.id);
        addRipple(found.node.x, found.node.y);
        e.preventDefault();
      } else if (imageCanvas && e.button === 0) {
        setIsDraggingImage(true);
        setDragStart({ x: e.clientX - imageTransform.x, y: e.clientY - imageTransform.y });
      }
    },
    [screenToImage, findNodeAtPosition, setDraggingNode, addRipple, imageCanvas, imageTransform]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const imgPos = screenToImage(e.clientX, e.clientY);

      if (draggingNodeId && draggedPathId) {
        updateNode(draggedPathId, draggingNodeId, imgPos, false);
        return;
      }

      if (isDraggingImage && dragStart) {
        setImageTransform({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
        return;
      }

      const found = findNodeAtPosition(imgPos.x, imgPos.y);
      if (found) {
        if (hoveredNodeId !== found.node.id) {
          setHoveredNode(found.node.id);
        }
        canvasRef.current!.style.cursor = 'move';
      } else if (imageCanvas) {
        if (hoveredNodeId) {
          setHoveredNode(null);
        }
        canvasRef.current!.style.cursor = isDraggingImage ? 'grabbing' : 'grab';
      } else {
        canvasRef.current!.style.cursor = 'default';
      }
    },
    [
      screenToImage,
      findNodeAtPosition,
      draggingNodeId,
      draggedPathId,
      isDraggingImage,
      dragStart,
      hoveredNodeId,
      imageCanvas,
      setHoveredNode,
      updateNode,
      setImageTransform,
    ]
  );

  const handleMouseUp = useCallback(() => {
    if (draggingNodeId && draggedPathId) {
      const path = paths.find(p => p.id === draggedPathId);
      if (path) {
        const node = path.nodes.find(n => n.id === draggingNodeId);
        if (node) {
          updateNode(draggedPathId, draggingNodeId, { x: node.x, y: node.y }, true);
        }
      }
    }
    setDraggingNode(null);
    setDraggedPathId(null);
    setIsDraggingImage(false);
    setDragStart(null);
  }, [draggingNodeId, draggedPathId, paths, updateNode, setDraggingNode]);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      if (!imageCanvas) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newScale = Math.max(0.1, Math.min(5, imageTransform.scale * delta));
      const scaleRatio = newScale / imageTransform.scale;

      setImageTransform({
        scale: newScale,
        x: mouseX - (mouseX - imageTransform.x) * scaleRatio,
        y: mouseY - (mouseY - imageTransform.y) * scaleRatio,
      });
    },
    [imageCanvas, imageTransform, setImageTransform]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredNode(null);
    if (isDraggingImage || draggingNodeId) {
      handleMouseUp();
    }
  }, [setHoveredNode, isDraggingImage, draggingNodeId, handleMouseUp]);

  return (
    <div
      ref={containerRef}
      className={`canvas-container ${className}`}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          backgroundColor: '#2c3e50',
        }}
      />
      {!imageCanvas && (
        <div className="canvas-placeholder">
          <p>请在上方输入图片URL并点击上传</p>
          <p className="hint">支持滚轮缩放，按住左键拖动平移</p>
        </div>
      )}
    </div>
  );
};
