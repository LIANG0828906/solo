import { useEffect, useMemo, useRef, useState } from 'react';
import {
  generateMaze,
  solveMaze,
  toggleWall,
  findWallAtPosition,
  type MazeState,
  type SolveResult,
  type WallSide
} from './mazeGenerator';
import {
  render,
  computeLayout,
  wallKey,
  WALL_ANIM_DURATION,
  RIPPLE_DURATION,
  type Ripple,
  type WallAnimState,
  type RenderContext
} from './mazeRenderer';

const MIN_SIZE = 5;
const MAX_SIZE = 20;
const DEFAULT_SIZE = 12;

export default function App() {
  const [size, setSize] = useState<number>(DEFAULT_SIZE);
  const [maze, setMaze] = useState<MazeState>(() => generateMaze(DEFAULT_SIZE, DEFAULT_SIZE));
  const [solveResult, setSolveResult] = useState<SolveResult>(() => {
    const initial = generateMaze(DEFAULT_SIZE, DEFAULT_SIZE);
    return solveMaze(initial);
  });
  const [lastSolveMs, setLastSolveMs] = useState<number>(0);
  const [lastEditMs, setLastEditMs] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const ripplesRef = useRef<Ripple[]>([]);
  const wallAnimsRef = useRef<Map<string, WallAnimState>>(new Map());
  const hoveredWallRef = useRef<{ cellX: number; cellY: number; side: WallSide } | null>(null);
  const rafRef = useRef<number | null>(null);
  const mazeRef = useRef(maze);
  const solveRef = useRef(solveResult);
  const prevSizeRef = useRef(size);

  useEffect(() => {
    mazeRef.current = maze;
  }, [maze]);

  useEffect(() => {
    solveRef.current = solveResult;
  }, [solveResult]);

  useEffect(() => {
    if (prevSizeRef.current !== size) {
      prevSizeRef.current = size;
      generateNew(size);
    }
  }, [size]);

  const sizeOptions = useMemo(() => {
    const arr: number[] = [];
    for (let s = MIN_SIZE; s <= MAX_SIZE; s++) arr.push(s);
    return arr;
  }, []);

  const generateNew = (newSize: number = size) => {
    const t0 = performance.now();
    const m = generateMaze(newSize, newSize);
    const res = solveMaze(m);
    setMaze(m);
    setSolveResult(res);
    setLastSolveMs(res.elapsedMs);
    setLastEditMs(performance.now() - t0);
    wallAnimsRef.current.clear();
    ripplesRef.current = [];
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = wrap.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    window.addEventListener('resize', resize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = (now: number) => {
      const rect = canvas.getBoundingClientRect();
      const cw = rect.width;
      const ch = rect.height;
      const currentMaze = mazeRef.current;
      const { cellSize, offsetX, offsetY } = computeLayout(cw, ch, currentMaze);

      const activeAnims = new Map<string, WallAnimState>();
      wallAnimsRef.current.forEach((anim, k) => {
        if (now - anim.startTime < anim.duration + 50) {
          activeAnims.set(k, anim);
        }
      });
      wallAnimsRef.current = activeAnims;

      const rc: RenderContext = {
        canvasWidth: cw,
        canvasHeight: ch,
        cellSize,
        offsetX,
        offsetY,
        maze: currentMaze,
        path: solveRef.current.path,
        explored: solveRef.current.explored,
        ripples: ripplesRef.current,
        wallAnims: activeAnims,
        hoveredWall: hoveredWallRef.current
      };

      ripplesRef.current = render(ctx, rc, now);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const spawnRipple = (x: number, y: number, color: string) => {
    ripplesRef.current.push({
      x,
      y,
      startTime: performance.now(),
      duration: RIPPLE_DURATION,
      maxRadius: 60,
      color
    });
  };

  const triggerWallAnim = (
    cellX: number,
    cellY: number,
    side: WallSide,
    addWall: boolean
  ) => {
    const k = wallKey(cellX, cellY, side);
    const now = performance.now();
    wallAnimsRef.current.set(k, {
      key: k,
      startTime: now,
      duration: WALL_ANIM_DURATION,
      fromOpacity: addWall ? 0 : 1,
      toOpacity: addWall ? 1 : 0,
      fromScale: addWall ? 0 : 1,
      toScale: addWall ? 1 : 0
    });

    const opposites: Record<WallSide, WallSide> = {
      top: 'bottom', right: 'left', bottom: 'top', left: 'right'
    };
    const deltas: Record<WallSide, { dx: number; dy: number }> = {
      top: { dx: 0, dy: -1 }, right: { dx: 1, dy: 0 },
      bottom: { dx: 0, dy: 1 }, left: { dx: -1, dy: 0 }
    };
    const d = deltas[side];
    const nx = cellX + d.dx;
    const ny = cellY + d.dy;
    const cur = mazeRef.current;
    if (nx >= 0 && nx < cur.width && ny >= 0 && ny < cur.height) {
      const k2 = wallKey(nx, ny, opposites[side]);
      wallAnimsRef.current.set(k2, {
        key: k2,
        startTime: now,
        duration: WALL_ANIM_DURATION,
        fromOpacity: addWall ? 0 : 1,
        toOpacity: addWall ? 1 : 0,
        fromScale: addWall ? 0 : 1,
        toScale: addWall ? 1 : 0
      });
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const currentMaze = mazeRef.current;
    const { cellSize, offsetX, offsetY } = computeLayout(rect.width, rect.height, currentMaze);

    if (e.button === 2) e.preventDefault();

    const hit = findWallAtPosition(currentMaze, x, y, cellSize, offsetX, offsetY);
    if (!hit) {
      spawnRipple(x, y, 'rgba(140, 160, 220, 0.6)');
      return;
    }

    const isLeft = e.button === 0;
    const isRight = e.button === 2;
    if (!isLeft && !isRight) return;

    const addWall = isLeft;
    const cell = currentMaze.grid[hit.cellY]?.[hit.cellX];
    if (!cell) return;
    if (cell.walls[hit.side] === addWall) {
      spawnRipple(x, y, addWall ? 'rgba(255, 120, 120, 0.55)' : 'rgba(180, 190, 220, 0.55)');
      return;
    }

    triggerWallAnim(hit.cellX, hit.cellY, hit.side, addWall);
    spawnRipple(x, y, addWall ? 'rgba(255, 200, 80, 0.85)' : 'rgba(120, 200, 255, 0.85)');

    const t0 = performance.now();
    const newMaze = toggleWall(currentMaze, hit.cellX, hit.cellY, hit.side, addWall);
    const previousPath = solveRef.current.path;
    const newResult = solveMaze(newMaze, previousPath);
    const elapsed = performance.now() - t0;

    setMaze(newMaze);
    setSolveResult(newResult);
    setLastSolveMs(newResult.elapsedMs);
    setLastEditMs(elapsed);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const currentMaze = mazeRef.current;
    const { cellSize, offsetX, offsetY } = computeLayout(rect.width, rect.height, currentMaze);
    hoveredWallRef.current = findWallAtPosition(currentMaze, x, y, cellSize, offsetX, offsetY);
  };

  const handleCanvasMouseLeave = () => {
    hoveredWallRef.current = null;
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const pathLen = solveResult.path.length;
  const found = solveResult.found;

  return (
    <div className="app">
      <header className="toolbar">
        <div className="brand">
          <div className="brand-logo" aria-hidden="true" />
          <span className="brand-title">PixelMaze</span>
        </div>

        <div className="toolbar-group">
          <label className="toolbar-label" htmlFor="size-select">迷宫尺寸</label>
          <select
            id="size-select"
            className="size-select"
            value={size}
            onChange={(e) => setSize(parseInt(e.target.value, 10))}
          >
            {sizeOptions.map((s) => (
              <option key={s} value={s}>{s} × {s}</option>
            ))}
          </select>
        </div>

        <button className="generate-btn" onClick={() => generateNew()}>
          生成新迷宫
        </button>

        <div className="stats">
          <div className="stat-item">
            <span className="stat-label">路径长度</span>
            <span className="stat-value path">{found ? pathLen : '—'}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">求解耗时</span>
            <span className="stat-value time">{lastSolveMs.toFixed(2)} ms</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">编辑+重绘</span>
            <span className="stat-value">{lastEditMs.toFixed(2)} ms</span>
          </div>
        </div>
      </header>

      <div
        className="canvas-wrap"
        ref={wrapRef}
        onContextMenu={handleContextMenu}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={handleCanvasMouseLeave}
        />

        <div className="help-hint">
          <span><span className="hint-key">左键</span> 添加墙壁</span>
          <span><span className="hint-key">右键</span> 删除墙壁</span>
          <span>路径自动求解</span>
        </div>
      </div>
    </div>
  );
}
