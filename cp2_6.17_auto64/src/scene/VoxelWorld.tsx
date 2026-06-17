import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useEditorStore, GRID_CONSTANTS, type Voxel, type ParticleEvent } from '../store/editorStore';
import { getMaterialById } from '../materials/materialStore';
import { VoxelBuilder, type HoverResult } from './VoxelBuilder';

const { HALF, SIZE } = GRID_CONSTANTS;

interface SingleVoxelProps {
  voxel: Voxel;
  builder: VoxelBuilder;
}

const SingleVoxel: React.FC<SingleVoxelProps> = React.memo(({ voxel, builder }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialConfig = useMemo(() => getMaterialById(voxel.material), [voxel.material]);

  return (
    <mesh
      ref={meshRef}
      position={[voxel.x + 0.5, voxel.y + 0.5, voxel.z + 0.5]}
      userData={{ voxelId: voxel.id, gridX: voxel.x, gridY: voxel.y, gridZ: voxel.z }}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[0.98, 0.98, 0.98]} />
      <meshStandardMaterial
        color={materialConfig.color}
        roughness={materialConfig.roughness}
        metalness={materialConfig.metalness}
        transparent={materialConfig.transparent || false}
        opacity={materialConfig.opacity ?? 1}
        emissive={materialConfig.emissive || '#000000'}
        emissiveIntensity={materialConfig.emissiveIntensity || 0}
      />
    </mesh>
  );
});

SingleVoxel.displayName = 'SingleVoxel';

interface GridHelperBoxProps {
  visible: boolean;
}

