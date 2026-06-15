import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const vertexShader = `
  uniform float uTime;
  uniform float uAmplitude;
  varying vec2 vUv;
  varying float vElevation;
  void main() {
    vUv = uv;
    vec3 pos = position;
    float wave1 = sin(pos.x * 0.8 + uTime * 1.2) * uAmplitude;
    float wave2 = sin(pos.z * 0.6 + uTime * 0.8) * uAmplitude * 0.6;
    float wave3 = sin((pos.x + pos.z) * 0.5 + uTime * 1.5) * uAmplitude * 0.3;
    pos.y += wave1 + wave2 + wave3;
    vElevation = pos.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  varying vec2 vUv;
  varying float vElevation;
  void main() {
    float depth = smoothstep(-0.5, 0.5, vElevation);
    vec3 shallowColor = vec3(0.0, 0.6, 0.8);
    vec3 deepColor = vec3(0.02, 0.08, 0.16);
    vec3 color = mix(deepColor, shallowColor, depth);
    float foam = smoothstep(0.3, 0.5, vElevation) * 0.4;
    color += vec3(foam);
    float alpha = 0.35 + depth * 0.15;
    gl_FragColor = vec4(color, alpha);
  }
`;

export default function OceanWater() {
  const meshRef = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmplitude: { value: 0.6 },
    }),
    []
  );

  useFrame((_, delta) => {
    if (meshRef.current) {
      uniforms.uTime.value += delta;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[80, 80, 128, 128]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
