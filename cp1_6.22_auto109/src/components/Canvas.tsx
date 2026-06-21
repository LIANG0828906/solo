import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  Fragment,
  Particle,
  BASE_FRAGMENT_SIZE,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GRID_SIZE,
  isPointInFragment,
  getFragmentBounds,
  getFragmentsBounds,
  elasticEaseOut,
  updateParticles,
  snapToGrid,
  FragmentType,
} from '@/utils/collageEngine';

interface CanvasProps {
  fragments: Fragment[];
  selectedIds: string[];
  onSelect: (ids: string[], ctrlKey: boolean) => void;
  onFragmentMove: (id: string, x: number, y: number) => void;
  onFragmentsMove: (ids: string[], dx: number, dy: number) => void;
  onFragmentUpdate: (id: string, changes: Partial<Fragment>) => void;
  onFragmentAdd: (type: FragmentType, color: string, texture: string, x: number, y: number) => void;
  onDoubleClick: (id: string) => void;
  onDelete: () => void;
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  particles: Particle[];
  onParticlesUpdate: (particles: Particle[]) => void;
  animatingFragments: Map<string, { startTime: number; startScale: number }>;
  onAnimatingUpdate: (animating: Map<string, { startTime: number; startScale: number }>) => void;
  transitionState: { from: Fragment[]; to: Fragment[]; progress: number } | null;
}

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  fragmentStartPositions: Map<string, { x: number; y: number }>;
  targetIds: string[];
}

