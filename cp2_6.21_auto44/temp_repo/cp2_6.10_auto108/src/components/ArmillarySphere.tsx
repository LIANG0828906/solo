import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useArmillarySphere } from '../hooks/useArmillarySphere';
import { useAppStore } from '../store/useAppStore';
import { Ring, Star } from '../types';

const RingComponent: React.FC<{
  ring: Ring;
  isSelected: boolean;
  onClick: () => void;
}> = ({ ring, isSelected, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const tickMarksGroupRef = useRef<THREE.Group>(null);
  const [tickMarks, setTickMarks] = useState<THREE.Mesh[]>([]);

  const { createRingGeometry, createTickMarks, ringMeshesRef } = useArmillarySphere();

  const geometry = useMemo(() => createRingGeometry(ring), [ring, createRingGeometry]);

  useEffect(() => {
    const marks = createTickMarks(ring);
    setTickMarks(marks);
  }, [ring, createTickMarks]);

  useEffect(() => {
    if (meshRef.current) {
      ringMeshesRef.current.set(ring.name, meshRef.current);
    }
    return () => {
      ringMeshesRef.current.delete(ring.name);
    };
  }, [ring.name, ringMeshesRef]);

  useFrame(() => {
    if (glowRef.current) {
      const glowPhase = (Date.now() / 1000) % 1;
      const glowIntensity = isSelected 
        ? 0.3 + 0.2 * Math.sin(glowPhase * Math.PI * 2)
        : 0;
      
      const material = glowRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = glowIntensity;
      material.needsUpdate = true;
    }

    if (tickMarksGroupRef.current) {
      const { timeAcceleration } = useAppStore.getState();
      const flashPeriod = 1 / timeAcceleration;
      const flashPhase = (Date.now() / 1000) % flashPeriod;
      const flashIntensity = 0.4 + 0.6 * Math.abs(Math.sin(flashPhase * Math.PI * 2));

      tickMarksGroupRef.current.children.forEach((child) => {
        const tick = child as THREE.Mesh;
        const material = tick.material as THREE.MeshBasicMaterial;
        material.opacity = 0.3 + flashIntensity * 0.5;
        material.needsUpdate = true;
      });
    }
  });

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    document.body.style.cursor = 'grab';
  };

  const rotation = useMemo(() => {
    const rot = { x: 0, y: 0, z: 0 };
    const rad = (ring.tiltAngle * Math.PI) / 180;
    if (ring.tiltAxis === 'x') rot.x = rad;
    if (ring.tiltAxis === 'y') rot.y = rad;
    if (ring.tiltAxis === 'z') rot.z = rad;
    
    if (ring.name === '黄道环') {
      rot.x = -23.5 * Math.PI / 180;
    }
    
    return rot;
  }, [ring]);

  return (
    <group rotation={[rotation.x, rotation.y, rotation.z]}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <meshStandardMaterial
          color={ring.color}
          metalness={0.5}
          roughness={0.4}
          emissive={ring.color}
          emissiveIntensity={isSelected ? 0.3 : 0.05}
        />
      </mesh>

      {isSelected && (
        <mesh ref={glowRef} geometry={geometry}>
          <meshBasicMaterial
            color={ring.color}
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

      <group ref={tickMarksGroupRef}>
        {tickMarks.map((tick, index) => (
          <primitive key={index} object={tick} />
        ))}
      </group>
    </group>
  );
};

const StarComponent: React.FC<{
  star: Star;
  onClick: () => void;
  isHighlighted: boolean;
}> = ({ star, onClick, isHighlighted }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const { createStarGeometry, createStarMaterial, createStarGlow, starMeshesRef } = useArmillarySphere();

  const geometry = useMemo(() => createStarGeometry(star.magnitude), [star.magnitude, createStarGeometry]);
  const material = useMemo(() => createStarMaterial(star.magnitude, isHighlighted), [star.magnitude, isHighlighted, createStarMaterial]);
  const glowMesh = useMemo(() => createStarGlow(star.magnitude, isHighlighted), [star.magnitude, isHighlighted, createStarGlow]);

  useEffect(() => {
    if (meshRef.current) {
      starMeshesRef.current.set(star.id, meshRef.current);
    }
    return () => {
      starMeshesRef.current.delete(star.id);
    };
  }, [star.id, starMeshesRef]);

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    document.body.style.cursor = 'grab';
  };

  const scale = isHighlighted ? 1.5 : 1;

  return (
    <group position={[star.x!, star.y!, star.z!]}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        scale={[scale, scale, scale]}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />
      
      <primitive object={glowMesh} ref={glowRef} />
    </group>
  );
};

const EarthComponent: React.FC = () => {
  const { createEarthGeometry, createEarthMaterial, earthRef } = useArmillarySphere();

  const geometry = useMemo(() => createEarthGeometry(), [createEarthGeometry]);
  const material = useMemo(() => createEarthMaterial(), [createEarthMaterial]);

  useFrame((_state, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <mesh ref={earthRef} geometry={geometry} material={material}>
    </mesh>
  );
};

const BaseComponent: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const { earthRadius } = useArmillarySphere();

  const createCloudPattern = () => {
    const shape = new THREE.Shape();
    const cloudPoints = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const radius = 3.2 + Math.sin(angle * 3) * 0.15;
      cloudPoints.push(new THREE.Vector2(radius * Math.cos(angle), radius * Math.sin(angle)));
    }
    shape.moveTo(cloudPoints[0].x, cloudPoints[0].y);
    cloudPoints.forEach(p => shape.lineTo(p.x, p.y));
    shape.closePath();
    
    const hole = new THREE.Path();
    hole.absarc(0, 0, 2.8, 0, Math.PI * 2, false);
    shape.holes.push(hole);
    
    return shape;
  };

  const baseGeometry = useMemo(() => {
    return new THREE.CylinderGeometry(3.3, 3.5, 0.3, 64);
  }, []);

  const cloudGeometry = useMemo(() => {
    const shape = createCloudPattern();
    const extrudeSettings = { depth: 0.05, bevelEnabled: false };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, 0.18, 0);
    return geometry;
  }, []);

  return (
    <group ref={groupRef} position={[0, -earthRadius - 0.3, 0]}>
      <mesh geometry={baseGeometry}>
        <meshStandardMaterial
          color="#8b5e3c"
          transparent
          opacity={0.6}
          metalness={0.4}
          roughness={0.6}
        />
      </mesh>
      
      <mesh geometry={cloudGeometry}>
        <meshStandardMaterial
          color="#daa520"
          transparent
          opacity={0.4}
          metalness={0.6}
          roughness={0.3}
          emissive="#daa520"
          emissiveIntensity={0.1}
        />
      </mesh>
    </group>
  );
};

const ArmillarySphere: React.FC = () => {
  const { groupRef, starsGroupRef, stars, rings } = useArmillarySphere();
  const { selectedRing, setSelectedRing, highlightedStarId, setHighlightedStar } = useAppStore();

  const handleSceneClick = () => {
    setSelectedRing(null);
  };

  return (
    <group ref={groupRef} onClick={handleSceneClick}>
      <group ref={starsGroupRef}>
        {stars.map((star) => (
          <StarComponent
            key={star.id}
            star={star}
            isHighlighted={star.id === highlightedStarId}
            onClick={() => setHighlightedStar(star.id)}
          />
        ))}
      </group>

      {rings.map((ring) => (
        <RingComponent
          key={ring.name}
          ring={ring}
          isSelected={ring.name === selectedRing}
          onClick={() => setSelectedRing(ring.name === selectedRing ? null : ring.name)}
        />
      ))}

      <EarthComponent />
      <BaseComponent />
    </group>
  );
};

export default ArmillarySphere;
