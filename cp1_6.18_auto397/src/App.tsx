import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { ControlPanel } from './components/ControlPanel';
import { CelestialBody } from './components/CelestialBody';
import { useSimulationStore, type CelestialBody as CelestialBodyType } from './store/SimulationStore';
import { simulateStep, type PhysicsConfig } from './engine/PhysicsEngine';

interface CreateState {
  isCreating: boolean;
  type: 'star' | 'planet';
  startPos: { x: number; y: number };
  currentPos: { x: number; y: number };
}

interface DragState {
  isDragging: boolean;
  bodyId: string;
  startPos: { x: number; y: number };
  startVelocity: { x: number; y: number };
}

function StarField() {
  return (
    <Stars
      radius={300}
      depth={50}
      count={1500}
      factor={2}
      saturation={0}
      fade
      speed={0.1}
    />
  );
}

function Background() {
  return (
    <mesh position={[600, 400, -100]}>
      <planeGeometry args={[1200, 800]} />
      <meshBasicMaterial color="#0A0A1A" />
    </mesh>
  );
}

interface SimulationCanvasProps {
  createType: 'star' | 'planet';
}

function SimulationCanvas({ createType }: SimulationCanvasProps) {
  const {
    bodies,
    mode,
    speed,
    selectedBodyId,
    setSelectedBodyId,
    updateBody,
    createBody,
    setBodies,
    setFps,
    canvasWidth,
    canvasHeight,
    maxBodies,
  } = useSimulationStore();

  const [createState, setCreateState] = useState<CreateState | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);

  const highQuality = bodies.length <= 10;

  const { camera, raycaster, mouse, size, gl } = useThree();
  cameraRef.current = camera as THREE.OrthographicCamera;

  const getWorldPosition = useCallback((clientX: number, clientY: number, canvasRect: DOMRect): { x: number; y: number } | null => {
    if (!cameraRef.current) return null;

    const x = ((clientX - canvasRect.left) / canvasRect.width) * 2 - 1;
    const y = -((clientY - canvasRect.top) / canvasRect.height) * 2 + 1;

    mouseRef.current.set(x, y);
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const intersect = new THREE.Vector3();
    raycasterRef.current.ray.intersectPlane(plane, intersect);

    if (intersect) {
      return { x: intersect.x, y: intersect.y };
    }
    return null;
  }, []);

  const handleCanvasPointerDown = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (dragState || createState) return;

    const domElement = gl.domElement;
    const rect = domElement.getBoundingClientRect();
    const pos = getWorldPosition(event.clientX, event.clientY, rect);
    if (!pos) return;

    setCreateState({
      isCreating: true,
      type: createType,
      startPos: pos,
      currentPos: pos,
    });
  }, [dragState, createState, createType, gl, getWorldPosition]);

  const handleCanvasPointerMove = useCallback((event: PointerEvent) => {
    const domElement = gl.domElement;
    const rect = domElement.getBoundingClientRect();
    const pos = getWorldPosition(event.clientX, event.clientY, rect);
    if (!pos) return;

    if (createState?.isCreating) {
      setCreateState((prev) => prev ? { ...prev, currentPos: pos } : null);
    }

    if (dragState?.isDragging) {
      const dx = pos.x - dragState.startPos.x;
      const dy = pos.y - dragState.startPos.y;

      if (Math.abs(dx) > 20 || Math.abs(dy) > 20) {
        const newVelocity = {
          x: dragState.startVelocity.x + dx * 0.02,
          y: dragState.startVelocity.y + dy * 0.02,
        };
        updateBody(dragState.bodyId, {
          velocity: newVelocity,
          previousPosition: {
            x: pos.x - newVelocity.x * (1 / 60),
            y: pos.y - newVelocity.y * (1 / 60),
          },
        });
      } else {
        updateBody(dragState.bodyId, {
          position: pos,
          previousPosition: pos,
        });
      }
    }
  }, [createState, dragState, gl, getWorldPosition, updateBody]);

  const handleCanvasPointerUp = useCallback((event: PointerEvent) => {
    const domElement = gl.domElement;
    const rect = domElement.getBoundingClientRect();

    if (createState?.isCreating) {
      const pos = getWorldPosition(event.clientX, event.clientY, rect);
      if (pos && bodies.length < maxBodies) {
        const velocity = {
          x: (pos.x - createState.startPos.x) * 0.01,
          y: (pos.y - createState.startPos.y) * 0.01,
        };
        const dragDistance = Math.sqrt(
          Math.pow(pos.x - createState.startPos.x, 2) +
          Math.pow(pos.y - createState.startPos.y, 2)
        );
        const mass = createState.type === 'star'
          ? 500 + dragDistance * 2
          : 1 + dragDistance * 0.05;

        createBody(createState.type, createState.startPos, velocity, mass);
      }
      setCreateState(null);
    }

    if (dragState?.isDragging) {
      setDragState(null);
    }
  }, [createState, dragState, gl, getWorldPosition, bodies.length, maxBodies, createBody]);

  const handleBodyDragStart = useCallback((id: string, event: ThreeEvent<PointerEvent>) => {
    const body = bodies.find((b) => b.id === id);
    if (!body) return;

    event.stopPropagation();

    setDragState({
      isDragging: true,
      bodyId: id,
      startPos: { ...body.position },
      startVelocity: { ...body.velocity },
    });
  }, [bodies]);

  const handleBodyDragEnd = useCallback(() => {
    if (dragState) {
      setDragState(null);
    }
  }, [dragState]);

  const handleSelectBody = useCallback((id: string) => {
    setSelectedBodyId(id);
  }, [setSelectedBodyId]);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => handleCanvasPointerMove(e);
    const handlePointerUp = (e: PointerEvent) => handleCanvasPointerUp(e);

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handleCanvasPointerMove, handleCanvasPointerUp]);

  useFrame((_, delta) => {
    frameCountRef.current++;
    const now = performance.now();

    if (now - lastTimeRef.current >= 500) {
      const fps = (frameCountRef.current * 1000) / (now - lastTimeRef.current);
      setFps(Math.round(fps));
      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }

    if (bodies.length > 0 && !dragState?.isDragging) {
      const config: PhysicsConfig = {
        mode,
        speed,
        canvasWidth,
        canvasHeight,
      };

      const steps = Math.max(1, Math.round(speed));
      let updatedBodies = [...bodies];

      for (let i = 0; i < steps; i++) {
        updatedBodies = simulateStep(updatedBodies, config);
      }

      setBodies(updatedBodies);
    }
  });

  const createPreviewArrow = useMemo(() => {
    if (!createState?.isCreating) return null;

    const dx = createState.currentPos.x - createState.startPos.x;
    const dy = createState.currentPos.y - createState.startPos.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length < 5) return null;

    const shape = new THREE.Shape();
    shape.moveTo(0, -3);
    shape.lineTo(length - 10, -3);
    shape.lineTo(length - 10, -6);
    shape.lineTo(length, 0);
    shape.lineTo(length - 10, 6);
    shape.lineTo(length - 10, 3);
    shape.lineTo(0, 3);
    shape.lineTo(0, -3);

    const geometry = new THREE.ShapeGeometry(shape);
    geometry.rotateZ(Math.atan2(dy, dx));

    return (
      <mesh
        geometry={geometry}
        position={[createState.startPos.x, createState.startPos.y, 5]}
      >
        <meshBasicMaterial
          color={createState.type === 'star' ? '#FF8800' : '#44AAFF'}
          transparent
          opacity={0.6}
        />
      </mesh>
    );
  }, [createState]);

  const createPreviewCircle = useMemo(() => {
    if (!createState?.isCreating) return null;

    const dx = createState.currentPos.x - createState.startPos.x;
    const dy = createState.currentPos.y - createState.startPos.y;
    const dragDistance = Math.sqrt(dx * dx + dy * dy);
    const radius = createState.type === 'star'
      ? 30
      : Math.max(10, Math.min(25, 10 + dragDistance * 0.03));

    return (
      <mesh
        position={[createState.startPos.x, createState.startPos.y, 3]}
      >
        <circleGeometry args={[radius, 32]} />
        <meshBasicMaterial
          color={createState.type === 'star' ? '#FF8800' : '#44AAFF'}
          transparent
          opacity={0.4}
        />
      </mesh>
    );
  }, [createState]);

  return (
    <group onPointerDown={handleCanvasPointerDown}>
      <Background />
      <StarField />

      {bodies.map((body) => (
        <CelestialBody
          key={body.id}
          body={body}
          isSelected={selectedBodyId === body.id}
          highQuality={highQuality}
          onSelect={handleSelectBody}
          onDragStart={handleBodyDragStart}
          onDragEnd={handleBodyDragEnd}
        />
      ))}

      {createPreviewCircle}
      {createPreviewArrow}
    </group>
  );
}

