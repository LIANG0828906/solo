import React, { useRef, useEffect, useCallback } from 'react';
import { useAppState } from '../store';
import { generateStars, manhattanDistance, calcPolygonArea, findSelfIntersections, euclideanDistance } from './LineEngine';
import { eventBus } from '../eventBus';

const CANVAS_W = 900;
const CANVAS_H = 680;

const StarField: React.FC = () => {
  const { state, dispatch } = useAppState();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  const regenerate = useCallback(() => {
    const count = 60 + Math.floor(Math.random() * 21);
    const stars = generateStars(count, CANVAS_W, CANVAS_H);
    dispatch({ type: 'SET_STARS', stars });
    eventBus.emit('stars:regenerated');
  }, [dispatch]);

  useEffect(() => {
    regenerate();
  }, [regenerate]);

  const getStarAtPos = useCallback((mx: number, my: number): number | null => {
    for (let i = state.stars.length - 1; i >= 0; i--) {
      const s = state.stars[i];
      const r = s.diameter / 2 + 4;
      if (Math.abs(mx - s.x) <= r && Math.abs(my - s.y) <= r) {
        return i;
      }
    }
    return null;
  }, [state.stars]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const elapsed = () => (Date.now() - startTimeRef.current) / 1000;

    const draw = () => {
      const t = elapsed();
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      ctx.fillStyle = '#0B0C10';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      for (let i = 0; i < 80; i++) {
        const sx = (Math.sin(i * 127.1 + 311.7) * 0.5 + 0.5) * CANVAS_W;
        const sy = (Math.sin(i * 269.5 + 183.3) * 0.5 + 0.5) * CANVAS_H;
        const flicker = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * (1.5 + (i % 5) * 0.3) + i));
        ctx.globalAlpha = flicker * 0.4;
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.arc(sx, sy, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      const selected = state.selectedIndices;
      const selectedStars = selected.map(idx => state.stars[idx]).filter(Boolean);

      if (selected.length >= 2) {
        for (let i = 0; i < selected.length - 1; i++) {
          const a = state.stars[selected[i]];
          const b = state.stars[selected[i + 1]];
          if (!a || !b) continue;
          const gradient = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
          gradient.addColorStop(0, 'rgba(232,224,212,0.6)');
          gradient.addColorStop(0.5, 'rgba(232,224,212,0.9)');
          gradient.addColorStop(1, 'rgba(232,224,212,0.6)');
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 2 + Math.random() * 2;
          ctx.shadowColor = '#E8E0D4';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }

      if (selected.length > 0 && state.mousePos && !state.selfIntersecting) {
        const lastStar = state.stars[selected[selected.length - 1]];
        if (lastStar) {
          ctx.strokeStyle = '#888';
          ctx.lineWidth = 1;
          ctx.setLineDash([6, 4]);
          ctx.beginPath();
          ctx.moveTo(lastStar.x, lastStar.y);
          ctx.lineTo(state.mousePos.x, state.mousePos.y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      state.stars.forEach((star, idx) => {
        const isSelected = selected.includes(idx);
        const isHovered = state.hoveredStarId === star.id;
        const breathPhase = Math.sin((t * Math.PI * 2) / star.breathPeriod);
        const breathBrightness = 0.6 + 0.4 * (0.5 + 0.5 * breathPhase);
        const flickerOffset = Math.sin(t * 3.7 + star.id * 7.3) * 0.15;
        const currentBrightness = Math.min(1, Math.max(0.3, star.brightness * breathBrightness + flickerOffset));

        let drawDiameter = star.diameter * currentBrightness;
        if (isHovered) drawDiameter = star.diameter * 1.5;
        if (isSelected) {
          const pulsePhase = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 / 0.6);
          drawDiameter = star.diameter * (1.0 + 0.3 * pulsePhase);
        }

        ctx.globalAlpha = isSelected ? 1 : currentBrightness;
        ctx.fillStyle = star.color;
        ctx.shadowColor = isSelected ? '#FFD700' : (isHovered ? '#FFF' : star.color);
        ctx.shadowBlur = isSelected ? 10 : (isHovered ? 8 : 4);

        ctx.beginPath();
        ctx.arc(star.x, star.y, drawDiameter / 2, 0, Math.PI * 2);
        ctx.fill();

        if (isSelected) {
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 2;
          ctx.shadowColor = '#FFD700';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(star.x, star.y, drawDiameter / 2 + 4, 0, Math.PI * 2);
          ctx.stroke();
        }

        if (isHovered && !isSelected) {
          ctx.strokeStyle = '#FFF';
          ctx.lineWidth = 2;
          ctx.shadowColor = '#FFF';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(star.x, star.y, drawDiameter / 2 + 3, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.shadowBlur = 0;
      });

      ctx.globalAlpha = 1;

      state.intersectionPoints.forEach(pt => {
        ctx.fillStyle = '#FF4444';
        ctx.shadowColor = '#FF4444';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [state.stars, state.selectedIndices, state.selfIntersecting, state.intersectionPoints, state.hoveredStarId, state.mousePos]);

  useEffect(() => {
    const selected = state.selectedIndices;
    if (selected.length < 2) {
      dispatch({ type: 'SET_LINE_DISTANCES', distances: [] });
      dispatch({ type: 'SET_POLYGON_AREA', area: 0 });
      dispatch({ type: 'CLEAR_SELF_INTERSECTION' });
      return;
    }

    const distances: number[] = [];
    for (let i = 0; i < selected.length - 1; i++) {
      const a = state.stars[selected[i]];
      const b = state.stars[selected[i + 1]];
      if (a && b) distances.push(manhattanDistance(a, b));
    }
    dispatch({ type: 'SET_LINE_DISTANCES', distances });

    const selectedStars = selected.map(idx => state.stars[idx]).filter(Boolean);
    if (selectedStars.length >= 3) {
      const area = calcPolygonArea(selectedStars);
      dispatch({ type: 'SET_POLYGON_AREA', area });
    }

    if (selectedStars.length >= 4) {
      const intersections = findSelfIntersections(selectedStars);
      if (intersections.length > 0) {
        dispatch({ type: 'SET_SELF_INTERSECTION', points: intersections });
        eventBus.emit('lines:selfintersection', intersections);
      } else {
        dispatch({ type: 'CLEAR_SELF_INTERSECTION' });
      }
    } else {
      dispatch({ type: 'CLEAR_SELF_INTERSECTION' });
    }

    eventBus.emit('lines:updated', { selectedIndices: selected, distances });
  }, [state.selectedIndices, state.stars, dispatch]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    dispatch({ type: 'SET_MOUSE_POS', pos: { x, y } });

    const hitIdx = getStarAtPos(x, y);
    if (hitIdx !== null && state.stars[hitIdx]) {
      dispatch({ type: 'SET_HOVERED_STAR', id: state.stars[hitIdx].id });
      canvasRef.current!.style.cursor = 'crosshair';
    } else {
      dispatch({ type: 'SET_HOVERED_STAR', id: null });
      canvasRef.current!.style.cursor = 'default';
    }
  }, [dispatch, getStarAtPos, state.stars]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (state.selfIntersecting) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const hitIdx = getStarAtPos(x, y);
    if (hitIdx !== null && !state.selectedIndices.includes(hitIdx)) {
      dispatch({ type: 'SELECT_STAR', index: hitIdx });
      eventBus.emit('star:selected', hitIdx);
    }
  }, [dispatch, getStarAtPos, state.selfIntersecting, state.selectedIndices]);

  const handleUndo = useCallback(() => {
    dispatch({ type: 'DESELECT_LAST' });
    eventBus.emit('action:undo');
  }, [dispatch]);

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET_SELECTION' });
    eventBus.emit('action:reset');
  }, [dispatch]);

  return (
    <div style={{ position: 'relative', width: '960px', height: '720px', border: '2px solid #444', borderRadius: '8px', overflow: 'hidden', background: '#0B0C10', flexShrink: 0 }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{ display: 'block', margin: '20px auto' }}
        onMouseMove={handleCanvasMouseMove}
        onClick={handleCanvasClick}
        onMouseLeave={() => dispatch({ type: 'SET_MOUSE_POS', pos: null })}
      />
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        width: '220px',
        background: 'rgba(26,26,46,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        <button onClick={regenerate} style={buttonStyle}>重绘星空</button>
        <button onClick={handleUndo} style={buttonStyle}>撤销</button>
        <button onClick={handleReset} style={buttonStyle}>重置连线</button>
      </div>
      {state.selfIntersecting && (
        <div style={{
          position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(255,68,68,0.2)', border: '1px solid #FF4444', borderRadius: '6px',
          padding: '6px 16px', color: '#FF8888', fontSize: '13px', pointerEvents: 'none',
        }}>
          检测到自交连线，请撤销后重新绘制
        </div>
      )}
    </div>
  );
};

const buttonStyle: React.CSSProperties = {
  height: '36px',
  background: '#2D2D44',
  color: '#E0E0E0',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  transition: 'all 0.3s ease',
};

export default StarField;
