import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import type { MarkedLine, MarkingDot } from '../types';

const GRID_SIZE = 5;
const WOOD_WIDTH_RATIO = 0.6;
const WOOD_HEIGHT = 80;
const LINE_REEL_RADIUS = 18;
const MARKER_RADIUS = 6;

const snapToGrid = (value: number): number => {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
};

const calculateAngle = (startX: number, startY: number, endX: number, endY: number): number => {
  const dx = endX - startX;
  const dy = endY - startY;
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);
  angle = Math.round(angle * 2) / 2;
  return angle;
};

const getAngleColor = (angle: number): string => {
  const normalizedAngle = Math.abs(angle % 180);
  const deviation = Math.min(normalizedAngle, 180 - normalizedAngle);
  return deviation <= 2 ? '#00ff00' : '#ff0000';
};

const calculateFlatnessScore = (angle: number): 'A' | 'B' | 'C' | 'D' => {
  const normalizedAngle = Math.abs(angle % 180);
  const deviation = Math.min(normalizedAngle, 180 - normalizedAngle);
  if (deviation < 1) return 'A';
  if (deviation < 2) return 'B';
  if (deviation < 3) return 'C';
  return 'D';
};

interface Particle {
  id: number;
  x: number;
  y: number;
  delay: number;
  size: number;
}

