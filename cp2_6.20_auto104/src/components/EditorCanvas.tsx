import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useEditorStore } from '@store/editorStore';
import { monsters as monsterTemplates, MonsterTemplate } from '@core/monsterData';

const themeColors: Record<string, { floor: string; wall: string; corridor: string }> = {
  catacomb: { floor: '#2a2a3e', wall: '#4a4a6a', corridor: '#32324a' },
  ice_cave: { floor: '#1a2a3e', wall: '#4a6a8a', corridor: '#2a3a5a' },
  lava_cave: { floor: '#2a1a1a', wall: '#6a3a2a', corridor: '#3a2a1a' },
};

const decorationIcons: Record<string, string> = {
  bones: '💀',
  crystal: '💎',
  lava_pool: '🔥',
};

function playClickSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    osc.type = 'sine';
    gain.gain.value = 0.1;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.stop(ctx.currentTime + 0.05);
  } catch {}
}

export const EditorCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);

  const grid = useEditorStore((s) => s.grid);
  const rooms = useEditorStore((s) => s.rooms);
  const theme = useEditorStore((s) => s.theme);
  const cellSize = useEditorStore((s) => s.cellSize);
  const monsters = useEditorStore((s) => s.monsters);
  const toolMode = useEditorStore((s) => s.toolMode);
  const selectedMonsterId = useEditorStore((s) => s.selectedMonsterId);
  const patrolPath = useEditorStore((s) => s.patrolPath);
  const animationSpeed = useEditorStore((s) => s.animationSpeed);
  const canvasOffset = useEditorStore((s) => s.canvasOffset);
  const canvasZoom = useEditorStore((s) => s.canvasZoom);
  const fadeAnimation = useEditorStore((s) => s.fadeAnimation);

  const addMonsterToGrid = useEditorStore((s) => s.addMonsterToGrid);
  const setCellValue = useEditorStore((s) => s.setCellValue);
  const addPatrolPoint = useEditorStore((s) => s.addPatrolPoint);
  const completePatrolPath = useEditorStore((s) => s.completePatrolPath);
  const setCanvasOffset = useEditorStore((s) => s.setCanvasOffset);
  const setCanvasZoom = useEditorStore((s) => s.setCanvasZoom);
  const setSelectedMonsterId = useEditorStore((s) => s.setSelectedMonsterId);

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [animTime, setAnimTime] = useState(0);

  const isDraggingMonster = useRef(false);
  const dragMonsterTemplate = useRef<MonsterTemplate | null>(null);

  const screenToGrid = useCallback(
    (sx: number, sy: number) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return { gx: -1, gy: -1 };
      const x = (sx - rect.left - canvasOffset.x) / canvasZoom;
      const y = (sy - rect.top - canvasOffset.y) / canvasZoom;
      return {
        gx: Math.floor(x / cellSize),
        gy: Math.floor(y / cellSize),
      };
    },
    [canvasOffset, canvasZoom, cellSize]
  );

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.dataTransfer!.dropEffect = 'copy';
    };
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      const data = e.dataTransfer!.getData('monster-type');
      const template = monsterTemplates.find((m) => m.type === data);
      if (!template) return;
      const { gx, gy } = screenToGrid(e.clientX, e.clientY);
      if (gx >= 0 && gy >= 0) {
        addMonsterToGrid(template, gx, gy);
        playClickSound();
      }
    };
    const el = canvasRef.current;
    if (el) {
      el.addEventListener('dragover', handleDragOver);
      el.addEventListener('drop', handleDrop);
    }
    return () => {
      if (el) {
        el.removeEventListener('dragover', handleDragOver);
        el.removeEventListener('drop', handleDrop);
      }
    };
  }, [screenToGrid, addMonsterToGrid]);

  useEffect(() => {
    let lastTime = 0;
    const loop = (time: number) => {
      if (lastTime) {
        const delta = (time - lastTime) / 1000;
        setAnimTime((prev) => prev + delta * animationSpeed);
      }
      lastTime = time;
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [animationSpeed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const w = container.clientWidth;
    const h = container.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    if (grid.length === 0) {
      ctx.fillStyle = '#16213e';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#3a3a5c';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('点击"生成地图"开始编辑', w / 2, h / 2);
      return;
    }

    ctx.save();
    ctx.translate(canvasOffset.x, canvasOffset.y);
    ctx.scale(canvasZoom, canvasZoom);

    const colors = themeColors[theme] || themeColors.catacomb;

    if (fadeAnimation) {
      ctx.globalAlpha = 0;
    }

    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const px = x * cellSize;
        const py = y * cellSize;
        const cell = grid[y][x];

        if (cell === 0) {
          const inRoom = rooms.some(
            (r) => x >= r.x && x < r.x + r.width && y >= r.y && y < r.y + r.height
          );
          ctx.fillStyle = inRoom ? colors.floor : colors.corridor;
        } else if (cell === 1) {
          ctx.fillStyle = colors.wall;
        } else if (cell === 2) {
          ctx.fillStyle = colors.floor;
        } else if (cell === 3) {
          ctx.fillStyle = colors.floor;
        }
        ctx.fillRect(px, py, cellSize, cellSize);
      }
    }

    for (let y = 0; y <= grid.length; y++) {
      ctx.strokeStyle = '#3a3a5c';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y * cellSize);
      ctx.lineTo(grid[0].length * cellSize, y * cellSize);
      ctx.stroke();
    }
    for (let x = 0; x <= grid[0].length; x++) {
      ctx.strokeStyle = '#3a3a5c';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(x * cellSize, 0);
      ctx.lineTo(x * cellSize, grid.length * cellSize);
      ctx.stroke();
    }

    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        if (grid[y][x] === 3) {
          const px = x * cellSize + cellSize / 2;
          const py = y * cellSize + cellSize / 2;
          const deco = theme === 'catacomb' ? 'bones' : theme === 'ice_cave' ? 'crystal' : 'lava_pool';
          ctx.font = `${cellSize * 0.7}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#fff';
          ctx.fillText(decorationIcons[deco], px, py);
        }
      }
    }

    for (const monster of monsters) {
      const px = monster.gridX * cellSize;
      const py = monster.gridY * cellSize;

      if (monster.patrolPath.length >= 3) {
        const pathPts = monster.patrolPath;
        ctx.strokeStyle = monster.color;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(pathPts[0].x * cellSize + cellSize / 2, pathPts[0].y * cellSize + cellSize / 2);
        for (let i = 1; i < pathPts.length; i++) {
          ctx.lineTo(pathPts[i].x * cellSize + cellSize / 2, pathPts[i].y * cellSize + cellSize / 2);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);

        for (const pt of pathPts) {
          ctx.fillStyle = monster.color;
          ctx.beginPath();
          ctx.arc(pt.x * cellSize + cellSize / 2, pt.y * cellSize + cellSize / 2, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        const totalLen = pathPts.length;
        const t = (animTime % totalLen);
        const seg = Math.floor(t);
        const frac = t - seg;
        const p1 = pathPts[seg % totalLen];
        const p2 = pathPts[(seg + 1) % totalLen];
        const animX = (p1.x + (p2.x - p1.x) * frac) * cellSize + cellSize / 2;
        const animY = (p1.y + (p2.y - p1.y) * frac) * cellSize + cellSize / 2;

        ctx.globalAlpha = 0.4;
        ctx.fillStyle = monster.color;
        ctx.beginPath();
        ctx.arc(animX, animY, cellSize * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      const img = new Image();
      const svgBlob = new Blob([monster.svgAvatar], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      img.src = url;

      try {
        const svgDoc = new DOMParser().parseFromString(monster.svgAvatar, 'image/svg+xml');
        const svgEl = svgDoc.documentElement;
        const encoder = new XMLSerializer();
        const svgStr = encoder.serializeToString(svgEl);
        const img2 = new Image();
        const blob2 = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
        const url2 = URL.createObjectURL(blob2);
        img2.src = url2;
        ctx.drawImage(img2, px + 2, py + 2, cellSize - 4, cellSize - 4);
        URL.revokeObjectURL(url2);
      } catch {
        ctx.fillStyle = monster.color;
        ctx.fillRect(px + 4, py + 4, cellSize - 8, cellSize - 8);
        ctx.fillStyle = '#fff';
        ctx.font = `${cellSize * 0.4}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(monster.name[0], px + cellSize / 2, py + cellSize / 2);
      }

      URL.revokeObjectURL(url);

      if (monster.id === selectedMonsterId) {
        ctx.strokeStyle = '#e94560';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
      }
    }

    if (patrolPath.isDrawing && patrolPath.points.length > 0) {
      const pts = patrolPath.points;
      ctx.strokeStyle = '#e94560';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pts[0].x * cellSize + cellSize / 2, pts[0].y * cellSize + cellSize / 2);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x * cellSize + cellSize / 2, pts[i].y * cellSize + cellSize / 2);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      for (const pt of pts) {
        ctx.fillStyle = '#e94560';
        ctx.beginPath();
        ctx.arc(pt.x * cellSize + cellSize / 2, pt.y * cellSize + cellSize / 2, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();

    if (fadeAnimation) {
      let alpha = 0;
      const fadeIn = () => {
        alpha += 0.05;
        if (alpha >= 1) return;
        const ctx2 = canvas.getContext('2d')!;
        ctx2.globalAlpha = alpha;
        ctx2.clearRect(0, 0, w, h);
        requestAnimationFrame(fadeIn);
      };
      fadeIn();
    }
  }, [grid, rooms, theme, cellSize, monsters, selectedMonsterId, patrolPath, canvasOffset, canvasZoom, fadeAnimation, animTime]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - canvasOffset.x, y: e.clientY - canvasOffset.y });
        return;
      }

      const { gx, gy } = screenToGrid(e.clientX, e.clientY);
      if (gx < 0 || gy < 0 || gy >= grid.length || gx >= grid[0]?.length) return;

      if (toolMode === 'patrol' && patrolPath.isDrawing) {
        addPatrolPoint({ x: gx, y: gy });
        return;
      }

      if (toolMode === 'select') {
        const clickedMonster = monsters.find((m) => m.gridX === gx && m.gridY === gy);
        setSelectedMonsterId(clickedMonster ? clickedMonster.id : null);
      } else if (toolMode === 'wall') {
        setCellValue(gx, gy, 1);
      } else if (toolMode === 'door') {
        setCellValue(gx, gy, 0);
      } else if (toolMode === 'decoration') {
        setCellValue(gx, gy, 3);
      }
    },
    [toolMode, patrolPath, grid, monsters, canvasOffset, screenToGrid, addPatrolPoint, setSelectedMonsterId, setCellValue]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setCanvasOffset({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
      }
    },
    [isPanning, panStart, setCanvasOffset]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setCanvasZoom(canvasZoom + delta);
    },
    [canvasZoom, setCanvasZoom]
  );

  const handleDoubleClick = useCallback(() => {
    if (patrolPath.isDrawing) {
      completePatrolPath();
    }
  }, [patrolPath, completePatrolPath]);

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        background: '#16213e',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          cursor: isPanning ? 'grabbing' : toolMode === 'patrol' ? 'crosshair' : 'default',
          opacity: fadeAnimation ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        onContextMenu={(e) => e.preventDefault()}
      />
      {patrolPath.isDrawing && (
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(233,69,96,0.9)',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: 6,
            fontSize: 13,
            pointerEvents: 'none',
          }}
        >
          点击地图添加巡逻路径点，双击完成闭合路径
        </div>
      )}
    </div>
  );
};
