import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  AudioNodeData,
  ConnectionData,
  NodeType,
  NodeParams,
  NODE_COLORS,
  NODE_LABELS,
  NODE_RADIUS,
} from './types';

interface EditorProps {
  nodes: AudioNodeData[];
  connections: ConnectionData[];
  onAddNode: (node: AudioNodeData) => void;
  onMoveNode: (nodeId: string, x: number, y: number) => void;
  onUpdateParams: (nodeId: string, params: NodeParams) => void;
  onAddConnection: (connection: ConnectionData) => void;
  onRemoveNode: (nodeId: string) => void;
  onRemoveConnection: (connectionId: string) => void;
  userName: string;
  isPlaying: boolean;
  activeNodeIds: string[];
  bpm: number;
}

const PARAM_CONFIGS: Record<string, { key: keyof NodeParams; label: string; min: number; max: number; step: number }[]> = {
  oscillator: [
    { key: 'waveform', label: '波形', min: 0, max: 3, step: 1 },
    { key: 'frequency', label: '频率', min: 220, max: 880, step: 1 },
    { key: 'volume', label: '音量', min: 0, max: 100, step: 1 },
  ],
  player: [
    { key: 'frequency', label: '频率', min: 100, max: 2000, step: 1 },
    { key: 'playbackRate', label: '播放速率', min: 0.5, max: 2.0, step: 0.1 },
    { key: 'volume', label: '音量', min: 0, max: 100, step: 1 },
  ],
  gain: [
    { key: 'volume', label: '音量', min: 0, max: 100, step: 1 },
  ],
  reverb: [
    { key: 'reverbTime', label: '混响时间', min: 0.1, max: 5.0, step: 0.1 },
    { key: 'volume', label: '音量', min: 0, max: 100, step: 1 },
  ],
  delay: [
    { key: 'delayTime', label: '延迟时间', min: 0.1, max: 2.0, step: 0.1 },
    { key: 'feedback', label: '反馈', min: 0, max: 0.9, step: 0.1 },
    { key: 'volume', label: '音量', min: 0, max: 100, step: 1 },
  ],
  output: [
    { key: 'volume', label: '音量', min: 0, max: 100, step: 1 },
  ],
};

const WAVEFORM_OPTIONS: { value: NodeParams['waveform']; label: string }[] = [
  { value: 'sine', label: '正弦波' },
  { value: 'square', label: '方波' },
  { value: 'sawtooth', label: '锯齿波' },
  { value: 'triangle', label: '三角波' },
];

