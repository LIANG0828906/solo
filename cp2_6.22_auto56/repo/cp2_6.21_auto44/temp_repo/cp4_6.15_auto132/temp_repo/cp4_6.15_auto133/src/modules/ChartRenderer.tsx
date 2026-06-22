import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell
} from 'recharts';
import type {
  DailyPlay,
  AudienceAge,
  HeatmapCell,
  TrackNode,
  TrackFlow
} from './DataQuery';

export function injectChartStyles() {
  return (
    <style>{`
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes fadeSlideUp {
        from { opacity: 0; transform: translateY(20px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes barRise {
        from { transform: scaleY(0); opacity: 0; }
        to { transform: scaleY(1); opacity: 1; }
      }
      @keyframes radarPulse {
        0%, 100% { box-shadow: 0 0 8px #00d4ff; }
        50% { box-shadow: 0 0 16px #00ffc3, 0 0 32px rgba(0,255,195,0.4); }
      }
      @keyframes skeletonShimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      .recharts-bar-rectangle {
        transition: transform 0.2s ease !important;
      }
      .recharts-bar-rectangle:hover {
        transform: scaleY(1.1) scaleX(1.05) !important;
        filter: brightness(1.2);
      }
    `}</style>
  );
}

function getBarColor(value: number, max: number): string {
  const ratio = Math.min(value / max, 1);
  if (ratio < 0.33) return '#60a5fa';
  if (ratio < 0.66) return '#6366f1';
  return '#7c3aed';
}

interface BarModalProps {
  data: DailyPlay | null;
  onClose: () => void;
}

