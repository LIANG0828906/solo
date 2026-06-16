import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { GeoPoint } from '@/types';

interface RoutePolylineProps {
  path: GeoPoint[];
}

const GradientPolylineLayer: React.FC<{ positions: [number, number][]; gradientId: string }> = ({
  positions,
  gradientId,
}) => {
  const map = useMap();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);

  useEffect(() => {
    if (positions.length < 2) return;

    const overlayPane = map.getPane('overlayPane');
    if (!overlayPane) return;

    let svg = svgRef.current;
    if (!svg) {
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'leaflet-zoom-animated');
      svg.style.position = 'absolute';
      svg.style.top = '0';
      svg.style.left = '0';
      svg.style.pointerEvents = 'none';
      svg.style.overflow = 'visible';
      
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
      gradient.setAttribute('id', gradientId);
      gradient.setAttribute('x1', '0%');
      gradient.setAttribute('y1', '0%');
      gradient.setAttribute('x2', '100%');
      gradient.setAttribute('y2', '0%');
      
      const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop1.setAttribute('offset', '0%');
      stop1.setAttribute('stop-color', '#4a9eff');
      
      const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop2.setAttribute('offset', '100%');
      stop2.setAttribute('stop-color', '#a855f7');
      
      gradient.appendChild(stop1);
      gradient.appendChild(stop2);
      defs.appendChild(gradient);
      svg.appendChild(defs);
      
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', `url(#${gradientId})`);
      path.setAttribute('stroke-width', '3');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      path.style.filter = 'drop-shadow(0 0 4px rgba(74, 158, 255, 0.4))';
      svg.appendChild(path);
      pathRef.current = path;
      
      overlayPane.appendChild(svg);
      svgRef.current = svg;
    }

    const updatePath = () => {
      if (!svgRef.current || !pathRef.current) return;
      
      const bounds = map.getBounds();
      const topLeft = map.latLngToLayerPoint(bounds.getNorthWest());
      const bottomRight = map.latLngToLayerPoint(bounds.getSouthEast());
      
      const width = bottomRight.x - topLeft.x;
      const height = bottomRight.y - topLeft.y;
      
      svgRef.current.style.width = `${width}px`;
      svgRef.current.style.height = `${height}px`;
      svgRef.current.style.transform = `translate(${topLeft.x}px, ${topLeft.y}px)`;
      
      let d = '';
      positions.forEach((pos, i) => {
        const point = map.latLngToLayerPoint(L.latLng(pos[0], pos[1]));
        const x = point.x - topLeft.x;
        const y = point.y - topLeft.y;
        d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
      });
      
      pathRef.current.setAttribute('d', d);
    };

    updatePath();
    map.on('move', updatePath);
    map.on('zoom', updatePath);

    return () => {
      map.off('move', updatePath);
      map.off('zoom', updatePath);
      if (svgRef.current && svgRef.current.parentNode) {
        svgRef.current.parentNode.removeChild(svgRef.current);
        svgRef.current = null;
        pathRef.current = null;
      }
    };
  }, [positions, map, gradientId]);

  return null;
};

export const RoutePolyline: React.FC<RoutePolylineProps> = ({ path }) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const gradientId = useMemo(() => `route-gradient-${Math.random().toString(36).substr(2, 9)}`, []);

  const positions: [number, number][] = path.map(p => [p.lat, p.lng]);

  const getAnimatedPositions = (progress: number): [number, number][] => {
    if (progress >= 1) return positions;
    const totalLength = positions.length - 1;
    const currentLength = totalLength * progress;
    const index = Math.floor(currentLength);
    const fraction = currentLength - index;
    
    const result: [number, number][] = [];
    for (let i = 0; i <= index; i++) {
      result.push(positions[i]);
    }
    
    if (index < positions.length - 1 && fraction > 0) {
      const next = positions[index + 1];
      const current = positions[index];
      result.push([
        current[0] + (next[0] - current[0]) * fraction,
        current[1] + (next[1] - current[1]) * fraction,
      ]);
    }
    
    return result;
  };

  useEffect(() => {
    setAnimatedProgress(0);
    setIsAnimating(true);
    startTimeRef.current = null;

    const duration = 1500;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      setAnimatedProgress(easeOutCubic);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        setAnimatedProgress(1);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [path]);

  const animatedPositions = getAnimatedPositions(animatedProgress);

  return (
    <>
      <Polyline
        positions={positions}
        pathOptions={{
          color: 'rgba(74, 158, 255, 0.15)',
          weight: 10,
          opacity: 1,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />

      {animatedProgress > 0 && (
        <GradientPolylineLayer 
          positions={animatedPositions} 
          gradientId={gradientId}
        />
      )}

      {isAnimating && animatedPositions.length > 1 && (
        <Polyline
          positions={animatedPositions}
          pathOptions={{
            color: 'rgba(255, 255, 255, 0.9)',
            weight: 2,
            opacity: 0.7,
            lineCap: 'round',
            lineJoin: 'round',
            dashArray: '6, 14',
            className: 'flowing-dash',
          }}
        />
      )}
    </>
  );
};
