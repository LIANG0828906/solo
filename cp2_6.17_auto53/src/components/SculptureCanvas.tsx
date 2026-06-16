import { useRef, useEffect, useCallback, useMemo } from 'react';
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
  createParticleSystem,
  PARTICLE_COUNT,
} from '../utils/LineRenderer';

const SAMPLING_INTERVAL = 1000 / 30;
const DISSOLVE_DURATION = 800;
const MAX_PARTICLES = 5000;

interface LineInstanceProps {
  line: LightLine;
  isDissolving: boolean;
  onDissolveComplete?: () => void;
}

function LineInstance({ line, isDissolving, onDissolveComplete }: LineInstanceProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const dissolveStartRef = useRef<number | null>(null);
  const updateParticlesRef = useRef<((time: number) => void) | null>(null);
  const curveRef = useRef<THREE.CatmullRomCurve3 | null>(null);

  const { mesh, particles, curve, update } = useMemo(() => {
    const curveResult = createCurveFromPoints(line.points);
    const { mesh } = createTubeLine(line.points, line.color);
    const { particles, update } = createParticleSystem(
      curveResult,
      line.color,
      line.createdAt
    );
    return { mesh, particles, curve: curveResult, update };
  }, [line]);

  useEffect(() => {
    updateParticlesRef.current = update;
    curveRef.current = curve;
  }, [update, curve]);

  useFrame(({ clock }) => {
    if (updateParticlesRef.current && !isDissolving) {
      updateParticlesRef.current(performance.now());
    }

    if (isDissolving && meshRef.current && particlesRef.current) {
      if (dissolveStartRef.current === null) {
        dissolveStartRef.current = performance.now();
      }

      const elapsed = performance.now() - dissolveStartRef.current;
      const progress = Math.min(1, elapsed / DISSOLVE_DURATION);

      const meshMaterial = meshRef.current.material as THREE.MeshStandardMaterial;
      meshMaterial.opacity = 1 - progress;

      const particleMaterial = particlesRef.current.material as THREE.PointsMaterial;
      particleMaterial.opacity = 1 - progress;

      const scale = 1 - progress * 0.5;
      meshRef.current.scale.setScalar(scale);
      particlesRef.current.scale.setScalar(scale);

      if (progress >= 1 && onDissolveComplete) {
        onDissolveComplete();
      }
    }
  });

  return (
    <group>
      <primitive object={mesh} ref={meshRef} />
      <primitive object={particles} ref={particlesRef} />
    </group>
  );
}

interface CurrentDrawingLineProps {
  points: Point3D[];
  color: string;
}

function CurrentDrawingLine({ points, color }: CurrentDrawingLineProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const lineRenderRef = useRef<LineRenderResult | null>(null);

  const lineRender = useMemo(() => {
    if (points.length < 2) return null;
    if (lineRenderRef.current) {
      lineRenderRef.current.dispose();
    }
    const result = createLineRender(points, color as any, Date.now());
    lineRenderRef.current = result;
    return result;
  }, [points, color]);

  useEffect(() => {
    return () => {
      if (lineRenderRef.current) {
        lineRenderRef.current.dispose();
      }
    };
  }, []);

  if (!lineRender) return null;

  return (
    <group>
      <primitive object={lineRender.mesh} ref={meshRef} />
      <primitive object={lineRender.particles} ref={particlesRef} />
    </group>
  );
}

function SceneContent() {
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
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const lastSampleTime = useRef(0);
  const isMouseDown = useRef(false);

  const totalParticles = useMemo(() => {
    return Math.min(lines.length * PARTICLE_COUNT, MAX_PARTICLES);
  }, [lines.length]);

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
      if (e.key.toLowerCase() === 'r' && !isDissolving) {
        clearAll();
      }
    },
    [clearAll, isDissolving]
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

  const handleDissolveComplete = useCallback(() => {
    resetAfterDissolve();
  }, [resetAfterDissolve]);

  const displayedLines = useMemo(() => {
    const maxLinesWithParticles = Math.floor(MAX_PARTICLES / PARTICLE_COUNT);
    return lines.slice(-maxLinesWithParticles);
  }, [lines]);

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} castShadow />

      {displayedLines.map((line) => (
        <LineInstance
          key={line.id}
          line={line}
          isDissolving={isDissolving}
          onDissolveComplete={displayedLines.indexOf(line) === 0 ? handleDissolveComplete : undefined}
        />
      ))}

      {isDrawing && currentPoints.length >= 2 && (
        <CurrentDrawingLine points={currentPoints} color={currentColor} />
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
      style={{ background: backgroundColor, width: '100%', height: '100%' }}
      onCreated={({ gl, scene }) => {
        gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        scene.background = new THREE.Color(backgroundColor);
      }}
    >
      <SceneContent />
    </Canvas>
  );
}
