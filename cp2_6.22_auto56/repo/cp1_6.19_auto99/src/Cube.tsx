import { useState, useEffect, useRef, useCallback } from 'react';
import type { Axis, Layer, Direction, Move } from './Scrambler';

type FaceColor = 'white' | 'yellow' | 'red' | 'orange' | 'blue' | 'green' | 'inner';

interface CubieState {
  id: string;
  x: number;
  y: number;
  z: number;
  faces: {
    front: FaceColor;
    back: FaceColor;
    right: FaceColor;
    left: FaceColor;
    top: FaceColor;
    bottom: FaceColor;
  };
}

interface CubeProps {
  onMoveComplete: () => void;
  isAnimating: boolean;
  executeMoveRef: React.MutableRefObject<((move: Move, callback?: () => void) => void) | null>;
  resetTrigger: number;
}

const CUBIE_SIZE = 96;
const GAP = 4;
const STEP = CUBIE_SIZE + GAP;

function createInitialCubies(): CubieState[] {
  const cubies: CubieState[] = [];
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        cubies.push({
          id: `${x}_${y}_${z}`,
          x, y, z,
          faces: {
            front: z === 1 ? 'green' : 'inner',
            back: z === -1 ? 'blue' : 'inner',
            right: x === 1 ? 'red' : 'inner',
            left: x === -1 ? 'orange' : 'inner',
            top: y === 1 ? 'white' : 'inner',
            bottom: y === -1 ? 'yellow' : 'inner',
          }
        });
      }
    }
  }
  return cubies;
}

function rotateCubieFaces(cubie: CubieState, axis: Axis, direction: Direction): CubieState {
  const f = { ...cubie.faces };
  if (axis === 'x') {
    if (direction === 1) {
      return { ...cubie, faces: { ...f, top: f.front, front: f.bottom, bottom: f.back, back: f.top } };
    } else {
      return { ...cubie, faces: { ...f, top: f.back, back: f.bottom, bottom: f.front, front: f.top } };
    }
  } else if (axis === 'y') {
    if (direction === 1) {
      return { ...cubie, faces: { ...f, front: f.right, right: f.back, back: f.left, left: f.front } };
    } else {
      return { ...cubie, faces: { ...f, front: f.left, left: f.back, back: f.right, right: f.front } };
    }
  } else {
    if (direction === 1) {
      return { ...cubie, faces: { ...f, top: f.left, left: f.bottom, bottom: f.right, right: f.top } };
    } else {
      return { ...cubie, faces: { ...f, top: f.right, right: f.bottom, bottom: f.left, left: f.top } };
    }
  }
}

function rotateCubiePosition(cubie: CubieState, axis: Axis, direction: Direction): CubieState {
  let { x, y, z } = cubie;
  if (axis === 'x') {
    if (direction === 1) {
      const newY = -z;
      const newZ = y;
      y = newY; z = newZ;
    } else {
      const newY = z;
      const newZ = -y;
      y = newY; z = newZ;
    }
  } else if (axis === 'y') {
    if (direction === 1) {
      const newX = z;
      const newZ = -x;
      x = newX; z = newZ;
    } else {
      const newX = -z;
      const newZ = x;
      x = newX; z = newZ;
    }
  } else {
    if (direction === 1) {
      const newX = -y;
      const newY = x;
      x = newX; y = newY;
    } else {
      const newX = y;
      const newY = -x;
      x = newX; y = newY;
    }
  }
  return { ...cubie, x, y, z };
}

function playClickSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContextClass();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.frequency.value = 1000;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.05);
    setTimeout(() => audioCtx.close(), 100);
  } catch (e) {
    // audio not available
  }
}

