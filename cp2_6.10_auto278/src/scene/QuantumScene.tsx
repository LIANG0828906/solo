import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import QuantumNode from './QuantumNode';
import type { QuantumNodeData, Connection, LogEntry } from '../types';
import { CYBER_COLORS } from '../types';

interface QuantumSceneProps {
  entanglementStrength: number;
  onLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  shouldAddNode: boolean;
  onNodeAdded: () => void;
  onConnectionAdded: () => void;
  resetCamera: boolean;
  onCameraReset: () => void;
}

function ConnectionLine({
  from,
  to,
  strength,
}: {
  from: [number, number, number];
  to: [number, number, number];
  strength: number;
}) {
  const lineRef = useRef<THREE.Line>(null);
  const flowRef = useRef<THREE.Points>(null);

  const { geometry, flowPositions } = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const segments = 60;
    const start = new THREE.Vector3(...from);
    const end = new THREE.Vector3(...to);
    const normal = new THREE.Vector3().subVectors(end, start).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const perpendicular = new THREE.Vector3().crossVectors(normal, up).normalize();
    if (perpendicular.length() === 0) perpendicular.set(1, 0, 0);

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const point = new THREE.Vector3().lerpVectors(start, end, t);
      const waveOffset = Math.sin(t * Math.PI * 2 + Date.now() * 0.001) * strength * 0.3;
      point.addScaledVector(perpendicular, waveOffset);
      const heightOffset = Math.sin(t * Math.PI) * strength * 0.2;
      point.y += heightOffset;
      points.push(point);
    }

    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const flowPos = new Float32Array(20 * 3);
    return { geometry: geo, flowPositions: flowPos };
  }, [from, to, strength]);

  useFrame(() => {
    if (lineRef.current) {
      const positions = lineRef.current.geometry.attributes.position.array as Float32Array;
      const start = new THREE.Vector3(...from);
      const end = new THREE.Vector3(...to);
      const normal = new THREE.Vector3().subVectors(end, start).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const perpendicular = new THREE.Vector3().crossVectors(normal, up).normalize();
      if (perpendicular.length() === 0) perpendicular.set(1, 0, 0);

      for (let i = 0; i <= 60; i++) {
        const t = i / 60;
        const ix = i * 3;
        positions[ix] = THREE.MathUtils.lerp(from[0], to[0], t);
        positions[ix + 1] = THREE.MathUtils.lerp(from[1], to[1], t);
        positions[ix + 2] = THREE.MathUtils.lerp(from[2], to[2], t);

        const time = Date.now() * 0.003;
        const waveOffset = Math.sin(t * Math.PI * 4 + time) * strength * 0.15;
        positions[ix] += perpendicular.x * waveOffset;
        positions[ix + 1] += Math.sin(t * Math.PI * 2 + time) * strength * 0.1;
        positions[ix + 2] += perpendicular.z * waveOffset;
      }
      lineRef.current.geometry.attributes.position.needsUpdate = true;
    }

    if (flowRef.current) {
      const positions = flowRef.current.geometry.attributes.position.array as Float32Array;
      const time = Date.now() * 0.002;
      for (let i = 0; i < 20; i++) {
        const t = ((i / 20 + time * 0.1) % 1);
        const ix = i * 3;
        positions[ix] = THREE.MathUtils.lerp(from[0], to[0], t);
        positions[ix + 1] = THREE.MathUtils.lerp(from[1], to[1], t);
        positions[ix + 2] = THREE.MathUtils.lerp(from[2], to[2], t);
      }
      flowRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  const flowGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setAttribute(
      'position',
      new THREE.BufferAttribute(flowPositions, 3)
    );
  }, [flowPositions]);

  const lineMaterial = useMemo(() => new THREE.LineBasicMaterial({
    color: CYBER_COLORS.neonCyan,
    transparent: true,
    opacity: 0.6,
    linewidth: 2,
  }), []);

  const pointsMaterial = useMemo(() => new THREE.PointsMaterial({
    color: CYBER_COLORS.neonPurple,
    size: 0.08,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  }), []);

  return (
    <group>
      <primitive object={new THREE.Line(geometry, lineMaterial)} ref={lineRef as any} />
      <primitive object={new THREE.Points(flowGeometry, pointsMaterial)} ref={flowRef as any} />
    </group>
  );
}

