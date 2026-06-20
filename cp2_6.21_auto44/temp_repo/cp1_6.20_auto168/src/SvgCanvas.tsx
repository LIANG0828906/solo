import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/store';
import type { AnchorPoint, Layer, GradientType } from '@/types';

const CANVAS_W = 800;
const CANVAS_H = 600;
const MINIMAP_SIZE = 150;

function interpolateColor(c1: string, c2: string, t: number): string {
  const parse = (hex: string) => {
    const h = hex.replace('#', '');
    return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)];
  };
  const [r1, g1, b1] = parse(c1);
  const [r2, g2, b2] = parse(c2);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function calculateGradientStops(anchors: AnchorPoint[]): { offset: number; color: string }[] {
  if (anchors.length === 0) return [];
  if (anchors.length === 1) return [{ offset: 0, color: anchors[0].color }];

  const sorted = [...anchors].sort((a, b) => a.x - b.x || a.y - b.y);
  const minX = Math.min(...sorted.map((a) => a.x));
  const maxX = Math.max(...sorted.map((a) => a.x));
  const minY = Math.min(...sorted.map((a) => a.y));
  const maxY = Math.max(...sorted.map((a) => a.y));
  const range = Math.max(maxX - minX, maxY - minY, 1);

  return sorted.map((a) => ({
    offset: Math.max(0, Math.min(1, ((a.x - minX) + (a.y - minY)) / (2 * range))),
    color: a.color,
  }));
}

function generateConicPaths(
  anchors: AnchorPoint[],
  cx: number,
  cy: number,
  radius: number
): React.JSX.Element[] {
  if (anchors.length === 0) return [];

  const segments = 120;
  const angleStep = 360 / segments;
  const paths: React.JSX.Element[] = [];

  const sorted = [...anchors].sort((a, b) => {
    const angleA = Math.atan2(a.y - cy, a.x - cx);
    const angleB = Math.atan2(b.y - cy, b.x - cx);
    return angleA - angleB;
  });

  const anchorAngles = sorted.map((a) => {
    let angle = Math.atan2(a.y - cy, a.x - cx) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    return { angle, color: a.color };
  });

  function colorAtAngle(deg: number): string {
    const normalizedDeg = ((deg % 360) + 360) % 360;
    if (anchorAngles.length === 1) return anchorAngles[0].color;

    for (let i = 0; i < anchorAngles.length; i++) {
      const next = (i + 1) % anchorAngles.length;
      const aCurr = anchorAngles[i].angle;
      const aNext = anchorAngles[next].angle;
      let diff = aNext - aCurr;
      if (diff < 0) diff += 360;

      if (normalizedDeg >= aCurr && normalizedDeg < aCurr + diff) {
        const t = (normalizedDeg - aCurr) / diff;
        return interpolateColor(anchorAngles[i].color, anchorAngles[next].color, t);
      }
    }
    return anchorAngles[0].color;
  }

  for (let i = 0; i < segments; i++) {
    const startAngle = i * angleStep;
    const endAngle = (i + 1) * angleStep;
    const midAngle = startAngle + angleStep / 2;
    const color = colorAtAngle(midAngle);

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const largeArc = angleStep > 180 ? 1 : 0;

    paths.push(
      <path
        key={`conic-${i}`}
        d={`M${cx},${cy} L${x1},${y1} A${radius},${radius} 0 ${largeArc},1 ${x2},${y2} Z`}
        fill={color}
      />
    );
  }

  return paths;
}

function buildGradientDef(layer: Layer): React.JSX.Element | null {
  const { anchors, gradientType, id } = layer;
  if (anchors.length === 0) return null;

  const gradId = `grad-${id}`;

  if (gradientType === 'linear') {
    const first = anchors[0];
    const last = anchors[anchors.length - 1];
    const stops = calculateGradientStops(anchors);
    return (
      <linearGradient key={gradId} id={gradId} x1={`${first.x}%`} y1={`${first.y}%`} x2={`${last.x}%`} y2={`${last.y}%`}>
        {stops.map((s, i) => (
          <stop key={i} offset={`${(s.offset * 100).toFixed(2)}%`} stopColor={s.color} />
        ))}
      </linearGradient>
    );
  }

  if (gradientType === 'radial') {
    const cx = anchors.reduce((s, a) => s + a.x, 0) / anchors.length;
    const cy = anchors.reduce((s, a) => s + a.y, 0) / anchors.length;
    const maxDist = Math.max(...anchors.map((a) => Math.hypot(a.x - cx, a.y - cy)), 1);
    const r = maxDist;
    const stops = calculateGradientStops(anchors);
    return (
      <radialGradient key={gradId} id={gradId} cx={`${cx}%`} cy={`${cy}%`} r={`${r}%`}>
        {stops.map((s, i) => (
          <stop key={i} offset={`${(s.offset * 100).toFixed(2)}%`} stopColor={s.color} />
        ))}
      </radialGradient>
    );
  }

  return null;
}

