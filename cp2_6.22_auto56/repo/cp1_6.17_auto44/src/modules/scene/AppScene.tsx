import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useStore, SceneNode, SceneEdge } from '@/store/useStore';
import NodeInfoPanel from './NodeInfoPanel';
import './AppScene.css';

interface SceneContentProps {
  nodes: SceneNode[];
  edges: SceneEdge[];
  nodeSpacing: number;
  trajectoryOpacity: number;
  rotationSpeed: number;
  cameraView: 'top' | 'free';
}

const NodeCube: React.FC<{
  node: SceneNode;
  isSelected: boolean;
  onClick: () => void;
}> = ({ node, isSelected, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.5 + node.position[1]) * 0.05;
      meshRef.current.scale.setScalar(pulse);
    }
    if (glowRef.current) {
      const glowPulse = 1.1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      glowRef.current.scale.setScalar(glowPulse);
    }
  });

  return (
    <group position={node.position}>
      <mesh
        ref={glowRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
        }}
      >
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshBasicMaterial color="#533483" transparent opacity={0.3} />
      </mesh>

      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshPhysicalMaterial
          color="#0F3460"
          transparent
          opacity={0.85}
          roughness={0.2}
          metalness={0.8}
          emissive="#533483"
          emissiveIntensity={isSelected ? 1.5 : 0.5}
        />
      </mesh>

      {isSelected && (
        <mesh>
          <boxGeometry args={[0.45, 0.45, 0.45]} />
          <meshBasicMaterial color="#E94560" transparent opacity={0.2} />
        </mesh>
      )}

      <Html
        position={[0, 0.5, 0]}
        center
        distanceFactor={10}
        style={{ pointerEvents: 'none' }}
      >
        <div className="node-label">
          {node.title.length > 12 ? node.title.slice(0, 12) + '...' : node.title}
        </div>
      </Html>
    </group>
  );
};

const TrajectoryLine: React.FC<{
  edge: SceneEdge;
  fromPos: [number, number, number];
  toPos: [number, number, number];
  opacity: number;
  totalEdges: number;
}> = ({ edge, fromPos, toPos, opacity, totalEdges }) => {
  const lineRef = useRef<THREE.Line>(null);
  const particleRef = useRef<THREE.Mesh>(null);
  const particleProgress = useRef(0);

  const lineWidth = useMemo(() => {
    const t = edge.order / Math.max(totalEdges - 1, 1);
    return 1 + t * 3;
  }, [edge.order, totalEdges]);

  const particleSpeed = useMemo(() => {
    const baseSpeed = 0.005 + (1 / Math.max(edge.duration, 1)) * 0.05;
    return baseSpeed;
  }, [edge.duration]);

  const points = useMemo(() => {
    const start = new THREE.Vector3(...fromPos);
    const end = new THREE.Vector3(...toPos);
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    mid.y += 0.8;
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    return curve.getPoints(50);
  }, [fromPos, toPos]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, [points]);

  const colors = useMemo(() => {
    const colorArray = new Float32Array(points.length * 3);
    const colorStart = new THREE.Color('#E94560');
    const colorEnd = new THREE.Color('#F5F5F5');
    for (let i = 0; i < points.length; i++) {
      const t = i / (points.length - 1);
      const c = colorStart.clone().lerp(colorEnd, t);
      colorArray[i * 3] = c.r;
      colorArray[i * 3 + 1] = c.g;
      colorArray[i * 3 + 2] = c.b;
    }
    return colorArray;
  }, [points]);

  useEffect(() => {
    if (geometry) {
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    }
  }, [geometry, colors]);

  useFrame(() => {
    if (particleRef.current) {
      particleProgress.current += particleSpeed;
      if (particleProgress.current > 1) {
        particleProgress.current = 0;
      }
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(...fromPos),
        new THREE.Vector3(
          (fromPos[0] + toPos[0]) / 2,
          (fromPos[1] + toPos[1]) / 2 + 0.8,
          (fromPos[2] + toPos[2]) / 2
        ),
        new THREE.Vector3(...toPos)
      );
      const pos = curve.getPoint(particleProgress.current);
      particleRef.current.position.copy(pos);
    }
  });

  return (
    <group>
      <line ref={lineRef} geometry={geometry}>
        <lineBasicMaterial
          vertexColors
          transparent
          transparent
          opacity={opacity / 100}
          linewidth={lineWidth}
        />
      </line>
      <mesh ref={particleRef}>
        <sphereGeometry args={[0.06, 8, 8} />
        <meshBasicMaterial color="#E94560" />
      </mesh>
    </group>
  );
};

