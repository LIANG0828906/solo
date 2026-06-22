import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useNebulaContext } from '@/context/NebulaContext';

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

const NEBULA_RADIUS = 30;

export default function NebulaScene() {
  const { params } = useNebulaContext();
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);

  const basePositions = useRef<Float32Array | null>(null);
  const phaseOffsets = useRef<Float32Array | null>(null);
  const radii = useRef<Float32Array | null>(null);

  const particleCount = params.density;

  const geometry = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const bp = new Float32Array(particleCount * 3);
    const po = new Float32Array(particleCount);
    const rad = new Float32Array(particleCount);

    const centerRgb = hexToRgb(params.centerColor);
    const edgeRgb = hexToRgb(params.edgeColor);

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.pow(Math.random(), 0.6) * NEBULA_RADIUS;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      bp[i * 3] = x;
      bp[i * 3 + 1] = y;
      bp[i * 3 + 2] = z;

      po[i] = Math.random() * Math.PI * 2;
      rad[i] = r;

      const t = Math.min(r / NEBULA_RADIUS, 1);
      colors[i * 3] = centerRgb[0] + (edgeRgb[0] - centerRgb[0]) * t;
      colors[i * 3 + 1] = centerRgb[1] + (edgeRgb[1] - centerRgb[1]) * t;
      colors[i * 3 + 2] = centerRgb[2] + (edgeRgb[2] - centerRgb[2]) * t;

      sizes[i] = params.particleSize;
    }

    basePositions.current = bp;
    phaseOffsets.current = po;
    radii.current = rad;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return geo;
  }, [particleCount]);

  useEffect(() => {
    if (!geometry) return;
    const colorAttr = geometry.getAttribute('color') as THREE.BufferAttribute;
    const centerRgb = hexToRgb(params.centerColor);
    const edgeRgb = hexToRgb(params.edgeColor);

    for (let i = 0; i < particleCount; i++) {
      const r = radii.current ? radii.current[i] : 0;
      const t = Math.min(r / NEBULA_RADIUS, 1);
      colorAttr.setXYZ(
        i,
        centerRgb[0] + (edgeRgb[0] - centerRgb[0]) * t,
        centerRgb[1] + (edgeRgb[1] - centerRgb[1]) * t,
        centerRgb[2] + (edgeRgb[2] - centerRgb[2]) * t,
      );
    }
    colorAttr.needsUpdate = true;

    const sizeAttr = geometry.getAttribute('size') as THREE.BufferAttribute;
    for (let i = 0; i < particleCount; i++) {
      sizeAttr.setX(i, params.particleSize);
    }
    sizeAttr.needsUpdate = true;
  }, [params.centerColor, params.edgeColor, params.particleSize, particleCount, geometry]);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.size = params.particleSize;
    }
  }, [params.particleSize]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const time = state.clock.elapsedTime;

    pointsRef.current.rotation.y += params.rotationSpeed;

    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    const bp = basePositions.current;
    const po = phaseOffsets.current;
    if (!bp || !po) return;

    const amp = params.waveAmplitude;
    const freq = params.waveFrequency;

    for (let i = 0; i < particleCount; i++) {
      const baseY = bp[i * 3 + 1];
      const offset = po[i];
      posAttr.setY(i, baseY + Math.sin(time * freq * 1000 + offset) * amp);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        ref={materialRef}
        size={params.particleSize}
        vertexColors
        transparent
        opacity={0.85}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
