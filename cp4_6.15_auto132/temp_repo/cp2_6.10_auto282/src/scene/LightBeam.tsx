import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { LightBeam as LightBeamType } from '@/types/game';
import { COLORS } from '@/utils/colors';

interface LightBeamProps {
  beam: LightBeamType;
  playerPosition: [number, number, number];
  onHit: (position: [number, number, number]) => void;
  disabled: boolean;
  mazeTime: number;
}

export const LightBeam = ({ beam, playerPosition, onHit, disabled, mazeTime }: LightBeamProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const hitCooldown = useRef(false);

  const isFlashing = useMemo(() => {
    if (disabled) return false;
    const wave = Math.sin(mazeTime * beam.flashFrequency * Math.PI * 2 + beam.phase);
    return wave > 0.3;
  }, [mazeTime, beam.flashFrequency, beam.phase, disabled]);

  const currentColor = useMemo(() => {
    if (disabled) return COLORS.neonGreen;
    return isFlashing ? COLORS.beamFlashing : COLORS.beamActive;
  }, [isFlashing, disabled]);

  useFrame(() => {
    if (!meshRef.current || !glowRef.current || disabled) return;

    const intensity = isFlashing ? 2 : 0.8;
    (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = intensity;
    (glowRef.current.material as THREE.MeshBasicMaterial).opacity = isFlashing ? 0.6 : 0.2;

    const scale = beam.scale;
    const bx = beam.position[0];
    const by = beam.position[1];
    const bz = beam.position[2];

    const halfW = scale[0] / 2;
    const halfH = scale[1] / 2;
    const halfD = scale[2] / 2;

    const px = playerPosition[0];
    const py = playerPosition[1];
    const pz = playerPosition[2];

    const closestX = Math.max(bx - halfW, Math.min(px, bx + halfW));
    const closestY = Math.max(by - halfH, Math.min(py, by + halfH));
    const closestZ = Math.max(bz - halfD, Math.min(pz, bz + halfD));

    const dx = px - closestX;
    const dy = py - closestY;
    const dz = pz - closestZ;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (distance < 0.4 && isFlashing && !hitCooldown.current) {
      hitCooldown.current = true;
      onHit(playerPosition);
      setTimeout(() => {
        hitCooldown.current = false;
      }, 1500);
    }
  });

  return (
    <group position={beam.position} rotation={beam.rotation}>
      <mesh ref={meshRef} scale={beam.scale}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={currentColor}
          emissive={currentColor}
          emissiveIntensity={isFlashing ? 2 : 0.8}
          transparent
          opacity={disabled ? 0.3 : 0.8}
        />
      </mesh>
      <mesh ref={glowRef} scale={[beam.scale[0] * 1.2, beam.scale[1] * 1.2, beam.scale[2] * 1.2]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color={currentColor}
          transparent
          opacity={isFlashing ? 0.6 : 0.2}
          side={THREE.BackSide}
        />
      </mesh>
      {!disabled && (
        <pointLight
          color={currentColor}
          intensity={isFlashing ? 1.5 : 0.5}
          distance={5}
        />
      )}
    </group>
  );
};
