import { useRef, useEffect, useState, useCallback } from 'react';
import { useDreamStore } from '@/store/dreamStore';
import type { IslandNode } from '@/types';

const CATEGORY_COLORS: Record<string, string[]> = {
  nature: ['#2E8B57', '#3CB371', '#66CDAA', '#98FB98'],
  architecture: ['#696969', '#808080', '#A9A9A9', '#D3D3D3'],
  emotion: ['#7B68EE', '#9370DB', '#BA55D3', '#DA70D6'],
  action: ['#CD853F', '#DEB887', '#F4A460', '#FFD700'],
  object: ['#4682B4', '#5F9EA0', '#87CEEB', '#B0E0E6'],
};

function getCategoryColor(category: string): string {
  const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.object;
  return colors[Math.floor(Math.random() * colors.length)];
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface FogParticle {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  speed: number;
}

export default function Visualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { decodedSymbols, connections, selectedDream } = useDreamStore();

  const islandsRef = useRef<IslandNode[]>([]);
  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const dragRef = useRef({ active: false, startX: 0, startY: 0, panStartX: 0, panStartY: 0 });
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef(0);
  const fogRef = useRef<FogParticle[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 600 });
  const [selectedIsland, setSelectedIsland] = useState<IslandNode | null>(null);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });

  const selectedIslandRef = useRef<IslandNode | null>(null);
  const popupPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    selectedIslandRef.current = selectedIsland;
  }, [selectedIsland]);

  useEffect(() => {
    popupPosRef.current = popupPos;
  }, [popupPos]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        setCanvasSize({ width: w, height: 600 });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (decodedSymbols.length === 0) {
      islandsRef.current = [];
      return;
    }

    const rand = seededRandom(decodedSymbols.reduce((acc, s) => acc + s.matchCount, 0));
    const cx = canvasSize.width / 2;
    const cy = 300;

    const islands: IslandNode[] = decodedSymbols.map((symbol, i) => {
      const angle = (i / decodedSymbols.length) * Math.PI * 2;
      const spread = Math.min(cx * 0.6, 200);
      const dist = spread * (0.4 + rand() * 0.6);
      const x = cx + Math.cos(angle) * dist;
      const y = cy + Math.sin(angle) * dist * 0.7;
      const radius = 30 + rand() * 20;

      return {
        symbolName: symbol.symbolName,
        emoji: symbol.emoji,
        category: symbol.category,
        matchCount: symbol.matchCount,
        x,
        y,
        radius,
        targetX: x,
        targetY: y,
      };
    });

    for (let iter = 0; iter < 30; iter++) {
      for (let i = 0; i < islands.length; i++) {
        let fx = 0, fy = 0;
        for (let j = 0; j < islands.length; j++) {
          if (i === j) continue;
          const dx = islands[i].x - islands[j].x;
          const dy = islands[i].y - islands[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy) + 1;
          const repulse = 3000 / (dist * dist);
          fx += (dx / dist) * repulse;
          fy += (dy / dist) * repulse;
        }

        for (const conn of connections) {
          let otherName: string | null = null;
          if (conn.from === islands[i].symbolName) otherName = conn.to;
          else if (conn.to === islands[i].symbolName) otherName = conn.from;
          if (otherName) {
            const other = islands.find((il) => il.symbolName === otherName);
            if (other) {
              const dx = other.x - islands[i].x;
              const dy = other.y - islands[i].y;
              const dist = Math.sqrt(dx * dx + dy * dy) + 1;
              fx += (dx / dist) * conn.strength * 50;
              fy += (dy / dist) * conn.strength * 50;
            }
          }
        }

        fx *= 0.3;
        fy *= 0.3;

        islands[i].targetX = Math.max(60, Math.min(canvasSize.width - 60, islands[i].x + fx));
        islands[i].targetY = Math.max(60, Math.min(canvasSize.height - 60, islands[i].y + fy));
      }

      for (const island of islands) {
        island.x += (island.targetX - island.x) * 0.1;
        island.y += (island.targetY - island.y) * 0.1;
      }
    }

    islandsRef.current = islands;
    panRef.current = { x: 0, y: 0 };
    zoomRef.current = 1;
    setSelectedIsland(null);
  }, [decodedSymbols, connections, canvasSize.width]);

  useEffect(() => {
    const particles: FogParticle[] = [];
    for (let i = 0; i < 15; i++) {
      particles.push({
        x: Math.random() * canvasSize.width,
        y: Math.random() * canvasSize.height,
        radius: 40 + Math.random() * 80,
        opacity: 0.02 + Math.random() * 0.04,
        speed: 0.15 + Math.random() * 0.3,
      });
    }
    fogRef.current = particles;
  }, [canvasSize.width, canvasSize.height]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvasSize;
    timeRef.current += 0.016;

    ctx.clearRect(0, 0, width, height);

    const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.7);
    gradient.addColorStop(0, '#1A0A2E');
    gradient.addColorStop(1, '#0D1B2A');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    for (const fog of fogRef.current) {
      fog.x += fog.speed;
      if (fog.x - fog.radius > width) {
        fog.x = -fog.radius;
        fog.y = Math.random() * height;
      }
      const fogGrad = ctx.createRadialGradient(fog.x, fog.y, 0, fog.x, fog.y, fog.radius);
      fogGrad.addColorStop(0, `rgba(187, 134, 252, ${fog.opacity})`);
      fogGrad.addColorStop(1, 'rgba(187, 134, 252, 0)');
      ctx.fillStyle = fogGrad;
      ctx.beginPath();
      ctx.arc(fog.x, fog.y, fog.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.save();
    ctx.translate(panRef.current.x + width / 2, panRef.current.y + height / 2);
    ctx.scale(zoomRef.current, zoomRef.current);
    ctx.translate(-width / 2, -height / 2);

    const islands = islandsRef.current;
    for (const conn of connections) {
      const fromIsland = islands.find((i) => i.symbolName === conn.from);
      const toIsland = islands.find((i) => i.symbolName === conn.to);
      if (!fromIsland || !toIsland) continue;

      const midX = (fromIsland.x + toIsland.x) / 2;
      const midY = (fromIsland.y + toIsland.y) / 2 - 30;

      ctx.beginPath();
      ctx.moveTo(fromIsland.x, fromIsland.y);
      ctx.quadraticCurveTo(midX, midY, toIsland.x, toIsland.y);
      ctx.strokeStyle = `rgba(135, 206, 250, ${conn.strength})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    for (const island of islands) {
      const breathe = Math.sin(timeRef.current * 2 + island.x * 0.01) * 3;
      const r = island.radius + breathe;
      const colors = CATEGORY_COLORS[island.category] || CATEGORY_COLORS.object;
      const colorIdx = Math.abs(Math.floor(island.x * 0.1)) % colors.length;
      const color = colors[colorIdx];

      const islandGrad = ctx.createRadialGradient(
        island.x - r * 0.2, island.y - r * 0.2, r * 0.1,
        island.x, island.y, r
      );
      islandGrad.addColorStop(0, color + 'CC');
      islandGrad.addColorStop(0.7, color + '88');
      islandGrad.addColorStop(1, color + '22');

      ctx.beginPath();
      ctx.arc(island.x, island.y, r, 0, Math.PI * 2);
      ctx.fillStyle = islandGrad;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(island.x, island.y, r, 0, Math.PI * 2);
      ctx.strokeStyle = color + '44';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = `${Math.max(18, r * 0.6)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(island.emoji, island.x, island.y - 4);

      ctx.font = '10px "Noto Sans SC", sans-serif';
      ctx.fillStyle = '#E0E0E0AA';
      ctx.fillText(island.symbolName, island.x, island.y + r * 0.6);
    }

    ctx.restore();

    animFrameRef.current = requestAnimationFrame(draw);
  }, [canvasSize, connections]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [draw]);

  const screenToCanvas = useCallback((sx: number, sy: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = (sx - rect.left - panRef.current.x - canvasSize.width / 2) / zoomRef.current + canvasSize.width / 2;
    const y = (sy - rect.top - panRef.current.y - canvasSize.height / 2) / zoomRef.current + canvasSize.height / 2;
    return { x, y };
  }, [canvasSize]);

  const findIslandAt = useCallback((cx: number, cy: number) => {
    for (let i = islandsRef.current.length - 1; i >= 0; i--) {
      const island = islandsRef.current[i];
      const dx = cx - island.x;
      const dy = cy - island.y;
      if (dx * dx + dy * dy <= island.radius * island.radius) {
        return island;
      }
    }
    return null;
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const cx = screenToCanvas(e.clientX, e.clientY);
    const island = findIslandAt(cx.x, cx.y);
    if (island) {
      const symbol = decodedSymbols.find((s) => s.symbolName === island.symbolName);
      if (symbol) {
        setSelectedIsland({ ...island });
        setPopupPos({ x: e.clientX - (canvasRef.current?.getBoundingClientRect().left ?? 0), y: e.clientY - (canvasRef.current?.getBoundingClientRect().top ?? 0) });
      }
      return;
    }
    setSelectedIsland(null);
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      panStartX: panRef.current.x,
      panStartY: panRef.current.y,
    };
  }, [screenToCanvas, findIslandAt, decodedSymbols]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    panRef.current.x = dragRef.current.panStartX + dx;
    panRef.current.y = dragRef.current.panStartY + dy;
  }, []);

  const handleMouseUp = useCallback(() => {
    dragRef.current.active = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    zoomRef.current = Math.max(0.3, Math.min(3, zoomRef.current * delta));
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const cx = screenToCanvas(touch.clientX, touch.clientY);
      const island = findIslandAt(cx.x, cx.y);
      if (island) {
        const symbol = decodedSymbols.find((s) => s.symbolName === island.symbolName);
        if (symbol) {
          setSelectedIsland({ ...island });
          setPopupPos({
            x: touch.clientX - (canvasRef.current?.getBoundingClientRect().left ?? 0),
            y: touch.clientY - (canvasRef.current?.getBoundingClientRect().top ?? 0),
          });
        }
        return;
      }
      dragRef.current = {
        active: true,
        startX: touch.clientX,
        startY: touch.clientY,
        panStartX: panRef.current.x,
        panStartY: panRef.current.y,
      };
    }
  }, [screenToCanvas, findIslandAt, decodedSymbols]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && dragRef.current.active) {
      const touch = e.touches[0];
      const dx = touch.clientX - dragRef.current.startX;
      const dy = touch.clientY - dragRef.current.startY;
      panRef.current.x = dragRef.current.panStartX + dx;
      panRef.current.y = dragRef.current.panStartY + dy;
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if ((dragRef.current as any).pinchDist) {
        const scale = dist / (dragRef.current as any).pinchDist;
        zoomRef.current = Math.max(0.3, Math.min(3, zoomRef.current * scale));
      }
      (dragRef.current as any).pinchDist = dist;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    dragRef.current.active = false;
    delete (dragRef.current as any).pinchDist;
  }, []);

  if (!selectedDream) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 opacity-20">🌌</div>
          <p className="text-dream-text/20 text-sm">选择梦境以查看 Dreamscape Map</p>
        </div>
      </div>
    );
  }

  const symbol = selectedIsland ? decodedSymbols.find((s) => s.symbolName === selectedIsland.symbolName) : null;

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="w-full rounded-xl cursor-grab active:cursor-grabbing"
        style={{ height: 600 }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {selectedIsland && symbol && (
        <div
          className="absolute animate-fadeIn pointer-events-auto"
          style={{
            left: Math.min(popupPos.x, canvasSize.width - 200),
            top: Math.min(popupPos.y, canvasSize.height - 120),
          }}
        >
          <div className="bg-dream-panel/95 backdrop-blur-md border border-dream-border rounded-xl p-3 shadow-lg min-w-[160px] max-w-[220px]">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xl">{selectedIsland.emoji}</span>
              <span className="text-sm font-bold text-dream-purple">{selectedIsland.symbolName}</span>
            </div>
            <div className="text-[10px] text-dream-text/50 mb-1">
              匹配次数: <span className="text-dream-purple font-bold">×{selectedIsland.matchCount}</span>
            </div>
            <div className="text-[10px] text-dream-text/40 mb-1">
              类别: {selectedIsland.category}
            </div>
            {symbol.contexts.length > 0 && (
              <div className="mt-1.5 pt-1.5 border-t border-dream-border/50">
                <div className="text-[9px] text-dream-text/30 mb-1">相关语境:</div>
                {symbol.contexts.map((ctx, i) => (
                  <div key={i} className="text-[10px] text-dream-text/50 italic leading-snug">
                    "{ctx}"
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setSelectedIsland(null)}
              className="absolute top-1.5 right-2 text-dream-text/30 hover:text-dream-text/60 text-xs transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {decodedSymbols.length > 0 && (
        <div className="absolute bottom-3 left-3 text-[10px] text-dream-text/25">
          拖拽平移 · 滚轮缩放 · 点击岛屿查看详情
        </div>
      )}
    </div>
  );
}
