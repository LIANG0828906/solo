import React, { useRef, useEffect, useCallback } from 'react';
import { useAppState } from '../store';
import { matchMyth } from './MythLibrary';
import { euclideanDistance } from '../stars/LineEngine';
import { eventBus } from '../eventBus';

const MAP_W = 280;
const MAP_H = 220;

function calcSymmetryScore(points: { x: number; y: number }[]): number {
  if (points.length < 3) return 1;
  const edges: number[] = [];
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    const dx = points[i].x - points[j].x;
    const dy = points[i].y - points[j].y;
    edges.push(Math.sqrt(dx * dx + dy * dy));
  }
  const mean = edges.reduce((a, b) => a + b, 0) / edges.length;
  const variance = edges.reduce((a, b) => a + (b - mean) ** 2, 0) / edges.length;
  return mean > 0 ? variance / (mean * mean) : 1;
}

function generateThumbnail(
  stars: { x: number; y: number }[],
  selectedIndices: number[],
  width: number,
  height: number
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#2D2D44';
  ctx.fillRect(0, 0, width, height);

  const selected = selectedIndices.map(i => stars[i]).filter(Boolean);
  if (selected.length === 0) return canvas.toDataURL();

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  selected.forEach(s => {
    minX = Math.min(minX, s.x);
    minY = Math.min(minY, s.y);
    maxX = Math.max(maxX, s.x);
    maxY = Math.max(maxY, s.y);
  });

  const padding = 15;
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const scaleX = (width - 2 * padding) / rangeX;
  const scaleY = (height - 2 * padding) / rangeY;
  const scale = Math.min(scaleX, scaleY);

  const offsetX = (width - rangeX * scale) / 2;
  const offsetY = (height - rangeY * scale) / 2;

  const tx = (s: { x: number; y: number }) => ({
    x: (s.x - minX) * scale + offsetX,
    y: (s.y - minY) * scale + offsetY,
  });

  if (selected.length >= 2) {
    ctx.strokeStyle = '#E8E0D4';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#E8E0D4';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    const first = tx(selected[0]);
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < selected.length; i++) {
      const p = tx(selected[i]);
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  selected.forEach(s => {
    const p = tx(s);
    ctx.fillStyle = '#E8E0D4';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  return canvas.toDataURL();
}

const StarMap: React.FC = () => {
  const { state, dispatch } = useAppState();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const selected = state.selectedIndices;
  const selectedStars = selected.map(idx => state.stars[idx]).filter(Boolean);
  const edgeCount = selected.length > 1 ? selected.length - 1 : 0;
  const symScore = selectedStars.length >= 3 ? calcSymmetryScore(selectedStars) : 1;

  useEffect(() => {
    if (selected.length >= 2) {
      const myth = matchMyth(selected.length, edgeCount, symScore);
      dispatch({ type: 'SET_CURRENT_MYTH', myth });
    } else {
      dispatch({ type: 'SET_CURRENT_MYTH', myth: null });
    }
  }, [selected.length, edgeCount, symScore, dispatch]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, MAP_W, MAP_H);
      ctx.fillStyle = '#2D2D44';
      ctx.fillRect(0, 0, MAP_W, MAP_H);

      if (selectedStars.length === 0) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      selectedStars.forEach(s => {
        minX = Math.min(minX, s.x);
        minY = Math.min(minY, s.y);
        maxX = Math.max(maxX, s.x);
        maxY = Math.max(maxY, s.y);
      });

      const padding = 25;
      const rangeX = maxX - minX || 1;
      const rangeY = maxY - minY || 1;
      const scaleX = (MAP_W - 2 * padding) / rangeX;
      const scaleY = (MAP_H - 2 * padding) / rangeY;
      const scale = Math.min(scaleX, scaleY);
      const offsetX = (MAP_W - rangeX * scale) / 2;
      const offsetY = (MAP_H - rangeY * scale) / 2;

      const tx = (s: { x: number; y: number }) => ({
        x: (s.x - minX) * scale + offsetX,
        y: (s.y - minY) * scale + offsetY,
      });

      if (selectedStars.length >= 2) {
        ctx.strokeStyle = '#E8E0D4';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#E8E0D4';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        const first = tx(selectedStars[0]);
        ctx.moveTo(first.x, first.y);
        for (let i = 1; i < selectedStars.length; i++) {
          const p = tx(selectedStars[i]);
          ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      selectedStars.forEach(s => {
        const p = tx(s);
        ctx.fillStyle = '#E8E0D4';
        ctx.shadowColor = '#E8E0D4';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [selectedStars, selected]);

  const handleSave = useCallback(() => {
    if (selected.length < 2 || !state.currentMyth) return;
    const thumbnail = generateThumbnail(
      state.stars,
      selected,
      60,
      60
    );
    const entry = {
      id: Date.now().toString(),
      stars: [...state.stars],
      selectedIndices: [...selected],
      myth: state.currentMyth,
      thumbnail,
    };
    dispatch({ type: 'ADD_TO_COLLECTION', entry });
    eventBus.emit('constellation:saved', entry);
  }, [selected, state.currentMyth, state.stars, dispatch]);

  const handleLoadEntry = useCallback((entry: typeof state.completedPatterns[0]) => {
    dispatch({ type: 'SET_STARS', stars: entry.stars });
    setTimeout(() => {
      dispatch({ type: 'LOAD_COLLECTION_ENTRY', entry });
    }, 50);
  }, [dispatch]);

  return (
    <div style={{
      width: '320px',
      minHeight: '100%',
      background: 'rgba(26,26,46,0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      flexShrink: 0,
    }}>
      <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#E8E0D4', marginBottom: '4px', letterSpacing: '2px' }}>星盘</h2>
      <canvas
        ref={canvasRef}
        width={MAP_W}
        height={MAP_H}
        style={{ borderRadius: '8px', width: '100%', alignSelf: 'center' }}
      />

      {state.currentMyth ? (
        <div style={{
          background: 'rgba(26,26,46,0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: '10px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: state.currentMyth.color,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}>
              ✦
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#E8E0D4' }}>{state.currentMyth.name}</div>
              <div style={{ fontSize: '13px', color: state.currentMyth.color, marginTop: '2px' }}>寓意：{state.currentMyth.meaning}</div>
            </div>
          </div>
          <div style={{ fontSize: '14px', color: '#E0E0E0', lineHeight: '1.6' }}>
            {state.currentMyth.summary}
          </div>
          <div style={{ fontSize: '12px', color: '#888', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span>星点数：{selected.length}</span>
            <span>连线数：{edgeCount}</span>
            <span>多边形面积：{state.polygonArea.toFixed(1)} px²</span>
            <span>对称性评分：{symScore.toFixed(3)}</span>
            {state.lineDistances.length > 0 && (
              <span>曼哈顿距离：{state.lineDistances.map(d => d.toFixed(0)).join(', ')}</span>
            )}
          </div>
        </div>
      ) : (
        <div style={{ color: '#666', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
          点击星点开始连线，<br />至少连接2颗星以生成星盘
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={selected.length < 2 || !state.currentMyth}
        style={{
          height: '36px',
          background: selected.length >= 2 && state.currentMyth ? '#2D2D44' : '#1A1A2E',
          color: selected.length >= 2 && state.currentMyth ? '#E0E0E0' : '#555',
          border: 'none',
          borderRadius: '6px',
          cursor: selected.length >= 2 && state.currentMyth ? 'pointer' : 'not-allowed',
          fontSize: '14px',
          transition: 'all 0.3s ease',
        }}
      >
        保存星盘
      </button>

      {state.completedPatterns.length > 0 && (
        <div style={{ borderTop: '1px solid #333', paddingTop: '12px' }}>
          <div style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>收藏列表</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {state.completedPatterns.map(entry => (
              <div
                key={entry.id}
                onClick={() => handleLoadEntry(entry)}
                title={entry.myth?.name || '未命名'}
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '8px',
                  background: '#333',
                  border: '2px solid #D4AF37',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                }}
              >
                {entry.thumbnail && (
                  <img src={entry.thumbnail} alt={entry.myth?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StarMap;
