import { useRef, useMemo, useCallback, useState, useEffect } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Grid, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useEditorStore } from '@/store/editorStore';
import { getMaterialConfig, hexToRgb, type MaterialType } from '@/materials/materialStore';
import { VoxelBuilder } from './VoxelBuilder';

const PARTICLE_COUNT = 12;
const PARTICLE_LIFETIME = 0.2;
const PARTICLE_SPREAD = 1.5;

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  color: THREE.Color;
  size: number;
}

function VoxelMesh({ gx, gy, gz, material }: { gx: number; gy: number; gz: number; material: MaterialType }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);
  const config = getMaterialConfig(material);
  const [hovered, setHovered] = useState(false);
  const removeVoxelAt = useEditorStore((s) => s.removeVoxelAt);
  const addParticle = useParticleSystem((s) => s.addParticles);

  const worldPos = useMemo(
    () => VoxelBuilder.gridToWorld(gx, gy, gz),
    [gx, gy, gz]
  );

  const mat = useMemo(() => {
    const rgb = hexToRgb(config.color);
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(rgb.r, rgb.g, rgb.b),
      transparent: config.opacity < 1,
      opacity: config.opacity,
      emissive: new THREE.Color(config.emissive),
      emissiveIntensity: config.emissiveIntensity,
      roughness: config.roughness,
      metalness: material === 'metal' ? 0.8 : 0.1,
    });
  }, [config, material]);

  useFrame(() => {
    if (!meshRef.current) return;
    if (hovered) {
      const t = (Math.sin(performance.now() * 0.004 * Math.PI) + 1) / 2;
      const scale = 1 + 0.05 * t;
      meshRef.current.scale.setScalar(scale);
    } else {
      meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.15);
    }
  });

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      const face = e.face;
      if (!face) return;

      const toolMode = useEditorStore.getState().toolMode;
      if (toolMode === 'remove') {
        const pos = VoxelBuilder.gridToWorld(gx, gy, gz);
        const color = getMaterialConfig(material).color;
        addParticle(pos, color);
        removeVoxelAt(gx, gy, gz);
      } else if (toolMode === 'add') {
        const normal = face.normal.clone();
        const placePos = VoxelBuilder.getPlacementPosition(e.point, normal);
        if (placePos) {
          const store = useEditorStore.getState();
          if (!store.hasVoxelAt(placePos.x, placePos.y, placePos.z)) {
            store.addVoxel(placePos.x, placePos.y, placePos.z);
            const wpos = VoxelBuilder.gridToWorld(placePos.x, placePos.y, placePos.z);
            addParticle(wpos, getMaterialConfig(store.currentMaterial).color);
          }
        }
      }
    },
    [gx, gy, gz, material, removeVoxelAt, addParticle]
  );

  const handleContextMenu = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (e.nativeEvent) {
        e.nativeEvent.preventDefault();
      }
      const pos = VoxelBuilder.gridToWorld(gx, gy, gz);
      const color = getMaterialConfig(material).color;
      addParticle(pos, color);
      removeVoxelAt(gx, gy, gz);
    },
    [gx, gy, gz, material, removeVoxelAt, addParticle]
  );

  const handlePointerOver = useCallback(() => setHovered(true), []);
  const handlePointerOut = useCallback(() => setHovered(false), []);

  return (
    <mesh
      ref={meshRef}
      position={worldPos}
      material={mat}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[1, 1, 1]} />
      {hovered && (
        <lineSegments ref={edgesRef}>
          <edgesGeometry args={[new THREE.BoxGeometry(1.03, 1.03, 1.03)]} />
          <lineBasicMaterial color="#00E5FF" transparent opacity={0.9} />
        </lineSegments>
      )}
    </mesh>
  );
}

function VoxelGridHelper() {
  const showGrid = useEditorStore((s) => s.showGrid);
  const size = VoxelBuilder.getGridSize();
  const half = VoxelBuilder.getHalfGrid();

  const lines = useMemo(() => {
    if (!showGrid) return [];
    const result: React.ReactNode[] = [];
    const color = '#444466';

    for (let i = 0; i <= size; i++) {
      const x = i - half;
      result.push(
        <Line
          key={`h-${i}`}
          points={[
            [x, 0, -half],
            [x, 0, half],
          ]}
          color={color}
          lineWidth={1}
        />
      );
      result.push(
        <Line
          key={`v-${i}`}
          points={[
            [-half, 0, x],
            [half, 0, x],
          ]}
          color={color}
          lineWidth={1}
        />
      );
    }

    for (let y = 1; y <= size; y += 5) {
      result.push(
        <Line
          key={`yh-${y}`}
          points={[
            [-half, y, -half],
            [half, y, -half],
          ]}
          color="#444466"
          lineWidth={0.5}
          transparent
          opacity={0.4}
        />
      );
    }

    return result;
  }, [showGrid, size, half]);

  if (!showGrid) return null;

  return <group>{lines}</group>;
}

