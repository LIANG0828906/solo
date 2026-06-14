import React, { useRef, useEffect, useState, MutableRefObject } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, LOD, Html } from '@react-three/drei';
import * as THREE from 'three';
import StarOrbitSystem from './StarOrbitSystem';
import ParticleField from './ParticleField';
import { useStarContext } from '../context/StarContext';
import { useStarData } from '../hooks/useStarData';
import type { Star, Planet } from '../types';

interface StarChartProps {
  propStars?: Star[];
  propAllStars?: Star[];
}

interface NavData {
  cameraPosRef: MutableRefObject<{ x: number; y: number; z: number }>;
  cameraDirRef: MutableRefObject<{ x: number; y: number; z: number }>;
  starsRef: MutableRefObject<Star[]>;
}

interface WasmProps {
  navData: NavData;
  displayStars: Star[];
  loading: boolean;
}

export const NavDataContext = React.createContext<NavData | null>(null);

const StarNode: React.FC<{ star: Star }> = ({ star }) => {
  const { setSelectedBody, showOrbits, showAtmosphere } = useStarContext();
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Sprite>(null);
  const [hovered, setHovered] = useState(false);

  const baseScale = Math.max(1.2, Math.min(4, star.mass * 1.5));

  useFrame((state) => {
    if (glowRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2 + star.coordinates.x * 0.1) * 0.08;
      glowRef.current.scale.setScalar(baseScale * 2.2 * pulse);
    }
  });

  const handleClick = (e: THREE.Event) => {
    e.stopPropagation();
    setSelectedBody({ type: 'star', data: star });
  };

  const color = new THREE.Color(star.color);

  return (
    <group position={[star.coordinates.x, star.coordinates.y, star.coordinates.z]} ref={groupRef}>
      <pointLight
        color={color}
        intensity={Math.min(8, star.luminosity / 3)}
        distance={120}
        decay={1.8}
      />

      <sprite
        ref={glowRef}
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
        scale={[baseScale * 2, baseScale * 2, 1]}
      >
        <spriteMaterial
          transparent
          opacity={hovered ? 0.95 : 0.75}
          color={color}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </sprite>

      <mesh onClick={handleClick}>
        <sphereGeometry args={[baseScale * 0.5, 32, 32]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>

      <pointLight intensity={0.4} color={color} distance={60} />

      <StarOrbitSystem
        star={star}
        showOrbits={showOrbits}
        showAtmosphere={showAtmosphere}
        onPlanetClick={(planet) => {
          setSelectedBody({ type: 'planet', data: planet, parentStar: star });
        }}
      />

      <Html
        position={[0, baseScale + 1.8, 0]}
        center
        distanceFactor={25}
        style={{ pointerEvents: 'none' }}
      >
        <div
          style={{
            color: '#00d4ff',
            fontSize: '11px',
            fontFamily: '"Segoe UI", sans-serif',
            fontWeight: 600,
            textShadow: '0 0 8px rgba(0,212,255,0.8), 0 0 16px rgba(0,212,255,0.4)',
            whiteSpace: 'nowrap',
            letterSpacing: '0.5px',
            opacity: hovered ? 1 : 0.85,
            transition: 'opacity 0.2s',
          }}
        >
          {star.name}
        </div>
      </Html>
    </group>
  );
};

const CameraController: React.FC<{
  cameraPosRef: MutableRefObject<{ x: number; y: number; z: number }>;
  cameraDirRef: MutableRefObject<{ x: number; y: number; z: number }>;
  controlsRef: MutableRefObject<any>;
}> = ({ cameraPosRef, cameraDirRef, controlsRef }) => {
  const { camera } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const vel = useRef(new THREE.Vector3());

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => (keys.current[e.code] = true);
    const onUp = (e: KeyboardEvent) => (keys.current[e.code] = false);
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  useFrame((state, delta) => {
    const speed = 28;
    const damping = 0.88;
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const accel = new THREE.Vector3();
    if (keys.current['KeyW']) accel.add(forward);
    if (keys.current['KeyS']) accel.sub(forward);
    if (keys.current['KeyA']) accel.sub(right);
    if (keys.current['KeyD']) accel.add(right);

    if (accel.lengthSq() > 0) {
      accel.normalize().multiplyScalar(speed * delta);
      vel.current.add(accel);
    }

    vel.current.multiplyScalar(damping);
    camera.position.add(vel.current.clone().multiplyScalar(delta));

    cameraPosRef.current = {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
    };

    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    cameraDirRef.current = { x: dir.x, y: dir.y, z: dir.z };

    if (controlsRef.current) {
      controlsRef.current.target.add(vel.current.clone().multiplyScalar(delta));
    }
  });

  return null;
};

const StarChartInner: React.FC<{
  displayStars: Star[];
  navData: NavData;
}> = ({ displayStars, navData }) => {
  const controlsRef = useRef<any>(null);

  return (
    <>
      <CameraController
        cameraPosRef={navData.cameraPosRef}
        cameraDirRef={navData.cameraDirRef}
        controlsRef={controlsRef}
      />

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
        zoomSpeed={0.9}
        panSpeed={0.7}
        minDistance={2}
        maxDistance={800}
        makeDefault
      />

      <ParticleField count={30} />

      <Stars
        radius={400}
        depth={200}
        count={3000}
        factor={5}
        saturation={0.1}
        fade
        speed={0.3}
      />

      <NavDataContext.Provider value={navData}>
        {displayStars.map((star) => (
          <StarNode key={star.id} star={star} />
        ))}
      </NavDataContext.Provider>
    </>
  );
};

const StarChart: React.FC<StarChartProps> = ({ propStars, propAllStars }) => {
  const { stars: hookStars, loading } = useStarData();
  const displayStars = propStars ?? hookStars;
  const allStarsData = propAllStars ?? displayStars;

  const cameraPosRef = useRef({ x: 0, y: 30, z: 80 });
  const cameraDirRef = useRef({ x: 0, y: 0, z: -1 });
  const starsRef = useRef<Star[]>(allStarsData);
  const [navReady, setNavReady] = useState(false);

  useEffect(() => {
    starsRef.current = allStarsData;
    setNavReady(true);
  }, [allStarsData]);

  const navData: NavData = {
    cameraPosRef,
    cameraDirRef,
    starsRef,
  };

  (window as any).__starNavData = navData;

  if (loading && displayStars.length === 0) {
    return (
      <>
        <ParticleField count={30} />
        <Stars radius={300} depth={150} count={2000} factor={4} saturation={0.05} fade speed={0.3} />
      </>
    );
  }

  return <StarChartInner displayStars={displayStars} navData={navData} />;
};

export default StarChart;
