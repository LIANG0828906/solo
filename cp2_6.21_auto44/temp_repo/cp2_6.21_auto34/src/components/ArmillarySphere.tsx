import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, ThreeEvent, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
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

function RingTickMarks({ radius, tickCount = 36 }: { radius: number; tickCount?: number }) {
  const tickGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.005, 0);
    shape.lineTo(0.005, 0);
    shape.lineTo(0.005, 0.08);
    shape.lineTo(-0.005, 0.08);
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, { depth: 0.01, bevelEnabled: false });
  }, []);

  const ticks = useMemo(() => {
    const result = [];
    for (let i = 0; i < tickCount; i++) {
      const angle = (i / tickCount) * Math.PI * 2;
      const isMajor = i % 6 === 0;
      result.push({
        angle,
        isMajor,
        scale: isMajor ? 1.5 : 1,
      });
    }
    return result;
  }, [tickCount]);

  return (
    <group>
      {ticks.map((tick, i) => (
        <mesh
          key={i}
          geometry={tickGeometry}
          position={[
            Math.cos(tick.angle) * radius,
            Math.sin(tick.angle) * radius,
            0,
          ]}
          rotation={[0, 0, tick.angle + Math.PI / 2]}
          scale={[1, tick.scale, 1]}
        >
          <meshBasicMaterial color="#d4af37" transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function Ring({ radius, isEclipsing, onClick, ringIndex, rotationX, rotationZ, showTicks }: {
  radius: number;
  isEclipsing: boolean;
  onClick: () => void;
  ringIndex: number;
  rotationX: number;
  rotationZ: number;
  showTicks?: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const [hovered, setHovered] = useState(false);
  const breathPhase = useMemo(() => Math.random() * Math.PI * 2, []);
  const breathSpeed = useMemo(() => 0.8 + Math.random() * 0.4, []);

  useFrame((state, delta) => {
    if (meshRef.current && isEclipsing) {
      meshRef.current.rotation.y += delta * 0.8;
    }

    if (materialRef.current) {
      const time = state.clock.elapsedTime;
      const breath = Math.sin(time * breathSpeed + breathPhase) * 0.5 + 0.5;

      const baseEmissive = hovered ? 0.9 : 0.6;
      const breathEmissive = breath * 0.3;
      const eclipseFactor = isEclipsing ? 0.7 : 1.0;

      materialRef.current.emissiveIntensity = (baseEmissive + breathEmissive) * eclipseFactor;
      materialRef.current.roughness = 0.22 - breath * 0.05;
      materialRef.current.metalness = 0.85 + breath * 0.08;
    }
  });

  const ringGeometry = useMemo(() => {
    return new THREE.TorusGeometry(radius, 0.07, 32, 160);
  }, [radius]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <group rotation={[rotationX, 0, rotationZ]}>
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
        castShadow={true}
        receiveShadow={true}
      >
        <meshStandardMaterial
          ref={materialRef}
          color={BRASS_COLOR}
          metalness={0.85}
          roughness={0.22}
          emissive={BRASS_COLOR}
          emissiveIntensity={0.6}
          envMapIntensity={1.2}
        />
      </mesh>
      {showTicks && <RingTickMarks radius={radius} tickCount={36} />}
    </group>
  );
}

function Star({ c, index, baseOpacity, isEclipsing, fadeRef, onClick }: {
  c: ConstellationType;
  index: number;
  baseOpacity: number;
  isEclipsing: boolean;
  fadeRef: React.MutableRefObject<number>;
  onClick: (data: PanelData) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const twinklePhase = useMemo(() => Math.random() * Math.PI * 2, []);
  const twinkleSpeed = useMemo(() => 0.5 + Math.random() * 1.5, []);

  const position = useMemo(() => {
    const radius = RADIUS_INNER + 0.15;
    const azimuthRad = (c.azimuth * Math.PI) / 180;
    const elevationRad = (c.elevation * Math.PI) / 180;
    return [
      radius * Math.cos(elevationRad) * Math.cos(azimuthRad),
      radius * Math.sin(elevationRad),
      radius * Math.cos(elevationRad) * Math.sin(azimuthRad),
    ] as [number, number, number];
  }, [c]);

  const geometry = useMemo(() => new THREE.SphereGeometry(0.025, 16, 16), []);

  useFrame((state) => {
    if (materialRef.current && meshRef.current) {
      const time = state.clock.elapsedTime;
      const twinkle = 0.55 + 0.45 * Math.sin(time * twinkleSpeed + twinklePhase);
      const sizePulse = 1 + 0.25 * Math.sin(time * twinkleSpeed * 1.3 + twinklePhase);

      const fade = fadeRef.current;
      materialRef.current.opacity = baseOpacity * twinkle * fade;
      meshRef.current.scale.setScalar(sizePulse);
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick({
      title: c.name,
      azimuth: c.azimuth,
      elevation: c.elevation,
      description: c.description,
      type: 'constellation',
    });
  };

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
      }}
      geometry={geometry}
    >
      <meshBasicMaterial
        ref={materialRef}
        color="#ffffff"
        transparent
        opacity={baseOpacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

function ConstellationPoints({ isEclipsing, opacity, onPointClick }: {
  isEclipsing: boolean;
  opacity: number;
  onPointClick: (data: PanelData) => void;
}) {
  const fadeRef = useRef(1);
  const fadeDirRef = useRef(-1);

  useFrame(() => {
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
  });

  return (
    <group>
      {constellations.map((c, i) => (
        <Star
          key={i}
          c={c}
          index={i}
          baseOpacity={opacity}
          isEclipsing={isEclipsing}
          fadeRef={fadeRef}
          onClick={onPointClick}
        />
      ))}
    </group>
  );
}

function AngleDisplay() {
  const { camera } = useThree();
  const [azimuth, setAzimuth] = useState(0);
  const [elevation, setElevation] = useState(0);

  useFrame(() => {
    const spherical = new THREE.Spherical();
    spherical.setFromVector3(camera.position);
    const azi = THREE.MathUtils.radToDeg(spherical.theta);
    const ele = THREE.MathUtils.radToDeg(spherical.phi);
    setAzimuth(((azi % 360) + 360) % 360);
    setElevation(90 - ele);
  });

  return (
    <Html position={[-2.3, -1.8, 0]} style={{ pointerEvents: 'none' }}>
      <div
        style={{
          fontFamily: "'KaiTi', 'STKaiti', serif",
          color: '#d4af37',
          fontSize: '12px',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          padding: '6px 12px',
          borderRadius: '6px',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          backdropFilter: 'blur(4px)',
          whiteSpace: 'nowrap',
          letterSpacing: '1px',
          textShadow: '0 0 4px rgba(212, 175, 55, 0.5)',
        }}
      >
        <div>方位角: {azimuth.toFixed(1)}°</div>
        <div style={{ marginTop: '2px' }}>仰角: {elevation.toFixed(1)}°</div>
      </div>
    </Html>
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
        showTicks: i === 0,
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
          showTicks={ring.showTicks}
          onClick={() => handleRingClick(ring.index)}
        />
      ))}
      <ConstellationPoints
        isEclipsing={isEclipsing}
        opacity={1}
        onPointClick={openPanel}
      />
      <AngleDisplay />
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
      shadows={{
        enabled: true,
        type: THREE.PCFShadowMap,
      }}
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
      <ambientLight intensity={0.65} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={1.2}
        color="#ffffff"
        castShadow={true}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-bias={-0.0005}
      />
      <pointLight
        position={[-3, 3, -3]}
        intensity={0.9}
        color="#d4af37"
        castShadow={true}
        distance={20}
        decay={2}
      />
      <pointLight
        position={[3, -2, 3]}
        intensity={0.7}
        color="#ffd700"
        distance={20}
        decay={2}
      />
      <pointLight
        position={[0, 5, 0]}
        intensity={0.4}
        color="#ffe4b5"
        distance={30}
        decay={2}
      />
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
