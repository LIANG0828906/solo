import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { MechanismProp, MechanismType, MECHANISM_COLORS } from '../types';

interface MechanismObjectProps {
  prop: MechanismProp;
  onClick: (e: any) => void;
  onDoubleClick?: (e: any) => void;
  isSelected: boolean;
  isConnectingFrom: boolean;
}

function PressurePlateMesh({ prop, isSelected, isConnectingFrom }: Omit<MechanismObjectProps, 'onClick'>) {
  const meshRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const color = prop.activated ? MECHANISM_COLORS[MechanismType.PressurePlate].active : MECHANISM_COLORS[MechanismType.PressurePlate].inactive;
  const yPos = prop.activated ? -0.1 : 0.05;

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const targetY = yPos;
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, delta * 10);
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = prop.activated ? 0.8 + Math.sin(Date.now() * 0.005) * 0.3 : 0.1;
    }
  });

  return (
    <group ref={meshRef} position={[prop.position[0], yPos, prop.position[2]]}>
      <mesh>
        <boxGeometry args={[1.8, 0.1, 1.8]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.85}
          emissive={color}
          emissiveIntensity={prop.activated ? 0.6 : 0.1}
        />
      </mesh>
      <mesh ref={glowRef} position={[0, 0.06, 0]}>
        <boxGeometry args={[1.6, 0.02, 1.6]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          transparent
          opacity={0.6}
        />
      </mesh>
      {(isSelected || isConnectingFrom) && (
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[2, 0.02, 2]} />
          <meshBasicMaterial color="#ffff00" transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

function LaserEmitterMesh({ prop, isSelected, isConnectingFrom }: Omit<MechanismObjectProps, 'onClick'>) {
  const groupRef = useRef<THREE.Group>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const color = prop.activated ? prop.laserColor : MECHANISM_COLORS[MechanismType.LaserEmitter].inactive;

  useFrame(() => {
    if (!beamRef.current) return;
    beamRef.current.visible = prop.activated;
    if (prop.activated) {
      const mat = beamRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 1.0 + Math.sin(Date.now() * 0.01) * 0.3;
    }
    if (groupRef.current) {
      const mat = (groupRef.current.children[0] as THREE.Mesh)?.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.emissiveIntensity = prop.activated ? 0.8 : 0.1;
      }
    }
  });

  return (
    <group ref={groupRef} position={prop.position}>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.2, 0.3, 0.8, 8]} />
        <meshStandardMaterial
          color={prop.activated ? prop.laserColor : '#555555'}
          transparent
          opacity={0.85}
          emissive={prop.activated ? prop.laserColor : '#111111'}
          emissiveIntensity={prop.activated ? 0.6 : 0.1}
        />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <coneGeometry args={[0.15, 0.3, 8]} />
        <meshStandardMaterial
          color={prop.activated ? prop.laserColor : '#444444'}
          emissive={prop.activated ? prop.laserColor : '#111111'}
          emissiveIntensity={prop.activated ? 0.8 : 0.1}
        />
      </mesh>
      <mesh ref={beamRef} position={[0, 0.85, 0]} visible={prop.activated}>
        <cylinderGeometry args={[prop.laserRadius * 0.3, prop.laserRadius * 0.3, 15, 8]} />
        <meshStandardMaterial
          color={prop.laserColor}
          emissive={prop.laserColor}
          emissiveIntensity={1.5}
          transparent
          opacity={0.6}
        />
      </mesh>
      {(isSelected || isConnectingFrom) && (
        <mesh position={[0, 0.4, 0]}>
          <sphereGeometry args={[0.6, 16, 16]} />
          <meshBasicMaterial color="#ffff00" transparent opacity={0.2} />
        </mesh>
      )}
    </group>
  );
}

