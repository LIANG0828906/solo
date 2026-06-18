import { useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import * as THREE from 'three';
import { PlanetData, TIME_SCALE } from '@/data/planets';

interface SolarSystemProps {
  planets: PlanetData[];
  selectedPlanetId: string | null;
  speedMultiplier: number;
  onPlanetClick: (id: string | null) => void;
}

function createLabelTexture(text: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 128, 64);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.beginPath();
  ctx.roundRect(8, 8, 112, 48, 12);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px Orbitron, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 64, 34);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function Sun() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[10, 64, 64]} />
        <meshBasicMaterial color="#FF8C00" />
      </mesh>
      <pointLight color="#FFA500" intensity={3} distance={300} decay={1} />
    </group>
  );
}

function Planet({
  data,
  timeRef,
  speedMultiplier,
  isSelected,
  onSelect,
}: {
  data: PlanetData;
  timeRef: React.RefObject<number>;
  speedMultiplier: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const labelRef = useRef<THREE.Sprite>(null);
  const initialAngle = useMemo(() => Math.random() * Math.PI * 2, []);

  const labelTexture = useMemo(() => createLabelTexture(data.abbreviation), [data.abbreviation]);

  useFrame(() => {
    if (!groupRef.current || !meshRef.current) return;
    const t = timeRef.current! * speedMultiplier * TIME_SCALE;
    const angle = initialAngle + (t * 2 * Math.PI) / data.orbitPeriod;
    groupRef.current.position.x = Math.cos(angle) * data.orbitRadius;
    groupRef.current.position.z = Math.sin(angle) * data.orbitRadius;
    meshRef.current.rotation.y += 0.016 * speedMultiplier * data.rotationSpeed;
  });

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      onSelect(data.id);
    },
    [data.id, onSelect]
  );

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef} onClick={handleClick}>
        <sphereGeometry args={[data.visualRadius, 32, 32]} />
        <meshStandardMaterial
          color={data.surfaceColor}
          roughness={0.7}
          metalness={0.1}
          emissive={isSelected ? data.surfaceColor : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : 0}
        />
      </mesh>
      <sprite
        ref={labelRef}
        position={[0, data.visualRadius + 0.8, 0]}
        scale={[2.5, 1.25, 1]}
      >
        <spriteMaterial map={labelTexture} transparent depthTest={false} />
      </sprite>
    </group>
  );
}

function Planet({OrbitLine({ radius }: { radius: number }) {
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      pts.push([Math.cos(angle) * radius, 0, Math.sin(angle) * radius]);
    }
    return pts;
  }, [radius]);

  return (
    <Line
      points={points}
      color="#4FC3F7"
      lineWidth={1}
      opacity={0.15}
      transparent
    />
  );
}

