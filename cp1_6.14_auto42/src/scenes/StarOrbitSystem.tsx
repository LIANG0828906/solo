import React, { useRef, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { LOD } from '@react-three/drei';
import * as THREE from 'three';
import type { Star, Planet } from '../types';
import { NavDataContext } from './StarChart';

interface StarOrbitSystemProps {
  star: Star;
  showOrbits: boolean;
  showAtmosphere: boolean;
  onPlanetClick: (planet: Planet) => void;
}

const OrbitLine: React.FC<{ radius: number; visible: boolean; color: string }> = ({
  radius,
  visible,
  color,
}) => {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }
    return pts;
  }, [radius]);

  const lineGeom = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints(points);
    return g;
  }, [points]);

  return (
    <line geometry={lineGeom} visible={visible}>
      <lineBasicMaterial
        color={color}
        transparent
        opacity={visible ? 0.35 : 0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </line>
  );
};

const AsteroidBelt: React.FC<{ innerRadius: number; outerRadius: number; count: number }> = ({
  innerRadius,
  outerRadius,
  count,
}) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const data = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const r = innerRadius + Math.random() * (outerRadius - innerRadius);
      return {
        angle,
        radius: r,
        yOffset: (Math.random() - 0.5) * 0.4,
        scale: 0.05 + Math.random() * 0.12,
        speed: 0.002 + Math.random() * 0.005,
      };
    });
  }, [innerRadius, outerRadius, count]);

  useFrame((state) => {
    if (!ref.current) return;
    data.forEach((d, i) => {
      const a = d.angle + state.clock.elapsedTime * d.speed;
      dummy.position.set(
        Math.cos(a) * d.radius,
        d.yOffset,
        Math.sin(a) * d.radius
      );
      dummy.rotation.set(
        state.clock.elapsedTime * (0.3 + i * 0.01),
        state.clock.elapsedTime * (0.2 + i * 0.015),
        0
      );
      dummy.scale.setScalar(d.scale);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color="#6b6b6b"
        roughness={0.9}
        metalness={0.1}
        emissive="#221a10"
        emissiveIntensity={0.15}
      />
    </instancedMesh>
  );
};

const PlanetMesh: React.FC<{
  planet: Planet;
  onClick: () => void;
  showAtmosphere: boolean;
  lodDistance: number;
}> = ({ planet, onClick, showAtmosphere, lodDistance }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const planetColor = useMemo(() => new THREE.Color(planet.color), [planet.color]);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += planet.rotationSpeed;
    }
    if (atmosphereRef.current && planet.hasAtmosphere) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.8) * 0.04;
      atmosphereRef.current.scale.setScalar(pulse);
    }
  });

  const handleClick = (e: THREE.Event) => {
    e.stopPropagation();
    onClick();
  };

  const lowDetail = (
    <mesh
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
      ref={meshRef}
    >
      <sphereGeometry args={[planet.radius, 16, 12]} />
      <meshStandardMaterial
        color={planetColor}
        roughness={0.85}
        metalness={0.1}
        emissive={planetColor}
        emissiveIntensity={hovered ? 0.35 : 0.08}
      />
    </mesh>
  );

  const highDetail = (
    <mesh
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
      ref={meshRef}
    >
      <sphereGeometry args={[planet.radius, 48, 40]} />
      <meshStandardMaterial
        color={planetColor}
        roughness={0.7}
        metalness={0.15}
        emissive={planetColor}
        emissiveIntensity={hovered ? 0.4 : 0.1}
        flatShading={false}
      />
    </mesh>
  );

  return (
    <group ref={groupRef}>
      <LOD distances={[lodDistance]}>
        {highDetail}
        {lowDetail}
      </LOD>

      {planet.hasAtmosphere && planet.atmosphereColor && (
        <mesh ref={atmosphereRef} visible={showAtmosphere}>
          <sphereGeometry args={[planet.radius * 1.15, 32, 32]} />
          <meshBasicMaterial
            color={planet.atmosphereColor}
            transparent
            opacity={showAtmosphere ? 0.25 : 0}
            side={THREE.BackSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
    </group>
  );
};

const PlanetNode: React.FC<{
  planet: Planet;
  onClick: () => void;
  showOrbits: boolean;
  showAtmosphere: boolean;
  starColor: string;
}> = ({ planet, onClick, showOrbits, showAtmosphere, starColor }) => {
  const groupRef = useRef<THREE.Group>(null);
  const orbitAngle = useRef(Math.random() * Math.PI * 2);
  const { camera } = useThree();

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    orbitAngle.current += planet.orbitSpeed * delta * 0.3;
    const x = Math.cos(orbitAngle.current) * planet.orbitRadius;
    const z = Math.sin(orbitAngle.current) * planet.orbitRadius;
    groupRef.current.position.set(x, 0, z);
  });

  const lodDistance = planet.radius * 25;

  return (
    <>
      <OrbitLine
        radius={planet.orbitRadius}
        visible={showOrbits}
        color={starColor}
      />
      <group ref={groupRef}>
        <PlanetMesh
          planet={planet}
          onClick={onClick}
          showAtmosphere={showAtmosphere}
          lodDistance={lodDistance}
        />
      </group>
    </>
  );
};

const StarOrbitSystem: React.FC<StarOrbitSystemProps> = ({
  star,
  showOrbits,
  showAtmosphere,
  onPlanetClick,
}) => {
  const planets = star.planets;

  const maxOrbit = planets.length > 0 ? Math.max(...planets.map(p => p.orbitRadius)) : 20;
  const asteroidInner = maxOrbit + 4;
  const asteroidOuter = maxOrbit + 10;

  return (
    <group>
      {planets.map((planet) => (
        <PlanetNode
          key={planet.id}
          planet={planet}
          onClick={() => onPlanetClick(planet)}
          showOrbits={showOrbits}
          showAtmosphere={showAtmosphere}
          starColor={star.color}
        />
      ))}

      {planets.length >= 2 && (
        <AsteroidBelt
          innerRadius={asteroidInner}
          outerRadius={asteroidOuter}
          count={250}
        />
      )}
    </group>
  );
};

export default StarOrbitSystem;
