import { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useHiveStore } from '@/store';
import type { GraphNode, Relation } from '@/types';
import { Layers, Grid3X3, Download, Check, Eye } from 'lucide-react';

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function strengthColor(strength: number): string {
  const r = Math.round(lerp(231, 46, strength));
  const g = Math.round(lerp(76, 204, strength));
  const b = Math.round(lerp(60, 113, strength));
  return `rgb(${r},${g},${b})`;
}

interface CurveProps {
  start: GraphNode;
  end: GraphNode;
  strength: number;
  highlighted: boolean;
  onHover: (v: boolean, tags: string[]) => void;
  tags: string[];
}

function RelationCurve({ start, end, strength, highlighted, onHover, tags }: CurveProps) {
  const [hovered, setHovered] = useState(false);
  const [opacity, setOpacity] = useState(0.18 + strength * 0.25);
  const [color, setColor] = useState(strengthColor(strength));

  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    const sp = new THREE.Vector3(start.x, start.y, start.z);
    const ep = new THREE.Vector3(end.x, end.y, end.z);
    const mid = sp.clone().add(ep).multiplyScalar(0.5);
    const dist = sp.distanceTo(ep);
    const normal = new THREE.Vector3().subVectors(ep, sp).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const perp = new THREE.Vector3().crossVectors(normal, up).normalize();
    if (perp.lengthSq() < 0.001) perp.set(1, 0, 0);
    const offset = perp.multiplyScalar(dist * 0.25);
    mid.add(offset);
    mid.y += dist * 0.08;
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const it = 1 - t;
      const p = new THREE.Vector3()
        .addScaledVector(sp, it * it)
        .addScaledVector(mid, 2 * it * t)
        .addScaledVector(ep, t * t);
      pts.push([p.x, p.y, p.z]);
    }
    return pts;
  }, [start, end, strength]);

  useFrame(() => {
    const target = (hovered || highlighted) ? 0.95 : 0.18 + strength * 0.25;
    setOpacity(o => lerp(o, target, 0.12));
  });

  const targetColor = strengthColor(strength);
  const lineWidth = (hovered || highlighted) ? 3 : 1.2 + strength * 1.5;

  return (
    <group>
      <Line
        points={points}
        color={color}
        lineWidth={lineWidth}
        transparent
        opacity={opacity}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); onHover(true, tags); setColor('#FFFFFF'); }}
        onPointerOut={() => { setHovered(false); onHover(false, []); setColor(targetColor); }}
      />
      {hovered && tags.length > 0 && (
        <Html
          position={[
            (start.x + end.x) / 2,
            (start.y + end.y) / 2 + 0.4,
            (start.z + end.z) / 2,
          ]}
          center
          distanceFactor={8}
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              padding: '4px 10px',
              background: 'rgba(13,27,42,0.9)',
              borderRadius: 8,
              color: '#FFF',
              fontSize: 11,
              whiteSpace: 'nowrap',
              border: '1px solid rgba(255,255,255,0.2)',
              fontFamily: '"Noto Sans SC", sans-serif',
            }}
          >
            {tags.map(t => `#${t}`).join(' ')}
            <span style={{ opacity: 0.6, marginLeft: 6 }}>
              {Math.round(strength * 100)}%
            </span>
          </div>
        </Html>
      )}
    </group>
  );
}

interface NodeProps {
  node: GraphNode;
  selected: boolean;
  relatedIds: Set<string>;
  onSelect: (ctrl: boolean) => void;
}

