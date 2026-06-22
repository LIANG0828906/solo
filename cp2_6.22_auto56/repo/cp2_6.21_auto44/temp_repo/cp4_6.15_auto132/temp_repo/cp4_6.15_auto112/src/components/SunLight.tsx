import { useMemo, useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface SunLightProps {
  sunDirection: [number, number, number];
  sunAltitude: number;
  time: number;
  intensity?: number;
}

const SUNRISE_COLOR = new THREE.Color(0xffaa66);
const NOON_COLOR = new THREE.Color(0xffffff);

function lerpColor(a: THREE.Color, b: THREE.Color, t: number): THREE.Color {
  return a.clone().lerp(b, t);
}

function calculateSunColor(time: number): THREE.Color {
  const sunrise = 6;
  const noon = 12;
  const sunset = 19;

  if (time <= sunrise || time >= sunset + (sunset - noon)) {
    return SUNRISE_COLOR.clone();
  }

  if (time <= noon) {
    const t = (time - sunrise) / (noon - sunrise);
    return lerpColor(SUNRISE_COLOR, NOON_COLOR, Math.max(0, Math.min(1, t)));
  }

  const eveningEnd = sunset + (sunset - noon);
  if (time <= eveningEnd) {
    const t = (time - noon) / (sunset - noon);
    return lerpColor(NOON_COLOR, SUNRISE_COLOR, Math.max(0, Math.min(1, t)));
  }

  return SUNRISE_COLOR.clone();
}

function calculateIntensity(altitude: number): number {
  if (altitude < 0) {
    return 0;
  }
  if (altitude > 0.5) {
    return 1.0;
  }
  return altitude / 0.5;
}

export const SunLight: React.FC<SunLightProps> = ({
  sunDirection,
  sunAltitude,
  time,
  intensity = 1.5,
}) => {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const { gl } = useThree();

  const { lightPosition, lightColor, lightIntensity } = useMemo(() => {
    const dir = new THREE.Vector3(...sunDirection).normalize();
    const distance = 100;
    const position: [number, number, number] = [
      dir.x * distance,
      dir.y * distance,
      dir.z * distance,
    ];

    const baseIntensity = calculateIntensity(sunAltitude);
    const finalIntensity = baseIntensity * intensity;

    const color = calculateSunColor(time);

    return {
      lightPosition: position,
      lightColor: color,
      lightIntensity: finalIntensity,
    };
  }, [sunDirection, sunAltitude, time, intensity]);

  useEffect(() => {
    if (gl) {
      gl.shadowMap.enabled = true;
      gl.shadowMap.type = THREE.PCFSoftShadowMap;
    }
  }, [gl]);

  useEffect(() => {
    if (lightRef.current) {
      lightRef.current.target.position.set(0, 0, 0);
      lightRef.current.target.updateMatrixWorld();
    }
  }, []);

  return (
    <>
      <ambientLight intensity={0.2} />
      <hemisphereLight args={[0x87ceeb, 0x8b7355, 0.4]} />
      <directionalLight
        ref={lightRef}
        position={lightPosition}
        color={lightColor}
        intensity={lightIntensity}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-camera-near={0.5}
        shadow-camera-far={200}
        shadow-bias={-0.0001}
      />
    </>
  );
};

export default SunLight;
