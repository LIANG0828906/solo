import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '@/store/useStore';
import { lerp } from '@/utils/physics';

const Ship = () => {
  const groupRef = useRef<THREE.Group>(null);
  const rudderRef = useRef<THREE.Mesh>(null);
  const sailRef = useRef<THREE.Mesh>(null);
  const lanternRef = useRef<THREE.Mesh>(null);
  const lanternLightRef = useRef<THREE.PointLight>(null);
  const cargoBoxRef = useRef<THREE.Mesh>(null);
  const splashParticlesRef = useRef<THREE.Points>(null);

  const roll = useStore((state) => state.roll);
  const pitch = useStore((state) => state.pitch);
  const rudderAngle = useStore((state) => state.rudderAngle);
  const sailAngle = useStore((state) => state.sailAngle);
  const speed = useStore((state) => state.speed);
  const isLanternOn = useStore((state) => state.isLanternOn);
  const cargoBoxSliding = useStore((state) => state.cargoBoxSliding);
  const cargoBoxPosition = useStore((state) => state.cargoBoxPosition);
  const floodRate = useStore((state) => state.floodRate);

  const splashGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(60 * 3);
    const velocities = new Float32Array(60 * 3);
    for (let i = 0; i < 60; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      velocities[i * 3] = (Math.random() - 0.5) * 0.1;
      velocities[i * 3 + 1] = Math.random() * 0.1;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    (geometry as any).velocities = velocities;
    return geometry;
  }, []);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const targetRoll = (roll * Math.PI) / 180;
      const targetPitch = (pitch * Math.PI) / 180;
      
      groupRef.current.rotation.z = lerp(
        groupRef.current.rotation.z,
        targetRoll,
        0.1
      );
      groupRef.current.rotation.x = lerp(
        groupRef.current.rotation.x,
        targetPitch,
        0.1
      );

      const time = clock.getElapsedTime();
      groupRef.current.position.y = Math.sin(time * 0.5) * 0.05;
    }

    if (rudderRef.current) {
      rudderRef.current.rotation.y = (rudderAngle * Math.PI) / 180;
    }

    if (sailRef.current) {
      const targetRotation = ((sailAngle - 45) * Math.PI) / 180;
      sailRef.current.rotation.y = lerp(
        sailRef.current.rotation.y,
        targetRotation,
        0.05
      );
      sailRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 2) * 0.02;
    }

    if (lanternRef.current && lanternLightRef.current) {
      const lanternIntensity = isLanternOn ? 1 : 0;
      (lanternRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 
        lerp(
          (lanternRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity,
          lanternIntensity,
          0.1
        );
      lanternLightRef.current.intensity = lerp(
        lanternLightRef.current.intensity,
        isLanternOn ? 2 : 0,
        0.1
      );

      if (Math.abs(pitch) > 10 || Math.abs(roll) > 15) {
        lanternRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 8) * 0.3;
        lanternRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 6) * 0.2;
      }
    }

    if (cargoBoxRef.current) {
      const targetX = cargoBoxPosition;
      cargoBoxRef.current.position.x = lerp(
        cargoBoxRef.current.position.x,
        targetX,
        0.1
      );
      if (cargoBoxSliding) {
        cargoBoxRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 10) * 0.1;
      }
    }

    if (splashParticlesRef.current && Math.abs(pitch) > 15) {
      const positions = splashParticlesRef.current.geometry.attributes.position.array as Float32Array;
      const velocities = (splashParticlesRef.current.geometry as any).velocities as Float32Array;
      
      for (let i = 0; i < 20; i++) {
        const idx = Math.floor(Math.random() * 60) * 3;
        positions[idx] = 1 + (Math.random() - 0.5) * 0.3;
        positions[idx + 1] = 0.2;
        positions[idx + 2] = (Math.random() - 0.5) * 0.5;
        velocities[idx] = (Math.random() - 0.5) * 0.05;
        velocities[idx + 1] = Math.random() * 0.08;
        velocities[idx + 2] = (Math.random() - 0.5) * 0.05;
      }

      for (let i = 0; i < 60; i++) {
        const idx = i * 3;
        positions[idx] += velocities[idx];
        positions[idx + 1] += velocities[idx + 1];
        positions[idx + 2] += velocities[idx + 2];
        velocities[idx + 1] -= 0.002;
        if (positions[idx + 1] < 0) {
          positions[idx + 1] = -10;
        }
      }
      
      splashParticlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.5, 0]}>
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[3, 0.6, 1]} />
        <meshStandardMaterial color="#5d3a1a" roughness={0.8} />
      </mesh>

      <mesh position={[1.2, 0.1, 0]} rotation={[0, 0, -0.3]} castShadow>
        <boxGeometry args={[1, 0.5, 0.95]} />
        <meshStandardMaterial color="#5d3a1a" roughness={0.8} />
      </mesh>

      <mesh position={[-1.3, 0.1, 0]} rotation={[0, 0, 0.3]} castShadow>
        <boxGeometry args={[0.8, 0.45, 0.95]} />
        <meshStandardMaterial color="#5d3a1a" roughness={0.8} />
      </mesh>

      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[2.8, 0.05, 0.9]} />
        <meshStandardMaterial color="#8b6f47" roughness={0.7} />
      </mesh>

      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.08, 2, 8]} />
        <meshStandardMaterial color="#5d3a1a" roughness={0.9} />
      </mesh>

      <mesh ref={sailRef} position={[0, 1.5, 0]} castShadow>
        <planeGeometry args={[1.5, 1.8]} />
        <meshStandardMaterial 
          color="#e6dcc3" 
          side={THREE.DoubleSide} 
          roughness={0.9}
        />
      </mesh>

      <group position={[-1.5, 0, 0]}>
        <mesh ref={rudderRef} position={[0, -0.1, 0]} castShadow>
          <boxGeometry args={[0.05, 0.3, 0.4]} />
          <meshStandardMaterial color="#3d2a0a" roughness={0.9} />
        </mesh>
      </group>

      <group position={[0, 2.5, 0]}>
        <mesh ref={lanternRef} castShadow>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial 
            color="#ffd700" 
            emissive="#ffd700" 
            emissiveIntensity={1}
            roughness={0.3}
            metalness={0.5}
          />
        </mesh>
        <pointLight 
          ref={lanternLightRef}
          color="#ffd700" 
          intensity={2} 
          distance={5} 
          decay={2}
        />
      </group>

      <mesh ref={cargoBoxRef} position={[-0.75, 0.5, 0]} castShadow>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshStandardMaterial color="#4488cc" roughness={0.6} metalness={0.3} />
      </mesh>

      <points ref={splashParticlesRef}>
        <primitive object={splashGeometry} attach="geometry" />
        <pointsMaterial 
          color="#1a4a2a" 
          size={0.05} 
          transparent 
          opacity={0.6}
          sizeAttenuation
        />
      </points>
    </group>
  );
};

export default Ship;