const GridHelperBox: React.FC<GridHelperBoxProps> = ({ visible }) => {
  const edgesRef = useRef<THREE.LineSegments>(null);

  const geometry = useMemo(() => {
    const box = new THREE.BoxGeometry(SIZE, SIZE, SIZE);
    return new THREE.EdgesGeometry(box);
  }, []);

  const innerLines = useMemo(() => {
    const positions: number[] = [];

    for (let i = -HALF; i <= HALF + 1; i++) {
      for (let j = 0; j <= SIZE; j++) {
        positions.push(i, j, -HALF, i, j, HALF + 1);
        positions.push(-HALF, j, i, HALF + 1, j, i);
      }
    }

    for (let i = -HALF; i <= HALF + 1; i++) {
      for (let j = -HALF; j <= HALF + 1; j++) {
        positions.push(i, 0, j, i, SIZE, j);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, []);

  if (!visible) return null;

  return (
    <group position={[0.5, SIZE / 2, 0.5]}>
      <lineSegments ref={edgesRef} geometry={geometry}>
        <lineBasicMaterial color="#444466" linewidth={1} />
      </lineSegments>
      <lineSegments geometry={innerLines}>
        <lineBasicMaterial color="#444466" transparent opacity={0.3} />
      </lineSegments>
    </group>
  );
};

interface PreviewBoxProps {
  hover: HoverResult | null;
}

const PreviewBox: React.FC<PreviewBoxProps> = ({ hover }) => {
  const currentMaterial = useEditorStore((s) => s.currentMaterial);
  const materialConfig = useMemo(() => getMaterialById(currentMaterial), [currentMaterial]);

  if (!hover || !hover.valid) return null;

  return (
    <mesh
      position={[hover.x + 0.5, hover.y + 0.5, hover.z + 0.5]}
      raycast={() => null}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={materialConfig.color}
        transparent
        opacity={0.4}
        emissive={materialConfig.color}
        emissiveIntensity={0.1}
        depthWrite={false}
      />
    </mesh>
  );
};

interface ParticleBurstProps {
  event: ParticleEvent;
}

const ParticleBurst: React.FC<ParticleBurstProps> = ({ event }) => {
  const groupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Mesh[]>([]);
  const velocitiesRef = useRef<THREE.Vector3[]>([]);
  const startTime = useRef(event.timestamp);

  const particles = useMemo(() => {
    const count = 12;
    const result: { dir: THREE.Vector3; size: number }[] = [];
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.5 + Math.random() * 1;
      const dir = new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
      result.push({ dir, size: 0.02 + Math.random() * 0.02 });
    }
    return result;
  }, [event.id]);

  useEffect(() => {
    velocitiesRef.current = particles.map((p) => p.dir.clone().multiplyScalar(4));
  }, [particles]);

  useFrame(() => {
    const now = Date.now();
    const elapsed = (now - startTime.current) / 1000;
    const life = 0.2;

    if (elapsed >= life) return;

    const progress = elapsed / life;
    const alpha = 1 - progress;

    particlesRef.current.forEach((mesh, idx) => {
      if (!mesh) return;
      const vel = velocitiesRef.current[idx];
      if (vel) {
        mesh.position.addScaledVector(vel, 0.016);
        vel.y -= 0.1;
      }
      const mat = mesh.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = alpha;
      }
    });
  });

  return (
    <group ref={groupRef} position={[event.x, event.y, event.z]}>
      {particles.map((p, idx) => (
        <mesh
          key={idx}
          ref={(el) => {
            if (el) particlesRef.current[idx] = el;
          }}
        >
          <sphereGeometry args={[p.size, 6, 6]} />
          <meshBasicMaterial color={event.color} transparent opacity={1} />
        </mesh>
      ))}
    </group>
  );
};

interface GroundPlaneProps {
  builder: VoxelBuilder;
  onHover: (hover: HoverResult | null) => void;
  onClick: (event: THREE.Event, isRight: boolean) => void;
}

const GroundPlane: React.FC<GroundPlaneProps> = ({ builder, onHover, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const voxels = useEditorStore((s) => s.voxels);

  const handlePointerMove = useCallback(
    (e: any) => {
      e.stopPropagation();
      const hover = builder.computeHoverFromGroundPoint(e.point, voxels);
      onHover(hover.valid ? hover : null);
    },
    [builder, voxels, onHover]
  );

  const handlePointerOut = useCallback(() => {
    onHover(null);
  }, [onHover]);

  const handleClick = useCallback(
    (e: any) => {
      e.stopPropagation();
      onClick(e, false);
    },
    [onClick]
  );

  const handleContextMenu = useCallback(
    (e: any) => {
      e.stopPropagation();
      onClick(e, true);
    },
    [onClick]
  );

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0.5, -0.01, 0.5]}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      <planeGeometry args={[40, 40]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
};

interface VoxelGroupProps {
  builder: VoxelBuilder;
  onHover: (hover: HoverResult | null) => void;
  onClickVoxel: (voxelId: string, event: any, isRight: boolean) => void;
}

const VoxelGroup: React.FC<VoxelGroupProps> = ({ builder, onHover, onClickVoxel }) => {
  const voxels = useEditorStore((s) => s.voxels);

  const handlePointerMove = useCallback(
    (e: any) => {
      e.stopPropagation();
      const hover = builder.computeHoverFromIntersection(e, voxels, false);
      onHover(hover.valid ? hover : null);
    },
    [builder, voxels, onHover]
  );

  return (
    <group onPointerMove={handlePointerMove}>
      {voxels.map((voxel) => (
        <group
          key={voxel.id}
          onClick={(e: any) => {
            e.stopPropagation();
            onClickVoxel(voxel.id, e, false);
          }}
          onContextMenu={(e: any) => {
            e.stopPropagation();
            onClickVoxel(voxel.id, e, true);
          }}
        >
          <SingleVoxel voxel={voxel} builder={builder} />
        </group>
      ))}
    </group>
  );
};

const ParticleManager: React.FC = () => {
  const particleEvents = useEditorStore((s) => s.particleEvents);
  const cleanupParticles = useEditorStore((s) => s.cleanupParticles);

  useEffect(() => {
    const interval = setInterval(() => {
      cleanupParticles();
    }, 300);
    return () => clearInterval(interval);
  }, [cleanupParticles]);

  return (
    <>
      {particleEvents.map((event) => (
        <ParticleBurst key={event.id} event={event} />
      ))}
    </>
  );
};

interface SceneContentProps {
  builder: VoxelBuilder;
}

const SceneContent: React.FC<SceneContentProps> = ({ builder }) => {
  const showGrid = useEditorStore((s) => s.showGrid);
  const currentMaterial = useEditorStore((s) => s.currentMaterial);
  const addVoxel = useEditorStore((s) => s.addVoxel);
  const removeVoxel = useEditorStore((s) => s.removeVoxel);
  const voxels = useEditorStore((s) => s.voxels);
  const [hover, setHover] = useState<HoverResult | null>(null);
  const hoverRef = useRef<HoverResult | null>(null);

  useEffect(() => {
    hoverRef.current = hover;
  }, [hover]);

  const currentColor = useMemo(() => {
    return getMaterialById(currentMaterial).color;
  }, [currentMaterial]);

  const handleVoxelClick = useCallback(
    (voxelId: string, event: any, isRight: boolean) => {
      if (isRight) {
        const voxel = voxels.find((v) => v.id === voxelId);
        if (voxel) {
          const color = getMaterialById(voxel.material).color;
          removeVoxel(voxelId, color);
        }
        const currentHover = hoverRef.current;
        if (currentHover && currentHover.valid) {
          setHover(null);
        }
      } else {
        const intersection = event;
        const hoverResult = builder.computeHoverFromIntersection(intersection, voxels, false);
        if (hoverResult.valid) {
          addVoxel(hoverResult.x, hoverResult.y, hoverResult.z, currentColor);
        }
      }
    },
    [builder, voxels, addVoxel, removeVoxel, currentColor]
  );

  const handleGroundClick = useCallback(
    (event: any, isRight: boolean) => {
      if (isRight) return;
      const hoverResult = builder.computeHoverFromGroundPoint(event.point, voxels);
      if (hoverResult.valid) {
        addVoxel(hoverResult.x, hoverResult.y, hoverResult.z, currentColor);
      }
    },
    [builder, voxels, addVoxel, currentColor]
  );

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[15, 25, 15]}
        intensity={1.0}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-10, 10, -10]} intensity={0.3} />
      <hemisphereLight args={['#87CEEB', '#362d45', 0.4]} />

      <gridHelper
        args={[40, 40, '#333355', '#333355']}
        position={[0.5, 0, 0.5]}
      >
        <meshBasicMaterial transparent opacity={0.2} attach="material" />
      </gridHelper>

      <GridHelperBox visible={showGrid} />

      <VoxelGroup builder={builder} onHover={setHover} onClickVoxel={handleVoxelClick} />

      <GroundPlane builder={builder} onHover={setHover} onClick={handleGroundClick} />

      <PreviewBox hover={hover} />

      <ParticleManager />

      <OrbitControls
        enableDamping
        dampingFactor={0.1}
        minDistance={5}
        maxDistance={50}
        target={[0.5, 5, 0.5]}
        makeDefault
      />
    </>
  );
};

const GradientBackground: React.FC = () => {
  const { scene } = useThree();

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, '#0A0A1A');
    gradient.addColorStop(1, '#1A1A3A');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    scene.background = texture;

    return () => {
      texture.dispose();
    };
  }, [scene]);

  return null;
};

const VoxelWorld: React.FC = () => {
  const builder = useMemo(() => new VoxelBuilder(), []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div onContextMenu={handleContextMenu} style={{ width: '100%', height: '100%' }}>
      <Canvas
        shadows
        camera={{ position: [12, 12, 12], fov: 50, near: 0.1, far: 200 }}
        gl={{ antialias: true }}
        dpr={[1, 2]}
      >
        <GradientBackground />
        <SceneContent builder={builder} />
      </Canvas>
    </div>
  );
};

export default VoxelWorld;
