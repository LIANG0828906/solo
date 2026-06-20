import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../store/appStore';
import { constellations } from '../data/constellations';
import { PanelData, Constellation as ConstellationType } from '../types';

const BRASS_COLOR = '#b8860b';
const RING_COUNT = 6;
const RADIUS_OUTER = 2.0;
const RADIUS_INNER = 0.5;

const ringNames = ['外规环', '黄道环', '白道环', '赤道环', '地平环', '内规环'];
const ringDescs = [
  '外规：浑天仪最外环，象征天球赤道，测量天体赤纬。',
  '黄道环：象征太阳运行轨道，测量黄道经度。',
  '白道环：象征月亮运行轨道，观测月行规律。',
  '赤道环：与天赤道平行，标定赤道坐标系。',
  '地平环：象征地平面，测量天体高度角。',
  '内规：最内环，象征北极圈附近恒显圈。',
];

function Ring({ radius, isEclipsing, onClick, ringIndex, rotationX, rotationZ }: {
  radius: number;
  isEclipsing: boolean;
  onClick: () => void;
  ringIndex: number;
  rotationX: number;
  rotationZ: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    if (meshRef.current && isEclipsing) {
      meshRef.current.rotation.y += delta * 0.8;
    }
  });

  const ringGeometry = useMemo(() => {
    return new THREE.TorusGeometry(radius, 0.05, 24, 128);
  }, [radius]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick();
  };

  const emissiveIntensity = isEclipsing ? 0.3 : (hovered ? 0.8 : 0.5);

  return (
    <mesh
      ref={meshRef}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
      geometry={ringGeometry}
      rotation={[rotationX, 0, rotationZ]}
    >
      <meshStandardMaterial
        color={BRASS_COLOR}
        metalness={0.85}
        roughness={0.25}
        emissive={BRASS_COLOR}
        emissiveIntensity={emissiveIntensity}
      />
    </mesh>
  );
}

function ConstellationPoints({ isEclipsing, opacity, onPointClick }: {
  isEclipsing: boolean;
  opacity: number;
  onPointClick: (data: PanelData) => void;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const fadeRef = useRef(1);
  const fadeDirRef = useRef(-1);

  const { positions, data } = useMemo(() => {
    const pos = new Float32Array(constellations.length * 3);
    const dataArr: ConstellationType[] = [];

    constellations.forEach((c, i) => {
      const radius = RADIUS_INNER + 0.15;
      const azimuthRad = (c.azimuth * Math.PI) / 180;
      const elevationRad = (c.elevation * Math.PI) / 180;
      pos[i * 3] = radius * Math.cos(elevationRad) * Math.cos(azimuthRad);
      pos[i * 3 + 1] = radius * Math.sin(elevationRad);
      pos[i * 3 + 2] = radius * Math.cos(elevationRad) * Math.sin(azimuthRad);
      dataArr.push(c);
    });

    return { positions: pos, data: dataArr };
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      const time = state.clock.elapsedTime;
      const twinkle = 0.6 + 0.4 * Math.sin(time * 2.5);

      if (isEclipsing) {
        fadeRef.current += fadeDirRef.current * 0.02;
        if (fadeRef.current <= 0.1) {
          fadeDirRef.current = 1;
        }
        if (fadeRef.current >= 1) {
          fadeDirRef.current = -1;
        }
        fadeRef.current = Math.max(0.1, Math.min(1, fadeRef.current));
      } else {
        fadeRef.current += (1 - fadeRef.current) * 0.05;
      }

      const material = pointsRef.current.material as THREE.PointsMaterial;
      material.opacity = opacity * twinkle * fadeRef.current;
      material.size = 0.08 * (1 + 0.3 * Math.sin(time * 3));
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const pointIndex = (e as any).index;
    if (pointIndex !== undefined && data[pointIndex]) {
      const c = data[pointIndex];
      onPointClick({
        title: c.name,
        azimuth: c.azimuth,
        elevation: c.elevation,
        description: c.description,
        type: 'constellation',
      });
    }
  };

  return (
    <points
      ref={pointsRef}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
      }}
    >
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={constellations.length}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color="#ffffff"
        transparent
        opacity={opacity}
        sizeAttenuation
      />
    </points>
  );
}

function ArmillaryContent() {
  const { isEclipsing, openPanel } = useAppStore();

  const rings = useMemo(() => {
    const result = [];
    const rotations = [
      { x: 0, z: 0 },
      { x: Math.PI / 2, z: 0 },
      { x: 0, z: Math.PI / 2 },
      { x: Math.PI / 4, z: Math.PI / 6 },
      { x: -Math.PI / 4, z: -Math.PI / 6 },
      { x: Math.PI / 3, z: Math.PI / 4 },
    ];

    for (let i = 0; i < RING_COUNT; i++) {
      const t = i / (RING_COUNT - 1);
      const radius = RADIUS_OUTER - t * (RADIUS_OUTER - RADIUS_INNER);
      result.push({
        radius,
        index: i,
        rotationX: rotations[i]?.x || 0,
        rotationZ: rotations[i]?.z || 0,
      });
    }
    return result;
  }, []);

  const handleRingClick = (index: number) => {
    openPanel({
      title: ringNames[index],
      azimuth: 0,
      elevation: 0,
      description: ringDescs[index],
      type: 'ring',
    });
  };

  return (
    <group>
      {rings.map((ring) => (
        <Ring
          key={ring.index}
          radius={ring.radius}
          isEclipsing={isEclipsing}
          ringIndex={ring.index}
          rotationX={ring.rotationX}
          rotationZ={ring.rotationZ}
          onClick={() => handleRingClick(ring.index)}
        />
      ))}
      <ConstellationPoints
        isEclipsing={isEclipsing}
        opacity={1}
        onPointClick={openPanel}
      />
    </group>
  );
}

export function ArmillarySphere() {
  const { mix, isEclipsing } = useAppStore();
  const opacity = mix;

  const bgColor = isEclipsing ? '#000033' : '#0d0d1a';

  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 60 }}
      gl={{ antialias: true, alpha: true }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: `linear-gradient(180deg, ${bgColor} 0%, #000000 100%)`,
        opacity: opacity,
        mixBlendMode: mix < 1 ? 'multiply' : 'normal',
      }}
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} color="#ffffff" />
      <pointLight position={[-3, 3, -3]} intensity={1.0} color="#d4af37" />
      <pointLight position={[3, -2, 3]} intensity={0.8} color="#ffd700" />
      <pointLight position={[0, 5, 0]} intensity={0.5} color="#ffe4b5" />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={0.3} />
      <ArmillaryContent />
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        minDistance={3}
        maxDistance={10}
        autoRotate={false}
        enableDamping
        dampingFactor={0.05}
      />
    </Canvas>
  );
}
