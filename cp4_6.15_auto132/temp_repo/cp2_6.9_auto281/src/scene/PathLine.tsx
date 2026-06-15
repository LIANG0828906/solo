import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PathData } from '../types';

interface PathLineProps {
  path: PathData;
}

export function PathLine({ path }: PathLineProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  const { geometry, curveLength } = useMemo(() => {
    const points = path.points.map((p) => new THREE.Vector3(...p));
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
    const curveLength = curve.getLength();
    const geometry = new THREE.TubeGeometry(curve, 100, 0.05, 8, false);
    return { geometry, curveLength };
  }, [path.points]);

  useFrame((state) => {
    if (materialRef.current) {
      const time = state.clock.elapsedTime;
      materialRef.current.opacity = 0.5 + Math.sin(time * 2) * 0.1;
    }
  });

  const dashedTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 16;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createLinearGradient(0, 0, 256, 0);
    gradient.addColorStop(0, 'rgba(135, 206, 250, 0.9)');
    gradient.addColorStop(0.5, 'rgba(135, 206, 250, 0.3)');
    gradient.addColorStop(1, 'rgba(135, 206, 250, 0.9)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 16);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 256; i += 32) {
      ctx.fillRect(i, 6, 16, 4);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.x = Math.max(5, curveLength * 0.8);
    return texture;
  }, [curveLength]);

  useFrame((state) => {
    if (dashedTexture) {
      dashedTexture.offset.x = -state.clock.elapsedTime * 0.5;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshBasicMaterial
        ref={materialRef}
        map={dashedTexture}
        transparent
        opacity={0.7}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
