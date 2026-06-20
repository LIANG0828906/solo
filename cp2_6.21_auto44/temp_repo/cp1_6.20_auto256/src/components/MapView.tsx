import { useRef, useEffect, useState, useCallback } from 'react';
import type { Treasure } from '../types';
import { COLOR_MAP } from '../types';
import { geoToScreen, haversineDistance, formatDistance } from '../utils/geoUtils';

interface MapViewProps {
  treasures: Treasure[];
  centerLat: number;
  centerLng: number;
  onTreasureClick: (treasure: Treasure) => void;
}

function MapView({ treasures, centerLat, centerLng, onTreasureClick }: MapViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(80000);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [hoveredTreasure, setHoveredTreasure] = useState<Treasure | null>(null);
  const animationRef = useRef<number>(0);
  const pulseRef = useRef(0);

  const getEffectiveCenter = useCallback(() => {
    const lngOffset = -offset.x / scale;
    const latOffset = offset.y / scale;
    return {
      lat: centerLat + latOffset,
      lng: centerLng + lngOffset,
    };
  }, [centerLat, centerLng, offset, scale]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    const center = getEffectiveCenter();
    
    ctx.fillStyle = '#1a237e';
    ctx.fillRect(0, 0, width, height);
    
    const gridSpacing = 0.005;
    const startLng = center.lng - (width / 2) / scale;
    const endLng = center.lng + (width / 2) / scale;
    const startLat = center.lat - (height / 2) / scale;
    const endLat = center.lat + (height / 2) / scale;
    
    ctx.strokeStyle = '#283593';
    ctx.lineWidth = 1;
    
    for (let lng = Math.ceil(startLng / gridSpacing) * gridSpacing; lng <= endLng; lng += gridSpacing) {
      const screen = geoToScreen({ lat: center.lat, lng }, center, scale, width, height);
      ctx.beginPath();
      ctx.moveTo(screen.x, 0);
      ctx.lineTo(screen.x, height);
      ctx.stroke();
    }
    
    for (let lat = Math.ceil(startLat / gridSpacing) * gridSpacing; lat <= endLat; lat += gridSpacing) {
      const screen = geoToScreen({ lat, lng: center.lng }, center, scale, width, height);
      ctx.beginPath();
      ctx.moveTo(0, screen.y);
      ctx.lineTo(width, screen.y);
      ctx.stroke();
    }
    
    const playerScreen = geoToScreen({ lat: centerLat, lng: centerLng }, center, scale, width, height);
    ctx.fillStyle = '#76ff03';
    ctx.beginPath();
    ctx.arc(playerScreen.x, playerScreen.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#76ff03';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(playerScreen.x, playerScreen.y, 15 + Math.sin(pulseRef.current) * 3, 0, Math.PI * 2);
    ctx.stroke();
    
    treasures.forEach(treasure => {
      if (treasure.collected) return;
      
      const screen = geoToScreen(
        { lat: treasure.lat, lng: treasure.lng },
        center,
        scale,
        width,
        height
      );
      
      if (screen.x < -50 || screen.x > width + 50 || screen.y < -50 || screen.y > height + 50) {
        return;
      }
      
      const color = COLOR_MAP[treasure.type];
      const pulseSize = 15 + Math.sin(pulseRef.current + treasure.id.charCodeAt(0)) * 5;
      
      const gradient = ctx.createRadialGradient(
        screen.x, screen.y, 0,
        screen.x, screen.y, pulseSize * 2
      );
      gradient.addColorStop(0, color + '80');
      gradient.addColorStop(0.5, color + '40');
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, pulseSize * 2, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, 12, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px "Courier New"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      let icon = '';
      if (treasure.type === 'gem') icon = '◆';
      else if (treasure.type === 'coin') icon = '●';
      else if (treasure.type === 'chest') icon = '■';
      ctx.fillText(icon, screen.x, screen.y);
    });
    
    if (hoveredTreasure) {
      const screen = geoToScreen(
        { lat: hoveredTreasure.lat, lng: hoveredTreasure.lng },
        center,
        scale,
        width,
        height
      );
      
      const distance = haversineDistance(
        centerLat, centerLng,
        hoveredTreasure.lat, hoveredTreasure.lng
      );
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.strokeStyle = COLOR_MAP[hoveredTreasure.type];
      ctx.lineWidth = 2;
      
      const tooltipWidth = 120;
      const tooltipHeight = 50;
      const tooltipX = screen.x - tooltipWidth / 2;
      const tooltipY = screen.y - 50;
      
      ctx.beginPath();
      ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 5);
      ctx.fill();
      ctx.stroke();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px "Courier New"';
      ctx.textAlign = 'center';
      const typeNames: Record<string, string> = {
        gem: '宝石',
        coin: '金币',
        chest: '宝箱',
      };
      ctx.fillText(typeNames[hoveredTreasure.type], screen.x, tooltipY + 18);
      
      ctx.fillStyle = '#76ff03';
      ctx.font = '11px "Courier New"';
      ctx.fillText(`距离: ${formatDistance(distance)}`, screen.x, tooltipY + 35);
    }
  }, [treasures, scale, offset, centerLat, centerLng, hoveredTreasure, getEffectiveCenter]);

  const animate = useCallback(() => {
    pulseRef.current += 0.05;
    draw();
    animationRef.current = requestAnimationFrame(animate);
  }, [draw]);

  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      if (!container) return;
      
      const width = container.clientWidth;
      const height = container.clientHeight;
      
      const canvas = canvasRef.current;
      if (canvas) {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(dpr, dpr);
        }
      }
      
      setCanvasSize({ width, height });
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [animate]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
      setHoveredTreasure(null);
    } else {
      const center = getEffectiveCenter();
      let found: Treasure | null = null;
      
      for (const treasure of treasures) {
        if (treasure.collected) continue;
        
        const screen = geoToScreen(
          { lat: treasure.lat, lng: treasure.lng },
          center,
          scale,
          canvasSize.width,
          canvasSize.height
        );
        
        const dist = Math.sqrt(
          Math.pow(mouseX - screen.x, 2) + Math.pow(mouseY - screen.y, 2)
        );
        
        if (dist < 20) {
          found = treasure;
          break;
        }
      }
      
      setHoveredTreasure(found);
      
      if (found) {
        containerRef.current?.style && (containerRef.current.style.cursor = 'pointer');
      } else {
        containerRef.current?.style && (containerRef.current.style.cursor = 'grab');
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const center = getEffectiveCenter();
    
    for (const treasure of treasures) {
      if (treasure.collected) continue;
      
      const screen = geoToScreen(
        { lat: treasure.lat, lng: treasure.lng },
        center,
        scale,
        canvasSize.width,
        canvasSize.height
      );
      
      const dist = Math.sqrt(
        Math.pow(mouseX - screen.x, 2) + Math.pow(mouseY - screen.y, 2)
      );
      
      if (dist < 20) {
        onTreasureClick(treasure);
        break;
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(20000, Math.min(200000, prev * delta)));
  };

  return (
    <div
      ref={containerRef}
      className="map-container"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
      onWheel={handleWheel}
    >
      <canvas ref={canvasRef} className="map-canvas" />
    </div>
  );
}

export default MapView;
