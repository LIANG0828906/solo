import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { BuildPhase } from '@/types';

interface LayerInfo {
  phase: BuildPhase;
  y: number;
  height: number;
  width: number;
  left: number;
  progress: number;
  isBuilding: boolean;
  hovered: boolean;
}

const LAYER_MATERIAL_COLORS: Record<string, { fill: string; stroke: string; highlight: string }> = {
  stone: {
    fill: '#9e9e9e',
    stroke: '#616161',
    highlight: '#bdbdbd',
  },
  wood: {
    fill: '#a0622d',
    stroke: '#6b3e14',
    highlight: '#c4883f',
  },
  gold: {
    fill: '#e8c547',
    stroke: '#b8971c',
    highlight: '#ffdf6e',
  },
};

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const phases = useGameStore((s) => s.phases);
  const buildQueue = useGameStore((s) => s.buildQueue);
  const rafRef = useRef<number | null>(null);
  const timeRef = useRef(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; phase: BuildPhase } | null>(null);
  const dimsRef = useRef({ w: 0, h: 0 });

  const buildingPhaseProgress = useMemo(() => {
    const map: Record<string, number> = {};
    buildQueue.forEach((t) => {
      map[t.phaseId] = t.progress;
    });
    return map;
  }, [buildQueue]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dimsRef.current = { w: rect.width, h: rect.height };
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const draw = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const { w, h } = dimsRef.current;
      timeRef.current += 16;
      const t = timeRef.current;

      ctx.clearRect(0, 0, w, h);

      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#f4a460');
      bgGrad.addColorStop(0.55, '#f5deb3');
      bgGrad.addColorStop(1, '#e8c98a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      const sunX = w * 0.82;
      const sunY = h * 0.15;
      const sunR = Math.min(w, h) * 0.08;
      const sunGrad = ctx.createRadialGradient(sunX, sunY, 2, sunX, sunY, sunR * 2);
      sunGrad.addColorStop(0, 'rgba(255,230,120,0.9)');
      sunGrad.addColorStop(0.3, 'rgba(255,200,80,0.35)');
      sunGrad.addColorStop(1, 'rgba(255,180,60,0)');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff3b0';
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR * 0.7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(210,150,90,0.4)';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.75);
      ctx.quadraticCurveTo(w * 0.25, h * 0.65, w * 0.5, h * 0.72);
      ctx.quadraticCurveTo(w * 0.75, h * 0.78, w, h * 0.7);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      const bottomY = h * 0.88;
      const topY = h * 0.12;
      const totalHeight = bottomY - topY;
      const layerHeight = totalHeight / 12;
      const baseWidth = Math.min(w * 0.68, totalHeight * 0.85);
      const cx = w / 2;

      const layers: LayerInfo[] = [];
      for (let i = 0; i < 12; i++) {
        const phase = phases[i];
        if (!phase) continue;
        const layerY = bottomY - (i + 1) * layerHeight;
        const taperRatio = (11 - i) / 11;
        const layerWidth = baseWidth * (0.3 + 0.7 * (i / 11));
        const layerLeft = cx - layerWidth / 2;
        const isBuilding = phase.status === 'building';
        layers.push({
          phase,
          y: layerY,
          height: layerHeight,
          width: layerWidth,
          left: layerLeft,
          progress: buildingPhaseProgress[phase.id] ?? (phase.status === 'completed' ? 100 : 0),
          isBuilding,
          hovered: hoveredIndex === i,
        });
      }

      ctx.strokeStyle = 'rgba(61,43,31,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - baseWidth / 2 - 12, bottomY + 2);
      ctx.lineTo(cx + baseWidth / 2 + 12, bottomY + 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(120,80,40,0.25)';
      ctx.fillRect(cx - baseWidth / 2 - 18, bottomY + 3, baseWidth + 36, 6);

      layers.forEach((layer) => {
        const { phase, y, height, width, left, progress, isBuilding, hovered } = layer;
        if (phase.status === 'locked' && progress === 0) {
          ctx.save();
          ctx.globalAlpha = 0.25;
          ctx.strokeStyle = 'rgba(61,43,31,0.4)';
          ctx.setLineDash([4, 4]);
          ctx.lineWidth = 1;
          ctx.strokeRect(left + 2, y + 2, width - 4, height - 4);
          ctx.restore();
          return;
        }

        const mainMaterial = phase.materials[0] ?? 'stone';
        const colors = LAYER_MATERIAL_COLORS[mainMaterial];
        const completedPct = phase.status === 'completed' ? 1 : progress / 100;

        let breathe = 1;
        if (isBuilding) {
          breathe = 1 + Math.sin(t / 400) * 0.015;
        }

        const drawWidth = width * breathe;
        const drawLeft = cx - drawWidth / 2;
        const fillWidth = drawWidth * completedPct;

        let fillColor = colors.fill;
        let strokeColor = colors.stroke;

        if (hovered) {
          fillColor = colors.highlight;
        }

        ctx.save();
        ctx.beginPath();
        ctx.rect(drawLeft, y, drawWidth, height);
        ctx.clip();

        const grad = ctx.createLinearGradient(drawLeft, y, drawLeft, y + height);
        grad.addColorStop(0, colors.highlight);
        grad.addColorStop(0.5, fillColor);
        grad.addColorStop(1, strokeColor);
        ctx.fillStyle = grad;
        ctx.fillRect(drawLeft, y, fillWidth, height);

        if (phase.status === 'completed' && phase.materials.includes('gold')) {
          ctx.globalAlpha = 0.35 + Math.sin(t / 600 + i) * 0.15;
          const shimmerGrad = ctx.createLinearGradient(drawLeft, y, drawLeft + drawWidth, y);
          shimmerGrad.addColorStop(0, 'rgba(255,255,255,0)');
          shimmerGrad.addColorStop(0.5, 'rgba(255,255,220,0.6)');
          shimmerGrad.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = shimmerGrad;
          ctx.fillRect(drawLeft, y, drawWidth, height);
        }
        ctx.globalAlpha = 1;

        const stoneW = 28;
        const stoneH = height / 2;
        for (let row = 0; row < 2; row++) {
          for (let col = 0; col < Math.ceil(drawWidth / stoneW) + 1; col++) {
            const sx = drawLeft + col * stoneW + (row % 2 === 1 ? stoneW / 2 : 0);
            const sy = y + row * stoneH + 2;
            if (sx > drawLeft + fillWidth) continue;
            const sw = Math.min(stoneW - 3, drawLeft + fillWidth - sx);
            if (sw <= 0) continue;
            ctx.strokeStyle = 'rgba(0,0,0,0.12)';
            ctx.lineWidth = 0.8;
            ctx.strokeRect(sx, sy, sw, stoneH - 4);
          }
        }

        if (isBuilding) {
          const shimmerX = ((t / 15) % (drawWidth + 80)) - 80;
          const shimmerGrad2 = ctx.createLinearGradient(shimmerX, y, shimmerX + 80, y);
          shimmerGrad2.addColorStop(0, 'rgba(255,255,255,0)');
          shimmerGrad2.addColorStop(0.5, 'rgba(255,255,255,0.45)');
          shimmerGrad2.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = shimmerGrad2;
          ctx.fillRect(drawLeft, y, drawWidth, height);
        }

        ctx.restore();

        ctx.strokeStyle = hovered ? 'var(--gold-dark)' : strokeColor;
        ctx.lineWidth = hovered ? 2.5 : 1.2;
        ctx.strokeRect(drawLeft, y, drawWidth, height);

        if (hovered) {
          ctx.save();
          ctx.strokeStyle = 'rgba(207,181,59,0.6)';
          ctx.lineWidth = 3;
          ctx.setLineDash([6, 4]);
          ctx.strokeRect(drawLeft - 3, y - 3, drawWidth + 6, height + 6);
          ctx.restore();
        }

        if (phase.status === 'building' || (progress > 0 && progress < 100)) {
          const progLeft = drawLeft + 6;
          const progRight = drawLeft + drawWidth - 6;
          const progY = y + height - 6;
          const progW = progRight - progLeft;
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
          ctx.fillRect(progLeft, progY - 3, progW, 3);
          const fillProg = progW * completedPct;
          const pGrad = ctx.createLinearGradient(progLeft, 0, progRight, 0);
          pGrad.addColorStop(0, 'var(--gold)');
          pGrad.addColorStop(1, 'var(--gold-light)');
          ctx.fillStyle = pGrad;
          ctx.fillRect(progLeft, progY - 3, fillProg, 3);
        }
      });

      const topPhase = phases[phases.length - 1];
      if (topPhase?.status === 'completed') {
        const tipY = topY - layerHeight * 0.35;
        ctx.save();
        ctx.fillStyle = 'rgba(255,220,80,0.25)';
        for (let r = 1; r <= 3; r++) {
          ctx.beginPath();
          ctx.moveTo(cx, tipY - r * 6);
          ctx.lineTo(cx - baseWidth * 0.1 * r, bottomY - 12 * layerHeight);
          ctx.lineTo(cx + baseWidth * 0.1 * r, bottomY - 12 * layerHeight);
          ctx.closePath();
          ctx.globalAlpha = 0.15 / r;
          ctx.fill();
        }
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [phases, buildingPhaseProgress, hoveredIndex]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const { w, h } = dimsRef.current;

    const bottomY = h * 0.88;
    const topY = h * 0.12;
    const totalHeight = bottomY - topY;
    const layerHeight = totalHeight / 12;
    const baseWidth = Math.min(w * 0.68, totalHeight * 0.85);
    const cx = w / 2;

    let found: number | null = null;
    for (let i = 0; i < 12; i++) {
      const layerY = bottomY - (i + 1) * layerHeight;
      const layerWidth = baseWidth * (0.3 + 0.7 * (i / 11));
      const layerLeft = cx - layerWidth / 2;
      if (mx >= layerLeft && mx <= layerLeft + layerWidth && my >= layerY && my <= layerY + layerHeight) {
        found = i;
        break;
      }
    }

    if (found !== hoveredIndex) {
      setHoveredIndex(found);
    }

    if (found !== null) {
      const phase = phases[found];
      if (phase && phase.status !== 'locked') {
        setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, phase });
      } else {
        setTooltip(null);
      }
    } else {
      setTooltip(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    setTooltip(null);
  };

  const completedCount = phases.filter((p) => p.status === 'completed').length;

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden" style={{ minWidth: 0 }}>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />

      {tooltip && (
        <div
          className="absolute z-10 pointer-events-none fade-in"
          style={{
            left: Math.min(tooltip.x + 14, dimsRef.current.w - 220),
            top: Math.max(tooltip.y - 10, 8),
          }}
        >
          <div
            className="px-3 py-2 rounded-xl min-w-[200px]"
            style={{
              background: 'rgba(61,43,31,0.92)',
              border: '1px solid var(--gold)',
              boxShadow: 'var(--shadow-lg)',
              color: '#fff',
            }}
          >
            <div className="text-sm font-bold mb-1" style={{ color: 'var(--gold-light)' }}>
              阶段 {tooltip.phase.index + 1}: {tooltip.phase.name}
            </div>
            <div className="text-[11px] opacity-80 mb-1.5">{tooltip.phase.description}</div>
            <div
              className="text-[11px] font-medium px-1.5 py-0.5 rounded inline-block"
              style={{
                background:
                  tooltip.phase.status === 'completed'
                    ? 'rgba(58,140,58,0.4)'
                    : tooltip.phase.status === 'building'
                    ? 'rgba(207,181,59,0.4)'
                    : 'rgba(156,163,175,0.3)',
              }}
            >
              {tooltip.phase.status === 'completed'
                ? '已完成'
                : tooltip.phase.status === 'building'
                ? '建造中'
                : '可建造'}
            </div>
          </div>
        </div>
      )}

      <div
        className="absolute top-3 left-3 px-3 py-1.5 rounded-xl fade-in"
        style={{
          background: 'rgba(61,43,31,0.85)',
          border: '1px solid var(--gold)',
          color: '#fff',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div className="text-xs font-bold" style={{ color: 'var(--gold-light)' }}>
          🏛️ 胡夫金字塔
        </div>
        <div className="text-[10px] opacity-80 mt-0.5">
          已完成 {completedCount} / {phases.length} 阶段 ·{' '}
          {Math.round((completedCount / phases.length) * 100)}%
        </div>
      </div>
    </div>
  );
};
