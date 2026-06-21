import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { PartData } from '@/types';

interface PartLabelProps {
  part: PartData;
  worldPosition: THREE.Vector3;
}

export function PartLabel({ part, worldPosition }: PartLabelProps) {
  const spriteRef = useRef<THREE.Sprite>(null);
  const { camera } = useThree();

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    const size = 256;
    canvas.width = size;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'rgba(22, 33, 62, 0.85)';
    const radius = 12;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(size - radius, 0);
    ctx.quadraticCurveTo(size, 0, size, radius);
    ctx.lineTo(size, 64 - radius);
    ctx.quadraticCurveTo(size, 64, size - radius, 64);
    ctx.lineTo(radius, 64);
    ctx.quadraticCurveTo(0, 64, 0, 64 - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = part.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(part.label, size / 2, 32);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [part.label, part.color]);

  useFrame(() => {
    if (!spriteRef.current) return;
    const distance = camera.position.distanceTo(worldPosition);
    const scale = Math.max(0.5, Math.min(1.5, distance * 0.12));
    spriteRef.current.scale.set(scale * 1.6, scale * 0.4, 1);
    spriteRef.current.position.set(
      worldPosition.x,
      worldPosition.y + 1.2,
      worldPosition.z
    );
  });

  return (
    <sprite ref={spriteRef} position={[worldPosition.x, worldPosition.y + 1.2, worldPosition.z]}>
      <spriteMaterial
        map={texture}
        transparent
        depthTest={false}
        depthWrite={false}
        sizeAttenuation
      />
    </sprite>
  );
}
