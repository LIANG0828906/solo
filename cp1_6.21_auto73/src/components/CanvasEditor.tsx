import React, { useState, useRef, useCallback, useEffect } from 'react';
import { SvgLayer, AnchorPoint } from '../types';

interface CanvasEditorProps {
  layers: SvgLayer[];
  onAnchorMove: (layerId: string, anchorIndex: number, newPos: AnchorPoint) => void;
  onPathUpdate: (layerId: string, newD: string) => void;
}

interface ViewState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

const regeneratePath = (anchors: AnchorPoint[]): string => {
  if (anchors.length < 2) return '';
  let d = `M ${anchors[0].x.toFixed(2)} ${anchors[0].y.toFixed(2)}`;
  for (let i = 1; i < anchors.length; i++) {
    const prev = anchors[i - 1];
    const curr = anchors[i];
    const cpx = (prev.x + curr.x) / 2;
    const cpy = (prev.y + curr.y) / 2;
    d += ` Q ${prev.x.toFixed(2)} ${prev.y.toFixed(2)} ${cpx.toFixed(2)} ${cpy.toFixed(2)}`;
  }
  return d;
};

export const CanvasEditor: React.FC<CanvasEditorProps> = ({ layers, onAnchorMove, onPathUpdate }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState<ViewState>({ scale: 1, offsetX: 0, offsetY: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggingAnchor, setDraggingAnchor] = useState<{ layerId: string; index: number } | null>(null);
  const [selectedAnchor, setSelectedAnchor] = useState<{ layerId: string; index: number } | null>(null);
  const velocityRef = useRef({ x: 0, y: 0 });
  const lastPosRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number | null>(null);

  const canvasWidth = layers.length > 0 ? 800 : 0;
  const canvasHeight = layers.length > 0 ? 600 : 0;

  const getSVGPoint = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - view.offsetX) / view.scale - canvasWidth / 2 + canvasWidth / 2;
    const y = (clientY - rect.top - view.offsetY) / view.scale - canvasHeight / 2 + canvasHeight / 2;
    const actualX = (clientX - rect.left - view.offsetX) / view.scale;
    const actualY = (clientY - rect.top - view.offsetY) / view.scale;
    return { x: actualX, y: actualY };
  }, [view, canvasWidth, canvasHeight]);

  const applyInertia = useCallback(() => {
    setView(prev => {
      const vx = velocityRef.current.x * 0.92;
      const vy = velocityRef.current.y * 0.92;
      velocityRef.current = { x: vx, y: vy };
      if (Math.abs(vx) < 0.1 && Math.abs(vy) < 0.1) {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        return prev;
      }
      animationRef.current = requestAnimationFrame(applyInertia);
      return {
        ...prev,
        offsetX: prev.offsetX + vx,
        offsetY: prev.offsetY + vy,
      };
    });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - view.offsetX, y: e.clientY - view.offsetY });
      lastPosRef.current = { x: e.clientX, y: e.clientY };
    } else if (e.button === 0 && !draggingAnchor) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - view.offsetX, y: e.clientY - view.offsetY });
      lastPosRef.current = { x: e.clientX, y: e.clientY };
    }
  }, [view, draggingAnchor]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggingAnchor) {
      const point = getSVGPoint(e.clientX, e.clientY);
      onAnchorMove(draggingAnchor.layerId, draggingAnchor.index, point);
      const layer = layers.find(l => l.id === draggingAnchor.layerId);
      if (layer) {
        const newAnchors = [...layer.anchors];
        newAnchors[draggingAnchor.index] = point;
        onPathUpdate(draggingAnchor.layerId, regeneratePath(newAnchors));
      }
      return;
    }

    if (isPanning) {
      const dx = e.clientX - lastPosRef.current.x;
      const dy = e.clientY - lastPosRef.current.y;
      velocityRef.current = { x: dx * 0.5, y: dy * 0.5 };
      lastPosRef.current = { x: e.clientX, y: e.clientY };
      setView(prev => ({
        ...prev,
        offsetX: e.clientX - panStart.x,
        offsetY: e.clientY - panStart.y,
      }));
    }
  }, [isPanning, panStart, draggingAnchor, getSVGPoint, layers, onAnchorMove, onPathUpdate]);

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      animationRef.current = requestAnimationFrame(applyInertia);
    }
    if (draggingAnchor) {
      setDraggingAnchor(null);
    }
  }, [isPanning, draggingAnchor, applyInertia]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setView(prev => {
      const newScale = Math.min(Math.max(prev.scale * delta, 0.1), 5);
      return { ...prev, scale: newScale };
    });
  }, []);

  const handleAnchorMouseDown = useCallback((layerId: string, index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingAnchor({ layerId, index });
    setSelectedAnchor({ layerId, index });
  }, []);

  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault();
    const svg = svgRef.current;
    if (svg) {
      svg.addEventListener('wheel', preventDefault as any, { passive: false });
    }
    return () => {
      if (svg) {
        svg.removeEventListener('wheel', preventDefault as any);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  if (layers.length === 0) {
    return (
      <div className="canvas-empty-hint">
        <div className="hint-icon">🎨</div>
        <div className="hint-text">上传草稿并点击转绘开始创作</div>
      </div>
    );
  }

  return (
    <div className="canvas-wrapper">
      <svg
        ref={svgRef}
        className={`canvas-svg ${isPanning ? 'panning' : ''}`}
        width="100%"
        height="100%"
        viewBox={`${-canvasWidth / 2} ${-canvasHeight / 2} ${canvasWidth} ${canvasHeight}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <g transform={`translate(${view.offsetX / view.scale}, ${view.offsetY / view.scale}) scale(${view.scale})`}>
          {layers.filter(l => l.visible).map(layer => (
            <g key={layer.id}>
              <path
                d={layer.d}
                stroke={layer.stroke}
                strokeWidth={layer.strokeWidth}
                fill={layer.fill}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {layer.anchors.map((anchor, idx) => {
                const isSelected = selectedAnchor?.layerId === layer.id && selectedAnchor?.index === idx;
                return (
                  <circle
                    key={`${layer.id}-${idx}`}
                    cx={anchor.x}
                    cy={anchor.y}
                    r={isSelected ? 6 : 4}
                    fill={isSelected ? '#4ECDC4' : '#FF6B6B'}
                    className="anchor-point"
                    stroke="white"
                    strokeWidth={1.5}
                    onMouseDown={(e) => handleAnchorMouseDown(layer.id, idx, e)}
                    style={{
                      transform: isSelected ? 'scale(1.5)' : 'scale(1)',
                      transformOrigin: `${anchor.x}px ${anchor.y}px`,
                    }}
                  />
                );
              })}
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
};

export default CanvasEditor;