function StarField() {
  const count = 1600;
  const meshRef = useRef<THREE.Points>(null);

  const { positions, sizes, phases } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const siz = new Float32Array(count);
    const pha = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 150 + Math.random() * 200;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      siz[i] = Math.random() * 1.5 + 0.5;
      pha[i] = Math.random();
    }
    return { positions: pos, sizes: siz, phases: pha };
  }, []);

  const shaderMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
        },
        vertexShader: `
          attribute float aSize;
          attribute float aPhase;
          uniform float uTime;
          varying float vAlpha;
          void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            float period = mix(0.8, 1.5, aPhase);
            float twinkle = 0.4 + 0.6 * (0.5 + 0.5 * sin(uTime / period * 6.283 + aPhase * 6.283));
            gl_PointSize = aSize * twinkle * (150.0 / -mvPosition.z);
            vAlpha = twinkle;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying float vAlpha;
          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            if (d > 0.5) discard;
            float alpha = smoothstep(0.5, 0.0, d) * vAlpha;
            gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  useFrame(({ clock }) => {
    shaderMaterial.uniforms.uTime.value = clock.getElapsedTime();
  });

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    return geo;
  }, [positions, sizes, phases]);

  return <points ref={meshRef} geometry={geometry} material={shaderMaterial} />;
}

function cubicBezierEase(t: number): number {
  const p1x = 0.22, p1y = 1, p2x = 0.36, p2y = 1;
  const cx = 3 * p1x;
  const bx = 3 * (p2x - p1x) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * p1y;
  const by = 3 * (p2y - p1y) - cy;
  const ay = 1 - cy - by;
  const solveCubic = (x: number): number => {
    let lo = 0, hi = 1;
    for (let i = 0; i < 8; i++) {
      const mid = (lo + hi) / 2;
      const xMid = ((ax * mid + bx) * mid + cx) * mid;
      if (xMid < x) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  };
  const s = solveCubic(t);
  return ((ay * s + by) * s + cy) * s;
}

function CameraController({
  planets,
  selectedPlanetId,
  timeRef,
  speedMultiplier,
}: {
  planets: PlanetData[];
  selectedPlanetId: string | null;
  timeRef: React.RefObject<number>;
  speedMultiplier: number;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  const stateRef = useRef({
    mode: 'overview' as 'overview' | 'animating' | 'following',
    animStartTime: 0,
    startPos: new THREE.Vector3(0, 80, 120),
    endPos: new THREE.Vector3(0, 80, 120),
    startLookAt: new THREE.Vector3(0, 0, 0),
    endLookAt: new THREE.Vector3(0, 0, 0),
    currentLookAt: new THREE.Vector3(0, 0, 0),
    duration: 1.2,
  });

  const prevSelectedId = useRef<string | null>(null);

  useFrame(() => {
    const state = stateRef.current;
    const controls = controlsRef.current;

    if (selectedPlanetId !== prevSelectedId.current) {
      prevSelectedId.current = selectedPlanetId;

      if (selectedPlanetId) {
        const planet = planets.find((p) => p.id === selectedPlanetId);
        if (planet) {
          const t = timeRef.current! * speedMultiplier * TIME_SCALE;
          const angle = (t * 2 * Math.PI) / planet.orbitPeriod;
          const px = Math.cos(angle) * planet.orbitRadius;
          const pz = Math.sin(angle) * planet.orbitRadius;
          const vr = planet.visualRadius;
          const dist = vr * 5;

          state.startPos.copy(camera.position);
          state.endPos.set(px + dist * 0.7, vr * 2.5 + dist * 0.3, pz + dist * 0.7);
          state.startLookAt.copy(state.currentLookAt);
          state.endLookAt.set(px, 0, pz);
          state.animStartTime = performance.now() / 1000;
          state.duration = 1.2;
          state.mode = 'animating';
        }
      } else {
        state.startPos.copy(camera.position);
        state.endPos.set(0, 80, 120);
        state.startLookAt.copy(state.currentLookAt);
        state.endLookAt.set(0, 0, 0);
        state.animStartTime = performance.now() / 1000;
        state.duration = 1.5;
        state.mode = 'animating';
      }

      if (controls) {
        controls.enabled = false;
      }
    }

    if (state.mode === 'animating') {
      const elapsed = performance.now() / 1000 - state.animStartTime;
      const t = Math.min(elapsed / state.duration, 1);
      const eased = cubicBezierEase(t);

      camera.position.lerpVectors(state.startPos, state.endPos, eased);
      state.currentLookAt.lerpVectors(state.startLookAt, state.endLookAt, eased);
      camera.lookAt(state.currentLookAt);

      if (t >= 1) {
        state.mode = selectedPlanetId ? 'following' : 'overview';
        if (controls) {
          controls.enabled = true;
          controls.target.copy(state.currentLookAt);
        }
      }
    } else if (state.mode === 'following' && selectedPlanetId) {
      const planet = planets.find((p) => p.id === selectedPlanetId);
      if (planet) {
        const t = timeRef.current! * speedMultiplier * TIME_SCALE;
        const angle = (t * 2 * Math.PI) / planet.orbitPeriod;
        const px = Math.cos(angle) * planet.orbitRadius;
        const pz = Math.sin(angle) * planet.orbitRadius;
        const vr = planet.visualRadius;
        const dist = vr * 5;

        const targetCamPos = new THREE.Vector3(
          px + dist * 0.7,
          vr * 2.5 + dist * 0.3,
          pz + dist * 0.7
        );
        const targetLookAt = new THREE.Vector3(px, 0, pz);

        camera.position.lerp(targetCamPos, 0.05);
        state.currentLookAt.lerp(targetLookAt, 0.05);
        camera.lookAt(state.currentLookAt);

        if (controls) {
          controls.target.copy(state.currentLookAt);
        }
      }
    } else if (state.mode === 'overview') {
      if (controls) {
        controls.target.set(0, 0, 0);
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      minDistance={15}
      maxDistance={250}
      enablePan
    />
  );
}

function SceneContent({
  planets,
  selectedPlanetId,
  speedMultiplier,
  onPlanetClick,
}: SolarSystemProps) {
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
  });

  const handlePlanetClick = useCallback(
    (id: string) => {
      onPlanetClick(id);
    },
    [onPlanetClick]
  );

  const handleBgClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      if (e.object.type === 'Mesh' && (e.object as THREE.Mesh).geometry.type === 'SphereGeometry') {
        return;
      }
      onPlanetClick(null);
    },
    [onPlanetClick]
  );

  return (
    <>
      <hemisphereLight args={['#b1e1ff', '#b97a20', 0.4]} />
      <ambientLight intensity={0.25} />
      <Sun />
      <group onClick={handleBgClick}>
        {planets.map((planet) => (
          <Planet
            key={planet.id}
            data={planet}
            timeRef={timeRef}
            speedMultiplier={speedMultiplier}
            isSelected={selectedPlanetId === planet.id}
            onSelect={handlePlanetClick}
          />
        ))}
      </group>
      {planets.map((planet) => (
        <OrbitLine key={`orbit-${planet.id}`} radius={planet.orbitRadius} />
      ))}
      <StarField />
      <CameraController
        planets={planets}
        selectedPlanetId={selectedPlanetId}
        timeRef={timeRef}
        speedMultiplier={speedMultiplier}
      />
    </>
  );
}

export function SolarSystem(props: SolarSystemProps) {
  return (
    <Canvas
      camera={{ position: [0, 80, 120], fov: 60, near: 0.1, far: 1000 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: 'transparent' }}
      onCreated={({ gl }) => {
        gl.setClearColor('#0B0E1A');
      }}
    >
      <SceneContent {...props} />
    </Canvas>
  );
}
