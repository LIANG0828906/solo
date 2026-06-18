import { useEffect, useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { Customization, FabricType } from '../types';
import { fabricData } from '../data/clothing';
import { hexToThreeColor } from '../utils/colors';

interface DressProps {
  modelUrl: string;
  themeColors: [string, string];
  customization: Customization;
  onRenderComplete?: (success: boolean) => void;
}

function DressGeometry({ modelUrl }: { modelUrl: string }) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const modelIndex = parseInt(modelUrl.split('-')[1] || '1', 10);
    const dressType = modelIndex % 4;

    const height = 1.8;
    const width = 0.6 + dressType * 0.1;
    const flare = 0.3 + dressType * 0.15;

    const segments = 32;
    const radialSegments = 24;

    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const y = (i / segments) * height;
      const t = i / segments;

      const bodyWidth = width * (1 - t * 0.3);
      const skirtWidth = width * (1 + t * t * flare * 2);
      const currentWidth =
        t < 0.4 ? bodyWidth : bodyWidth + (skirtWidth - bodyWidth) * ((t - 0.4) / 0.6);

      for (let j = 0; j <= radialSegments; j++) {
        const angle = (j / radialSegments) * Math.PI * 2;
        const x = Math.cos(angle) * currentWidth * 0.5;
        const z = Math.sin(angle) * currentWidth * 0.3;

        positions.push(x, y, z);

        const nx = Math.cos(angle) * 0.8;
        const ny = 0.2;
        const nz = Math.sin(angle) * 0.8;
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
        normals.push(nx / len, ny / len, nz / len);

        uvs.push(j / radialSegments, 1 - t);
      }
    }

    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < radialSegments; j++) {
        const a = i * (radialSegments + 1) + j;
        const b = a + 1;
        const c = a + radialSegments + 1;
        const d = c + 1;

        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    return geo;
  }, [modelUrl]);

  return <primitive object={geometry} attach="geometry" />;
}

function DressPart({
  partIndex,
  color,
  fabric,
  modelUrl,
  partName
}: {
  partIndex: number;
  color: string;
  fabric: FabricType;
  modelUrl: string;
  partName: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const targetColor = useRef(new THREE.Color(...hexToThreeColor(color)));
  const currentColor = useRef(new THREE.Color(...hexToThreeColor(color)));
  const [transitionProgress, setTransitionProgress] = useState(1);

  const fabricConfig = fabricData[fabric];
  const scale = partIndex % 2 === 0 ? 1 : 0.95;
  const yOffset = -0.1 * partIndex;

  useEffect(() => {
    targetColor.current = new THREE.Color(...hexToThreeColor(color));
    currentColor.current.copy(materialRef.current?.color || targetColor.current);
    setTransitionProgress(0);
  }, [color]);

  useFrame((_, delta) => {
    if (transitionProgress < 1 && materialRef.current) {
      const newProgress = Math.min(1, transitionProgress + delta / 0.5);
      setTransitionProgress(newProgress);

      const t = newProgress;
      const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      materialRef.current.color.r =
        currentColor.current.r + (targetColor.current.r - currentColor.current.r) * easeT;
      materialRef.current.color.g =
        currentColor.current.g + (targetColor.current.g - currentColor.current.g) * easeT;
      materialRef.current.color.b =
        currentColor.current.b + (targetColor.current.b - currentColor.current.b) * easeT;
      materialRef.current.needsUpdate = true;
    }
  });

  return (
    <mesh
      ref={meshRef}
      castShadow
      receiveShadow
      name={partName}
      scale={[scale, 1, scale]}
      position={[0, yOffset, 0]}
    >
      <DressGeometry modelUrl={modelUrl} />
      <meshStandardMaterial
        ref={materialRef}
        color={targetColor.current}
        roughness={fabricConfig.roughness}
        metalness={fabricConfig.metalness}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function AutoRotatingGroup({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  const { gl } = useThree();
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const canvas = gl.domElement;

    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => {
      setIsHovering(false);
      setIsDragging(false);
    };
    const handleMouseDown = () => setIsDragging(true);
    const handleMouseUp = () => setIsDragging(false);
    const handleTouchStart = () => {
      setIsHovering(true);
      setIsDragging(true);
    };
    const handleTouchEnd = () => {
      setIsHovering(false);
      setIsDragging(false);
    };

    canvas.addEventListener('mouseenter', handleMouseEnter);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      canvas.removeEventListener('mouseenter', handleMouseEnter);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gl]);

  useFrame((_, delta) => {
    if (groupRef.current && !isHovering && !isDragging) {
      groupRef.current.rotation.y += 0.01 * (delta / 0.016);
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

function Lighting() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[2, 3, 2]}
        intensity={0.8}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-2, 1, -1]} intensity={0.3} />
      <directionalLight position={[0, 2, -2]} intensity={0.4} />
    </>
  );
}

export function ClothingModel({
  modelUrl,
  themeColors,
  customization,
  onRenderComplete
}: DressProps) {
  const partNames = useMemo(
    () => ['bodice', 'skirt', 'top', 'pants', 'jacket', 'dress', 'train', 'veil', 'blazer', 'belt'],
    []
  );

  const availableColors = useMemo(() => {
    const colors: Record<string, string> = {};
    partNames.forEach((name, index) => {
      colors[name] = customization.colors[name] || themeColors[index % 2];
    });
    return colors;
  }, [customization.colors, themeColors, partNames]);

  useEffect(() => {
    const startTime = performance.now();
    const timer = setTimeout(() => {
      const loadTime = performance.now() - startTime;
      onRenderComplete?.(loadTime < 2000);
    }, 100);

    return () => clearTimeout(timer);
  }, [modelUrl, onRenderComplete]);

  return (
    <Canvas
      camera={{ position: [0, 0.5, 2.5], fov: 50 }}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2
      }}
      shadows
      dpr={[1, 2]}
    >
      <Lighting />

      <AutoRotatingGroup>
        {partNames.map((name, index) => (
          <DressPart
            key={name}
            partIndex={index}
            partName={name}
            color={availableColors[name]}
            fabric={customization.fabric}
            modelUrl={modelUrl}
          />
        ))}
      </AutoRotatingGroup>

      <OrbitControls
        enablePan={false}
        minDistance={0.8}
        maxDistance={2.0}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2 + 0.2}
        enableDamping
        dampingFactor={0.05}
      />

      <ContactShadows
        position={[0, -0.01, 0]}
        opacity={0.3}
        scale={10}
        blur={2}
        far={4}
      />

      <Environment preset="city" />
    </Canvas>
  );
}