function MovingPlatformMesh({ prop, isSelected, isConnectingFrom }: Omit<MechanismObjectProps, 'onClick'>) {
  const meshRef = useRef<THREE.Mesh>(null);
  const color = prop.activated ? MECHANISM_COLORS[MechanismType.MovingPlatform].active : MECHANISM_COLORS[MechanismType.MovingPlatform].inactive;

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const ox = prop.moveAxis === 'x' ? prop.currentOffset : 0;
    const oy = prop.moveAxis === 'y' ? prop.currentOffset : 0;
    const oz = prop.moveAxis === 'z' ? prop.currentOffset : 0;
    meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, prop.position[0] + ox, delta * 8);
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, prop.position[1] + 0.15 + oy, delta * 8);
    meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, prop.position[2] + oz, delta * 8);
  });

  return (
    <group>
      <mesh ref={meshRef} position={[prop.position[0], prop.position[1] + 0.15, prop.position[2]]}>
        <boxGeometry args={[2.5, 0.3, 2.5]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.85}
          emissive={color}
          emissiveIntensity={prop.activated ? 0.5 : 0.1}
        />
      </mesh>
      {(isSelected || isConnectingFrom) && (
        <mesh position={[prop.position[0], prop.position[1] + 0.4, prop.position[2]]}>
          <boxGeometry args={[2.7, 0.02, 2.7]} />
          <meshBasicMaterial color="#ffff00" transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

function PortalMesh({ prop, isSelected, isConnectingFrom }: Omit<MechanismObjectProps, 'onClick'>) {
  const groupRef = useRef<THREE.Group>(null);
  const color = prop.activated ? MECHANISM_COLORS[MechanismType.Portal].active : MECHANISM_COLORS[MechanismType.Portal].inactive;

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += 0.02;
    const mat1 = (groupRef.current.children[0] as THREE.Mesh)?.material as THREE.MeshStandardMaterial;
    const mat2 = (groupRef.current.children[1] as THREE.Mesh)?.material as THREE.MeshStandardMaterial;
    if (mat1) mat1.emissiveIntensity = prop.activated ? 1.0 + Math.sin(Date.now() * 0.005) * 0.3 : 0.15;
    if (mat2) mat2.emissiveIntensity = prop.activated ? 0.8 + Math.sin(Date.now() * 0.008) * 0.2 : 0.1;
  });

  return (
    <group position={prop.position}>
      <group ref={groupRef} position={[0, 1, 0]}>
        <mesh>
          <torusGeometry args={[0.8, 0.15, 16, 32]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={0.85}
            emissive={color}
            emissiveIntensity={0.5}
          />
        </mesh>
        <mesh>
          <circleGeometry args={[0.7, 32]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={0.3}
            emissive={color}
            emissiveIntensity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
      {(isSelected || isConnectingFrom) && (
        <mesh position={[0, 1, 0]}>
          <sphereGeometry args={[1.2, 16, 16]} />
          <meshBasicMaterial color="#ffff00" transparent opacity={0.2} />
        </mesh>
      )}
    </group>
  );
}

export function MechanismObject({ prop, onClick, onDoubleClick, isSelected, isConnectingFrom }: MechanismObjectProps) {
  const renderMesh = () => {
    switch (prop.type) {
      case MechanismType.PressurePlate:
        return <PressurePlateMesh prop={prop} isSelected={isSelected} isConnectingFrom={isConnectingFrom} />;
      case MechanismType.LaserEmitter:
        return <LaserEmitterMesh prop={prop} isSelected={isSelected} isConnectingFrom={isConnectingFrom} />;
      case MechanismType.MovingPlatform:
        return <MovingPlatformMesh prop={prop} isSelected={isSelected} isConnectingFrom={isConnectingFrom} />;
      case MechanismType.Portal:
        return <PortalMesh prop={prop} isSelected={isSelected} isConnectingFrom={isConnectingFrom} />;
      default:
        return null;
    }
  };

  return (
    <group
      onClick={(e) => { e.stopPropagation(); onClick(e); }}
      onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick && onDoubleClick(e); }}
    >
      {renderMesh()}
    </group>
  );
}