function GlowNode({ node, selected, relatedIds, onSelect }: NodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const pulseRef = useRef(Math.random() * Math.PI * 2);

  useFrame((_, delta) => {
    pulseRef.current += delta * (selected ? 3.5 : 1.2);
    const pulse = Math.sin(pulseRef.current) * 0.5 + 0.5;
    if (meshRef.current) {
      const targetScale = hovered ? 1.25 : 1;
      meshRef.current.scale.setScalar(
        lerp(meshRef.current.scale.x, targetScale * node.radius, 0.15)
      );
    }
    if (haloRef.current) {
      const base = selected ? 1.8 : relatedIds.has(node.id) ? 1.5 : 1.3;
      const pulseScale = base + (selected ? pulse * 0.6 : pulse * 0.2);
      haloRef.current.scale.setScalar(node.radius * pulseScale);
      const mat = haloRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = selected ? 0.25 + pulse * 0.35 : hovered ? 0.25 : 0.08;
    }
  });

  return (
    <group position={[node.x, node.y, node.z]}>
      <mesh
        ref={meshRef}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => { e.stopPropagation(); onSelect(e.shiftKey || e.ctrlKey || e.metaKey); }}
      >
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={hovered || selected || relatedIds.has(node.id) ? 1.1 : 0.7}
          roughness={0.25}
          metalness={0.4}
        />
      </mesh>
      <mesh ref={haloRef}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial
          color={selected ? '#FFFFFF' : node.color}
          transparent
          opacity={0.12}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
      {(hovered || selected) && (
        <Html position={[0, node.radius + 0.5, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div
            style={{
              padding: '5px 12px',
              background: 'rgba(13,27,42,0.92)',
              borderRadius: 20,
              color: '#FFF',
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              border: `1px solid ${node.color}`,
              fontFamily: '"Noto Serif SC", serif',
              boxShadow: `0 0 20px ${node.color}40`,
              maxWidth: 200,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {node.label}
          </div>
        </Html>
      )}
    </group>
  );
}

interface CameraRigProps {
  angle: 45 | 90;
}

function CameraRig({ angle }: CameraRigProps) {
  const { camera } = useThree();
  const targetAngle = useRef(angle);
  const targetPos = useRef(new THREE.Vector3());

  useEffect(() => {
    targetAngle.current = angle;
    if (angle === 45) {
      targetPos.current.set(8, 8, 10);
    } else {
      targetPos.current.set(0, 15, 0.01);
    }
  }, [angle]);

  useFrame(() => {
    camera.position.lerp(targetPos.current, 0.05);
  });

  return null;
}

interface SceneProps {
  graph: { nodes: GraphNode[]; edges: Relation[] };
  selectedIds: string[];
  onToggleNode: (id: string, ctrl: boolean) => void;
  viewAngle: 45 | 90;
}

function Scene({ graph, selectedIds, onToggleNode, viewAngle }: SceneProps) {
  const [hoveredTags, setHoveredTags] = useState<string[]>([]);
  const controlsRef = useRef<any>(null);

  const relatedIds = useMemo(() => {
    const set = new Set<string>();
    if (selectedIds.length === 0) return set;
    graph.edges.forEach(e => {
      const hasA = selectedIds.includes(e.source);
      const hasB = selectedIds.includes(e.target);
      if (hasA && !hasB) set.add(e.target);
      if (!hasA && hasB) set.add(e.source);
    });
    return set;
  }, [graph.edges, selectedIds]);

  const highlightedEdges = useMemo(() => {
    const set = new Set<string>();
    if (selectedIds.length === 0 && hoveredTags.length === 0) return set;
    graph.edges.forEach((e, idx) => {
      const hasSel = selectedIds.includes(e.source) || selectedIds.includes(e.target);
      const hasTag = hoveredTags.length > 0 && e.tags.some(t => hoveredTags.includes(t));
      if (hasSel || hasTag) set.add(String(idx));
    });
    return set;
  }, [graph.edges, selectedIds, hoveredTags]);

  return (
    <>
      <CameraRig angle={viewAngle} />
      <ambientLight intensity={0.35} />
      <pointLight position={[10, 10, 10]} intensity={0.6} color="#FFF" />
      <pointLight position={[-10, -5, -8]} intensity={0.3} color="#4FC3F7" />
      <Stars radius={80} depth={40} count={1500} factor={3} saturation={0} fade speed={0.3} />
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.7}
        minDistance={5}
        maxDistance={35}
        enablePan
      />
      <Suspense fallback={null}>
        {graph.edges.map((edge, idx) => {
          const a = graph.nodes.find(n => n.id === edge.source);
          const b = graph.nodes.find(n => n.id === edge.target);
          if (!a || !b) return null;
          const key = `e-${edge.source}-${edge.target}-${idx}`;
          return (
            <RelationCurve
              key={key}
              start={a}
              end={b}
              strength={edge.strength}
              highlighted={highlightedEdges.has(String(idx))}
              tags={edge.tags}
              onHover={(v, tags) => v && tags.length > 0 ? setHoveredTags(tags) : setHoveredTags([])}
            />
          );
        })}
        {graph.nodes.map(node => (
          <GlowNode
            key={node.id}
            node={node}
            selected={selectedIds.includes(node.id)}
            relatedIds={relatedIds}
            onSelect={(ctrl) => onToggleNode(node.id, ctrl)}
          />
        ))}
      </Suspense>
    </>
  );
}

export function RelationGraph() {
  const {
    graphData,
    selectedNodeIds,
    toggleNodeSelection,
    clearNodeSelection,
    selectedGroup,
    setSelectedGroup,
  } = useHiveStore();

  const [viewAngle, setViewAngle] = useState<45 | 90>(45);

  if (!graphData) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ background: '#0D1B2A' }}>
        <div className="text-center" style={{ color: '#90A4AE' }}>
          <Grid3X3 size={48} className="mx-auto mb-4 opacity-40" />
          <p style={{ fontFamily: '"Noto Serif SC", serif' }}>正在编织灵感关系网...</p>
        </div>
      </div>
    );
  }

  const handleGroup = () => {
    if (selectedNodeIds.length < 2) {
      alert('请选择至少2个节点进行组合（按住 Ctrl 多选）');
      return;
    }
    const title = prompt('为这个灵感组合命名：', '我的灵感组合');
    if (title === null) return;
    setSelectedGroup({ cardIds: [...selectedNodeIds], title: title || '灵感组合' });
  };

  const handleExport = async () => {
    const ids = selectedGroup?.cardIds || selectedNodeIds;
    if (ids.length === 0) { alert('请先选择卡片'); return; }
    const title = selectedGroup?.title || prompt('导出文档标题：', '灵感组合');
    if (!title) return;
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardIds: ids, title }),
      });
      const data = await res.json();
      const blob = new Blob([data.markdown], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('导出失败');
    }
  };

  return (
    <div className="relative w-full h-full" style={{ background: '#0D1B2A' }}>
      <Canvas camera={{ position: [8, 8, 10], fov: 55 }} gl={{ antialias: true, alpha: false }}>
        <color attach="background" args={['#0D1B2A']} />
        <fog attach="fog" args={['#0D1B2A', 18, 40]} />
        <Scene
          graph={graphData}
          selectedIds={selectedNodeIds}
          onToggleNode={toggleNodeSelection}
          viewAngle={viewAngle}
        />
      </Canvas>

      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <div
          className="flex rounded-xl overflow-hidden shadow-xl backdrop-blur-md"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <button
            onClick={() => setViewAngle(45)}
            className="px-3 py-2 text-xs transition-all flex items-center gap-1.5"
            style={{
              color: viewAngle === 45 ? '#FFE082' : '#B0BEC5',
              background: viewAngle === 45 ? 'rgba(230,126,34,0.25)' : 'transparent',
              fontFamily: '"Noto Sans SC", sans-serif',
            }}
          >
            <Eye size={13} /> 45°
          </button>
          <button
            onClick={() => setViewAngle(90)}
            className="px-3 py-2 text-xs transition-all flex items-center gap-1.5"
            style={{
              color: viewAngle === 90 ? '#FFE082' : '#B0BEC5',
              background: viewAngle === 90 ? 'rgba(230,126,34,0.25)' : 'transparent',
              fontFamily: '"Noto Sans SC", sans-serif',
            }}
          >
            <Layers size={13} /> 90°
          </button>
        </div>
      </div>

      {selectedNodeIds.length > 0 && (
        <div className="absolute top-4 left-4 z-10"
          style={{
            padding: '8px 14px',
            background: 'rgba(13,27,42,0.85)',
            borderRadius: 999,
            border: '1px solid rgba(230,126,34,0.4)',
            color: '#FFE082',
            fontSize: 13,
            fontFamily: '"Noto Sans SC", sans-serif',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backdropFilter: 'blur(8px)',
          }}
        >
          <Check size={14} style={{ color: '#66BB6A' }} />
          已选 <strong style={{ color: '#FFF' }}>{selectedNodeIds.length}</strong> 个灵感
          {selectedNodeIds.length > 1 && (
            <span style={{ opacity: 0.6, fontSize: 11, marginLeft: 4 }}>
              按住 Ctrl 多选
            </span>
          )}
        </div>
      )}

      {selectedGroup && (
        <div className="absolute top-16 left-4 z-10"
          style={{
            padding: '10px 16px',
            background: 'rgba(46,204,113,0.15)',
            borderRadius: 12,
            border: '1px dashed #2ECC71',
            color: '#A5D6A7',
            fontSize: 12,
            fontFamily: '"Noto Serif SC", serif',
            maxWidth: 240,
          }}
        >
          📦 分组：<strong style={{ color: '#E8F5E9' }}>{selectedGroup.title}</strong>
          <div style={{ opacity: 0.7, marginTop: 4 }}>{selectedGroup.cardIds.length} 张卡片</div>
        </div>
      )}

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-10">
        <button
          onClick={handleGroup}
          disabled={selectedNodeIds.length < 2}
          className="px-5 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 backdrop-blur-md disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[0.97]"
          style={{
            background: 'rgba(46,204,113,0.2)',
            color: '#A5D6A7',
            border: '1px solid rgba(46,204,113,0.4)',
            fontFamily: '"Noto Sans SC", sans-serif',
          }}
        >
          <Grid3X3 size={15} /> 组合灵感
        </button>
        <button
          onClick={handleExport}
          disabled={selectedNodeIds.length === 0 && !selectedGroup}
          className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 hover:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, #E67E22, #F39C12)',
            color: '#FFF',
            boxShadow: '0 8px 24px -8px rgba(230,126,34,0.7)',
            fontFamily: '"Noto Sans SC", sans-serif',
          }}
        >
          <Download size={15} /> 导出 Markdown
        </button>
        {selectedNodeIds.length > 0 && (
          <button
            onClick={clearNodeSelection}
            className="px-4 py-2.5 rounded-full text-sm transition-all hover:scale-[0.97] backdrop-blur-md"
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: '#B0BEC5',
              border: '1px solid rgba(255,255,255,0.12)',
              fontFamily: '"Noto Sans SC", sans-serif',
            }}
          >
            清空
          </button>
        )}
      </div>

      <div className="absolute bottom-6 right-6 z-10"
        style={{
          padding: '10px 14px',
          background: 'rgba(13,27,42,0.7)',
          borderRadius: 10,
          color: '#78909C',
          fontSize: 11,
          fontFamily: '"Noto Sans SC", sans-serif',
          lineHeight: 1.8,
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(6px)',
        }}
      >
        <div>🖱 拖拽旋转 · 滚轮缩放</div>
        <div>☝ 点击选中 · Ctrl+点击多选</div>
      </div>
    </div>
  );
}