function GroundGrid() {
  return (
    <Grid
      args={[40, 40]}
      position={[0, -0.01, 0]}
      cellSize={1}
      cellThickness={0.5}
      cellColor="#333355"
      sectionSize={5}
      sectionThickness={1}
      sectionColor="#333355"
      fadeDistance={50}
      fadeStrength={1}
      infiniteGrid={false}
      side={THREE.DoubleSide}
    />
  );
}

function Skybox() {
  const shaderMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          topColor: { value: new THREE.Color('#1A1A3A') },
          bottomColor: { value: new THREE.Color('#0A0A1A') },
          offset: { value: 20 },
          exponent: { value: 0.6 },
        },
        vertexShader: `
          varying vec3 vWorldPosition;
          void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 topColor;
          uniform vec3 bottomColor;
          uniform float offset;
          uniform float exponent;
          varying vec3 vWorldPosition;
          void main() {
            vec3 pos = vWorldPosition + vec3(0.0, offset, 0.0);
            float h = normalize(pos).y;
            gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
          }
        `,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    []
  );

  return (
    <mesh material={shaderMaterial}>
      <sphereGeometry args={[45, 32, 32]} />
    </mesh>
  );
}

interface ParticleSystemState {
  particles: Particle[];
  addParticles: (position: THREE.Vector3, color: string) => void;
}

const particleSystemState: ParticleSystemState = {
  particles: [],
  addParticles: () => {},
};

function useParticleSystem<T>(selector: (state: ParticleSystemState) => T): T {
  return selector(particleSystemState);
}

function ParticleSystem() {
  const particlesRef = useRef<Particle[]>([]);
  const maxParticles = 100;
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const positionsRef = useRef(new Float32Array(maxParticles * 3));
  const colorsRef = useRef(new Float32Array(maxParticles * 3));
  const sizesRef = useRef(new Float32Array(maxParticles));

  useEffect(() => {
    particleSystemState.addParticles = (position: THREE.Vector3, color: string) => {
      const rgb = hexToRgb(color);
      const threeColor = new THREE.Color(rgb.r, rgb.g, rgb.b);
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        if (particlesRef.current.length >= maxParticles) {
          particlesRef.current.shift();
        }
        const velocity = new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          Math.random() * 2 + 0.5,
          (Math.random() - 0.5) * 2
        ).multiplyScalar(PARTICLE_SPREAD);
        particlesRef.current.push({
          position: position.clone(),
          velocity,
          life: PARTICLE_LIFETIME,
          maxLife: PARTICLE_LIFETIME,
          color: threeColor.clone(),
          size: 0.06 + Math.random() * 0.06,
        });
      }
    };
  }, []);

  useFrame((_state, delta) => {
    const particles = particlesRef.current;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= delta;
      if (p.life <= 0) {
        particles.splice(i, 1);
      } else {
        p.position.add(p.velocity.clone().multiplyScalar(delta));
        p.velocity.y -= delta * 3;
      }
    }

    if (!geometryRef.current) return;

    const positions = positionsRef.current;
    const colors = colorsRef.current;
    const sizes = sizesRef.current;

    for (let i = 0; i < maxParticles; i++) {
      if (i < particles.length) {
        const p = particles[i];
        const alpha = Math.max(0, p.life / p.maxLife);
        positions[i * 3] = p.position.x;
        positions[i * 3 + 1] = p.position.y;
        positions[i * 3 + 2] = p.position.z;
        colors[i * 3] = p.color.r * alpha;
        colors[i * 3 + 1] = p.color.g * alpha;
        colors[i * 3 + 2] = p.color.b * alpha;
        sizes[i] = p.size * alpha;
      } else {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = -100;
        positions[i * 3 + 2] = 0;
        sizes[i] = 0;
      }
    }

    geometryRef.current.attributes.position.needsUpdate = true;
    geometryRef.current.attributes.color.needsUpdate = true;
  });

  const particleMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.08,
        vertexColors: true,
        transparent: true,
        opacity: 1,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  return (
    <points material={particleMaterial}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          count={maxParticles}
          array={positionsRef.current}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={maxParticles}
          array={colorsRef.current}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={maxParticles}
          array={sizesRef.current}
          itemSize={1}
        />
      </bufferGeometry>
    </points>
  );
}

