import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSpring, animated, to } from '@react-spring/three';
import { useStore } from './store';
import type { PlanetData } from './types';

const CME_INTERVAL = 8000;
const CME_DURATION = 1500;

function createEllipseRingGeometry(
  xRadius: number,
  zRadius: number,
  thickness: number,
  segments: number
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const innerX = cos * (xRadius - thickness / 2);
    const innerZ = sin * (zRadius - thickness / 2);
    const outerX = cos * (xRadius + thickness / 2);
    const outerZ = sin * (zRadius + thickness / 2);
    vertices.push(innerX, 0, innerZ);
    vertices.push(outerX, 0, outerZ);
  }

  for (let i = 0; i < segments; i++) {
    const a = i * 2;
    const b = i * 2 + 1;
    const c = i * 2 + 2;
    const d = i * 2 + 3;
    indices.push(a, b, c);
    indices.push(b, d, c);
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function StarField() {
  const ref = useRef<THREE.Points>(null);
  const count = 800;

  const [positions, sizes, opacities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const siz = new Float32Array(count);
    const opa = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const radius = 100 + Math.random() * 100;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);
      siz[i] = 1 + Math.random() * 2;
      opa[i] = 0.3 + Math.random() * 0.6;
    }
    return [pos, siz, opa];
  }, []);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.01;
      ref.current.rotation.x += delta * 0.005;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#FFFFFF"
        size={0.5}
        transparent
        opacity={0.8}
        sizeAttenuation
        vertexColors={false}
      />
    </points>
  );
}

