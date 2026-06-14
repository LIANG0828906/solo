import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, type DragEndEvent, type DragStartEvent, type DragMoveEvent } from '@dnd-kit/core';
import { Plus, LayoutGrid, UserPlus, X, Edit2, Check } from 'lucide-react';
import type { DialogueNode, Character, Connection, Emotion } from '../types';
import { EMOTION_COLORS, EMOTION_LABELS, NODE_WIDTH, NODE_HEIGHT, PORT_RADIUS, AVATAR_SIZE, generateId } from '../types';
import { autoLayoutNodes } from '../utils/exportImport';
import NodeCard from './NodeCard';

interface DialogueEditorProps {
  characters: Character[];
  nodes: DialogueNode[];
  connections: Connection[];
  rootNodeId: string | null;
  onCharactersChange: (chars: Character[]) => void;
  onNodesChange: (nodes: DialogueNode[]) => void;
  onConnectionsChange: (conns: Connection[]) => void;
  onRootNodeIdChange: (id: string | null) => void;
}

interface ConnectingState {
  sourceId: string;
  sourcePort: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

const DialogueEditor: React.FC<DialogueEditorProps> = ({
  characters,
  nodes,
  connections,
  rootNodeId,
  onCharactersChange,
  onNodesChange,
  onConnectionsChange,
  onRootNodeIdChange,
}) => {
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const canvasInnerRef = useRef<HTMLDivElement>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<ConnectingState | null>(null);
  const [activeTargetNodeId, setActiveTargetNodeId] = useState<string | null>(null);
  const [editingCharId, setEditingCharId] = useState<string | null>(null);
  const [editingCharName, setEditingCharName] = useState('');
  const [editingCharEmotion, setEditingCharEmotion] = useState<Emotion>('neutral');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const getPortPosition = useCallback(
    (nodeId: string, portIndex: number, nodeList: DialogueNode[]) => {
      const node = nodeList.find((n) => n.id === nodeId);
      if (!node) return { x: 0, y: 0 };
      const headerHeight = 64;
      const bodyHeight = 100;
      const branchTop = headerHeight + bodyHeight + 12;
      const branchSpacing = 34;
      const x = node.x + NODE_WIDTH - PORT_RADIUS - 2;
      const y = node.y + branchTop + portIndex * branchSpacing + 12;
      return { x, y };
    },
    []
  );

  const getTargetPortPosition = useCallback((nodeId: string, nodeList: DialogueNode[]) => {
    const node = nodeList.find((n) => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    return {
      x: node.x - PORT_RADIUS,
      y: node.y + 26,
    };
  }, []);

  const createBezierPath = useCallback((x1: number, y1: number, x2: number, y2: number) => {
    const dx = Math.abs(x2 - x1);
    const controlOffset = Math.max(80, dx * 0.5);
    return `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`;
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      const { active, delta } = event;
      const id = active.id as string;

      onNodesChange(
        nodes.map((n) =>
          n.id === id
            ? {
                ...n,
                x: Math.max(0, n.x + delta.x),
                y: Math.max(0, n.y + delta.y),
              }
            : n
        )
      );
    },
    [nodes, onNodesChange]
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null);
  }, []);

  const handlePortMouseDown = useCallback(
    (nodeId: string, portIndex: number, e: React.MouseEvent) => {
      const pos = getPortPosition(nodeId, portIndex, nodes);
      const rect = canvasInnerRef.current?.getBoundingClientRect();
      const scrollLeft = canvasWrapRef.current?.scrollLeft || 0;
      const scrollTop = canvasWrapRef.current?.scrollTop || 0;

      setConnecting({
        sourceId: nodeId,
        sourcePort: portIndex,
        startX: pos.x,
        startY: pos.y,
        currentX: e.clientX - (rect?.left || 0) + scrollLeft,
        currentY: e.clientY - (rect?.top || 0) + scrollTop,
      });
    },
    [nodes, getPortPosition]
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!connecting) return;
      const rect = canvasInnerRef.current?.getBoundingClientRect();
      const scrollLeft = canvasWrapRef.current?.scrollLeft || 0;
      const scrollTop = canvasWrapRef.current?.scrollTop || 0;

