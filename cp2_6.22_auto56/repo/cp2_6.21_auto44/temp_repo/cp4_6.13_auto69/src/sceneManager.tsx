import { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from './store';
import type { ClusterGroup, ImageData } from './types';

interface ClusterSphereProps {
  cluster: ClusterGroup;
  isSelected: boolean;
  onClick: () => void;
}

function ClusterSphere({ cluster, isSelected, onClick }: ClusterSphereProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const targetScale = hovered || isSelected ? 1.2 : 1;
  const targetOpacity = hovered || isSelected ? 1 : 0.6;

  useFrame((_, delta) => {
    if (groupRef.current && !hovered && !isSelected) {
      groupRef.current.rotation.y += delta * 0.5;
    }
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.MeshPhongMaterial;
      material.opacity = THREE.MathUtils.lerp(material.opacity, targetOpacity, delta * 5);
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        delta * 5
      );
    }
  });

  const colorHex = useMemo(() => {
    return `rgb(${cluster.color.r}, ${cluster.color.g}, ${cluster.color.b})`;
  }, [cluster.color]);

  const thumbnails = useMemo(() => {
    return cluster.images.map((img, idx) => {
      const angle = (idx / cluster.images.length) * Math.PI * 2;
      const radius = cluster.radius * 0.5;
      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.1;
      const y = (Math.random() - 0.5) * cluster.radius * 0.6;
      const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.1;
      return { x, y, z, img };
    });
  }, [cluster.images, cluster.radius]);

  return (
    <group ref={groupRef} position={[cluster.position.x, cluster.position.y, cluster.position.z]}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[cluster.radius, 32, 32]} />
        <meshPhongMaterial
          color={colorHex}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
          shininess={30}
        />
      </mesh>

      {(hovered || isSelected) &&
        thumbnails.map((tn, idx) => (
          <ThumbnailPlane key={idx} position={[tn.x, tn.y, tn.z]} image={tn.img} />
        ))}
    </group>
  );
}

interface ThumbnailPlaneProps {
  position: [number, number, number];
  image: ImageData;
}

function ThumbnailPlane({ position, image }: ThumbnailPlaneProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useMemo(() => new THREE.TextureLoader().load(image.url), [image.url]);

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[0.3, 0.3]} />
      <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
    </mesh>
  );
}

function FPSMonitor() {
  const { fps, images } = useAppStore();
  const isLow = fps < 30;

  return (
    <Html position={[0, 0, 0]} style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          padding: '12px 20px',
          background: 'rgba(13, 13, 43, 0.8)',
          backdropFilter: 'blur(8px)',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'white',
          fontSize: '14px',
          fontWeight: 300,
          zIndex: 100,
          minWidth: '120px',
        }}
      >
        <div style={{ marginBottom: '6px' }}>
          FPS: <span style={{ color: isLow ? '#ff6b6b' : '#667eea', fontWeight: 500 }}>{Math.round(fps)}</span>
        </div>
        <div>
          图片: <span style={{ fontWeight: 500 }}>{images.length}</span> 张
        </div>
        {isLow && (
          <div
            style={{
              marginTop: '8px',
              padding: '6px 10px',
              background: 'rgba(255, 107, 107, 0.2)',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#ff6b6b',
            }}
          >
            ⚠️ 建议减少图片数量
          </div>
        )}
      </div>
    </Html>
  );
}

function SceneLoader() {
  const { isProcessing } = useAppStore();

  if (!isProcessing) return null;

  return (
    <Html center>
      <div
        style={{
          width: '48px',
          height: '48px',
          border: '3px solid rgba(102, 126, 234, 0.2)',
          borderTopColor: '#667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Html>
  );
}

export default function SceneManager() {
  const { clusters, selectedCluster, setSelectedCluster, setFps } = useAppStore();
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  useEffect(() => {
    const handleResetCamera = () => {
      if (controlsRef.current) {
        controlsRef.current.reset();
      }
    };
    (window as any).resetCamera = handleResetCamera;
    return () => {
      delete (window as any).resetCamera;
    };
  }, []);

  const handleClusterClick = (cluster: ClusterGroup) => {
    setSelectedCluster(selectedCluster?.groupId === cluster.groupId ? null : cluster);
  };

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#fff5e6" />
      <pointLight position={[-10, -5, -10]} intensity={0.3} color="#4a5568" />

      {clusters.map((cluster) => (
        <ClusterSphere
          key={cluster.groupId}
          cluster={cluster}
          isSelected={selectedCluster?.groupId === cluster.groupId}
          onClick={() => handleClusterClick(cluster)}
        />
      ))}

      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        minDistance={5}
        maxDistance={30}
        enableDamping
        dampingFactor={0.05}
      />

      <FPSMonitor />
      <SceneLoader />
    </>
  );
}

export { FPSUpdater };

function FPSUpdater() {
  const { setFps } = useAppStore();

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const update = () => {
      frameCount++;
      const now = performance.now();
      const delta = now - lastTime;

      if (delta >= 1000) {
        const fps = (frameCount * 1000) / delta;
        setFps(fps);
        frameCount = 0;
        lastTime = now;
      }

      animationId = requestAnimationFrame(update);
    };

    animationId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationId);
  }, [setFps]);

  return null;
}
