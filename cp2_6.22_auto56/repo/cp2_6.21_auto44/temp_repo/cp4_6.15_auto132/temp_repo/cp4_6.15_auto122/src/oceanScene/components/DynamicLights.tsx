import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  directionalIntensity: number;
  sunColor: string;
  lightPenetration: number;
}

export default function DynamicLights({
  directionalIntensity,
  sunColor,
  lightPenetration,
}: Props) {
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const spotRef = useRef<THREE.SpotLight>(null);
  const pointRef = useRef<THREE.PointLight>(null);
  const point2Ref = useRef<THREE.PointLight>(null);

  const causticTarget = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (dirLightRef.current) {
      const sway = Math.sin(t * 0.3) * 0.5;
      dirLightRef.current.position.set(
        15 + sway,
        25 + Math.sin(t * 0.2) * 2,
        18 + Math.cos(t * 0.35) * 0.8
      );
      dirLightRef.current.intensity =
        directionalIntensity + Math.sin(t * 0.8) * 0.04;
    }

    if (spotRef.current) {
      const angle = 0.32 + (lightPenetration / 200) * 0.2;
      spotRef.current.angle = angle;
      spotRef.current.intensity =
        1.2 * (0.4 + (lightPenetration / 200) * 1.2) +
        Math.sin(t * 1.5) * 0.08;
      spotRef.current.target.position.copy(causticTarget);
      spotRef.current.target.updateMatrixWorld();
    }

    if (pointRef.current) {
      pointRef.current.intensity = 0.6 + Math.sin(t * 2.1) * 0.08;
      pointRef.current.position.x = Math.sin(t * 0.6) * 8;
      pointRef.current.position.z = Math.cos(t * 0.5) * 8;
      pointRef.current.position.y = -20 - Math.sin(t * 0.8) * 5;
    }

    if (point2Ref.current) {
      point2Ref.current.intensity = 0.35 + Math.sin(t * 1.3 + 1.5) * 0.06;
      point2Ref.current.position.x = Math.sin(t * 0.4 + 2) * 12;
      point2Ref.current.position.z = Math.cos(t * 0.35 + 2) * 12;
      point2Ref.current.position.y = -60 - Math.cos(t * 0.9) * 6;
    }
  });

  return (
    <>
      <directionalLight
        ref={dirLightRef}
        position={[15, 25, 18]}
        intensity={directionalIntensity}
        color={sunColor}
        castShadow={false}
      />

      <spotLight
        ref={spotRef}
        position={[0, 1, 0]}
        angle={0.38}
        penumbra={0.8}
        intensity={1.4}
        color="#cceeff"
        distance={60}
        decay={1.6}
      />

      <pointLight
        ref={pointRef}
        color="#55ddff"
        intensity={0.6}
        distance={35}
        decay={2}
      />

      <pointLight
        ref={point2Ref}
        color="#2299ff"
        intensity={0.35}
        distance={45}
        decay={2}
      />
    </>
  );
}
