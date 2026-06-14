import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Hammer, Wrench, Archive } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useGameStore } from '../stores/gameStore';
import { getRandomArtifactForSite } from '../data/artifacts';
import type { SiteType, Particle, FlareCell, FragmentData } from '../types';

const CELL_SIZE = 58;
const GAP = 3;

const SITE_COLORS: Record<SiteType, { bg: string; stop1: string; stop2: string; dust: string[]; cursor: string }> = {
  desert: {
    bg: 'linear-gradient(135deg,#2a1810 0%,#3d2415 50%,#5a3620 100%)',
    stop1: '#f4a460',
    stop2: '#cd853f',
    dust: ['#d4a574', '#e8c79a', '#c2956a', '#b8865b'],
    cursor: 'default',
  },
  jungle: {
    bg: 'linear-gradient(135deg,#0f1e10 0%,#1a3320 50%,#2d4a2e 100%)',
    stop1: '#556b2f',
    stop2: '#2f4f2f',
    dust: ['#6b8e4e', '#4a6741', '#5c7a52', '#7a9b68'],
    cursor: 'default',
  },
  ocean: {
    bg: 'linear-gradient(135deg,#0a1a2e 0%,#12294a 50%,#1e3a5f 100%)',
    stop1: '#4682b4',
    stop2: '#1e90ff',
    dust: ['#5fa8d3', '#87ceeb', '#4a90b8', '#6baed6'],
    cursor: 'default',
  },
};

const getCellColor = (row: number, col: number, site: SiteType): string => {
  const conf = SITE_COLORS[site];
  const seed = (row * 13 + col * 7) % 100;
  const opacity = 0.5 + (seed % 50) / 100;
  const a = parseInt(conf.stop1.slice(1), 16);
  const b = parseInt(conf.stop2.slice(1), 16);
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = a & 0xff;
  const br = (b >> 16) & 0xff;
  const bg = (b >> 8) & 0xff;
  const bb = b & 0xff;
  const r = Math.round(ar * (1 - opacity) + br * opacity);
  const g = Math.round(ag * (1 - opacity) + bg * opacity);
  const bl = Math.round(ab * (1 - opacity) + bb * opacity);
  return `rgb(${r},${g},${bl})`;
};

