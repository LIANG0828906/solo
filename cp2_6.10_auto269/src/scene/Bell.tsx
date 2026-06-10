import React, { useRef, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { DragControls } from '@react-three/drei';
import * as THREE from 'three';
import { BellState, ScaleNote } from '@/types';
import { COLORS, PARTICLE_COLORS, SCALE_POSITIONS, SCALE_NOTES } from '@/utils/constants';
import { useGameStore } from '@/store/useGameStore';

interface BellProps {
  bell: BellState;
}

export const Bell: React.FC<BellProps> = ({ bell }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const { camera, raycaster, pointer } = useThree();

  const { updateBellPosition, placeBellOnScale, addParticles } = useGameStore();

  const [hovered, setHovered] = useState(false);

  const bellGeometry = useMemo(() => {
    const geometry = new THREE.CylinderGeometry(
      bell.size * 0.4,
      bell.size * 0.7,
      bell.size * 1.2,
      32,
      4,
      true
    );
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      const normalizedY = (y / bell.size + 0.6) / 1.2;
      const wave = Math.sin(normalizedY * Math.PI * 2) * 0.05 * bell.size;
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const dist = Math.sqrt(x * x + z * z);
      const factor = 1 + wave * (1 - normalizedY);
      positions.setX(i, (x / dist) * dist * factor);
      positions.setZ(i, (z / dist) * dist * factor);
    }
    geometry.computeVertexNormals();
    return geometry;
  }, [bell.size]);

  const bellMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: COLORS.bronze,
      metalness: 0.9,
      roughness: 0.25,
      side: THREE.DoubleSide,
      envMapIntensity: 1.2,
    });
  }, []);

  const rimGeometry = useMemo(
    () => new THREE.TorusGeometry(bell.size * 0.7, bell.size * 0.05, 16, 32),
    [bell.size]
  );

  const topGeometry = useMemo(
    () => new THREE.CylinderGeometry(bell.size * 0.1, bell.size * 0.1, bell.size * 0.3, 16),
    [bell.size]
  );

  const glowGeometry = useMemo(
    () => new THREE.SphereGeometry(bell.size * 0.85, 32, 32),
    [bell.size]
  );

  const glowMaterial = useMemo(() => {
    const color = bell.scaleNote ? PARTICLE_COLORS[bell.scaleNote] : COLORS.bronzeLight;
    return new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });
  }, [bell.scaleNote]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    const time = clock.getElapsedTime();

    if (!bell.isDragging && !bell.targetPosition) {
      const floatY = Math.sin(time * 0.8 + bell.floatOffset) * 0.3;
      const floatX = Math.sin(time * 0.5 + bell.floatOffset * 0.7) * 0.2;
      const floatZ = Math.cos(time * 0.6 + bell.floatOffset * 1.1) * 0.2;
      groupRef.current.position.y = bell.position[1] + floatY;
      groupRef.current.position.x = bell.position[0] + floatX;
      groupRef.current.position.z = bell.position[2] + floatZ;
      groupRef.current.rotation.y += 0.005;
      groupRef.current.rotation.x = Math.sin(time * 0.3 + bell.floatOffset) * 0.05;
      groupRef.current.rotation.z = Math.cos(time * 0.4 + bell.floatOffset) * 0.05;
    } else if (bell.targetPosition && !bell.isDragging) {
      const targetPos = bell.targetPosition;
      groupRef.current.position.lerp(
        new THREE.Vector3(targetPos[0], targetPos[1] + bell.size * 0.8, targetPos[2]),
        0.1
      );
    } else {
      groupRef.current.position.set(...bell.position);
    }

    if (bell.isRinging && meshRef.current) {
      const scale = 1 + Math.sin(time * 30) * 0.02 * bell.ringIntensity;
      meshRef.current.scale.setScalar(scale);
    } else if (meshRef.current) {
      meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    }

    if (glowRef.current) {
      const targetOpacity = bell.isHarmonizing
        ? 0.6
        : bell.isRinging
        ? 0.4 * bell.ringIntensity
        : hovered
        ? 0.15
        : 0;
      glowMaterial.opacity += (targetOpacity - glowMaterial.opacity) * 0.1;

      const glowScale = bell.isHarmonizing
        ? 1.2 + Math.sin(time * 5) * 0.1
        : bell.isRinging
        ? 1 + Math.sin(time * 10) * 0.05 * bell.ringIntensity
        : 1;
      glowRef.current.scale.setScalar(glowScale);

      if (bell.scaleNote) {
        const color = new THREE.Color(PARTICLE_COLORS[bell.scaleNote]);
        glowMaterial.color.lerp(color, 0.1);
      }
    }

    if (hovered) {
      document.body.style.cursor = 'grab';
    } else if (!document.body.style.cursor.includes('dragging')) {
      document.body.style.cursor = 'auto';
    }
  });

  const findNearestScale = (position: [number, number, number]): ScaleNote | null => {
    let nearestNote: ScaleNote | null = null;
    let minDistance = Infinity;

    for (const note of SCALE_NOTES) {
      const scalePos = SCALE_POSITIONS[note];
      const dx = position[0] - scalePos[0];
      const dy = position[1] - scalePos[1];
      const dz = position[2] - scalePos[2];
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distance < 1.5 && distance < minDistance) {
        minDistance = distance;
        nearestNote = note;
      }
    }

    return nearestNote;
  };

  const handleDragStart = () => {
    document.body.style.cursor = 'grabbing';
  };

  const handleDrag = (e: { object: THREE.Object3D }) => {
    const pos = e.object.position;
    updateBellPosition(
      bell.id,
      [pos.x, pos.y, pos.z],
      true
    );
  };

  const handleDragEnd = (e: { object: THREE.Object3D }) => {
    document.body.style.cursor = 'auto';
    const pos: [number, number, number] = [e.object.position.x, e.object.position.y, e.object.position.z];

    const nearestNote = findNearestScale(pos);

    if (nearestNote) {
      const scalePos = SCALE_POSITIONS[nearestNote];
      const finalPos: [number, number, number] = [scalePos[0], scalePos[1] + bell.size * 0.8, scalePos[2]];

      placeBellOnScale(bell.id, nearestNote, finalPos);

      const color = PARTICLE_COLORS[nearestNote];
      addParticles(finalPos, color, 40);
    } else {
      updateBellPosition(bell.id, pos, false);
    }
  };

  const handlePointerOver = () => {
    setHovered(true);
  };

  const handlePointerOut = () => {
    setHovered(false);
  };

  return (
    <DragControls
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      autoTransform
    >
      <group ref={groupRef} position={bell.position}>
        <mesh
          ref={meshRef}
          geometry={bellGeometry}
          material={bellMaterial}
          castShadow
          receiveShadow
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        />

        <mesh
          geometry={rimGeometry}
          material={bellMaterial}
          position={[0, -bell.size * 0.6, 0]}
          castShadow
        />

        <mesh
          geometry={topGeometry}
          material={bellMaterial}
          position={[0, bell.size * 0.75, 0]}
          castShadow
        />

        <mesh
          position={[0, bell.size * 0.9, 0]}
          geometry={new THREE.SphereGeometry(bell.size * 0.12, 16, 16)}
          material={
            new THREE.MeshStandardMaterial({
              color: COLORS.bronzeLight,
              metalness: 0.95,
              roughness: 0.15,
            })
          }
          castShadow
        />

        <mesh ref={glowRef} geometry={glowGeometry} material={glowMaterial} />
      </group>
    </DragControls>
  );
};