function InteractionPlane() {
  const addVoxel = useEditorStore((s) => s.addVoxel);
  const currentMaterial = useEditorStore((s) => s.currentMaterial);
  const toolMode = useEditorStore((s) => s.toolMode);
  const hasVoxelAt = useEditorStore((s) => s.hasVoxelAt);
  const [previewPos, setPreviewPos] = useState<{ x: number; y: number; z: number } | null>(null);
  const addParticle = useParticleSystem((s) => s.addParticles);
  const config = useMemo(() => getMaterialConfig(currentMaterial), [currentMaterial]);

  const previewMaterial = useMemo(() => {
    const rgb = hexToRgb(config.color);
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(rgb.r, rgb.g, rgb.b),
      transparent: true,
      opacity: 0.4,
      emissive: new THREE.Color(config.emissive),
      emissiveIntensity: config.emissiveIntensity * 0.3,
      roughness: config.roughness,
      depthWrite: false,
    });
  }, [config]);

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      if (toolMode !== 'add') {
        setPreviewPos(null);
        return;
      }

      const point = e.point;
      const normal = e.face?.normal?.clone() ?? new THREE.Vector3(0, 1, 0);
      const placePos = VoxelBuilder.getPlacementPosition(point, normal);

      if (placePos && !hasVoxelAt(placePos.x, placePos.y, placePos.z)) {
        setPreviewPos(placePos);
      } else {
        const gx = Math.floor(point.x + VoxelBuilder.getHalfGrid());
        const gz = Math.floor(point.z + VoxelBuilder.getHalfGrid());
        const size = VoxelBuilder.getGridSize();
        if (gx >= 0 && gx < size && gz >= 0 && gz < size && !hasVoxelAt(gx, 0, gz)) {
          setPreviewPos({ x: gx, y: 0, z: gz });
        } else {
          setPreviewPos(null);
        }
      }
    },
    [toolMode, hasVoxelAt]
  );

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (e.button !== 0 || toolMode !== 'add') return;

      const point = e.point;
      const normal = e.face?.normal?.clone() ?? new THREE.Vector3(0, 1, 0);
      const placePos = VoxelBuilder.getPlacementPosition(point, normal);

      if (placePos && !hasVoxelAt(placePos.x, placePos.y, placePos.z)) {
        addVoxel(placePos.x, placePos.y, placePos.z);
        const wpos = VoxelBuilder.gridToWorld(placePos.x, placePos.y, placePos.z);
        addParticle(wpos, getMaterialConfig(currentMaterial).color);
      } else {
        const gx = Math.floor(point.x + VoxelBuilder.getHalfGrid());
        const gz = Math.floor(point.z + VoxelBuilder.getHalfGrid());
        const size = VoxelBuilder.getGridSize();
        if (gx >= 0 && gx < size && gz >= 0 && gz < size && !hasVoxelAt(gx, 0, gz)) {
          addVoxel(gx, 0, gz);
          const wpos = VoxelBuilder.gridToWorld(gx, 0, gz);
          addParticle(wpos, getMaterialConfig(currentMaterial).color);
        }
      }
    },
    [toolMode, addVoxel, hasVoxelAt, currentMaterial, addParticle]
  );

  const handlePointerLeave = useCallback(() => {
    setPreviewPos(null);
  }, []);

  const worldPos = useMemo(
    () => (previewPos ? VoxelBuilder.gridToWorld(previewPos.x, previewPos.y, previewPos.z) : null),
    [previewPos]
  );

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onPointerMove={handlePointerMove}
        onClick={handleClick}
        onPointerLeave={handlePointerLeave}
      >
        <planeGeometry args={[15, 15]} />
        <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>
      {worldPos && toolMode === 'add' && (
        <mesh position={worldPos} material={previewMaterial}>
          <boxGeometry args={[1, 1, 1]} />
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(1.01, 1.01, 1.01)]} />
            <lineBasicMaterial color="#00E5FF" transparent opacity={0.6} />
          </lineSegments>
        </mesh>
      )}
    </group>
  );
}

function Scene() {
  const voxels = useEditorStore((s) => s.voxels);
  const showGrid = useEditorStore((s) => s.showGrid);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 15, 10]}
        intensity={0.8}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      <directionalLight position={[-5, 8, -5]} intensity={0.2} />
      <pointLight position={[0, 8, 0]} intensity={0.3} color="#7C4DFF" distance={30} />

      <Skybox />
      <GroundGrid />
      {showGrid && <VoxelGridHelper />}
      <InteractionPlane />
      <ParticleSystem />

      {voxels.map((voxel) => (
        <VoxelMesh
          key={voxel.id}
          gx={voxel.x}
          gy={voxel.y}
          gz={voxel.z}
          material={voxel.material}
        />
      ))}

      <OrbitControls
        enableDamping
        dampingFactor={0.1}
        minDistance={5}
        maxDistance={50}
        mouseButtons={{
          LEFT: undefined as unknown as THREE.MOUSE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.ROTATE,
        }}
        makeDefault
      />
    </>
  );
}

export default function VoxelWorld() {
  return (
    <Canvas
      camera={{ position: [12, 10, 12], fov: 50, near: 0.1, far: 100 }}
      shadows
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#0A0A1A' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Scene />
    </Canvas>
  );
}