const Canvas: React.FC<CanvasProps> = ({
  fragments,
  selectedIds,
  onSelect,
  onFragmentMove,
  onFragmentsMove,
  onFragmentUpdate,
  onFragmentAdd,
  onDoubleClick,
  onDelete,
  canvasRef,
  particles,
  onParticlesUpdate,
  animatingFragments,
  onAnimatingUpdate,
  transitionState,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    fragmentStartPositions: new Map(),
    targetIds: [],
  });
  const mouseMovePendingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const [, forceUpdate] = useState(0);

  const getCanvasCoords = useCallback((e: React.MouseEvent | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, [canvasRef]);

  const findFragmentAtPoint = useCallback((x: number, y: number): Fragment | null => {
    const sorted = [...fragments].sort((a, b) => b.zIndex - a.zIndex);
    for (const f of sorted) {
      if (isPointInFragment(x, y, f)) {
        return f;
      }
    }
    return null;
  }, [fragments]);

  const getSelectedFragments = useCallback((): Fragment[] => {
    return fragments.filter(f => selectedIds.includes(f.id));
  }, [fragments, selectedIds]);

  const drawTexture = useCallback((ctx: CanvasRenderingContext2D, f: Fragment) => {
    ctx.save();
    ctx.clip();
    
    const size = BASE_FRAGMENT_SIZE * 2;
    ctx.globalAlpha = 0.3;
    
    switch (f.texture) {
      case 'dots':
        ctx.fillStyle = '#ffffff';
        for (let i = -size; i < size; i += 8) {
          for (let j = -size; j < size; j += 8) {
            ctx.beginPath();
            ctx.arc(i, j, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        break;
      case 'lines':
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        for (let i = -size; i < size; i += 10) {
          ctx.beginPath();
          ctx.moveTo(i, -size);
          ctx.lineTo(i + size, size);
          ctx.stroke();
        }
        break;
      case 'crosshatch':
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        for (let i = -size; i < size; i += 8) {
          ctx.beginPath();
          ctx.moveTo(i, -size);
          ctx.lineTo(i + size, size);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(-i, -size);
          ctx.lineTo(-i + size, size);
          ctx.stroke();
        }
        break;
      case 'waves':
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        for (let i = -size; i < size; i += 12) {
          ctx.beginPath();
          for (let j = -size; j < size; j += 2) {
            const y = i + Math.sin(j * 0.15) * 4;
            if (j === -size) ctx.moveTo(j, y);
            else ctx.lineTo(j, y);
          }
          ctx.stroke();
        }
        break;
      default:
        break;
    }
    
    ctx.restore();
  }, []);

  const drawFragmentShape = useCallback((ctx: CanvasRenderingContext2D, f: Fragment, forHitTest = false) => {
    const size = BASE_FRAGMENT_SIZE;
    ctx.beginPath();
    
    switch (f.type) {
      case 'circle':
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        break;
      case 'triangle':
        const h = size * Math.sqrt(3);
        ctx.moveTo(0, -size);
        ctx.lineTo(size * 0.866, size * 0.5);
        ctx.lineTo(-size * 0.866, size * 0.5);
        ctx.closePath();
        break;
      case 'polygon':
        const sides = 6;
        for (let i = 0; i < sides; i++) {
          const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
          const r = size * (0.8 + Math.sin(i * 2.5) * 0.2);
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        break;
    }
    
    if (!forHitTest) {
      ctx.fillStyle = f.color;
      ctx.fill();
      
      ctx.strokeStyle = 'rgba(74, 59, 50, 0.4)';
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();
      
      drawTexture(ctx, f);
    }
  }, [drawTexture]);

  const drawFragment = useCallback((ctx: CanvasRenderingContext2D, f: Fragment, customScale?: number) => {
    const animData = animatingFragments.get(f.id);
    let scale = f.scale;
    
    if (animData) {
      const elapsed = (Date.now() - animData.startTime) / 300;
      if (elapsed >= 1) {
        const newAnimating = new Map(animatingFragments);
        newAnimating.delete(f.id);
        onAnimatingUpdate(newAnimating);
      } else {
        const t = elasticEaseOut(elapsed);
        scale = animData.startScale + (f.scale - animData.startScale) * t;
      }
    }
    
    if (customScale !== undefined) {
      scale = customScale;
    }
    
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate((f.rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    
    drawFragmentShape(ctx, f);
    
    ctx.restore();
  }, [animatingFragments, onAnimatingUpdate, drawFragmentShape]);

  const drawSelectionBox = useCallback((ctx: CanvasRenderingContext2D, frags: Fragment[]) => {
    if (frags.length === 0) return;
    
    const bounds = getFragmentsBounds(frags);
    const padding = 8;
    
    ctx.save();
    ctx.strokeStyle = '#B0C4DE';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    
    ctx.strokeRect(
      bounds.minX - padding,
      bounds.minY - padding,
      bounds.maxX - bounds.minX + padding * 2,
      bounds.maxY - bounds.minY + padding * 2
    );
    
    ctx.setLineDash([]);
    
    const handles = [
      { x: bounds.minX, y: bounds.minY },
      { x: (bounds.minX + bounds.maxX) / 2, y: bounds.minY },
      { x: bounds.maxX, y: bounds.minY },
      { x: bounds.maxX, y: (bounds.minY + bounds.maxY) / 2 },
      { x: bounds.maxX, y: bounds.maxY },
      { x: (bounds.minX + bounds.maxX) / 2, y: bounds.maxY },
      { x: bounds.minX, y: bounds.maxY },
      { x: bounds.minX, y: (bounds.minY + bounds.maxY) / 2 },
    ];
    
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#B0C4DE';
    ctx.lineWidth = 2;
    
    handles.forEach(({ x, y }) => {
      ctx.beginPath();
      ctx.rect(x - 5, y - 5, 10, 10);
      ctx.fill();
      ctx.stroke();
    });
    
    ctx.restore();
  }, []);

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.strokeStyle = 'rgba(74, 59, 50, 0.05)';
    ctx.lineWidth = 1;
    
    for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    
    for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }
    
    ctx.restore();
  }, []);

  const drawParticles = useCallback((ctx: CanvasRenderingContext2D, parts: Particle[]) => {
    parts.forEach(p => {
      const alpha = p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FAF8F3';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    drawGrid(ctx);
    
    const sortedFragments = [...fragments].sort((a, b) => a.zIndex - b.zIndex);
    
    if (transitionState && transitionState.progress < 1) {
      const { from, to, progress } = transitionState;
      const t = easeInOutCubic(progress);
      
      const fragMap = new Map(from.map(f => [f.id, f]));
      
      sortedFragments.forEach(f => {
        const fromFrag = fragMap.get(f.id);
        if (fromFrag) {
          const x = fromFrag.x + (f.x - fromFrag.x) * t;
          const y = fromFrag.y + (f.y - fromFrag.y) * t;
          const rotation = fromFrag.rotation + (f.rotation - fromFrag.rotation) * t;
          const scale = fromFrag.scale + (f.scale - fromFrag.scale) * t;
          
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.scale(scale, scale);
          drawFragmentShape(ctx, f);
          ctx.restore();
        } else {
          ctx.globalAlpha = t;
          drawFragment(ctx, f);
          ctx.globalAlpha = 1;
        }
      });
      
      const toIds = new Set(to.map(f => f.id));
      from.forEach(f => {
        if (!toIds.has(f.id)) {
          ctx.globalAlpha = 1 - t;
          drawFragment(ctx, f);
          ctx.globalAlpha = 1;
        }
      });
    } else {
      sortedFragments.forEach(f => drawFragment(ctx, f));
    }
    
    const selectedFragments = getSelectedFragments();
    if (selectedFragments.length > 0 && !transitionState) {
      drawSelectionBox(ctx, selectedFragments);
    }
    
    drawParticles(ctx, particles);
  }, [
    canvasRef, fragments, particles, animatingFragments, transitionState,
    drawGrid, drawFragment, drawFragmentShape, drawSelectionBox, drawParticles, getSelectedFragments
  ]);

  function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  useEffect(() => {
    let animationId: number;
    let lastTime = 0;
    
    const loop = (time: number) => {
      if (time - lastTime >= 16) {
        if (particles.length > 0) {
          onParticlesUpdate(updateParticles(particles));
        }
        if (animatingFragments.size > 0 || transitionState) {
          forceUpdate(n => n + 1);
        }
        render();
        lastTime = time;
      }
      animationId = requestAnimationFrame(loop);
    };
    
    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [render, particles, onParticlesUpdate, animatingFragments, transitionState]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    
    const { x, y } = getCanvasCoords(e);
    const clickedFragment = findFragmentAtPoint(x, y);
    
    if (clickedFragment) {
      if (e.ctrlKey || e.metaKey) {
        const newSelected = selectedIds.includes(clickedFragment.id)
          ? selectedIds.filter(id => id !== clickedFragment.id)
          : [...selectedIds, clickedFragment.id];
        onSelect(newSelected, true);
      } else if (!selectedIds.includes(clickedFragment.id)) {
        onSelect([clickedFragment.id], false);
      }
      
      if (selectedIds.includes(clickedFragment.id) || !e.ctrlKey) {
        const idsToDrag = selectedIds.includes(clickedFragment.id) 
          ? selectedIds 
          : [clickedFragment.id];
        
        dragStateRef.current = {
          isDragging: true,
          startX: x,
          startY: y,
          fragmentStartPositions: new Map(
            idsToDrag.map(id => {
              const f = fragments.find(fr => fr.id === id);
              return [id, { x: f?.x || 0, y: f?.y || 0 }];
            })
          ),
          targetIds: idsToDrag,
        };
      }
    } else {
      onSelect([], false);
    }
  }, [getCanvasCoords, findFragmentAtPoint, selectedIds, onSelect, fragments]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    lastMousePosRef.current = getCanvasCoords(e);
    
    if (mouseMovePendingRef.current) return;
    mouseMovePendingRef.current = true;
    
    requestAnimationFrame(() => {
      mouseMovePendingRef.current = false;
      
      const dragState = dragStateRef.current;
      if (!dragState.isDragging) return;
      
      const { x, y } = lastMousePosRef.current;
      const dx = x - dragState.startX;
      const dy = y - dragState.startY;
      
      if (dragState.targetIds.length === 1) {
        const id = dragState.targetIds[0];
        const startPos = dragState.fragmentStartPositions.get(id);
        if (startPos) {
          let newX = startPos.x + dx;
          let newY = startPos.y + dy;
          
          if (!e.shiftKey) {
            const snapped = snapToGrid(newX, newY);
            newX = snapped.x;
            newY = snapped.y;
          }
          
          newX = Math.max(BASE_FRAGMENT_SIZE, Math.min(CANVAS_WIDTH - BASE_FRAGMENT_SIZE, newX));
          newY = Math.max(BASE_FRAGMENT_SIZE, Math.min(CANVAS_HEIGHT - BASE_FRAGMENT_SIZE, newY));
          
          onFragmentMove(id, newX, newY);
        }
      } else if (dragState.targetIds.length > 1) {
        onFragmentsMove(dragState.targetIds, dx, dy);
      }
    });
  }, [getCanvasCoords, onFragmentMove, onFragmentsMove]);

  const handleMouseUp = useCallback(() => {
    dragStateRef.current.isDragging = false;
  }, []);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    const { x, y } = getCanvasCoords(e);
    const clickedFragment = findFragmentAtPoint(x, y);
    if (clickedFragment) {
      onDoubleClick(clickedFragment.id);
    }
  }, [getCanvasCoords, findFragmentAtPoint, onDoubleClick]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const { x, y } = getCanvasCoords(e);
    const clickedFragment = findFragmentAtPoint(x, y);
    
    if (clickedFragment && !selectedIds.includes(clickedFragment.id)) {
      onSelect([clickedFragment.id], false);
    }
  }, [getCanvasCoords, findFragmentAtPoint, selectedIds, onSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;
    
    try {
      const { type, color, texture } = JSON.parse(data);
      const { x, y } = getCanvasCoords(e);
      const snapped = snapToGrid(x, y);
      
      const clampedX = Math.max(BASE_FRAGMENT_SIZE, Math.min(CANVAS_WIDTH - BASE_FRAGMENT_SIZE, snapped.x));
      const clampedY = Math.max(BASE_FRAGMENT_SIZE, Math.min(CANVAS_HEIGHT - BASE_FRAGMENT_SIZE, snapped.y));
      
      onFragmentAdd(type, color, texture, clampedX, clampedY);
    } catch (err) {
      console.error('Drop error:', err);
    }
  }, [getCanvasCoords, onFragmentAdd]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
      e.preventDefault();
      onDelete();
    }
  }, [selectedIds, onDelete]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleMouseMove, handleMouseUp, handleKeyDown]);

  return (
    <div 
      ref={containerRef}
      className="canvas-container"
      style={{ position: 'relative' }}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="main-canvas"
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{
          display: 'block',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(74, 59, 50, 0.15)',
          cursor: dragStateRef.current.isDragging ? 'grabbing' : 'default',
        }}
      />
    </div>
  );
};

export default Canvas;
