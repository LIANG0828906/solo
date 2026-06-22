import { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Line as DreiLine } from '@react-three/drei';
import * as THREE from 'three';
import type { NodeData, Edge, Particle, NodeType, PanelPosition } from '../types';
import {
  computeBezierControlPoints,
  cubicBezierPoint,
  generateSinglePosition,
} from '../utils/layoutEngine';
import { ParticleEngine, getLoadColor, lerpColor, getParticleSpeed } from '../utils/particleEngine';
import { v4 as uuidv4 } from 'uuid';

interface PipelineSceneProps {
  nodes: NodeData[];
  edges: Edge[];
  selectedNodeId: string | null;
  onNodesChange: (nodes: NodeData[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
  onNodeClick: (nodeId: string, screenPos: PanelPosition) => void;
  onBackgroundClick: (screenPos: PanelPosition) => void;
  selectedAll: boolean;
  onResetCamera: () => void;
  resetTrigger: number;
}

const RING_PARTICLE_COUNT = 30;
const RING_RADIUS = 0.6;
const NODE_RADIUS = 0.5;

function getNodeTypeIcon(type: NodeType): string {
  switch (type) {
    case 'source':
      return '⬇';
    case 'processor':
      return '⚙';
    case 'sink':
      return '⬆';
  }
}

interface NodeMeshProps {
  node: NodeData;
  isSelected: boolean;
  onClick: (e: THREE.Event) => void;
  onPointerDown: (e: THREE.Event) => void;
  onPointerUp: (e: THREE.Event) => void;
  targetColor: string;
}

function NodeMesh({ node, isSelected, onClick, onPointerDown, onPointerUp, targetColor }: NodeMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.InstancedMesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const currentColor = useRef(new THREE.Color('#ffffff'));
  const ringColor = useRef(new THREE.Color('#00d2ff'));
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (meshRef.current) {
      const target = new THREE.Color(targetColor);
      currentColor.current.lerp(target, delta * 2);
      (meshRef.current.material as THREE.MeshStandardMaterial).color.copy(currentColor.current);
    }
    if (ringRef.current) {
      const targetRingColor = new THREE.Color(getLoadColor(node.load));
      ringColor.current.lerp(targetRingColor, delta * 2);
      const material = ringRef.current.material as THREE.MeshBasicMaterial;
      material.color.copy(ringColor.current);
      for (let i = 0; i < RING_PARTICLE_COUNT; i++) {
        const angle = (i / RING_PARTICLE_COUNT) * Math.PI * 2 + timeRef.current * getParticleSpeed(node.load) * 0.5;
        const x = Math.cos(angle) * RING_RADIUS;
        const z = Math.sin(angle) * RING_RADIUS;
        const y = Math.sin(angle * 2) * 0.05;
        dummy.position.set(x, y, z);
        dummy.scale.setScalar(0.08);
        dummy.updateMatrix();
        ringRef.current.setMatrixAt(i, dummy.matrix);
      }
      ringRef.current.instanceMatrix.needsUpdate = true;
    }
    if (glowRef.current && isSelected) {
      const pulse = 0.5 + Math.sin(timeRef.current * Math.PI) * 0.2;
      glowRef.current.scale.setScalar(1 + pulse * 0.15);
    }
  });

