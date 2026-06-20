import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleFieldProps {
  count?: number;
}

const ParticleField: React.FC<ParticleFieldProps> = ({ count = 1200 }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const uniformsRef = useRef<{ uTime: { value: number }; uPixelRatio: { value: number } }>({
    uTime: { value: 0 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
  });

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const offsets = new Float32Array(count);
    const sizes = new Float32Array(count);

    const palette = [
      new THREE.Color('#00d4ff'),
      new THREE.Color('#8844ff'),
      new THREE.Color('#ff00ff'),
      new THREE.Color('#d4af37'),
      new THREE.Color('#ffffff'),
    ];

    for (let i = 0; i < count; i++) {
      const r = 10 + Math.random() * 30;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi) * 0.6;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      speeds[i] = 0.2 + Math.random() * 0.8;
      offsets[i] = Math.random() * Math.PI * 2;
      sizes[i] = 0.5 + Math.random() * 1.5;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    geo.setAttribute('aOffset', new THREE.BufferAttribute(offsets, 1));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

    return geo;
  }, [count]);

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: uniformsRef.current,
      vertexShader: `
        attribute float aSpeed;
        attribute float aOffset;
        attribute float aSize;
        attribute vec3 color;
        
        varying vec3 vColor;
        varying float vAlpha;
        
        uniform float uTime;
        uniform float uPixelRatio;
        
        void main() {
          vColor = color;
          
          vec3 pos = position;
          float time = uTime * aSpeed + aOffset;
          
          pos.y += sin(time) * 0.3;
          pos.x += cos(time * 0.7) * 0.2;
          pos.z += sin(time * 0.5) * 0.2;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          
          float size = aSize * (30.0 / -mvPosition.z);
          gl_PointSize = size * uPixelRatio;
          
          vAlpha = 0.5 + sin(time * 2.0) * 0.3;
          
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          vec2 center = gl_PointCoord - 0.5;
          float dist = length(center);
          
          if (dist > 0.5) {
            discard;
          }
          
          float alpha = (1.0 - dist * 2.0) * vAlpha;
          alpha = smoothstep(0.0, 1.0, alpha);
          
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
  }, []);

  useFrame((state) => {
    uniformsRef.current.uTime.value = state.clock.elapsedTime;

    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02;
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.015) * 0.08;
    }
  });

  return <points ref={pointsRef} geometry={geometry} material={shaderMaterial} />;
};

export default ParticleField;
