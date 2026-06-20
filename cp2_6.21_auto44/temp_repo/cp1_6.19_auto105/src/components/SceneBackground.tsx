import { useMemo } from 'react';
import * as THREE from 'three';

export function SceneBackground() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createRadialGradient(
      512, 300, 50,
      512, 512, 600
    );
    gradient.addColorStop(0, '#3A3028');
    gradient.addColorStop(0.3, '#2A2420');
    gradient.addColorStop(0.6, '#1E1A18');
    gradient.addColorStop(1, '#0D0C0B');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 1024);

    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    return texture;
  }, []);

  return (
    <>
      <mesh scale={500}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial map={texture} side={THREE.BackSide} />
      </mesh>

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -5, 0]}
        receiveShadow
      >
        <circleGeometry args={[80, 64]} />
        <meshStandardMaterial color="#12100E" roughness={1} metalness={0} />
      </mesh>
    </>
  );
}