function Sun() {
  const sunRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [cmeActive, setCmeActive] = useState(false);
  const cmeRef = useRef<THREE.Points>(null);
  const cmeTimeRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cmePositions = useMemo(() => {
    const count = 100;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2.2;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  const triggerCME = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    cmeTimeRef.current = 0;
    setCmeActive(true);
    timeoutRef.current = setTimeout(() => {
      setCmeActive(false);
      timeoutRef.current = null;
    }, CME_DURATION);
  };

  useEffect(() => {
    triggerCME();
    const interval = setInterval(triggerCME, CME_INTERVAL);
    return () => {
      clearInterval(interval);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useFrame((state, delta) => {
    if (sunRef.current) {
      sunRef.current.rotation.y += delta * 0.1;
    }
    if (glowRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      glowRef.current.scale.setScalar(pulse);
    }
    if (cmeActive && cmeRef.current) {
      cmeTimeRef.current += delta * 1000;
      const t = Math.min(cmeTimeRef.current / CME_DURATION, 1);
      const positions = cmeRef.current.geometry.attributes.position.array as Float32Array;
      const original = cmePositions;
      for (let i = 0; i < positions.length / 3; i++) {
        const ox = original[i * 3];
        const oy = original[i * 3 + 1];
        const oz = original[i * 3 + 2];
        const len = Math.sqrt(ox * ox + oy * oy + oz * oz);
        const nx = ox / len;
        const ny = oy / len;
        const nz = oz / len;
        const expand = 2.2 + t * 8;
        positions[i * 3] = nx * expand;
        positions[i * 3 + 1] = ny * expand;
        positions[i * 3 + 2] = nz * expand;
      }
      cmeRef.current.geometry.attributes.position.needsUpdate = true;
      (cmeRef.current.material as THREE.PointsMaterial).opacity = 1 - t;
    }
  });

  return (
    <group>
      <pointLight position={[0, 0, 0]} intensity={2} distance={200} color="#FFF5E0" />
      <ambientLight intensity={0.08} />
      <mesh ref={sunRef}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshBasicMaterial color="#FFD700" />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[2.4, 32, 32]} />
        <meshBasicMaterial color="#FFA500" transparent opacity={0.3} side={THREE.BackSide} />
      </mesh>
      {cmeActive && (
        <points ref={cmeRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[cmePositions.slice(), 3]} />
          </bufferGeometry>
          <pointsMaterial color="#FF6B35" size={0.15} transparent opacity={1} sizeAttenuation />
        </points>
      )}
    </group>
  );
}

function OrbitRing({ radius }: { radius: number }) {
  const geometry = useMemo(() => {
    const eccentricity = 0.02;
    const xRadius = radius;
    const zRadius = radius * (1 - eccentricity);
    const thickness = 0.03;
    return createEllipseRingGeometry(xRadius, zRadius, thickness, 256);
  }, [radius]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={geometry}>
      <meshBasicMaterial
        color="#4A90D9"
        transparent
        opacity={0.3}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

function Planet({ planet, planetIndex }: { planet: PlanetData; planetIndex: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const angleRef = useRef(planetIndex * (Math.PI / 4));
  const focusAndSelect = useStore(s => s.focusAndSelect);
  const focusedPlanetId = useStore(s => s.focusedPlanetId);
  const [hovered, setHovered] = useState(false);

  const isFocused = focusedPlanetId === planet.id;

  const springs = useSpring({
    scale: isFocused ? 1.3 : hovered ? 1.15 : 1,
    config: { tension: 170, friction: 26 }
  });

  useFrame((_, delta) => {
    angleRef.current += planet.orbitSpeed;
    const x = Math.cos(angleRef.current) * planet.orbitRadius;
    const z = Math.sin(angleRef.current) * planet.orbitRadius;
    if (groupRef.current) {
      groupRef.current.position.x = x;
      groupRef.current.position.z = z;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += planet.rotationSpeed;
    }
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    focusAndSelect(planet.id);
  };

  return (
    <>
      <OrbitRing radius={planet.orbitRadius} />
      <animated.group ref={groupRef} scale={springs.scale}>
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
            document.body.style.cursor = 'auto';
          }}
        >
          <sphereGeometry args={[planet.size * 0.5, 32, 32]} />
          <meshStandardMaterial
            color={planet.color}
            roughness={0.7}
            metalness={0.1}
            emissive={planet.color}
            emissiveIntensity={0.1}
          />
        </mesh>
        <mesh ref={glowRef}>
          <sphereGeometry args={[planet.size * 0.6, 32, 32]} />
          <meshBasicMaterial
            color={planet.color}
            transparent
            opacity={0.15}
            side={THREE.BackSide}
          />
        </mesh>
        {planet.id === 'saturn' && (
          <mesh rotation={[Math.PI / 2.5, 0, 0]}>
            <ringGeometry args={[planet.size * 0.7, planet.size * 1.1, 64]} />
            <meshBasicMaterial color="#D4B87A" transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
        )}
      </animated.group>
    </>
  );
}

function CameraController() {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const focusedPlanetId = useStore(s => s.focusedPlanetId);
  const planets = useStore(s => s.planets);

  const targetPlanet = useMemo(() => {
    if (!focusedPlanetId) return null;
    return planets.find(p => p.id === focusedPlanetId) || null;
  }, [focusedPlanetId, planets]);

  const [{ posX, posY, posZ, targetX, targetY, targetZ }, api] = useSpring(() => ({
    posX: 0,
    posY: 20,
    posZ: 35,
    targetX: 0,
    targetY: 0,
    targetZ: 0,
    config: {
      mass: 1,
      tension: 120,
      friction: 20,
      clamp: false
    }
  }), [targetPlanet]);

  useEffect(() => {
    if (targetPlanet) {
      const planetOrbitRadius = targetPlanet.orbitRadius;
      const planetSize = targetPlanet.size;
      const targetDistance = planetOrbitRadius + planetSize * 3 + 5;
      const angle = Math.PI / 4;
      const height = planetSize * 2 + 2;
      api.start({
        posX: Math.cos(angle) * targetDistance * 0.7,
        posY: height,
        posZ: Math.sin(angle) * targetDistance * 0.7,
        targetX: 0,
        targetY: 0,
        targetZ: 0
      });
    } else {
      api.start({
        posX: 0,
        posY: 20,
        posZ: 35,
        targetX: 0,
        targetY: 0,
        targetZ: 0
      });
    }
  }, [targetPlanet, api]);

  const tempVec = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    camera.position.set(posX.get(), posY.get(), posZ.get());
    tempVec.set(targetX.get(), targetY.get(), targetZ.get());
    if (controlsRef.current) {
      controlsRef.current.target.lerp(tempVec, 0.1);
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.1}
      rotateSpeed={0.5}
      minDistance={0.5}
      maxDistance={30}
      enablePan={false}
    />
  );
}

export default function Scene() {
  const planets = useStore(s => s.planets);
  const focusPlanet = useStore(s => s.focusPlanet);
  const selectPlanet = useStore(s => s.selectPlanet);

  const handleCanvasClick = () => {
    focusPlanet(null);
    selectPlanet(null);
  };

  return (
    <div style={{ width: '100%', height: '100%' }} onClick={handleCanvasClick}>
      <Canvas
        camera={{ position: [0, 20, 35], fov: 60, near: 0.1, far: 1000 }}
        gl={{ antialias: true }}
        onCreated={({ gl }) => {
          gl.setClearColor('#0B0C1A');
        }}
      >
        <StarField />
        <Sun />
        {planets.map((planet, idx) => (
          <Planet key={planet.id} planet={planet} planetIndex={idx} />
        ))}
        <CameraController />
      </Canvas>
    </div>
  );
}
