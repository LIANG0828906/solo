import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { COLORS, PITCH_WIDTH, PITCH_DEPTH, GOAL_WIDTH, GOAL_HEIGHT } from '../gameLogic';

interface PitchProps {
  onClick: (position: { x: number; z: number }) => void;
}

export default function Pitch({ onClick }: PitchProps) {
  const groundRef = useRef<THREE.Mesh>(null);

  const linePoints = useMemo(() => {
    const points: THREE.Vector3[] = [];
    
    points.push(new THREE.Vector3(-PITCH_WIDTH / 2, 0.01, -PITCH_DEPTH / 2));
    points.push(new THREE.Vector3(PITCH_WIDTH / 2, 0.01, -PITCH_DEPTH / 2));
    points.push(new THREE.Vector3(PITCH_WIDTH / 2, 0.01, PITCH_DEPTH / 2));
    points.push(new THREE.Vector3(-PITCH_WIDTH / 2, 0.01, PITCH_DEPTH / 2));
    points.push(new THREE.Vector3(-PITCH_WIDTH / 2, 0.01, -PITCH_DEPTH / 2));
    
    points.push(new THREE.Vector3(0, 0.01, -PITCH_DEPTH / 2));
    points.push(new THREE.Vector3(0, 0.01, PITCH_DEPTH / 2));
    
    return points;
  }, []);

  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(linePoints);
    return geometry;
  }, [linePoints]);

  const handleGroundClick = (e: { stopPropagation: () => void; point: { x: number; z: number } }) => {
    e.stopPropagation();
    onClick({ x: e.point.x, z: e.point.z });
  };

  return (
    <group>
      <mesh
        ref={groundRef}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handleGroundClick}
        receiveShadow
      >
        <planeGeometry args={[PITCH_WIDTH, PITCH_DEPTH]} />
        <meshStandardMaterial color={COLORS.pitch} roughness={0.8} />
      </mesh>

      <line geometry={lineGeometry}>
        <lineBasicMaterial color={COLORS.line} linewidth={2} />
      </line>

      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 1.6, 32]} />
        <meshBasicMaterial color={COLORS.line} />
      </mesh>

      <group position={[-PITCH_WIDTH / 2 - 0.25, GOAL_HEIGHT / 2, 0]}>
        <mesh position={[0, GOAL_HEIGHT / 2, -GOAL_WIDTH / 2]}>
          <boxGeometry args={[0.1, GOAL_HEIGHT, 0.1]} />
          <meshStandardMaterial color={COLORS.goalFrame} />
        </mesh>
        <mesh position={[0, GOAL_HEIGHT / 2, GOAL_WIDTH / 2]}>
          <boxGeometry args={[0.1, GOAL_HEIGHT, 0.1]} />
          <meshStandardMaterial color={COLORS.goalFrame} />
        </mesh>
        <mesh position={[0, GOAL_HEIGHT, 0]}>
          <boxGeometry args={[0.1, 0.1, GOAL_WIDTH + 0.2]} />
          <meshStandardMaterial color={COLORS.goalFrame} />
        </mesh>
        <mesh position={[-0.25, GOAL_HEIGHT / 2, 0]}>
          <boxGeometry args={[0.1, GOAL_HEIGHT, 0.1]} />
          <meshStandardMaterial color={COLORS.goalFrame} />
        </mesh>

        <mesh position={[-0.1, GOAL_HEIGHT / 2, 0]}>
          <boxGeometry args={[0.05, GOAL_HEIGHT - 0.2, GOAL_WIDTH]} />
          <meshStandardMaterial
            color={COLORS.goalNet}
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      <group position={[PITCH_WIDTH / 2 + 0.25, GOAL_HEIGHT / 2, 0]}>
        <mesh position={[0, GOAL_HEIGHT / 2, -GOAL_WIDTH / 2]}>
          <boxGeometry args={[0.1, GOAL_HEIGHT, 0.1]} />
          <meshStandardMaterial color={COLORS.goalFrame} />
        </mesh>
        <mesh position={[0, GOAL_HEIGHT / 2, GOAL_WIDTH / 2]}>
          <boxGeometry args={[0.1, GOAL_HEIGHT, 0.1]} />
          <meshStandardMaterial color={COLORS.goalFrame} />
        </mesh>
        <mesh position={[0, GOAL_HEIGHT, 0]}>
          <boxGeometry args={[0.1, 0.1, GOAL_WIDTH + 0.2]} />
          <meshStandardMaterial color={COLORS.goalFrame} />
        </mesh>
        <mesh position={[0.25, GOAL_HEIGHT / 2, 0]}>
          <boxGeometry args={[0.1, GOAL_HEIGHT, 0.1]} />
          <meshStandardMaterial color={COLORS.goalFrame} />
        </mesh>

        <mesh position={[0.1, GOAL_HEIGHT / 2, 0]}>
          <boxGeometry args={[0.05, GOAL_HEIGHT - 0.2, GOAL_WIDTH]} />
          <meshStandardMaterial
            color={COLORS.goalNet}
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {[-PITCH_WIDTH / 2, PITCH_WIDTH / 2].map((x) =>
        [-PITCH_DEPTH / 2, PITCH_DEPTH / 2].map((z) => (
          <mesh key={`corner-${x}-${z}`} position={[x, 0.1, z]}>
            <coneGeometry args={[0.15, 0.3, 6]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        ))
      )}
    </group>
  );
}
