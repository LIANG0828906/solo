import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useHelper } from '@react-three/fiber';

interface LightControllerProps {
  lightAngle: number;
}

const LightController: React.FC<LightControllerProps> = ({ lightAngle }) => {
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);

  useEffect(() => {
    if (!directionalLightRef.current) return;

    const angleRad = (lightAngle * Math.PI) / 180;
    const distance = 60;
    const height = 40;

    const posX = Math.cos(angleRad) * distance;
    const posZ = Math.sin(angleRad) * distance;
    const posY = height;

    directionalLightRef.current.position.set(posX, posY, posZ);
  }, [lightAngle]);

  useHelper(
    import.meta.env.DEV ? directionalLightRef : null,
    THREE.DirectionalLightHelper,
    5,
    '#ffffff'
  );

  return (
    <>
      <ambientLight intensity={0.4} color="#e0e0ff" />
      <directionalLight
        ref={directionalLightRef}
        intensity={1.2}
        color="#fff8e7"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={200}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
        shadow-bias={-0.0005}
      />
    </>
  );
};

export default LightController;
