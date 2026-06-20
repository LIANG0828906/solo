import React, { useRef, useEffect, useCallback } from 'react';
import { LevelData, PathResult, Position, Platform, Enemy, Coin } from '../core/PathFinder';

interface LevelRendererProps {
  levelData: LevelData | null;
  pathResult: PathResult | null;
  showFireworks: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

interface ViewState {
  offsetX: number;
  offsetY: number;
  scale: number;
}

const CELL_SIZE = 1;
const AGENT_SPEED = 3;

const LevelRenderer: React.FC<LevelRendererProps> = ({ levelData, pathResult, showFireworks }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>(0);
  const viewRef = useRef<ViewState>({ offsetX: 0, offsetY: 0, scale: 1 });
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const timeRef = useRef(0);
  const agentProgressRef = useRef(0);
  const agentAnimatingRef = useRef(false);
  const particlesRef = useRef<Particle[]>([]);
  const coinRotationRef = useRef(0);
  const failFlashRef = useRef(0);
  const fireworksRef = useRef<boolean>(false);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
  }, []);

  const worldToScreen = useCallback((worldX: number, worldY: number, view: ViewState, canvas: HTMLCanvasElement) => {
    const screenX = (worldX + view.offsetX) * view.scale + canvas.width / 2;
    const screenY = (worldY + view.offsetY) * view.scale + canvas.height / 2;
    return { x: screenX, y: screenY };
  }, []);

  const drawBackground = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#2c3e50');
    gradient.addColorStop(1, '#0f2027');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const drawPlatform = useCallback((ctx: CanvasRenderingContext2D, platform: Platform, view: ViewState, canvas: HTMLCanvasElement) => {
    const { x, y, width, height } = platform;
    const topLeft = worldToScreen(x, y, view, canvas);
    const w = width * view.scale * window.devicePixelRatio;
    const h = height * view.scale * window.devicePixelRatio;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10 * window.devicePixelRatio;
    ctx.shadowOffsetX = 4 * window.devicePixelRatio;
    ctx.shadowOffsetY = 4 * window.devicePixelRatio;

    ctx.fillStyle = '#8B4513';
    ctx.fillRect(topLeft.x, topLeft.y, w, h);

    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#D2B48C';
    ctx.lineWidth = 2 * window.devicePixelRatio;
    ctx.strokeRect(topLeft.x, topLeft.y, w, h);

    ctx.restore();
  }, [worldToScreen]);

  const drawEnemy = useCallback((ctx: CanvasRenderingContext2D, enemy: Enemy, view: ViewState, canvas: HTMLCanvasElement) => {
    const pos = worldToScreen(enemy.x, enemy.y, view, canvas);
    const radius = enemy.radius * view.scale * window.devicePixelRatio;

    ctx.save();
    ctx.shadowColor = 'rgba(255, 0, 0, 0.6)';
    ctx.shadowBlur = 15 * window.devicePixelRatio;

    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pos.x - radius * 0.3, pos.y - radius * 0.2, radius * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(pos.x + radius * 0.3, pos.y - radius * 0.2, radius * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(pos.x - radius * 0.3, pos.y - radius * 0.2, radius * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(pos.x + radius * 0.3, pos.y - radius * 0.2, radius * 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }, [worldToScreen]);

  const drawCoin = useCallback((ctx: CanvasRenderingContext2D, coin: Coin, rotation: number, view: ViewState, canvas: HTMLCanvasElement) => {
    const pos = worldToScreen(coin.x, coin.y, view, canvas);
    const size = 12 * view.scale * window.devicePixelRatio;

    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(rotation);

    ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
    ctx.shadowBlur = 10 * window.devicePixelRatio;

    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.7, 0);
    ctx.lineTo(0, size);
    ctx.lineTo(-size * 0.7, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.5);
    ctx.lineTo(size * 0.35, 0);
    ctx.lineTo(0, size * 0.5);
    ctx.lineTo(-size * 0.35, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }, [worldToScreen]);

  const drawStartEnd = useCallback((ctx: CanvasRenderingContext2D, level: LevelData, view: ViewState, canvas: HTMLCanvasElement) => {
    const startPos = worldToScreen(level.startPos.x, level.startPos.y, view, canvas);
    const endPos = worldToScreen(level.endPos.x, level.endPos.y, view, canvas);
    const markerSize = 20 * view.scale * window.devicePixelRatio;

    ctx.save();
    ctx.shadowColor = 'rgba(46, 204, 113)';
    ctx.shadowBlur = 15 * window.devicePixelRatio;

    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.arc(startPos.x, startPos.y, markerSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${14 * view.scale * window.devicePixelRatio}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', startPos.x, startPos.y);

    ctx.shadowColor = 'rgba(52, 152, 219)';
    ctx.shadowBlur = 15 * window.devicePixelRatio;

    ctx.fillStyle = '#3498db';
    ctx.beginPath();
    ctx.moveTo(endPos.x, endPos.y - markerSize);
    ctx.lineTo(endPos.x + markerSize, endPos.y + markerSize * 0.7);
    ctx.lineTo(endPos.x - markerSize, endPos.y + markerSize * 0.7);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillText('E', endPos.x, endPos.y + markerSize * 0.2);

    ctx.restore();
  }, [worldToScreen]);

  const drawPath = useCallback((ctx: CanvasRenderingContext2D, path: Position[], view: ViewState, canvas: HTMLCanvasElement) => {
    if (path.length < 2) return;

    ctx.save();
    ctx.strokeStyle = 'rgba(46, 204, 113, 0.6)';
    ctx.lineWidth = 3 * window.devicePixelRatio;
    ctx.setLineDash([10 * window.devicePixelRatio, 5 * window.devicePixelRatio]);

    ctx.beginPath();
    const firstPos = worldToScreen(path[0].x, path[0].y, view, canvas);
    ctx.moveTo(firstPos.x, firstPos.y);

    for (let i = 1; i < path.length; i++) {
      const pos = worldToScreen(path[i].x, path[i].y, view, canvas);
      ctx.lineTo(pos.x, pos.y);
    }
    ctx.stroke();

    ctx.restore();
  }, [worldToScreen]);

  const drawAgent = useCallback((ctx: CanvasRenderingContext2D, pos: Position, view: ViewState, canvas: HTMLCanvasElement) => {
    const screenPos = worldToScreen(pos.x, pos.y, view, canvas);
    const radius = 15 * view.scale * window.devicePixelRatio;

    ctx.save();
    ctx.shadowColor = 'rgba(155, 89, 182)';
    ctx.shadowBlur = 20 * window.devicePixelRatio;

    ctx.fillStyle = '#9b59b6';
    ctx.beginPath();
    ctx.arc(screenPos.x, screenPos.y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(screenPos.x - radius * 0.3, screenPos.y - radius * 0.2, radius * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(screenPos.x + radius * 0.3, screenPos.y - radius * 0.2, radius * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.arc(screenPos.x - radius * 0.25, screenPos.y - radius * 0.2, radius * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(screenPos.x + radius * 0.35, screenPos.y - radius * 0.2, radius * 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }, [worldToScreen]);

  const drawParticles = useCallback((ctx: CanvasRenderingContext2D, particles: Particle[], view: ViewState, canvas: HTMLCanvasElement) => {
    for (const particle of particles) {
      const alpha = particle.life / particle.maxLife;
      const pos = worldToScreen(particle.x, particle.y, view, canvas);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = 5 * window.devicePixelRatio;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, particle.size * view.scale * window.devicePixelRatio, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }, [worldToScreen]);

  const drawFailFlash = useCallback((ctx: CanvasRenderingContext2D, level: LevelData, flashIntensity: number, view: ViewState, canvas: HTMLCanvasElement) => {
    if (flashIntensity <= 0) return;

    ctx.save();
    ctx.globalAlpha = flashIntensity * 0.3;

    for (const platform of level.platforms) {
      const topLeft = worldToScreen(platform.x, platform.y, view, canvas);
      const w = platform.width * view.scale * window.devicePixelRatio;
      const h = platform.height * view.scale * window.devicePixelRatio;

      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(topLeft.x, topLeft.y, w, h);
    }

    for (const enemy of level.enemies) {
      const pos = worldToScreen(enemy.x, enemy.y, view, canvas);
      const radius = enemy.radius * view.scale * window.devicePixelRatio * 1.5;

      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }, [worldToScreen]);

  const createFireworks = useCallback((x: number, y: number) => {
    const colors = ['#e74c3c', '#f39c12', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6', '#e91e63'];
    const newParticles: Particle[] = [];

    for (let i = 0; i < 50; i++) {
      const angle = (Math.PI * 2 * i) / 50 + Math.random() * 0.2;
      const speed = 2 + Math.random() * 4;
      newParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 60,
        maxLife: 60,
        size: 3 + Math.random() * 3,
      });
    }

    particlesRef.current = [...particlesRef.current, ...newParticles];
  }, []);

  const getPositionOnPath = useCallback((path: Position[], progress: number): Position => {
    if (path.length === 0) return { x: 0, y: 0 };
    if (path.length === 1) return path[0];

    const totalSegments = path.length - 1;
    const segmentIndex = Math.min(Math.floor(progress * totalSegments), totalSegments - 1);
    const segmentProgress = (progress * totalSegments) - segmentIndex;

    const start = path[segmentIndex];
    const end = path[segmentIndex + 1];

    return {
      x: start.x + (end.x - start.x) * segmentProgress,
      y: start.y + (end.y - start.y) * segmentProgress,
    };
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const view = viewRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground(ctx, canvas);

    if (levelData) {
      if (pathResult && !pathResult.success) {
        drawFailFlash(ctx, levelData, failFlashRef.current, view, canvas);
      }

      for (const platform of levelData.platforms) {
        drawPlatform(ctx, platform, view, canvas);
      }

      for (const enemy of levelData.enemies) {
        drawEnemy(ctx, enemy, view, canvas);
      }

      for (const coin of levelData.coins) {
        drawCoin(ctx, coin, coinRotationRef.current, view, canvas);
      }

      drawStartEnd(ctx, levelData, view, canvas);

      if (pathResult && pathResult.path.length > 1) {
        drawPath(ctx, pathResult.path, view, canvas);
      }

      if (agentAnimatingRef.current && pathResult && pathResult.path.length > 0) {
        const agentPos = getPositionOnPath(pathResult.path, agentProgressRef.current);
        drawAgent(ctx, agentPos, view, canvas);
      }

      drawParticles(ctx, particlesRef.current, view, canvas);
    }
  }, [levelData, pathResult, drawBackground, drawPlatform, drawEnemy, drawCoin, drawStartEnd, drawPath, drawAgent, drawParticles, drawFailFlash, getPositionOnPath]);

  const animate = useCallback((timestamp: number) => {
    const deltaTime = Math.min((timestamp - timeRef.current) / 1000, 0.1);
    timeRef.current = timestamp;

    coinRotationRef.current += deltaTime * 2;

    if (agentAnimatingRef.current && pathResult && pathResult.path.length > 1) {
      const totalDistance = pathResult.path.length - 1;
      const progressPerSecond = AGENT_SPEED / totalDistance;
      agentProgressRef.current += progressPerSecond * deltaTime;

      if (agentProgressRef.current >= 1) {
        agentProgressRef.current = 1;
        agentAnimatingRef.current = false;

        if (pathResult.success && fireworksRef.current) {
          const lastPos = pathResult.path[pathResult.path.length - 1];
          createFireworks(lastPos.x, lastPos.y);
        }
      }
    }

    if (particlesRef.current.length > 0) {
      const updatedParticles: Particle[] = [];
      for (const particle of particlesRef.current) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.1;
        particle.life -= 1;

        if (particle.life > 0) {
          updatedParticles.push(particle);
        }
      }
      particlesRef.current = updatedParticles;
    }

    if (failFlashRef.current > 0) {
      failFlashRef.current = Math.max(0, failFlashRef.current - deltaTime * 2);
    }

    render();

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [pathResult, render, createFireworks]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;

    const dx = (e.clientX - lastMousePosRef.current.x) * window.devicePixelRatio;
    const dy = (e.clientY - lastMousePosRef.current.y) * window.devicePixelRatio;

    viewRef.current.offsetX += dx / viewRef.current.scale;
    viewRef.current.offsetY += dy / viewRef.current.scale;

    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.2, Math.min(3, viewRef.current.scale * scaleFactor));

    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * window.devicePixelRatio;
    const mouseY = (e.clientY - rect.top) * window.devicePixelRatio;

    const worldX = (mouseX - canvas.width / 2) / viewRef.current.scale - viewRef.current.offsetX;
    const worldY = (mouseY - canvas.height / 2) / viewRef.current.scale - viewRef.current.offsetY;

    viewRef.current.scale = newScale;

    const newScreenX = (worldX + viewRef.current.offsetX) * newScale + canvas.width / 2;
    const newScreenY = (worldY + viewRef.current.offsetY) * newScale + canvas.height / 2;

    viewRef.current.offsetX += (mouseX - newScreenX) / newScale;
    viewRef.current.offsetY += (mouseY - newScreenY) / newScale;
  }, []);

  const fitLevelToView = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !levelData) return;

    const padding = 100 * window.devicePixelRatio;
    const availableWidth = canvas.width - padding * 2;
    const availableHeight = canvas.height - padding * 2;

    const scaleX = availableWidth / levelData.width;
    const scaleY = availableHeight / levelData.height;
    const scale = Math.min(scaleX, scaleY, 2);

    const offsetX = -levelData.width / 2;
    const offsetY = -levelData.height / 2;

    viewRef.current = { offsetX, offsetY, scale };
  }, [levelData]);

  useEffect(() => {
    if (pathResult) {
      agentProgressRef.current = 0;
      agentAnimatingRef.current = pathResult.success && pathResult.path.length > 1;
      particlesRef.current = [];
      failFlashRef.current = pathResult.success ? 0 : 1;
    }
  }, [pathResult]);

  useEffect(() => {
    if (showFireworks && pathResult?.success) {
      fireworksRef.current = true;
      const lastPos = pathResult.path[pathResult.path.length - 1];
      let count = 0;
      const interval = setInterval(() => {
        if (count < 3) {
          createFireworks(lastPos.x + (Math.random() - 0.5) * 50, lastPos.y - 30 - Math.random() * 50);
          count++;
        } else {
          clearInterval(interval);
        }
      }, 400);
      return () => clearInterval(interval);
    } else {
      fireworksRef.current = false;
    }
  }, [showFireworks, pathResult, createFireworks]);

  useEffect(() => {
    if (levelData) {
      fitLevelToView();
    }
  }, [levelData, fitLevelToView]);

  useEffect(() => {
    const handleResize = () => {
      resizeCanvas();
      if (levelData) {
        fitLevelToView();
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [resizeCanvas, fitLevelToView, levelData]);

  useEffect(() => {
    timeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animate]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: '#0f2027',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{
          display: 'block',
          cursor: isDraggingRef.current ? 'grabbing' : 'grab',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          color: '#ffffff',
          fontSize: '12px',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          padding: '8px 12px',
          borderRadius: '6px',
          pointerEvents: 'none',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div>拖拽平移 · 滚轮缩放</div>
        {pathResult && (
          <div style={{ marginTop: '4px' }}>
            {pathResult.success ? '✓ 路径找到' : '✗ 未找到路径'}
          </div>
        )}
      </div>
    </div>
  );
};

export default LevelRenderer;
