import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import type { EarthquakeEvent } from '@/types';
import { plateBoundaries } from '@/data/plateBoundaries';
import {
  EARTH_RADIUS,
  MIN_DISTANCE,
  MAX_DISTANCE,
  latLonToVector3,
  AnimationLoop,
} from './InteractionModule';
import { magnitudeToColor, magnitudeToHeight, magnitudeToBlinkRate } from '@/utils/colorUtils';

const TEXTURE_URL =
  'https://unpkg.com/three-globe@2.31.1/example/img/earth-blue-marble.jpg';

interface EarthProps {
  showPlateBoundaries: boolean;
}

function Earth({ showPlateBoundaries }: EarthProps) {
  const earthRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';
    loader.load(TEXTURE_URL, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      setTexture(t);
    });
  }, []);

  useFrame((_, dt) => {
    if (earthRef.current) earthRef.current.rotation.y += dt * 0.05;
    if (atmosphereRef.current) atmosphereRef.current.rotation.y += dt * 0.02;
  });

  const plateBoundaryLines = useMemo(() => {
    return plateBoundaries.map((boundary) => {
      const points = boundary.coordinates.map(
        ([lon, lat]) => latLonToVector3(lat, lon, EARTH_RADIUS * 1.005)
      );
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      return { geometry, name: boundary.name };
    });
  }, []);

  return (
    <group>
      <mesh ref={earthRef}>
        <sphereGeometry args={[EARTH_RADIUS, 96, 96]} />
        <meshStandardMaterial
          map={texture}
          color={0xffffff}
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>

      <mesh ref={atmosphereRef} scale={1.025}>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <meshBasicMaterial
          color={0x4da6ff}
          transparent
          opacity={0.18}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {showPlateBoundaries &&
        plateBoundaryLines.map((line, i) => (
          <lineSegments key={i} geometry={line.geometry}>
            <lineBasicMaterial
              color={'#FF6B35'}
              transparent
              opacity={0.85}
            />
          </lineSegments>
        ))}
    </group>
  );
}

interface QuakeCylindersProps {
  earthquakes: EarthquakeEvent[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

function QuakeCylinders({ earthquakes, selectedId, onSelect }: QuakeCylindersProps) {
  const instancedRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const hoveredIdRef = useRef<string | null>(null);
  const { gl, camera } = useThree();

  const { raycaster, events } = useMemo(() => {
    const rc = new THREE.Raycaster();
    const evs: { time: number; mag: number; id: string }[] = [];
    return { raycaster: rc, events: evs };
  }, []);

  useEffect(() => {
    events.length = 0;
    earthquakes.forEach((eq) => events.push({ time: eq.time, mag: eq.magnitude, id: eq.id }));
  }, [earthquakes, events]);

  useFrame((state, time) => {
    const mesh = instancedRef.current;
    if (!mesh) return;

    for (let i = 0; i < earthquakes.length; i++) {
      const eq = earthquakes[i];
      const dir = latLonToVector3(eq.latitude, eq.longitude, 1);
      const height = magnitudeToHeight(eq.magnitude) * (selectedId === eq.id ? 1.6 : 1);
      const basePos = dir.clone().multiplyScalar(EARTH_RADIUS);
      const topPos = dir.clone().multiplyScalar(EARTH_RADIUS + height);
      const center = basePos.clone().add(topPos).multiplyScalar(0.5);

      dummy.position.copy(center);
      dummy.lookAt(dir.clone().multiplyScalar(2));
      dummy.scale.set(1, height, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      const baseColor = magnitudeToColor(eq.magnitude);
      const blinkRate = magnitudeToBlinkRate(eq.magnitude);
      const blink = 0.65 + 0.35 * Math.abs(Math.sin(time * blinkRate));
      const color = baseColor.clone().multiplyScalar(selectedId === eq.id ? 1.3 : blink);
      mesh.setColorAt(i, color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    if (selectedId) {
      const idx = earthquakes.findIndex((e) => e.id === selectedId);
      if (idx >= 0) {
        const eq = earthquakes[idx];
        const dir = latLonToVector3(eq.latitude, eq.longitude, 1);
        const topPos = dir.clone().multiplyScalar(EARTH_RADIUS + magnitudeToHeight(eq.magnitude) * 1.6);
        const v = topPos.clone().project(camera);
        const x = (v.x * 0.5 + 0.5) * gl.domElement.clientWidth;
        const y = (-v.y * 0.5 + 0.5) * gl.domElement.clientHeight;
        const card = document.getElementById('quake-card');
        if (card) {
          card.style.transform = `translate(${x}px, ${y}px)`;
        }
      }
    }
  });

  useEffect(() => {
    const canvas = gl.domElement;
    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(mouse, camera);
      const hits = instancedRef.current ? raycaster.intersectObject(instancedRef.current) : [];
      if (hits.length > 0) {
        const idx = hits[0].instanceId ?? -1;
        if (idx >= 0 && earthquakes[idx]) {
          hoveredIdRef.current = earthquakes[idx].id;
          canvas.style.cursor = 'pointer';
        }
      } else {
        hoveredIdRef.current = null;
        canvas.style.cursor = 'grab';
      }
    };
    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(mouse, camera);
      const hits = instancedRef.current ? raycaster.intersectObject(instancedRef.current) : [];
      if (hits.length > 0) {
        const idx = hits[0].instanceId ?? -1;
        if (idx >= 0 && earthquakes[idx]) {
          onSelect(earthquakes[idx].id);
          return;
        }
      }
      onSelect(null);
    };
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('click', onClick);
    return () => {
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('click', onClick);
    };
  }, [gl, camera, earthquakes, raycaster, onSelect]);

  const count = earthquakes.length;
  if (count === 0) return null;

  return (
    <instancedMesh
      ref={instancedRef}
      args={[undefined, undefined, count]}
      frustumCulled={false}
    >
      <cylinderGeometry args={[0.012, 0.02, 1, 8, 1]} />
      <meshBasicMaterial transparent opacity={0.9} toneMapped={false} />
    </instancedMesh>
  );
}

interface EarthSceneProps {
  earthquakes: EarthquakeEvent[];
  showPlateBoundaries: boolean;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export default function EarthScene({
  earthquakes,
  showPlateBoundaries,
  selectedId,
  onSelect,
}: EarthSceneProps) {
  const animLoopRef = useRef<AnimationLoop | null>(null);

  useEffect(() => {
    const loop = new AnimationLoop();
    loop.start();
    animLoopRef.current = loop;
    return () => loop.stop();
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 0, 3.8], fov: 50, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: false }}
      style={{ width: '100%', height: '100%', background: '#0A0A23' }}
      onCreated={({ gl }) => {
        gl.setClearColor('#0A0A23');
      }}
    >
      <ambientLight intensity={0.45} />
      <directionalLight position={[5, 2, 5]} intensity={1.1} />
      <Stars radius={120} depth={60} count={2500} factor={4} fade speed={0.3} />
      <Earth showPlateBoundaries={showPlateBoundaries} />
      <QuakeCylinders
        earthquakes={earthquakes}
        selectedId={selectedId}
        onSelect={onSelect}
      />
      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
        minDistance={MIN_DISTANCE}
        maxDistance={MAX_DISTANCE}
      />
    </Canvas>
  );
}
