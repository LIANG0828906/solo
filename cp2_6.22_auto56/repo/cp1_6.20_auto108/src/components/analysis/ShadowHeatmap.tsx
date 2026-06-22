import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ShadowData } from '../../types';

interface ShadowHeatmapProps {
  shadowData: ShadowData | null;
  visible: boolean;
}

function heatColor(ratio: number): [number, number, number, number] {
  const t = Math.max(0, Math.min(1, ratio));
  let r: number, g: number, b: number;
  if (t < 0.25) {
    const u = t / 0.25;
    r = 37 + (59 - 37) * u;
    g = 99 + (130 - 99) * u;
    b = 235 * (1 - u) + 246 * u;
  } else if (t < 0.5) {
    const u = (t - 0.25) / 0.25;
    r = 59 + (16 - 59) * u;
    g = 130 + (185 - 130) * u;
    b = 246 + (129 - 246) * u;
  } else if (t < 0.75) {
    const u = (t - 0.5) / 0.25;
    r = 16 + (249 - 16) * u;
    g = 185 + (115 - 185) * u;
    b = 129 + (22 - 129) * u;
  } else {
    const u = (t - 0.75) / 0.25;
    r = 249 + (220 - 249) * u;
    g = 115 + (38 - 115) * u;
    b = 22 + (38 - 22) * u;
  }
  return [r / 255, g / 255, b / 255, 0.55];
}

export default function ShadowHeatmap({ shadowData, visible }: ShadowHeatmapProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const opacityRef = useRef(0);

  const { geometry, colors } = useMemo(() => {
    if (!shadowData) {
      return {
        geometry: new THREE.PlaneGeometry(1, 1, 1, 1),
        colors: new Float32Array(4 * 4),
      };
    }
    const { heatmapGrid, gridBounds } = shadowData;
    const res = heatmapGrid.length;
    if (res === 0) {
      return {
        geometry: new THREE.PlaneGeometry(1, 1, 1, 1),
        colors: new Float32Array(4 * 4),
      };
    }
    const width = gridBounds.maxX - gridBounds.minX;
    const depth = gridBounds.maxZ - gridBounds.minZ;
    const geo = new THREE.PlaneGeometry(width, depth, res - 1, res - 1);
    geo.rotateX(-Math.PI / 2);

    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < posAttr.count; i++) {
      const ix = Math.round(((posAttr.getX(i) + width / 2) / width) * (res - 1));
      const iz = Math.round(((-posAttr.getZ(i) + depth / 2) / depth) * (res - 1));
      const clampedIX = Math.max(0, Math.min(res - 1, ix));
      const clampedIZ = Math.max(0, Math.min(res - 1, iz));
      posAttr.setY(i, 0.08);
    }
    posAttr.needsUpdate = true;

    const faceColors = new Float32Array(posAttr.count * 4);
    const nonIndexed = geo.toNonIndexed();
    const posAttr2 = nonIndexed.getAttribute('position') as THREE.BufferAttribute;
    const faceCount = posAttr2.count / 3;
    const finalColors = new Float32Array(posAttr2.count * 4);

    for (let f = 0; f < faceCount; f++) {
      const avgX =
        (posAttr2.getX(f * 3) + posAttr2.getX(f * 3 + 1) + posAttr2.getX(f * 3 + 2)) / 3;
      const avgZ =
        (-posAttr2.getZ(f * 3) + -posAttr2.getZ(f * 3 + 1) + -posAttr2.getZ(f * 3 + 2)) / 3;
      const ix = Math.round(((avgX + width / 2) / width) * (res - 1));
      const iz = Math.round(((avgZ + depth / 2) / depth) * (res - 1));
      const clampedIX = Math.max(0, Math.min(res - 1, ix));
      const clampedIZ = Math.max(0, Math.min(res - 1, iz));
      const data = heatmapGrid[clampedIX][clampedIZ];
      const [r, g, b, a] = heatColor(data.shadowCoverageRatio);
      for (let k = 0; k < 3; k++) {
        finalColors[(f * 3 + k) * 4] = r;
        finalColors[(f * 3 + k) * 4 + 1] = g;
        finalColors[(f * 3 + k) * 4 + 2] = b;
        finalColors[(f * 3 + k) * 4 + 3] = a;
      }
    }
    nonIndexed.setAttribute('color', new THREE.BufferAttribute(finalColors, 4));

    void posAttr;
    void faceColors;
    void colors;
    return { geometry: nonIndexed, colors: finalColors };
  }, [shadowData]);

  useFrame((_s, delta) => {
    if (!meshRef.current) return;
    const target = visible ? 1 : 0;
    opacityRef.current = THREE.MathUtils.lerp(opacityRef.current, target, Math.min(delta * 4, 1));
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = opacityRef.current;
    meshRef.current.visible = opacityRef.current > 0.02;
  });

  if (!shadowData) return null;

  return (
    <mesh ref={meshRef} geometry={geometry} position={[0, 0.04, 0]}>
      <meshBasicMaterial
        vertexColors
        transparent
        opacity={0}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

export { heatColor };
