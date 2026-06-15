import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import type { MaterialMode } from '../modules/asset-store/types';

interface ModelProps {
  url: string;
  mode: MaterialMode;
  autoRotate?: boolean;
  onLoad?: () => void;
}

function Model({ url, mode, autoRotate = false, onLoad }: ModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [loaded, setLoaded] = useState(false);

  const { scene } = useGLTF(url);

  useEffect(() => {
    if (scene && !loaded) {
      setLoaded(true);
      onLoad?.();
    }
  }, [scene, loaded, onLoad]);

  useEffect(() => {
    if (!scene) return;

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mesh = child as THREE.Mesh;
        const originalMaterial = mesh.material as THREE.MeshStandardMaterial;

        switch (mode) {
          case 'wireframe':
            mesh.material = new THREE.MeshBasicMaterial({
              color: 0x3b82f6,
              wireframe: true,
              transparent: true,
              opacity: 0.8,
            });
            break;
          case 'transparent':
            mesh.material = new THREE.MeshPhysicalMaterial({
              color: originalMaterial.color || 0xffffff,
              transparent: true,
              opacity: 0.4,
              metalness: 0.1,
              roughness: 0.2,
              transmission: 0.5,
            });
            break;
          case 'standard':
          default:
            if (originalMaterial.type !== 'MeshStandardMaterial') {
              mesh.material = new THREE.MeshStandardMaterial({
                color: 0x888888,
                metalness: 0.3,
                roughness: 0.7,
              });
            }
            break;
        }
      }
    });
  }, [scene, mode]);

  useFrame((state, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  const scale = useMemo(() => {
    if (!scene) return 1;
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    return 2 / maxDim;
  }, [scene]);

  return (
    <group ref={groupRef} scale={scale}>
      <primitive object={scene} />
    </group>
  );
}

interface SceneProps {
  modelUrl: string;
  mode: MaterialMode;
  autoRotate?: boolean;
  showControls?: boolean;
  onLoad?: () => void;
}

function Scene({ modelUrl, mode, autoRotate = false, showControls = true, onLoad }: SceneProps) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
      <pointLight position={[-5, 3, -5]} intensity={0.5} color="#06b6d4" />
      <pointLight position={[5, -3, 5]} intensity={0.3} color="#3b82f6" />

      {modelUrl && (
        <Model url={modelUrl} mode={mode} autoRotate={autoRotate} onLoad={onLoad} />
      )}

      <ContactShadows
        position={[0, -1.5, 0]}
        opacity={0.4}
        scale={10}
        blur={2}
        far={4}
      />

      {showControls && (
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={2}
          maxDistance={20}
          enableDamping
          dampingFactor={0.05}
        />
      )}
    </>
  );
}

interface ModelViewerProps {
  modelUrl: string;
  materialMode?: MaterialMode;
  autoRotate?: boolean;
  showControls?: boolean;
  className?: string;
  onLoad?: () => void;
}

export default function ModelViewer({
  modelUrl,
  materialMode = 'standard',
  autoRotate = false,
  showControls = true,
  className = '',
  onLoad,
}: ModelViewerProps) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#1a1a2e']} />
        <fog attach="fog" args={['#1a1a2e', 8, 25]} />
        <Scene
          modelUrl={modelUrl}
          mode={materialMode}
          autoRotate={autoRotate}
          showControls={showControls}
          onLoad={onLoad}
        />
      </Canvas>
    </div>
  );
}
