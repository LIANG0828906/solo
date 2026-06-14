import React, { useRef, useMemo, useState, forwardRef, useImperativeHandle } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Detailed } from '@react-three/drei';
import * as THREE from 'three';
import type { Star, Planet } from '../types';

interface StarOrbitSystemProps {
  star: Star;
  showOrbits: boolean;
  showAtmosphere: boolean;
  onPlanetClick: (planet: Planet) => void;
}

interface OrbitLineProps {
  radius: number;
  visible: boolean;
  color: string;
}

const OrbitLine: React.FC<OrbitLineProps> = ({ radius, visible, color }) => {
  const lineRef = useRef<THREE.Line>(null);
  const materialRef = useRef<THREE.LineBasicMaterial>(null);

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

  useFrame((state, delta) => {
    if (lineRef.current && materialRef.current) {
      const targetOpacity = visible ? 0.35 : 0;
      materialRef.current.opacity = THREE.MathUtils.lerp(
        materialRef.current.opacity, targetOpacity, delta * 6);
      lineRef.current.visible = materialRef.current.opacity > 0.01;
    }
  });

  const orbitColor = useMemo(() => new THREE.Color(color), [color]);

  return (
    <line ref={lineRef} geometry={lineGeom} visible={visible}>
      <lineBasicMaterial
        ref={materialRef}
        color={orbitColor}
        transparent
        opacity={visible ? 0.35 : 0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </line>
  );
};

interface AsteroidBeltProps {
  innerRadius: number;
  outerRadius: number;
  count: number;
}

const AsteroidBelt: React.FC<AsteroidBeltProps> = ({ innerRadius, outerRadius, count }) => {
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
        rotationSpeed: 0.3 + i * 0.01,
        rotationSpeed2: 0.2 + i * 0.015,
      };
    });
  }, [innerRadius, outerRadius, count]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    data.forEach((d, i) => {
      const a = d.angle + state.clock.elapsedTime * d.speed;
      dummy.position.set(
        Math.cos(a) * d.radius,
        d.yOffset,
        Math.sin(a) * d.radius
      );
      dummy.rotation.set(
        state.clock.elapsedTime * d.rotationSpeed,
        state.clock.elapsedTime * d.rotationSpeed2,
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

interface PlanetMeshProps {
  planet: Planet;
  onClick: () => void;
  showAtmosphere: boolean;
  lodDistance: number;
}

const PlanetMesh: React.FC<PlanetMeshProps> = ({ planet, onClick, showAtmosphere, lodDistance }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const planetColor = useMemo(() => new THREE.Color(planet.color), [planet.color]);
  const atmosphereColor = useMemo(() => new THREE.Color(planet.atmosphereColor), [planet.atmosphereColor]);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += planet.rotationSpeed;
    }
    if (atmosphereRef.current && planet.hasAtmosphere) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.8) * 0.04;
      atmosphereRef.current.scale.setScalar(pulse);
      const material = atmosphereRef.current.material as THREE.MeshBasicMaterial;
      const targetOpacity = showAtmosphere ? 0.25 : 0;
      material.opacity = THREE.MathUtils.lerp(material.opacity, targetOpacity, delta * 5);
      atmosphereRef.current.visible = material.opacity > 0.01;
    }
  });

  const handleClick = (e: THREE.Event) => {
    e.stopPropagation();
    onClick();
  };

  const handlePointerOver = (e: THREE.Event) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'auto';
  };

  const highDetail = (
    <mesh
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
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

  const lowDetail = (
    <mesh
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
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

  return (
    <group>
      <Detailed distances={[0, lodDistance]}>
        {highDetail}
        {lowDetail}
      </Detailed>

      {planet.hasAtmosphere && planet.atmosphereColor && (
        <mesh ref={atmosphereRef} visible={showAtmosphere}>
          <sphereGeometry args={[planet.radius * 1.15, 32, 32]} />
          <meshBasicMaterial
            color={atmosphereColor}
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

interface PlanetNodeProps {
  planet: Planet;
  onClick: () => void;
  showOrbits: boolean;
  showAtmosphere: boolean;
  starColor: string;
}

const PlanetNode: React.FC<PlanetNodeProps> = ({ planet, onClick, showOrbits, showAtmosphere, starColor }) => {
  const groupRef = useRef<THREE.Group>(null);
  const orbitAngle = useRef(Math.random() * Math.PI * 2);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    orbitAngle.current += planet.orbitSpeed * delta;
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