  return (
    <group position={node.position}>
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <sphereGeometry args={[NODE_RADIUS, 32, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.85}
          roughness={0.3}
          metalness={0.5}
        />
      </mesh>
      <instancedMesh ref={ringRef} args={[undefined, undefined, RING_PARTICLE_COUNT]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="#00d2ff" transparent opacity={0.9} />
      </instancedMesh>
      {isSelected && (
        <mesh ref={glowRef}>
          <sphereGeometry args={[NODE_RADIUS * 1.4, 32, 32]} />
          <meshBasicMaterial color="#ffd700" transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  );
}

interface EdgeLineProps {
  edge: Edge;
  sourcePos: [number, number, number];
  targetPos: [number, number, number];
}

function EdgeLine({ edge, sourcePos, targetPos }: EdgeLineProps) {
  const points = useMemo(() => {
    const { cp1, cp2 } = computeBezierControlPoints(sourcePos, targetPos);
    const pts: [number, number, number][] = [];
    const segments = 50;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const p = cubicBezierPoint(t, sourcePos, cp1, cp2, targetPos);
      pts.push(p);
    }
    return pts;
  }, [sourcePos, targetPos, edge.id]);

  return <DreiLine points={points} color="#6366f1" transparent opacity={0.5} lineWidth={1} />;
}

interface ParticlesRendererProps {
  particles: Particle[];
  edges: Edge[];
  nodes: Map<string, NodeData>;
}

function ParticlesRenderer({ particles, edges, nodes }: ParticlesRendererProps) {
  const instancedRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const edgeInfo = useMemo(() => {
    const map = new Map<string, { source: [number, number, number]; target: [number, number, number]; cp1: [number, number, number]; cp2: [number, number, number]; color: string }>();
    for (const edge of edges) {
      const source = nodes.get(edge.sourceId);
      const target = nodes.get(edge.targetId);
      if (source && target) {
        const { cp1, cp2 } = computeBezierControlPoints(source.position, target.position);
        map.set(edge.id, {
          source: source.position,
          target: target.position,
          cp1,
          cp2,
          color: getLoadColor(source.load),
        });
      }
    }
    return map;
  }, [edges, nodes]);

  useFrame(() => {
    if (!instancedRef.current) return;
    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];
      const info = edgeInfo.get(particle.edgeId);
      if (!info) continue;
      const p = cubicBezierPoint(particle.progress, info.source, info.cp1, info.cp2, info.target);
      dummy.position.set(p[0], p[1], p[2]);
      dummy.scale.setScalar(0.05);
      dummy.updateMatrix();
      instancedRef.current.setMatrixAt(i, dummy.matrix);
      instancedRef.current.setColorAt(i, new THREE.Color(info.color));
    }
    instancedRef.current.instanceMatrix.needsUpdate = true;
    if (instancedRef.current.instanceColor) {
      instancedRef.current.instanceColor.needsUpdate = true;
    }
    instancedRef.current.count = particles.length;
  });

  return (
    <instancedMesh ref={instancedRef} args={[undefined, undefined, 2000]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial transparent opacity={0.9} />
    </instancedMesh>
  );
}

interface DragLineProps {
  start: [number, number, number] | null;
  end: [number, number, number] | null;
}

function DragLine({ start, end }: DragLineProps) {
  if (!start || !end) return null;
  return <DreiLine points={[start, end]} color="#ffd700" transparent opacity={0.8} lineWidth={2} />;
}

interface CameraControllerProps {
  resetTrigger: number;
  onResetDone: () => void;
}

function CameraController({ resetTrigger, onResetDone }: CameraControllerProps) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const initialPos = useRef(new THREE.Vector3(0, 0, 10));

  useEffect(() => {
    if (resetTrigger > 0) {
      camera.position.copy(initialPos.current);
      camera.lookAt(0, 0, 0);
      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
      onResetDone();
    }
  }, [resetTrigger, camera, onResetDone]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      minDistance={3}
      maxDistance={20}
      makeDefault
    />
  );
}

interface SceneContentProps extends PipelineSceneProps {
  particleEngine: ParticleEngine;
  particleCount: number;
  setParticleCount: (n: number) => void;
}

function SceneContent(props: SceneContentProps) {
  const {
    nodes,
    edges,
    selectedNodeId,
    onNodesChange,
    onEdgesChange,
    onNodeClick,
    onBackgroundClick,
    selectedAll,
    resetTrigger,
    particleEngine,
    setParticleCount,
  } = props;
  const { camera, gl, scene } = useThree();
  const [dragging, setDragging] = useState<{ sourceId: string; start: [number, number, number] } | null>(null);
  const [mousePos, setMousePos] = useState<[number, number, number] | null>(null);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const mouseVec = useMemo(() => new THREE.Vector2(), []);
  const nodesMap = useMemo(() => {
    const m = new Map<string, NodeData>();
    nodes.forEach((n) => m.set(n.id, n));
    return m;
  }, [nodes]);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);

