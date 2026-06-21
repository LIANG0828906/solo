import React, { useRef, useMemo, useCallback, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { BlockData, BlockType, AnimatedBlock, Particle } from './types';
import { getBlockColor, getBlockOpacity, isBlockTransparent } from './utils/blockTypes';
import { useCameraControl } from './hooks/useCameraControl';

interface WorldRendererProps {
  blocks: BlockData[];
  selectedBlockType: BlockType;
  onPlaceBlock: (x: number, y: number, z: number) => void;
  onRemoveBlock: (x: number, y: number, z: number) => void;
  onBlockUpdate?: (x: number, y: number, z: number, type: BlockType | null, color?: string) => void;
}

interface RaycastResult {
  block: BlockData;
  face: THREE.Vector3;
  point: THREE.Vector3;
}

const PLACE_ANIMATION_DURATION = 300;
const REMOVE_ANIMATION_DURATION = 200;
const PARTICLE_COUNT = 10;
const PARTICLE_SIZE = 0.1;
const GRAVITY = -20;

function BlockMesh({
  block,
  animationOffset
}: {
  block: BlockData;
  animationOffset?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const color = getBlockColor(block.type, block.color);
  const opacity = getBlockOpacity(block.type);
  const transparent = isBlockTransparent(block.type);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.y = block.y + 0.5 + (animationOffset || 0);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[block.x + 0.5, block.y + 0.5, block.z + 0.5]}
      userData={{ block }}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={color}
        transparent={transparent}
        opacity={opacity}
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
}

function AnimatedBlockMesh({
  animatedBlock,
  onComplete
}: {
  animatedBlock: AnimatedBlock;
  onComplete: (key: string) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [progress, setProgress] = useState(0);
  const color = getBlockColor(animatedBlock.type, animatedBlock.color);
  const opacity = getBlockOpacity(animatedBlock.type);
  const transparent = isBlockTransparent(animatedBlock.type);
  const key = `${animatedBlock.x},${animatedBlock.y},${animatedBlock.z}`;

  useFrame(() => {
    const elapsed = Date.now() - animatedBlock.startTime;
    const newProgress = Math.min(1, elapsed / PLACE_ANIMATION_DURATION);
    
    if (newProgress >= 1 && progress < 1) {
      onComplete(key);
    }
    
    setProgress(newProgress);

    if (meshRef.current) {
      if (animatedBlock.animation === 'place') {
        meshRef.current.position.y = animatedBlock.y + 0.5 + (1 - newProgress) * 3;
      }
      meshRef.current.scale.setScalar(animatedBlock.animation === 'place' ? newProgress : Math.max(0, 1 - newProgress));
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[animatedBlock.x + 0.5, animatedBlock.y + 0.5, animatedBlock.z + 0.5]}
      userData={{ block: animatedBlock }}
      castShadow
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={color}
        transparent={transparent || true}
        opacity={opacity * progress}
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
}

function ParticleMesh({ particle, onComplete }: { particle: Particle; onComplete: (id: number) => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const completedRef = useRef(false);

  useFrame(() => {
    if (meshRef.current && !completedRef.current) {
      const elapsed = (Date.now() - particle.startTime) / 1000;
      const progress = Math.min(1, elapsed / (REMOVE_ANIMATION_DURATION / 1000));

      if (progress >= 1) {
        completedRef.current = true;
        onComplete(particle.id);
      }

      meshRef.current.position.x = particle.x + particle.vx * elapsed;
      meshRef.current.position.y = particle.y + particle.vy * elapsed + 0.5 * GRAVITY * elapsed * elapsed;
      meshRef.current.position.z = particle.z + particle.vz * elapsed;
      meshRef.current.scale.setScalar(Math.max(0, 1 - progress));
    }
  });

  return (
    <mesh ref={meshRef} position={[particle.x, particle.y, particle.z]}>
      <boxGeometry args={[PARTICLE_SIZE, PARTICLE_SIZE, PARTICLE_SIZE]} />
      <meshStandardMaterial color={particle.color} />
    </mesh>
  );
}

function Highlight({ position, visible }: { position: THREE.Vector3; visible: boolean }) {
  if (!visible) return null;

  return (
    <mesh position={[position.x + 0.5, position.y + 0.5, position.z + 0.5]}>
      <boxGeometry args={[1.02, 1.02, 1.02]} />
      <meshBasicMaterial color="#FFEB3B" transparent opacity={0.3} wireframe />
    </mesh>
  );
}

function WorldContent({
  blocks,
  selectedBlockType,
  onPlaceBlock,
  onRemoveBlock,
  onBlockUpdate
}: WorldRendererProps) {
  const { camera, gl, scene } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const [hoveredBlock, setHoveredBlock] = useState<RaycastResult | null>(null);
  const [animatedBlocks, setAnimatedBlocks] = useState<Map<string, AnimatedBlock>>(new Map());
  const [particles, setParticles] = useState<Particle[]>([]);
  const particleIdRef = useRef(0);
  const blocksRef = useRef<Set<string>>(new Set());

  useCameraControl();

  useEffect(() => {
    blocksRef.current = new Set(blocks.map(b => `${b.x},${b.y},${b.z}`));
  }, [blocks]);

  const blockMap = useMemo(() => {
    const map = new Map<string, BlockData>();
    blocks.forEach(b => {
      map.set(`${b.x},${b.y},${b.z}`, b);
    });
    return map;
  }, [blocks]);

  const spawnParticles = useCallback((x: number, y: number, z: number, color: string) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      newParticles.push({
        id: particleIdRef.current++,
        x: x + 0.5,
        y: y + 0.5,
        z: z + 0.5,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 6 + 2,
        vz: (Math.random() - 0.5) * 8,
        color,
        startTime: Date.now()
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  const handleAnimationComplete = useCallback((key: string) => {
    setAnimatedBlocks(prev => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const handleParticleComplete = useCallback((id: number) => {
    setParticles(prev => prev.filter(p => p.id !== id));
  }, []);

  const addPlaceAnimation = useCallback((x: number, y: number, z: number, type: BlockType, color?: string) => {
    const key = `${x},${y},${z}`;
    setAnimatedBlocks(prev => {
      const next = new Map(prev);
      next.set(key, { x, y, z, type, color, animation: 'place', startTime: Date.now() });
      return next;
    });
    if (onBlockUpdate) {
      onBlockUpdate(x, y, z, type, color);
    }
  }, [onBlockUpdate]);

  const addRemoveAnimation = useCallback((x: number, y: number, z: number, color: string) => {
    spawnParticles(x, y, z, color);
    if (onBlockUpdate) {
      onBlockUpdate(x, y, z, null);
    }
  }, [spawnParticles, onBlockUpdate]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!hoveredBlock) return;

      const rect = gl.domElement.getBoundingClientRect();
      mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.current.setFromCamera(mouse.current, camera);
      const meshes = scene.children.filter(child => 
        child instanceof THREE.Mesh && child.userData.block
      ) as THREE.Mesh[];
      
      const intersects = raycaster.current.intersectObjects(meshes);
      if (intersects.length === 0) return;

      const hit = intersects[0];
      const block = (hit.object as THREE.Mesh).userData.block as BlockData;

      if (e.button === 2) {
        const blockColor = getBlockColor(block.type, block.color);
        addRemoveAnimation(block.x, block.y, block.z, blockColor);
        onRemoveBlock(block.x, block.y, block.z);
      } else if (e.button === 0) {
        const normal = hit.face?.normal.clone();
        if (!normal) return;

        normal.transformDirection(hit.object.matrixWorld);
        const placeX = block.x + Math.round(normal.x);
        const placeY = block.y + Math.round(normal.y);
        const placeZ = block.z + Math.round(normal.z);

        const placeKey = `${placeX},${placeY},${placeZ}`;
        if (!blockMap.has(placeKey) && !animatedBlocks.has(placeKey)) {
          addPlaceAnimation(placeX, placeY, placeZ, selectedBlockType);
          onPlaceBlock(placeX, placeY, placeZ);
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.current.setFromCamera(mouse.current, camera);
      const meshes = scene.children.filter(child => 
        child instanceof THREE.Mesh && child.userData.block
      ) as THREE.Mesh[];
      
      const intersects = raycaster.current.intersectObjects(meshes);
      if (intersects.length > 0) {
        const hit = intersects[0];
        const block = (hit.object as THREE.Mesh).userData.block as BlockData;
        setHoveredBlock({
          block,
          face: hit.face?.normal || new THREE.Vector3(),
          point: hit.point
        });
      } else {
        setHoveredBlock(null);
      }
    };

    gl.domElement.addEventListener('mousedown', handleClick);
    gl.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
    gl.domElement.addEventListener('mousemove', handleMouseMove);

    return () => {
      gl.domElement.removeEventListener('mousedown', handleClick);
      gl.domElement.removeEventListener('mousemove', handleMouseMove);
    };
  }, [camera, gl, hoveredBlock, onPlaceBlock, onRemoveBlock, scene, blockMap, selectedBlockType, animatedBlocks, addPlaceAnimation, addRemoveAnimation]);

  const staticBlocks = useMemo(() => {
    return blocks.filter(b => !animatedBlocks.has(`${b.x},${b.y},${b.z}`));
  }, [blocks, animatedBlocks]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[50, 80, 50]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={200}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
      />
      <hemisphereLight args={['#87CEEB', '#2d5a27', 0.3]} />
      
      {staticBlocks.map(block => (
        <BlockMesh key={`static-${block.x},${block.y},${block.z}`} block={block} />
      ))}

      {Array.from(animatedBlocks.values()).map(ab => (
        <AnimatedBlockMesh
          key={`anim-${ab.x},${ab.y},${ab.z}`}
          animatedBlock={ab}
          onComplete={handleAnimationComplete}
        />
      ))}
      
      {hoveredBlock && (
        <Highlight
          position={new THREE.Vector3(hoveredBlock.block.x, hoveredBlock.block.y, hoveredBlock.block.z)}
          visible={true}
        />
      )}

      {particles.map(particle => (
        <ParticleMesh
          key={particle.id}
          particle={particle}
          onComplete={handleParticleComplete}
        />
      ))}

      <fog attach="fog" args={['#0F172A', 40, 120]} />
    </>
  );
}

export const WorldRenderer: React.FC<WorldRendererProps> = (props) => {
  return (
    <Canvas
      shadows
      camera={{ position: [10, 8, 10], fov: 60 }}
      gl={{ antialias: true, alpha: false }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor('#0F172A');
        scene.background = new THREE.Color('#0F172A');
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)'
      }}
    >
      <WorldContent {...props} />
    </Canvas>
  );
};
