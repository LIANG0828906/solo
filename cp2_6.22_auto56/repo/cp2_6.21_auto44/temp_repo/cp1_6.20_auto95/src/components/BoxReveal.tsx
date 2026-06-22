import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { AnimatePresence, motion } from 'framer-motion';
import * as THREE from 'three';
import type { Artwork } from '../../shared/types';

interface Props {
  artwork: Artwork | null;
  onClose: () => void;
}

const NEON_COLORS = ['#00f0ff', '#ff00aa', '#00ff87', '#ffbe0b', '#8b5cf6'];

function ConvergingParticles({ progress }: { progress: number }) {
  const ref = useRef<THREE.Points>(null);
  const count = 2500;

  const positions = useRef<Float32Array | null>(null);
  const targets = useRef<Float32Array | null>(null);
  const colors = useRef<Float32Array | null>(null);

  useEffect(() => {
    const pos = new Float32Array(count * 3);
    const tgt = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 6 + Math.random() * 4;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      tgt[i * 3] = (Math.random() - 0.5) * 0.6;
      tgt[i * 3 + 1] = (Math.random() - 0.5) * 0.8;
      tgt[i * 3 + 2] = (Math.random() - 0.5) * 0.6;

      const c = new THREE.Color(NEON_COLORS[i % NEON_COLORS.length]);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }

    positions.current = pos;
    targets.current = tgt;
    colors.current = col;
  }, []);

  useFrame(() => {
    if (!ref.current || !positions.current || !targets.current) return;
    const geo = ref.current.geometry;
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    const t = Math.pow(progress, 2.2);
    for (let i = 0; i < count * 3; i++) {
      arr[i] = positions.current[i] + (targets.current[i] - positions.current[i]) * t;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions.current ?? new Float32Array(count * 3)}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors.current ?? new Float32Array(count * 3)}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={progress > 0.95 ? (1 - progress) * 20 : 1}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function ChestBox({ rotate, opened }: { rotate: number; opened: boolean }) {
  const lidRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (bodyRef.current) {
      bodyRef.current.rotation.y += delta * 0.8 * rotate;
    }
    if (lidRef.current) {
      const target = opened ? -Math.PI / 2.2 : 0;
      lidRef.current.rotation.x += (target - lidRef.current.rotation.x) * 0.1;
    }
  });

  return (
    <group ref={bodyRef}>
      <mesh position={[0, -0.05, 0]} castShadow>
        <boxGeometry args={[1.2, 0.8, 0.8]} />
        <meshStandardMaterial
          color="#1a0a2e"
          metalness={0.9}
          roughness={0.2}
          emissive="#4a1e8f"
          emissiveIntensity={0.3}
        />
      </mesh>
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[1.22, 0.82, 0.82]} />
        <meshBasicMaterial color="#00f0ff" wireframe transparent opacity={0.15} />
      </mesh>

      <group ref={lidRef} position={[0, 0.35, -0.4]}>
        <mesh position={[0, 0, 0.4]} castShadow>
          <boxGeometry args={[1.2, 0.25, 0.8]} />
          <meshStandardMaterial
            color="#2d0f52"
            metalness={0.9}
            roughness={0.2}
            emissive="#ff00aa"
            emissiveIntensity={0.4}
          />
        </mesh>
        <mesh position={[0, 0, 0.4]}>
          <boxGeometry args={[1.22, 0.27, 0.82]} />
          <meshBasicMaterial color="#ff00aa" wireframe transparent opacity={0.2} />
        </mesh>
      </group>

      <mesh position={[0, 0.05, 0.41]}>
        <sphereGeometry args={[0.12, 24, 24]} />
        <meshStandardMaterial
          color="#ffbe0b"
          emissive="#ffbe0b"
          emissiveIntensity={2}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
}

function FireworkBurst({ trigger }: { trigger: boolean }) {
  const groupsRef = useRef<(THREE.Points | null)[]>([]);
  const origins = useRef<{ x: number; y: number; z: number }[]>([]);
  const startTime = useRef<number>(-1);
  const bursts = 6;
  const perBurst = 200;

  useEffect(() => {
    if (!trigger) return;
    startTime.current = performance.now();
    for (let i = 0; i < bursts; i++) {
      origins.current.push({
        x: (Math.random() - 0.5) * 1.5,
        y: (Math.random() - 0.5) * 1.5,
        z: (Math.random() - 0.5) * 1.5
      });
    }
  }, [trigger]);

  const particlesData = useRef<Float32Array[]>([]);

  useEffect(() => {
    for (let b = 0; b < bursts; b++) {
      const data = new Float32Array(perBurst * 3);
      for (let i = 0; i < perBurst; i++) {
        data[i * 3] = 0;
        data[i * 3 + 1] = 0;
        data[i * 3 + 2] = 0;
      }
      particlesData.current.push(data);
    }
  }, []);

  useFrame(() => {
    if (!trigger || startTime.current < 0) return;
    const t = (performance.now() - startTime.current) / 1000;
    groupsRef.current.forEach((g, bi) => {
      if (!g) return;
      const origin = origins.current[bi];
      const colorIdx = bi % NEON_COLORS.length;
      const mat = g.material as THREE.PointsMaterial;
      mat.opacity = Math.max(0, 1 - t / 2);
      mat.color.set(NEON_COLORS[colorIdx]);

      const posAttr = g.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < perBurst; i++) {
        const seedAngle1 = ((i * 137.5) % 360) * (Math.PI / 180);
        const seedAngle2 = (((i * 73.3) + bi * 60) % 360) * (Math.PI / 180);
        const speed = 0.8 + (i / perBurst) * 1.5;
        arr[i * 3] = origin.x + Math.cos(seedAngle1) * Math.sin(seedAngle2) * speed * t;
        arr[i * 3 + 1] = origin.y + Math.sin(seedAngle1) * Math.sin(seedAngle2) * speed * t - t * t * 0.4;
        arr[i * 3 + 2] = origin.z + Math.cos(seedAngle2) * speed * t;
      }
      posAttr.needsUpdate = true;
    });
  });

  return (
    <>
      {Array.from({ length: bursts }).map((_, i) => (
        <points
          key={i}
          ref={el => {
            groupsRef.current[i] = el;
          }}
        >
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={perBurst}
              array={particlesData.current[i] ?? new Float32Array(perBurst * 3)}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.07}
            color={NEON_COLORS[i % NEON_COLORS.length]}
            transparent
            opacity={trigger ? 1 : 0}
            sizeAttenuation
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      ))}
    </>
  );
}