interface InfoBarProps {
  createType: 'star' | 'planet';
  onCreateTypeChange: (type: 'star' | 'planet') => void;
}

function InfoBar({ createType, onCreateTypeChange }: InfoBarProps) {
  const { fps, bodies } = useSimulationStore();
  const highQuality = bodies.length <= 10;

  return (
    <div className="info-bar">
      <div className="info-item">
        <span className="info-label">FPS</span>
        <span className={`info-value ${fps >= 55 ? 'good' : fps >= 30 ? 'warn' : 'bad'}`}>
          {fps}
        </span>
      </div>
      <div className="info-divider" />
      <div className="info-item">
        <span className="info-label">天体数量</span>
        <span className="info-value">{bodies.length} / 12</span>
      </div>
      <div className="info-divider" />
      <div className="info-item">
        <span className="info-label">渲染质量</span>
        <span className={`info-value ${highQuality ? 'good' : 'warn'}`}>
          {highQuality ? '高质量' : '性能模式'}
        </span>
      </div>
      <div className="info-divider" />
      <div className="info-item creation-type">
        <span className="info-label">创建类型</span>
        <div className="type-buttons">
          <button
            className={`type-btn ${createType === 'planet' ? 'active' : ''}`}
            onClick={() => onCreateTypeChange('planet')}
          >
            行星
          </button>
          <button
            className={`type-btn ${createType === 'star' ? 'active' : ''}`}
            onClick={() => onCreateTypeChange('star')}
          >
            恒星
          </button>
        </div>
      </div>

      <style>{`
        .info-bar {
          height: 40px;
          background: #0A0A1A;
          display: flex;
          align-items: center;
          padding: 0 20px;
          gap: 16px;
          color: #E0E0FF;
          font-family: 'Segoe UI', system-ui, sans-serif;
          font-size: 12px;
          border-top: 1px solid rgba(0, 255, 170, 0.2);
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .info-label {
          color: rgba(224, 224, 255, 0.5);
          font-weight: 500;
        }

        .info-value {
          font-weight: 600;
          font-variant-numeric: tabular-nums;
        }

        .info-value.good {
          color: #00FFAA;
        }

        .info-value.warn {
          color: #FFAA00;
        }

        .info-value.bad {
          color: #FF6666;
        }

        .info-divider {
          width: 1px;
          height: 20px;
          background: rgba(255, 255, 255, 0.1);
        }

        .creation-type {
          margin-left: auto;
        }

        .type-buttons {
          display: flex;
          gap: 4px;
        }

        .type-btn {
          padding: 4px 10px;
          font-size: 11px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          color: rgba(224, 224, 255, 0.6);
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
        }

        .type-btn:hover {
          background: rgba(0, 255, 170, 0.1);
          border-color: rgba(0, 255, 170, 0.3);
          color: #00FFAA;
        }

        .type-btn.active {
          background: rgba(0, 255, 170, 0.2);
          border-color: #00FFAA;
          color: #00FFAA;
        }

        @media (max-width: 768px) {
          .info-bar {
            flex-wrap: wrap;
            height: auto;
            padding: 10px 16px;
            gap: 10px;
          }

          .creation-type {
            margin-left: 0;
            width: 100%;
            justify-content: center;
          }

          .info-divider:nth-child(4) {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

export default function App() {
  const { setCanvasSize } = useSimulationStore();
  const [createType, setCreateType] = useState<'star' | 'planet'>('planet');

  useEffect(() => {
    setCanvasSize(1200, 800);
  }, [setCanvasSize]);

  return (
    <div className="app-container">
      <div className="main-content">
        <ControlPanel />
        <div className="canvas-wrapper">
          <Canvas
            orthographic
            camera={{
              left: 0,
              right: 1200,
              top: 800,
              bottom: 0,
              near: 0.1,
              far: 5000,
              position: [600, 400, 1000],
            }}
            gl={{ antialias: true }}
            style={{ background: '#0A0A1A' }}
          >
            <SimulationCanvas createType={createType} />
          </Canvas>
        </div>
      </div>
      <InfoBar createType={createType} onCreateTypeChange={setCreateType} />

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html, body, #root {
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        body {
          background: #0A0A1A;
          color: #E0E0FF;
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        }

        .app-container {
          display: flex;
          flex-direction: column;
          width: 100vw;
          height: 100vh;
          background: #0A0A1A;
        }

        .main-content {
          flex: 1;
          display: flex;
          gap: 16px;
          padding: 16px;
          overflow: hidden;
        }

        .canvas-wrapper {
          flex: 1;
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 0 40px rgba(0, 255, 170, 0.1), inset 0 0 60px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(0, 255, 170, 0.15);
        }

        .canvas-wrapper canvas {
          display: block;
          width: 100% !important;
          height: 100% !important;
          cursor: crosshair;
        }

        @media (max-width: 768px) {
          .main-content {
            flex-direction: column;
            padding: 12px;
            gap: 12px;
          }

          .canvas-wrapper {
            flex: 1;
            min-height: 300px;
          }
        }
      `}</style>
    </div>
  );
}