      setConnecting({
        ...connecting,
        currentX: e.clientX - (rect?.left || 0) + scrollLeft,
        currentY: e.clientY - (rect?.top || 0) + scrollTop,
      });
    },
    [connecting]
  );

  const handleCanvasMouseUp = useCallback(() => {
    setConnecting(null);
    setActiveTargetNodeId(null);
  }, []);

  const handleTargetPortMouseUp = useCallback(
    (targetId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!connecting) return;
      if (connecting.sourceId === targetId) {
        setConnecting(null);
        setActiveTargetNodeId(null);
        return;
      }

      const existingIndex = connections.findIndex(
        (c) => c.sourceId === connecting.sourceId && c.sourcePort === connecting.sourcePort
      );

      const newConnection: Connection = {
        id: generateId('conn'),
        sourceId: connecting.sourceId,
        targetId,
        sourcePort: connecting.sourcePort,
      };

      if (existingIndex >= 0) {
        const updated = [...connections];
        updated[existingIndex] = newConnection;
        onConnectionsChange(updated);
      } else {
        onConnectionsChange([...connections, newConnection]);
      }

      if (!rootNodeId && nodes.find((n) => n.id === targetId)) {
        const hasIncoming = connections.some((c) => c.targetId === connecting.sourceId);
        if (!hasIncoming) {
          onRootNodeIdChange(connecting.sourceId);
        }
      }

      setConnecting(null);
      setActiveTargetNodeId(null);
    },
    [connecting, connections, onConnectionsChange, rootNodeId, nodes, onRootNodeIdChange]
  );

  const handleAddNode = useCallback(() => {
    const defaultChar = characters[0];
    const newNode: DialogueNode = {
      id: generateId('node'),
      characterId: defaultChar?.id || '',
      text: '',
      emotion: defaultChar?.defaultEmotion || 'neutral',
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      branchLabels: [''],
    };
    const updated = [...nodes, newNode];
    onNodesChange(updated);
    if (!rootNodeId) {
      onRootNodeIdChange(newNode.id);
    }
    setSelectedNodeId(newNode.id);
  }, [characters, nodes, rootNodeId, onNodesChange, onRootNodeIdChange]);

  const handleUpdateNode = useCallback(
    (id: string, updates: Partial<DialogueNode>) => {
      onNodesChange(nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)));
    },
    [nodes, onNodesChange]
  );

  const handleRemoveNode = useCallback(
    (id: string) => {
      onNodesChange(nodes.filter((n) => n.id !== id));
      onConnectionsChange(connections.filter((c) => c.sourceId !== id && c.targetId !== id));
      if (selectedNodeId === id) setSelectedNodeId(null);
      if (rootNodeId === id) {
        const remaining = nodes.filter((n) => n.id !== id);
        onRootNodeIdChange(remaining.length > 0 ? remaining[0].id : null);
      }
    },
    [nodes, connections, selectedNodeId, rootNodeId, onNodesChange, onConnectionsChange, onRootNodeIdChange]
  );

  const handleAddCharacter = useCallback(() => {
    const avatars = ['🧙', '⚔️', '🧝', '🧛', '👸', '🤴', '🧞', '👾', '🤖', '👻'];
    const usedCount = characters.length;
    const newChar: Character = {
      id: generateId('char'),
      name: `角色 ${usedCount + 1}`,
      avatar: avatars[usedCount % avatars.length],
      defaultEmotion: 'neutral',
    };
    onCharactersChange([...characters, newChar]);
  }, [characters, onCharactersChange]);

  const handleUpdateCharacter = useCallback(
    (id: string, updates: Partial<Character>) => {
      onCharactersChange(characters.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    },
    [characters, onCharactersChange]
  );

  const handleRemoveCharacter = useCallback(
    (id: string) => {
      if (characters.length <= 1) return;
      const remaining = characters.filter((c) => c.id !== id);
      onCharactersChange(remaining);
      const fallbackChar = remaining[0];
      if (fallbackChar) {
        onNodesChange(
          nodes.map((n) => (n.characterId === id ? { ...n, characterId: fallbackChar.id } : n))
        );
      }
    },
    [characters, nodes, onCharactersChange, onNodesChange]
  );

  const startEditingChar = useCallback((char: Character) => {
    setEditingCharId(char.id);
    setEditingCharName(char.name);
    setEditingCharEmotion(char.defaultEmotion);
  }, []);

  const saveEditingChar = useCallback(() => {
    if (!editingCharId) return;
    handleUpdateCharacter(editingCharId, {
      name: editingCharName.trim() || '角色',
      defaultEmotion: editingCharEmotion,
    });
    setEditingCharId(null);
  }, [editingCharId, editingCharName, editingCharEmotion, handleUpdateCharacter]);

  const handleAutoLayout = useCallback(() => {
    const canvasWidth = canvasWrapRef.current?.clientWidth || 1200;
    const canvasHeight = canvasWrapRef.current?.clientHeight || 800;
    const tree = { characters, nodes, connections, rootNodeId };
    const laidOut = autoLayoutNodes(tree, canvasWidth + 400, canvasHeight + 200);
    onNodesChange(laidOut);
  }, [characters, nodes, connections, rootNodeId, onNodesChange]);

  const renderedConnections = useMemo(() => {
    return connections.map((conn) => {
      const sourceNode = nodes.find((n) => n.id === conn.sourceId);
      const targetNode = nodes.find((n) => n.id === conn.targetId);
      if (!sourceNode || !targetNode) return null;

      const start = getPortPosition(conn.sourceId, conn.sourcePort, nodes);
      const end = getTargetPortPosition(conn.targetId, nodes);
      const path = createBezierPath(start.x, start.y, end.x, end.y);
      const color = EMOTION_COLORS[sourceNode.emotion];

      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      const angle = Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI);

      return {
        id: conn.id,
        path,
        color,
        midX,
        midY,
        angle,
      };
    });
  }, [connections, nodes, getPortPosition, getTargetPortPosition, createBezierPath]);

  const activeNode = activeId ? nodes.find((n) => n.id === activeId) : null;

  return (
    <div className="editor-pane" style={{ width: '100%', height: '100%' }}>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        <div className="canvas-wrap" ref={canvasWrapRef}>
          <div
            className="canvas-inner"
            ref={canvasInnerRef}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onClick={() => setSelectedNodeId(null)}
          >
            <svg className="svg-layer">
              <defs>
                <marker
                  id="arrowhead-neutral"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill={EMOTION_COLORS.neutral} />
                </marker>
                <marker
                  id="arrowhead-angry"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill={EMOTION_COLORS.angry} />
                </marker>
                <marker
                  id="arrowhead-happy"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill={EMOTION_COLORS.happy} />
                </marker>
              </defs>

              {renderedConnections.map((c) =>
                c ? (
                  <g key={c.id}>
                    <path
                      className="connection-path animate-flow"
                      d={c.path}
                      stroke={c.color}
                      markerEnd={`url(#arrowhead-${
                        nodes.find((n) => n.id === connections.find((cc) => cc.id === c.id)?.sourceId)
                          ?.emotion || 'neutral'
                      })`}
                    />
                    <circle cx={c.midX} cy={c.midY} r="0" />
                  </g>
                ) : null
              )}

              {connecting && (
                <path
                  className="connection-path"
                  d={createBezierPath(connecting.startX, connecting.startY, connecting.currentX, connecting.currentY)}
                  stroke={EMOTION_COLORS[nodes.find((n) => n.id === connecting.sourceId)?.emotion || 'neutral']}
                  strokeDasharray="5 5"
                />
              )}
            </svg>

            {nodes.map((node) => (
              <NodeCard
                key={node.id}
                node={node}
                characters={characters}
                selected={selectedNodeId === node.id}
                isDragging={activeId === node.id}
                onUpdate={handleUpdateNode}
                onRemove={handleRemoveNode}
                onPortMouseDown={handlePortMouseDown}
                onTargetPortMouseUp={handleTargetPortMouseUp}
                onTargetPortMouseEnter={setActiveTargetNodeId}
                onTargetPortMouseLeave={() => setActiveTargetNodeId(null)}
                activeTargetNodeId={activeTargetNodeId}
                connectingSourceId={connecting?.sourceId || null}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeNode ? (
            <div className="node-card dragging" style={{ width: NODE_WIDTH, height: NODE_HEIGHT, pointerEvents: 'none' }}>
              <div className="node-header">
                <div
                  className={`avatar-wrap emotion-${activeNode.emotion}`}
                  style={{
                    width: AVATAR_SIZE,
                    height: AVATAR_SIZE,
                    borderColor: EMOTION_COLORS[activeNode.emotion],
                  }}
                >
                  {characters.find((c) => c.id === activeNode.characterId)?.avatar || '👤'}
                </div>
                <div className="node-meta">
                  <div className="character-name">
                    {characters.find((c) => c.id === activeNode.characterId)?.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {EMOTION_LABELS[activeNode.emotion]}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <div className="editor-sidebar">
        <div>
          <div className="sidebar-title">角色管理</div>
          <div className="character-list">
            {characters.map((char) => (
              <div key={char.id} className="character-card">
                <div
                  className={`avatar-wrap emotion-${char.defaultEmotion}`}
                  style={{ borderColor: EMOTION_COLORS[char.defaultEmotion] }}
                >
                  {char.avatar}
                </div>
                {editingCharId === char.id ? (
                  <div className="character-info">
                    <input
                      className="character-name-input"
                      value={editingCharName}
                      onChange={(e) => setEditingCharName(e.target.value)}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                    <select
                      className="character-emotion-select"
                      value={editingCharEmotion}
                      onChange={(e) => setEditingCharEmotion(e.target.value as Emotion)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {(['neutral', 'angry', 'happy'] as Emotion[]).map((em) => (
                        <option key={em} value={em}>
                          {EMOTION_LABELS[em]}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="character-info">
                    <div className="character-name">{char.name}</div>
                    <div style={{ fontSize: 11, color: EMOTION_COLORS[char.defaultEmotion] }}>
                      {EMOTION_LABELS[char.defaultEmotion]}
                    </div>
                  </div>
                )}
                <div className="character-actions">
                  {editingCharId === char.id ? (
                    <button className="icon-btn" onClick={saveEditingChar} title="保存">
                      <Check size={14} />
                    </button>
                  ) : (
                    <button
                      className="icon-btn"
                      onClick={() => startEditingChar(char)}
                      title="编辑"
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                  {characters.length > 1 && (
