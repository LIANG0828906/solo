import React, { useRef, useEffect, useCallback } from 'react';
import {
  Building,
  SunState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GROUND_Y,
  GRID_SIZE,
  SUN_RADIUS,
  SUN_ARC_CENTER_X,
  SUN_ARC_CENTER_Y,
  SUN_ARC_RADIUS,
} from './types';

interface LightSimulatorProps {
  buildings: Building[];
  sun: SunState;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isDragging: boolean;
  hoveredBuildingId: string | null;
  hoveredElement: string | null;
  snapLineX: number | null;
  snapLineY: number | null;
}

const LightSimulator: React.FC<LightSimulatorProps> = ({
  buildings,
  sun,
  canvasRef,
  isDragging,
  hoveredBuildingId,
  hoveredElement,
  snapLineX,
  snapLineY,
}) => {
  const animationRef = useRef<number>();

  const snapToGrid = useCallback((value: number): number => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  }, []);

  const getSkyGradient = useCallback(
    (ctx: CanvasRenderingContext2D, sunAngle: number) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      const normalizedAngle = (sunAngle + 30) / 60;

      const topR = Math.round(10 + (1 - normalizedAngle) * 20);
      const topG = Math.round(20 + (1 - normalizedAngle) * 30);
      const topB = Math.round(40 + (1 - normalizedAngle) * 60);

      const bottomR = Math.round(255 - normalizedAngle * 100);
      const bottomG = Math.round(180 - normalizedAngle * 80);
      const bottomB = Math.round(120 - normalizedAngle * 40);

      gradient.addColorStop(0, `rgb(${topR}, ${topG}, ${topB})`);
      gradient.addColorStop(0.6, `rgb(${Math.round((topR + bottomR) / 2)}, ${Math.round((topG + bottomG) / 2)}, ${Math.round((topB + bottomB) / 2)})`);
      gradient.addColorStop(1, `rgb(${bottomR}, ${bottomG}, ${bottomB})`);

      return gradient;
    },
    []
  );

  const drawSky = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = getSkyGradient(ctx, sun.angle);
      ctx.fillRect(0, 0, CANVAS_WIDTH, GROUND_Y);
    },
    [getSkyGradient, sun.angle]
  );

  const drawAxes = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(40, 20);
    ctx.lineTo(40, GROUND_Y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(40, GROUND_Y);
    ctx.lineTo(CANVAS_WIDTH - 20, GROUND_Y);
    ctx.stroke();

    ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
    ctx.font = '10px monospace';

    for (let y = GROUND_Y; y >= 50; y -= 50) {
      const height = GROUND_Y - y;
      ctx.fillText(`${height}`, 15, y + 3);
      ctx.beginPath();
      ctx.moveTo(35, y);
      ctx.lineTo(40, y);
      ctx.stroke();
    }

    for (let x = 100; x < CANVAS_WIDTH - 20; x += 100) {
      ctx.fillText(`${x - 40}`, x - 10, GROUND_Y + 15);
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y);
      ctx.lineTo(x, GROUND_Y + 5);
      ctx.stroke();
    }
  }, []);

  const drawGround = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#2a2a2e';
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

    ctx.strokeStyle = '#4a4a4e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
    ctx.stroke();

    const glowGradient = ctx.createRadialGradient(
      CANVAS_WIDTH / 2,
      GROUND_Y + 25,
      0,
      CANVAS_WIDTH / 2,
      GROUND_Y + 25,
      300
    );
    glowGradient.addColorStop(0, 'rgba(100, 150, 200, 0.15)');
    glowGradient.addColorStop(1, 'rgba(100, 150, 200, 0)');
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 50);
  }, []);

  const calculateShadowPoints = useCallback(
    (building: Building): { x: number; y: number }[] | null => {
      const sunHeightAngle = (90 - Math.abs(sun.angle)) * (Math.PI / 180);
      const sunDirectionAngle = sun.angle * (Math.PI / 180);

      if (Math.abs(sun.angle) < 2) {
        return null;
      }

      const shadowLength = building.height / Math.tan(sunHeightAngle);
      const shadowOffsetX = Math.tan(sunDirectionAngle) * building.height;

      const topLeft = { x: building.x, y: building.y };
      const topRight = { x: building.x + building.width, y: building.y };

      const shadowTopLeft = {
        x: snapToGrid(topLeft.x + shadowOffsetX),
        y: GROUND_Y,
      };
      const shadowTopRight = {
        x: snapToGrid(topRight.x + shadowOffsetX),
        y: GROUND_Y,
      };
      const shadowBottomLeft = {
        x: snapToGrid(topLeft.x + shadowOffsetX + shadowLength * Math.sign(sun.angle)),
        y: GROUND_Y,
      };
      const shadowBottomRight = {
        x: snapToGrid(topRight.x + shadowOffsetX + shadowLength * Math.sign(sun.angle)),
        y: GROUND_Y,
      };

      return [shadowTopLeft, shadowTopRight, shadowBottomRight, shadowBottomLeft];
    },
    [sun.angle, snapToGrid]
  );

  const drawShadows = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      buildings.forEach((building) => {
        const shadowPoints = calculateShadowPoints(building);
        if (!shadowPoints) return;

        ctx.beginPath();
        ctx.moveTo(building.x, building.y);
        ctx.lineTo(building.x + building.width, building.y);
        ctx.lineTo(shadowPoints[2].x, shadowPoints[2].y);
        ctx.lineTo(shadowPoints[3].x, shadowPoints[3].y);
        ctx.closePath();

        ctx.fillStyle = 'rgba(30, 30, 35, 0.3)';
        ctx.fill();
      });
    },
    [buildings, calculateShadowPoints]
  );

  const drawSun = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const isHovered = hoveredElement === 'sun';
      const isDraggingSun = isDragging && hoveredElement === 'sun';

      if (isHovered || isDraggingSun) {
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 15;
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sun.x, sun.y, SUN_RADIUS + 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      const sunGradient = ctx.createRadialGradient(
        sun.x,
        sun.y,
        0,
        sun.x,
        sun.y,
        SUN_RADIUS
      );
      sunGradient.addColorStop(0, '#fff7a0');
      sunGradient.addColorStop(0.5, '#ffdd00');
      sunGradient.addColorStop(1, '#ffaa00');

      ctx.beginPath();
      ctx.arc(sun.x, sun.y, SUN_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = sunGradient;
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 220, 0, 0.6)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const innerR = SUN_RADIUS + 3;
        const outerR = SUN_RADIUS + 12;
        ctx.beginPath();
        ctx.moveTo(
          sun.x + Math.cos(angle) * innerR,
          sun.y + Math.sin(angle) * innerR
        );
        ctx.lineTo(
          sun.x + Math.cos(angle) * outerR,
          sun.y + Math.sin(angle) * outerR
        );
        ctx.stroke();
      }
    },
    [sun, hoveredElement, isDragging]
  );

  const drawSunArc = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = 'rgba(255, 200, 0, 0.15)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(
      SUN_ARC_CENTER_X,
      SUN_ARC_CENTER_Y,
      SUN_ARC_RADIUS,
      Math.PI + (30 * Math.PI) / 180,
      -30 * (Math.PI / 180)
    );
    ctx.stroke();
    ctx.setLineDash([]);
  }, []);

  const drawSnapLines = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (snapLineX !== null) {
        ctx.strokeStyle = 'rgba(100, 180, 255, 0.7)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(snapLineX, 0);
        ctx.lineTo(snapLineX, GROUND_Y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      if (snapLineY !== null) {
        ctx.strokeStyle = 'rgba(100, 180, 255, 0.7)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, snapLineY);
        ctx.lineTo(CANVAS_WIDTH, snapLineY);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    },
    [snapLineX, snapLineY]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const startTime = performance.now();

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    drawSky(ctx);
    drawSunArc(ctx);
    drawGround(ctx);
    drawAxes(ctx);
    drawShadows(ctx);

    buildings.forEach((building) => {
      const isHovered = hoveredBuildingId === building.id;

      const sunFactor = Math.sin((sun.angle * Math.PI) / 180);
      const brightnessShift = sunFactor * 0.2;

      const baseLightness = 45;
      const litLightness = Math.min(70, baseLightness + brightnessShift * 30);
      const darkLightness = Math.max(25, baseLightness - brightnessShift * 30);

      const litColor = `hsl(220, 10%, ${litLightness}%)`;
      const darkColor = `hsl(220, 10%, ${darkLightness}%)`;

      ctx.fillStyle = 'rgba(80, 85, 95, 0.7)';
      ctx.fillRect(building.x, building.y, building.width, building.height);

      if (sun.angle > 0) {
        const litWidth = building.width * 0.4;
        const gradient = ctx.createLinearGradient(
          building.x + building.width - litWidth,
          0,
          building.x + building.width,
          0
        );
        gradient.addColorStop(0, 'rgba(80, 85, 95, 0.7)');
        gradient.addColorStop(1, litColor);
        ctx.fillStyle = gradient;
        ctx.fillRect(
          building.x + building.width - litWidth,
          building.y,
          litWidth,
          building.height
        );

        const darkWidth = building.width * 0.3;
        const darkGradient = ctx.createLinearGradient(
          building.x,
          0,
          building.x + darkWidth,
          0
        );
        darkGradient.addColorStop(0, darkColor);
        darkGradient.addColorStop(1, 'rgba(80, 85, 95, 0.7)');
        ctx.fillStyle = darkGradient;
        ctx.fillRect(building.x, building.y, darkWidth, building.height);
      } else if (sun.angle < 0) {
        const litWidth = building.width * 0.4;
        const gradient = ctx.createLinearGradient(
          building.x,
          0,
          building.x + litWidth,
          0
        );
        gradient.addColorStop(0, litColor);
        gradient.addColorStop(1, 'rgba(80, 85, 95, 0.7)');
        ctx.fillStyle = gradient;
        ctx.fillRect(building.x, building.y, litWidth, building.height);

        const darkWidth = building.width * 0.3;
        const darkGradient = ctx.createLinearGradient(
          building.x + building.width - darkWidth,
          0,
          building.x + building.width,
          0
        );
        darkGradient.addColorStop(0, 'rgba(80, 85, 95, 0.7)');
        darkGradient.addColorStop(1, darkColor);
        ctx.fillStyle = darkGradient;
        ctx.fillRect(
          building.x + building.width - darkWidth,
          building.y,
          darkWidth,
          building.height
        );
      }

      ctx.strokeStyle = '#2a2a2e';
      ctx.lineWidth = 2;
      ctx.strokeRect(building.x, building.y, building.width, building.height);

      ctx.strokeStyle = 'rgba(200, 205, 215, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(building.x + 2, building.y + 2);
      ctx.lineTo(building.x + building.width - 2, building.y + 2);
      ctx.stroke();

      if (isHovered && !isDragging) {
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 8;
        ctx.strokeRect(building.x - 1, building.y - 1, building.width + 2, building.height + 2);
        ctx.shadowBlur = 0;
      }
    });

    drawSun(ctx);
    drawSnapLines(ctx);

    const endTime = performance.now();
    if (endTime - startTime > 20) {
      console.warn(`Shadow calculation took ${endTime - startTime}ms`);
    }
  }, [
    canvasRef,
    buildings,
    sun,
    hoveredBuildingId,
    isDragging,
    drawSky,
    drawSunArc,
    drawGround,
    drawAxes,
    drawShadows,
    drawSun,
    drawSnapLines,
  ]);

  useEffect(() => {
    let lastTime = 0;
    const animate = (time: number) => {
      if (time - lastTime >= 16) {
        draw();
        lastTime = time;
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [draw]);

  return null;
};

export default LightSimulator;
