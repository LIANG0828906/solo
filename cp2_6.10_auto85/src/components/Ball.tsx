import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Ball as BallType } from '../store/useGameStore';
import { COLORS, BALL_RADIUS, createDustParticle, DustParticle, updateDustParticles } from '../gameLogic';
import { useState, useEffect } from 'react';

interface BallProps {
  ball: BallType;
}

export default function Ball({ ball }: BallProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [dustParticles, setDustParticles] = useState<DustParticle[]>([]);
  const lastPos = useRef({ x: ball.position.x, z: ball.position.z });

  const isMoving =
    Math.abs(ball.velocity.x) > 0.5 ||
    Math.abs(ball.velocity.z) > 0.5;

  useEffect(() => {
    if (isMoving && ball.position.y < 0.5) {
      const dx = ball.position.x - lastPos.current.x;
      const dz = ball.position.z - lastPos.current.z;
      const speed = Math.sqrt(dx * dx + dz * dz);
      if (speed > 0.05 && Math.random() < 0.4) {
        const direction = { x: -dx / speed, z: -dz / speed };
        setDustParticles((prev) => [
          ...prev.slice(-15),
          createDustParticle({ x: ball.position.x, z: ball.position.z }, direction),
        ]);
      }
    }
    lastPos.current = { x: ball.position.x, z: ball.position.z };
  }, [ball.position.x, ball.position.z, ball.position.y, isMoving]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.position.set(
        ball.position.x,
        ball.position.y,
        ball.position.z
      );
    }
    if (meshRef.current) {
      meshRef.current.rotation.x = ball.rotation.x;
      meshRef.current.rotation.y = ball.rotation.y;
      meshRef.current.rotation.z = ball.rotation.z;
    }

    if (dustParticles.length > 0) {
      setDustParticles((prev) => updateDustParticles(prev, delta));
    }
  });

  return (
    <group ref={groupRef}>
      {dustParticles.map((particle) => (
        <mesh
          key={particle.id}
          position={[particle.position.x, particle.position.y, particle.position.z]}
        >
          <sphereGeometry args={[0.04, 4, 4]} />
          <meshBasicMaterial
            color="#a08060"
            transparent
            opacity={particle.life * 0.4}
          />
        </mesh>
      ))}

      <mesh ref={meshRef} castShadow>
        <sphereGeometry args={[BALL_RADIUS, 16, 16]} />
        <meshStandardMaterial color={COLORS.ball} roughness={0.7} />
      </mesh>

      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[BALL_RADIUS + 0.02, 16, 16]} />
        <meshBasicMaterial
          color={COLORS.ball}
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}
