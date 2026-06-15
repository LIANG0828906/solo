import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { Road, Intersection, TrafficSnapshot, Vec3, RoadNetworkData } from '@/types';

interface RoadNetworkProps {
  network: RoadNetworkData;
  snapshot: TrafficSnapshot;
  isPlaying: boolean;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function hexToThreeColor(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

function lerpColor(a: THREE.Color, b: THREE.Color, t: number): THREE.Color {
  const result = a.clone();
  result.r = lerp(a.r, b.r, t);
  result.g = lerp(a.g, b.g, t);
  result.b = lerp(a.b, b.b, t);
  return result;
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

interface RoadSegmentProps {
  road: Road;
  targetFlow: number;
  targetWidth: number;
  targetColor: string;
  transitionMs: number;
}

function RoadSegment({ road, targetFlow, targetWidth, targetColor, transitionMs }: RoadSegmentProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const currentWidthRef = useRef(targetWidth);
  const targetWidthRef = useRef(targetWidth);
  const currentColorRef = useRef(new THREE.Color(targetColor));
  const targetColorRef = useRef(new THREE.Color(targetColor));
  const transitionStartRef = useRef(0);
  const initialWidthRef = useRef(targetWidth);
  const initialColorRef = useRef(new THREE.Color(targetColor));
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);

  const start = useMemo(() => new THREE.Vector3(...road.start), [road.start]);
  const end = useMemo(() => new THREE.Vector3(...road.end), [road.end]);

  const { position, rotation, length } = useMemo(() => {
    const dir = new THREE.Vector3().subVectors(end, start);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(1, 0, 0),
      dir.clone().normalize()
    );
    const euler = new THREE.Euler().setFromQuaternion(quat);
    return {
      position: [mid.x, mid.y, mid.z] as Vec3,
      rotation: [euler.x, euler.y, euler.z] as Vec3,
      length: len,
    };
  }, [start, end]);

  useEffect(() => {
    initialWidthRef.current = currentWidthRef.current;
    initialColorRef.current = currentColorRef.current.clone();
    targetWidthRef.current = targetWidth;
    targetColorRef.current = hexToThreeColor(targetColor);
    transitionStartRef.current = performance.now();
  }, [targetFlow, targetWidth, targetColor]);

  useFrame(() => {
    const now = performance.now();
    const elapsed = now - transitionStartRef.current;
    const rawT = Math.min(1, elapsed / transitionMs);
    const t = easeInOut(rawT);

    const newWidth = lerp(initialWidthRef.current, targetWidthRef.current, t);
    currentWidthRef.current = newWidth;

    const newColor = lerpColor(initialColorRef.current, targetColorRef.current, t);
    currentColorRef.current = newColor;

    if (meshRef.current) {
      meshRef.current.scale.set(length, newWidth, 0.8);
      if (materialRef.current) {
        materialRef.current.color.copy(newColor);
        materialRef.current.emissive.copy(newColor);
        materialRef.current.emissiveIntensity = 0.35 + (newWidth - 1) * 0.1;
      }
    }
  });

  return (
    <mesh ref={meshRef} position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        ref={materialRef as any}
        color={targetColor}
        emissive={targetColor}
        emissiveIntensity={0.4}
        roughness={0.35}
        metalness={0.1}
        transparent
        opacity={0.95}
      />
    </mesh>
  );
}

interface IntersectionMarkerProps {
  position: Vec3;
}

function IntersectionMarker({ position }: IntersectionMarkerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const clockRef = useRef(0);
  const baseScale = 4;

  useFrame((_, delta) => {
    clockRef.current += delta;

    if (meshRef.current) {
      const t = clockRef.current;
      const pulse = 1 + 0.3 * Math.sin(t * Math.PI);
      meshRef.current.scale.setScalar(baseScale * pulse);
    }

    if (materialRef.current) {
      const t = clockRef.current;
      const opacityPulse = 0.55 + 0.4 * (0.5 + 0.5 * Math.sin(t * Math.PI));
      materialRef.current.opacity = opacityPulse;
    }
  });

  return (
    <mesh ref={meshRef} position={[position[0], position[1] + 1.2, position[2]]}>
      <sphereGeometry args={[1, 20, 20]} />
      <meshBasicMaterial
        ref={materialRef as any}
        color="#ffffff"
        transparent
        opacity={0.95}
      />
    </mesh>
  );
}

function GroundPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
      <planeGeometry args={[400, 400]} />
      <meshStandardMaterial color="#1e293b" roughness={0.95} metalness={0} />
    </mesh>
  );
}

function GridFloor() {
  const gridRef = useRef<THREE.GridHelper>(null);
  useEffect(() => {
    if (gridRef.current) {
      const mat = gridRef.current.material as THREE.Material;
      mat.transparent = true;
      mat.opacity = 0.15;
    }
  }, []);
  return (
    <gridHelper
      ref={gridRef}
      args={[300, 60, '#334155', '#1e293b']}
      position={[0, -0.4, 0]}
    />
  );
}

interface SceneContentProps {
  network: RoadNetworkData;
  snapshot: TrafficSnapshot;
}

function SceneContent({ network, snapshot }: SceneContentProps) {
  const roadMap = useMemo(() => {
    const map = new Map<string, Road>();
    network.roads.forEach(r => map.set(r.id, r));
    return map;
  }, [network.roads]);

  return (
    <>
      <ambientLight intensity={0.4} color="#cbd5e1" />
      <directionalLight
        position={[60, 80, 60]}
        intensity={0.8}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-150}
        shadow-camera-right={150}
        shadow-camera-top={150}
        shadow-camera-bottom={-150}
      />
      <directionalLight position={[-60, 40, -60]} intensity={0.3} color="#94a3b8" />

      <GroundPlane />
      <GridFloor />

      {snapshot.roads.map(rt => {
        const road = roadMap.get(rt.roadId);
        if (!road) return null;
        return (
          <RoadSegment
            key={road.id}
            road={road}
            targetFlow={rt.flow}
            targetWidth={rt.width}
            targetColor={rt.color}
            transitionMs={500}
          />
        );
      })}

      {network.intersections.map(inter => (
        <IntersectionMarker key={inter.id} position={inter.position} />
      ))}

      <EffectComposer>
        <Bloom
          intensity={0.7}
          luminanceThreshold={0.15}
          luminanceSmoothing={0.2}
          mipmapBlur
          radius={0.6}
        />
      </EffectComposer>
    </>
  );
}

interface CameraControllerProps {
  controlsEnabled: boolean;
}

function CameraController({ controlsEnabled }: CameraControllerProps) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    camera.position.set(0, 80, 120);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={controlsEnabled}
      enableDamping
      dampingFactor={0.1}
      rotateSpeed={0.5}
      zoomSpeed={0.5}
      panSpeed={0.8}
      minDistance={10}
      maxDistance={500}
      minPolarAngle={0}
      maxPolarAngle={Math.PI / 2}
      enablePan
      mouseButtons={{
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN,
      }}
      touches={{
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN,
      }}
      makeDefault
    />
  );
}

export function RoadNetwork({ network, snapshot, isPlaying }: RoadNetworkProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 80, 120], fov: 50, near: 0.1, far: 2000 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      style={{ background: '#0f172a', width: '100%', height: '100%' }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#0f172a']} />
      <fog attach="fog" args={['#0f172a', 200, 450]} />

      <CameraController controlsEnabled={true} />
      <SceneContent network={network} snapshot={snapshot} />
    </Canvas>
  );
}

export default RoadNetwork;
