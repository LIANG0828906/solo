import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import {
  useSculptureStore,
  LightLine,
  Point3D,
} from '../store/useSculptureStore';
import {
  createLineRender,
  LineRenderResult,
  createTubeLine,
  createCurveFromPoints,
  createUnifiedParticleSystem,
  UnifiedParticleSystem,
  PARTICLE_COUNT_PER_LINE,
  TaperedTubeGeometry,
} from '../utils/LineRenderer';

const SAMPLING_INTERVAL = 1000 / 30;
const DISSOLVE_DURATION = 800;
const MAX_LINES = 50;

interface LineInstanceProps {
  line: LightLine;
  isDissolving: boolean;
  particleSystem: UnifiedParticleSystem;
}

function LineInstance({ line, isDissolving, particleSystem }: LineInstanceProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const dissolveStartRef = useRef<number | null>(null);
  const lineRenderRef = useRef<LineRenderResult | null>(null);

  const lineRender = useMemo(() => {
    const { mesh } = createTubeLine(line.points, line.color);
    const curve = createCurveFromPoints(line.points);
    const particleData = particleSystem.addLine(curve, line.color, line.createdAt);
    
    if (!particleData) {
      const tubeGeo = mesh.geometry as TaperedTubeGeometry;
      tubeGeo.dispose();
      (mesh.material as THREE.Material).dispose();
      return null;
    }

    const dispose = () => {
      const tubeGeo = mesh.geometry as TaperedTubeGeometry;
      tubeGeo.dispose();
      (mesh.material as THREE.Material).dispose();
      particleSystem.removeLine(particleData);
    };

    return { mesh, curve, particleData, dispose };
  }, [line, particleSystem]);

  useEffect(() => {
    lineRenderRef.current = lineRender || null;
    return () => {
      if (lineRenderRef.current) {
        lineRenderRef.current.dispose();
      }
    };
  }, [lineRender]);

  useFrame(() => {
    if (!lineRender || !meshRef.current) return;

    if (isDissolving) {
      if (dissolveStartRef.current === null) {
        dissolveStartRef.current = performance.now();
      }

      const elapsed = performance.now() - dissolveStartRef.current;
      const progress = Math.min(1, elapsed / DISSOLVE_DURATION);

      const meshMaterial = meshRef.current.material as THREE.MeshStandardMaterial;
      meshMaterial.opacity = 1 - progress;

      const tubeGeo = meshRef.current.geometry as TaperedTubeGeometry;
      tubeGeo.applyDissolve(progress);
    }
  });

  if (!lineRender) return null;

  return <primitive object={lineRender.mesh} ref={meshRef} />;
}

interface CurrentDrawingLineProps {
  points: Point3D[];
  color: string;
  particleSystem: UnifiedParticleSystem;
}

function CurrentDrawingLine({ points, color, particleSystem }: CurrentDrawingLineProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lineRenderRef = useRef<LineRenderResult | null>(null);

  const lineRender = useMemo(() => {
    if (points.length < 2) return null;
    if (lineRenderRef.current) {
      lineRenderRef.current.dispose();
    }
    const result = createLineRender(points, color as any, Date.now(), particleSystem);
    lineRenderRef.current = result || null;
    return result;
  }, [points, color, particleSystem]);

  useEffect(() => {
    return () => {
      if (lineRenderRef.current) {
        lineRenderRef.current.dispose();
      }
    };
  }, []);

  if (!lineRender) return null;

  return <primitive object={lineRender.mesh} ref={meshRef} />;
}

