import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Float, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { ChestType, ElementType } from '../api/treasureApi';

interface ChestColors {
  body: string;
  metal: string;
  emissive?: string;
  transparent?: boolean;
  opacity?: number;
}

const CHEST_COLORS: Record<ChestType, ChestColors> = {
  iron_rune: { body: '#8B4513', metal: '#DAA520' },
  crystal_seal: { body: '#87CEEB', metal: '#E0FFFF', transparent: true, opacity: 0.6 },
  shadow_curse: { body: '#2F1B41', metal: '#9932CC', emissive: '#8B008B' },
};

const ELEMENT_COLORS: Record<ElementType, string> = {
  fire: '#ff4444',
  ice: '#44aaff',
  thunder: '#ffcc00',
  shadow: '#8844aa',
  holy: '#ffffff',
};

interface ParticleData {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  life: number;
  maxLife: number;
  size: number;
}

function ParticleSystem({
  count,
  type,
  active,
}: {
  count: number;
  type: 'success' | 'fail' | 'lightning' | 'poison' | 'spike';
  active: boolean;
}) {
  const particlesRef = useRef<THREE.Points>(null);
  const particlesData = useRef<ParticleData[]>([]);
  const activeRef = useRef(active);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const { positions, colors, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    return { positions, colors, sizes };
  }, [count]);

  useFrame((_, delta) => {
    if (!particlesRef.current || !activeRef.current) return;

    const geometry = particlesRef.current.geometry;
    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    const colorAttr = geometry.getAttribute('color') as THREE.BufferAttribute;
    const sizeAttr = geometry.getAttribute('size') as THREE.BufferAttribute;

    particlesData.current = particlesData.current.filter((p) => {
      p.life -= delta;
      if (p.life <= 0) return false;

      p.position.add(p.velocity.clone().multiplyScalar(delta));
      p.velocity.y -= delta * 2;

      const idx = particlesData.current.indexOf(p);
      if (idx >= 0 && idx < count) {
        const alpha = p.life / p.maxLife;
        posAttr.setXYZ(idx, p.position.x, p.position.y, p.position.z);
        colorAttr.setXYZ(idx, p.color.r * alpha, p.color.g * alpha, p.color.b * alpha);
        sizeAttr.setX(idx, p.size * alpha);
      }
      return true;
    });

    if (Math.random() < 0.3 && particlesData.current.length < count) {
      const colors =
        type === 'success'
          ? ['#FFD700', '#9932CC', '#FF69B4']
          : type === 'fail'
          ? ['#FF0000', '#DC143C', '#B22222']
          : type === 'lightning'
          ? ['#FFFF00', '#00FFFF', '#FFFFFF']
          : type === 'poison'
          ? ['#00FF00', '#32CD32', '#006400']
          : ['#8B4513', '#A0522D', '#654321'];

      const color = new THREE.Color(colors[Math.floor(Math.random() * colors.length)]);
      const particle: ParticleData = {
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          type === 'fail' ? 2 : 0.5,
          (Math.random() - 0.5) * 1.5
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          type === 'fail' ? -2 - Math.random() * 2 : 2 + Math.random() * 3,
          (Math.random() - 0.5) * 2
        ),
        color,
        life: 1.5 + Math.random(),
        maxLife: 2,
        size: 0.05 + Math.random() * 0.05,
      };
      particlesData.current.push(particle);
    }

    for (let i = particlesData.current.length; i < count; i++) {
      posAttr.setXYZ(i, 0, -100, 0);
      colorAttr.setXYZ(i, 0, 0, 0);
      sizeAttr.setX(i, 0);
    }

    posAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
          count={count}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function TreasureChest({
  chestType,
  isOpening,
  openResult,
  onClick,
  detailLevel,
}: {
  chestType: ChestType | null;
  isOpening: boolean;
  openResult: { success: boolean; trap_type?: string } | null;
  onClick: () => void;
  detailLevel: number;
}) {
  const lidRef = useRef<THREE.Group>(null);
  const chestRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const metalRefs = useRef<THREE.Mesh[]>([]);
  const shakeTime = useRef(0);
  const flashTime = useRef(0);

  const colors = chestType ? CHEST_COLORS[chestType] : CHEST_COLORS.iron_rune;
  const segments = Math.max(1, detailLevel);

  useFrame((_, delta) => {
    if (lidRef.current) {
      const targetRotation = isOpening && openResult?.success ? -Math.PI / 2.5 : 0;
      const currentRotation = lidRef.current.rotation.x;
      lidRef.current.rotation.x += (targetRotation - currentRotation) * delta * 3;
    }

    if (chestRef.current) {
      if (isOpening && openResult && !openResult.success) {
        shakeTime.current += delta;
        flashTime.current += delta;
        const shakeAmount = Math.sin(shakeTime.current * 50) * 0.05;
        chestRef.current.position.x = shakeAmount;
        chestRef.current.position.z = shakeAmount * 0.5;

        if (bodyRef.current) {
          const material = bodyRef.current.material as THREE.MeshStandardMaterial;
          const flash = Math.sin(flashTime.current * 20) * 0.5 + 0.5;
          material.emissive.setHex(flash > 0.5 ? 0xff0000 : 0x000000);
          material.emissiveIntensity = flash > 0.5 ? 0.5 : 0;
        }
      } else {
        shakeTime.current = 0;
        flashTime.current = 0;
        chestRef.current.position.x = 0;
        chestRef.current.position.z = 0;

        if (bodyRef.current) {
          const material = bodyRef.current.material as THREE.MeshStandardMaterial;
          if (colors.emissive) {
            material.emissive.setHex(parseInt(colors.emissive.replace('#', ''), 16));
            material.emissiveIntensity = isOpening && openResult?.success ? 0.8 : 0.3;
          } else {
            material.emissive.setHex(0x000000);
            material.emissiveIntensity = 0;
          }
        }
      }
    }

    metalRefs.current.forEach((mesh) => {
      if (mesh) {
        const material = mesh.material as THREE.MeshStandardMaterial;
        if (isOpening && openResult?.success) {
          material.emissiveIntensity = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;
        } else {
          material.emissiveIntensity = 0.1;
        }
      }
    });
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick();
  };

  const bodyMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: colors.body,
        metalness: 0.3,
        roughness: 0.5,
        transparent: colors.transparent || false,
        opacity: colors.opacity || 1,
        emissive: colors.emissive || '#000000',
        emissiveIntensity: 0.2,
      }),
    [colors]
  );

  const metalMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: colors.metal,
        metalness: 0.9,
        roughness: 0.2,
        emissive: colors.metal,
        emissiveIntensity: 0.1,
      }),
    [colors]
  );

  return (
    <group ref={chestRef} onClick={handleClick}>
      <mesh ref={bodyRef} material={bodyMaterial} castShadow receiveShadow>
        <boxGeometry args={[2, 1.2, 1.4, segments, segments, segments]} />
      </mesh>

      {[
        [1.05, 0, 0, 0.1, 1.3, 1.5],
        [-1.05, 0, 0, 0.1, 1.3, 1.5],
        [0, 0.65, 0, 2.1, 0.1, 1.5],
        [0, -0.65, 0, 2.1, 0.1, 1.5],
        [0, 0, 0.75, 2.1, 1.3, 0.1],
        [0, 0, -0.75, 2.1, 1.3, 0.1],
      ].map((args, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) metalRefs.current[i] = el;
          }}
          material={metalMaterial}
        >
          <boxGeometry args={args as [number, number, number, number, number, number]} />
        </mesh>
      ))}

      <mesh ref={(el) => { if (el) metalRefs.current[6] = el; }} material={metalMaterial} position={[0, 0.1, 0.76]}>
        <boxGeometry args={[0.3, 0.2, 0.05]} />
      </mesh>

      <group ref={lidRef} position={[0, 0.75, 0]}>
        <mesh material={bodyMaterial} castShadow>
          <boxGeometry args={[2.1, 0.3, 1.5, segments, segments, segments]} />
        </mesh>
        {[
          [1.1, 0, 0, 0.1, 0.35, 1.55],
          [-1.1, 0, 0, 0.1, 0.35, 1.55],
          [0, 0.2, 0, 2.2, 0.1, 1.55],
          [0, -0.2, 0, 2.2, 0.1, 1.55],
        ].map((args, i) => (
          <mesh
            key={`lid-${i}`}
            ref={(el) => { if (el) metalRefs.current[7 + i] = el; }}
            material={metalMaterial}
          >
            <boxGeometry args={args as [number, number, number, number, number, number]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function InscriptionOrbs({ slots }: { slots: any[] }) {
  const orbs = slots.filter((s) => s !== null);

  return (
    <>
      {orbs.map((inscription, idx) => {
        const color = ELEMENT_COLORS[inscription.type as ElementType] || '#ffffff';
        const xPos = idx === 0 ? -2 : idx === 1 ? 0 : 2;
        return (
          <Float key={inscription.id} speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <mesh position={[xPos, 1, -1.5]}>
              <sphereGeometry args={[0.15, 16, 16]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={0.8}
                transparent
                opacity={0.9}
              />
            </mesh>
            <pointLight position={[xPos, 1, -1.5]} color={color} intensity={0.5} distance={2} />
          </Float>
        );
      })}
    </>
  );
}

function SceneContent({
  selectedChest,
  isOpening,
  openResult,
  selectChest,
  inscriptionSlots,
  particleCount,
  detailLevel,
}: {
  selectedChest: ChestType | null;
  isOpening: boolean;
  openResult: any;
  selectChest: (chest: ChestType) => void;
  inscriptionSlots: any[];
  particleCount: number;
  detailLevel: number;
}) {
  const pointLightRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (pointLightRef.current && selectedChest) {
      const colors = CHEST_COLORS[selectedChest];
      pointLightRef.current.color.set(colors.metal);
      if (isOpening && openResult?.success) {
        pointLightRef.current.intensity = 2 + Math.sin(Date.now() * 0.005) * 0.5;
      }
    }
  });

  const showParticles = isOpening || (openResult && Date.now() - new Date(openResult.timestamp).getTime() < 2000);
  const particleType = openResult?.success ? 'success' : 'fail';
  const trapType = openResult?.trap_type;

  const MAX_TOTAL_PARTICLES = 200;
  const baseParticleCount = Math.min(particleCount, MAX_TOTAL_PARTICLES);
  let mainParticleCount = baseParticleCount;
  let trapParticleCount = 0;

  if (showParticles && trapType) {
    const trapRatio = 0.3;
    trapParticleCount = Math.floor(baseParticleCount * trapRatio);
    mainParticleCount = baseParticleCount - trapParticleCount;
  }

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} castShadow />
      <pointLight
        ref={pointLightRef}
        position={[0, 2, 2]}
        intensity={1}
        distance={10}
        color="#DAA520"
      />

      <Stars radius={50} depth={50} count={1000} factor={4} saturation={0} fade speed={0.5} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.8, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#1a1427" roughness={0.8} metalness={0.2} />
      </mesh>

      <InscriptionOrbs slots={inscriptionSlots} />

      {selectedChest ? (
        <Float speed={1} rotationIntensity={0.2} floatIntensity={0.3}>
          <TreasureChest
            chestType={selectedChest}
            isOpening={isOpening}
            openResult={openResult}
            onClick={() => selectChest(selectedChest)}
            detailLevel={detailLevel}
          />
        </Float>
      ) : (
        <group>
          {(Object.keys(CHEST_COLORS) as ChestType[]).map((type, idx) => (
            <Float key={type} speed={1} rotationIntensity={0.1} floatIntensity={0.2}>
              <group position={[(idx - 1) * 2.5, 0, 0]}>
                <TreasureChest
                  chestType={type}
                  isOpening={false}
                  openResult={null}
                  onClick={() => selectChest(type)}
                  detailLevel={detailLevel}
                />
              </group>
            </Float>
          ))}
        </group>
      )}

      {showParticles && (
        <>
          <ParticleSystem count={mainParticleCount} type={particleType} active={showParticles} />
          {trapType && trapParticleCount > 0 && (
            <ParticleSystem count={trapParticleCount} type={trapType} active={showParticles} />
          )}
        </>
      )}

      <OrbitControls
        enablePan={false}
        minDistance={4}
        maxDistance={8}
        target={[0, 0, 0]}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
}

function PerformanceMonitor({
  onFpsUpdate,
}: {
  onFpsUpdate: (fps: number) => void;
}) {
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useFrame(() => {
    frameCount.current++;
    const now = performance.now();
    const elapsed = now - lastTime.current;

    if (elapsed >= 1000) {
      const fps = Math.round((frameCount.current * 1000) / elapsed);
      onFpsUpdate(fps);
      frameCount.current = 0;
      lastTime.current = now;
    }
  });

  return null;
}

export const Scene3D: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  const selectedChest = useGameStore((s) => s.selectedChest);
  const isOpening = useGameStore((s) => s.isOpening);
  const openResult = useGameStore((s) => s.openResult);
  const selectChest = useGameStore((s) => s.selectChest);
  const inscriptionSlots = useGameStore((s) => s.inscriptionSlots);

  const [fps, setFps] = useState(60);
  const [particleCount, setParticleCount] = useState(200);
  const [detailLevel, setDetailLevel] = useState(4);
  const lastDowngradeTime = useRef(0);

  const handleFpsUpdate = (currentFps: number) => {
    setFps(currentFps);

    const now = Date.now();
    if (now - lastDowngradeTime.current > 30000 && currentFps < 50) {
      lastDowngradeTime.current = now;

      setParticleCount((prev) => Math.max(50, Math.floor(prev * 0.5)));
      setDetailLevel((prev) => Math.max(1, prev - 1));
    }
  };

  return (
    <div
      style={{
        height: '380px',
        borderRadius: '16px',
        border: '1px solid #3a2a5a',
        overflow: 'hidden',
        position: 'relative',
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          zIndex: 10,
          background: 'rgba(0,0,0,0.6)',
          padding: '6px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          color: fps < 50 ? '#ff6b6b' : '#a898c8',
          fontFamily: 'monospace',
          pointerEvents: 'none',
        }}
      >
        FPS: {fps} | 粒子: {particleCount} | 细节: Lv.{detailLevel}
      </div>

      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 2, 6], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        shadows
      >
        <color attach="background" args={['#0d0a14']} />
        <fog attach="fog" args={['#0d0a14', 10, 30]} />

        <PerformanceMonitor onFpsUpdate={handleFpsUpdate} />

        <SceneContent
          selectedChest={selectedChest}
          isOpening={isOpening}
          openResult={openResult}
          selectChest={selectChest}
          inscriptionSlots={inscriptionSlots}
          particleCount={particleCount}
          detailLevel={detailLevel}
        />
      </Canvas>
    </div>
  );
};

export default Scene3D;
