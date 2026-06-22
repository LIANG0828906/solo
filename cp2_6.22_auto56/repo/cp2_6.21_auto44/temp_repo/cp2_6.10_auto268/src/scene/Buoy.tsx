import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { DragControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { Buoy as BuoyType, NOTE_NAMES } from '@/types';
import { useStore } from '@/store/useStore';

interface BuoyProps {
  buoy: BuoyType;
}

export const Buoy = ({ buoy }: BuoyProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const outerHaloRef = useRef<THREE.Mesh>(null);
  const rippleRef = useRef<THREE.Mesh>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const { updateBuoyPosition, triggerBuoySound, setSelectedBuoy, selectedBuoyId } = useStore();

  const isSelected = selectedBuoyId === buoy.id;

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const freq = buoy.frequency;
    
    if (groupRef.current && !isDragging) {
      const bobOffset = Math.sin(time * freq + buoy.position[0]) * 0.1;
      groupRef.current.position.y = buoy.position[1] + bobOffset;
    }

    if (haloRef.current) {
      const pulse = 0.8 + Math.sin(time * freq * 2) * 0.2;
      const material = haloRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.3 + pulse * 0.15;
      haloRef.current.scale.setScalar(pulse * 0.8);
    }

    if (outerHaloRef.current) {
      const pulse = 1 + Math.sin(time * freq * 1.5 + 1) * 0.3;
      const material = outerHaloRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.15 + Math.sin(time * freq) * 0.05;
      outerHaloRef.current.scale.setScalar(1.2 + pulse * 0.3);
    }

    if (rippleRef.current) {
      const ripplePhase = (time * freq * 0.5) % 1;
      const scale = 1 + ripplePhase * 2;
      const material = rippleRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = (1 - ripplePhase) * 0.4;
      rippleRef.current.scale.setScalar(scale);
    }
  });

  const handleDragEnd = () => {
    setIsDragging(false);
    if (groupRef.current) {
      const pos = groupRef.current.position;
      updateBuoyPosition(buoy.id, [pos.x, pos.y, pos.z]);
    }
  };

  const handleClick = (event: any) => {
    event.stopPropagation();
    if (!isDragging) {
      triggerBuoySound(buoy.id);
      setSelectedBuoy(buoy.id);
    }
  };

  const scale = isSelected ? 1.2 : isHovered ? 1.1 : 1;

  return (
    <DragControls
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      onHover={(hovered) => setIsHovered(hovered)}
    >
      <group
        ref={groupRef}
        position={[buoy.position[0], buoy.position[1], buoy.position[2]]}
        onClick={handleClick}
        scale={scale}
      >
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.08, 0.12, 0.6, 16]} />
          <meshStandardMaterial
            color={buoy.color}
            transparent
            opacity={0.8}
            emissive={buoy.color}
            emissiveIntensity={0.3}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>

        <mesh position={[0, 0.65, 0]}>
          <sphereGeometry args={[0.15, 32, 32]} />
          <meshStandardMaterial
            color={buoy.color}
            emissive={buoy.color}
            emissiveIntensity={isSelected ? 0.8 : 0.4}
            roughness={0.1}
            metalness={0.9}
          />
        </mesh>

        <mesh ref={haloRef} position={[0, 0.65, 0]}>
          <sphereGeometry args={[0.25, 32, 32]} />
          <meshBasicMaterial
            color={buoy.color}
            transparent
            opacity={0.3}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        <mesh ref={outerHaloRef} position={[0, 0.65, 0]}>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshBasicMaterial
            color={buoy.color}
            transparent
            opacity={0.15}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        <mesh ref={rippleRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <ringGeometry args={[0.3, 0.35, 64]} />
          <meshBasicMaterial
            color={buoy.color}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <circleGeometry args={[0.8, 64]} />
          <meshBasicMaterial
            color={buoy.color}
            transparent
            opacity={0.1}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        <group position={[0, 1.2, 0]}>
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[0.6, 0.25]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={isSelected ? 0.9 : 0.6}
            />
          </mesh>
          <Text
            position={[0, 0, 0]}
            fontSize={0.12}
            color="#0a1a3a"
            anchorX="center"
            anchorY="middle"
          >
            {`${NOTE_NAMES[buoy.pitch]}4`}
          </Text>
        </group>
      </group>
    </DragControls>
  );
};