function buildLayerContent(layer: Layer): React.JSX.Element | null {
  const { gradientType, anchors, id } = layer;
  if (anchors.length === 0) return null;

  if (gradientType === 'conic') {
    const cx = anchors.reduce((s, a) => s + a.x, 0) / anchors.length;
    const cy = anchors.reduce((s, a) => s + a.y, 0) / anchors.length;
    const maxDist = Math.max(...anchors.map((a) => Math.hypot(a.x - cx, a.y - cy)), 1);
    const radius = Math.max(maxDist, Math.hypot(CANVAS_W, CANVAS_H));
    const paths = generateConicPaths(anchors, cx, cy, radius);
    return <g key={`layer-content-${id}`}>{paths}</g>;
  }

  const gradId = `grad-${id}`;
  return <rect key={`layer-content-${id}`} x="0" y="0" width={CANVAS_W} height={CANVAS_H} fill={`url(#${gradId})`} />;
}

const SvgCanvas: React.FC = () => {
  const layers = useAppStore((s) => s.layers);
  const activeLayerId = useAppStore((s) => s.activeLayerId);
  const canvasState = useAppStore((s) => s.canvasState);
  const gradientTransitioning = useAppStore((s) => s.gradientTransitioning);
  const addAnchor = useAppStore((s) => s.addAnchor);
  const updateAnchor = useAppStore((s) => s.updateAnchor);
  const setZoom = useAppStore((s) => s.setZoom);
  const setPan = useAppStore((s) => s.setPan);

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{ anchorId: string; layerId: string } | null>(null);
  const [dragGlow, setDragGlow] = useState<{ x: number; y: number; color: string } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const rafRef = useRef<number>(0);
  const pendingMoveRef = useRef<{ x: number; y: number } | null>(null);

  const activeLayer = useMemo(() => layers.find((l) => l.id === activeLayerId) ?? null, [layers, activeLayerId]);

  const { zoom, panX, panY } = canvasState;
  const viewBoxW = CANVAS_W / (zoom / 100);
  const viewBoxH = CANVAS_H / (zoom / 100);
  const viewBox = `${-panX} ${-panY} ${viewBoxW} ${viewBoxH}`;

  const gradientDefs = useMemo(() => {
    return layers.filter((l) => l.visible).map(buildGradientDef).filter(Boolean);
  }, [layers]);

  const sortedLayers = useMemo(() => {
    return [...layers].sort((a, b) => a.order - b.order).filter((l) => l.visible);
  }, [layers]);

  const svgPoint = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return { x: 0, y: 0 };
      const svgP = pt.matrixTransform(ctm.inverse());
      return { x: svgP.x, y: svgP.y };
    },
    []
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<SVGCircleElement>, anchorId: string, layerId: string, color: string, ax: number, ay: number) => {
      e.stopPropagation();
      e.preventDefault();
      setDragging({ anchorId, layerId });
      setDragGlow({ x: ax, y: ay, color });
    },
    []
  );

  useEffect(() => {
    if (!dragging) return;

    const onMouseMove = (e: MouseEvent) => {
      const pos = svgPoint(e.clientX, e.clientY);
      pendingMoveRef.current = pos;
      setDragGlow((prev) => (prev ? { ...prev, x: pos.x, y: pos.y } : null));

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const p = pendingMoveRef.current;
        if (!p) return;
        updateAnchor(dragging.layerId, dragging.anchorId, { x: p.x, y: p.y });
      });
    };

    const onMouseUp = () => {
      setDragging(null);
      setDragGlow(null);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      pendingMoveRef.current = null;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [dragging, svgPoint, updateAnchor]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setSpaceHeld(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpaceHeld(false);
        setIsPanning(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent<SVGSVGElement>) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -10 : 10;
      setZoom(zoom + delta);
    },
    [zoom, setZoom]
  );

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (spaceHeld) {
        setIsPanning(true);
        panStartRef.current = { x: e.clientX, y: e.clientY, panX, panY };
        return;
      }
    },
    [spaceHeld, panX, panY]
  );

  useEffect(() => {
    if (!isPanning) return;

    const onMouseMove = (e: MouseEvent) => {
      const start = panStartRef.current;
      if (!start) return;
      const dx = (e.clientX - start.x) * (viewBoxW / (svgRef.current?.clientWidth ?? 1));
      const dy = (e.clientY - start.y) * (viewBoxH / (svgRef.current?.clientHeight ?? 1));
      setPan(start.panX - dx, start.panY - dy);
    };

    const onMouseUp = () => {
      setIsPanning(false);
      panStartRef.current = null;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isPanning, viewBoxW, viewBoxH, setPan]);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!activeLayerId) return;
      const pos = svgPoint(e.clientX, e.clientY);
      const pctX = (pos.x / CANVAS_W) * 100;
      const pctY = (pos.y / CANVAS_H) * 100;
      addAnchor(activeLayerId, pctX, pctY);
    },
    [activeLayerId, svgPoint, addAnchor]
  );

  const cursorClass = isPanning ? 'cursor-grabbing' : spaceHeld ? 'cursor-grab' : dragging ? 'cursor-grabbing' : '';

  const minimapScale = MINIMAP_SIZE / Math.max(CANVAS_W, CANVAS_H);
  const vpW = (viewBoxW / CANVAS_W) * MINIMAP_SIZE;
  const vpH = (viewBoxH / CANVAS_H) * (MINIMAP_SIZE * (CANVAS_H / CANVAS_W));
  const vpX = (panX / CANVAS_W) * MINIMAP_SIZE;
  const vpY = (panY / CANVAS_H) * (MINIMAP_SIZE * (CANVAS_H / CANVAS_W));

  return (
    <div ref={containerRef} className="relative flex-1 overflow-hidden">
      <svg
        ref={svgRef}
        viewBox={viewBox}
        className={`w-full h-full checkerboard ${cursorClass}`}
        onWheel={handleWheel}
        onMouseDown={handleCanvasMouseDown}
        onDoubleClick={handleDoubleClick}
        style={dragging ? { cursor: 'grabbing' } : spaceHeld ? { cursor: 'grab' } : undefined}
      >
        <defs>{gradientDefs}</defs>

        {sortedLayers.map((layer) => (
          <g
            key={layer.id}
            style={{ mixBlendMode: layer.blendMode }}
            className={gradientTransitioning ? 'gradient-transition' : undefined}
          >
            {buildLayerContent(layer)}
          </g>
        ))}

        {activeLayer &&
          activeLayer.anchors.map((anchor) => (
            <g key={anchor.id}>
              <circle
                cx={`${anchor.x}%`}
                cy={`${anchor.y}%`}
                r={8}
                fill={anchor.color}
                stroke="white"
                strokeWidth={2}
                className="anchor-glow"
                style={{ cursor: 'grab', transition: 'all 200ms ease-in-out' }}
                onMouseDown={(e) => handleMouseDown(e, anchor.id, activeLayer.id, anchor.color, anchor.x, anchor.y)}
              />
              {dragGlow && dragging?.anchorId === anchor.id && (
                <circle
                  cx={`${dragGlow.x}%`}
                  cy={`${dragGlow.y}%`}
                  r={20}
                  fill={dragGlow.color}
                  opacity={0.4}
                  style={{ pointerEvents: 'none', transition: 'all 200ms ease-in-out' }}
                />
              )}
            </g>
          ))}
      </svg>

      <div
        className="absolute top-2 right-2 border border-gray-600 rounded bg-gray-900/80 overflow-hidden"
        style={{ width: MINIMAP_SIZE, height: MINIMAP_SIZE * (CANVAS_H / CANVAS_W) }}
      >
        <svg viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} width={MINIMAP_SIZE} height={MINIMAP_SIZE * (CANVAS_H / CANVAS_W)}>
          {sortedLayers.map((layer) => (
            <g key={`mini-${layer.id}`} style={{ mixBlendMode: layer.blendMode }}>
              {buildLayerContent(layer)}
            </g>
          ))}
          <rect
            className="minimap-viewport"
            x={panX}
            y={panY}
            width={viewBoxW}
            height={viewBoxH}
            fill="none"
          />
        </svg>
      </div>
    </div>
  );
};

export default SvgCanvas;