const Workbench: React.FC = () => {
  const {
    currentLine,
    markers,
    tool,
    isDraggingLine,
    tempLineEnd,
    setLine,
    addMarker,
    updateMarker,
    cutWood,
    saveToHistory,
    setIsDraggingLine,
    setTempLineEnd
  } = useStore();

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [isLineAnimating, setIsLineAnimating] = useState(false);
  const [showCutParticles, setShowCutParticles] = useState(false);
  const [cutParticles, setCutParticles] = useState<Particle[]>([]);
  const [isCutSeparated, setIsCutSeparated] = useState(false);
  const [draggingMarkerId, setDraggingMarkerId] = useState<string | null>(null);
  const [flashingMarkerId, setFlashingMarkerId] = useState<string | null>(null);
  const [lineReelPos, setLineReelPos] = useState({ x: 80, y: 200 });
  const [reelDragOffset, setReelDragOffset] = useState({ x: 0, y: 0 });
  const [isDraggingReel, setIsDraggingReel] = useState(false);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({ width: clientWidth, height: clientHeight });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const woodWidth = dimensions.width * WOOD_WIDTH_RATIO;
  const woodX = (dimensions.width - woodWidth) / 2;
  const woodY = dimensions.height / 2 - WOOD_HEIGHT / 2;

  const inkPotStart = { x: 60, y: 180 };

  const getSvgPoint = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return { x, y };
  }, []);

  const handleReelMouseDown = (e: React.MouseEvent) => {
    if (tool !== 'ink' || isLineAnimating) return;
    e.stopPropagation();
    const point = getSvgPoint(e);
    setReelDragOffset({
      x: point.x - lineReelPos.x,
      y: point.y - lineReelPos.y
    });
    setIsDraggingReel(true);
    setIsDraggingLine(true);
    setTempLineEnd({ x: lineReelPos.x, y: lineReelPos.y });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const point = getSvgPoint(e);

    if (isDraggingReel) {
      const newX = Math.max(40, Math.min(dimensions.width - 40, point.x - reelDragOffset.x));
      const newY = Math.max(40, Math.min(dimensions.height - 40, point.y - reelDragOffset.y));
      setLineReelPos({ x: newX, y: newY });
      setTempLineEnd({ x: newX, y: newY });
    }

    if (draggingMarkerId) {
      const snappedX = snapToGrid(point.x);
      const snappedY = snapToGrid(point.y);
      const marker = markers.find(m => m.id === draggingMarkerId);
      if (marker && (marker.x !== snappedX || marker.y !== snappedY)) {
        updateMarker(draggingMarkerId, snappedX, snappedY);
        setFlashingMarkerId(draggingMarkerId);
        setTimeout(() => setFlashingMarkerId(null), 100);
      }
    }
  }, [isDraggingReel, reelDragOffset, draggingMarkerId, markers, getSvgPoint, dimensions, updateMarker]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (isDraggingReel) {
      const point = getSvgPoint(e);
      const endX = snapToGrid(point.x - reelDragOffset.x);
      const endY = snapToGrid(point.y - reelDragOffset.y);

      setIsLineAnimating(true);
      setIsDraggingReel(false);

      setTimeout(() => {
        const angle = calculateAngle(inkPotStart.x, inkPotStart.y, endX, endY);
        const newLine: MarkedLine = {
          id: Date.now().toString(),
          startX: inkPotStart.x,
          startY: inkPotStart.y,
          endX,
          endY,
          angle,
          isReal: true
        };
        setLine(newLine);
        setTempLineEnd(null);
        setIsDraggingLine(false);
        setIsLineAnimating(false);

        setLineReelPos({ x: 80, y: 200 });
      }, 400);
    }

    if (draggingMarkerId) {
      setDraggingMarkerId(null);
    }
  }, [isDraggingReel, draggingMarkerId, getSvgPoint, reelDragOffset, setLine, setTempLineEnd, setIsDraggingLine]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleSvgClick = (e: React.MouseEvent) => {
    if (tool !== 'marker') return;
    if (isDraggingLine || isDraggingReel) return;

    const point = getSvgPoint(e);
    const target = e.target as SVGElement;
    if (target.tagName === 'circle' && target.classList.contains('marker-dot')) return;

    const snappedX = snapToGrid(point.x);
    const snappedY = snapToGrid(point.y);

    if (
      snappedX >= woodX &&
      snappedX <= woodX + woodWidth &&
      snappedY >= woodY &&
      snappedY <= woodY + WOOD_HEIGHT
    ) {
      const newMarker: MarkingDot = {
        id: Date.now().toString(),
        x: snappedX,
        y: snappedY
      };
      addMarker(newMarker);
      setFlashingMarkerId(newMarker.id);
      setTimeout(() => setFlashingMarkerId(null), 100);
    }
  };

  const handleMarkerMouseDown = (e: React.MouseEvent, markerId: string) => {
    if (tool !== 'marker') return;
    e.stopPropagation();
    setDraggingMarkerId(markerId);
  };

  const handleCut = () => {
    if (markers.length < 2 || !currentLine) return;

    const startMarker = markers[0];
    const endMarker = markers[markers.length - 1];

    const particles: Particle[] = [];
    for (let i = 0; i < 30; i++) {
      const t = i / 29;
      particles.push({
        id: i,
        x: startMarker.x + (endMarker.x - startMarker.x) * t,
        y: startMarker.y + (endMarker.y - startMarker.y) * t,
        delay: t * 0.8,
        size: 4 + Math.random() * 6
      });
    }
    setCutParticles(particles);
    setShowCutParticles(true);

    setTimeout(() => {
      setIsCutSeparated(true);
      cutWood();

      const score = calculateFlatnessScore(currentLine.angle);
      saveToHistory({
        line: currentLine,
        markers: [...markers],
        score,
        thumbnail: ''
      });

      setShowCutParticles(false);
    }, 1200);
  };

  const renderGrid = () => {
    const lines = [];
    for (let x = 0; x <= dimensions.width; x += GRID_SIZE) {
      lines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={dimensions.height}
          stroke="#ccc"
          strokeWidth="0.5"
          opacity="0.3"
        />
      );
    }
    for (let y = 0; y <= dimensions.height; y += GRID_SIZE) {
      lines.push(
        <line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={dimensions.width}
          y2={y}
          stroke="#ccc"
          strokeWidth="0.5"
          opacity="0.3"
        />
      );
    }
    return lines;
  };

  const renderInkPot = () => {
    const potX = 50;
    const potY = 160;

    return (
      <g>
        <polygon
          points={`${potX - 25},${potY + 60} ${potX + 25},${potY + 60} ${potX + 20},${potY} ${potX - 20},${potY}`}
          fill="#1a1a1a"
          stroke="#000"
          strokeWidth="2"
        />
        <rect
          x={potX - 18}
          y={potY - 5}
          width="36"
          height="10"
          fill="#2a2a2a"
          rx="2"
        />
        <ellipse
          cx={potX}
          cy={potY + 45}
          rx="18"
          ry="10"
          fill="#3a3a3a"
        />
        <g
          style={{ cursor: tool === 'ink' ? 'grab' : 'default' }}
          onMouseDown={handleReelMouseDown}
        >
          <motion.g
            drag={tool === 'ink' && !isLineAnimating}
            dragMomentum={false}
            dragElastic={0}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            animate={{ x: lineReelPos.x - 80, y: lineReelPos.y - 200 }}
          >
            <circle
              cx={80}
              cy={200}
              r={LINE_REEL_RADIUS}
              fill="url(#copperGradient)"
              stroke="#8b5a2b"
              strokeWidth="2"
            />
            <circle
              cx={80}
              cy={200}
              r={LINE_REEL_RADIUS - 4}
              fill="#8b5a2b"
              opacity="0.5"
            />
            <circle
              cx={80}
              cy={200}
              r={4}
              fill="#1a1a1a"
            />
            <line
              x1={80 - LINE_REEL_RADIUS + 2}
              y1={200}
              x2={80 + LINE_REEL_RADIUS - 2}
              y2={200}
              stroke="#5a3a1a"
              strokeWidth="1"
            />
            <line
              x1={80}
              y1={200 - LINE_REEL_RADIUS + 2}
              x2={80}
              y2={200 + LINE_REEL_RADIUS - 2}
              stroke="#5a3a1a"
              strokeWidth="1"
            />
          </motion.g>
        </g>
      </g>
    );
  };

  const renderWood = () => {
    const pieces = [];
    const separation = isCutSeparated ? 3 : 0;

    if (isCutSeparated && currentLine) {
      const cutX = (currentLine.startX + currentLine.endX) / 2;
      const leftWidth = cutX - woodX;
      const rightWidth = woodWidth - leftWidth;

      pieces.push(
        <motion.rect
          key="left"
          x={woodX - separation}
          y={woodY}
          width={leftWidth}
          height={WOOD_HEIGHT}
          fill="url(#woodGrain)"
          stroke="#8b7355"
          strokeWidth="1"
          initial={{ x: woodX }}
          animate={{ x: woodX - separation }}
          transition={{ duration: 0.3 }}
        />
      );
      pieces.push(
        <motion.rect
          key="right"
          x={woodX + leftWidth + separation}
          y={woodY}
          width={rightWidth}
          height={WOOD_HEIGHT}
          fill="url(#woodGrain)"
          stroke="#8b7355"
          strokeWidth="1"
          initial={{ x: woodX + leftWidth }}
          animate={{ x: woodX + leftWidth + separation }}
          transition={{ duration: 0.3 }}
        />
      );
    } else {
      pieces.push(
        <rect
          key="single"
          x={woodX}
          y={woodY}
          width={woodWidth}
          height={WOOD_HEIGHT}
          fill="url(#woodGrain)"
          stroke="#8b7355"
          strokeWidth="1"
        />
      );
    }

    return pieces;
  };

  const renderMarkers = () => {
    return markers.map((marker) => (
      <motion.g key={marker.id}>
        <motion.circle
          className="marker-dot"
          cx={marker.x}
          cy={marker.y}
          r={MARKER_RADIUS}
          fill={flashingMarkerId === marker.id ? '#fff' : '#333'}
          stroke="#1a1a1a"
          strokeWidth="1"
          style={{ cursor: tool === 'marker' ? 'grab' : 'default' }}
          onMouseDown={(e) => handleMarkerMouseDown(e, marker.id)}
          animate={flashingMarkerId === marker.id ? {
            scale: [1, 1.3, 1],
            transition: { duration: 0.1 }
          } : {}}
        />
        <circle
          cx={marker.x}
          cy={marker.y}
          r={2}
          fill="#666"
          pointerEvents="none"
        />
      </motion.g>
    ));
  };

  const renderMarkerLines = () => {
    if (markers.length < 2) return null;

    const lines = [];
    for (let i = 0; i < markers.length - 1; i++) {
      lines.push(
        <line
          key={`ml-${i}`}
          x1={markers[i].x}
          y1={markers[i].y}
          x2={markers[i + 1].x}
          y2={markers[i + 1].y}
          stroke="#fff"
          strokeWidth="2"
          strokeDasharray="6,4"
          opacity="0.8"
          pointerEvents="none"
        />
      );
    }
    return lines;
  };

  const renderCutButton = () => {
    if (tool !== 'cut' || markers.length < 2 || !currentLine || isCutSeparated) return null;

    const midX = (markers[0].x + markers[markers.length - 1].x) / 2;
    const midY = woodY + WOOD_HEIGHT / 2;

    return (
      <g>
        <motion.button
          style={{
            position: 'absolute',
            left: midX - 40,
            top: midY - 20,
            width: 80,
            height: 40,
            borderRadius: 8,
            background: 'linear-gradient(180deg, #ff6b35 0%, #d4380d 100%)',
            border: '2px solid #8b0000',
            color: '#fff',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: 14,
            boxShadow: '0 4px 12px rgba(212, 56, 13, 0.5)',
            zIndex: 10
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCut}
        >
          🔥 切割
        </motion.button>
      </g>
    );
  };

  const renderCutParticles = () => {
    if (!showCutParticles) return null;

    return cutParticles.map((particle) => (
      <motion.circle
        key={particle.id}
        cx={particle.x}
        cy={particle.y}
        r={particle.size}
        fill={`url(#fireGradient)`}
        initial={{ opacity: 0, scale: 0 }}
        animate={{
          opacity: [0, 1, 0.8, 0],
          scale: [0, 1.2, 1, 0.5],
          y: [0, -10, -20, -30]
        }}
        transition={{
          duration: 0.6,
          delay: particle.delay,
          repeat: Infinity,
          repeatDelay: 0.2
        }}
      />
    ));
  };

  const renderAngleDisplay = () => {
    if (!currentLine) return null;

    const angleColor = getAngleColor(currentLine.angle);
    const displayAngle = currentLine.angle >= 0 ? currentLine.angle : currentLine.angle + 360;

    return (
      <g>
        <rect
          x={woodX + woodWidth - 110}
          y={woodY + WOOD_HEIGHT - 35}
          width="100"
          height="28"
          fill="rgba(0,0,0,0.7)"
          rx="4"
        />
        <text
          x={woodX + woodWidth - 60}
          y={woodY + WOOD_HEIGHT - 16}
          fill={angleColor}
          fontSize="16"
          fontWeight="bold"
          textAnchor="middle"
          fontFamily="monospace"
        >
          {displayAngle.toFixed(1)}°
        </text>
      </g>
    );
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#d2b48c',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        onClick={handleSvgClick}
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient id="woodGrain" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#deb887" />
            <stop offset="20%" stopColor="#d2a679" />
            <stop offset="40%" stopColor="#c9956c" />
            <stop offset="60%" stopColor="#deb887" />
            <stop offset="80%" stopColor="#d2a679" />
            <stop offset="100%" stopColor="#c9956c" />
          </linearGradient>
          <linearGradient id="woodGrainLines" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="50%" stopColor="rgba(139,115,85,0.2)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <linearGradient id="copperGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d4a574" />
            <stop offset="50%" stopColor="#b87333" />
            <stop offset="100%" stopColor="#8b5a2b" />
          </linearGradient>
          <linearGradient id="fireGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffa500" />
            <stop offset="50%" stopColor="#ff6347" />
            <stop offset="100%" stopColor="#ff4500" />
          </linearGradient>
        </defs>

        {renderGrid()}
        {renderWood()}
        {renderInkPot()}

        {isDraggingLine && tempLineEnd && (
          <line
            x1={inkPotStart.x}
            y1={inkPotStart.y}
            x2={tempLineEnd.x}
            y2={tempLineEnd.y}
            stroke="#1a1a1a"
            strokeWidth="2"
            strokeDasharray="8,4"
            opacity="0.6"
          />
        )}

        <AnimatePresence>
          {isLineAnimating && tempLineEnd && (
            <motion.line
              x1={inkPotStart.x}
              y1={inkPotStart.y}
              x2={tempLineEnd.x}
              y2={tempLineEnd.y}
              stroke="#1a1a1a"
              strokeWidth="3"
              initial={{ opacity: 1 }}
              animate={{
                y: [0, -8, 8, -4, 4, 0],
                transition: {
                  duration: 0.2,
                  yoyo: Infinity,
                  ease: 'easeInOut'
                }
              }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>

        {currentLine && currentLine.isReal && (
          <line
            x1={currentLine.startX}
            y1={currentLine.startY}
            x2={currentLine.endX}
            y2={currentLine.endY}
            stroke="#1a1a1a"
            strokeWidth="2"
            opacity="0.9"
          />
        )}

        {renderMarkerLines()}
        {renderMarkers()}
        {renderCutParticles()}
        {renderAngleDisplay()}
      </svg>

      {renderCutButton()}

      {isCutSeparated && currentLine && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            background: 'rgba(0,0,0,0.8)',
            borderRadius: 12,
            color: '#fff',
            fontSize: 18,
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}
        >
          <span>平整度评分:</span>
          <span style={{
            fontSize: 24,
            color: calculateFlatnessScore(currentLine.angle) === 'A' ? '#00ff00' :
                   calculateFlatnessScore(currentLine.angle) === 'B' ? '#ffff00' :
                   calculateFlatnessScore(currentLine.angle) === 'C' ? '#ff8800' : '#ff0000'
          }}>
            {calculateFlatnessScore(currentLine.angle)}级
          </span>
        </motion.div>
      )}
    </div>
  );
};

export default Workbench;
