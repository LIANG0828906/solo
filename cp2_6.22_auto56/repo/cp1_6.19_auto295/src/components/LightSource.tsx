import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import type { Light } from '../types';

interface LightSourceProps {
  light: Light;
  shadowMapSize: number;
  onSelect?: (id: string) => void;
}

export function LightSource({ light, shadowMapSize, onSelect }: LightSourceProps) {
  const lightRef = useRef<THREE.PointLight | THREE.SpotLight>(null);
  const targetRef = useRef<THREE.Object3D>(null);

  useEffect(() => {
    if (light.type === 'spot' && lightRef.current && targetRef.current) {
      (lightRef.current as THREE.SpotLight).target = targetRef.current;
    }
  }, [light.type]);

  if (light.type === 'point') {
    return (
      <group
        position={[light.position.x, light.position.y, light.position.z]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.(light.id);
        }}
      >
        <pointLight
          ref={lightRef as React.RefObject<THREE.PointLight>}
          color={light.color}
          intensity={light.intensity}
          distance={20}
          decay={2}
          castShadow
          shadow-mapSize-width={shadowMapSize}
          shadow-mapSize-height={shadowMapSize}
          shadow-bias={-0.0001}
        />
        <mesh>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshBasicMaterial color={light.color} />
        </mesh>
      </group>
    );
  }

  const angleRad = ((light.angle || 30) * Math.PI) / 180;
  const targetPos = light.target || { x: 0, y: 0, z: 0 };

  return (
    <group
      position={[light.position.x, light.position.y, light.position.z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(light.id);
      }}
    >
      <spotLight
        ref={lightRef as React.RefObject<THREE.SpotLight>}
        color={light.color}
        intensity={light.intensity}
        distance={30}
        angle={angleRad}
        penumbra={light.penumbra}
        decay={2}
        castShadow
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-bias={-0.0001}
      />
      <object3D ref={targetRef} position={[targetPos.x - light.position.x, targetPos.y - light.position.y, targetPos.z - light.position.z]} />
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.15, 0.2, 16, 1, true]} />
        <meshStandardMaterial color="#808080" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.12, 16]} />
        <meshBasicMaterial color={light.color} />
      </mesh>
    </group>
  );
}
