import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';

const ROOM_WIDTH = 12;
const ROOM_DEPTH = 10;
const ROOM_HEIGHT = 3;

export function Room() {
  const wallColorStore = useAppStore((s) => s.wallColor);
  const interpolatedColor = useRef(new THREE.Color(wallColorStore));

  useFrame(() => {
    const target = new THREE.Color(wallColorStore);
    interpolatedColor.current.lerp(target, 0.08);
  });

  const floorTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const darkBrown = '#8B6914';
    const lightBrown = '#C4A265';
    const stripeHeight = 32;

    for (let y = 0; y < canvas.height; y += stripeHeight) {
      const isDark = Math.floor(y / stripeHeight) % 2 === 0;
      ctx.fillStyle = isDark ? darkBrown : lightBrown;
      ctx.fillRect(0, y, canvas.width, stripeHeight);

      for (let x = 0; x < canvas.width; x += 4) {
        const noise = (Math.random() - 0.5) * 20;
        const baseColor = isDark ? new THREE.Color(darkBrown) : new THREE.Color(lightBrown);
        const r = Math.max(0, Math.min(255, Math.round(baseColor.r * 255 + noise)));
        const g = Math.max(0, Math.min(255, Math.round(baseColor.g * 255 + noise)));
        const b = Math.max(0, Math.min(255, Math.round(baseColor.b * 255 + noise)));
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 4, stripeHeight);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 3);
    texture.anisotropy = 8;
    texture.needsUpdate = true;

    return texture;
  }, []);

  return (
    <group>
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
      >
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshStandardMaterial
          map={floorTexture}
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>

      <mesh receiveShadow position={[0, ROOM_HEIGHT / 2, -ROOM_DEPTH / 2]}>
        <planeGeometry args={[ROOM_WIDTH, ROOM_HEIGHT]} />
        <meshStandardMaterial
          color={interpolatedColor.current}
          roughness={0.95}
        />
      </mesh>

      <mesh
        receiveShadow
        position={[0, ROOM_HEIGHT / 2, ROOM_DEPTH / 2]}
        rotation={[0, Math.PI, 0]}
      >
        <planeGeometry args={[ROOM_WIDTH, ROOM_HEIGHT]} />
        <meshStandardMaterial
          color={interpolatedColor.current}
          roughness={0.95}
        />
      </mesh>

      <mesh
        receiveShadow
        position={[-ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <planeGeometry args={[ROOM_DEPTH, ROOM_HEIGHT]} />
        <meshStandardMaterial
          color={interpolatedColor.current}
          roughness={0.95}
        />
      </mesh>

      <mesh
        receiveShadow
        position={[ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        <planeGeometry args={[ROOM_DEPTH, ROOM_HEIGHT]} />
        <meshStandardMaterial
          color={interpolatedColor.current}
          roughness={0.95}
        />
      </mesh>

      <mesh
        receiveShadow
        position={[0, ROOM_HEIGHT, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshStandardMaterial
          color={interpolatedColor.current}
          roughness={0.95}
        />
      </mesh>
    </group>
  );
}
