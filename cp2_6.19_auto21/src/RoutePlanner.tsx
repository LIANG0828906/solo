import React, { useRef, useEffect, useCallback, useState } from 'react';
import { RouteItem, Spot, CATEGORY_COLORS, calcTotalDuration, calcCalories, getThemeColor } from './data';
import { useRouteStore } from './store';

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}小时${m}分钟`;
  if (h > 0) return `${h}小时`;
  return `${m}分钟`;
}

function MapCanvas({ items, highlightUid }: { items: RouteItem[]; highlightUid: string | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const blinkRef = useRef<{ uid: string; count: number; startTime: number } | null>(null);

  useEffect(() => {
    if (highlightUid) {
      blinkRef.current = { uid: highlightUid, count: 0, startTime: performance.now() };
    }
  }, [highlightUid]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    function draw(now: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = '#e0dcd4';
      ctx.lineWidth = 0.5;
      const gridSize = 30;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      if (items.length === 0) {
        ctx.fillStyle = '#bbb';
        ctx.font = '13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('拖拽景点到此处开始规划路线', w / 2, h / 2);
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      const lngs = items.map((i) => i.spot.lng);
      const lats = items.map((i) => i.spot.lat);
      const minLng = Math.min(...lngs) - 0.02;
      const maxLng = Math.max(...lngs) + 0.02;
      const minLat = Math.min(...lats) - 0.02;
      const maxLat = Math.max(...lats) + 0.02;

      const pad = 30;
      const mapW = w - pad * 2;
      const mapH = h - pad * 2;

      const points = items.map((item) => ({
        x: pad + ((item.spot.lng - minLng) / (maxLng - minLng || 1)) * mapW,
        y: pad + ((maxLat - item.spot.lat) / (maxLat - minLat || 1)) * mapH,
        item,
      }));

      if (points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.strokeStyle = '#4a90d9';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        for (let i = 0; i < points.length - 1; i++) {
          const mx = (points[i].x + points[i + 1].x) / 2;
          const my = (points[i].y + points[i + 1].y) / 2;
          ctx.fillStyle = '#999';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
        }
      }

      let blinkAlpha = 1;
      if (blinkRef.current) {
        const elapsed = now - blinkRef.current.startTime;
        const phase = (elapsed % 500) / 500;
        blinkAlpha = phase < 0.5 ? 1 : 0.3;
        if (elapsed > 1000) {
          blinkRef.current = null;
          blinkAlpha = 1;
        }
      }

      points.forEach((p, idx) => {
        const isHighlight = blinkRef.current?.uid === p.item.uid;
        const alpha = isHighlight ? blinkAlpha : 1;
        const color = CATEGORY_COLORS[p.item.spot.category];
        const radius = isHighlight ? 9 : 6;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#333';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${idx + 1}. ${p.item.spot.name}`, p.x, p.y - radius - 5);
        ctx.restore();
      });

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [items]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        borderRadius: 8,
        background: '#faf9f6',
        display: 'block',
      }}
    />
  );
}

interface RoutePlannerProps {
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

export default function RoutePlanner({ onDragOver, onDrop }: RoutePlannerProps) {
  const { items, removeItem, reorderItems } = useRouteStore();
  const [highlightUid, setHighlightUid] = useState<string | null>(null);
  const dragIdxRef = useRef<number | null>(null);
  const [removingUid, setRemovingUid] = useState<string | null>(null);

  const totalDuration = calcTotalDuration(items);
  const totalCalories = calcCalories(items);
  const themeColor = getThemeColor(items);

  const handleRemove = useCallback(
    (uid: string) => {
      setRemovingUid(uid);
      setTimeout(() => {
        removeItem(uid);
        setRemovingUid(null);
      }, 300);
    },
    [removeItem]
  );

  const handleItemDragStart = useCallback((e: React.DragEvent, index: number) => {
    dragIdxRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
    const el = e.currentTarget as HTMLElement;
    el.style.opacity = '0.5';
  }, []);

  const handleItemDragEnd = useCallback((e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = '1';
    dragIdxRef.current = null;
  }, []);

  const handleItemDragOver = useCallback((e: React.DragEvent, overIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragIdxRef.current !== null && dragIdxRef.current !== overIndex) {
      reorderItems(dragIdxRef.current, overIndex);
      dragIdxRef.current = overIndex;
    }
  }, [reorderItems]);

  const handleItemClick = useCallback((uid: string) => {
    setHighlightUid(uid);
    setTimeout(() => setHighlightUid(null), 1200);
  }, []);

  const isFull = items.length >= 8;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e8e4dc' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>今日路线</h2>
          <span style={{ fontSize: 12, color: isFull ? '#e74c3c' : '#999', fontWeight: 600 }}>
            {items.length}/8 景点
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#888' }}>
          <span>⏱ 总时长：{formatDuration(totalDuration)}</span>
          <span>🔥 约 {totalCalories} 千卡</span>
        </div>
      </div>

      <div
        onDragOver={onDragOver}
        onDrop={onDrop}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          minHeight: 0,
        }}
      >
        {items.length === 0 && (
          <div style={{ textAlign: 'center', color: '#bbb', padding: 30, fontSize: 13, border: '2px dashed #e0dcd4', borderRadius: 10 }}>
            拖拽左侧景点卡片到此处
          </div>
        )}
        {items.map((item, idx) => (
          <div
            key={item.uid}
            draggable
            onDragStart={(e) => handleItemDragStart(e, idx)}
            onDragEnd={handleItemDragEnd}
            onDragOver={(e) => handleItemDragOver(e, idx)}
            onClick={() => handleItemClick(item.uid)}
            style={{
              background: '#fff',
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'grab',
              transition: 'all 0.3s ease',
              transform: removingUid === item.uid ? 'scale(0.7)' : 'scale(1)',
              opacity: removingUid === item.uid ? 0 : 1,
              borderLeft: `3px solid ${CATEGORY_COLORS[item.spot.category]}`,
            }}
          >
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: CATEGORY_COLORS[item.spot.category],
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {idx + 1}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.spot.name}
              </div>
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                {item.spot.visitDuration}分钟 · {item.spot.category}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(item.uid);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#ccc',
                cursor: 'pointer',
                fontSize: 16,
                padding: '2px 4px',
                transition: 'color 0.2s',
                lineHeight: 1,
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#e74c3c')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#ccc')}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div style={{ padding: '12px 16px', borderTop: '1px solid #e8e4dc' }}>
        <MapCanvas items={items} highlightUid={highlightUid} />
      </div>

      <div style={{ padding: '0 16px 12px', fontSize: 11, color: '#bbb', textAlign: 'center' }}>
        点击景点可在地图上高亮定位
      </div>
    </div>
  );
}
