import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { HeatmapPoint } from '@/utils/dataProcessor';
import {
  ParticleData,
  createParticleData,
  updateParticleAnimation,
  createParticleTexture,
  getPointFromIndex
} from '@/utils/heatmapRenderer';

interface HeatmapParticlesProps {
  data: HeatmapPoint[];
  onPointClick?: (point: HeatmapPoint) => void;
  animationTime?: number;
}

export default function HeatmapParticles({ data, onPointClick, animationTime }: HeatmapParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const particleTexture = useMemo(() => createParticleTexture(), []);

  const particleData: ParticleData = useMemo(() => {
    return createParticleData(data);
  }, [data]);

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        pointTexture: { value: particleTexture },
        uTime: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        attribute float opacity;
        varying vec3 vColor;
        varying float vOpacity;
        void main() {
          vColor = color;
          vOpacity = opacity;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D pointTexture;
        varying vec3 vColor;
        varying float vOpacity;
        void main() {
          vec4 texColor = texture2D(pointTexture, gl_PointCoord);
          gl_FragColor = vec4(vColor, vOpacity) * texColor;
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true
    });
  }, [particleTexture]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const time = animationTime ?? state.clock.elapsedTime;
    const positions = updateParticleAnimation(particleData, time);
    const geometry = pointsRef.current.geometry as THREE.BufferGeometry;
    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    posAttr.array = positions;
    posAttr.needsUpdate = true;
    shaderMaterial.uniforms.uTime.value = time;
  });

  useEffect(() => {
    if (!pointsRef.current) return;
    const geometry = pointsRef.current.geometry as THREE.BufferGeometry;
    geometry.setAttribute('position', new THREE.BufferAttribute(particleData.positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(particleData.colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(particleData.sizes, 1));
    geometry.setAttribute('opacity', new THREE.BufferAttribute(particleData.opacities, 1));
  }, [particleData]);

  const handleClick = (event: any) => {
    if (!onPointClick || !event.point) return;
    const index = event.index;
    if (index !== undefined) {
      const point = getPointFromIndex(particleData, index);
      if (point) {
        onPointClick(point);
      }
    }
  };

  return (
    <points ref={pointsRef} onClick={handleClick}>
      <bufferGeometry />
      <primitive object={shaderMaterial} attach="material" />
    </points>
  );
}
