import { useRef, useMemo, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { ParticleParams, ParticleInfo, SceneRef } from './types';

interface SceneContentProps {
  params: ParticleParams;
  onParticleClick: (info: ParticleInfo | null) => void;
  selectedIndex: number | null;
}

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 0.39, g: 0.4, b: 0.95 };
};

const generateSphericalPositions = (count: number, radius: number): Float32Array => {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = radius * (0.8 + Math.random() * 0.4);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  return positions;
};

const GalaxyParticles = forwardRef<THREE.Points, SceneContentProps>(function GalaxyParticles(
  { params, onParticleClick, selectedIndex },
  ref
) {
  const groupRef = useRef<THREE.Group>(null);
  const positionsRef = useRef<Float32Array>(generateSphericalPositions(params.count, params.spreadRadius));
  const targetPositionsRef = useRef<Float32Array>(positionsRef.current.slice());
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const animationProgress = useRef(1);
  const colorRef = useRef(hexToRgb(params.color));
  const targetColorRef = useRef(colorRef.current);
  const sizesRef = useRef<Float32Array>(new Float32Array(params.count).fill(params.size));

  const { camera } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  const { positions, colors, sizes } = useMemo(() => {
    const pos = new Float32Array(params.count * 3);
    const col = new Float32Array(params.count * 3);
    const siz = new Float32Array(params.count);
    const rgb = hexToRgb(params.color);
    
    for (let i = 0; i < params.count; i++) {
      const idx = i * 3;
      pos[idx] = positionsRef.current[idx] || 0;
      pos[idx + 1] = positionsRef.current[idx + 1] || 0;
      pos[idx + 2] = positionsRef.current[idx + 2] || 0;
      
      const distance = Math.sqrt(pos[idx] ** 2 + pos[idx + 1] ** 2 + pos[idx + 2] ** 2);
      const alpha = 1 - distance / (params.spreadRadius * 2);
      col[idx] = rgb.r;
      col[idx + 1] = rgb.g;
      col[idx + 2] = rgb.b;
      siz[i] = params.size;
    }
    return { positions: pos, colors: col, sizes: siz };
  }, [params.count]);

  useEffect(() => {
    const newPositions = generateSphericalPositions(params.count, params.spreadRadius);
    targetPositionsRef.current = newPositions;
    animationProgress.current = 0;
    
    if (geometryRef.current) {
      const posAttr = geometryRef.current.attributes.position as THREE.BufferAttribute;
      const count = Math.min(params.count, posAttr.count);
      for (let i = 0; i < count; i++) {
        const idx = i * 3;
        positionsRef.current[idx] = posAttr.array[idx];
        positionsRef.current[idx + 1] = posAttr.array[idx + 1];
        positionsRef.current[idx + 2] = posAttr.array[idx + 2];
      }
    }
  }, [params.spreadRadius, params.count]);

  useEffect(() => {
    targetColorRef.current = hexToRgb(params.color);
  }, [params.color]);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += params.rotationSpeed * delta * 0.5;
    }

    if (animationProgress.current < 1) {
      animationProgress.current = Math.min(1, animationProgress.current + delta * 2);
      const ease = 1 - Math.pow(1 - animationProgress.current, 3);
      
      if (geometryRef.current) {
        const posAttr = geometryRef.current.attributes.position as THREE.BufferAttribute;
        const count = Math.min(params.count, posAttr.count);
        for (let i = 0; i < count; i++) {
          const idx = i * 3;
          (posAttr.array as Float32Array)[idx] = 
            positionsRef.current[idx] + (targetPositionsRef.current[idx] - positionsRef.current[idx]) * ease;
          (posAttr.array as Float32Array)[idx + 1] = 
            positionsRef.current[idx + 1] + (targetPositionsRef.current[idx + 1] - positionsRef.current[idx + 1]) * ease;
          (posAttr.array as Float32Array)[idx + 2] = 
            positionsRef.current[idx + 2] + (targetPositionsRef.current[idx + 2] - positionsRef.current[idx + 2]) * ease;
        }
        posAttr.needsUpdate = true;
      }
    }

    if (geometryRef.current) {
      const colorAttr = geometryRef.current.attributes.color as THREE.BufferAttribute;
      const sizeAttr = geometryRef.current.attributes.size as THREE.BufferAttribute;
      const count = Math.min(params.count, colorAttr.count);
      
      for (let i = 0; i < count; i++) {
        const idx = i * 3;
        colorRef.current.r += (targetColorRef.current.r - colorRef.current.r) * delta * 3;
        colorRef.current.g += (targetColorRef.current.g - colorRef.current.g) * delta * 3;
        colorRef.current.b += (targetColorRef.current.b - colorRef.current.b) * delta * 3;
        
        const posX = (geometryRef.current.attributes.position.array as Float32Array)[idx];
        const posY = (geometryRef.current.attributes.position.array as Float32Array)[idx + 1];
        const posZ = (geometryRef.current.attributes.position.array as Float32Array)[idx + 2];
        const distance = Math.sqrt(posX ** 2 + posY ** 2 + posZ ** 2);
        const alpha = 0.3 + (1 - distance / (params.spreadRadius * 2)) * 0.7;
        
        (colorAttr.array as Float32Array)[idx] = colorRef.current.r * alpha;
        (colorAttr.array as Float32Array)[idx + 1] = colorRef.current.g * alpha;
        (colorAttr.array as Float32Array)[idx + 2] = colorRef.current.b * alpha;
        
        const isSelected = selectedIndex === i;
        (sizeAttr.array as Float32Array)[i] = isSelected ? params.size * 2 : params.size;
      }
      colorAttr.needsUpdate = true;
      sizeAttr.needsUpdate = true;
    }
  });

  const handleClick = (event: { ray: THREE.Ray }) => {
    if (!geometryRef.current) return;
    
    raycaster.current.setFromCamera(mouse.current, camera);
    const intersects = raycaster.current.intersectObject({ geometry: geometryRef.current } as THREE.Mesh);
    
    if (intersects.length > 0) {
      const index = intersects[0].index;
      if (index !== undefined) {
        const posArray = geometryRef.current.attributes.position.array as Float32Array;
        const idx = index * 3;
        const colorArray = geometryRef.current.attributes.color.array as Float32Array;
        const colIdx = index * 3;
        
        const hexColor = '#' + [
          Math.round(colorArray[colIdx] * 255).toString(16).padStart(2, '0'),
          Math.round(colorArray[colIdx + 1] * 255).toString(16).padStart(2, '0'),
          Math.round(colorArray[colIdx + 2] * 255).toString(16).padStart(2, '0'),
        ].join('');
        
        onParticleClick({
          index,
          position: {
            x: Number(posArray[idx].toFixed(2)),
            y: Number(posArray[idx + 1].toFixed(2)),
            z: Number(posArray[idx + 2].toFixed(2)),
          },
          color: hexColor.toUpperCase(),
        });
        return;
      }
    }
    onParticleClick(null);
  };

  return (
    <group ref={groupRef} onClick={handleClick}>
      <points ref={ref}>
        <bufferGeometry ref={geometryRef}>
          <bufferAttribute
            attach="attributes-position"
            count={params.count}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={params.count}
            array={colors}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={params.count}
            array={sizes}
            itemSize={1}
          />
        </bufferGeometry>
        <pointsMaterial
          size={params.size}
          vertexColors
          transparent
          opacity={0.9}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
});

interface SceneProps {
  params: ParticleParams;
  onParticleClick: (info: ParticleInfo | null) => void;
  selectedIndex: number | null;
}

export const Scene = forwardRef<SceneRef, SceneProps>(function Scene(
  { params, onParticleClick, selectedIndex },
  ref
) {
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);

  useImperativeHandle(ref, () => ({
    getScene: () => sceneRef.current,
    getCamera: () => cameraRef.current,
  }));

  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 60, near: 0.1, far: 1000 }}
      gl={{ antialias: true, alpha: false }}
      onCreated={({ scene, camera }) => {
        sceneRef.current = scene;
        cameraRef.current = camera;
        scene.background = new THREE.Color(0x0a0a1a);
      }}
      style={{ width: '100%', height: '100%' }}
    >
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />
      <GalaxyParticles
        params={params}
        onParticleClick={onParticleClick}
        selectedIndex={selectedIndex}
      />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={0.5}
        maxDistance={10}
        enablePan={false}
      />
      <EffectComposer>
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} intensity={1.5} />
      </EffectComposer>
    </Canvas>
  );
});
