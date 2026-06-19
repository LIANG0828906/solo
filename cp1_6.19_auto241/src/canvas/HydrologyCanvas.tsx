import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Particle,
  TerrainMap,
  TerrainType,
  ViewMode,
  TERRAIN_CONFIG,
  HEIGHTMAP_COLORS,
  VECTOR_COLORS,
  PARTICLE_CONFIG,
} from '../types';
import {
  updateParticlePhysics,
  generateRainParticles,
  initializeTerrain,
  drawTerrain,
  lerpColor,
  calculateSlope,
} from '../utils/physics';
import { useSimulationStore } from '../store';

const GRID_SIZE = 10;
const BRUSH_SIZE = 30;

const HydrologyCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const terrainRef = useRef<TerrainMap>([]);
  const animationRef = useRef<number>(0);
  const particleIdRef = useRef<number>(0);
  const isDrawingRef = useRef<boolean>(false);
  const selectedTerrainRef = useRef<TerrainType>('plain');
  const lastTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const statsRef = useRef({ evaporated: 0, infiltrated: 0 });

  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [showLegend, setShowLegend] = useState(false);

  const {
    permeability,
    evaporationRate,
    rainfallIntensity,
    isRaining,
    viewMode,
    setIsRaining,
    updateStats,
    setViewMode,
    totalRainfall,
  } = useSimulationStore();

  const viewModeRef = useRef(viewMode);
  const permeabilityRef = useRef(permeability);
  const evaporationRateRef = useRef(evaporationRate);
  const rainfallIntensityRef = useRef(rainfallIntensity);
  const isRainingRef = useRef(isRaining);

  useEffect(() => { viewModeRef.current = viewMode; }, [viewMode]);
  useEffect(() => { permeabilityRef.current = permeability; }, [permeability]);
  useEffect(() => { evaporationRateRef.current = evaporationRate; }, [evaporationRate]);
  useEffect(() => { rainfallIntensityRef.current = rainfallIntensity; }, [rainfallIntensity]);
  useEffect(() => { isRainingRef.current = isRaining; }, [isRaining]);

  useEffect(() => {
    const handleTerrainSelected = (e: CustomEvent) => {
      selectedTerrainRef.current = e.detail;
    };
    window.addEventListener('terrainSelected', handleTerrainSelected as EventListener);
    return () => window.removeEventListener('terrainSelected', handleTerrainSelected as EventListener);
  }, []);

  const handleResize = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setCanvasSize({
      width: Math.floor(rect.width),
      height: Math.floor(rect.height),
    });
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  useEffect(() => {
    terrainRef.current = initializeTerrain(canvasSize.width, canvasSize.height);
    particlesRef.current = [];
    particleIdRef.current = 0;
    statsRef.current = { evaporated: 0, infiltrated: 0 };
  }, [canvasSize]);

  useEffect(() => {
    if (isRaining && particlesRef.current.length < PARTICLE_CONFIG.maxParticles) {
      const count = Math.floor(50 + rainfallIntensity * 20);
      const actualCount = Math.min(count, PARTICLE_CONFIG.maxParticles - particlesRef.current.length);
      const newParticles = generateRainParticles(
        particleIdRef.current,
        actualCount,
        canvasSize.width,
        performance.now()
      );
      particleIdRef.current += actualCount;
      particlesRef.current.push(...newParticles);
      updateStats({
        totalRainfall: totalRainfall + actualCount,
        activeParticles: particlesRef.current.length,
      });
      setIsRaining(false);
    }
  }, [isRaining, rainfallIntensity, canvasSize.width, setIsRaining, updateStats, totalRainfall]);

  const renderTerrain = useCallback((ctx: CanvasRenderingContext2D) => {
    const terrain = terrainRef.current;
    const { width, height } = canvasSize;
    const cols = Math.ceil(width / GRID_SIZE);
    const rows = Math.ceil(height / GRID_SIZE);

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cell = terrain[y]?.[x];
        if (!cell) continue;

        let fillColor: string;
        
        if (viewModeRef.current === 'heightmap') {
          fillColor = lerpColor(HEIGHTMAP_COLORS.low, HEIGHTMAP_COLORS.high, cell.height);
        } else {
          fillColor = TERRAIN_CONFIG[cell.type].color;
          const brightness = 0.7 + cell.height * 0.3;
          const rgb = parseInt(fillColor.slice(1), 16);
          const r = Math.min(255, Math.floor(((rgb >> 16) & 255) * brightness));
          const g = Math.min(255, Math.floor(((rgb >> 8) & 255) * brightness));
          const b = Math.min(255, Math.floor((rgb & 255) * brightness));
          fillColor = `rgb(${r}, ${g}, ${b})`;
        }

        ctx.fillStyle = fillColor;
        ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE + 1, GRID_SIZE + 1);
      }
    }
  }, [canvasSize]);

  const renderVectorField = useCallback((ctx: CanvasRenderingContext2D) => {
    const terrain = terrainRef.current;
    const { width, height } = canvasSize;
    const spacing = 40;

    for (let y = spacing; y < height; y += spacing) {
      for (let x = spacing; x < width; x += spacing) {
        const slope = calculateSlope(terrain, x, y, width, height);
        const speed = Math.min(slope.magnitude * 10, 1);
        const arrowLength = 10 + speed * 20;
        
        const angle = Math.atan2(slope.dy, slope.dx);
        const endX = x + Math.cos(angle) * arrowLength;
        const endY = y + Math.sin(angle) * arrowLength;

        const color = lerpColor(VECTOR_COLORS.slow, VECTOR_COLORS.fast, speed);
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        const headLength = 6;
        const headAngle = Math.PI / 6;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - headLength * Math.cos(angle - headAngle),
          endY - headLength * Math.sin(angle - headAngle)
        );
        ctx.lineTo(
          endX - headLength * Math.cos(angle + headAngle),
          endY - headLength * Math.sin(angle + headAngle)
        );
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
      }
    }
  }, [canvasSize]);

  const renderTrails = useCallback((ctx: CanvasRenderingContext2D) => {
    const particles = particlesRef.current;

    for (const particle of particles) {
      if (particle.trail.length < 2 || particle.isInfiltrated) continue;

      ctx.beginPath();
      ctx.moveTo(particle.trail[0].x, particle.trail[0].y);

      for (let i = 1; i < particle.trail.length; i++) {
        const point = particle.trail[i];
        ctx.lineTo(point.x, point.y);
      }

      const gradient = ctx.createLinearGradient(
        particle.trail[0].x, particle.trail[0].y,
        particle.trail[particle.trail.length - 1].x, particle.trail[particle.trail.length - 1].y
      );
      
      const opacity = particle.isEvaporating ? particle.opacity * 0.5 : 0.6;
      gradient.addColorStop(0, `rgba(126, 200, 227, 0)`);
      gradient.addColorStop(0.5, `rgba(126, 200, 227, ${opacity})`);
      gradient.addColorStop(1, `rgba(74, 144, 217, ${opacity})`);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = PARTICLE_CONFIG.trailWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  }, []);

  const renderParticles = useCallback((ctx: CanvasRenderingContext2D) => {
    const particles = particlesRef.current;

    for (const particle of particles) {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.diameter / 2, 0, Math.PI * 2);
      
      const rgb = parseInt(particle.color.slice(1), 16);
      const r = (rgb >> 16) & 255;
      const g = (rgb >> 8) & 255;
      const b = rgb & 255;
      
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${particle.opacity})`;
      ctx.fill();

      if (!particle.isInfiltrated && !particle.isEvaporating) {
        ctx.beginPath();
        ctx.arc(
          particle.x - particle.diameter / 6,
          particle.y - particle.diameter / 6,
          particle.diameter / 6,
          0, Math.PI * 2
        );
        ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity * 0.5})`;
        ctx.fill();
      }
    }
  }, []);

  const renderLegend = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!showLegend || viewModeRef.current === 'normal') return;

    const legendX = 20;
    const legendY = 100;
    const legendWidth = 20;
    const legendHeight = 80;

    const gradient = ctx.createLinearGradient(legendX, legendY + legendHeight, legendX, legendY);
    
    if (viewModeRef.current === 'heightmap') {
      gradient.addColorStop(0, HEIGHTMAP_COLORS.low);
      gradient.addColorStop(1, HEIGHTMAP_COLORS.high);
    } else if (viewModeRef.current === 'vector') {
      gradient.addColorStop(0, VECTOR_COLORS.slow);
      gradient.addColorStop(1, VECTOR_COLORS.fast);
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(legendX, legendY, legendWidth, legendHeight);

    ctx.strokeStyle = '#ECF0F1';
    ctx.lineWidth = 1;
    ctx.strokeRect(legendX, legendY, legendWidth, legendHeight);

    ctx.fillStyle = '#ECF0F1';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    
    if (viewModeRef.current === 'heightmap') {
      ctx.fillText('高', legendX + legendWidth + 8, legendY + 10);
      ctx.fillText('低', legendX + legendWidth + 8, legendY + legendHeight);
    } else if (viewModeRef.current === 'vector') {
      ctx.fillText('快', legendX + legendWidth + 8, legendY + 10);
      ctx.fillText('慢', legendX + legendWidth + 8, legendY + legendHeight);
    }
  }, [showLegend]);

  const render = useCallback((ctx: CanvasRenderingContext2D) => {
    const { width, height } = canvasSize;

    ctx.fillStyle = '#E8DCC4';
    ctx.fillRect(0, 0, width, height);

    renderTerrain(ctx);

    if (viewModeRef.current === 'vector') {
      renderVectorField(ctx);
    }

    if (viewModeRef.current === 'normal') {
      renderTrails(ctx);
    }

    renderParticles(ctx);
    renderLegend(ctx);
  }, [canvasSize, renderTerrain, renderVectorField, renderTrails, renderParticles, renderLegend]);

  const update = useCallback((currentTime: number) => {
    const particles = particlesRef.current;
    const terrain = terrainRef.current;
    const { width, height } = canvasSize;

    statsRef.current = { evaporated: 0, infiltrated: 0 };

    const remainingParticles: Particle[] = [];

    for (const particle of particles) {
      const result = updateParticlePhysics(
        particle,
        terrain,
        permeabilityRef.current,
        evaporationRateRef.current,
        currentTime,
        width,
        height
      );

      if (result.evaporated) {
        statsRef.current.evaporated++;
      } else if (result.infiltrated) {
        statsRef.current.infiltrated++;
      } else {
        remainingParticles.push(particle);
      }
    }

    particlesRef.current = remainingParticles;

    if (statsRef.current.evaporated > 0 || statsRef.current.infiltrated > 0) {
      const state = useSimulationStore.getState();
      updateStats({
        totalEvaporated: state.totalEvaporated + statsRef.current.evaporated,
        totalInfiltrated: state.totalInfiltrated + statsRef.current.infiltrated,
        activeParticles: remainingParticles.length,
      });
    } else {
      updateStats({ activeParticles: remainingParticles.length });
    }
  }, [canvasSize, updateStats]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = (currentTime: number) => {
      frameCountRef.current++;
      
      if (currentTime - lastTimeRef.current >= 1000 / 30) {
        update(currentTime);
        lastTimeRef.current = currentTime;
      }
      
      render(ctx);
      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [update, render]);

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0]?.clientX ?? 0;
      clientY = e.touches[0]?.clientY ?? 0;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      isDrawingRef.current = true;
      const { x, y } = getCanvasCoords(e);
      drawTerrain(
        terrainRef.current,
        x, y,
        selectedTerrainRef.current,
        BRUSH_SIZE,
        canvasSize.width,
        canvasSize.height
      );
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDrawingRef.current) {
      const { x, y } = getCanvasCoords(e);
      drawTerrain(
        terrainRef.current,
        x, y,
        selectedTerrainRef.current,
        BRUSH_SIZE,
        canvasSize.width,
        canvasSize.height
      );
    }
  };

  const handleMouseUp = () => {
    isDrawingRef.current = false;
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const modes: ViewMode[] = ['normal', 'heightmap', 'vector'];
    const currentIndex = modes.indexOf(viewModeRef.current);
    const nextIndex = (currentIndex + 1) % modes.length;
    const nextMode = modes[nextIndex];
    setViewMode(nextMode);
    setShowLegend(nextMode !== 'normal');
    window.dispatchEvent(new CustomEvent('terrainChange', { detail: selectedTerrainRef.current }));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    isDrawingRef.current = true;
    const { x, y } = getCanvasCoords(e);
    drawTerrain(
      terrainRef.current,
      x, y,
      selectedTerrainRef.current,
      BRUSH_SIZE,
      canvasSize.width,
      canvasSize.height
    );
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (isDrawingRef.current) {
      const { x, y } = getCanvasCoords(e);
      drawTerrain(
        terrainRef.current,
        x, y,
        selectedTerrainRef.current,
        BRUSH_SIZE,
        canvasSize.width,
        canvasSize.height
      );
    }
  };

  const handleTouchEnd = () => {
    isDrawingRef.current = false;
  };

  const canvasStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    border: '2px dashed #4A4A6A',
    borderRadius: '8px',
    cursor: 'crosshair',
    touchAction: 'none',
  };

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={canvasStyle}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      <div style={{
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        fontSize: '11px',
        color: 'rgba(255, 255, 255, 0.6)',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        padding: '4px 8px',
        borderRadius: '4px',
      }}>
        右键切换视图 | 当前: {viewMode === 'normal' ? '正常' : viewMode === 'heightmap' ? '高度图' : '流速矢量图'}
      </div>
    </div>
  );
};

export default HydrologyCanvas;
