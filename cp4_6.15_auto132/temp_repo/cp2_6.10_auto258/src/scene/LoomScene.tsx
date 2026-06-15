import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useLoomStore } from '../store/useLoomStore';
import { LightThread } from './LightThread';
import type { LightPoint } from '../types';
import { hexToRgb } from '../utils/colorUtils';

function PointSprite({ point }: { point: LightPoint }) {
  const spriteRef = useRef<THREE.Sprite>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const isSelected = useLoomStore((state) => state.selectedPointId === point.id);

  const { particleGeometry, particleMaterial } = useMemo(() => {
    const particleCount = 8;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const color = hexToRgb(point.color);

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 0.15;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.1;

      colors[i * 3] = color[0];
      colors[i * 3 + 1] = color[1];
      colors[i * 3 + 2] = color[2];
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    return { particleGeometry: geometry, particleMaterial: material };
  }, [point.color]);

  useEffect(() => {
    return () => {
      particleGeometry.dispose();
      particleMaterial.dispose();
    };
  }, [particleGeometry, particleMaterial]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (spriteRef.current) {
      spriteRef.current.scale.setScalar(isSelected ? 1.5 + Math.sin(time * 5) * 0.2 : 1);
    }
    if (pointsRef.current) {
      pointsRef.current.rotation.z = time * 2;
    }
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    const { selectedPointId, selectPoint, connectPoints } = useLoomStore.getState();

    if (selectedPointId && selectedPointId !== point.id) {
      connectPoints(selectedPointId, point.id);
    } else if (selectedPointId === point.id) {
      selectPoint(null);
    } else {
      selectPoint(point.id);
    }
  };

  return (
    <group position={point.position}>
      <sprite ref={spriteRef} onClick={handleClick}>
        <spriteMaterial
          color={point.color}
          transparent
          opacity={isSelected ? 1 : 0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>
      <mesh onClick={handleClick}>
        <sphereGeometry args={[isSelected ? 0.12 : 0.08, 16, 16]} />
        <meshBasicMaterial color={point.color} transparent opacity={isSelected ? 1 : 0.9} />
      </mesh>
      <points ref={pointsRef} geometry={particleGeometry} material={particleMaterial} />
      <sprite position={[0, 0.2, 0]} scale={[0.3, 0.15, 1]}>
        <spriteMaterial color="#ffffff" transparent opacity={0.9} depthWrite={false} />
      </sprite>
    </group>
  );
}

function SceneContent() {
  const { camera, raycaster, mouse } = useThree();
  const points = useLoomStore((state) => state.points);
  const threads = useLoomStore((state) => state.threads);
  const addPoint = useLoomStore((state) => state.addPoint);
  const selectPoint = useLoomStore((state) => state.selectPoint);

  const handleCanvasClick = () => {
    raycaster.setFromCamera(mouse, camera);
    const planeNormal = new THREE.Vector3(0, 0, 1);
    const planePoint = new THREE.Vector3(0, 0, 0);
    const plane = new THREE.Plane(planeNormal, -planePoint.dot(planeNormal));

    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersection);

    if (intersection) {
      const bounds = 8;
      const clampedIntersection: [number, number, number] = [
        Math.max(-bounds, Math.min(bounds, intersection.x)),
        Math.max(-bounds, Math.min(bounds, intersection.y)),
        intersection.z,
      ];
      addPoint(clampedIntersection);
      selectPoint(null);
    }
  };

  const threadComponents = useMemo(() => {
    return threads.map((thread) => {
      const startPoint = points.find((p) => p.id === thread.startPointId);
      const endPoint = points.find((p) => p.id === thread.endPointId);
      if (!startPoint || !endPoint) return null;
      return (
        <LightThread
          key={thread.id}
          thread={thread}
          startPosition={startPoint.position}
          endPosition={endPoint.position}
        />
      );
    });
  }, [threads, points]);

  const pointComponents = useMemo(() => {
    return points.map((point) => (
      <PointSprite key={point.id} point={point} />
    ));
  }, [points]);

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#e94560" />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#16c79a" />

      <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]} receiveShadow onClick={handleCanvasClick}>
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial color="#1a1a2e" transparent opacity={0} />
      </mesh>

      <group onClick={handleCanvasClick}>
        {threadComponents}
        {pointComponents}
      </group>

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={30}
        enablePan={true}
      />
    </>
  );
}

export function LoomScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 15], fov: 60 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#1a1a2e' }}
    >
      <fog attach="fog" args={['#1a1a2e', 15, 35]} />
      <SceneContent />
    </Canvas>
  );
}
