import React, { useState, useEffect, useRef, useCallback } from 'react';
import GraphCanvas from './GraphCanvas';
import NodePanel from './NodePanel';
import { api } from './api';
import type { KnowledgeGraph, GraphNode, GraphEdge, ToolMode, HistorySnapshot, Collaborator } from './data';
import { v4 as uuidv4 } from 'uuid';

type View = { type: 'home' } | { type: 'graph'; graphId: string };

const COLLAB_COLORS = ['#f06292', '#ba68c8', '#ff8a65', '#aed581', '#4dd0e1', '#ffd54f', '#7986cb', '#4db6ac'];

const ToolbarButton: React.FC<{
  icon: string;
  label: string;
  active?: boolean;
  onClick: () => void;
  title?: string;
  danger?: boolean;
}> = ({ icon, label, active, onClick, title, danger }) => (
  <button
    onClick={onClick}
    title={title || label}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      padding: '8px 14px',
      minWidth: 56,
      height: 52,
      background: active
        ? (danger ? 'linear-gradient(135deg, #ef5350, #c62828)' : 'linear-gradient(135deg, #4fc3f7, #29b6f6)')
        : 'rgba(255,255,255,0.04)',
      border: active ? 'none' : '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10,
      color: active ? '#fff' : '#b0bec5',
      cursor: 'pointer',
      fontSize: 18,
      transition: 'all 0.2s ease',
      backdropFilter: 'blur(10px)'
    }}
    onMouseEnter={e => {
      if (!active) {
        e.currentTarget.style.background = 'rgba(79, 195, 247, 0.15)';
        e.currentTarget.style.transform = 'scale(1.04)';
        e.currentTarget.style.borderColor = 'rgba(79, 195, 247, 0.3)';
      }
    }}
    onMouseLeave={e => {
      if (!active) {
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
      }
    }}
  >
    <span style={{ lineHeight: 1 }}>{icon}</span>
    <span style={{ fontSize: 10, letterSpacing: 0.3, lineHeight: 1 }}>{label}</span>
  </button>
);

const ThumbnailCanvas: React.FC<{ graph: KnowledgeGraph }> = ({ graph }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, W, H);
    if (graph.nodes.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    graph.nodes.forEach(n => {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + 180);
      maxY = Math.max(maxY, n.y + 90);
    });
    const padding = 30;
    const gw = maxX - minX, gh = maxY - minY;
    const sx = (W - padding * 2) / gw, sy = (H - padding * 2) / gh;
    const s = Math.min(sx, sy, 1);
    const ox = (W - gw * s) / 2 - minX * s;
    const oy = (H - gh * s) / 2 - minY * s;

    const edgeColors: Record<string, string> = { derived: '#4fc3f7', dependency: '#ffb74d', related: '#81c784' };
    graph.edges.forEach(edge => {
      const sNode = graph.nodes.find(n => n.id === edge.source);
      const tNode = graph.nodes.find(n => n.id === edge.target);
      if (!sNode || !tNode) return;
      ctx.strokeStyle = edgeColors[edge.type];
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.moveTo(ox + (sNode.x + 90) * s, oy + (sNode.y + 45) * s);
      ctx.lineTo(ox + (tNode.x + 90) * s, oy + (tNode.y + 45) * s);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;

    graph.nodes.forEach(n => {
      ctx.fillStyle = '#16213e';
      ctx.strokeStyle = n.color;
      ctx.lineWidth = 1;
      const x = ox + n.x * s, y = oy + n.y * s, w = 180 * s, h = 90 * s;
      const r = 4 * s;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.fill();
      ctx.stroke();
    });
  }, [graph.id]);
  return <canvas ref={ref} width={280} height={160} style={{ display: 'block', borderRadius: 8 }} />;
};