function SceneContent({ backgroundColor }: { backgroundColor: string }) {
  const {
    lines,
    isDrawing,
    currentPoints,
    currentColor,
    isDissolving,
    startDrawing,
    addPoint,
    finishDrawing,
    clearAll,
    resetAfterDissolve,
  } = useSculptureStore();

  const { camera, gl, scene } = useThree();

  useEffect(() => {
    if (scene) {
      const startColor = new THREE.Color(scene.background as THREE.Color);
      const endColor = new THREE.Color(backgroundColor);
      const startTime = performance.now();
      const duration = 500;

      const animate = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(1, elapsed / duration);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        const currentColor = startColor.clone().lerp(endColor, easeProgress);
        scene.background = currentColor;
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      animate();
    }
  }, [backgroundColor, scene]);

  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const lastSampleTime = useRef(0);
  const isMouseDown = useRef(false);
  const particleSystemRef = useRef<UnifiedParticleSystem | null>(null);
  const dissolveStartRef = useRef<number | null>(null);
  const [, forceUpdate] = useState(0);

  if (!particleSystemRef.current) {
    particleSystemRef.current = createUnifiedParticleSystem();
  }

  const particleSystem = useMemo(() => {
    if (!particleSystemRef.current) {
      particleSystemRef.current = createUnifiedParticleSystem();
    }
    return particleSystemRef.current!;
  }, []);

  useFrame(() => {
    if (particleSystem && !isDissolving) {
      particleSystem.update(performance.now());
    }

    if (isDissolving && particleSystem) {
      if (dissolveStartRef.current === null) {
        dissolveStartRef.current = performance.now();
      }

      const elapsed = performance.now() - dissolveStartRef.current;
      const progress = Math.min(1, elapsed / DISSOLVE_DURATION);

      const opacity = 1 - progress;
      const scale = 1 - progress * 0.5;

      particleSystem.setOpacity(opacity);
      particleSystem.setScale(scale);

      if (progress >= 1) {
        particleSystem.dispose();
        particleSystemRef.current = null;
        resetAfterDissolve();
        dissolveStartRef.current = null;
        forceUpdate((n) => n + 1);
      }
    }
  });

  const get3DPosition = useCallback(
    (clientX: number, clientY: number): Point3D | null => {
      const rect = gl.domElement.getBoundingClientRect();
      mouse.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.current.setFromCamera(mouse.current, camera);

      const planeNormal = camera.getWorldDirection(new THREE.Vector3()).negate();
      const planePoint = new THREE.Vector3(0, 0, 0);
      const drawPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(
        planeNormal,
        planePoint
      );

      const intersection = new THREE.Vector3();
      raycaster.current.ray.intersectPlane(drawPlane, intersection);

      if (intersection) {
        return { x: intersection.x, y: intersection.y, z: intersection.z };
      }
      return null;
    },
    [camera, gl]
  );

  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      if (isDissolving) return;
      if (e.button !== 0) return;

      const point = get3DPosition(e.clientX, e.clientY);
      if (point) {
        isMouseDown.current = true;
        startDrawing();
        addPoint(point);
        lastSampleTime.current = performance.now();
      }
    },
    [get3DPosition, startDrawing, addPoint, isDissolving]
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isMouseDown.current || isDissolving) return;

      const now = performance.now();
      if (now - lastSampleTime.current >= SAMPLING_INTERVAL) {
        const point = get3DPosition(e.clientX, e.clientY);
        if (point) {
          addPoint(point);
        }
        lastSampleTime.current = now;
      }
    },
    [get3DPosition, addPoint, isDissolving]
  );

  const handlePointerUp = useCallback(() => {
    if (isMouseDown.current) {
      isMouseDown.current = false;
      finishDrawing();
    }
  }, [finishDrawing]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r' && !isDissolving && lines.length > 0) {
        clearAll();
      }
    },
    [clearAll, isDissolving, lines.length]
  );

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointerleave', handlePointerUp);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointerleave', handlePointerUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePointerDown, handlePointerMove, handlePointerUp, handleKeyDown, gl]);

  const displayedLines = useMemo(() => {
    return lines.slice(-MAX_LINES);
  }, [lines]);

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} castShadow />

      {particleSystem && <primitive object={particleSystem.points} />}

      {displayedLines.map((line) => (
        <LineInstance
          key={line.id}
          line={line}
          isDissolving={isDissolving}
          particleSystem={particleSystem}
        />
      ))}

      {isDrawing && currentPoints.length >= 2 && particleSystem && (
        <CurrentDrawingLine
          points={currentPoints}
          color={currentColor}
          particleSystem={particleSystem}
        />
      )}

      <OrbitControls
        makeDefault
        minDistance={0.5}
        maxDistance={5}
        enablePan={false}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
}

interface SculptureCanvasProps {
  backgroundColor: string;
}

export function SculptureCanvas({ backgroundColor }: SculptureCanvasProps) {
  return (
    <Canvas
      camera={{ position: [3, 3, 3], fov: 60 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: backgroundColor, width: '100%', height: '100%', transition: 'background 0.5s ease' }}
      onCreated={({ gl, scene }) => {
        gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        scene.background = new THREE.Color(backgroundColor);
      }}
    >
      <SceneContent backgroundColor={backgroundColor} />
    </Canvas>
  );
}