export default function BoxReveal({ artwork, onClose }: Props) {
  const [phase, setPhase] = useState<'converge' | 'chest' | 'burst' | 'reveal'>('converge');
  const [progress, setProgress] = useState(0);
  const [showArtwork, setShowArtwork] = useState(false);

  useEffect(() => {
    if (!artwork) return;
    setPhase('converge');
    setProgress(0);
    setShowArtwork(false);

    let p = 0;
    const t1 = setInterval(() => {
      p = Math.min(1, p + 0.035);
      setProgress(p);
      if (p >= 1) {
        clearInterval(t1);
        setPhase('chest');
        setTimeout(() => setPhase('burst'), 1600);
        setTimeout(() => {
          setPhase('reveal');
          setShowArtwork(true);
        }, 2400);
      }
    }, 20);

    return () => {
      clearInterval(t1);
    };
  }, [artwork]);

  if (!artwork) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(5, 5, 15, 0.92)',
        backdropFilter: 'blur(14px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={phase === 'reveal' ? onClose : undefined}
    >
      <div style={{ position: 'absolute', top: 24, left: 0, right: 0, textAlign: 'center' }}>
        <div className="font-display glow-text-pink" style={{ fontSize: 20, letterSpacing: '0.3em' }}>
          {phase === 'converge' && 'ACTIVATING QUANTUM RANDOMIZER'}
          {phase === 'chest' && 'UNLOCKING MYSTERY CHEST'}
          {phase === 'burst' && '✨ REVEALING YOUR ARTWORK ✨'}
          {phase === 'reveal' && '🎉 CONGRATULATIONS! 🎉'}
        </div>
      </div>

      <div style={{ width: '100%', height: '72vh', position: 'relative' }}>
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <ambientLight intensity={0.4} />
          <pointLight position={[3, 3, 3]} color="#00f0ff" intensity={1.5} />
          <pointLight position={[-3, 2, -3]} color="#ff00aa" intensity={1.5} />
          <pointLight position={[0, -3, 2]} color="#ffbe0b" intensity={0.8} />
          <OrbitControls enableZoom={false} enablePan={false} autoRotate={phase !== 'reveal'} />
          {phase === 'converge' && <ConvergingParticles progress={progress} />}
          {(phase === 'chest' || phase === 'burst' || phase === 'reveal') && (
            <ChestBox rotate={phase === 'reveal' ? 0 : 1} opened={phase !== 'chest'} />
          )}
          {(phase === 'burst' || phase === 'reveal') && <FireworkBurst trigger={phase !== 'chest'} />}
        </Canvas>
      </div>

      <AnimatePresence>
        {showArtwork && (
          <motion.div
            initial={{ scale: 0.6, opacity: 0, y: 60 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 16, delay: 0.1 }}
            className="glass-card-strong"
            style={{
              position: 'absolute',
              bottom: 40,
              left: '50%',
              transform: 'translateX(-50%)',
              padding: 24,
              minWidth: 420,
              textAlign: 'center',
              border: '1px solid rgba(0, 240, 255, 0.35)',
              boxShadow: '0 0 40px rgba(0, 240, 255, 0.3), 0 0 80px rgba(255, 0, 170, 0.15)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <img
              src={artwork.previewImage}
              alt={artwork.title}
              style={{
                width: '100%',
                maxHeight: 180,
                objectFit: 'contain',
                borderRadius: 10,
                marginBottom: 16,
                boxShadow: '0 0 20px rgba(0, 240, 255, 0.4)'
              }}
            />
            <div className="font-display glow-text" style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
              {artwork.title}
            </div>
            <div className="tag-chip" style={{ marginBottom: 10 }}>{artwork.code}</div>
            <p style={{ color: '#c9c9d6', fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
              {artwork.description}
            </p>
            <button className="neon-btn neon-btn-pink" onClick={onClose}>
              ADD TO COLLECTION
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {phase === 'reveal' && (
        <div style={{ position: 'absolute', bottom: 10, color: '#7a7a8e', fontSize: 12, letterSpacing: '0.2em' }}>
          Click anywhere to close
        </div>
      )}
    </motion.div>
  );
}
