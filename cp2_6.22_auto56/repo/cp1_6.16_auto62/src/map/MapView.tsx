import React, { useRef, useEffect, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Waypoint, Ripple } from '../types';
import { TerrainGenerator } from './TerrainGenerator';

interface MapViewProps {
  waypoints: Waypoint[];
  selectedWaypointId: string | null;
  highlightedWaypointId: string | null;
  onWaypointAdd: (waypoint: Waypoint) => void;
  onWaypointMove: (id: string, x: number, y: number) => void;
  onWaypointSelect: (id: string | null) => void;
}

const WAYPOINT_RADIUS = 8;

export const MapView: React.FC<MapViewProps> = ({
  waypoints,
  selectedWaypointId,
  highlightedWaypointId,
  onWaypointAdd,
  onWaypointMove,
  onWaypointSelect,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const terrainGeneratorRef = useRef<TerrainGenerator | null>(null);
  const ripplesRef = useRef<Ripple[]>([]);
  const draggingRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const animationFrameRef = useRef<number>(0);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const padding = 40;
        const width = Math.max(600, rect.width - padding);
        const height = Math.max(450, rect.height - padding);
        setCanvasSize({ width, height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    terrainGeneratorRef.current = new TerrainGenerator(canvasSize.width, canvasSize.height);
  }, [canvasSize]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas || !terrainGeneratorRef.current) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    terrainGeneratorRef.current.drawTerrain(ctx);
    terrainGeneratorRef.current.drawScale(ctx);

    if (waypoints.length > 1) {
      ctx.strokeStyle = 'rgba(255, 87, 34, 0.4)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      waypoints.forEach((wp, index) => {
        if (index === 0) {
          ctx.moveTo(wp.x, wp.y);
        } else {
          ctx.lineTo(wp.x, wp.y);
        }
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    waypoints.forEach((wp) => {
      const isSelected = wp.id === selectedWaypointId;
      const isHighlighted = wp.id === highlightedWaypointId;
      const hasRecords = wp.records.length > 0;

      if (isHighlighted) {
        ctx.beginPath();
        ctx.arc(wp.x, wp.y, WAYPOINT_RADIUS + 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(46, 107, 46, 0.3)';
        ctx.fill();
      }

      if (isSelected) {
        ctx.beginPath();
        ctx.arc(wp.x, wp.y, WAYPOINT_RADIUS + 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 87, 34, 0.3)';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(wp.x, wp.y, WAYPOINT_RADIUS, 0, Math.PI * 2);

      if (hasRecords) {
        ctx.fillStyle = '#2E6B2E';
      } else {
        ctx.fillStyle = '#9E9E9E';
      }
      ctx.fill();

      ctx.strokeStyle = '#FF5722';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(wp.x, wp.y, WAYPOINT_RADIUS - 3, 0, Math.PI * 2);
      ctx.fillStyle = '#FF5722';
      ctx.fill();

      ctx.fillStyle = '#FF5722';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(wp.elevation)}m`, wp.x, wp.y - WAYPOINT_RADIUS - 6);
    });

    const currentTime = performance.now();
    ripplesRef.current = ripplesRef.current.filter((ripple) => {
      const elapsed = (currentTime - ripple.startTime) / 1000;
      if (elapsed > 0.5) return false;

      const progress = elapsed / 0.5;
      const radius = progress * 40;
      const alpha = 1 - progress;

      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 3;
      ctx.stroke();

      return true;
    });
  }, [waypoints, selectedWaypointId, highlightedWaypointId]);

  useEffect(() => {
    const animate = () => {
      draw();
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [draw]);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const findWaypointAt = (x: number, y: number): Waypoint | null => {
    for (let i = waypoints.length - 1; i >= 0; i--) {
      const wp = waypoints[i];
      const dist = Math.sqrt((x - wp.x) ** 2 + (y - wp.y) ** 2);
      if (dist <= WAYPOINT_RADIUS + 5) {
        return wp;
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoordinates(e);
    const waypoint = findWaypointAt(x, y);

    if (waypoint) {
      draggingRef.current = {
        id: waypoint.id,
        offsetX: x - waypoint.x,
        offsetY: y - waypoint.y,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current) return;

    const { x, y } = getCanvasCoordinates(e);
    const newX = Math.max(WAYPOINT_RADIUS, Math.min(canvasSize.width - WAYPOINT_RADIUS, x - draggingRef.current.offsetX));
    const newY = Math.max(WAYPOINT_RADIUS, Math.min(canvasSize.height - WAYPOINT_RADIUS, y - draggingRef.current.offsetY));

    onWaypointMove(draggingRef.current.id, newX, newY);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggingRef.current) {
      draggingRef.current = null;
      return;
    }

    const { x, y } = getCanvasCoordinates(e);
    const waypoint = findWaypointAt(x, y);

    ripplesRef.current.push({
      id: uuidv4(),
      x,
      y,
      startTime: performance.now(),
    });

    if (waypoint) {
      onWaypointSelect(waypoint.id === selectedWaypointId ? null : waypoint.id);
    } else {
      const elevation = terrainGeneratorRef.current?.getElevation(x, y) ?? Math.random() * 2000;
      const newWaypoint: Waypoint = {
        id: uuidv4(),
        x,
        y,
        elevation: Math.round(elevation),
        records: [],
        createdAt: Date.now(),
      };
      onWaypointAdd(newWaypoint);
      onWaypointSelect(newWaypoint.id);
    }
  };

  const handleMouseLeave = () => {
    draggingRef.current = null;
  };

  return (
    <div ref={containerRef} className="map-container">
      <div className="map-hint">点击地图添加途经点，拖拽调整位置</div>
      <div className="map-canvas-wrapper">
        <canvas
          ref={canvasRef}
          className="map-canvas"
          width={canvasSize.width}
          height={canvasSize.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />
      </div>
    </div>
  );
};