const App: React.FC = () => {
  const [view, setView] = useState<View>({ type: 'home' });
  const [graphs, setGraphs] = useState<KnowledgeGraph[]>([]);
  const [currentGraph, setCurrentGraph] = useState<KnowledgeGraph | null>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [toolMode, setToolMode] = useState<ToolMode>('select');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [collaboratorId, setCollaboratorId] = useState<string | null>(null);
  const [hoveredGraph, setHoveredGraph] = useState<string | null>(null);
  const [joinRoomInput, setJoinRoomInput] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGraphName, setNewGraphName] = useState('');

  const undoRef = useRef<() => void>(() => {});
  const redoRef = useRef<() => void>(() => {});
  const jumpToNodeIdRef = useRef<string | null>(null);
  const onExportPNGRef = useRef<() => void>(() => {});
  const versionRef = useRef(0);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const loadGraphs = useCallback(async () => {
    const list = await api.listGraphs();
    setGraphs(list);
  }, []);

  useEffect(() => {
    loadGraphs();
  }, [loadGraphs]);

  const openGraph = useCallback(async (id: string) => {
    const g = await api.getGraph(id);
    if (g) {
      const local = api.loadLocal(id);
      setCurrentGraph(g);
      setNodes(local?.nodes || g.nodes);
      setEdges(local?.edges || g.edges);
      versionRef.current = g.version;
      setView({ type: 'graph', graphId: id });
      setToolMode('select');
      setSelectedNodeId(null);

      const colId = 'col_' + uuidv4().slice(0, 8);
      setCollaboratorId(colId);
    }
  }, []);

  const createGraph = useCallback(async (name: string) => {
    const g = await api.createGraph(name || '未命名图谱');
    await loadGraphs();
    openGraph(g.id);
    setShowCreateModal(false);
    setNewGraphName('');
  }, [loadGraphs, openGraph]);

  const joinByRoomCode = useCallback(async (code: string) => {
    const list = await api.listGraphs();
    const g = list.find(x => x.roomCode.toLowerCase() === code.toLowerCase().trim());
    if (g) {
      openGraph(g.id);
      setShowJoinModal(false);
      setJoinRoomInput('');
    } else {
      alert('未找到该房间码对应的图谱');
    }
  }, [openGraph]);

  const goHome = useCallback(() => {
    setView({ type: 'home' });
    setCurrentGraph(null);
    setNodes([]);
    setEdges([]);
    setCollaborators([]);
    loadGraphs();
  }, [loadGraphs]);

  const scheduleSave = useCallback(() => {
    if (!currentGraph) return;
    api.saveLocal(currentGraph.id, { nodes, edges });
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      if (!currentGraph) return;
      const updated = {
        ...currentGraph,
        nodes,
        edges,
        updatedAt: Date.now(),
        version: versionRef.current + 1
      };
      versionRef.current = updated.version;
      try {
        const res = await api.updateGraph(updated);
        versionRef.current = res.version;
        setCurrentGraph(res);
      } catch {}
    }, 500);
  }, [currentGraph, nodes, edges]);

  useEffect(() => { scheduleSave(); }, [nodes, edges, scheduleSave]);

  useEffect(() => {
    if (view.type !== 'graph' || !currentGraph || !collaboratorId) return;
    const interval = setInterval(async () => {
      const res = await api.pollGraph(currentGraph.id, versionRef.current);
      if (res.graph && res.graph.version > versionRef.current) {
        versionRef.current = res.graph.version;
        setNodes(res.graph.nodes);
        setEdges(res.graph.edges);
        setCurrentGraph(res.graph);
      }
      setCollaborators(res.collaborators.filter(c => c.id !== collaboratorId));
    }, 500);
    return () => clearInterval(interval);
  }, [view.type, currentGraph?.id, collaboratorId]);

  useEffect(() => {
    if (view.type !== 'graph' || !currentGraph || !collaboratorId) return;
    const interval = setInterval(() => {
      api.updateActivity(currentGraph.id, collaboratorId, selectedNodeId);
    }, 800);
    return () => clearInterval(interval);
  }, [view.type, currentGraph?.id, collaboratorId, selectedNodeId]);

  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) || null : null;

  const updateNode = useCallback((updated: GraphNode) => {
    setNodes(ns => ns.map(n => n.id === updated.id ? updated : n));
  }, []);

  const deleteNode = useCallback((id: string) => {
    setNodes(ns => ns.filter(n => n.id !== id));
    setEdges(es => es.filter(e => e.source !== id && e.target !== id));
    setSelectedNodeId(null);
  }, []);

  const jumpToNode = useCallback((id: string) => {
    setSelectedNodeId(id);
    jumpToNodeIdRef.current = id;
  }, []);

  if (view.type === 'home') {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        background: 'radial-gradient(ellipse at top, #1e1e3a 0%, #1a1a2e 50%, #12122a 100%)',
        overflowY: 'auto',
        padding: '40px 60px'
      }}>
        <div style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 32
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: 'linear-gradient(135deg, #4fc3f7, #7c4dff)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, boxShadow: '0 0 20px rgba(79, 195, 247, 0.4)'
              }}>🕸</div>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e0e0e0', letterSpacing: 0.5 }}>知识图谱协作</h1>
                <p style={{ fontSize: 13, color: '#78909c', marginTop: 2 }}>团队知识可视化协作平台</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowJoinModal(true)}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10,
                  color: '#b0bec5',
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(79, 195, 247, 0.12)';
                  e.currentTarget.style.borderColor = 'rgba(79, 195, 247, 0.3)';
                  e.currentTarget.style.transform = 'scale(1.03)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                🏷 输入房间码
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #4fc3f7, #29b6f6)',
                  border: 'none',
                  borderRadius: 10,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(79, 195, 247, 0.3)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.04)';
                  e.currentTarget.style.boxShadow = '0 6px 28px rgba(79, 195, 247, 0.5)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(79, 195, 247, 0.3)';
                }}
              >
                ➕ 创建新图谱
              </button>
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: 16, color: '#b0bec5', fontWeight: 500, marginBottom: 16 }}>我的图谱</h2>
            {graphs.length === 0 ? (
              <div style={{
                padding: '80px 20px',
                textAlign: 'center',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 16,
                border: '1px dashed rgba(255,255,255,0.08)'
              }}>
                <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>🗂</div>
                <p style={{ color: '#78909c', fontSize: 15 }}>还没有任何图谱，点击右上角创建第一个吧！</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 20
              }}>
                {graphs.map(g => (
                  <div
                    key={g.id}
                    onMouseEnter={() => setHoveredGraph(g.id)}
                    onMouseLeave={() => setHoveredGraph(null)}
                    onClick={() => openGraph(g.id)}
                    style={{
                      background: 'rgba(22, 33, 62, 0.6)',
                      border: hoveredGraph === g.id ? '1px solid rgba(79, 195, 247, 0.5)' : '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 14,
                      padding: 14,
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      transform: hoveredGraph === g.id ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
                      boxShadow: hoveredGraph === g.id ? '0 12px 40px rgba(79, 195, 247, 0.15)' : '0 4px 16px rgba(0,0,0,0.2)'
                    }}
                  >
                    <div style={{
                      position: 'relative',
                      marginBottom: 12,
                      overflow: 'hidden',
                      borderRadius: 8,
                      background: '#0f1624'
                    }}>
                      <ThumbnailCanvas graph={g} />
                      {hoveredGraph === g.id && (
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(79, 195, 247, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: 14,
                          fontWeight: 600,
                          backdropFilter: 'blur(2px)',
                          animation: 'fadeIn 0.2s ease'
                        }}>
                          点击进入编辑 →
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{
                          fontSize: 15,
                          color: '#e0e0e0',
                          fontWeight: 600,
                          marginBottom: 4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>{g.name}</h3>
                        <p style={{ fontSize: 12, color: '#546e7a' }}>房间码: <span style={{ color: '#4fc3f7', fontFamily: 'monospace' }}>{g.roomCode}</span></p>
                      </div>
                      <div style={{
                        padding: '4px 8px',
                        background: 'rgba(79, 195, 247, 0.12)',
                        borderRadius: 6,
                        fontSize: 11,
                        color: '#4fc3f7',
                        fontWeight: 600
                      }}>
                        {g.nodes.length} 节点
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {showCreateModal && (
          <Modal onClose={() => setShowCreateModal(false)} title="创建新图谱">
            <input
              autoFocus
              value={newGraphName}
              onChange={e => setNewGraphName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createGraph(newGraphName)}
              placeholder="请输入图谱名称..."
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: '#e0e0e0',
                fontSize: 14,
                outline: 'none',
                marginBottom: 16
              }}
            />
            <button
              onClick={() => createGraph(newGraphName)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #4fc3f7, #29b6f6)',
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >创建</button>
          </Modal>
        )}

        {showJoinModal && (
          <Modal onClose={() => setShowJoinModal(false)} title="通过房间码加入">
            <input
              autoFocus
              value={joinRoomInput}
              onChange={e => setJoinRoomInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && joinByRoomCode(joinRoomInput)}
              placeholder="输入房间码，例如：ABC123"
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: '#e0e0e0',
                fontSize: 16,
                letterSpacing: 3,
                fontFamily: 'monospace',
                outline: 'none',
                marginBottom: 16,
                textAlign: 'center'
              }}
            />
            <button
              onClick={() => joinByRoomCode(joinRoomInput)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #7c4dff, #536dfe)',
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >加入协作</button>
          </Modal>
        )}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <GraphCanvas
        nodes={nodes}
        edges={edges}
        toolMode={toolMode}
        selectedNodeId={selectedNodeId}
        collaborators={collaborators}
        onNodesChange={setNodes}
        onEdgesChange={setEdges}
        onSelectNode={setSelectedNodeId}
        onHistoryPush={() => {}}
        undoRef={undoRef}
        redoRef={redoRef}
        jumpToNodeIdRef={jumpToNodeIdRef}
        onExportPNGRef={onExportPNGRef}
      />

      <div style={{
        position: 'absolute',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 8,
        padding: '8px 12px',
        background: 'rgba(22, 33, 62, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
        zIndex: 50
      }}>
        <div onClick={goHome} title="返回首页" style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 14px',
          fontSize: 14,
          fontWeight: 600,
          color: '#e0e0e0',
          cursor: 'pointer',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          marginRight: 4,
          transition: 'color 0.2s'
        }} onMouseEnter={e => (e.currentTarget.style.color = '#4fc3f7')}
           onMouseLeave={e => (e.currentTarget.style.color = '#e0e0e0')}>
          ← {currentGraph?.name || '图谱'}
        </div>
        <ToolbarButton icon="➕" label="节点" active={toolMode === 'addNode'} onClick={() => setToolMode(toolMode === 'addNode' ? 'select' : 'addNode')} title="添加节点模式 (点击画布空白处创建)" />
        <ToolbarButton icon="🔗" label="连线" active={toolMode === 'connect'} onClick={() => setToolMode(toolMode === 'connect' ? 'select' : 'connect')} title="连线模式 (从一个节点拖到另一个节点)" />
        <ToolbarButton icon="🗑" label="删除" active={toolMode === 'delete'} danger onClick={() => setToolMode(toolMode === 'delete' ? 'select' : 'delete')} title="删除模式 (点击节点或连线删除)" />
        <div style={{ width: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 4px' }} />
        <ToolbarButton icon="↩" label="撤销" onClick={() => undoRef.current()} title="撤销 (Ctrl+Z)" />
        <ToolbarButton icon="↪" label="重做" onClick={() => redoRef.current()} title="重做 (Ctrl+Y)" />
        <div style={{ width: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 4px' }} />
        <ToolbarButton icon="📷" label="导出" onClick={() => onExportPNGRef.current()} title="导出为PNG" />
        <ToolbarButton icon="🎯" label="重置" onClick={() => { jumpToNodeIdRef.current = nodes[0]?.id || null; }} title="重置视图" />
      </div>

      {currentGraph && (
        <div style={{
          position: 'absolute',
          top: 16,
          right: 16,
          padding: '10px 14px',
          background: 'rgba(22, 33, 62, 0.85)',
          backdropFilter: 'blur(20px)',
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.06)',
          fontSize: 12,
          color: '#b0bec5',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span>房间码:</span>
          <span style={{
            color: '#4fc3f7',
            fontFamily: 'monospace',
            fontWeight: 700,
            letterSpacing: 2,
            fontSize: 14,
            padding: '2px 8px',
            background: 'rgba(79, 195, 247, 0.1)',
            borderRadius: 4,
            cursor: 'pointer'
          }} onClick={() => {
            navigator.clipboard?.writeText(currentGraph.roomCode);
          }} title="点击复制">{currentGraph.roomCode}</span>
          {collaborators.length > 0 && (
            <>
              <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)', margin: '0 6px' }} />
              <div style={{ display: 'flex', gap: -4 }}>
                {collaborators.slice(0, 4).map((c, i) => (
                  <div key={c.id} title={c.name} style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: c.color,
                    border: '2px solid #16213e',
                    marginLeft: i === 0 ? 0 : -6,
                    boxShadow: `0 0 8px ${c.color}50`
                  }} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div style={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        padding: '8px 12px',
        background: 'rgba(22, 33, 62, 0.8)',
        backdropFilter: 'blur(10px)',
        borderRadius: 8,
        fontSize: 11,
        color: '#78909c',
        zIndex: 50,
        lineHeight: 1.7
      }}>
        <div>🖱 滚轮缩放 · 拖拽画布平移 · 双击节点编辑</div>
        <div>⌨ Ctrl+Z 撤销 · Ctrl+Y 重做</div>
      </div>

      <NodePanel
        node={selectedNode}
        edges={edges}
        allNodes={nodes}
        onUpdate={updateNode}
        onClose={() => setSelectedNodeId(null)}
        onDelete={deleteNode}
        onJumpToNode={jumpToNode}
      />
    </div>
  );
};

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div
    onClick={onClose}
    style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)',
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'fadeIn 0.2s ease'
    }}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{
        width: 380,
        background: '#16213e',
        borderRadius: 16,
        padding: 24,
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        animation: 'popIn 0.25s ease'
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: '#e0e0e0', marginBottom: 18 }}>{title}</h2>
      {children}
    </div>
  </div>
);

export default App;