function BarModal({ data, onClose }: BarModalProps) {
  if (!data) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.3s ease'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1a1a2e',
          borderRadius: '12px',
          padding: '24px',
          minWidth: '320px',
          boxShadow: '0 8px 32px rgba(0,212,255,0.2)',
          border: '1px solid #2a2a4e'
        }}
      >
        <h3 style={{ color: '#00d4ff', margin: 0, marginBottom: 16, fontSize: 18 }}>
          {data.date} Top 3 作品
        </h3>
        <div style={{ color: '#fff', marginBottom: 16, fontSize: 14, opacity: 0.8 }}>
          当日总播放量: <span style={{ color: '#00ffc3', fontWeight: 600 }}>{data.plays.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data.topTracks.map((track, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                background: '#252545',
                borderRadius: '8px'
              }}
            >
              <span style={{ color: '#fff', fontSize: 14 }}>
                <span style={{ color: '#00ffc3', marginRight: 8, fontWeight: 600 }}>#{idx + 1}</span>
                {track.name}
              </span>
              <span style={{ color: '#00d4ff', fontSize: 14, fontWeight: 500 }}>
                {track.plays.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          style={{
            marginTop: 20,
            width: '100%',
            padding: '10px',
            background: 'linear-gradient(135deg, #00d4ff, #00ffc3)',
            border: 'none',
            borderRadius: '8px',
            color: '#0f0f23',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          关闭
        </button>
      </div>
    </div>
  );
}

function DailyBarChart({ data, animKey }: { data: DailyPlay[]; animKey: number }) {
  const [modalData, setModalData] = useState<DailyPlay | null>(null);
  const maxPlays = useMemo(() => Math.max(...data.map(d => d.plays), 1), [data]);

  const chartData = data.map(d => ({
    ...d,
    shortDate: d.date.slice(5)
  }));

  return (
    <div key={animKey} style={{ width: '100%', height: '100%', animation: 'fadeSlideUp 0.4s ease' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
          <XAxis
            dataKey="shortDate"
            tick={{ fill: '#8888aa', fontSize: 11 }}
            axisLine={{ stroke: '#2a2a4e' }}
            tickLine={{ stroke: '#2a2a4e' }}
          />
          <YAxis
            tick={{ fill: '#8888aa', fontSize: 11 }}
            axisLine={{ stroke: '#2a2a4e' }}
            tickLine={{ stroke: '#2a2a4e' }}
          />
          <Tooltip
            contentStyle={{
              background: '#1a1a2e',
              border: '1px solid #2a2a4e',
              borderRadius: '8px',
              color: '#fff',
              fontSize: 12
            }}
            formatter={(value: number) => [value.toLocaleString(), '播放量']}
          />
          <Bar
            dataKey="plays"
            onClick={(entry) => setModalData(entry as DailyPlay)}
            cursor="pointer"
            animationDuration={800}
            animationBegin={0}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={index}
                fill={getBarColor(entry.plays, maxPlays)}
                style={{
                  transformOrigin: 'bottom',
                  animation: `barRise 0.6s ease ${index * 20}ms both`,
                  transition: 'transform 0.2s ease'
                }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <BarModal data={modalData} onClose={() => setModalData(null)} />
    </div>
  );
}

function AudienceRadarChart({ data, animKey }: { data: AudienceAge; animKey: number }) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const chartData = [
    { subject: '18-24岁', value: data['18-24'], key: '18-24' },
    { subject: '25-34岁', value: data['25-34'], key: '25-34' },
    { subject: '35-44岁', value: data['35-44'], key: '35-44' },
    { subject: '45岁以上', value: data['45+'], key: '45+' },
    { subject: '未知年龄', value: data['unknown'], key: 'unknown' }
  ];

  return (
    <div key={animKey} style={{ width: '100%', height: '100%', position: 'relative', animation: 'fadeSlideUp 0.4s ease' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData} outerRadius="70%">
          <PolarGrid stroke="#2a2a4e" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: '#8888aa', fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: '#666688', fontSize: 10 }}
            stroke="#2a2a4e"
          />
          <defs>
            <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00ffc3" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0.4} />
            </linearGradient>
          </defs>
          <Radar
            name="占比"
            dataKey="value"
            stroke="#00d4ff"
            strokeWidth={2}
            fill="url(#radarGradient)"
            isAnimationActive
            animationBegin={0}
            animationDuration={1000}
            animationEasing="ease-out"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={index}
                onClick={() => setHoveredKey(hoveredKey === entry.key ? null : entry.key)}
                style={{ cursor: 'pointer' }}
              />
            ))}
          </Radar>
        </RadarChart>
      </ResponsiveContainer>
      {chartData.map((entry, idx) => {
        const angles = [90, 162, 234, 306, 18];
        const angle = angles[idx];
        const rad = (angle - 90) * (Math.PI / 180);
        const radius = 75;
        const cx = 50 + radius * Math.cos(rad);
        const cy = 50 + radius * Math.sin(rad);
        const isHovered = hoveredKey === entry.key;
        return (
          <div
            key={entry.key}
            onMouseEnter={() => setHoveredKey(entry.key)}
            onMouseLeave={() => setHoveredKey(null)}
            style={{
              position: 'absolute',
              left: `${cx}%`,
              top: `${cy}%`,
              transform: 'translate(-50%, -50%)',
              width: isHovered ? 16 : 10,
              height: isHovered ? 16 : 10,
              borderRadius: '50%',
              background: isHovered ? '#00ffc3' : '#00d4ff',
              boxShadow: isHovered
                ? `0 0 20px #00ffc3, 0 0 40px rgba(0,255,195,0.3)`
                : `0 0 8px #00d4ff`,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              animation: `radarPulse 1.5s ease ${idx * 0.2}s infinite`
            }}
          >
            {isHovered && (
              <div
                style={{
                  position: 'absolute',
                  top: -30,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#0f0f23',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  color: '#00ffc3',
                  fontSize: 12,
                  whiteSpace: 'nowrap',
                  border: '1px solid #00ffc3'
                }}
              >
                {entry.value}%
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface FlowNodePos extends TrackNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  origX: number;
  origY: number;
  radius: number;
}

function FlowChart({ nodes, links, animKey }: { nodes: TrackNode[]; links: TrackFlow[]; animKey: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<FlowNodePos[]>([]);
  const linksRef = useRef<TrackFlow[]>(links);
  const animRef = useRef<number>(0);
  const draggingRef = useRef<number | null>(null);
  const hoveredLinkRef = useRef<number | null>(null);
  const [dims, setDims] = useState({ w: 400, h: 300 });

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDims({ w: rect.width, h: rect.height });
    }
  }, [animKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dims.w === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const maxPlays = Math.max(...nodes.map(n => n.plays), 1);
    const cols = Math.ceil(Math.sqrt(nodes.length));
    const rows = Math.ceil(nodes.length / cols);

    nodesRef.current = nodes.map((n, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = ((col + 0.5) / cols) * dims.w;
      const y = ((row + 0.5) / rows) * dims.h;
      const radius = 12 + (n.plays / maxPlays) * 20;
      return { ...n, x, y, vx: 0, vy: 0, origX: x, origY: y, radius };
    });
    linksRef.current = links;

    let hoveredLink: number | null = null;

    function handleMouseMove(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      if (draggingRef.current !== null) {
        const node = nodesRef.current[draggingRef.current];
        if (node) {
          node.x = mx;
          node.y = my;
        }
        return;
      }

      hoveredLink = null;
      for (let i = 0; i < linksRef.current.length; i++) {
        const link = linksRef.current[i];
        const srcN = nodesRef.current.find(n => n.id === link.source);
        const tgtN = nodesRef.current.find(n => n.id === link.target);
        if (!srcN || !tgtN) continue;

        const dx = tgtN.x - srcN.x;
        const dy = tgtN.y - srcN.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len === 0) continue;
        const t = Math.max(0, Math.min(1, ((mx - srcN.x) * dx + (my - srcN.y) * dy) / (len * len)));
        const px = srcN.x + t * dx;
        const py = srcN.y + t * dy;
        const dist = Math.sqrt((mx - px) ** 2 + (my - py) ** 2);
        if (dist < 6) {
          hoveredLink = i;
          break;
        }
      }
      hoveredLinkRef.current = hoveredLink;

      for (let i = 0; i < nodesRef.current.length; i++) {
        const node = nodesRef.current[i];
        const dist = Math.sqrt((mx - node.x) ** 2 + (my - node.y) ** 2);
        if (dist < node.radius + 4) {
          canvas.style.cursor = 'grab';
          return;
        }
      }
      canvas.style.cursor = hoveredLink !== null ? 'pointer' : 'default';
    }

    function handleMouseDown(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      for (let i = 0; i < nodesRef.current.length; i++) {
        const node = nodesRef.current[i];
        const dist = Math.sqrt((mx - node.x) ** 2 + (my - node.y) ** 2);
        if (dist < node.radius + 4) {
          draggingRef.current = i;
          canvas.style.cursor = 'grabbing';
          break;
        }
      }
    }

    function handleMouseUp() {
      draggingRef.current = null;
      canvas.style.cursor = 'default';
    }

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);

    function lerpColor(pct: number): string {
      const r = Math.round(255 * (0.8 + pct * 0.2));
      const g = Math.round(165 * (1 - pct));
      const b = Math.round(0 * (1 - pct));
      return `rgb(${r},${g},${b})`;
    }

    function animate() {
      ctx.clearRect(0, 0, dims.w, dims.h);

      for (let i = 0; i < nodesRef.current.length; i++) {
        if (draggingRef.current === i) continue;
        const node = nodesRef.current[i];
        const k = 0.08;
        node.vx += (node.origX - node.x) * k;
        node.vy += (node.origY - node.y) * k;
        node.vx *= 0.85;
        node.vy *= 0.85;
        node.x += node.vx;
        node.y += node.vy;
      }

      const maxPct = Math.max(...linksRef.current.map(l => l.percentage), 0.01);

      linksRef.current.forEach((link, idx) => {
        const srcN = nodesRef.current.find(n => n.id === link.source);
        const tgtN = nodesRef.current.find(n => n.id === link.target);
        if (!srcN || !tgtN) return;

        const pct = link.percentage / maxPct;
        const lineWidth = 1 + pct * 5;
        const isHovered = hoveredLinkRef.current === idx;

        ctx.beginPath();
        ctx.moveTo(srcN.x, srcN.y);
        ctx.lineTo(tgtN.x, tgtN.y);
        ctx.strokeStyle = lerpColor(pct);
        ctx.lineWidth = isHovered ? lineWidth * 2 : lineWidth;
        ctx.globalAlpha = isHovered ? 1 : 0.6;
        ctx.stroke();
        ctx.globalAlpha = 1;

        if (isHovered) {
          const mx = (srcN.x + tgtN.x) / 2;
          const my = (srcN.y + tgtN.y) / 2;
          ctx.fillStyle = '#0f0f23';
          ctx.strokeStyle = '#00ffc3';
          ctx.lineWidth = 1;
          const label = `${link.percentage.toFixed(1)}%`;
          ctx.font = '12px sans-serif';
          const tw = ctx.measureText(label).width;
          ctx.beginPath();
          ctx.roundRect(mx - tw / 2 - 8, my - 26, tw + 16, 22, 6);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#00ffc3';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, mx, my - 15);
        }
      });

      nodesRef.current.forEach(node => {
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.radius);
        gradient.addColorStop(0, '#00ffc3');
        gradient.addColorStop(1, '#00d4ff');

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.shadowColor = '#00d4ff';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#fff';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const displayName = node.name.length > 8 ? node.name.slice(0, 7) + '…' : node.name;
        ctx.fillText(displayName, node.x, node.y + node.radius + 4);
      });

      animRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [dims, animKey, nodes, links]);

  return (
    <div
      ref={containerRef}
      key={animKey}
      style={{ width: '100%', height: '100%', position: 'relative', animation: 'fadeSlideUp 0.4s ease' }}
    >
      <canvas
        ref={canvasRef}
        width={dims.w}
        height={dims.h}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
}

function HeatmapChart({ cells, animKey }: { cells: HeatmapCell[]; animKey: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverCell, setHoverCell] = useState<HeatmapCell | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const GRID_COLS = 20;
  const GRID_ROWS = 15;
  const CANVAS_W = 400;
  const CANVAS_H = 300;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellW = CANVAS_W / GRID_COLS;
    const cellH = CANVAS_H / GRID_ROWS;

    const playsMap = new Map<string, HeatmapCell>();
    cells.forEach(c => playsMap.set(`${c.x},${c.y}`, c));
    const maxPlays = Math.max(...cells.map(c => c.plays), 1);

    function getHeatColor(ratio: number): string {
      if (ratio <= 0) return '#1a1a3e';
      const clamped = Math.min(ratio, 1);
      if (clamped < 0.5) {
        const t = clamped * 2;
        const r = Math.round(26 + t * (59 - 26));
        const g = Math.round(26 + t * (130 - 26));
        const b = Math.round(62 + t * (246 - 62));
        return `rgb(${r},${g},${b})`;
      } else {
        const t = (clamped - 0.5) * 2;
        const r = Math.round(59 + t * (255 - 59));
        const g = Math.round(130 + t * (165 - 130));
        const b = Math.round(246 - t * 246);
        return `rgb(${r},${g},${b})`;
      }
    }

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        const cell = playsMap.get(`${x},${y}`);
        const ratio = cell ? cell.plays / maxPlays : 0;

        ctx.fillStyle = getHeatColor(ratio);
        ctx.fillRect(x * cellW + 0.5, y * cellH + 0.5, cellW - 1, cellH - 1);

        ctx.strokeStyle = '#0f0f23';
        ctx.lineWidth = 1;
        ctx.strokeRect(x * cellW + 0.5, y * cellH + 0.5, cellW - 1, cellH - 1);
      }
    }

    if (hoverCell) {
      const hx = hoverCell.x * cellW;
      const hy = hoverCell.y * cellH;
      ctx.shadowColor = '#00ffc3';
      ctx.shadowBlur = 15;
      ctx.strokeStyle = '#00ffc3';
      ctx.lineWidth = 2;
      ctx.strokeRect(hx + 0.5, hy + 0.5, cellW - 1, cellH - 1);
      ctx.shadowBlur = 0;
    }
  }, [cells, animKey, hoverCell]);

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    const cellW = CANVAS_W / GRID_COLS;
    const cellH = CANVAS_H / GRID_ROWS;
    const gx = Math.floor(mx / cellW);
    const gy = Math.floor(my / cellH);

    const cell = cells.find(c => c.x === gx && c.y === gy);
    setHoverCell(cell || null);
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  function handleMouseLeave() {
    setHoverCell(null);
  }

  return (
    <div
      key={animKey}
      style={{ width: '100%', height: '100%', position: 'relative', animation: 'fadeSlideUp 0.4s ease' }}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{ width: '100%', height: '100%', display: 'block', borderRadius: 8 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      {hoverCell && (
        <div
          style={{
            position: 'absolute',
            left: mousePos.x + 12,
            top: mousePos.y - 10,
            background: '#0f0f23',
            border: '1px solid #00ffc3',
            borderRadius: 6,
            padding: '8px 12px',
            color: '#fff',
            fontSize: 12,
            pointerEvents: 'none',
            zIndex: 10,
            boxShadow: '0 0 15px rgba(0,255,195,0.3)',
            whiteSpace: 'nowrap'
          }}
        >
          <div style={{ color: '#00ffc3', fontWeight: 600, marginBottom: 2 }}>{hoverCell.region}</div>
          <div>播放量: <span style={{ color: '#00d4ff' }}>{hoverCell.plays.toLocaleString()}</span></div>
        </div>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: 8,
        background: 'linear-gradient(90deg, #2a2a4e 25%, #3a3a6e 50%, #2a2a4e 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeletonShimmer 1.5s ease-in-out infinite'
      }}
    />
  );
}

export function ChartRenderer(props: ChartRendererProps) {
  const { dailyPlays, audienceAge, heatmapCells, flowNodes, flowLinks, animationKey } = props;

  const chartsReady = dailyPlays.length > 0 && flowNodes.length > 0;

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes barRise {
          from { transform: scaleY(0); opacity: 0; }
          to { transform: scaleY(1); opacity: 1; }
        }
        @keyframes radarPulse {
          0%, 100% { box-shadow: 0 0 8px #00d4ff; }
          50% { box-shadow: 0 0 16px #00ffc3, 0 0 32px rgba(0,255,195,0.4); }
        }
        @keyframes skeletonShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .recharts-bar-rectangle {
          transition: transform 0.2s ease !important;
        }
        .recharts-bar-rectangle:hover {
          transform: scaleY(1.1) scaleX(1.05) !important;
          filter: brightness(1.2);
        }
      `}</style>

      <div style={{ display: 'contents' }}>
        {!chartsReady ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <DailyBarChart data={dailyPlays} animKey={animationKey} />
            <AudienceRadarChart data={audienceAge} animKey={animationKey} />
            <FlowChart nodes={flowNodes} links={flowLinks} animKey={animationKey} />
            <HeatmapChart cells={heatmapCells} animKey={animationKey} />
          </>
        )}
      </div>
    </>
  );
}