const SceneContent: React.FC<SceneContentProps> = ({
  nodes,
  edges,
  nodeSpacing,
  trajectoryOpacity,
  rotationSpeed,
  cameraView,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const selectedNodeId = useStore((s) => s.selectedNodeId);
  const setSelectedNode = useStore((s) => s.setSelectedNode);
  const { camera } = useThree();

  const scaledNodes = useMemo(() => {
    const scale = nodeSpacing / 100;
    return nodes.map((n) => ({
      ...n,
      position: [
        n.position[0] * scale,
        n.position[1] * scale,
        n.position[2] * scale,
      ] as [number, number, number],
    }));
  }, [nodes, nodeSpacing]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, SceneNode>();
    scaledNodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [scaledNodes]);

  useEffect(() => {
    if (cameraView === 'top') {
      camera.position.set(0, 15, 0.01);
      camera.lookAt(0, 0, 0);
    } else {
      camera.position.set(0, 5, 8);
      camera.lookAt(0, 0, 0);
    }
  }, [cameraView, camera]);

  useFrame((state, delta) => {
    if (groupRef.current && rotationSpeed > 0) {
      const speed = (rotationSpeed / 100) * 0.3;
      groupRef.current.rotation.y += delta * speed;
    }
  });

  const handleSceneClick = () => {
    setSelectedNode(null);
  };

  const selectedNode = selectedNodeId ? nodeMap.get(selectedNodeId) : null;

  return (
    <group ref={groupRef} onClick={handleSceneClick}>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#533483" />
      <pointLight position={[-10, -5, -10]} intensity={0.3} color="#E94560" />
      <pointLight position={[0, 5, 0]} intensity={0.4} color="#0F3460" />

      <gridHelper args={[20, 20, '#16213E', '#0F3460']} position={[0, -2, 0]} />

      {scaledNodes.map((node) => (
        <NodeCube
          key={node.id}
        node={node}
        isSelected={node.id === selectedNodeId}
        onClick={() => setSelectedNode(node.id)}
      />
      ))}

      {edges.map((edge) => {
        const fromNode = nodeMap.get(edge.from);
        const toNode = nodeMap.get(edge.to);
        if (!fromNode || !toNode) return null;
        return (
          <TrajectoryLine
            key={edge.id}
            edge={edge}
            fromPos={fromNode.position}
            toPos={toNode.position}
            opacity={trajectoryOpacity}
            totalEdges={edges.length}
          />
        );
      })}

      {selectedNode && (
        <NodeInfoPanel node={selectedNode} records={useStore.getState().records} />
      )}
    </group>
  );
};

const AppScene: React.FC = () => {
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  const nodeSpacing = useStore((s) => s.nodeSpacing);
  const trajectoryOpacity = useStore((s) => s.trajectoryOpacity);
  const rotationSpeed = useStore((s) => s.rotationSpeed);
  const cameraView = useStore((s) => s.cameraView);

  return (
    <div className="scene-container">
      <Canvas
        camera={{ position: [0, 5, 8], fov: 60 }}
        style={{ background: 'linear-gradient(180deg, #0F0F23 0%, #050510 100%)' }}
        gl={{ antialias: true }}
        dpr={[1, 2]}
      >
        <fog attach="fog" args={['#0F0F23', 10, 50]} />
        <SceneContent
          nodes={nodes}
          edges={edges}
          nodeSpacing={nodeSpacing}
          trajectoryOpacity={trajectoryOpacity}
          rotationSpeed={rotationSpeed}
          cameraView={cameraView}
        />
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={3}
          maxDistance={30}
          enabled={cameraView === 'free'}
        />
      </Canvas>
    </div>
  );
};

export default AppScene;
