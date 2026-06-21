import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Star, Constellation, CustomConnection, ObservedStar } from '../utils/stellarData';

interface StarCanvasProps {
  stars: Star[];
  observedStars: ObservedStar[];
  customConnections: CustomConnection[];
  selectedConstellation: Constellation | null;
  lineColor: string;
  isConnectMode: boolean;
  onStarClick: (star: Star) => void;
  onConnectionCreate: (fromStarId: string, toStarId: string) => void;
  onConstellationLineComplete?: () => void;
}

const StarCanvas: React.FC<StarCanvasProps> = ({
  stars,
  observedStars,
  customConnections,
  selectedConstellation,
  lineColor,
  isConnectMode,
  onStarClick,
  onConnectionCreate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  const viewStateRef = useRef({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    targetScale: 1,
    targetOffsetX: 0,
    targetOffsetY: 0,
    velocityX: 0,
    velocityY: 0,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
    zoomCenterX: 0,
    zoomCenterY: 0,
  });

  const constellationAnimRef = useRef({
    progress: 0,
    targetProgress: 0,
    lastConstellationId: '' as string | null,
  });

  const [hoveredStar, setHoveredStar] = useState<Star | null>(null);
  const [connectingStars, setConnectingStars] = useState<Star[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const observedStarIds = new Set(observedStars.map((s) => s.starId));

  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    const state = viewStateRef.current;
    const centerX = canvasSize.width / 2;
    const centerY = canvasSize.height / 2;
    const worldX = (screenX - centerX - state.offsetX) / state.scale;
    const worldY = (screenY - centerY - state.offsetY) / state.scale;
    return { x: worldX + centerX, y: worldY + centerY };
  }, [canvasSize]);

  const worldToScreen = useCallback((worldX: number, worldY: number) => {
    const state = viewStateRef.current;
    const centerX = canvasSize.width / 2;
    const centerY = canvasSize.height / 2;
    const screenX = (worldX - centerX) * state.scale + centerX + state.offsetX;
    const screenY = (worldY - centerY) * state.scale + centerY + state.offsetY;
    return { x: screenX, y: screenY };
  }, [canvasSize]);

  const findStarAt = useCallback((screenX: number, screenY: number): Star | null => {
    const { x: worldX, y: worldY } = screenToWorld(screenX, screenY);
    const state = viewStateRef.current;
    const hitRadius = Math.max(12, 20 / state.scale);

    let closest: Star | null = null;
    let closestDist = Infinity;

    for (const star of stars) {
      const dx = star.x - worldX;
      const dy = star.y - worldY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < hitRadius && dist < closestDist) {
        closestDist = dist;
        closest = star;
      }
    }

    return closest;
  }, [stars, screenToWorld]);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (selectedConstellation) {
      constellationAnimRef.current.targetProgress = 1;
      if (constellationAnimRef.current.lastConstellationId !== selectedConstellation.id) {
        constellationAnimRef.current.progress = 0;
      }
      constellationAnimRef.current.lastConstellationId = selectedConstellation.id;
    } else {
      constellationAnimRef.current.targetProgress = 0;
    }
  }, [selectedConstellation]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const render = (currentTime: number) => {
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      const state = viewStateRef.current;

      state.offsetX += (state.targetOffsetX - state.offsetX) * Math.min(1, deltaTime * 8);
      state.offsetY += (state.targetOffsetY - state.offsetY) * Math.min(1, deltaTime * 8);
      state.scale += (state.targetScale - state.scale) * Math.min(1, deltaTime * 8);

      if (!state.isDragging && (Math.abs(state.velocityX) > 0.01 || Math.abs(state.velocityY) > 0.01)) {
        state.velocityX *= 0.95;
        state.velocityY *= 0.95;
        state.targetOffsetX += state.velocityX;
        state.targetOffsetY += state.velocityY;
      }

      const constellationAnim = constellationAnimRef.current;
      const animSpeed = 1 / (selectedConstellation ? selectedConstellation.connections.length * 0.2 : 1);
      if (constellationAnim.targetProgress > constellationAnim.progress) {
        constellationAnim.progress = Math.min(
          constellationAnim.targetProgress,
          constellationAnim.progress + deltaTime * animSpeed * 5
        );
      } else if (constellationAnim.targetProgress < constellationAnim.progress) {
        constellationAnim.progress = Math.max(
          constellationAnim.targetProgress,
          constellationAnim.progress - deltaTime * animSpeed * 5
        );
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#0B0C2A');
      gradient.addColorStop(1, '#1B1B3A');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      for (let i = 0; i < 100; i++) {
        const bx = (i * 137.508) % canvas.width;
        const by = (i * 251.33) % canvas.height;
        const bs = 0.5 + (i % 3) * 0.3;
        ctx.beginPath();
        ctx.arc(bx, by, bs, 0, Math.PI * 2);
        ctx.fill();
      }

      if (selectedConstellation && constellationAnim.progress > 0) {
        const totalSegments = selectedConstellation.connections.length;
        const currentProgress = constellationAnim.progress * totalSegments;

        selectedConstellation.connections.forEach((connection, index) => {
          const segmentProgress = Math.max(0, Math.min(1, currentProgress - index));
          if (segmentProgress <= 0) return;

          const star1 = stars.find((s) => s.name === connection[0]);
          const star2 = stars.find((s) => s.name === connection[1]);

          if (star1 && star2) {
            const p1 = worldToScreen(star1.x, star1.y);
            const p2 = worldToScreen(star2.x, star2.y);

            const endX = p1.x + (p2.x - p1.x) * segmentProgress;
            const endY = p1.y + (p2.y - p1.y) * segmentProgress;

            ctx.shadowColor = '#7FDBFF';
            ctx.shadowBlur = 10;
            ctx.strokeStyle = 'rgba(127, 219, 255, 0.9)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            ctx.shadowBlur = 0;
            ctx.strokeStyle = 'rgba(127, 219, 255, 0.4)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(endX, endY);
            ctx.stroke();
          }
        });

        ctx.shadowBlur = 0;
      }

      customConnections.forEach((conn) => {
        const star1 = stars.find((s) => s.id === conn.fromStarId);
        const star2 = stars.find((s) => s.id === conn.toStarId);

        if (star1 && star2) {
          const p1 = worldToScreen(star1.x, star1.y);
          const p2 = worldToScreen(star2.x, star2.y);

          ctx.shadowColor = conn.color;
          ctx.shadowBlur = 8;
          ctx.strokeStyle = conn.color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
          ctx.shadowBlur = 0;

          if (conn.note) {
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            const textWidth = ctx.measureText(conn.note).width;
            ctx.fillRect(midX - textWidth / 2 - 4, midY - 10, textWidth + 8, 16);
            ctx.fillStyle = conn.color;
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(conn.note, midX, midY - 2);
          }
        }
      });

      if (isConnectMode && connectingStars.length > 0) {
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);

        for (let i = 0; i < connectingStars.length - 1; i++) {
          const p1 = worldToScreen(connectingStars[i].x, connectingStars[i].y);
          const p2 = worldToScreen(connectingStars[i + 1].x, connectingStars[i + 1].y);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }

        const lastStar = connectingStars[connectingStars.length - 1];
        const lastPoint = worldToScreen(lastStar.x, lastStar.y);
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.stroke();

        ctx.setLineDash([]);
      }

      const constellationStarNames = new Set(
        selectedConstellation ? selectedConstellation.stars : []
      );

      stars.forEach((star) => {
        const pos = worldToScreen(star.x, star.y);
        const time = currentTime / 1000;

        const twinkle =
          0.7 + 0.3 * Math.sin(time * star.twinkleSpeed * 2 + star.twinkleOffset);
        const size = star.baseSize * state.scale;
        const brightness = star.baseBrightness * twinkle;

        const isObserved = observedStarIds.has(star.id);
        const isConstellation = constellationStarNames.has(star.name);
        const isHovered = hoveredStar?.id === star.id;
        const isConnecting = connectingStars.some((s) => s.id === star.id);

        let drawColor = star.color;
        let drawSize = size;
        let glowSize = 0;

        if (isConstellation && constellationAnim.progress > 0.2) {
          drawColor = '#FFD700';
          glowSize = drawSize * 3;
        }

        if (isObserved) {
          glowSize = Math.max(glowSize, drawSize * 2.5);
        }

        if (isHovered) {
          drawSize = size * 1.8;
          glowSize = Math.max(glowSize, drawSize * 3);
        }

        if (isConnecting) {
          drawColor = lineColor;
          glowSize = Math.max(glowSize, drawSize * 2.5);
        }

        if (glowSize > 0) {
          const glowGradient = ctx.createRadialGradient(
            pos.x,
            pos.y,
            0,
            pos.x,
            pos.y,
            glowSize
          );
          const glowColor = isConstellation ? 'rgba(255, 215, 0, 0.4)' :
            isObserved ? 'rgba(127, 219, 255, 0.5)' :
            `rgba(255, 255, 255, ${0.3 * brightness})`;
          glowGradient.addColorStop(0, glowColor);
          glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = glowGradient;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, glowSize, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = drawColor;
        ctx.globalAlpha = brightness;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, drawSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        if (isHovered) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          const textWidth = ctx.measureText(star.name).width;
          ctx.fillRect(pos.x - textWidth / 2 - 6, pos.y - drawSize - 22, textWidth + 12, 18);

          ctx.fillStyle = '#ffffff';
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(star.name, pos.x, pos.y - drawSize - 13);
        }
      });

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [
    stars,
    observedStarIds,
    customConnections,
    selectedConstellation,
    hoveredStar,
    connectingStars,
    mousePos,
    lineColor,
    worldToScreen,
    canvasSize,
    isConnectMode,
  ]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const state = viewStateRef.current;
    state.isDragging = true;
    state.lastMouseX = e.clientX;
    state.lastMouseY = e.clientY;
    state.velocityX = 0;
    state.velocityY = 0;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    const state = viewStateRef.current;

    if (state.isDragging) {
      const dx = e.clientX - state.lastMouseX;
      const dy = e.clientY - state.lastMouseY;
      state.targetOffsetX += dx;
      state.targetOffsetY += dy;
      state.velocityX = dx;
      state.velocityY = dy;
      state.lastMouseX = e.clientX;
      state.lastMouseY = e.clientY;
    }

    const hovered = findStarAt(x, y);
    setHoveredStar(hovered);
  }, [findStarAt]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const state = viewStateRef.current;
    const wasDragging = state.isDragging;
    const dx = e.clientX - state.lastMouseX;
    const dy = e.clientY - state.lastMouseY;
    const movedDistance = Math.sqrt(dx * dx + dy * dy);

    state.isDragging = false;

    if (wasDragging && movedDistance < 3) {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const star = findStarAt(x, y);

        if (star) {
          if (isConnectMode && e.shiftKey) {
            setConnectingStars((prev) => {
              if (prev.some((s) => s.id === star.id)) {
                return prev;
              }
              if (prev.length > 0) {
                const lastStar = prev[prev.length - 1];
                onConnectionCreate(lastStar.id, star.id);
              }
              return [...prev, star];
            });
          } else {
            onStarClick(star);
          }
        }
      }
    }
  }, [findStarAt, isConnectMode, onStarClick, onConnectionCreate]);

  const handleMouseLeave = useCallback(() => {
    const state = viewStateRef.current;
    state.isDragging = false;
    setHoveredStar(null);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const state = viewStateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.8, Math.min(2.0, state.targetScale * zoomFactor));

    const centerX = canvasSize.width / 2;
    const centerY = canvasSize.height / 2;

    const worldX = (mouseX - centerX - state.offsetX) / state.scale;
    const worldY = (mouseY - centerY - state.offsetY) / state.scale;

    state.targetScale = newScale;
    state.targetOffsetX = mouseX - centerX - worldX * newScale;
    state.targetOffsetY = mouseY - centerY - worldY * newScale;
  }, [canvasSize]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Shift' && connectingStars.length > 1) {
      setConnectingStars([]);
    }
  }, [connectingStars]);

  useEffect(() => {
    window.addEventListener('keyup', handleKeyUp);
    return () => window.removeEventListener('keyup', handleKeyUp);
  }, [handleKeyUp]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="star-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        style={{ display: 'block' }}
      />
    </div>
  );
};

export default StarCanvas;