function CameraResetter({ resetCamera, onReset }: { resetCamera: boolean; onReset: () => void }) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (resetCamera && controlsRef.current) {
      controlsRef.current.reset();
      camera.position.set(0, 2, 8);
      onReset();
    }
  }, [resetCamera, camera, onReset]);

  return <OrbitControls ref={controlsRef} makeDefault enableDamping dampingFactor={0.05} />;
}

function SceneContent({
  entanglementStrength,
  onLog,
  shouldAddNode,
  onNodeAdded,
  onConnectionAdded,
  resetCamera,
  onCameraReset,
}: QuantumSceneProps) {
  const [nodes, setNodes] = useState<QuantumNodeData[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [collapsingNodes, setCollapsingNodes] = useState<Set<string>>(new Set());
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<[number, number, number]>([0, 0, 0]);

  const { camera, raycaster } = useThree();
  const planeRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));

  const generateId = () => `QN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4)}`;

  const getRandomColor = () => {
    const colors = [CYBER_COLORS.neonPurple, CYBER_COLORS.neonCyan, '#ff0080', '#00ff88', '#ffaa00'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const addNode = useCallback((position?: [number, number, number]) => {
    const newNode: QuantumNodeData = {
      id: generateId(),
      position: position || [
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4,
      ],
      connections: [],
      energy: Math.random() * 50 + 50,
      spinSpeed: (Math.random() - 0.5) * 2,
      color: getRandomColor(),
    };
    setNodes(prev => [...prev, newNode]);
    onLog({
      type: 'create',
      message: `节点 ${newNode.id} 已创建`,
      nodeId: newNode.id,
      connectionCount: 0,
      energy: Math.round(newNode.energy),
    });
    onNodeAdded();
  }, [onLog, onNodeAdded]);

  useEffect(() => {
    if (shouldAddNode) {
      addNode();
    }
  }, [shouldAddNode, addNode]);

  const playTone = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      const frequencies = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
      oscillator.frequency.value = frequencies[Math.floor(Math.random() * frequencies.length)];
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    } catch (e) {
      console.log('Audio not supported');
    }
  }, []);

  const handleNodeClick = useCallback((nodeId: string) => {
    setCollapsingNodes(prev => new Set(prev).add(nodeId));
    playTone();

    setNodes(prev => prev.map(node =>
      node.id === nodeId
        ? { ...node, energy: Math.max(0, node.energy - 10) }
        : node
    ));

    const node = nodes.find(n => n.id === nodeId);
    onLog({
      type: 'collapse',
      message: `节点 ${nodeId} 坍缩触发`,
      nodeId,
      connectionCount: node?.connections.length || 0,
      energy: Math.round((node?.energy || 0) - 10),
    });

    setTimeout(() => {
      setCollapsingNodes(prev => {
        const next = new Set(prev);
        next.delete(nodeId);
        return next;
      });
    }, 800);
  }, [nodes, onLog, playTone]);

  const handlePointerDown = useCallback((nodeId: string, e: any) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    if (connectingFrom) {
      if (connectingFrom !== nodeId) {
        const exists = connections.some(
          c => (c.from === connectingFrom && c.to === nodeId) ||
               (c.from === nodeId && c.to === connectingFrom)
        );

        if (!exists) {
          const newConnection: Connection = {
            from: connectingFrom,
            to: nodeId,
            strength: entanglementStrength,
          };
          setConnections(prev => [...prev, newConnection]);
          setNodes(prev => prev.map(n => {
            if (n.id === connectingFrom) {
              return { ...n, connections: [...n.connections, nodeId] };
            }
            if (n.id === nodeId) {
              return { ...n, connections: [...n.connections, connectingFrom] };
            }
            return n;
          }));
          onLog({
            type: 'connect',
            message: `节点 ${connectingFrom} ↔ ${nodeId} 已纠缠`,
            nodeId: connectingFrom,
            connectionCount: (node?.connections.length || 0) + 1,
            energy: Math.round(node?.energy || 0),
          });
          onConnectionAdded();
        }
      }
      setConnectingFrom(null);
      setSelectedNode(null);
    } else {
      setDraggingNode(nodeId);
      setSelectedNode(nodeId);

      const mouse = new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
      raycaster.setFromCamera(mouse, camera);
      const intersection = new THREE.Vector3();
      raycaster.ray.intersectPlane(planeRef.current, intersection);
      if (intersection) {
        setDragOffset([
          node.position[0] - intersection.x,
          node.position[1] - intersection.y,
          node.position[2] - intersection.z,
        ]);
      }
    }
  }, [nodes, connections, connectingFrom, entanglementStrength, onLog, onConnectionAdded, camera, raycaster]);

  const handlePointerUp = useCallback(() => {
    if (draggingNode && selectedNode && !connectingFrom) {
      setConnectingFrom(selectedNode);
    }
    setDraggingNode(null);
  }, [draggingNode, selectedNode, connectingFrom]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!draggingNode) return;

    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );
    raycaster.setFromCamera(mouse, camera);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(planeRef.current, intersection);

    if (intersection) {
      setNodes(prev => prev.map(node =>
        node.id === draggingNode
          ? {
              ...node,
              position: [
                intersection.x + dragOffset[0],
                intersection.y + dragOffset[1],
                intersection.z + dragOffset[2],
              ] as [number, number, number],
            }
          : node
      ));
    }
  }, [draggingNode, dragOffset, camera, raycaster]);

  const handleCanvasClick = useCallback(() => {
    setSelectedNode(null);
    setConnectingFrom(null);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handlePointerUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handlePointerUp);
    };
  }, [handleMouseMove, handlePointerUp]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, QuantumNodeData>();
    nodes.forEach(node => map.set(node.id, node));
    return map;
  }, [nodes]);

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} color={CYBER_COLORS.neonPurple} />
      <pointLight position={[-10, -10, -10]} intensity={0.8} color={CYBER_COLORS.neonCyan} />
      <pointLight position={[0, 5, 0]} intensity={0.5} color="#ffffff" />

      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial
          color={CYBER_COLORS.darkBg}
          transparent
          opacity={0.3}
          wireframe
        />
      </mesh>

      {connections.map((conn, idx) => {
        const fromNode = nodeMap.get(conn.from);
        const toNode = nodeMap.get(conn.to);
        if (!fromNode || !toNode) return null;
        return (
          <ConnectionLine
            key={`${conn.from}-${conn.to}-${idx}`}
            from={fromNode.position}
            to={toNode.position}
            strength={entanglementStrength}
          />
        );
      })}

      {nodes.map(node => (
        <QuantumNode
          key={node.id}
          node={node}
          isSelected={selectedNode === node.id || connectingFrom === node.id}
          isCollapsing={collapsingNodes.has(node.id)}
          onPointerDown={(e) => handlePointerDown(node.id, e)}
          onPointerUp={handlePointerUp}
          onPointerOver={() => {}}
          onPointerOut={() => {}}
          onClick={() => handleNodeClick(node.id)}
        />
      ))}

      <mesh
        onClick={handleCanvasClick}
        visible={false}
      >
        <sphereGeometry args={[100, 32, 32]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      <CameraResetter resetCamera={resetCamera} onReset={onCameraReset} />
    </>
  );
}

export default function QuantumScene(props: QuantumSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 2, 8], fov: 60 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
      style={{ background: CYBER_COLORS.darkBg }}
    >
      <SceneContent {...props} />
    </Canvas>
  );
}