export default function DigSite() {
  const { site } = useParams<{ site: string }>();
  const navigate = useNavigate();
  const grid = useGameStore((s) => s.grid);
  const gridSize = useGameStore((s) => s.gridSize);
  const particles = useGameStore((s) => s.particles);
  const setParticles = useGameStore((s) => s.setParticles);
  const flareCells = useGameStore((s) => s.flareCells);
  const addFlareCell = useGameStore((s) => s.addFlareCell);
  const clearFlareCell = useGameStore((s) => s.clearFlareCell);
  const excavatedFragments = useGameStore((s) => s.excavatedFragments);
  const addFragment = useGameStore((s) => s.addFragment);
  const initGrid = useGameStore((s) => s.initGrid);
  const currentArtifactId = useGameStore((s) => s.currentArtifactId);
  const setCurrentArtifactId = useGameStore((s) => s.setCurrentArtifactId);
  const startDigTimer = useGameStore((s) => s.startDigTimer);
  const digStartTime = useGameStore((s) => s.digStartTime);
  const [elapsed, setElapsed] = useState(0);
  const [initialized, setInitialized] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);

  const siteType = (site as SiteType) ?? 'desert';
  const conf = SITE_COLORS[siteType];

  const [floatingFragments, setFloatingFragments] = useState<
    { id: string; cellRow: number; cellCol: number; phase: number; fragment: FragmentData }[]
  >([]);

  useEffect(() => {
    if (initialized) return;
    if (!site) return;
    const artifact = getRandomArtifactForSite(site as SiteType);
    setCurrentArtifactId(artifact.id);
    initGrid(artifact.fragments);
    startDigTimer();
    setInitialized(true);
    void currentArtifactId;
  }, [site, initialized, initGrid, setCurrentArtifactId, startDigTimer, currentArtifactId]);

  useEffect(() => {
    const t = setInterval(() => {
      if (digStartTime) setElapsed(Math.floor((Date.now() - digStartTime) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [digStartTime]);

  useEffect(() => {
    let running = true;
    const step = () => {
      if (!running) return;
      setParticles(
        particles
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.15,
            life: p.life - 1,
          }))
          .filter((p) => p.life > 0)
      );
      animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
    };
  }, [particles, setParticles]);

  useEffect(() => {
    const iv = setInterval(() => {
      const now = Date.now();
      flareCells.forEach((c) => {
        if (now - c.time > 500) clearFlareCell(c.row, c.col);
      });
    }, 100);
    return () => clearInterval(iv);
  }, [flareCells, clearFlareCell]);

  const emitParticles = (cx: number, cy: number) => {
    const n = 10 + Math.floor(Math.random() * 6);
    const newPs: Particle[] = [];
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i) / n + Math.random() * 0.4;
      const spd = 2 + Math.random() * 3;
      newPs.push({
        id: uuidv4(),
        x: cx,
        y: cy,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 1.5,
        life: 35 + Math.floor(Math.random() * 15),
        maxLife: 50,
        color: conf.dust[i % conf.dust.length],
        size: 4 + Math.random() * 4,
      });
    }
    setParticles([...particles, ...newPs]);
  };

  const spawnFlare = (row: number, col: number) => {
    addFlareCell({ row, col, time: Date.now() });
  };

  const handleCellClick = (row: number, col: number, ev: React.MouseEvent) => {
    const cell = grid[row]?.[col];
    if (!cell || cell.excavated) return;
    const rect = containerRef.current?.getBoundingClientRect();
    const cx = rect ? ev.clientX - rect.left : 0;
    const cy = rect ? ev.clientY - rect.top : 0;
    emitParticles(cx, cy);
    const gridCopy = grid.map((r) => r.map((c) => ({ ...c })));
    gridCopy[row][col].excavated = true;
    useGameStore.setState({ grid: gridCopy });
    if (cell.hasFragment && cell.fragmentId) {
      spawnFlare(row, col);
      const artId = currentArtifactId;
      if (artId) {
        const { getArtifactById } = require('../data/artifacts');
        const art = getArtifactById(artId);
        const frag = art?.fragments.find((f: FragmentData) => f.id === cell.fragmentId);
        if (frag && !excavatedFragments.find((f) => f.id === frag.id)) {
          addFragment(frag);
          setFloatingFragments((prev) => [
            ...prev,
            { id: frag.id, cellRow: row, cellCol: col, phase: Math.random() * Math.PI * 2, fragment: frag },
          ]);
        }
      }
    }
  };

  const gridWidth = gridSize.cols * (CELL_SIZE + GAP) + GAP;
  const gridHeight = gridSize.rows * (CELL_SIZE + GAP) + GAP;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${m.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
  };

  const digProgress = useMemo(() => {
    const total = gridSize.rows * gridSize.cols;
    let done = 0;
    for (const r of grid) for (const c of r) if (c.excavated) done++;
    return Math.round((done / total) * 100);
  }, [grid, gridSize]);

  return (
    <div className="min-h-screen w-full relative overflow-hidden" style={{ background: conf.bg }}>
      <div className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.08), transparent 60%)',
        }}
      />

      <header className="relative z-20 max-w-7xl mx-auto px-5 py-5 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 h-10 rounded-xl bg-black/30 backdrop-blur hover:bg-black/50 text-amber-100 transition-all duration-200 hover:scale-105"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-[Lora] text-sm">返回</span>
        </button>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/30 backdrop-blur">
            <Hammer className="w-4 h-4 text-amber-300" />
            <span className="font-[Cinzel] text-sm text-amber-100">
              {siteType === 'desert' ? '金沙大漠' : siteType === 'jungle' ? '密境丛林' : '深蓝秘境'}
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/30 backdrop-blur">
            <Wrench className="w-4 h-4 text-amber-300" />
            <span className="font-[Cinzel] text-sm text-amber-100">挖掘进度 {digProgress}%</span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-black/30 backdrop-blur font-[Cinzel] text-amber-100 tracking-wider text-lg">
            ⏱ {formatTime(elapsed)}
          </div>
        </div>

        <button
          onClick={() => navigate('/workbench')}
          disabled={excavatedFragments.length === 0}
          className="group flex items-center gap-2 px-5 h-11 rounded-xl text-white transition-all duration-200 hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg,#b45309,#d97706)',
            boxShadow: excavatedFragments.length > 0 ? '0 10px 30px -8px rgba(217,119,6,0.5)' : 'none',
          }}
        >
          <Archive className="w-5 h-5" />
          <span className="font-[Cinzel] font-semibold">修复工作台 ({excavatedFragments.length})</span>
        </button>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-5 pt-4 pb-10 flex flex-col items-center">
        <div
          ref={containerRef}
          className="relative rounded-2xl p-2 mt-4"
          style={{
            background: 'linear-gradient(180deg,rgba(0,0,0,0.4),rgba(0,0,0,0.2))',
            boxShadow: '0 25px 60px -20px rgba(0,0,0,0.7),inset 0 0 0 1px rgba(255,255,255,0.05)',
            width: gridWidth + 16,
          }}
        >
          <div
            className="relative grid"
            style={{
              gridTemplateColumns: `repeat(${gridSize.cols}, ${CELL_SIZE}px)`,
              gridTemplateRows: `repeat(${gridSize.rows}, ${CELL_SIZE}px)`,
              gap: `${GAP}px`,
              padding: GAP,
              width: gridWidth,
              height: gridHeight,
              cursor: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><path d='M4 28 L12 20 L10 18 L2 26 Z M14 18 L24 8 L28 12 L18 22 Z' fill='%23b45309' stroke='%23fcd34d' stroke-width='1'/></svg>") 4 28, pointer`,
            }}
          >
            {grid.map((rowArr, ri) =>
              rowArr.map((cell, ci) => {
                const color = getCellColor(ri, ci, siteType);
                const flare = flareCells.find((f) => f.row === ri && f.col === ci);
                const float = floatingFragments.find((f) => f.cellRow === ri && f.cellCol === ci);
                return (
                  <div
                    key={`${ri}-${ci}`}
                    onClick={(e) => handleCellClick(ri, ci, e)}
                    className="relative rounded-md overflow-hidden transition-all duration-150"
                    style={{
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      background: cell.excavated
                        ? 'rgba(0,0,0,0.55)'
                        : color,
                      boxShadow: cell.excavated
                        ? 'inset 0 2px 6px rgba(0,0,0,0.6)'
                        : 'inset 0 1px 0 rgba(255,255,255,0.15),inset 0 -2px 0 rgba(0,0,0,0.2)',
                      cursor: cell.excavated ? 'default' : 'pointer',
                    }}
                  >
                    {!cell.excavated && (
                      <div
                        className="absolute inset-0 opacity-30 hover:opacity-60 transition-opacity"
                        style={{
                          background:
                            'linear-gradient(135deg,rgba(255,255,255,0.25),transparent 60%)',
                        }}
                      />
                    )}
                    {flare && (
                      <div
                        className="absolute inset-0 rounded-md pointer-events-none animate-flare"
                        style={{
                          background:
                            'radial-gradient(circle at center, rgba(255,255,255,0.95) 0%,rgba(255,255,230,0.6) 35%,rgba(255,255,180,0) 70%)',
                        }}
                      />
                    )}
                    {float && (
                      <FragmentFloat fragment={float.fragment} phase={float.phase} />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full pointer-events-none"
              style={{
                left: p.x,
                top: p.y,
                width: p.size,
                height: p.size,
                background: p.color,
                opacity: Math.max(0, p.life / p.maxLife),
                boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
              }}
            />
          ))}
        </div>

        <div className="mt-8 text-center max-w-xl">
          <p className="font-[Lora] text-amber-100/70 text-base leading-relaxed">
            点击土层进行挖掘 · 发现文物碎片后将飘浮出现 · 进入修复工作台开始拼图
          </p>
        </div>
      </main>

      <style>{`
        @keyframes flare-anim {
          0% { opacity: 0; transform: scale(0.3); }
          30% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.6); }
        }
        .animate-flare { animation: flare-anim 0.5s ease-out forwards; }
        @keyframes float-frag {
          0%,100% { transform: translate(-50%,-130%) rotate(-3deg); }
          50% { transform: translate(-50%,-150%) rotate(3deg); }
        }
      `}</style>
    </div>
  );
}

function FragmentFloat({ fragment, phase }: { fragment: FragmentData; phase: number }) {
  const [yOff, setYOff] = useState(0);
  useEffect(() => {
    let raf = 0;
    let t = phase;
    const tick = () => {
      t += 0.04;
      setYOff(Math.sin(t) * 6);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);
  const pathD =
    'M ' +
    fragment.shape
      .map((p, i) => {
        const sx = (p[0] / 160) * 42;
        const sy = (p[1] / 160) * 42;
        return `${i === 0 ? '' : 'L '}${sx.toFixed(1)} ${sy.toFixed(1)}`;
      })
      .join(' ') +
    ' Z';
  return (
    <div
      className="absolute left-1/2"
      style={{
        top: '50%',
        transform: `translate(-50%,calc(-140% + ${yOff}px))`,
        transition: 'none',
        filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.7))',
      }}
    >
      <svg width="50" height="50" viewBox="0 0 50 50">
        <path d={pathD} fill={fragment.color} stroke="#ffffff88" strokeWidth="0.8" />
      </svg>
      <div
        className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-yellow-300"
        style={{ boxShadow: '0 0 12px 4px rgba(253,224,71,0.7)' }}
      />
    </div>
  );
}
