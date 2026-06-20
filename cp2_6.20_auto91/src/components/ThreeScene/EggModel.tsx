import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { EGG_CONFIGS } from '../../utils/constants';

interface EggModelProps {
  eggType: string;
  progress: number;
  isIncubating: boolean;
}

const EggModel = ({ eggType, progress, isIncubating }: EggModelProps) => {
  const eggRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const cracksRef = useRef<THREE.Group>(null);

  const config = EGG_CONFIGS[eggType] || EGG_CONFIGS.phoenix;

  const crackPositions = useMemo(() => {
    const cracks: Array<{
      start: THREE.Vector3;
      end: THREE.Vector3;
      progressThreshold: number;
    }> = [];

    for (let i = 0; i < 15; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.62;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta) * 1.3;
      const z = r * Math.cos(phi);

      const length = 0.1 + Math.random() * 0.3;
      const angle = Math.random() * Math.PI * 2;

      const start = new THREE.Vector3(x, y, z);
      const end = new THREE.Vector3(
        x + Math.cos(angle) * length,
        y + Math.sin(angle) * length * 1.3,
        z + Math.sin(angle) * length * 0.5
      );

      cracks.push({
        start,
        end,
        progressThreshold: 10 + (i / 15) * 80,
      });
    }

    return cracks;
  }, []);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();

    if (eggRef.current) {
      const floatOffset = Math.sin(time * 1.5) * 0.05;
      eggRef.current.position.y = floatOffset;

      if (isIncubating) {
        eggRef.current.rotation.y += 0.005;
      }
    }

    if (glowRef.current) {
      const glowIntensity = 0.3 + Math.sin(time * 2) * 0.1 + (progress / 100) * 0.5;
      const material = glowRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = glowIntensity * 0.4;
    }

    if (cracksRef.current) {
      cracksRef.current.children.forEach((child, index) => {
        const crack = crackPositions[index];
        if (crack && progress >= crack.progressThreshold) {
          const crackProgress = Math.min(1, (progress - crack.progressThreshold) / 20);
          child.scale.setScalar(crackProgress);
          child.visible = true;
        } else {
          child.visible = false;
        }
      });
    }
  });

  const eggColor = new THREE.Color(config.color);
  const glowColor = new THREE.Color(config.glowColor);

  return (
    <group ref={eggRef}>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.9, 32, 32]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={0.2}
          side={THREE.BackSide}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[0.6, 64, 64]} />
        <meshStandardMaterial
          color={eggColor}
          metalness={0.3}
          roughness={0.5}
          emissive={glowColor}
          emissiveIntensity={0.1 + (progress / 100) * 0.3}
        />
        <sphereGeometry args={[0.6, 64, 64]} />
      </mesh>

      <mesh scale={[1, 1.3, 1]}>
        <sphereGeometry args={[0.58, 64, 64]} />
        <meshStandardMaterial
          color={eggColor}
          metalness={0.4}
          roughness={0.4}
          emissive={glowColor}
          emissiveIntensity={0.1 + (progress / 100) * 0.3}
        />
      </mesh>

      <group ref={cracksRef}>
        {crackPositions.map((crack, index) => {
          const midPoint = new THREE.Vector3()
            .addVectors(crack.start, crack.end)
            .multiplyScalar(0.5);
          const direction = new THREE.Vector3()
            .subVectors(crack.end, crack.start)
            .normalize();
          const length = crack.start.distanceTo(crack.end);
          const rotation = new THREE.Euler().setFromVector3(direction);

          return (
            <mesh
              key={index}
              position={midPoint}
              rotation={rotation}
              scale={0}
              visible={false}
            >
              <boxGeometry args={[length, 0.015, 0.015]} />
              <meshBasicMaterial color="#1a1a2e" />
            </mesh>
          );
        })}
      </group>

      <pointLight
        position={[0, 0, 0]}
        color={glowColor}
        intensity={0.5 + (progress / 100) * 1.5}
        distance={3}
      />
    </group>
  );
};

export default EggModel;
