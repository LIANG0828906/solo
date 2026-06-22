import React, { useRef, useEffect, useCallback } from 'react';
import type { Building } from '../utils/buildingData';
import { MATERIAL_COLORS } from '../utils/buildingData';
import {
  projectToIso,
  isoToWorld,
  calculateSunPosition,
  calculateShadowPolygon,
  calculateBuildingHighlights,
  getBuildingCorners,
  formatTime,
  toDegrees,
  ISO_SCALE,
} from '../utils/shadowCalculator';
import type {
  ShadowPolygon,
  HighlightArea,
  Point2D,
  Point3D,
} from '../utils/shadowCalculator';

interface SkylineCanvasProps {
  buildings: Building[];
  timeMinutes: number;
  selectedBuildingId: string | null;
  onCanvasClick: (worldX: number, worldZ: number) => void;
  onSelectBuilding: (id: string | null) => void;
  canvasWidth?: number;
  canvasHeight?: number;
}

const GRID_SIZE = 0.5;
const GRID_RANGE = 6;

const SkylineCanvas: React.FC<SkylineCanvasProps> = ({
  buildings,
  timeMinutes,
  selectedBuildingId,
  onCanvasClick,
  onSelectBuilding,
  canvasWidth = 900,
  canvasHeight = 650,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const buildingsRef = useRef(buildings);
  const timeRef = useRef(timeMinutes);
  const selectedRef = useRef(selectedBuildingId);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    buildingsRef.current = buildings;
  }, [buildings]);

  useEffect(() => {
    timeRef.current = timeMinutes;
  }, [timeMinutes]);

  useEffect(() => {
    selectedRef.current = selectedBuildingId;
  }, [selectedBuildingId]);

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 0.5;

    const range = GRID_RANGE;
    for (let i = -range; i <= range; i += GRID_SIZE) {
      const start1 = projectToIso({ x: i, y: 0, z: -range });
      const end1 = projectToIso({ x: i, y: 0, z: range });
      ctx.beginPath();
      ctx.moveTo(start1.x, start1.y);
      ctx.lineTo(end1.x, end1.y);
      ctx.stroke();

      const start2 = projectToIso({ x: -range, y: 0, z: i });
      const end2 = projectToIso({ x: range, y: 0, z: i });
      ctx.beginPath();
      ctx.moveTo(start2.x, start2.y);
      ctx.lineTo(end2.x, end2.y);
      ctx.stroke();
    }
  }, []);

  const drawShadow = useCallback((ctx: CanvasRenderingContext2D, shadow: ShadowPolygon) => {
    if (shadow.points.length < 3) return;
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.33)';
    ctx.globalCompositeOperation = 'multiply';
    ctx.beginPath();
    ctx.moveTo(shadow.points[0].x, shadow.points[0].y);
    for (let i = 1; i < shadow.points.length; i++) {
      ctx.lineTo(shadow.points[i].x, shadow.points[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }, []);

  const shadeColor = (hex: string, factor: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const nr = Math.max(0, Math.min(255, Math.round(r * factor)));
    const ng = Math.max(0, Math.min(255, Math.round(g * factor)));
    const nb = Math.max(0, Math.min(255, Math.round(b * factor)));
    return `rgb(${nr}, ${ng}, ${nb})`;
  };

  const drawBuilding = useCallback(
    (ctx: CanvasRenderingContext2D, building: Building, isSelected: boolean) => {
      const { base, top } = getBuildingCorners(building);
      const color = MATERIAL_COLORS[building.material];

      const isoBase = base.map((p) => projectToIso(p));
      const isoTop = top.map((p) => projectToIso(p));

      const leftFace = [isoBase[0], isoBase[3], isoTop[3], isoTop[0]];
      const rightFace = [isoBase[3], isoBase[2], isoTop[2], isoTop[3]];
      const frontFace = [isoBase[0], isoBase[1], isoTop[1], isoTop[0]];

      const drawFace = (pts: Point2D[], shade: number) => {
        ctx.fillStyle = shadeColor(color, shade);
        ctx.strokeStyle = shadeColor(color, shade * 0.7);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      };

      drawFace(leftFace, 0.7);
      drawFace(rightFace, 0.85);
      drawFace(frontFace, 1.0);

      ctx.fillStyle = shadeColor(color, 1.15);
      ctx.strokeStyle = shadeColor(color, 0.8);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(isoTop[0].x, isoTop[0].y);
      for (let i = 1; i < isoTop.length; i++) {
        ctx.lineTo(isoTop[i].x, isoTop[i].y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if (building.material === 'glass') {
        ctx.save();
        ctx.globalAlpha = 0.3;
        drawFace(leftFace, 1.3);
        drawFace(frontFace, 1.2);
        ctx.restore();
      }

      if (isSelected) {
        ctx.save();
        ctx.strokeStyle = '#00BFFF';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#00BFFF';
        ctx.shadowBlur = 8;
        const allPts = [...isoBase, ...isoTop];
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        allPts.forEach((p) => {
          minX = Math.min(minX, p.x);
          maxX = Math.max(maxX, p.x);
          minY = Math.min(minY, p.y);
          maxY = Math.max(maxY, p.y);
        });
        const pad = 4;
        ctx.strokeRect(minX - pad, minY - pad, maxX - minX + pad * 2, maxY - minY + pad * 2);
        ctx.restore();
      }
    },
    [],
  );

  const drawHighlight = useCallback((ctx: CanvasRenderingContext2D, hl: HighlightArea) => {
    ctx.save();
    if (hl.type === 'glass') {
      const gradient = ctx.createLinearGradient(
        hl.position.x - hl.size.w / 2,
        hl.position.y - hl.size.h / 2,
        hl.position.x + hl.size.w / 2,
        hl.position.y + hl.size.h / 2,
      );
      gradient.addColorStop(0, `rgba(180, 230, 255, ${hl.opacity})`);
      gradient.addColorStop(0.5, `rgba(255, 255, 255, ${hl.opacity * 0.9})`);
      gradient.addColorStop(1, `rgba(200, 240, 255, ${hl.opacity * 0.7})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(
        hl.position.x - hl.size.w / 2,
        hl.position.y - hl.size.h / 2,
        hl.size.w,
        hl.size.h,
      );
    } else if (hl.type === 'metal') {
      const r = Math.max(hl.size.w, hl.size.h) / 2;
      const gradient = ctx.createRadialGradient(
        hl.position.x,
        hl.position.y,
        0,
        hl.position.x,
        hl.position.y,
        r,
      );
      gradient.addColorStop(0, `rgba(255, 255, 255, ${hl.opacity})`);
      gradient.addColorStop(0.4, `rgba(220, 235, 255, ${hl.opacity * 0.6})`);
      gradient.addColorStop(1, 'rgba(200, 220, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(hl.position.x, hl.position.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }, []);

  const drawHUD = useCallback(
    (ctx: CanvasRenderingContext2D, time: number) => {
      const sun = calculateSunPosition(time);
      ctx.save();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px Consolas, monospace';
      ctx.textBaseline = 'top';
      ctx.fillText(`时间: ${formatTime(time)}`, 16, 16);
      ctx.font = '13px Consolas, monospace';
      ctx.fillStyle = '#AAAAAA';
      ctx.fillText(
        `太阳仰角: ${toDegrees(sun.elevation).toFixed(1)}°`,
        16,
        40,
      );
      ctx.fillText(
        `太阳方位: ${toDegrees(sun.azimuth).toFixed(1)}°`,
        16,
        58,
      );
      ctx.restore();
    },
    [],
  );

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#1E1E2E';
    ctx.fillRect(0, 0, w, h);

    drawGrid(ctx);

    const sun = calculateSunPosition(timeRef.current);
    const shadows: ShadowPolygon[] = [];
    const allHighlights: HighlightArea[] = [];

    for (const b of buildingsRef.current) {
      const shadow = calculateShadowPolygon(b, sun);
      if (shadow) shadows.push(shadow);
      const highlights = calculateBuildingHighlights(b, sun);
      allHighlights.push(...highlights);
    }

    shadows.forEach((s) => drawShadow(ctx, s));

    const sortedBuildings = [...buildingsRef.current].sort(
      (a, b) => a.x + a.z - (b.x + b.z),
    );
    sortedBuildings.forEach((b) => {
      drawBuilding(ctx, b, b.id === selectedRef.current);
    });

    allHighlights.forEach((hl) => drawHighlight(ctx, hl));

    drawHUD(ctx, timeRef.current);

    animFrameRef.current = requestAnimationFrame(render);
  }, [drawGrid, drawShadow, drawBuilding, drawHighlight, drawHUD]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [render]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const sx = (e.clientX - rect.left) * scaleX;
    const sy = (e.clientY - rect.top) * scaleY;

    const world = isoToWorld(sx, sy);
    const wx = world.x;
    const wz = world.y;

    let clickedBuilding: Building | null = null;
    for (const b of buildingsRef.current) {
      const hw = b.width / 2 + 0.1;
      const hd = b.depth / 2 + 0.1;
      if (wx >= b.x - hw && wx <= b.x + hw && wz >= b.z - hd && wz <= b.z + hd) {
        if (!clickedBuilding || b.x + b.z > clickedBuilding.x + clickedBuilding.z) {
          clickedBuilding = b;
        }
      }
    }

    if (clickedBuilding) {
      onSelectBuilding(clickedBuilding.id);
    } else {
      const gridRange = GRID_RANGE - 0.5;
      if (Math.abs(wx) <= gridRange && Math.abs(wz) <= gridRange) {
        const snappedX = Math.round(wx / GRID_SIZE) * GRID_SIZE;
        const snappedZ = Math.round(wz / GRID_SIZE) * GRID_SIZE;
        onSelectBuilding(null);
        onCanvasClick(snappedX, snappedZ);
      } else {
        onSelectBuilding(null);
      }
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      onClick={handleClick}
      style={{
        display: 'block',
        borderRadius: '8px',
        cursor: 'crosshair',
        backgroundColor: '#1E1E2E',
      }}
    />
  );
};

export default SkylineCanvas;
