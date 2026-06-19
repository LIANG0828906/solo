import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore, GeometryType, MaterialParams } from './store';
import { getTexture, preloadTextures } from './textures';

interface ModelProps {
  geometryType: GeometryType;
  materialParams: MaterialParams;
  animateTransition?: boolean;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpColor(a: string, b: string, t: number): string {
  const aColor = new THREE.Color(a);
  const bColor = new THREE.Color(b);
  const result = new THREE.Color().lerpColors(aColor, bColor, t);
  return `#${result.getHexString()}`;
}

function Model({ geometryType, materialParams, animateTransition = true }: ModelProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const currentParams = useRef({ ...materialParams });
  const targetParams = useRef({ ...materialParams });

  const texture = useMemo(() => {
    const tex = getTexture(materialParams.textureType);
    tex.repeat.set(materialParams.textureScale, materialParams.textureScale);
    return tex;
  }, [materialParams.textureType, materialParams.textureScale]);

  useEffect(() => {
    targetParams.current = { ...materialParams };
  }, [materialParams]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const material = meshRef.current.material as THREE.MeshStandardMaterial;
    const speed = animateTransition ? delta * 5 : delta * 100;
    const t = Math.min(1, speed);

    currentParams.current.color = lerpColor(currentParams.current.color, targetParams.current.color, t);
    currentParams.current.metalness = lerp(currentParams.current.metalness, targetParams.current.metalness, t);
    currentParams.current.roughness = lerp(currentParams.current.roughness, targetParams.current.roughness, t);
    currentParams.current.textureScale = lerp(currentParams.current.textureScale, targetParams.current.textureScale, t);

    material.color.set(currentParams.current.color);
    material.metalness = currentParams.current.metalness;
    material.roughness = currentParams.current.roughness;

    if (material.map) {
      material.map.repeat.set(currentParams.current.textureScale, currentParams.current.textureScale);
    }
  });

  const geometry = useMemo(() => {
    switch (geometryType) {
      case 'box':
        return <boxGeometry args={[1.5, 1.5, 1.5]} />;
      case 'cylinder':
        return <cylinderGeometry args={[1, 1, 2, 64]} />;
      case 'torus':
        return <torusGeometry args={[1, 0.4, 32, 100]} />;
      case 'sphere':
      default:
        return <sphereGeometry args={[1.2, 64, 64]} />;
    }
  }, [geometryType]);

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      {geometry}
      <meshStandardMaterial
        map={texture}
        color={currentParams.current.color}
        metalness={currentParams.current.metalness}
        roughness={currentParams.current.roughness}
      />
    </mesh>
  );
}

function Lighting() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[-5, 5, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight
        position={[5, 3, 3]}
        intensity={0.6}
        color="#a0c4ff"
      />
      <pointLight position={[0, 5, 0]} intensity={0.3} />
    </>
  );
}

interface Scene3DProps {
  glRef?: React.MutableRefObject<THREE.WebGLRenderer | null>;
  overrideMaterial?: MaterialParams;
  overrideGeometry?: GeometryType;
}

function SceneContent({ overrideMaterial, overrideGeometry }: Scene3DProps) {
  const geometryType = useAppStore((state) => state.geometryType);
  const materialParams = useAppStore((state) => state.materialParams);

  const displayGeometry = overrideGeometry || geometryType;
  const displayMaterial = overrideMaterial || materialParams;

  return (
    <>
      <Lighting />
      <Model
        geometryType={displayGeometry}
        materialParams={displayMaterial}
        animateTransition={!overrideMaterial}
      />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={3}
        maxDistance={15}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <shadowMaterial opacity={0.3} />
      </mesh>
    </>
  );
}

function Scene3D({ glRef, overrideMaterial, overrideGeometry }: Scene3DProps) {
  const { gl } = useThree();

  useEffect(() => {
    if (glRef && gl) {
      glRef.current = gl;
    }
  }, [gl, glRef]);

  return <SceneContent overrideMaterial={overrideMaterial} overrideGeometry={overrideGeometry} />;
}

interface SceneCanvasProps {
  glRef?: React.MutableRefObject<THREE.WebGLRenderer | null>;
  overrideMaterial?: MaterialParams;
  overrideGeometry?: GeometryType;
}

export function SceneCanvas({ glRef, overrideMaterial, overrideGeometry }: SceneCanvasProps) {
  useEffect(() => {
    preloadTextures();
  }, []);

  return (
    <Canvas
      shadows
      camera={{ position: [0, 2, 5], fov: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ width: '100%', height: '100%' }}
    >
      <color attach="background" args={['#1a1a2e']} />
      <fog attach="fog" args={['#1a1a2e', 8, 20]} />
      <Scene3D
        glRef={glRef}
        overrideMaterial={overrideMaterial}
        overrideGeometry={overrideGeometry}
      />
    </Canvas>
  );
}

export default SceneCanvas;