  useFrame((state, delta) => {
    const result = particleEngine.update(delta, edges, nodesMap, 0);
    setParticleCount(result.particles.length);
  });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragging) {
        const rect = gl.domElement.getBoundingClientRect();
        mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouseVec, camera);
        const dir = new THREE.Vector3();
        raycaster.ray.direction.multiplyScalar(8);
        const pos: [number, number, number] = [
          raycaster.ray.origin.x + raycaster.ray.direction.x,
          raycaster.ray.origin.y + raycaster.ray.direction.y,
          raycaster.ray.origin.z + raycaster.ray.direction.z,
        ];
        setMousePos(pos);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [dragging, camera, gl, raycaster, mouseVec]);

  const handleNodeClick = useCallback(
    (nodeId: string, e: any) => {
      e.stopPropagation();
      if (dragStartPos.current) {
        const dx = Math.abs(e.clientX - dragStartPos.current.x);
        const dy = Math.abs(e.clientY - dragStartPos.current.y);
        if (dx > 5 || dy > 5) {
          dragStartPos.current = null;
          return;
        }
        dragStartPos.current = null;
      }
      if (dragging && dragging.sourceId !== nodeId) {
        const exists = edges.some((ed) => ed.sourceId === dragging.sourceId && ed.targetId === nodeId);
        if (!exists) {
          const newEdge: Edge = {
            id: uuidv4(),
            sourceId: dragging.sourceId,
            targetId: nodeId,
          };
          onEdgesChange([...edges, newEdge]);
        }
        setDragging(null);
        setMousePos(null);
        return;
      }
      const screenPos: PanelPosition = {
        x: e.clientX ?? window.innerWidth / 2,
        y: e.clientY ?? window.innerHeight / 2,
      };
      onNodeClick(nodeId, screenPos);
    },
    [dragging, edges, onEdgesChange, onNodeClick]
  );

  const handleNodePointerDown = useCallback(
    (nodeId: string, e: any) => {
      e.stopPropagation();
      dragStartPos.current = { x: e.clientX, y: e.clientY };
      const node = nodesMap.get(nodeId);
      if (node) {
        setDragging({ sourceId: nodeId, start: node.position });
      }
    },
    [nodesMap]
  );

  const handleNodePointerUp = useCallback(
    (_nodeId: string, e: any) => {
      e.stopPropagation();
    },
    []
  );

  const handleScenePointerUp = useCallback(() => {
    setDragging(null);
    setMousePos(null);
  }, []);

  const handleSceneClick = useCallback(
    (e: any) => {
      if (dragging) {
        setDragging(null);
        setMousePos(null);
        return;
      }
      if (e.target === gl.domElement || e.target === scene || (e.object && e.object.userData?.isBackground)) {
        const screenPos: PanelPosition = {
          x: e.clientX ?? window.innerWidth / 2,
          y: e.clientY ?? window.innerHeight / 2,
        };
        onBackgroundClick(screenPos);
      }
    },
    [dragging, gl, scene, onBackgroundClick]
  );

  const handleResetDone = useCallback(() => {}, []);

  return (
    <>
      <CameraController resetTrigger={resetTrigger} onResetDone={handleResetDone} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-5, -5, -5]} intensity={0.3} />
      <pointLight position={[0, 5, 0]} intensity={0.5} color="#6366f1" />

      <mesh
        position={[0, 0, -50]}
        onClick={handleSceneClick}
        onPointerUp={handleScenePointerUp}
        userData={{ isBackground: true }}
      >
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {edges.map((edge) => {
        const source = nodesMap.get(edge.sourceId);
        const target = nodesMap.get(edge.targetId);
        if (!source || !target) return null;
        return <EdgeLine key={edge.id} edge={edge} sourcePos={source.position} targetPos={target.position} />;
      })}

      {nodes.map((node) => {
        const isSelected = selectedAll || node.id === selectedNodeId;
        return (
          <NodeMesh
            key={node.id}
            node={node}
            isSelected={isSelected}
            onClick={(e) => handleNodeClick(node.id, e)}
            onPointerDown={(e) => handleNodePointerDown(node.id, e)}
            onPointerUp={(e) => handleNodePointerUp(node.id, e)}
            targetColor={getLoadColor(node.load)}
          />
        );
      })}

      <ParticlesRenderer particles={particleEngine.particles} edges={edges} nodes={nodesMap} />

      <DragLine start={dragging?.start ?? null} end={mousePos} />
    </>
  );
}

export default function PipelineScene(props: PipelineSceneProps) {
  const particleEngine = useMemo(() => new ParticleEngine(), []);
  const [particleCount, setParticleCount] = useState(0);

  useEffect(() => {
    return () => {
      particleEngine.clear();
    };
  }, [particleEngine]);

  return (
    <Canvas
      camera={{ position: [0, 0, 10], fov: 60 }}
      gl={{ antialias: true }}
      style={{
        background: 'linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        width: '100%',
        height: '100%',
      }}
      onPointerMissed={(e: any) => {
        if (e.target?.tagName !== 'CANVAS') return;
        const screenPos: PanelPosition = {
          x: e.clientX,
          y: e.clientY,
        };
        props.onBackgroundClick(screenPos);
      }}
    >
      <SceneContent {...props} particleEngine={particleEngine} particleCount={particleCount} setParticleCount={setParticleCount} />
    </Canvas>
  );
}

export { generateSinglePosition, getLoadColor, lerpColor };
