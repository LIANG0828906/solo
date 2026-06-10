import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useDreamStore } from '@/store/useDreamStore';
import { DreamNode } from './DreamNode';
import { DreamConnection } from './DreamConnection';
import { RippleEffect } from './RippleEffect';

function SceneContent() {
  const {
    nodes,
    connections,
    ripples,
    addNode,
    selectedNodeId,
    setControlsRef,
    setCameraRef,
  } = useDreamStore();

  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const planeRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    setCameraRef(camera);
  }, [camera, setCameraRef]);

  useEffect(() => {
    if (controlsRef.current) {
      setControlsRef(controlsRef.current);
    }
  }, [setControlsRef]);

  const handleCanvasClick = (e: ThreeEvent<MouseEvent>) => {
    if (selectedNodeId) return;
    e.stopPropagation();

    const { x, y } = e.pointer;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera({ x, y }, camera);

    const distance = 10 + Math.random() * 5;
    const direction = raycaster.ray.direction.clone().normalize();
    const point = raycaster.ray.origin.clone().add(direction.multiplyScalar(distance));

    addNode([point.x, point.y, point.z]);
  };

  const starPositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    for (let i = 0; i < 200; i++) {
      const radius = 30 + Math.random() * 20;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      positions.push([
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi),
      ]);
    }
    return positions;
  }, []);

  const getNodePosition = (nodeId: string): [number, number, number] => {
    const node = nodes.find((n) => n.id === nodeId);
    return node ? (node.position as [number, number, number]) : [0, 0, 0];
  };

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#9b59b6" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff6b6b" />
      <pointLight position={[0, 10, -10]} intensity={0.3} color="#06b6d4" />

      <Stars
        radius={50}
        depth={50}
        count={3000}
        factor={4}
        saturation={0.5}
        fade
        speed={0.5}
      />

      {starPositions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial
            color={i % 3 === 0 ? '#9b59b6' : i % 3 === 1 ? '#ff6b6b' : '#06b6d4'}
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}

      <mesh
        ref={planeRef}
        onClick={handleCanvasClick}
        visible={false}
      >
        <sphereGeometry args={[100, 32, 32]} />
        <meshBasicMaterial transparent opacity={0} side={THREE.BackSide} />
      </mesh>

      {connections.map((connection) => (
        <DreamConnection
          key={connection.id}
          connection={connection}
          fromPosition={getNodePosition(connection.from)}
          toPosition={getNodePosition(connection.to)}
        />
      ))}

      {nodes.map((node) => (
        <DreamNode key={node.id} node={node} />
      ))}

      {ripples.map((ripple) => (
        <RippleEffect key={ripple.id} ripple={ripple} />
      ))}

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={50}
        enablePan={true}
        panSpeed={0.5}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
      />

      <EffectComposer>
        <Bloom
          intensity={1.5}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <Vignette
          offset={0.5}
          darkness={0.5}
        />
      </EffectComposer>
    </>
  );
}

export function DreamScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 15], fov: 60 }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 2]}
      style={{ background: '#0a0a1a' }}
    >
      <color attach="background" args={['#0a0a1a']} />
      <fog attach="fog" args={['#0a0a1a', 20, 60]} />
      <SceneContent />
    </Canvas>
  );
}
