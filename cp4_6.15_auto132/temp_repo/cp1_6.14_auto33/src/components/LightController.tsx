import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';

interface LightControllerProps {
  lightAngle: number;
}

const LightController: React.FC<LightControllerProps> = ({ lightAngle }) => {
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);
  const { scene } = useThree();

  useEffect(() => {
    const light = directionalLightRef.current;
    if (!light) return;

    const angleRad = (lightAngle * Math.PI) / 180;
    const distance = 60;
    const height = 40;

    light.position.set(
      Math.cos(angleRad) * distance,
      height,
      Math.sin(angleRad) * distance
    );

    light.target.position.set(0, 0, 0);
    light.target.updateMatrixWorld();

    if (light.shadow.camera) {
      light.shadow.camera.updateProjectionMatrix();
    }

    light.shadow.needsUpdate = true;
  }, [lightAngle]);

  useEffect(() => {
    const light = directionalLightRef.current;
    if (!light) return;

    scene.add(light.target);

    return () => {
      scene.remove(light.target);
    };
  }, [scene]);

  return (
    <>
      <ambientLight intensity={0.4} color="#b0c4de" />
      <hemisphereLight
        color="#87ceeb"
        groundColor="#3a5f0b"
        intensity={0.3}
      />
      <directionalLight
        ref={directionalLightRef}
        intensity={1.2}
        color="#fff8e7"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={200}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
    </>
  );
};

export default LightController;
