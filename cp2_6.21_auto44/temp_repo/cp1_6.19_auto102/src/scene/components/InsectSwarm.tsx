import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore, Insect } from '../../store/sceneStore';
import { updateInsect, applyAnimationToMesh } from '../insects';

interface InsectMeshProps {
  type: 'bee' | 'ant';
}

const InsectMesh: React.FC<InsectMeshProps> = React.memo(({ type }) => {
  if (type === 'bee') {
    return (
      <group>
        <mesh>
          <sphereGeometry args={[0.12, 12, 10]} />
          <meshStandardMaterial color={0xf4d03f} roughness={0.5} metalness={0.1} />
        </mesh>
        <mesh position-z={-0.08} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.11, 0.02, 6, 16]} />
          <meshStandardMaterial color={0x6e4b3a} roughness={0.7} />
        </mesh>
        <mesh position-z={0} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.11, 0.02, 6, 16]} />
          <meshStandardMaterial color={0x6e4b3a} roughness={0.7} />
        </mesh>
        <mesh position-z={0.08} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.11, 0.02, 6, 16]} />
          <meshStandardMaterial color={0x6e4b3a} roughness={0.7} />
        </mesh>
        <mesh position-z={0.16}>
          <sphereGeometry args={[0.07, 10, 8]} />
          <meshStandardMaterial color={0x2c1810} roughness={0.6} />
        </mesh>
        <mesh position={[-0.1, 0.05, 0]} rotation-z={-0.3}>
          <planeGeometry args={[0.18, 0.12]} />
          <meshStandardMaterial color={0xffffff} transparent opacity={0.35} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0.1, 0.05, 0]} rotation-z={0.3}>
          <planeGeometry args={[0.18, 0.12]} />
          <meshStandardMaterial color={0xffffff} transparent opacity={0.35} side={THREE.DoubleSide} />
        </mesh>
      </group>
    );
  }

  return (
    <group>
      <mesh position-z={-0.12}>
        <sphereGeometry args={[0.09, 10, 8]} />
        <meshStandardMaterial color={0x3e2723} roughness={0.7} />
      </mesh>
      <mesh position-z={0}>
        <sphereGeometry args={[0.065, 10, 8]} />
        <meshStandardMaterial color={0x3e2723} roughness={0.7} />
      </mesh>
      <mesh position-z={0.1}>
        <sphereGeometry args={[0.055, 10, 8]} />
        <meshStandardMaterial color={0x3e2723} roughness={0.7} />
      </mesh>
    </group>
  );
});

InsectMesh.displayName = 'InsectMesh';

interface SingleInsectProps {
  insect: Insect;
  onUpdate: (id: number, updates: Partial<Insect>) => void;
  allInsects: Insect[];
}

const SingleInsect: React.FC<SingleInsectProps> = React.memo(({ insect, onUpdate, allInsects }) => {
  const groupRef = useRef<THREE.Group>(null);
  const stateRef = useRef(insect);
  const obstacles = useSceneStore((s) => s.obstacles);
  const swarmMode = useSceneStore((s) => s.swarmMode);
  const targetPoint = useSceneStore((s) => s.targetPoint);
  const terrainSize = useSceneStore((s) => s.terrainSize);
  const markCellVisited = useSceneStore((s) => s.markCellVisited);

  useEffect(() => {
    stateRef.current = insect;
  }, [insect]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const current = stateRef.current;
    const time = state.clock.elapsedTime;

    const result = updateInsect(
      current,
      Math.min(delta, 0.05),
      time,
      targetPoint ? targetPoint.position : null,
      swarmMode,
      allInsects,
      obstacles,
      terrainSize
    );

    groupRef.current.position.copy(result.newPosition);

    const velocity = result.newVelocity;
    if (velocity.lengthSq() > 0.01) {
      const angle = Math.atan2(velocity.x, velocity.z);
      groupRef.current.rotation.y = angle;
    }

    const SWING_AMPLITUDE = THREE.MathUtils.degToRad(3);
    const SWING_FREQUENCY = 2;
    const swing = Math.sin(time * SWING_FREQUENCY * Math.PI * 2 + current.phase) * SWING_AMPLITUDE;
    groupRef.current.rotation.z = swing;

    markCellVisited(result.newPosition.x, result.newPosition.z);

    onUpdate(current.id, {
      position: result.newPosition,
      velocity: result.newVelocity,
      phase: result.newPhase,
      path: result.newPath,
      pathIndex: result.newPathIndex,
      targetPosition: result.newTarget,
    });

    stateRef.current = {
      ...current,
      position: result.newPosition,
      velocity: result.newVelocity,
      phase: result.newPhase,
      path: result.newPath,
      pathIndex: result.newPathIndex,
      targetPosition: result.newTarget,
    };
  });

  return (
    <group ref={groupRef} position={[insect.position.x, insect.position.y, insect.position.z]}>
      <InsectMesh type={insect.type} />
    </group>
  );
});

SingleInsect.displayName = 'SingleInsect';

const InsectSwarm: React.FC = () => {
  const insects = useSceneStore((s) => s.insects);
  const updateInsectStore = useSceneStore((s) => s.updateInsect);
  const updateStats = useSceneStore((s) => s.updateStats);
  const lastStatsUpdate = useRef(0);

  useFrame((_, delta) => {
    lastStatsUpdate.current += delta;
    if (lastStatsUpdate.current >= 1) {
      lastStatsUpdate.current = 0;
      updateStats();
    }
  });

  const handleUpdate = useMemo(
    () => (id: number, updates: Partial<Insect>) => {
      updateInsectStore(id, updates);
    },
    [updateInsectStore]
  );

  return (
    <group>
      {insects.map((insect) => (
        <SingleInsect
          key={insect.id}
          insect={insect}
          onUpdate={handleUpdate}
          allInsects={insects}
        />
      ))}
    </group>
  );
};

export default InsectSwarm;
