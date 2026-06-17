import React, { useRef, useState, useCallback, useEffect } from 'react';
import type { EasingCurve } from '../types/animation';
import { useAnimationStore } from '../store/useAnimationStore';
import { cubicBezierToString } from '../utils/animationUtils';

const CANVAS_SIZE = 200;
const PADDING = 10;
const INNER_SIZE = CANVAS_SIZE - PADDING * 2;
const POINT_RADIUS = 6;

interface Props {}

export const CurveEditor: React.FC<Props> = () => {
  const easing = useAnimationStore((s) => s.animationConfig.easing);
  const setEasing = useAnimationStore((s) => s.setEasing);

  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<'p1' | 'p2' | null>(null);

  const toSvgX = (x: number) => PADDING + x * INNER_SIZE;
  const toSvgY = (y: number) => PADDING + (1 - y) * INNER_SIZE;
  const fromSvgX = (px: number) => Math.max(0, Math.min(1, (px - PADDING) / INNER_SIZE));
  const fromSvgY = (py: number) => Math.max(-0.5, Math.min(1.5, 1 - (py - PADDING) / INNER_SIZE));

  const getMousePos = useCallback((e: React.MouseEvent | MouseEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (CANVAS_SIZE / rect.width);
    const y = (e.clientY - rect.top) * (CANVAS_SIZE / rect.height);
    return { x, y };
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging) return;
      const { x, y } = getMousePos(e);
      const nx = Math.max(0, Math.min(1, fromSvgX(x)));
      const ny = fromSvgY(y);

      if (dragging === 'p1') {
        setEasing({ ...easing, x1: nx, y1: ny });
      } else if (dragging === 'p2') {
        setEasing({ ...easing, x2: nx, y2: ny });
      }
    },
    [dragging, easing, setEasing, getMousePos]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  const p0 = { x: 0, y: 0 };
  const p1 = { x: easing.x1, y: easing.y1 };
  const p2 = { x: easing.x2, y: easing.y2 };
  const p3 = { x: 1, y: 1 };

  const pathD = `M ${toSvgX(p0.x)} ${toSvgY(p0.y)} C ${toSvgX(p1.x)} ${toSvgY(p1.y)}, ${toSvgX(p2.x)} ${toSvgY(p2.y)}, ${toSvgX(p3.x)} ${toSvgY(p3.y)}`;

  const gridLines = [];
  for (let i = 0; i <= 4; i++) {
    const pos = PADDING + (i / 4) * INNER_SIZE;
    gridLines.push(<line key={`h${i}`} x1={PADDING} y1={pos} x2={CANVAS_SIZE - PADDING} y2={pos} stroke="#3A3A5C" strokeWidth="1" />);
    gridLines.push(<line key={`v${i}`} x1={pos} y1={PADDING} x2={pos} y2={CANVAS_SIZE - PADDING} stroke="#3A3A5C" strokeWidth="1" />);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#E0E0E0', alignSelf: 'flex-start' }}>
        缓动曲线编辑器
      </div>
      <svg
        ref={svgRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        style={{ backgroundColor: '#2B2B3D', borderRadius: 8, cursor: dragging ? 'grabbing' : 'default' }}
      >
        {gridLines}
        <line
          x1={toSvgX(p0.x)} y1={toSvgY(p0.y)}
          x2={toSvgX(p1.x)} y2={toSvgY(p1.y)}
          stroke="#FF6B6B" strokeWidth="1" strokeDasharray="4,4"
        />
        <line
          x1={toSvgX(p3.x)} y1={toSvgY(p3.y)}
          x2={toSvgX(p2.x)} y2={toSvgY(p2.y)}
          stroke="#FF6B6B" strokeWidth="1" strokeDasharray="4,4"
        />
        <path d={pathD} stroke="#6C63FF" strokeWidth="3" fill="none" />
        <circle cx={toSvgX(p0.x)} cy={toSvgY(p0.y)} r="4" fill="#3A3A5C" />
        <circle cx={toSvgX(p3.x)} cy={toSvgY(p3.y)} r="4" fill="#3A3A5C" />
        <circle
          cx={toSvgX(p1.x)} cy={toSvgY(p1.y)}
          r={POINT_RADIUS} fill="#FF6B6B"
          style={{ cursor: 'grab' }}
          onMouseDown={(e) => { e.preventDefault(); setDragging('p1'); }}
        />
        <circle
          cx={toSvgX(p2.x)} cy={toSvgY(p2.y)}
          r={POINT_RADIUS} fill="#FF6B6B"
          style={{ cursor: 'grab' }}
          onMouseDown={(e) => { e.preventDefault(); setDragging('p2'); }}
        />
      </svg>
      <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#E0E0E0', backgroundColor: '#1E1E2E', padding: '8px 12px', borderRadius: 6 }}>
        {cubicBezierToString(easing)}
      </div>
    </div>
  );
};
