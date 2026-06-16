import { useRef, useEffect, useCallback, useState } from 'react';
import { TrafficSimulation, Intersection, Vehicle } from './simulation';

const GRID_SIZE = 5;
const ROAD_WIDTH = 40;
const INTERSECTION_RADIUS = 15;
const BLOCK_SIZE = 120;

interface MapProps {
  simulation: TrafficSimulation;
}

export default function Map({ simulation }: MapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredIntersection, setHoveredIntersection] = useState<string | null>(null);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(performance.now());
  const pulseRef = useRef(0);

  const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const scale = Math.min(
      (width - 40) / simulation.mapWidth,
      (height - 40) / simulation.mapHeight
    );
    const offsetX = (width - simulation.mapWidth * scale) / 2;
    const offsetY = (height - simulation.mapHeight * scale) / 2;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, simulation.mapWidth, simulation.mapHeight);

    simulation.residentialZones.forEach(zone => {
      ctx.fillStyle = 'rgba(134, 239, 172, 0.6)';
      ctx.beginPath();
      roundRect(ctx, zone.x, zone.y, zone.width, zone.height, 6);
      ctx.fill();
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.8)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    simulation.commercialZones.forEach(zone => {
      ctx.fillStyle = 'rgba(125, 211, 252, 0.6)';
      ctx.beginPath();
      roundRect(ctx, zone.x, zone.y, zone.width, zone.height, 6);
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    ctx.fillStyle = '#555';
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.fillRect(0, i * (BLOCK_SIZE + ROAD_WIDTH), simulation.mapWidth, ROAD_WIDTH);
      ctx.fillRect(i * (BLOCK_SIZE + ROAD_WIDTH), 0, ROAD_WIDTH, simulation.mapHeight);
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.setLineDash([10, 10]);
    for (let i = 0; i <= GRID_SIZE; i++) {
      const y = i * (BLOCK_SIZE + ROAD_WIDTH) + ROAD_WIDTH / 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(simulation.mapWidth, y);
      ctx.stroke();
      const x = i * (BLOCK_SIZE + ROAD_WIDTH) + ROAD_WIDTH / 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, simulation.mapHeight);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    simulation.trees.forEach(tree => {
      ctx.fillStyle = '#166534';
      ctx.beginPath();
      ctx.arc(tree.x, tree.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    simulation.busRoutes.forEach(route => {
      const start = simulation.intersections.find(i => i.id === route.startId);
      const end = simulation.intersections.find(i => i.id === route.endId);
      if (start && end) {
        ctx.strokeStyle = '#FF6B35';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 8]);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    if (simulation.heatmapData.length > 0) {
      drawHeatmap(ctx, simulation);
    }

    simulation.intersections.forEach(inter => {
      drawIntersection(ctx, inter, hoveredIntersection === inter.id, simulation.selectedIntersection === inter.id, pulseRef.current);
    });

    simulation.vehicles.forEach(vehicle => {
      drawVehicle(ctx, vehicle);
    });

    ctx.restore();
  }, [simulation, hoveredIntersection]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const container = canvas.parentElement;
      if (!container) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = (time: number) => {
      const dt = Math.min(0.05, (time - lastTimeRef.current) / 1000);
      lastTimeRef.current = time;
      pulseRef.current = (pulseRef.current + dt) % 1.2;

      simulation.update(dt);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      draw(ctx, canvas.width, canvas.height);

      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [simulation, draw]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(
      (canvas.width - 40) / simulation.mapWidth,
      (canvas.height - 40) / simulation.mapHeight
    );
    const offsetX = (canvas.width - simulation.mapWidth * scale) / 2;
    const offsetY = (canvas.height - simulation.mapHeight * scale) / 2;
    const x = (e.clientX - rect.left - offsetX) / scale;
    const y = (e.clientY - rect.top - offsetY) / scale;

    for (const inter of simulation.intersections) {
      const dx = inter.x - x;
      const dy = inter.y - y;
      if (Math.sqrt(dx * dx + dy * dy) < INTERSECTION_RADIUS + 5) {
        simulation.handleIntersectionClick(inter.id);
        return;
      }
    }
    simulation.selectedIntersection = null;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(
      (canvas.width - 40) / simulation.mapWidth,
      (canvas.height - 40) / simulation.mapHeight
    );
    const offsetX = (canvas.width - simulation.mapWidth * scale) / 2;
    const offsetY = (canvas.height - simulation.mapHeight * scale) / 2;
    const x = (e.clientX - rect.left - offsetX) / scale;
    const y = (e.clientY - rect.top - offsetY) / scale;

    let found: string | null = null;
    for (const inter of simulation.intersections) {
      const dx = inter.x - x;
      const dy = inter.y - y;
      if (Math.sqrt(dx * dx + dy * dy) < INTERSECTION_RADIUS + 5) {
        found = inter.id;
        break;
      }
    }
    setHoveredIntersection(found);
    canvas.style.cursor = found ? 'pointer' : 'default';
  };

  return (
    <div className="map-container">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
      />
    </div>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
}

function drawIntersection(
  ctx: CanvasRenderingContext2D,
  inter: Intersection,
  isHovered: boolean,
  isSelected: boolean,
  pulseTime: number
) {
  const baseColor = inter.congestionLevel;
  const r = Math.floor(200 + baseColor * 20);
  const g = Math.floor(200 - baseColor * 180);
  const b = Math.floor(200 - baseColor * 180);

  if (isSelected || isHovered) {
    ctx.shadowColor = '#00B4D8';
    ctx.shadowBlur = 15;
  }

  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.beginPath();
  ctx.arc(inter.x, inter.y, INTERSECTION_RADIUS * (isHovered ? 1.1 : 1), 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;

  if (isSelected) {
    ctx.strokeStyle = '#00B4D8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(inter.x, inter.y, INTERSECTION_RADIUS + 4, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (inter.congestionLevel > 0.3) {
    const pulseScale = 0.9 + Math.sin(pulseTime * Math.PI * 2 / 1.2) * 0.15;
    ctx.save();
    ctx.translate(inter.x, inter.y - INTERSECTION_RADIUS - 15);
    ctx.scale(pulseScale, pulseScale);
    ctx.fillStyle = `rgba(255, 220, 0, ${0.5 + inter.congestionLevel * 0.5})`;
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', 0, 0);
    ctx.restore();
  }

  ctx.fillStyle = inter.trafficLightMode === 'four-phase' ? '#3498DB' : '#9B59B6';
  ctx.beginPath();
  ctx.arc(inter.x, inter.y, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawVehicle(ctx: CanvasRenderingContext2D, vehicle: Vehicle) {
  ctx.save();
  ctx.translate(vehicle.x, vehicle.y);

  let angle = 0;
  switch (vehicle.direction) {
    case 'right': angle = 0; break;
    case 'down': angle = Math.PI / 2; break;
    case 'left': angle = Math.PI; break;
    case 'up': angle = -Math.PI / 2; break;
  }
  ctx.rotate(angle);

  ctx.globalAlpha = vehicle.isWaiting ? 0.5 : 1;
  ctx.fillStyle = vehicle.color;

  const size = 8;
  ctx.beginPath();
  ctx.moveTo(size, 0);
  ctx.lineTo(-size * 0.6, -size * 0.7);
  ctx.lineTo(-size * 0.6, size * 0.7);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawHeatmap(ctx: CanvasRenderingContext2D, simulation: TrafficSimulation) {
  const gridW = simulation.heatmapData[0]?.length || 20;
  const gridH = simulation.heatmapData.length || 20;
  const cellW = simulation.mapWidth / gridW;
  const cellH = simulation.mapHeight / gridH;

  for (let y = 0; y < gridH; y++) {
    for (let x = 0; x < gridW; x++) {
      const intensity = simulation.heatmapData[y][x];
      if (intensity > 0.05) {
        const hue = 120 - intensity * 120;
        ctx.fillStyle = `hsla(${hue}, 80%, 50%, ${intensity * 0.4})`;
        ctx.fillRect(x * cellW, y * cellH, cellW + 1, cellH + 1);
      }
    }
  }
}
