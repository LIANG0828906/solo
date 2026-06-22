import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree, createPortal } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSpring, animated } from '@react-spring/three';
import { useStore } from './store';
import type { PlanetData } from './types';

const CME_INTERVAL = 8000;
const CME_DURATION = 1500;

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
          <pointsMaterial color="#FF6B35" size={0.15} transparent opacity={0.9} sizeAttenuation />
        </points>
      )}
    </group>
  );
}

function OrbitRing({ radius }: { radius: number }) {
  const eccentricity = 0.02;
  const innerRadius = radius - 0.015;
  const outerRadius = radius + 0.015;

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1, 1 - eccentricity]}>
      <ringGeometry args={[innerRadius, outerRadius, 256]} />
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
  const { camera, scene, gl } = useThree();
  const controlsRef = useRef<any>(null);
  const focusedPlanetId = useStore(s => s.focusedPlanetId);
  const planets = useStore(s => s.planets);

  const targetPlanet = useMemo(() => {
    if (!focusedPlanetId) return null;
    return planets.find(p => p.id === focusedPlanetId) || null;
  }, [focusedPlanetId, planets]);

  const [{ position }, api] = useSpring(() => ({
    position: [0, 20, 35] as [number, number, number],
    config: {
      mass: 1,
      tension: 120,
      friction: 20
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
        position: [
          Math.cos(angle) * targetDistance * 0.7,
          height,
          Math.sin(angle) * targetDistance * 0.7
        ]
      });
    } else {
      api.start({
        position: [0, 20, 35]
      });
    }
  }, [targetPlanet, api]);

  const AnimatedGroup = animated('group');

  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.update();
    }
  });

  return (
    <>
      {createPortal(
        <AnimatedGroup position={position as any}>
          <primitive object={camera} />
        </AnimatedGroup>,
        scene
      )}
      <OrbitControls
        ref={controlsRef}
        camera={camera}
        enableDamping
        dampingFactor={0.1}
        rotateSpeed={0.5}
        minDistance={0.5}
        maxDistance={30}
        enablePan={false}
        makeDefault
      />
    </>
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
