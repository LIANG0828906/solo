import { useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DrawPath, CanvasTransform, InkRegion, BrushSettings } from '@/types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE, MIN_SCALE, MAX_SCALE } from '@/types';
import { useBrush } from '@/hooks/useBrush';

interface CaveWallProps {
  paths: DrawPath[];
  brushSettings: BrushSettings;
  transform: CanvasTransform;
  inkRegions: InkRegion[];
  onPathComplete: (path: DrawPath) => void;
  onRegionsUpdate: (regions: InkRegion[]) => void;
  onTransformChange: (transform: CanvasTransform) => void;
}

export default function CaveWall({
  paths,
  brushSettings,
  transform,
  inkRegions,
  onPathComplete,
  onRegionsUpdate,
  onTransformChange,
}: CaveWallProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [tempOffset, setTempOffset] = useState({ x: 0, y: 0 });

  const {
    currentPath,
    isDrawing,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
  } = useBrush({
    brushSettings,
    transform,
    onPathComplete,
    onRegionsUpdate,
    allPaths: paths,
  });

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, transform.scale + delta));
    
    onTransformChange({
      ...transform,
      scale: newScale,
    });
  }, [transform, onTransformChange]);

  const handlePanStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (isDrawing) return;
    
    if ('button' in e && e.button !== 2 && e.button !== 1) return;
    
    e.preventDefault();
    setIsPanning(true);
    
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    setPanStart({
      x: clientX - transform.offsetX * transform.scale,
      y: clientY - transform.offsetY * transform.scale,
    });
  }, [isDrawing, transform]);

  const handlePanMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isPanning || isDrawing) return;
    e.preventDefault();
    
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const newOffsetX = (clientX - panStart.x) / transform.scale;
    const newOffsetY = (clientY - panStart.y) / transform.scale;
    
    setTempOffset({ x: newOffsetX, y: newOffsetY });
  }, [isPanning, isDrawing, panStart, transform.scale]);

  const handlePanEnd = useCallback(() => {
    if (isPanning) {
      onTransformChange({
        ...transform,
        offsetX: tempOffset.x || transform.offsetX,
        offsetY: tempOffset.y || transform.offsetY,
      });
      setTempOffset({ x: 0, y: 0 });
      setIsPanning(false);
    }
  }, [isPanning, tempOffset, transform, onTransformChange]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    if ('button' in e && (e.button === 2 || e.button === 1)) {
      handlePanStart(e);
    } else {
      handleMouseDown(e);
    }
  }, [handleMouseDown, handlePanStart]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    if (isPanning) {
      handlePanMove(e);
    } else {
      handleMouseMove(e);
    }
  }, [isPanning, handlePanMove, handleMouseMove]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  const effectiveOffsetX = isPanning ? tempOffset.x : transform.offsetX;
  const effectiveOffsetY = isPanning ? tempOffset.y : transform.offsetY;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: 600,
        background: 'linear-gradient(180deg, #2c1810 0%, #1a0f0a 50%, #0d0705 100%)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0.3,
          pointerEvents: 'none',
        }}
      >
        <defs>
          <pattern id="rockTexture" patternUnits="userSpaceOnUse" width="100" height="100">
            <rect width="100" height="100" fill="#2c1810" />
            <circle cx="20" cy="30" r="15" fill="#3d2817" opacity="0.5" />
            <circle cx="70" cy="60" r="20" fill="#1a0f0a" opacity="0.4" />
            <circle cx="50" cy="80" r="10" fill="#3d2817" opacity="0.3" />
            <circle cx="85" cy="20" r="8" fill="#1a0f0a" opacity="0.5" />
            <path d="M 0 50 Q 25 40, 50 50 T 100 50" stroke="#1a0f0a" strokeWidth="2" fill="none" opacity="0.3" />
            <path d="M 0 75 Q 30 85, 60 75 T 100 75" stroke="#3d2817" strokeWidth="1" fill="none" opacity="0.2" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#rockTexture)" />
      </svg>

      <motion.div
        style={{
          position: 'relative',
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          backgroundColor: '#f0e6d3',
          borderRadius: 4,
          boxShadow: `
            inset 0 0 100px rgba(139, 90, 43, 0.3),
            0 0 50px rgba(0, 0, 0, 0.5),
            0 10px 30px rgba(0, 0, 0, 0.3)
          `,
          cursor: isPanning ? 'grabbing' : isDrawing ? 'crosshair' : 'grab',
          overflow: 'hidden',
        }}
        animate={{
          scale: transform.scale,
          x: effectiveOffsetX * transform.scale,
          y: effectiveOffsetY * transform.scale,
        }}
        transition={{ duration: isPanning ? 0 : 0.2 }}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
        onMouseUp={handlePanEnd}
        onMouseLeave={() => {
          handleMouseLeave();
          handlePanEnd();
        }}
      >
        <svg
          ref={svgRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            touchAction: 'none',
          }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={() => {
            handleMouseUp();
            handlePanEnd();
          }}
          onTouchStart={handleCanvasMouseDown}
          onTouchMove={handleCanvasMouseMove}
          onTouchEnd={() => {
            handleMouseUp();
            handlePanEnd();
          }}
        >
          <defs>
            <filter id="edgeAging" x="0" y="0" width="100%" height="100%">
              <feFlood floodColor="#8b5a2b" floodOpacity="0.2" />
              <feComposite operator="in" in2="SourceGraphic" />
              <feGaussianBlur stdDeviation="3" />
            </filter>
            
            <radialGradient id="cornerShadow" cx="50%" cy="50%" r="50%">
              <stop offset="70%" stopColor="transparent" />
              <stop offset="100%" stopColor="#5a3d2b" stopOpacity="0.4" />
            </radialGradient>
            
            <pattern id="mottling" patternUnits="userSpaceOnUse" width="60" height="60">
              <circle cx="15" cy="15" r="2" fill="#8b7355" opacity="0.15" />
              <circle cx="45" cy="30" r="3" fill="#a0826d" opacity="0.1" />
              <circle cx="30" cy="50" r="1.5" fill="#6b4423" opacity="0.2" />
            </pattern>
            
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="url(#cornerShadow)" />
          <rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="url(#mottling)" />

          {paths.map((path) => (
            <path
              key={path.id}
              d={path.smoothPath}
              stroke={path.color}
              strokeWidth={path.strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                filter: `url(#glow)`,
              }}
            />
          ))}

          {currentPath && (
            <path
              d={currentPath.smoothPath}
              stroke={currentPath.color}
              strokeWidth={currentPath.strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                filter: `url(#glow)`,
              }}
            />
          )}

          <g>
            <line x1="0" y1="0" x2="5" y2="0" stroke="#5a3d2b" strokeWidth="2" opacity="0.6" />
            <line x1={CANVAS_WIDTH - 5} y1="0" x2={CANVAS_WIDTH} y2="0" stroke="#5a3d2b" strokeWidth="2" opacity="0.6" />
            <line x1="0" y1={CANVAS_HEIGHT} x2="5" y2={CANVAS_HEIGHT} stroke="#5a3d2b" strokeWidth="2" opacity="0.6" />
            <line x1={CANVAS_WIDTH - 5} y1={CANVAS_HEIGHT} x2={CANVAS_WIDTH} y2={CANVAS_HEIGHT} stroke="#5a3d2b" strokeWidth="2" opacity="0.6" />
          </g>
        </svg>

        <AnimatePresence>
          {inkRegions.filter(r => r.animating).map((region) => (
            <motion.div
              key={`${region.x}-${region.y}`}
              initial={{ opacity: 0, boxShadow: '0 0 0 0 rgba(255, 215, 0, 0)' }}
              animate={{
                opacity: [0, 1, 1, 0],
                boxShadow: [
                  '0 0 0 0 rgba(255, 215, 0, 0)',
                  '0 0 20px 5px rgba(255, 215, 0, 0.8)',
                  '0 0 30px 10px rgba(255, 215, 0, 0.6)',
                  '0 0 0 0 rgba(255, 215, 0, 0)',
                ],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                left: region.x,
                top: region.y,
                width: GRID_SIZE,
                height: GRID_SIZE,
                border: '3px solid #ffd700',
                borderRadius: 2,
                pointerEvents: 'none',
              }}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      <div
        style={{
          position: 'absolute',
          bottom: 10,
          right: 10,
          color: '#f0e6d3',
          fontSize: 12,
          opacity: 0.6,
          backgroundColor: 'rgba(0,0,0,0.5)',
          padding: '4px 8px',
          borderRadius: 4,
        }}
      >
        缩放: {(transform.scale * 100).toFixed(0)}% | 滚轮缩放，右键拖动平移
      </div>
    </div>
  );
}
