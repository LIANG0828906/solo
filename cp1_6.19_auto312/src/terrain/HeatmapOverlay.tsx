import React, { useMemo, useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  GRID_SIZE,
  TERRAIN_SIZE,
  generateHeightData,
  valueToColor,
} from '../utils/heatmapData';

interface HeatmapOverlayProps {
  elevation: number;
  scale: number;
  heatmapData: Float32Array;
  opacity: number;
}

const HeatmapOverlay: React.FC<HeatmapOverlayProps> = ({ elevation, scale, heatmapData, opacity }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, GRID_SIZE - 1, GRID_SIZE - 1);
    geo.rotateX(-Math.PI / 2);
    const heights = generateHeightData(GRID_SIZE, elevation);
    const positions = geo.attributes.position;
    const values = new Float32Array(positions.count);
    const colors = new Float32Array(positions.count * 3);

    for (let i = 0; i < positions.count; i++) {
      positions.setY(i, heights[i]);
      values[i] = heatmapData[i];
      const c = valueToColor(heatmapData[i]);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geo.setAttribute('heatColor', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('heatValue', new THREE.BufferAttribute(values, 1));
    geo.computeVertexNormals();
    return geo;
  }, [elevation, heatmapData]);

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uOpacity: { value: opacity },
      },
      vertexShader: `
        attribute vec3 heatColor;
        attribute float heatValue;
        varying vec3 vColor;
        varying float vValue;
        void main() {
          vColor = heatColor;
          vValue = heatValue;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position + vec3(0.0, 0.08, 0.0), 1.0);
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        varying vec3 vColor;
        varying float vValue;
        void main() {
          gl_FragColor = vec4(vColor, uOpacity * smoothstep(0.0, 0.15, vValue));
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
  }, []);

  useEffect(() => {
    if (shaderMaterial) {
      shaderMaterial.uniforms.uOpacity.value = opacity;
    }
  }, [opacity, shaderMaterial]);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(scale);
    }
  }, [scale]);

  return (
    <mesh ref={meshRef} geometry={geometry} material={shaderMaterial} />
  );
};

export default HeatmapOverlay;
