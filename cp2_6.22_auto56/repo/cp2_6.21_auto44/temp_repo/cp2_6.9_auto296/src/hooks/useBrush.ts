import { useState, useRef, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { PathPoint, DrawPath, BrushSettings, InkRegion, CanvasTransform } from '@/types';
import { smoothBezier, optimizePoints, checkInkRegions } from '@/utils/pathUtils';

interface UseBrushProps {
  brushSettings: BrushSettings;
  transform: CanvasTransform;
  onPathComplete: (path: DrawPath) => void;
  onRegionsUpdate: (regions: InkRegion[]) => void;
  allPaths: DrawPath[];
}

interface UseBrushReturn {
  currentPath: DrawPath | null;
  isDrawing: boolean;
  handleMouseDown: (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => void;
  handleMouseMove: (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => void;
  handleMouseUp: () => void;
  handleMouseLeave: () => void;
}

export function useBrush({
  brushSettings,
  transform,
  onPathComplete,
  onRegionsUpdate,
  allPaths,
}: UseBrushProps): UseBrushReturn {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<DrawPath | null>(null);
  const [inkRegions, setInkRegions] = useState<InkRegion[]>([]);
  
  const svgRef = useRef<SVGSVGElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingPointRef = useRef<PathPoint | null>(null);
  
  const getCoordinates = useCallback((
    e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>
  ): { x: number; y: number } | null => {
    if (!svgRef.current) return null;
    
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    
    let clientX: number, clientY: number;
    
    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = (clientX - rect.left) / transform.scale - transform.offsetX;
    const y = (clientY - rect.top) / transform.scale - transform.offsetY;
    
    return { x, y };
  }, [transform.scale, transform.offsetX, transform.offsetY]);
  
  const updateInkRegions = useCallback((paths: DrawPath[]) => {
    const newRegions = checkInkRegions(paths, inkRegions);
    const hasNewAnimating = newRegions.some(r => r.animating);
    
    if (hasNewAnimating) {
      setInkRegions(newRegions);
      onRegionsUpdate(newRegions);
      
      setTimeout(() => {
        setInkRegions(prev => prev.map(r => ({
          ...r,
          animated: r.animating ? true : r.animated,
          animating: false,
        })));
      }, 1200);
    }
  }, [inkRegions, onRegionsUpdate]);
  
  const handleMouseDown = useCallback((
    e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>
  ) => {
    e.preventDefault();
    
    if ('button' in e && e.button !== 0) return;
    
    svgRef.current = e.currentTarget;
    const coords = getCoordinates(e);
    if (!coords) return;
    
    const point: PathPoint = {
      x: coords.x,
      y: coords.y,
      timestamp: Date.now(),
    };
    
    const newPath: DrawPath = {
      id: uuidv4(),
      points: [point],
      color: brushSettings.color,
      strokeWidth: brushSettings.strokeWidth,
      smoothPath: smoothBezier([point]),
    };
    
    setIsDrawing(true);
    setCurrentPath(newPath);
  }, [brushSettings, getCoordinates]);
  
  const handleMouseMove = useCallback((
    e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>
  ) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const coords = getCoordinates(e);
    if (!coords) return;
    
    const newPoint: PathPoint = {
      x: coords.x,
      y: coords.y,
      timestamp: Date.now(),
    };
    
    pendingPointRef.current = newPoint;
    
    if (rafRef.current) return;
    
    rafRef.current = requestAnimationFrame(() => {
      if (pendingPointRef.current && currentPath) {
        const point = pendingPointRef.current;
        pendingPointRef.current = null;
        
        setCurrentPath(prev => {
          if (!prev) return null;
          
          const newPoints = optimizePoints([...prev.points, point]);
          return {
            ...prev,
            points: newPoints,
            smoothPath: smoothBezier(newPoints),
          };
        });
      }
      rafRef.current = null;
    });
  }, [isDrawing, getCoordinates, currentPath]);
  
  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !currentPath) {
      setIsDrawing(false);
      return;
    }
    
    if (currentPath.points.length > 0) {
      onPathComplete(currentPath);
      
      setTimeout(() => {
        updateInkRegions([...allPaths, currentPath]);
      }, 50);
    }
    
    setIsDrawing(false);
    setCurrentPath(null);
    pendingPointRef.current = null;
    
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, [isDrawing, currentPath, onPathComplete, allPaths, updateInkRegions]);
  
  const handleMouseLeave = useCallback(() => {
    if (isDrawing) {
      handleMouseUp();
    }
  }, [isDrawing, handleMouseUp]);
  
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);
  
  return {
    currentPath,
    isDrawing,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
  };
}
