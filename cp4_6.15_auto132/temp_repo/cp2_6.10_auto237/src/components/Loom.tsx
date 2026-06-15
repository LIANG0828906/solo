import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useGameStore, useSewnPieces } from '../store/gameStore';
import { ClothPiece } from '../types';

function LoomModel() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.5, 0]}>
      <mesh position={[0, -1.2, 0]} receiveShadow>
        <boxGeometry args={[6, 0.3, 3]} />
        <meshStandardMaterial color="#3d2817" roughness={0.8} />
      </mesh>

      <mesh position={[-2.5, -0.2, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 2, 16]} />
        <meshStandardMaterial color="#5c3d24" roughness={0.7} />
      </mesh>
      <mesh position={[2.5, -0.2, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 2, 16]} />
        <meshStandardMaterial color="#5c3d24" roughness={0.7} />
      </mesh>

      <mesh position={[0, 0.8, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 5.2, 16]} />
        <meshStandardMaterial color="#8B4513" roughness={0.6} />
      </mesh>

      <mesh position={[0, -0.6, 0.2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 5, 16]} />
        <meshStandardMaterial color="#b87333" metalness={0.5} roughness={0.3} />
      </mesh>

      <mesh position={[0, -0.8, 0.2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 5, 16]} />
        <meshStandardMaterial color="#b87333" metalness={0.5} roughness={0.3} />
      </mesh>
    </group>
  );
}

function ClothPiece3D({ piece, index, total }: { piece: ClothPiece; index: number; total: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const targetX = -2 + (index % 6) * 0.7;
  const targetY = 0.5 - Math.floor(index / 6) * 0.9;

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5 + index) * 0.05;
      meshRef.current.position.y = targetY + Math.sin(state.clock.elapsedTime * 0.3 + index) * 0.02;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[targetX, targetY, 0.1]}
      castShadow
    >
      <planeGeometry args={[0.6, 0.8]} />
      <meshStandardMaterial
        color={piece.color}
        side={THREE.DoubleSide}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

function CanvasPlane() {
  const sewnPieces = useSewnPieces();

  return (
    <group>
      <mesh position={[0, 0.2, 0]} receiveShadow>
        <planeGeometry args={[4.5, 3]} />
        <meshStandardMaterial
          color="#f5e6c8"
          side={THREE.DoubleSide}
          roughness={0.9}
        />
      </mesh>

      <gridHelper args={[4.5, 6, '#b87333', '#b8733333']} position={[0, 0.21, 0]} />

      {sewnPieces.map((piece, index) => (
        <ClothPiece3D
          key={piece.id}
          piece={piece}
          index={index}
          total={sewnPieces.length}
        />
      ))}

      <SewnThreads pieces={sewnPieces} />
    </group>
  );
}

function SewnThreads({ pieces }: { pieces: ClothPiece[] }) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    pieces.forEach((piece, index) => {
      const x = -2 + (index % 6) * 0.7;
      const y = 0.5 - Math.floor(index / 6) * 0.9;
      pts.push(new THREE.Vector3(x, y, 0.11));
    });
    return pts;
  }, [pieces]);

  if (points.length < 2) return null;

  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return geometry;
  }, [points]);

  return (
    <line geometry={lineGeometry}>
      <lineBasicMaterial color="#b87333" linewidth={2} transparent opacity={0.8} />
    </line>
  );
}

function ParticleField() {
  const count = 200;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const p: { pos: THREE.Vector3; speed: number }[] = [];
    for (let i = 0; i < count; i++) {
      p.push({
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 4
        ),
        speed: 0.01 + Math.random() * 0.02
      });
    }
    return p;
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;

    particles.forEach((p, i) => {
      p.pos.y += p.speed;
      if (p.pos.y > 3) p.pos.y = -3;

      dummy.position.copy(p.pos);
      dummy.rotation.x = state.clock.elapsedTime + i;
      dummy.rotation.y = state.clock.elapsedTime * 0.5 + i;
      dummy.scale.setScalar(0.03 + Math.sin(state.clock.elapsedTime + i) * 0.01);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  const colors = useMemo(() => {
    const c = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const color = new THREE.Color('#f5e6b8');
      color.offsetHSL(Math.random() * 0.1, 0, 0);
      c[i * 3] = color.r;
      c[i * 3 + 1] = color.g;
      c[i * 3 + 2] = color.b;
    }
    return c;
  }, []);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial transparent opacity={0.6} />
      <instancedBufferAttribute attach="instanceColor" args={[colors, 3]} />
    </instancedMesh>
  );
}

function SceneContent() {
  return (
    <>
      <fog attach="fog" args={['#2c1810', 2, 15]} />
      <ambientLight intensity={0.4} color="#f5e6b8" />
      <directionalLight
        position={[5, 8, 5]}
        intensity={0.8}
        color="#fff8e7"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[-3, 2, 2]} intensity={0.6} color="#b87333" />
      <pointLight position={[3, 2, 2]} intensity={0.6} color="#b87333" />

      <LoomModel />
      <CanvasPlane />
      <ParticleField />
      <Stars radius={50} depth={50} count={1000} factor={4} saturation={0} fade speed={0.5} />

      <EffectComposer>
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={0.5} />
        <Vignette eskil={false} offset={0.1} darkness={0.5} />
      </EffectComposer>
    </>
  );
}

export default function Loom() {
  const { sewnOrder, addParticles } = useGameStore((state) => ({
    sewnOrder: state.sewnOrder,
    addParticles: state.addParticles
  }));

  useEffect(() => {
    if (sewnOrder.length > 0) {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      addParticles(centerX, centerY);
    }
  }, [sewnOrder.length, addParticles]);

  return (
    <div id="loom-canvas" className="w-full h-full bg-paper-texture">
      <Canvas
        shadows
        camera={{ position: [0, 1.5, 5], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#2c1810']} />
        <SceneContent />
        <OrbitControls
          enablePan={false}
          minDistance={3}
          maxDistance={8}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
}
