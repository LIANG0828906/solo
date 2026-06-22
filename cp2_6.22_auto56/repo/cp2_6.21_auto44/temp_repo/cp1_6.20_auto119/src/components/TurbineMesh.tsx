import { useRef, useMemo, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { Turbine } from '../types';
import { ROTATION_SPEED_BASE } from '../types';

interface TurbineMeshProps {
  turbine: Turbine;
  windDirection: number;
  windSpeed: number;
  isSelected: boolean;
  onClick: () => void;
}

export interface TurbineMeshHandle {
  getRotorRotation: () => number;
}

export const TurbineMesh = forwardRef<TurbineMeshHandle, TurbineMeshProps>(function TurbineMesh(
  { turbine, windDirection, windSpeed, isSelected, onClick },
  ref
) {
  const bladesRef = useRef<THREE.Group>(null);
  const nacelleRef = useRef<THREE.Group>(null);
  const rotorRotationRef = useRef(0);

  useImperativeHandle(ref, () => ({
    getRotorRotation: () => rotorRotationRef.current,
  }));

  const { towerGeometry, nacelleGeometry, bladeGeometry } = useMemo(() => {
    const towerGeo = new THREE.CylinderGeometry(
      turbine.rotorDiameter * 0.03,
      turbine.rotorDiameter * 0.05,
      turbine.hubHeight,
      12
    );
    towerGeo.translate(0, turbine.hubHeight / 2, 0);

    const nacelleGeo = new THREE.BoxGeometry(
      turbine.rotorDiameter * 0.12,
      turbine.rotorDiameter * 0.06,
      turbine.rotorDiameter * 0.18
    );
    nacelleGeo.translate(0, turbine.hubHeight, 0);

    const bladeGeo = new THREE.BoxGeometry(
      turbine.rotorDiameter * 0.025,
      turbine.rotorDiameter * 0.45,
      turbine.rotorDiameter * 0.015
    );
    bladeGeo.translate(0, turbine.rotorDiameter * 0.225, 0);

    return {
      towerGeometry: towerGeo,
      nacelleGeometry: nacelleGeo,
      bladeGeometry: bladeGeo,
    };
  }, [turbine.rotorDiameter, turbine.hubHeight]);

  const nacelleRotationY = (windDirection * Math.PI) / 180;

  useFrame((_, delta) => {
    if (bladesRef.current) {
      const speedFactor = windSpeed / 10;
      rotorRotationRef.current += delta * ROTATION_SPEED_BASE * (Math.PI / 30) * speedFactor;
      bladesRef.current.rotation.z = rotorRotationRef.current;
    }
    if (nacelleRef.current) {
      nacelleRef.current.rotation.y = nacelleRotationY;
    }
  });

  const handleClick = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    onClick();
  };

  return (
    <group position={turbine.position} onClick={handleClick}>
      <mesh geometry={towerGeometry} castShadow receiveShadow>
        <meshStandardMaterial
          color={isSelected ? 0x88ccff : 0xffffff}
          metalness={0.3}
          roughness={0.5}
        />
      </mesh>

      <group ref={nacelleRef}>
        <mesh geometry={nacelleGeometry} position={[0, 0, turbine.rotorDiameter * 0.02]} castShadow>
          <meshStandardMaterial
            color={isSelected ? 0xaaddff : 0xf5f5f5}
            metalness={0.4}
            roughness={0.4}
          />
        </mesh>

        <group ref={bladesRef} position={[0, turbine.hubHeight, turbine.rotorDiameter * 0.1]}>
          {[0, 1, 2].map((i) => (
            <group key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]}>
              <mesh geometry={bladeGeometry} castShadow>
                <meshStandardMaterial
                  color={isSelected ? 0xaaddff : 0xffffff}
                  metalness={0.2}
                  roughness={0.6}
                  transparent
                  opacity={0.95}
                />
              </mesh>
            </group>
          ))}
        </group>
      </group>

      {isSelected && (
        <mesh position={[0, turbine.hubHeight, 0]}>
          <sphereGeometry args={[turbine.rotorDiameter * 0.55, 32, 32]} />
          <meshBasicMaterial color={0x4488ff} transparent opacity={0.15} wireframe />
        </mesh>
      )}
    </group>
  );
});
