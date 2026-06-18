import React, { useRef, useEffect, useCallback } from 'react';
import { useGameStore, Star, Particle } from '../store/gameStore';
import { constellationMatcher, eventBus, EVENTS } from './ConstellationEngine';

interface StarFieldProps {
  width: number;
  height: number;
}

export const StarField: React.FC<StarFieldProps> = ({ width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const matchAnimationTimerRef = useRef<number | null>(null);

  const {
    stars,
    currentConstellation,
    selectedStars,
    connectionPath,
    trailPath,
    matchAnimation,
    particles,
    isDrawing,
    mousePos,
    selectStar,
    clearSelection,
    addTrailPoint,
    updateTrail,
    addScore,
    incrementCombo,
    resetCombo,
    unlockCard,
    openCardModal,
    triggerMatchAnimation,
    clearMatchAnimation,
    addParticles,
    updateParticles,
    setIsDrawing,
    setMousePos,
    twinkleRandomStar,
  } = useGameStore();

  const selectedStarObjects = selectedStars
    .map((id) => stars.find((s) => s.id === id))
    .filter((s): s is Star => s !== undefined);

  useEffect(() => {
    if (currentConstellation && stars.length > 0) {
      constellationMatcher.setConstellation(currentConstellation, stars);
    }
  }, [currentConstellation, stars]);

  useEffect(() => {
    const twinkleInterval = setInterval(() => {
      twinkleRandomStar();
    }, 500);
    return () => clearInterval(twinkleInterval);
  }, [twinkleRandomStar]);

  const drawStar = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      star: Star,
      time: number
    ) => {
      const { x, y, size, brightness, isTwinkling, isSelected, isMatched } = star;

      let twinkleBrightness = brightness;
      if (isTwinkling) {
        twinkleBrightness = 0.3 + Math.sin(time * 0.01) * 0.7;
      }

      let glowSize = size * 2;
      let glowColor = `rgba(255, 255, 255, ${twinkleBrightness * 0.3})`;
      let starColor = `rgba(255, 255, 255, ${twinkleBrightness})`;

      if (isSelected) {
        glowSize = size * 4;
        glowColor = `rgba(255, 215, 0, ${0.6 + Math.sin(time * 0.02) * 0.2})`;
        starColor = '#FFD700';
      }

      if (isMatched && matchAnimation) {
        glowSize = size * 8;
        const pulse = Math.sin(time * 0.03) * 0.3 + 0.7;
        glowColor = `rgba(0, 229, 255, ${pulse})`;
        starColor = '#00E5FF';
      }

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
      gradient.addColorStop(0, glowColor);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, glowSize, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = starColor;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();

      if (isSelected || (isMatched && matchAnimation)) {
        ctx.strokeStyle = starColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, size + 4, 0, Math.PI * 2);
        ctx.stroke();
      }
    },
    [matchAnimation]
  );

  const drawConnectionLine = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      from: { x: number; y: number },
      to: { x: number; y: number },
      isMatched: boolean,
      time: number
    ) => {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (isMatched) {
        const gradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
        gradient.addColorStop(0, '#00E5FF');
        gradient.addColorStop(1, '#00B8D4');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00E5FF';
        ctx.shadowBlur = 15 + Math.sin(time * 0.02) * 5;
      } else {
        const gradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(1, '#FFA500');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 10;
      }

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();

      ctx.shadowBlur = 0;
    },
    []
  );

  const drawTrail = useCallback(
    (ctx: CanvasRenderingContext2D, trail: { x: number; y: number; alpha: number }[]) => {
      if (trail.length < 2) return;

      for (let i = 1; i < trail.length; i++) {
        const prev = trail[i - 1];
        const curr = trail[i];
        const alpha = curr.alpha * 0.6;

        ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`;
        ctx.lineWidth = 2 * alpha;
        ctx.lineCap = 'round';
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 8 * alpha;

        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(curr.x, curr.y);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
    },
    []
  );

  const drawParticle = useCallback(
    (ctx: CanvasRenderingContext2D, particle: Particle) => {
      const alpha = particle.life;
      ctx.fillStyle = particle.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = 10 * alpha;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    },
    []
  );

  const drawBackground = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const gradient = ctx.createRadialGradient(
        w / 2,
        h / 2,
        0,
        w / 2,
        h / 2,
        Math.max(w, h) * 0.7
      );
      gradient.addColorStop(0, '#1A1B41');
      gradient.addColorStop(0.5, '#0B0E2A');
      gradient.addColorStop(1, '#050614');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      for (let i = 0; i < 100; i++) {
        const x = (i * 137.5) % w;
        const y = (i * 97.3) % h;
        const size = (i % 3) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = 0;

    const render = (time: number) => {
      const deltaTime = time - lastTime;
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      drawBackground(ctx, width, height);

      for (const star of stars) {
        drawStar(ctx, star, time);
      }

      if (trailPath.length > 0) {
        drawTrail(ctx, trailPath);
      }

      if (connectionPath.length > 1) {
        for (let i = 0; i < connectionPath.length - 1; i++) {
          drawConnectionLine(
            ctx,
            connectionPath[i],
            connectionPath[i + 1],
            matchAnimation,
            time
          );
        }
      }

      if (isDrawing && mousePos && connectionPath.length > 0) {
        const lastPoint = connectionPath[connectionPath.length - 1];
        drawConnectionLine(ctx, lastPoint, mousePos, false, time);
      }

      for (const particle of particles) {
        drawParticle(ctx, particle);
      }

      if (deltaTime > 16) {
        updateTrail();
        updateParticles();
      }

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [
    width,
    height,
    stars,
    connectionPath,
    trailPath,
    matchAnimation,
    particles,
    isDrawing,
    mousePos,
    drawBackground,
    drawStar,
    drawConnectionLine,
    drawTrail,
    drawParticle,
    updateTrail,
    updateParticles,
  ]);

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (matchAnimation) return;
    const { x, y } = getCanvasCoords(e);
    setIsDrawing(true);
    setMousePos({ x, y });

    const nearbyStar = constellationMatcher.checkProximity(x, y, stars, 25);
    if (nearbyStar && !selectedStars.includes(nearbyStar.id)) {
      selectStar(nearbyStar.id);
      eventBus.emit(EVENTS.STAR_SELECTED, { starId: nearbyStar.id });
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    const { x, y } = getCanvasCoords(e);
    setMousePos({ x, y });

    if (isDrawing) {
      addTrailPoint(x, y);

      const nearbyStar = constellationMatcher.checkProximity(x, y, stars, 25);
      if (nearbyStar && !selectedStars.includes(nearbyStar.id)) {
        selectStar(nearbyStar.id);
        eventBus.emit(EVENTS.STAR_SELECTED, { starId: nearbyStar.id });
      }
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setMousePos(null);

    if (selectedStars.length >= constellationMatcher.getConstellationStarCount()) {
      const result = constellationMatcher.matchConstellation(
        connectionPath,
        selectedStarObjects
      );

      if (result.matched) {
        eventBus.emit(EVENTS.CONSTELLATION_MATCHED, {
          constellation: currentConstellation,
          accuracy: result.accuracy,
        });

        const matchedStarIds = result.matchedStarIndices
          .map((i) => selectedStars[i])
          .filter((id): id is string => id !== undefined);

        triggerMatchAnimation(matchedStarIds);

        const centerX = matchedStarIds.reduce((sum, id) => {
          const star = stars.find((s) => s.id === id);
          return sum + (star?.x || 0);
        }, 0) / matchedStarIds.length;

        const centerY = matchedStarIds.reduce((sum, id) => {
          const star = stars.find((s) => s.id === id);
          return sum + (star?.y || 0);
        }, 0) / matchedStarIds.length;

        addParticles(centerX, centerY, 40);

        if (matchAnimationTimerRef.current) {
          clearTimeout(matchAnimationTimerRef.current);
        }
        matchAnimationTimerRef.current = window.setTimeout(() => {
          clearMatchAnimation();

          if (currentConstellation) {
            addScore(100);
            incrementCombo();

            const card = unlockCard({
              constellationName: currentConstellation.id,
              title: currentConstellation.story.title,
              content: currentConstellation.story.content,
              image: currentConstellation.story.image,
            });

            openCardModal(card);
          }
        }, 300);
      } else {
        resetCombo();
        eventBus.emit(EVENTS.CONSTELLATION_MISMATCHED, {
          accuracy: result.accuracy,
        });
      }
    }

    clearSelection();
  };

  const handleMouseLeave = () => {
    if (isDrawing) {
      handleMouseUp();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    handlePointerDown(e);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    handlePointerMove(e);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    handleMouseUp();
  };

  useEffect(() => {
    return () => {
      if (matchAnimationTimerRef.current) {
        clearTimeout(matchAnimationTimerRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        display: 'block',
        cursor: isDrawing ? 'crosshair' : 'pointer',
        touchAction: 'none',
      }}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
};

export default StarField;
