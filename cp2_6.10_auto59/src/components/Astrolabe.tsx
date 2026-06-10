import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useClockStore } from '@/store/useClockStore';
import {
  CELESTIAL_DIAMETER,
  SIGHT_TUBE_LENGTH,
  GEAR_RATIO,
  ERROR_THRESHOLD,
  BLINK_PERIOD,
  COLORS,
  TWENTY_EIGHT_STARS,
  ASPECT_RATIO,
} from '@/utils/constants';

interface StarData {
  name: string;
  ra: number;
  dec: number;
  brightness: number;
}

function CelestialSphere() {
  const sphereRef = useRef<THREE.Mesh>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const [hoveredStar, setHoveredStar] = useState<StarData | null>(null);

  const { pivotAngle, errorAngle } = useClockStore((state) => ({
    pivotAngle: state.pivotAngle,
    errorAngle: state.errorAngle,
  }));

  const { positions, colors, sizes } = useMemo(() => {
    const positions = new Float32Array(TWENTY_EIGHT_STARS.length * 3);
    const colors = new Float32Array(TWENTY_EIGHT_STARS.length * 3);
    const sizes = new Float32Array(TWENTY_EIGHT_STARS.length);

    const radius = CELESTIAL_DIAMETER / 2 - 2;

    TWENTY_EIGHT_STARS.forEach((star, i) => {
      const raRad = (star.ra * Math.PI) / 180;
      const decRad = (star.dec * Math.PI) / 180;

      positions[i * 3] = radius * Math.cos(decRad) * Math.cos(raRad);
      positions[i * 3 + 1] = radius * Math.sin(decRad);
      positions[i * 3 + 2] = radius * Math.cos(decRad) * Math.sin(raRad);

      const brightnessFactor = Math.max(0, Math.min(1, (6 - star.brightness) / 6));
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 1 - brightnessFactor * 0.3;
      colors[i * 3 + 2] = 1 - brightnessFactor * 0.1;

      sizes[i] = 2 + brightnessFactor * 2;
    });

    return { positions, colors, sizes };
  }, []);

  useFrame(() => {
    if (sphereRef.current) {
      const rotationAngle = (pivotAngle * GEAR_RATIO * Math.PI) / 180;
      sphereRef.current.rotation.y = rotationAngle;
    }
    if (pointsRef.current) {
      const rotationAngle = (pivotAngle * GEAR_RATIO * Math.PI) / 180;
      pointsRef.current.rotation.y = rotationAngle;
    }
  });

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    const instanceId = (event as any).instanceId;
    if (instanceId !== undefined && TWENTY_EIGHT_STARS[instanceId]) {
      setHoveredStar(TWENTY_EIGHT_STARS[instanceId]);
    }
  };

  const handlePointerOut = () => {
    setHoveredStar(null);
  };

  return (
    <group>
      <mesh ref={sphereRef}>
        <sphereGeometry args={[CELESTIAL_DIAMETER / 2, 64, 64]} />
        <meshStandardMaterial
          color={COLORS.celestialBlue}
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
          metalness={0.1}
          roughness={0.8}
        />
      </mesh>

      <points
        ref={pointsRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={TWENTY_EIGHT_STARS.length}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={TWENTY_EIGHT_STARS.length}
            array={colors}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={TWENTY_EIGHT_STARS.length}
            array={sizes}
            itemSize={1}
          />
        </bufferGeometry>
        <pointsMaterial
          size={3}
          vertexColors
          transparent
          opacity={0.9}
          sizeAttenuation
        />
      </points>

      {hoveredStar && (
        <Html position={[0, 0, 0]} center>
          <div
            style={{
              background: 'rgba(10, 10, 42, 0.9)',
              border: `1px solid ${COLORS.gold}`,
              padding: '8px 12px',
              borderRadius: '4px',
              color: COLORS.gold,
              fontFamily: '"SimSun", serif',
              fontSize: '14px',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {hoveredStar.name}
          </div>
        </Html>
      )}
    </group>
  );
}

function ArmillarySphere() {
  const groupRef = useRef<THREE.Group>(null);
  const sightTubeRef = useRef<THREE.Group>(null);
  const crosshairRef = useRef<THREE.Group>(null);
  const blinkTimeRef = useRef(0);

  const { pivotAngle, errorAngle } = useClockStore((state) => ({
    pivotAngle: state.pivotAngle,
    errorAngle: state.errorAngle,
  }));

  useFrame((state) => {
    if (groupRef.current) {
      const rotationAngle = (pivotAngle * GEAR_RATIO * Math.PI) / 180;
      groupRef.current.rotation.y = rotationAngle;
    }

    if (sightTubeRef.current) {
      const baseAngle = (pivotAngle * GEAR_RATIO * Math.PI) / 180;
      const errorRad = (errorAngle * Math.PI) / (180 * 60);
      sightTubeRef.current.rotation.y = baseAngle + errorRad;
    }

    if (crosshairRef.current) {
      const isOverThreshold = errorAngle > ERROR_THRESHOLD;
      if (isOverThreshold) {
        blinkTimeRef.current += state.clock.getDelta() * 1000;
        const visible = Math.floor(blinkTimeRef.current / BLINK_PERIOD) % 2 === 0;
        crosshairRef.current.visible = visible;
      } else {
        crosshairRef.current.visible = true;
        blinkTimeRef.current = 0;
      }
    }
  });

  const ringRadius = CELESTIAL_DIAMETER / 2 + 10;
  const tubeRadius = 3;

  const crosshairColor =
    errorAngle > ERROR_THRESHOLD ? COLORS.crosshairRed : COLORS.crosshairGreen;

  return (
    <group ref={groupRef}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[ringRadius, tubeRadius, 16, 100]} />
        <meshStandardMaterial
          color={COLORS.bronzeLight}
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, Math.PI / 6]}>
        <torusGeometry args={[ringRadius - 10, tubeRadius - 1, 16, 100]} />
        <meshStandardMaterial
          color={COLORS.bronze}
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>

      <mesh rotation={[0, 0, 0]}>
        <torusGeometry args={[ringRadius - 20, tubeRadius - 1, 16, 100]} />
        <meshStandardMaterial
          color={COLORS.bronzeDark}
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>

      <group ref={sightTubeRef}>
        <mesh position={[SIGHT_TUBE_LENGTH / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[1, 1, SIGHT_TUBE_LENGTH, 8]} />
          <meshStandardMaterial
            color={COLORS.sightTube}
            emissive={COLORS.sightTube}
            emissiveIntensity={0.3}
          />
        </mesh>

        <group ref={crosshairRef} position={[SIGHT_TUBE_LENGTH, 0, 0]}>
          <mesh rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 15, 4]} />
            <meshBasicMaterial color={crosshairColor} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.3, 0.3, 15, 4]} />
            <meshBasicMaterial color={crosshairColor} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function SceneContent() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[100, 100, 50]} intensity={0.8} color="#ffffff" />
      <pointLight position={[-100, 50, 100]} intensity={0.5} color="#ffd700" />
      <pointLight position={[0, -100, 0]} intensity={0.3} color="#87ceeb" />

      <CelestialSphere />
      <ArmillarySphere />

      <OrbitControls
        enablePan={false}
        minDistance={150}
        maxDistance={400}
        autoRotate={false}
      />
    </>
  );
}

export default function Astrolabe() {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: [0, 80, 250], fov: 45, aspect: ASPECT_RATIO }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <color attach="background" args={[COLORS.backgroundEnd]} />
        <fog attach="fog" args={[COLORS.backgroundEnd, 300, 500]} />
        <SceneContent />
      </Canvas>
    </div>
  );
}