export default function Editor({
  nodes,
  connections,
  onAddNode,
  onMoveNode,
  onUpdateParams,
  onAddConnection,
  onRemoveNode,
  onRemoveConnection,
  userName,
  isPlaying,
  activeNodeIds,
  bpm,
}: EditorProps) {
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: 'node' | 'connection'; targetId: string } | null>(null);
  const [connDrag, setConnDrag] = useState<{
    fromNodeId: string;
    startX: number;
    startY: number;
    mouseX: number;
    mouseY: number;
  } | null>(null);

  const dragRef = useRef<{
    nodeId: string;
    offsetX: number;
    offsetY: number;
    animating: boolean;
  } | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});

  useEffect(() => {
    setNodePositions((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const n of nodes) {
        if (next[n.id]?.x !== n.x || next[n.id]?.y !== n.y) {
          next[n.id] = { x: n.x, y: n.y };
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [nodes]);

  const getSVGCoords = useCallback((e: React.MouseEvent | MouseEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const nodeType = e.dataTransfer.getData('nodeType') as NodeType;
      if (!nodeType) return;
      const coords = getSVGCoords(e as unknown as React.MouseEvent);
      const newNode: AudioNodeData = {
        id: crypto.randomUUID(),
        type: nodeType,
        x: coords.x,
        y: coords.y,
        params: {},
        lastEditor: userName,
      };
      onAddNode(newNode);
    },
    [getSVGCoords, onAddNode, userName],
  );

  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation();
      if (e.button !== 0) return;
      const pos = nodePositions[nodeId];
      if (!pos) return;
      const coords = getSVGCoords(e);
      dragRef.current = {
        nodeId,
        offsetX: coords.x - pos.x,
        offsetY: coords.y - pos.y,
        animating: false,
      };

      const handleMouseMove = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        if (!dragRef.current.animating) {
          dragRef.current.animating = true;
        }
        const c = getSVGCoords(ev);
        const nx = c.x - dragRef.current.offsetX;
        const ny = c.y - dragRef.current.offsetY;
        setNodePositions((prev) => ({
          ...prev,
          [dragRef.current!.nodeId]: { x: nx, y: ny },
        }));
      };

      const handleMouseUp = () => {
        if (dragRef.current) {
          const pos = nodePositions[dragRef.current.nodeId];
          const finalPos = pos || nodes.find((n) => n.id === dragRef.current!.nodeId);
          if (finalPos) {
            onMoveNode(dragRef.current.nodeId, finalPos.x, finalPos.y);
          }
          dragRef.current = null;
        }
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [getSVGCoords, nodePositions, nodes, onMoveNode],
  );

  const handleOutputPortMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation();
      e.preventDefault();
      const pos = nodePositions[nodeId];
      if (!pos) return;
      const startX = pos.x + NODE_RADIUS;
      const startY = pos.y;
      const coords = getSVGCoords(e);
      setConnDrag({ fromNodeId: nodeId, startX, startY, mouseX: coords.x, mouseY: coords.y });

      const handleMouseMove = (ev: MouseEvent) => {
        const c = getSVGCoords(ev);
        setConnDrag((prev) => (prev ? { ...prev, mouseX: c.x, mouseY: c.y } : null));
      };

      const handleMouseUp = (ev: MouseEvent) => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        setConnDrag((prev) => {
          if (!prev) return null;
          const c = getSVGCoords(ev);
          const targetNode = nodes.find((n) => {
            const np = nodePositions[n.id];
            if (!np) return false;
            const dist = Math.sqrt((c.x - np.x) ** 2 + (c.y - np.y) ** 2);
            return dist <= NODE_RADIUS + 10 && n.id !== prev.fromNodeId;
          });
          if (targetNode) {
            const exists = connections.some(
              (conn) => conn.fromNodeId === prev.fromNodeId && conn.toNodeId === targetNode.id,
            );
            if (!exists) {
              onAddConnection({
                id: crypto.randomUUID(),
                fromNodeId: prev.fromNodeId,
                toNodeId: targetNode.id,
              });
            }
          }
          return null;
        });
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [getSVGCoords, nodePositions, nodes, connections, onAddConnection],
  );

  const handleNodeDoubleClick = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setEditingNodeId(nodeId);
  }, []);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, type: 'node' | 'connection', targetId: string) => {
      e.preventDefault();
      e.stopPropagation();
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      setContextMenu({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        type,
        targetId,
      });
    },
    [],
  );

  const handleCanvasClick = useCallback(() => {
    setContextMenu(null);
    setEditingNodeId(null);
  }, []);

  const handleContextMenuAction = useCallback(
    (action: string) => {
      if (!contextMenu) return;
      if (action === 'delete') {
        if (contextMenu.type === 'node') {
          onRemoveNode(contextMenu.targetId);
          if (editingNodeId === contextMenu.targetId) {
            setEditingNodeId(null);
          }
        } else {
          onRemoveConnection(contextMenu.targetId);
        }
      }
      setContextMenu(null);
    },
    [contextMenu, onRemoveNode, onRemoveConnection, editingNodeId],
  );

  const buildBezierPath = (x1: number, y1: number, x2: number, y2: number) => {
    const offset = 80;
    return `M ${x1} ${y1} C ${x1 + offset} ${y1}, ${x2 - offset} ${y2}, ${x2} ${y2}`;
  };

  const editingNode = editingNodeId ? nodes.find((n) => n.id === editingNodeId) : null;
  const editingPos = editingNodeId ? nodePositions[editingNodeId] : null;
  const bpmDuration = 60 / bpm;

  return (
    <div
      style={{ width: '100%', height: '100%', position: 'relative' }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleCanvasClick}
    >
      <style>{`
        @keyframes pulse-ring {
          0% { r: ${NODE_RADIUS}; opacity: 0.8; }
          100% { r: 65; opacity: 0; }
        }
        .pulse-ring {
          animation: pulse-ring ${bpmDuration}s ease-out infinite;
        }
        .connection-line {
          transition: stroke 0.15s, stroke-width 0.15s;
        }
        .connection-line:hover {
          stroke: white;
          stroke-width: 4px;
        }
      `}</style>
      <svg ref={svgRef} width="100%" height="100%" style={{ display: 'block' }}>
        {connections.map((conn) => {
          const fromPos = nodePositions[conn.fromNodeId];
          const toPos = nodePositions[conn.toNodeId];
          if (!fromPos || !toPos) return null;
          const x1 = fromPos.x + NODE_RADIUS;
          const y1 = fromPos.y;
          const x2 = toPos.x - NODE_RADIUS;
          const y2 = toPos.y;
          return (
            <path
              key={conn.id}
              d={buildBezierPath(x1, y1, x2, y2)}
              fill="none"
              stroke={NODE_COLORS[nodes.find((n) => n.id === conn.fromNodeId)?.type || 'oscillator']}
              strokeWidth={2}
              className="connection-line"
              opacity={isPlaying ? 0.8 : 0.3}
              onContextMenu={(e) => handleContextMenu(e, 'connection', conn.id)}
              style={{ cursor: 'pointer' }}
            />
          );
        })}

        {connDrag && (
          <path
            d={buildBezierPath(connDrag.startX, connDrag.startY, connDrag.mouseX, connDrag.mouseY)}
            fill="none"
            stroke="white"
            strokeWidth={2}
            strokeDasharray="8 4"
            opacity={0.6}
            pointerEvents="none"
          />
        )}

        {nodes.map((node) => {
          const pos = nodePositions[node.id];
          if (!pos) return null;
          const isActive = isPlaying && activeNodeIds.includes(node.id);
          return (
            <g
              key={node.id}
              style={{
                cursor: 'grab',
                transition: dragRef.current?.nodeId === node.id ? 'none' : 'all 0.15s ease-out',
              }}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              onDoubleClick={(e) => handleNodeDoubleClick(e, node.id)}
              onContextMenu={(e) => handleContextMenu(e, 'node', node.id)}
            >
              {isActive && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={NODE_RADIUS}
                  fill="none"
                  stroke={NODE_COLORS[node.type]}
                  strokeWidth={3}
                  className="pulse-ring"
                />
              )}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={NODE_RADIUS}
                fill={NODE_COLORS[node.type]}
                stroke={isActive ? 'white' : 'none'}
                strokeWidth={isActive ? 2 : 0}
              />
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="white"
                fontSize={12}
                fontWeight="bold"
                pointerEvents="none"
                style={{ userSelect: 'none' }}
              >
                {NODE_LABELS[node.type]}
              </text>
              <circle
                cx={pos.x + NODE_RADIUS}
                cy={pos.y}
                r={8}
                fill="white"
                stroke={NODE_COLORS[node.type]}
                strokeWidth={2}
                style={{ cursor: 'crosshair' }}
                onMouseDown={(e) => handleOutputPortMouseDown(e, node.id)}
              />
              <circle
                cx={pos.x - NODE_RADIUS}
                cy={pos.y}
                r={8}
                fill="white"
                stroke={NODE_COLORS[node.type]}
                strokeWidth={2}
                style={{ cursor: 'crosshair' }}
              />
            </g>
          );
        })}
      </svg>

      {contextMenu && (
        <div
          style={{
            position: 'absolute',
            left: contextMenu.x,
            top: contextMenu.y,
            background: 'rgba(30, 30, 40, 0.95)',
            borderRadius: 6,
            padding: '4px 0',
            minWidth: 140,
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            zIndex: 1000,
            color: 'white',
            fontSize: 13,
          }}
        >
          <div
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLDivElement).style.background = 'rgba(255,255,255,0.1)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLDivElement).style.background = 'transparent';
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleContextMenuAction('delete');
            }}
          >
            {contextMenu.type === 'node' ? '删除' : '删除连接'}
          </div>
        </div>
      )}

      {editingNode && editingPos && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(editingPos.x + NODE_RADIUS + 16, (svgRef.current?.clientWidth || 800) - 260),
            top: Math.max(editingPos.y - 80, 8),
            width: 240,
            background: 'rgba(20, 20, 35, 0.75)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.15)',
            padding: 16,
            color: 'white',
            fontSize: 13,
            zIndex: 100,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontWeight: 'bold', fontSize: 15, color: NODE_COLORS[editingNode.type] }}>
              {NODE_LABELS[editingNode.type]}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {editingNode.lastEditor && (
                <span
                  style={{
                    fontSize: 10,
                    background: 'rgba(255,255,255,0.15)',
                    padding: '2px 6px',
                    borderRadius: 4,
                    color: 'rgba(255,255,255,0.7)',
                  }}
                >
                  {editingNode.lastEditor}
                </span>
              )}
              <span
                style={{ cursor: 'pointer', fontSize: 16, lineHeight: 1, color: 'rgba(255,255,255,0.6)' }}
                onClick={() => setEditingNodeId(null)}
              >
                ✕
              </span>
            </div>
          </div>
          {(PARAM_CONFIGS[editingNode.type] || []).map((cfg) => {
            if (cfg.key === 'waveform') {
              return (
                <div key={cfg.key} style={{ marginBottom: 10 }}>
                  <div style={{ marginBottom: 4, color: 'rgba(255,255,255,0.7)' }}>{cfg.label}</div>
                  <select
                    value={editingNode.params.waveform || 'sine'}
                    onChange={(e) => {
                      onUpdateParams(editingNode.id, {
                        ...editingNode.params,
                        waveform: e.target.value as NodeParams['waveform'],
                      });
                    }}
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 4,
                      color: 'white',
                      padding: '4px 8px',
                      fontSize: 12,
                    }}
                  >
                    {WAVEFORM_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }
            const val = (editingNode.params[cfg.key] as number) ?? cfg.min;
            return (
              <div key={cfg.key} style={{ marginBottom: 10 }}>
                <div style={{ marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>{cfg.label}</span>
                  <span style={{ color: 'rgba(255,255,255,0.9)' }}>{val}</span>
                </div>
                <input
                  type="range"
                  min={cfg.min}
                  max={cfg.max}
                  step={cfg.step}
                  value={val}
                  onChange={(e) => {
                    onUpdateParams(editingNode.id, {
                      ...editingNode.params,
                      [cfg.key]: parseFloat(e.target.value),
                    });
                  }}
                  style={{ width: '100%' }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
