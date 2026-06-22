import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from './store';
import { getCanvasSize, StarNode, getShieldColor } from './GameMap';

interface BackgroundStar {
  x: number;
  y: number;
  size: number;
  opacity: number;
  vx: number;
  vy: number;
}

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(performance.now());
  const lastFireworkUpdateRef = useRef<number>(performance.now());
  const pathAnimationTimerRef = useRef<number | null>(null);
  const pathAnimProgressRef = useRef<Record<number, number>>({});
  const prevSegmentsCountRef = useRef<number>(0);
  const pressedNodeRef = useRef<string | null>(null);

  const { width, height } = getCanvasSize();

  const nodes = useGameStore(s => s.nodes);
  const startNodeId = useGameStore(s => s.startNodeId);
  const endNodeId = useGameStore(s => s.endNodeId);
  const adjacencyMatrix = useGameStore(s => s.adjacencyMatrix);
  const selectedPath = useGameStore(s => s.selectedPath);
  const segments = useGameStore(s => s.segments);
  const remainingShield = useGameStore(s => s.remainingShield);
  const gameStatus = useGameStore(s => s.gameStatus);
  const warningVisible = useGameStore(s => s.warningVisible);
  const fireworkParticles = useGameStore(s => s.fireworkParticles);
  const hoveredNodeId = useGameStore(s => s.hoveredNodeId);

  const clickNode = useGameStore(s => s.clickNode);
  const clearWarning = useGameStore(s => s.clearWarning);
  const updateFireworks = useGameStore(s => s.updateFireworks);
  const setHoveredNode = useGameStore(s => s.setHoveredNode);
  const initializeGame = useGameStore(s => s.initializeGame);

  const [bgStars] = useState<BackgroundStar[]>(() => {
    const stars: BackgroundStar[] = [];
    for (let i = 0; i < 80; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.2 + 0.2,
        opacity: 0.1 + Math.random() * 0.3,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
      });
    }
    return stars;
  });

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  const nodeMap = useRef<Record<string, StarNode>>({});
  useEffect(() => {
    const map: Record<string, StarNode> = {};
    for (const n of nodes) map[n.id] = n;
    nodeMap.current = map;
  }, [nodes]);

  useEffect(() => {
    if (segments.length > prevSegmentsCountRef.current) {
      const newCount = segments.length;
      for (let i = prevSegmentsCountRef.current; i < newCount; i++) {
        if (pathAnimProgressRef.current[i] === undefined) {
          pathAnimProgressRef.current[i] = 0;
        }
      }
      if (pathAnimationTimerRef.current) {
        clearTimeout(pathAnimationTimerRef.current);
      }
      pathAnimationTimerRef.current = window.setTimeout(() => {
        for (let i = prevSegmentsCountRef.current; i < newCount; i++) {
          pathAnimProgressRef.current[i] = 1;
        }
      }, 50);
    } else if (segments.length < prevSegmentsCountRef.current) {
      const keys = Object.keys(pathAnimProgressRef.current).map(Number);
      for (const k of keys) {
        if (k >= segments.length) {
          delete pathAnimProgressRef.current[k];
        }
      }
    }
    prevSegmentsCountRef.current = segments.length;
  }, [segments.length]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      for (const node of nodes) {
        const dx = mx - node.x;
        const dy = my - node.y;
        if (Math.sqrt(dx * dx + dy * dy) <= node.radius + 6) {
          clickNode(node.id);
          return;
        }
      }
    },
    [nodes, clickNode],
  );

  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      let found: string | null = null;
      for (const node of nodes) {
        const dx = mx - node.x;
        const dy = my - node.y;
        if (Math.sqrt(dx * dx + dy * dy) <= node.radius + 6) {
          found = node.id;
          break;
        }
      }
      if (found !== hoveredNodeId) setHoveredNode(found);
    },
    [nodes, hoveredNodeId, setHoveredNode],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      for (const node of nodes) {
        const dx = mx - node.x;
        const dy = my - node.y;
        if (Math.sqrt(dx * dx + dy * dy) <= node.radius + 6) {
          pressedNodeRef.current = node.id;
          return;
        }
      }
      pressedNodeRef.current = null;
    },
    [nodes],
  );

  const handleMouseUp = useCallback(() => {
    pressedNodeRef.current = null;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const now = performance.now();
      const elapsed = now - startTimeRef.current;

      ctx.fillStyle = '#0B0C10';
      ctx.fillRect(0, 0, width, height);

      const grad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, 500);
      grad.addColorStop(0, 'rgba(31, 40, 51, 0.6)');
      grad.addColorStop(1, 'rgba(11, 12, 16, 1)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      for (const star of bgStars) {
        star.x += (star.vx * 16) / 1000 / 60;
        star.y += (star.vy * 16) / 1000 / 60;
        if (star.x < 0) star.x = width;
        if (star.x > width) star.x = 0;
        if (star.y < 0) star.y = height;
        if (star.y > height) star.y = 0;
        const twinkle = 0.85 + 0.15 * Math.sin(elapsed / 800 + star.x);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * twinkle})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }

      const connectionPairs = new Set<string>();
      for (const node of nodes) {
        for (const connId of node.connections) {
          const pair = [node.id, connId].sort().join('|');
          if (connectionPairs.has(pair)) continue;
          connectionPairs.add(pair);
          const conn = nodeMap.current[connId];
          if (!conn) continue;

          let isPath = false;
          let pathIdx = -1;
          for (let i = 0; i < segments.length; i++) {
            const s = segments[i];
            if (
              (s.fromId === node.id && s.toId === connId) ||
              (s.fromId === connId && s.toId === node.id)
            ) {
              isPath = true;
              pathIdx = i;
              break;
            }
          }

          if (isPath) {
            const progress = Math.min(1, (pathAnimProgressRef.current[pathIdx] ?? 1));
            const lineColor = getShieldColor(remainingShield);
            const x1 = node.x;
            const y1 = node.y;
            const x2 = conn.x;
            const y2 = conn.y;
            const dx = x2 - x1;
            const dy = y2 - y1;
            const ex = x1 + dx * progress;
            const ey = y1 + dy * progress;

            ctx.shadowColor = lineColor;
            ctx.shadowBlur = 12;
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 3;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(ex, ey);
            ctx.stroke();
            ctx.shadowBlur = 0;

            if (progress >= 1) {
              const flowPos = (elapsed / 1000) % 1;
              const fx = x1 + dx * flowPos;
              const fy = y1 + dy * flowPos;
              ctx.shadowColor = '#ffffff';
              ctx.shadowBlur = 10;
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.arc(fx, fy, 3, 0, Math.PI * 2);
              ctx.fill();
              ctx.shadowBlur = 0;
            }
          } else {
            const lastId = selectedPath.length > 0 ? selectedPath[selectedPath.length - 1] : null;
            const isReachable =
              lastId === node.id || lastId === connId;
            const highlight =
              (lastId === node.id && conn.id === hoveredNodeId) ||
              (lastId === connId && node.id === hoveredNodeId);

            if (highlight) {
              ctx.shadowColor = '#66FCF1';
              ctx.shadowBlur = 8;
              ctx.strokeStyle = 'rgba(102, 252, 241, 0.9)';
            } else if (isReachable) {
              ctx.strokeStyle = 'rgba(102, 252, 241, 0.45)';
            } else {
              ctx.strokeStyle = 'rgba(150, 150, 170, 0.28)';
            }
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(conn.x, conn.y);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.shadowBlur = 0;
          }
        }
      }

      for (const node of nodes) {
        const pulse = Math.sin(elapsed / 1800 * Math.PI * 2 + node.pulsePhase) * 0.5 + 0.5;
        const haloR = node.radius + 8 + pulse * 8;
        const isHovered = hoveredNodeId === node.id;
        const isPressed = pressedNodeRef.current === node.id;
        const inPath = selectedPath.includes(node.id);
        const scale = isPressed ? 0.95 : 1;

        let baseColor = '#3a4a5e';
        let glowColor = 'rgba(102, 252, 241, 0.35)';

        if (node.type === 'start') {
          baseColor = '#FFD700';
          glowColor = 'rgba(255, 215, 0, 0.55)';
        } else if (node.type === 'end') {
          baseColor = '#9C27B0';
          glowColor = 'rgba(156, 39, 176, 0.55)';
        } else if (node.isAsteroid) {
          baseColor = '#B71C1C';
          glowColor = 'rgba(255, 100, 100, 0.45)';
        } else if (node.hasCrystal) {
          baseColor = '#00E5FF';
          glowColor = 'rgba(0, 229, 255, 0.45)';
        } else if (inPath) {
          baseColor = getShieldColor(remainingShield);
          glowColor = 'rgba(102, 252, 241, 0.5)';
        }

        const cx = node.x;
        const cy = node.y;

        const haloGrad = ctx.createRadialGradient(cx, cy, node.radius, cx, cy, haloR);
        haloGrad.addColorStop(0, glowColor);
        haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, haloR, 0, Math.PI * 2);
        ctx.fill();

        if (isHovered) {
          ctx.strokeStyle = 'rgba(102, 252, 241, 0.5)';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.beginPath();
          ctx.arc(cx, cy, node.radius + 10, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        if (node.type === 'start') {
          const rot = (elapsed / 2000) * Math.PI * 2;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(rot);
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#FFD700';
          ctx.shadowBlur = 16;
          for (let i = 0; i < 3; i++) {
            const gap = (i * Math.PI * 2) / 3;
            ctx.beginPath();
            ctx.arc(0, 0, node.radius + 4 + i * 2, gap, gap + Math.PI * 0.7);
            ctx.stroke();
          }
          ctx.shadowBlur = 0;
          ctx.restore();
        }

        if (node.type === 'end') {
          const rot = (elapsed / 3000) * Math.PI * 2;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.strokeStyle = '#CE93D8';
          ctx.lineWidth = 2;
          ctx.shadowColor = '#9C27B0';
          ctx.shadowBlur = 14;
          for (let s = 0; s < 3; s++) {
            ctx.rotate(rot + s * 0.6);
            ctx.beginPath();
            const rStart = node.radius + 2;
            for (let a = 0; a <= Math.PI * 4; a += 0.15) {
              const r = rStart + a * 1.4;
              const px = Math.cos(a) * r;
              const py = Math.sin(a) * r;
              if (a === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
              if (r > node.radius + 14) break;
            }
            ctx.stroke();
          }
          ctx.shadowBlur = 0;
          ctx.restore();
        }

        const drawR = node.radius * scale;
        ctx.shadowColor = baseColor;
        ctx.shadowBlur = 14;
        const coreGrad = ctx.createRadialGradient(
          cx - drawR * 0.3,
          cy - drawR * 0.3,
          0,
          cx,
          cy,
          drawR,
        );
        if (node.type === 'start') {
          coreGrad.addColorStop(0, '#FFF9C4');
          coreGrad.addColorStop(0.5, '#FFD700');
          coreGrad.addColorStop(1, '#F57F17');
        } else if (node.type === 'end') {
          coreGrad.addColorStop(0, '#F3E5F5');
          coreGrad.addColorStop(0.5, '#CE93D8');
          coreGrad.addColorStop(1, '#6A1B9A');
        } else {
          coreGrad.addColorStop(0, '#ffffff');
          coreGrad.addColorStop(0.4, baseColor);
          coreGrad.addColorStop(1, '#1F2833');
        }
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, drawR, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (node.hasCrystal && node.type === 'normal') {
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(elapsed / 1200);
          ctx.fillStyle = '#00E5FF';
          ctx.shadowColor = '#00E5FF';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.moveTo(0, -7);
          ctx.lineTo(5, 0);
          ctx.lineTo(0, 7);
          ctx.lineTo(-5, 0);
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.restore();
        }

        if (node.isAsteroid && node.type === 'normal') {
          ctx.fillStyle = 'rgba(120, 60, 60, 0.5)';
          for (let i = 0; i < 5; i++) {
            const ang = (i / 5) * Math.PI * 2 + node.pulsePhase;
            const rr = 12 + (i % 2) * 4;
            const px = cx + Math.cos(ang) * rr;
            const py = cy + Math.sin(ang) * rr;
            ctx.beginPath();
            ctx.arc(px, py, 2 + (i % 3), 0, Math.PI * 2);
            ctx.fill();
          }
        }

        if (node.type === 'start' || node.type === 'end') {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.shadowColor = baseColor;
          ctx.shadowBlur = 4;
          ctx.fillText(node.type === 'start' ? '起点' : '终点', cx, cy + drawR + 16);
          ctx.shadowBlur = 0;
        }
      }

      const delta = now - lastFireworkUpdateRef.current;
      lastFireworkUpdateRef.current = now;
      updateFireworks(delta);

      for (const p of fireworkParticles) {
        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animationRef.current);
      if (pathAnimationTimerRef.current) {
        clearTimeout(pathAnimationTimerRef.current);
      }
    };
  }, [
    width,
    height,
    nodes,
    startNodeId,
    endNodeId,
    adjacencyMatrix,
    selectedPath,
    segments,
    remainingShield,
    gameStatus,
    warningVisible,
    fireworkParticles,
    hoveredNodeId,
    bgStars,
    updateFireworks,
  ]);

  return (
    <div className="canvas-wrapper">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="game-canvas"
        onClick={handleClick}
        onMouseMove={handleMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {warningVisible && gameStatus === 'warned' && (
        <div className="modal-overlay" onClick={clearWarning}>
          <div className="modal-box modal-warn" onClick={e => e.stopPropagation()}>
            <div className="modal-icon">⚠</div>
            <div className="modal-title">航线偏离警告</div>
            <div className="modal-text">
              当前路径长度超过最短航线的1.5倍，建议重新规划更高效的路径以节省护盾和燃料。
            </div>
            <button className="modal-btn" onClick={clearWarning}>
              继续规划
            </button>
          </div>
        </div>
      )}

      {warningVisible && gameStatus === 'failed' && (
        <div className="modal-overlay" onClick={clearWarning}>
          <div className="modal-box modal-fail" onClick={e => e.stopPropagation()}>
            <div className="modal-icon">✖</div>
            <div className="modal-title">护盾耗尽</div>
            <div className="modal-text">
              护盾在航行途中完全耗尽！飞船将无法抵达终点。请重新规划一条更安全的航线。
            </div>
            <button className="modal-btn" onClick={clearWarning}>
              重新规划
            </button>
          </div>
        </div>
      )}

      {gameStatus === 'success' && !warningVisible && (
        <div className="success-banner">
          <span className="success-emoji">🌟</span>
          航线规划成功！飞船已抵达终点星门
          <span className="success-emoji">🌟</span>
        </div>
      )}
    </div>
  );
};
