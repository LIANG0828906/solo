import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { useEditorStore } from '@store/editorStore';
import { monsters as monsterTemplates, MonsterTemplate } from '@core/monsterData';

const themeColors: Record<string, { floor: string; wall: string; corridor: string }> = {
  catacomb: { floor: '#2a2a3e', wall: '#4a4a6a', corridor: '#32324a' },
  ice_cave: { floor: '#1a2a3e', wall: '#4a6a8a', corridor: '#2a3a5a' },
  lava_cave: { floor: '#2a1a1a', wall: '#6a3a2a', corridor: '#3a2a1a' },
};

const decorationEmojis: Record<string, string> = {
  catacomb: '💀',
  ice_cave: '💎',
  lava_cave: '🔥',
};

function playClickSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
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

function createDragImage(svgString: string): HTMLDivElement {
  const div = document.createElement('div');
  div.style.width = '48px';
  div.style.height = '48px';
  div.style.position = 'absolute';
  div.style.top = '-9999px';
  div.style.pointerEvents = 'none';
  div.innerHTML = svgString;
  const svg = div.querySelector('svg');
  if (svg) {
    svg.setAttribute('width', '48');
    svg.setAttribute('height', '48');
  }
  document.body.appendChild(div);
  return div;
}

export const EditorCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoScrollTimer = useRef<number | null>(null);
  const animFrameRef = useRef<number>(0);
  const renderDataRef = useRef<{ images: Map<string, { img: HTMLImageElement; loaded: boolean; url: string }> }>({
    images: new Map(),
  });

  const grid = useEditorStore((s) => s.grid);
  const rooms = useEditorStore((s) => s.rooms);
  const theme = useEditorStore((s) => s.theme);
  const rows = useEditorStore((s) => s.rows);
  const cols = useEditorStore((s) => s.cols);
  const cellSize = useEditorStore((s) => s.cellSize);
  const monsters = useEditorStore((s) => s.monsters);
  const toolMode = useEditorStore((s) => s.toolMode);
  const selectedMonsterId = useEditorStore((s) => s.selectedMonsterId);
  const patrolPath = useEditorStore((s) => s.patrolPath);
  const previewAnim = useEditorStore((s) => s.previewAnim);
  const animationSpeed = useEditorStore((s) => s.animationSpeed);
  const canvasOffset = useEditorStore((s) => s.canvasOffset);
  const canvasZoom = useEditorStore((s) => s.canvasZoom);
  const fadeAnimation = useEditorStore((s) => s.fadeAnimation);

  const addMonsterToGrid = useEditorStore((s) => s.addMonsterToGrid);
  const setCellValue = useEditorStore((s) => s.setCellValue);
  const addPatrolPoint = useEditorStore((s) => s.addPatrolPoint);
  const completePatrolPath = useEditorStore((s) => s.completePatrolPath);
  const cancelPatrolPath = useEditorStore((s) => s.cancelPatrolPath);
  const setCanvasOffset = useEditorStore((s) => s.setCanvasOffset);
  const setCanvasZoom = useEditorStore((s) => s.setCanvasZoom);
  const setSelectedMonsterId = useEditorStore((s) => s.setSelectedMonsterId);

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [animTime, setAnimTime] = useState(0);
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingMonster, setIsDraggingMonster] = useState(false);
  const [placeFlashCell, setPlaceFlashCell] = useState<{ x: number; y: number; time: number } | null>(null);
  const [fadeStartTime, setFadeStartTime] = useState(0);
  const [fadeTick, setFadeTick] = useState(0);

  const colors = useMemo(() => themeColors[theme] || themeColors.catacomb, [theme]);

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

  // Animation loop
  useEffect(() => {
    let lastTime = performance.now();
    const loop = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;
      if (previewAnim.isPlaying) {
        setAnimTime((prev) => prev + delta * animationSpeed);
      }
      // Drive room fade-in animation
      if (fadeAnimation) {
        setFadeTick((t) => t + delta);
      }
      // Drive place flash
      if (placeFlashCell) {
        const elapsed = (time - placeFlashCell.time) / 1000;
        if (elapsed >= 0.2) {
          setPlaceFlashCell(null);
        }
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [animationSpeed, previewAnim.isPlaying, fadeAnimation, placeFlashCell]);

  // Reset fade tick when fade animation starts
  useEffect(() => {
    if (fadeAnimation) {
      setFadeTick(0);
    }
  }, [fadeAnimation]);

  // Reset anim time when preview starts with new monster
  useEffect(() => {
    if (previewAnim.isPlaying) {
      setAnimTime(0);
    }
  }, [previewAnim.monsterId]);

  // Preload monster SVG images
  useEffect(() => {
    for (const m of monsters) {
      if (!renderDataRef.current.images.has(m.id)) {
        try {
          const img = new Image();
          const svgStr = m.svgAvatar;
          const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          img.src = url;
          let loaded = false;
          img.onload = () => {
            loaded = true;
          };
          renderDataRef.current.images.set(m.id, { img, loaded: false, url });
          Object.defineProperty(renderDataRef.current.images.get(m.id)!, 'loaded', {
            get() { return loaded; },
          });
        } catch {}
      }
    }
    const existingIds = new Set(monsters.map((m) => m.id));
    for (const id of Array.from(renderDataRef.current.images.keys())) {
      if (!existingIds.has(id)) {
        const data = renderDataRef.current.images.get(id);
        if (data?.url) URL.revokeObjectURL(data.url);
        renderDataRef.current.images.delete(id);
      }
    }
  }, [monsters]);

  // Autoscroll for drag-drop near edges
  const triggerAutoScroll = useCallback(
    (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const edgeSize = 30;
      const scrollSpeed = 12;

      let dx = 0;
      let dy = 0;

      if (clientX - rect.left < edgeSize) dx = scrollSpeed;
      if (rect.right - clientX < edgeSize) dx = -scrollSpeed;
      if (clientY - rect.top < edgeSize) dy = scrollSpeed;
      if (rect.bottom - clientY < edgeSize) dy = -scrollSpeed;

      if (dx !== 0 || dy !== 0) {
        setCanvasOffset({
          x: canvasOffset.x - dx,
          y: canvasOffset.y - dy,
        });
      }
    },
    [canvasOffset, setCanvasOffset]
  );

  // HTML5 Drag and Drop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let currentTemplate: MonsterTemplate | null = null;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
      setIsDraggingMonster(true);
      triggerAutoScroll(e.clientX, e.clientY);
      const { gx, gy } = screenToGrid(e.clientX, e.clientY);
      setHoverCell(gx >= 0 && gy >= 0 ? { x: gx, y: gy } : null);
    };

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer?.types || [];
      if (type.length > 0) {
        setIsDraggingMonster(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      if (!container.contains(e.relatedTarget as Node)) {
        setIsDraggingMonster(false);
        setHoverCell(null);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDraggingMonster(false);
      setHoverCell(null);

      const data = e.dataTransfer?.getData('monster-type');
      if (!data) return;

      const template = monsterTemplates.find((m) => m.type === data);
      if (!template) return;

      const { gx, gy } = screenToGrid(e.clientX, e.clientY);
      if (gx >= 0 && gy >= 0) {
        const canPlace = grid.length > 0 && gy < grid.length && gx < grid[0]?.length && grid[gy][gx] === 0;
        if (canPlace) {
          addMonsterToGrid(template, gx, gy);
          playClickSound();
          setPlaceFlashCell({ x: gx, y: gy, time: performance.now() });
        }
      }
    };

    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('dragenter', handleDragEnter);
    container.addEventListener('dragleave', handleDragLeave);
    container.addEventListener('drop', handleDrop);

    return () => {
      container.removeEventListener('dragover', handleDragOver);
      container.removeEventListener('dragenter', handleDragEnter);
      container.removeEventListener('dragleave', handleDragLeave);
      container.removeEventListener('drop', handleDrop);
    };
  }, [screenToGrid, addMonsterToGrid, triggerAutoScroll]);

  // Render canvas
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
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    if (grid.length === 0) {
      ctx.fillStyle = '#16213e';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#53537c';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('点击"生成地图"开始编辑', w / 2, h / 2);
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.translate(canvasOffset.x, canvasOffset.y);
    ctx.scale(canvasZoom, canvasZoom);

    if (fadeAnimation) {
      // FADE MODE: base layer (walls + corridors) with low alpha, then rooms fade in one by one
      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
          const px = x * cellSize;
          const py = y * cellSize;
          const cell = grid[y][x];
          const inRoom = rooms.some(
            (r) => x >= r.x && x < r.x + r.width && y >= r.y && y < r.y + r.height
          );

          const baseAlpha = Math.min(1, fadeTick / 0.25);

          if (cell === 1) {
            ctx.globalAlpha = baseAlpha * 0.8;
            ctx.fillStyle = colors.wall;
          } else if (!inRoom) {
            ctx.globalAlpha = baseAlpha * 0.7;
            ctx.fillStyle = colors.corridor;
          } else {
            ctx.globalAlpha = baseAlpha * 0.5;
            ctx.fillStyle = colors.corridor;
          }
          ctx.fillRect(px, py, cellSize, cellSize);
        }
      }
      ctx.globalAlpha = 1;

      // Room-by-room fade-in
      const FADE_ROOM_DELAY = 0.1;
      const FADE_ROOM_DURATION = 0.3;
      const sortedRooms = [...rooms].sort((a, b) => a.x + a.y - (b.x + b.y));

      for (let i = 0; i < sortedRooms.length; i++) {
        const room = sortedRooms[i];
        const startTime = i * FADE_ROOM_DELAY;
        const elapsed = fadeTick - startTime;
        if (elapsed <= 0) continue;
        const alpha = Math.min(1, elapsed / FADE_ROOM_DURATION);
        if (alpha <= 0) continue;

        ctx.globalAlpha = alpha;
        ctx.fillStyle = colors.floor;
        ctx.fillRect(
          room.x * cellSize,
          room.y * cellSize,
          room.width * cellSize,
          room.height * cellSize
        );

        // Draw decorations inside this room
        for (let y = room.y; y < room.y + room.height; y++) {
          for (let x = room.x; x < room.x + room.width; x++) {
            if (grid[y] && grid[y][x] === 3) {
              const cx = x * cellSize + cellSize / 2;
              const cy = y * cellSize + cellSize / 2;
              const emoji = decorationEmojis[theme] || '✨';
              ctx.font = `${cellSize * 0.7}px serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = '#fff';
              ctx.fillText(emoji, cx, cy);
            }
          }
        }
      }
      ctx.globalAlpha = 1;
    } else {
      // NORMAL MODE: draw everything at full opacity
      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
          const px = x * cellSize;
          const py = y * cellSize;
          const cell = grid[y][x];
          const inRoom = rooms.some(
            (r) => x >= r.x && x < r.x + r.width && y >= r.y && y < r.y + r.height
          );

          if (cell === 1) {
            ctx.fillStyle = colors.wall;
          } else if (cell === 0 || cell === 2 || cell === 3) {
            ctx.fillStyle = inRoom ? colors.floor : colors.corridor;
          } else {
            ctx.fillStyle = colors.floor;
          }
          ctx.fillRect(px, py, cellSize, cellSize);

          if (cell === 3) {
            const cx = px + cellSize / 2;
            const cy = py + cellSize / 2;
            const emoji = decorationEmojis[theme] || '✨';
            ctx.font = `${cellSize * 0.7}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.fillText(emoji, cx, cy);
          }
        }
      }
    }

    // Grid lines - dynamic width based on zoom
    const gridLineWidth = Math.max(0.3, 0.5 / canvasZoom);
    ctx.strokeStyle = '#4a4a7c';
    ctx.lineWidth = gridLineWidth;
    if (fadeAnimation) {
      ctx.globalAlpha = Math.min(1, fadeTick / 0.35);
    }

    for (let y = 0; y <= grid.length; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellSize);
      ctx.lineTo(grid[0].length * cellSize, y * cellSize);
      ctx.stroke();
    }
    for (let x = 0; x <= grid[0].length; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize, 0);
      ctx.lineTo(x * cellSize, grid.length * cellSize);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Hover highlight
    if (hoverCell && isDraggingMonster) {
      const { x, y } = hoverCell;
      if (y >= 0 && y < grid.length && x >= 0 && x < grid[0].length) {
        const cell = grid[y][x];
        const canPlace = cell === 0;
        ctx.fillStyle = canPlace ? 'rgba(39, 174, 96, 0.35)' : 'rgba(233, 69, 96, 0.35)';
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        ctx.strokeStyle = canPlace ? '#27ae60' : '#e94560';
        ctx.lineWidth = Math.max(1, 2 / canvasZoom);
        ctx.strokeRect(x * cellSize + 0.5, y * cellSize + 0.5, cellSize - 1, cellSize - 1);
      }
    }

    // Place flash highlight (brief blue flash when monster is placed)
    if (placeFlashCell) {
      const { x, y, time } = placeFlashCell;
      const elapsed = (performance.now() - time) / 1000;
      if (elapsed < 0.2) {
        const alpha = (1 - elapsed / 0.2) * 0.6;
        ctx.fillStyle = `rgba(74, 144, 217, ${alpha})`;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        // Glow effect
        ctx.strokeStyle = `rgba(74, 144, 217, ${alpha * 0.8})`;
        ctx.lineWidth = Math.max(2, 3 / canvasZoom);
        ctx.strokeRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);
      }
    }

    // Tool hover highlight
    if (hoverCell && !isDraggingMonster && (toolMode === 'wall' || toolMode === 'decoration' || toolMode === 'door')) {
      const { x, y } = hoverCell;
      if (y >= 0 && y < grid.length && x >= 0 && x < grid[0].length) {
        ctx.fillStyle = 'rgba(83, 52, 131, 0.3)';
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }

    // Draw patrol paths for existing monsters
    for (const monster of monsters) {
      if (monster.patrolPath.length >= 2) {
        const pts = monster.patrolPath;
        const pathLineWidth = Math.max(1, 2 / canvasZoom);
        ctx.strokeStyle = monster.color;
        ctx.lineWidth = pathLineWidth;
        ctx.setLineDash([4 / canvasZoom, 4 / canvasZoom]);
        ctx.beginPath();
        ctx.moveTo(pts[0].x * cellSize + cellSize / 2, pts[0].y * cellSize + cellSize / 2);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x * cellSize + cellSize / 2, pts[i].y * cellSize + cellSize / 2);
        }
        ctx.lineTo(pts[0].x * cellSize + cellSize / 2, pts[0].y * cellSize + cellSize / 2);
        ctx.stroke();
        ctx.setLineDash([]);

        const dotRadius = Math.max(2, 3 / canvasZoom);
        for (const pt of pts) {
          ctx.fillStyle = monster.color;
          ctx.beginPath();
          ctx.arc(pt.x * cellSize + cellSize / 2, pt.y * cellSize + cellSize / 2, dotRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#1a1a2e';
          ctx.lineWidth = Math.max(0.5, 1 / canvasZoom);
          ctx.stroke();
        }
      }
    }

    // Draw current patrol being drawn
    if (patrolPath.isDrawing && patrolPath.points.length > 0) {
      const pts = patrolPath.points;
      const pathLineWidth = Math.max(1.5, 2.5 / canvasZoom);
      ctx.strokeStyle = '#e94560';
      ctx.lineWidth = pathLineWidth;
      ctx.setLineDash([4 / canvasZoom, 4 / canvasZoom]);
      ctx.beginPath();
      ctx.moveTo(pts[0].x * cellSize + cellSize / 2, pts[0].y * cellSize + cellSize / 2);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x * cellSize + cellSize / 2, pts[i].y * cellSize + cellSize / 2);
      }
      if (pts.length >= 3) {
        ctx.lineTo(pts[0].x * cellSize + cellSize / 2, pts[0].y * cellSize + cellSize / 2);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      const dotRadius = Math.max(3, 4 / canvasZoom);
      for (let i = 0; i < pts.length; i++) {
        const pt = pts[i];
        ctx.fillStyle = i === 0 ? '#27ae60' : '#e94560';
        ctx.beginPath();
        ctx.arc(pt.x * cellSize + cellSize / 2, pt.y * cellSize + cellSize / 2, dotRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = Math.max(0.5, 1 / canvasZoom);
        ctx.stroke();
      }
    }

    // Preview animation: draw moving monster
    if (previewAnim.isPlaying && previewAnim.monsterId) {
      const monster = monsters.find((m) => m.id === previewAnim.monsterId);
      if (monster && monster.patrolPath.length >= 2) {
        const pts = monster.patrolPath;
        const numPts = pts.length;
        const speedPerPoint = 1 / Math.max(1, monster.speed);
        const totalTime = numPts * speedPerPoint;
        const t = (animTime % totalTime) / speedPerPoint;
        const seg = Math.floor(t);
        const frac = t - seg;
        const p1 = pts[seg % numPts];
        const p2 = pts[(seg + 1) % numPts];
        const animX = (p1.x + (p2.x - p1.x) * frac) * cellSize + cellSize / 2;
        const animY = (p1.y + (p2.y - p1.y) * frac) * cellSize + cellSize / 2;

        // Ghost trail effect
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = monster.color;
        ctx.beginPath();
        ctx.arc(animX, animY, cellSize * 0.42, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Draw monster at anim position
        const imgData = renderDataRef.current.images.get(monster.id);
        if (imgData) {
          try {
            ctx.drawImage(
              imgData.img,
              animX - cellSize / 2 + 2,
              animY - cellSize / 2 + 2,
              cellSize - 4,
              cellSize - 4
            );
          } catch {}
        }
      }
    }

    // Draw monsters
    for (const monster of monsters) {
      const px = monster.gridX * cellSize;
      const py = monster.gridY * cellSize;

      const imgData = renderDataRef.current.images.get(monster.id);
      if (imgData && (imgData as any).loaded) {
        try {
          ctx.drawImage(imgData.img, px + 2, py + 2, cellSize - 4, cellSize - 4);
        } catch {
          ctx.fillStyle = monster.color;
          ctx.fillRect(px + 4, py + 4, cellSize - 8, cellSize - 8);
        }
      } else {
        ctx.fillStyle = monster.color;
        ctx.fillRect(px + 4, py + 4, cellSize - 8, cellSize - 8);
      }

      if (monster.id === selectedMonsterId) {
        const selLineWidth = Math.max(1, 2 / canvasZoom);
        ctx.strokeStyle = '#e94560';
        ctx.lineWidth = selLineWidth;
        ctx.strokeRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
        // Glow effect
        ctx.strokeStyle = 'rgba(233, 69, 96, 0.3)';
        ctx.lineWidth = selLineWidth * 2;
        ctx.strokeRect(px - 1, py - 1, cellSize, cellSize);
      }
    }

    ctx.restore();
    ctx.restore();
  }, [
    grid,
    rooms,
    theme,
    colors,
    cellSize,
    monsters,
    selectedMonsterId,
    patrolPath,
    previewAnim,
    canvasOffset,
    canvasZoom,
    fadeAnimation,
    hoverCell,
    isDraggingMonster,
    toolMode,
    animTime,
  ]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Middle click or alt+left for panning
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
        return;
      }

      if (e.button === 0) {
        if (toolMode === 'wall') {
          setCellValue(gx, gy, 1);
        } else if (toolMode === 'door') {
          setCellValue(gx, gy, 0);
        } else if (toolMode === 'decoration') {
          setCellValue(gx, gy, 3);
        }
      }
    },
    [
      toolMode,
      patrolPath,
      grid,
      monsters,
      canvasOffset,
      screenToGrid,
      addPatrolPoint,
      setSelectedMonsterId,
      setCellValue,
    ]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setCanvasOffset({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
        return;
      }

      // Drag painting for walls/decorations
      if (e.buttons === 1 && toolMode !== 'select' && toolMode !== 'patrol') {
        const { gx, gy } = screenToGrid(e.clientX, e.clientY);
        if (gx >= 0 && gy >= 0 && gy < grid.length && gx < grid[0]?.length) {
          if (toolMode === 'wall') {
            setCellValue(gx, gy, 1);
          } else if (toolMode === 'door') {
            setCellValue(gx, gy, 0);
          } else if (toolMode === 'decoration') {
            setCellValue(gx, gy, 3);
          }
        }
      }

      if (!isDraggingMonster) {
        const { gx, gy } = screenToGrid(e.clientX, e.clientY);
        if (gx >= 0 && gy >= 0 && gy < grid.length && gx < grid[0]?.length) {
          setHoverCell({ x: gx, y: gy });
        } else {
          setHoverCell(null);
        }
      }
    },
    [isPanning, panStart, setCanvasOffset, toolMode, isDraggingMonster, screenToGrid, grid, setCellValue]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPanning(false);
    setHoverCell(null);
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.max(0.3, Math.min(3, canvasZoom + delta));
      const zoomRatio = newZoom / canvasZoom;

      const newOffsetX = mouseX - (mouseX - canvasOffset.x) * zoomRatio;
      const newOffsetY = mouseY - (mouseY - canvasOffset.y) * zoomRatio;

      setCanvasZoom(newZoom);
      setCanvasOffset({ x: newOffsetX, y: newOffsetY });
    },
    [canvasZoom, canvasOffset, setCanvasZoom, setCanvasOffset]
  );

  const handleDoubleClick = useCallback(() => {
    if (patrolPath.isDrawing) {
      completePatrolPath();
    }
  }, [patrolPath, completePatrolPath]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (patrolPath.isDrawing) {
        cancelPatrolPath();
      } else {
        setIsPanning(true);
        setPanStart({ x: e.clientX - canvasOffset.x, y: e.clientY - canvasOffset.y });
      }
    },
    [patrolPath, cancelPatrolPath, canvasOffset]
  );

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
          display: 'block',
          cursor: isPanning
            ? 'grabbing'
            : patrolPath.isDrawing
            ? 'crosshair'
            : toolMode === 'select'
            ? 'default'
            : 'cell',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      />

      {patrolPath.isDrawing && (
        <>
          <div
            style={{
              position: 'absolute',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(233, 69, 96, 0.95)',
              color: '#fff',
              padding: '10px 18px',
              borderRadius: 8,
              fontSize: 13,
              pointerEvents: 'none',
              boxShadow: '0 4px 12px rgba(233, 69, 96, 0.4)',
              whiteSpace: 'nowrap',
            }}
          >
            点击地图添加路径点（当前 {patrolPath.points.length} 个点） | 双击完成闭合 | 右键取消
          </div>
          <button
            onClick={cancelPatrolPath}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: '#533483',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '6px 14px',
              fontSize: 12,
              cursor: 'pointer',
              zIndex: 10,
            }}
          >
            取消绘制
          </button>
          {patrolPath.points.length >= 2 && (
            <button
              onClick={completePatrolPath}
              style={{
                position: 'absolute',
                top: 12,
                right: 110,
                background: '#27ae60',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '6px 14px',
                fontSize: 12,
                cursor: 'pointer',
                zIndex: 10,
              }}
            >
              完成路径
            </button>
          )}
        </>
      )}

      {previewAnim.isPlaying && (
        <button
          onClick={() => useEditorStore.getState().stopPreviewAnimation()}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: '#e94560',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '6px 14px',
            fontSize: 12,
            cursor: 'pointer',
            zIndex: 10,
            boxShadow: '0 2px 8px rgba(233, 69, 96, 0.4)',
          }}
        >
          停止预览
        </button>
      )}

      {/* Zoom indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          background: 'rgba(15, 52, 96, 0.8)',
          color: '#8899aa',
          padding: '4px 10px',
          borderRadius: 4,
          fontSize: 11,
          pointerEvents: 'none',
          fontFamily: 'monospace',
        }}
      >
        {(canvasZoom * 100).toFixed(0)}% | {rows}x{cols}
      </div>
    </div>
  );
};
