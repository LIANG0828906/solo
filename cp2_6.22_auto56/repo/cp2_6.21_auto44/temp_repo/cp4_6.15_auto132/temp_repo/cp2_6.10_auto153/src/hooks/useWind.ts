import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface WindState {
  direction: THREE.Vector3;
  strength: number;
}

export function useWind(changeInterval: number = 5): WindState {
  const windRef = useRef<WindState>({
    direction: new THREE.Vector3(1, 0, 0.5).normalize(),
    strength: 0.5,
  });

  const targetWindRef = useRef<WindState>({
    direction: new THREE.Vector3(1, 0, 0.5).normalize(),
    strength: 0.5,
  });

  const lastChangeRef = useRef<number>(0);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const randomizeWind = () => {
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle);
      const z = Math.sin(angle);
      const y = (Math.random() - 0.3) * 0.4;

      targetWindRef.current.direction.set(x, y, z).normalize();
      targetWindRef.current.strength = 0.2 + Math.random() * 0.8;
    };

    const interval = setInterval(randomizeWind, changeInterval * 1000);
    randomizeWind();

    return () => clearInterval(interval);
  }, [changeInterval]);

  useFrame((_, delta) => {
    lastChangeRef.current += delta;

    const currentDir = windRef.current.direction;
    const targetDir = targetWindRef.current.direction;
    const currentStrength = windRef.current.strength;
    const targetStrength = targetWindRef.current.strength;

    currentDir.lerp(targetDir, delta * 0.5);
    windRef.current.strength = currentStrength + (targetStrength - currentStrength) * delta * 0.5;

    if (lastChangeRef.current > 0.1) {
      lastChangeRef.current = 0;
      forceUpdate((n) => n + 1);
    }
  });

  return windRef.current;
}