const Cube: React.FC<CubeProps> = ({ onMoveComplete, isAnimating, executeMoveRef, resetTrigger }) => {
  const [cubies, setCubies] = useState<CubieState[]>(createInitialCubies());
  const [rotation, setRotation] = useState({ x: -25, y: -35 });
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedLayer, setSelectedLayer] = useState<{ axis: Axis; layer: Layer } | null>(null);
  const [dragAngle, setDragAngle] = useState(0);
  const [rotatingLayer, setRotatingLayer] = useState<{ axis: Axis; layer: Layer; angle: number } | null>(null);
  const [isAnimatingInternal, setIsAnimatingInternal] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; axis: Axis; layer: Layer } | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    setCubies(createInitialCubies());
    setRotation({ x: -25, y: -35 });
    setSelectedLayer(null);
    setDragAngle(0);
    setRotatingLayer(null);
    setIsAnimatingInternal(false);
  }, [resetTrigger]);

  useEffect(() => {
    if (!isHovering && !isDragging) {
      let lastTime = performance.now();
      const animate = (now: number) => {
        const delta = (now - lastTime) / 1000;
        lastTime = now;
        setRotation(r => ({
          x: r.x + 0.5 * delta,
          y: r.y + 0.5 * delta
        }));
        rafRef.current = requestAnimationFrame(animate);
      };
      rafRef.current = requestAnimationFrame(animate);
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }
  }, [isHovering, isDragging]);

  const performLayerRotation = useCallback((axis: Axis, layer: Layer, direction: Direction, callback?: () => void) => {
    if (isAnimatingInternal) return;
    setIsAnimatingInternal(true);

    const startAngle = 0;
    const targetAngle = 90 * direction;
    const duration = 200;
    const startTime = performance.now();

    setRotatingLayer({ axis, layer, angle: 0 });

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentAngle = startAngle + (targetAngle - startAngle) * eased;

      setRotatingLayer({ axis, layer, angle: currentAngle });

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCubies(prev => prev.map(c => {
          const isInLayer =
            (axis === 'x' && c.x === layer) ||
            (axis === 'y' && c.y === layer) ||
            (axis === 'z' && c.z === layer);
          if (!isInLayer) return c;
          let rotated = rotateCubiePosition(c, axis, direction);
          rotated = rotateCubieFaces(rotated, axis, direction);
          return rotated;
        }));
        setRotatingLayer(null);
        setIsAnimatingInternal(false);
        playClickSound();
        if (callback) callback();
      }
    };

    requestAnimationFrame(animate);
  }, [isAnimatingInternal]);

  useEffect(() => {
    executeMoveRef.current = (move: Move, callback?: () => void) => {
      performLayerRotation(move.axis, move.layer, move.direction, callback);
    };
  }, [performLayerRotation, executeMoveRef]);

  const getLayerFromPoint = (clientX: number, clientY: number): { axis: Axis; layer: Layer } | null => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const size = Math.min(rect.width, rect.height) / 2;

    if (Math.abs(dx) > size || Math.abs(dy) > size) return null;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const threshold = size * 0.3;

    if (absDx < threshold && absDy < threshold) {
      return { axis: 'z', layer: dy < 0 ? 1 : -1 };
    }

    const ratio = size / 3;
    let layerX: Layer = 0;
    if (dx < -ratio) layerX = -1;
    else if (dx > ratio) layerX = 1;

    let layerY: Layer = 0;
    if (dy < -ratio) layerY = 1;
    else if (dy > ratio) layerY = -1;

    if (absDx > absDy) {
      return { axis: 'y', layer: layerY };
    } else {
      return { axis: 'x', layer: layerX };
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isAnimating || isAnimatingInternal) return;
    e.preventDefault();
    const layerInfo = getLayerFromPoint(e.clientX, e.clientY);
    if (layerInfo) {
      setIsDragging(true);
      setSelectedLayer(layerInfo);
      dragStartRef.current = { x: e.clientX, y: e.clientY, ...layerInfo };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    const start = dragStartRef.current;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    let angle = 0;

    if (start.axis === 'x') {
      angle = dx * 0.8;
    } else if (start.axis === 'y') {
      angle = dy * 0.8;
    } else {
      angle = (dx - dy) * 0.5;
    }

    angle = Math.max(-135, Math.min(135, angle));
    setDragAngle(angle);
  };

  const handleMouseUp = () => {
    if (!isDragging || !dragStartRef.current) return;
    const start = dragStartRef.current;
    const angle = dragAngle;

    let direction: Direction = 1;
    if (Math.abs(angle) > 45) {
      direction = angle > 0 ? 1 : -1;
      performLayerRotation(start.axis, start.layer as Layer, direction, () => {
        onMoveComplete();
      });
    }

    setIsDragging(false);
    setSelectedLayer(null);
    setDragAngle(0);
    dragStartRef.current = null;
  };

  const getCubieTransform = (cubie: CubieState): string => {
    let tx = cubie.x * STEP;
    let ty = -cubie.y * STEP;
    let tz = cubie.z * STEP;

    if (rotatingLayer) {
      const isInLayer =
        (rotatingLayer.axis === 'x' && cubie.x === rotatingLayer.layer) ||
        (rotatingLayer.axis === 'y' && cubie.y === rotatingLayer.layer) ||
        (rotatingLayer.axis === 'z' && cubie.z === rotatingLayer.layer);
      if (isInLayer) {
        const rad = (rotatingLayer.angle * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        if (rotatingLayer.axis === 'x') {
          const ny = ty * cos - tz * sin;
          const nz = ty * sin + tz * cos;
          ty = ny; tz = nz;
        } else if (rotatingLayer.axis === 'y') {
          const nx = tx * cos + tz * sin;
          const nz = -tx * sin + tz * cos;
          tx = nx; tz = nz;
        } else {
          const nx = tx * cos - ty * sin;
          const ny = tx * sin + ty * cos;
          tx = nx; ty = ny;
        }
      }
    }

    if (isDragging && selectedLayer) {
      const isInLayer =
        (selectedLayer.axis === 'x' && cubie.x === selectedLayer.layer) ||
        (selectedLayer.axis === 'y' && cubie.y === selectedLayer.layer) ||
        (selectedLayer.axis === 'z' && cubie.z === selectedLayer.layer);
      if (isInLayer) {
        const rad = (dragAngle * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        if (selectedLayer.axis === 'x') {
          const ny = ty * cos - tz * sin;
          const nz = ty * sin + tz * cos;
          ty = ny; tz = nz;
        } else if (selectedLayer.axis === 'y') {
          const nx = tx * cos + tz * sin;
          const nz = -tx * sin + tz * cos;
          tx = nx; tz = nz;
        } else {
          const nx = tx * cos - ty * sin;
          const ny = tx * sin + ty * cos;
          tx = nx; ty = ny;
        }
      }
    }

    return `translate3d(${tx}px, ${ty}px, ${tz}px)`;
  };

  const isCubieHighlighted = (cubie: CubieState): boolean => {
    if (!selectedLayer || !isDragging) return false;
    return (
      (selectedLayer.axis === 'x' && cubie.x === selectedLayer.layer) ||
      (selectedLayer.axis === 'y' && cubie.y === selectedLayer.layer) ||
      (selectedLayer.axis === 'z' && cubie.z === selectedLayer.layer)
    );
  };

  return (
    <div
      className="cube-container"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        if (isDragging) handleMouseUp();
      }}
    >
      <div
        ref={containerRef}
        className="cube-wrapper"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div
          className="cube-scene"
          style={{
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`
          }}
        >
          {cubies.map(cubie => (
            <div
              key={cubie.id}
              className={`cubie ${isCubieHighlighted(cubie) ? 'highlighted' : ''}`}
              style={{
                transform: getCubieTransform(cubie),
                left: `calc(50% - ${CUBIE_SIZE / 2}px)`,
                top: `calc(50% - ${CUBIE_SIZE / 2}px)`,
                transition: isDragging || rotatingLayer ? 'none' : 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              <div className={`cubie-face face-front color-${cubie.faces.front}`} />
              <div className={`cubie-face face-back color-${cubie.faces.back}`} />
              <div className={`cubie-face face-right color-${cubie.faces.right}`} />
              <div className={`cubie-face face-left color-${cubie.faces.left}`} />
              <div className={`cubie-face face-top color-${cubie.faces.top}`} />
              <div className={`cubie-face face-bottom color-${cubie.faces.bottom}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Cube;
