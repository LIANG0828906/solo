import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Booth, Point } from '@/types';
import { greedyRoute } from '@/utils/route';

interface HeatmapCanvasProps {
  booths: Booth[];
  entrance: Point;
  width?: number;
  height?: number;
  onBoothClick?: (booth: Booth) => void;
  selectedBoothIds?: string[];
  showRoute?: boolean;
  routeBoothIds?: string[];
}

const HeatmapCanvas: React.FC<HeatmapCanvasProps> = ({
  booths,
  entrance,
  width = 600,
  height = 500,
  onBoothClick,
  selectedBoothIds = [],
  showRoute = false,
  routeBoothIds = [],
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredBooth, setHoveredBooth] = useState<Booth | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width, height });
  const animationRef = useRef<number>();

  const approvedBooths = booths.filter(b => b.status === 'approved');

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({
          width: rect.width,
          height: Math.max(400, Math.min(600, rect.width * 0.75)),
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const getHeatColor = useCallback((heat: number): string => {
    const normalized = Math.min(1, Math.max(0, heat / 100));
    const r = Math.round(normalized * 200 + 55);
    const g = Math.round((1 - normalized) * 180 + 40);
    const b = 50;
    return `rgb(${r}, ${g}, ${b})`;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width: w, height: h } = canvasSize;
    const scaleX = w / 600;
    const scaleY = h / 500;

    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#FFF8E1';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(216, 67, 21, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < w; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, h);
      ctx.stroke();
    }
    for (let i = 0; i < h; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(w, i);
      ctx.stroke();
    }

    ctx.fillStyle = '#8D6E63';
    ctx.fillRect(entrance.x * scaleX - 15, entrance.y * scaleY - 20, 30, 40);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('入口', entrance.x * scaleX, entrance.y * scaleY + 4);

    approvedBooths.forEach(booth => {
      const x = booth.x * scaleX;
      const y = booth.y * scaleY;
      const baseRadius = booth.size === 'large' ? 24 : booth.size === 'medium' ? 18 : 14;
      const radius = baseRadius * (booth.heat / 100 + 0.5);

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 1.5);
      gradient.addColorStop(0, getHeatColor(booth.heat));
      gradient.addColorStop(0.6, getHeatColor(booth.heat) + '80');
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2);
      ctx.fill();
    });

    approvedBooths.forEach(booth => {
      const x = booth.x * scaleX;
      const y = booth.y * scaleY;
      const baseRadius = booth.size === 'large' ? 14 : booth.size === 'medium' ? 11 : 8;
      const radius = baseRadius * (booth.heat / 100 + 0.5);

      if (selectedBoothIds.includes(booth.id)) {
        ctx.strokeStyle = '#FF7043';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, radius + 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = getHeatColor(booth.heat);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(62, 39, 35, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    if (showRoute && routeBoothIds.length > 0) {
      const routeBooths = routeBoothIds
        .map(id => approvedBooths.find(b => b.id === id))
        .filter((b): b is Booth => b !== undefined);

      const routePoints = routeBooths.map(b => ({ x: b.x, y: b.y }));
      const route = greedyRoute(entrance, routePoints);

      if (route.length > 1) {
        for (let i = 0; i < route.length - 1; i++) {
          const p1 = route[i];
          const p2 = route[i + 1];
          const gradient = ctx.createLinearGradient(
            p1.x * scaleX, p1.y * scaleY,
            p2.x * scaleX, p2.y * scaleY
          );
          gradient.addColorStop(0, `hsl(${30 + i * 10}, 100%, 60%)`);
          gradient.addColorStop(1, `hsl(${30 + (i + 1) * 10}, 100%, 50%)`);

          ctx.strokeStyle = gradient;
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(p1.x * scaleX, p1.y * scaleY);
          ctx.lineTo(p2.x * scaleX, p2.y * scaleY);
          ctx.stroke();
        }

        route.forEach((point, index) => {
          if (index === 0) return;
          const x = point.x * scaleX;
          const y = point.y * scaleY;

          ctx.fillStyle = '#FF7043';
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fff';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(index), x, y);
        });
      }
    }

    animationRef.current = requestAnimationFrame(draw);
  }, [approvedBooths, entrance, canvasSize, getHeatColor, selectedBoothIds, showRoute, routeBoothIds]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(draw);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [draw]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const scaleX = canvasSize.width / 600;
      const scaleY = canvasSize.height / 500;

      setMousePos({ x: e.clientX, y: e.clientY });

      let found: Booth | null = null;
      for (const booth of approvedBooths) {
        const bx = booth.x * scaleX;
        const by = booth.y * scaleY;
        const baseRadius = booth.size === 'large' ? 14 : booth.size === 'medium' ? 11 : 8;
        const radius = baseRadius * (booth.heat / 100 + 0.5);

        const dist = Math.sqrt((x - bx) ** 2 + (y - by) ** 2);
        if (dist <= radius + 5) {
          found = booth;
          break;
        }
      }

      setHoveredBooth(found);
    },
    [approvedBooths, canvasSize]
  );

  const handleClick = useCallback(() => {
    if (hoveredBooth && onBoothClick) {
      onBoothClick(hoveredBooth);
    }
  }, [hoveredBooth, onBoothClick]);

  return (
    <div ref={containerRef} style={styles.container}>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={styles.canvas}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      />
      
      {hoveredBooth && (
        <div
          style={{
            ...styles.tooltip,
            left: mousePos.x + 15,
            top: mousePos.y - 10,
          }}
        >
          <div style={styles.tooltipTitle}>{hoveredBooth.name}</div>
          <div style={styles.tooltipType}>{hoveredBooth.type}</div>
          <div style={styles.tooltipHeat}>
            热度: {'🔥'.repeat(Math.ceil(hoveredBooth.heat / 25))}
            <span style={styles.heatNum}>({Math.round(hoveredBooth.heat)})</span>
          </div>
        </div>
      )}

      <div style={styles.legend}>
        <div style={styles.legendTitle}>热度图例</div>
        <div style={styles.legendBar}>
          <div style={{ ...styles.legendItem, background: getHeatColor(10) }} />
          <div style={{ ...styles.legendItem, background: getHeatColor(35) }} />
          <div style={{ ...styles.legendItem, background: getHeatColor(60) }} />
          <div style={{ ...styles.legendItem, background: getHeatColor(85) }} />
          <div style={{ ...styles.legendItem, background: getHeatColor(100) }} />
        </div>
        <div style={styles.legendLabels}>
          <span>低</span>
          <span>高</span>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    width: '100%',
    borderRadius: 'var(--radius)',
    overflow: 'hidden',
    border: '2px solid var(--border-color)',
    backgroundColor: '#FFF8E1',
  },
  canvas: {
    display: 'block',
    width: '100%',
    height: 'auto',
    cursor: 'pointer',
  },
  tooltip: {
    position: 'fixed',
    zIndex: 1000,
    padding: '12px 16px',
    backgroundColor: 'rgba(62, 39, 35, 0.95)',
    color: 'white',
    borderRadius: '10px',
    fontSize: '13px',
    pointerEvents: 'none',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    minWidth: '150px',
  },
  tooltipTitle: {
    fontWeight: 600,
    fontSize: '14px',
    marginBottom: '4px',
  },
  tooltipType: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: '6px',
  },
  tooltipHeat: {
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  heatNum: {
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: '4px',
  },
  legend: {
    position: 'absolute',
    bottom: '16px',
    right: '16px',
    padding: '10px 14px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  legendTitle: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '6px',
  },
  legendBar: {
    display: 'flex',
    gap: '2px',
    marginBottom: '4px',
  },
  legendItem: {
    width: '24px',
    height: '12px',
    borderRadius: '2px',
  },
  legendLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '10px',
    color: 'var(--text-secondary)',
  },
};

export default HeatmapCanvas;
