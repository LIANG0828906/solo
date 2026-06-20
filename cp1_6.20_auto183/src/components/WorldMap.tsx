import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  Capsule,
  LatLng,
  latLngToPixel,
  pixelToLatLng,
  generateContinentPolygons,
  smoothNoise,
  MAP_WIDTH,
  MAP_HEIGHT,
  easeInOutCubic,
  getCurrentCapsuleStatus,
} from '../utils/mapUtils';

interface WorldMapProps {
  capsules: Capsule[];
  onClick: (latLng: LatLng, pixel: { x: number; y: number }) => void;
  pendingPixel?: { x: number; y: number };
  rippleKey: number;
  focusCapsule: Capsule | null;
  isDiscovering: boolean;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
  startTime: number;
}

const PAN_DURATION = 1200;

const WorldMap: React.FC<WorldMapProps> = ({
  capsules,
  onClick,
  pendingPixel,
  rippleKey,
  focusCapsule,
  isDiscovering,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const ripplesRef = useRef<Ripple[]>([]);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const offsetRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const panAnimRef = useRef<{
    active: boolean;
    startTime: number;
    startOffsetX: number;
    startOffsetY: number;
    targetOffsetX: number;
    targetOffsetY: number;
    targetZoom: number;
  }>({ active: false, startTime: 0, startOffsetX: 0, startOffsetY: 0, targetOffsetX: 0, targetOffsetY: 0, targetZoom: 1 });

  const continentPolygons = useMemo(() => generateContinentPolygons(MAP_WIDTH, MAP_HEIGHT), []);

  const pointInPolygon = useCallback((px: number, py: number, polygon: { x: number; y: number }[]): boolean => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      const intersect =
        yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi + 0.0001) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }, []);

  const getLandColor = useCallback((x: number, y: number): string => {
    const n = smoothNoise(x / 40, y / 40, 42);
    const n2 = smoothNoise(x / 15, y / 15, 99);
    const mixed = n * 0.7 + n2 * 0.3;
    if (mixed < 0.35) return '#4a7c59';
    if (mixed < 0.5) return '#528a62';
    if (mixed < 0.65) return '#5c966a';
    if (mixed < 0.8) return '#66a072';
    return '#6ba368';
  }, []);

  useEffect(() => {
    const updateViewport = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setViewport({ width: rect.width, height: rect.height });
    };
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  useEffect(() => {
    if (!focusCapsule || !viewport.width || !viewport.height) return;

    const pixel = latLngToPixel(focusCapsule.lat, focusCapsule.lng, MAP_WIDTH, MAP_HEIGHT);

    const isMobile = viewport.width < 768;
    const targetZoom = isMobile ? 1.5 : 2;
    const mapDisplayWidth = (MAP_WIDTH / MAP_HEIGHT) * viewport.height;
    const targetOffsetX = viewport.width / 2 - pixel.x * ((mapDisplayWidth * targetZoom) / MAP_WIDTH);
    const targetOffsetY = viewport.height / 2 - pixel.y * targetZoom;

    panAnimRef.current = {
      active: true,
      startTime: performance.now(),
      startOffsetX: offsetRef.current.x,
      startOffsetY: offsetRef.current.y,
      targetOffsetX,
      targetOffsetY,
      targetZoom,
    };
  }, [focusCapsule, viewport.width, viewport.height]);

  useEffect(() => {
    if (rippleKey === 0 || !pendingPixel) return;
    ripplesRef.current.push({
      id: rippleKey,
      x: pendingPixel.x,
      y: pendingPixel.y,
      startTime: performance.now(),
    });
  }, [rippleKey, pendingPixel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !viewport.width || !viewport.height) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = viewport.width * dpr;
    canvas.height = viewport.height * dpr;
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const isMobile = viewport.width < 768;

    const getMapScale = () => {
      const baseScale = Math.min(viewport.width / MAP_WIDTH, viewport.height / MAP_HEIGHT);
      if (isMobile) return baseScale * 0.9;
      return baseScale;
    };

    const render = (timestamp: number) => {
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      if (panAnimRef.current.active) {
        const elapsed = timestamp - panAnimRef.current.startTime;
        const t = Math.min(1, elapsed / PAN_DURATION);
        const eased = easeInOutCubic(t);

        const pa = panAnimRef.current;
        offsetRef.current.x = pa.startOffsetX + (pa.targetOffsetX - pa.startOffsetX) * eased;
        offsetRef.current.y = pa.startOffsetY + (pa.targetOffsetY - pa.startOffsetY) * eased;
        zoomRef.current = 1 + (pa.targetZoom - 1) * eased;

        if (t >= 1) {
          panAnimRef.current.active = false;
        }
      }

      ctx.clearRect(0, 0, viewport.width, viewport.height);

      const baseScale = getMapScale();
      const zoom = zoomRef.current;
      const scale = baseScale * zoom;
      const mapDrawW = MAP_WIDTH * scale;
      const mapDrawH = MAP_HEIGHT * scale;

      let offsetX = (viewport.width - mapDrawW) / 2 + offsetRef.current.x;
      let offsetY = (viewport.height - mapDrawH) / 2 + offsetRef.current.y;

      ctx.save();
      ctx.translate(offsetX, offsetY);

      const oceanGradient = ctx.createLinearGradient(0, 0, mapDrawW, mapDrawH);
      oceanGradient.addColorStop(0, '#2b5c8a');
      oceanGradient.addColorStop(1, '#4a90c4');
      ctx.fillStyle = oceanGradient;
      ctx.fillRect(0, 0, mapDrawW, mapDrawH);

      ctx.globalAlpha = 0.08;
      for (let i = 0; i < 80; i++) {
        const wx = (smoothNoise(i * 3.7, timestamp / 3000, 7) * mapDrawW);
        const wy = (smoothNoise(i * 5.3, timestamp / 4000, 13) * mapDrawH);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(wx, wy, 1.5 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      continentPolygons.forEach((polygon, pIdx) => {
        ctx.beginPath();
        polygon.forEach((pt, i) => {
          const sx = pt.x * scale;
          const sy = pt.y * scale;
          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        });
        ctx.closePath();

        const pixelStep = Math.max(2, 4 / scale);
        const bounds = polygon.reduce(
          (acc, pt) => {
            acc.minX = Math.min(acc.minX, pt.x);
            acc.maxX = Math.max(acc.maxX, pt.x);
            acc.minY = Math.min(acc.minY, pt.y);
            acc.maxY = Math.max(acc.maxY, pt.y);
            return acc;
          },
          { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
        );

        ctx.save();
        ctx.clip();

        for (let py = bounds.minY; py <= bounds.maxY; py += pixelStep) {
          for (let px = bounds.minX; px <= bounds.maxX; px += pixelStep) {
            if (pointInPolygon(px, py, polygon)) {
              const color = getLandColor(px + pIdx * 100, py + pIdx * 200);
              ctx.fillStyle = color;
              ctx.fillRect(px * scale, py * scale, pixelStep * scale + 0.5, pixelStep * scale + 0.5);
            }
          }
        }
        ctx.restore();

        ctx.beginPath();
        polygon.forEach((pt, i) => {
          const sx = pt.x * scale;
          const sy = pt.y * scale;
          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        });
        ctx.closePath();
        ctx.strokeStyle = 'rgba(60,90,60,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 0.5;
      for (let lat = -60; lat <= 60; lat += 30) {
        const y = latLngToPixel(lat, 0, MAP_WIDTH, MAP_HEIGHT).y * scale;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(mapDrawW, y);
        ctx.stroke();
      }
      for (let lng = -150; lng <= 150; lng += 30) {
        const x = latLngToPixel(0, lng, MAP_WIDTH, MAP_HEIGHT).x * scale;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, mapDrawH);
        ctx.stroke();
      }

      const pulseTime = timestamp / 600;
      capsules.forEach((capsule) => {
        const status = getCurrentCapsuleStatus(capsule.openDate);
        const isFocused = focusCapsule?.id === capsule.id;
        const pos = latLngToPixel(capsule.lat, capsule.lng, MAP_WIDTH, MAP_HEIGHT);
        const cx = pos.x * scale;
        const cy = pos.y * scale;
        const baseSize = isFocused ? 14 : 10;
        const pulse = 1 + Math.sin(pulseTime + capsule.id.charCodeAt(0) % 10) * 0.15;
        const size = baseSize * pulse;

        if (status !== 'discovered' || isFocused) {
          const glowSize = size * 2.2;
          const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowSize);
          if (status === 'unlocked' && !isFocused) {
            glow.addColorStop(0, 'rgba(255,200,80,0.4)');
            glow.addColorStop(1, 'rgba(255,200,80,0)');
          } else if (status === 'sealed') {
            glow.addColorStop(0, 'rgba(120,140,180,0.3)');
            glow.addColorStop(1, 'rgba(120,140,180,0)');
          } else if (status === 'discovered') {
            glow.addColorStop(0, 'rgba(150,150,150,0.25)');
            glow.addColorStop(1, 'rgba(150,150,150,0)');
          } else {
            glow.addColorStop(0, 'rgba(255,180,100,0.35)');
            glow.addColorStop(1, 'rgba(255,180,100,0)');
          }
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(cx, cy, glowSize, 0, Math.PI * 2);
          ctx.fill();
        }

        if (status !== 'discovered' || isFocused) {
          const bodyColor =
            status === 'sealed'
              ? '#7a8aa8'
              : status === 'unlocked'
              ? '#d4a84a'
              : status === 'discovered'
              ? '#a0a0a0'
              : '#b8923a';

          ctx.fillStyle = bodyColor;
          ctx.strokeStyle = 'rgba(50,40,20,0.6)';
          ctx.lineWidth = 1;

          ctx.beginPath();
          ctx.roundRect(cx - size * 0.8, cy - size * 0.55, size * 1.6, size * 1.1, 2);
          ctx.fill();
          ctx.stroke();

          ctx.strokeStyle = 'rgba(50,40,20,0.4)';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(cx - size * 0.6, cy - size * 0.2);
          ctx.lineTo(cx + size * 0.6, cy - size * 0.2);
          ctx.moveTo(cx - size * 0.6, cy + size * 0.1);
          ctx.lineTo(cx + size * 0.6, cy + size * 0.1);
          ctx.stroke();

          ctx.fillStyle = 'rgba(50,40,20,0.5)';
          ctx.fillRect(cx - size * 0.15, cy - size * 0.1, size * 0.3, size * 0.2);

          if (status === 'sealed') {
            ctx.fillStyle = '#c8a060';
            ctx.beginPath();
            ctx.arc(cx, cy - size * 0.05, size * 0.22, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(50,40,20,0.5)';
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      });

      ripplesRef.current = ripplesRef.current.filter((r) => {
        const elapsed = timestamp - r.startTime;
        if (elapsed > 800) return false;

        const t = elapsed / 800;
        const eased = easeInOutCubic(t);
        const radius = 6 + eased * 45;
        const alpha = 1 - eased;

        const rx = r.x * scale;
        const ry = r.y * scale;

        ctx.strokeStyle = `rgba(255,220,120,${alpha})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(rx, ry, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(255,240,180,${alpha * 0.6})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(rx, ry, radius * 0.6, 0, Math.PI * 2);
        ctx.stroke();

        return true;
      });

      if (isDiscovering) {
        ctx.fillStyle = `rgba(255,220,100,${0.15 + 0.1 * Math.sin(timestamp / 200)})`;
        ctx.fillRect(0, 0, mapDrawW, mapDrawH);
      }

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [viewport, capsules, continentPolygons, pointInPolygon, getLandColor, focusCapsule, isDiscovering]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || !viewport.width || !viewport.height) return;

      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const isMobile = viewport.width < 768;
      const baseScale = Math.min(viewport.width / MAP_WIDTH, viewport.height / MAP_HEIGHT);
      const scale = baseScale * (isMobile ? 0.9 : 1) * zoomRef.current;
      const mapDrawW = MAP_WIDTH * scale;
      const mapDrawH = MAP_HEIGHT * scale;
      const offsetX = (viewport.width - mapDrawW) / 2 + offsetRef.current.x;
      const offsetY = (viewport.height - mapDrawH) / 2 + offsetRef.current.y;

      const mapX = (clickX - offsetX) / scale;
      const mapY = (clickY - offsetY) / scale;

      if (mapX < 0 || mapX > MAP_WIDTH || mapY < 0 || mapY > MAP_HEIGHT) return;

      const latLng = pixelToLatLng(mapX, mapY, MAP_WIDTH, MAP_HEIGHT);
      onClick(latLng, { x: mapX, y: mapY });
    },
    [onClick, viewport.width, viewport.height]
  );

  const hintStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '8px 16px',
    background: 'rgba(93,107,79,0.85)',
    color: '#fafafa',
    fontSize: '0.8rem',
    borderRadius: '8px',
    backdropFilter: 'blur(6px)',
    boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
    zIndex: 10,
    pointerEvents: 'none',
    animation: 'fadeInUp 0.5s ease',
  };

  const legendStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 16,
    right: 16,
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.75)',
    backdropFilter: 'blur(6px)',
    borderRadius: '8px',
    fontSize: '0.72rem',
    color: '#3d3d3d',
    zIndex: 10,
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    lineHeight: 1.8,
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        cursor: isDiscovering ? 'progress' : 'crosshair',
      }}
    >
      <canvas ref={canvasRef} onClick={handleCanvasClick} style={{ display: 'block' }} />

      {!focusCapsule && (
        <div style={hintStyle}>💡 点击地图任意位置埋下你的时间胶囊</div>
      )}

      <div style={legendStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ display: 'inline-block', width: 12, height: 8, background: '#d4a84a', borderRadius: 2 }}></span>
          <span>已解锁</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ display: 'inline-block', width: 12, height: 8, background: '#7a8aa8', borderRadius: 2 }}></span>
          <span>密封中</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ display: 'inline-block', width: 12, height: 8, background: '#a0a0a0', borderRadius: 2 }}></span>
          <span>已被发现</span>
        </div>
      </div>
    </div>
  );
};

export default WorldMap;
