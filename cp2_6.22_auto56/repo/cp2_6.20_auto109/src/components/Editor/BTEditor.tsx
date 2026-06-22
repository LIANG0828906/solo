import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useGameStore } from '@/store/useGameStore';
import {
  NODE_CONFIGS,
  CONDITION_OPTIONS,
  ACTION_OPTIONS,
  TARGET_OPTIONS,
  type NodeType,
  type BTNode,
  type ConditionType,
  type ActionType,
} from '@/modules/behavior-tree';

const MAX_NODES = 20;
const NODE_WIDTH = 120;
const NODE_HEIGHT = 50;
const CONDITION_NODE_SIZE = 80;
const ACTION_NODE_WIDTH = 120;
const ACTION_NODE_HEIGHT = 50;

interface NodeDragState {
  nodeId: string;
  offsetX: number;
  offsetY: number;
}

interface ConnectionDragState {
  startNodeId: string;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  nodeId: string;
}

export default function BTEditor() {
  const {
    behaviorTrees,
    currentTreeId,
    selectedNodeId,
    addNode,
    selectNode,
    moveNode,
    connectNodes,
    disconnectNodes,
    removeNode,
    updateNode,
    setRootNode,
  } = useGameStore();

  const canvasRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const pendingPosRef = useRef<{ x: number; y: number } | null>(null);
  const nodeDragRef = useRef<NodeDragState | null>(null);
  const connectionDragRef = useRef<ConnectionDragState | null>(null);

  const [, forceUpdate] = useState(0);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    nodeId: '',
  });
  const [draggingNodePos, setDraggingNodePos] = useState<Record<string, { x: number; y: number }>>({});

  const currentTree = useMemo(
    () => behaviorTrees.find((t) => t.id === currentTreeId),
    [behaviorTrees, currentTreeId]
  );

  const nodes = currentTree?.nodes ?? {};
  const nodeCount = Object.keys(nodes).length;
  const selectedNode = selectedNodeId ? nodes[selectedNodeId] ?? null : null;

  const conditionOptionsWithCustom = useMemo(
    () => [...CONDITION_OPTIONS, { value: 'custom', label: '自定义...' }],
    []
  );

  const actionOptionsWithCustom = useMemo(
    () => [...ACTION_OPTIONS, { value: 'custom', label: '自定义...' }],
    []
  );

  const isCustomCondition = useMemo(() => {
    if (!selectedNode || selectedNode.type !== 'condition') return false;
    const condition = selectedNode.condition;
    if (!condition) return true;
    return !CONDITION_OPTIONS.some((opt) => opt.value === condition);
  }, [selectedNode]);

  const isCustomAction = useMemo(() => {
    if (!selectedNode || selectedNode.type !== 'action') return false;
    const actionType = selectedNode.actionType;
    if (!actionType) return true;
    return !ACTION_OPTIONS.some((opt) => opt.value === actionType);
  }, [selectedNode]);

  const getNodeSize = useCallback((type: NodeType) => {
    switch (type) {
      case 'condition':
        return { width: CONDITION_NODE_SIZE, height: CONDITION_NODE_SIZE };
      case 'action':
        return { width: ACTION_NODE_WIDTH, height: ACTION_NODE_HEIGHT };
      default:
        return { width: NODE_WIDTH, height: NODE_HEIGHT };
    }
  }, []);

  const getOutputPortPos = useCallback(
    (node: BTNode) => {
      const { width, height } = getNodeSize(node.type);
      return {
        x: node.position.x + width,
        y: node.position.y + height / 2,
      };
    },
    [getNodeSize]
  );

  const getInputPortPos = useCallback(
    (node: BTNode) => {
      const { height } = getNodeSize(node.type);
      return {
        x: node.position.x,
        y: node.position.y + height / 2,
      };
    },
    [getNodeSize]
  );

  const createBezierPath = useCallback(
    (x1: number, y1: number, x2: number, y2: number) => {
      const dx = Math.abs(x2 - x1);
      const ctrlOffset = Math.max(dx * 0.5, 50);
      return `M ${x1} ${y1} C ${x1 + ctrlOffset} ${y1}, ${x2 - ctrlOffset} ${y2}, ${x2} ${y2}`;
    },
    []
  );

  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: clientX - rect.left + canvasRef.current.scrollLeft,
      y: clientY - rect.top + canvasRef.current.scrollTop,
    };
  }, []);

  const handleToolDragStart = (e: React.DragEvent, type: NodeType) => {
    if (nodeCount >= MAX_NODES) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('nodeType', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const nodeType = e.dataTransfer.getData('nodeType') as NodeType;
    if (!nodeType || nodeCount >= MAX_NODES) return;

    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    addNode(nodeType, { x: Math.max(0, x - NODE_WIDTH / 2), y: Math.max(0, y - NODE_HEIGHT / 2) });
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    const node = nodes[nodeId];
    if (!node) return;

    selectNode(nodeId);

    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    nodeDragRef.current = {
      nodeId,
      offsetX: x - node.position.x,
      offsetY: y - node.position.y,
    };
  };

  const handleOutputPortMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    e.preventDefault();

    const node = nodes[nodeId];
    if (!node || !NODE_CONFIGS[node.type].hasChildren) return;

    const pos = getOutputPortPos(node);
    connectionDragRef.current = {
      startNodeId: nodeId,
      startX: pos.x,
      startY: pos.y,
      currentX: pos.x,
      currentY: pos.y,
    };
    forceUpdate((n) => n + 1);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (nodeDragRef.current) {
        const { x, y } = getCanvasCoords(e.clientX, e.clientY);
        const newX = Math.max(0, x - nodeDragRef.current.offsetX);
        const newY = Math.max(0, y - nodeDragRef.current.offsetY);

        pendingPosRef.current = { x: newX, y: newY };

        if (rafRef.current === null) {
          rafRef.current = requestAnimationFrame(() => {
            if (pendingPosRef.current && nodeDragRef.current) {
              const nid = nodeDragRef.current.nodeId;
              const pos = pendingPosRef.current;
              setDraggingNodePos((prev) => ({ ...prev, [nid]: pos }));
            }
            rafRef.current = null;
          });
        }
      }

      if (connectionDragRef.current) {
        const { x, y } = getCanvasCoords(e.clientX, e.clientY);
        connectionDragRef.current.currentX = x;
        connectionDragRef.current.currentY = y;
        forceUpdate((n) => n + 1);
      }
    },
    [getCanvasCoords]
  );

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (nodeDragRef.current) {
        const nodeId = nodeDragRef.current.nodeId;
        let position: { x: number; y: number } | null = null;

        if (pendingPosRef.current) {
          position = pendingPosRef.current;
        } else if (draggingNodePos[nodeId]) {
          position = draggingNodePos[nodeId];
        } else if (nodes[nodeId]) {
          position = nodes[nodeId].position;
        }

        if (position) {
          moveNode(nodeId, position);
        }

        nodeDragRef.current = null;
        pendingPosRef.current = null;
        setDraggingNodePos((prev) => {
          if (!(nodeId in prev)) return prev;
          const next = { ...prev };
          delete next[nodeId];
          return next;
        });
      }

      if (connectionDragRef.current) {
        const target = e.target as HTMLElement;
        const portEl = target.closest('.node-port.port-input');
        if (portEl) {
          const nodeEl = portEl.closest('.bt-node');
          if (nodeEl) {
            const targetId = nodeEl.getAttribute('data-node-id');
            const startId = connectionDragRef.current.startNodeId;
            if (targetId && targetId !== startId) {
              const parent = nodes[startId];
              const child = nodes[targetId];
              if (parent && child && NODE_CONFIGS[parent.type].hasChildren) {
                if (!parent.children?.includes(targetId)) {
                  connectNodes(startId, targetId);
                }
              }
            }
          }
        }
        connectionDragRef.current = null;
        forceUpdate((n) => n + 1);
      }
    },
    [nodes, connectNodes, moveNode]
  );

  const handleCanvasClick = () => {
    selectNode(null);
    setContextMenu({ visible: false, x: 0, y: 0, nodeId: '' });
  };

  const handleNodeContextMenu = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    selectNode(nodeId);
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      nodeId,
    });
  };

  const handleDeleteNode = () => {
    if (contextMenu.nodeId) {
      removeNode(contextMenu.nodeId);
    }
    setContextMenu({ visible: false, x: 0, y: 0, nodeId: '' });
  };

  const handleSetRootNode = () => {
    if (contextMenu.nodeId) {
      setRootNode(contextMenu.nodeId);
    }
    setContextMenu({ visible: false, x: 0, y: 0, nodeId: '' });
  };

  const handleConnectionClick = (parentId: string, childId: string) => {
    disconnectNodes(parentId, childId);
  };

  const handleNameChange = (value: string) => {
    if (selectedNodeId) {
      updateNode(selectedNodeId, { name: value });
    }
  };

  const handleConditionChange = (value: string) => {
    if (selectedNodeId) {
      if (value === 'custom') {
        updateNode(selectedNodeId, { condition: '' as ConditionType });
      } else {
        updateNode(selectedNodeId, { condition: value as ConditionType });
      }
    }
  };

  const handleCustomConditionChange = (value: string) => {
    if (selectedNodeId) {
      updateNode(selectedNodeId, { condition: value as ConditionType });
    }
  };

  const handleActionTypeChange = (value: string) => {
    if (selectedNodeId) {
      if (value === 'custom') {
        updateNode(selectedNodeId, { actionType: '' as ActionType });
      } else {
        updateNode(selectedNodeId, { actionType: value as ActionType });
      }
    }
  };

  const handleCustomActionChange = (value: string) => {
    if (selectedNodeId) {
      updateNode(selectedNodeId, { actionType: value as ActionType });
    }
  };

  const handleTargetTypeChange = (value: string) => {
    if (selectedNodeId) {
      updateNode(selectedNodeId, { targetType: value as BTNode['targetType'] });
    }
  };

  useEffect(() => {
    const handleGlobalClick = () => {
      setContextMenu({ visible: false, x: 0, y: 0, nodeId: '' });
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const connections = useMemo(() => {
    const result: Array<{ parentId: string; childId: string; path: string }> = [];

    Object.values(nodes).forEach((node) => {
      const effectiveNode = draggingNodePos[node.id]
        ? { ...node, position: draggingNodePos[node.id] }
        : node;
      if (effectiveNode.children && effectiveNode.children.length > 0) {
        const startPos = getOutputPortPos(effectiveNode);
        effectiveNode.children.forEach((childId) => {
          const child = nodes[childId];
          if (child) {
            const effectiveChild = draggingNodePos[child.id]
              ? { ...child, position: draggingNodePos[child.id] }
              : child;
            const endPos = getInputPortPos(effectiveChild);
            result.push({
              parentId: effectiveNode.id,
              childId,
              path: createBezierPath(startPos.x, startPos.y, endPos.x, endPos.y),
            });
          }
        });
      }
    });

    return result;
  }, [nodes, draggingNodePos, getOutputPortPos, getInputPortPos, createBezierPath]);

  const renderNode = (node: BTNode) => {
    const isSelected = selectedNodeId === node.id;
    const isRoot = currentTree?.rootId === node.id;
    const config = NODE_CONFIGS[node.type];
    const { width, height } = getNodeSize(node.type);
    const pos = draggingNodePos[node.id] ?? node.position;

    return (
      <div
        key={node.id}
        data-node-id={node.id}
        className={`bt-node ${node.type} ${isSelected ? 'selected' : ''}`}
        style={{ left: pos.x, top: pos.y, width, height }}
        onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
        onContextMenu={(e) => handleNodeContextMenu(e, node.id)}
      >
        {isRoot && (
          <div
            style={{
              position: 'absolute',
              top: -20,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '10px',
              color: '#ffa940',
              whiteSpace: 'nowrap',
            }}
          >
            根节点
          </div>
        )}
        <span style={{ fontSize: '11px', textAlign: 'center', padding: '0 4px' }}>{node.name}</span>

        <div className="node-port port-input" />

        {config.hasChildren && (
          <div
            className="node-port port-output"
            onMouseDown={(e) => handleOutputPortMouseDown(e, node.id)}
          />
        )}
      </div>
    );
  };

  const renderPropertiesPanel = () => {
    if (!selectedNode) {
      return (
        <div className="properties-panel">
          <h3>属性面板</h3>
          <p style={{ color: '#666', fontSize: '12px' }}>请选择一个节点</p>
        </div>
      );
    }

    return (
      <div className="properties-panel">
        <h3>属性面板</h3>

        <div className="prop-row">
          <label>节点名称</label>
          <input type="text" value={selectedNode.name} onChange={(e) => handleNameChange(e.target.value)} />
        </div>

        <div className="prop-row">
          <label>节点类型</label>
          <input type="text" value={NODE_CONFIGS[selectedNode.type].name} disabled />
        </div>

        {selectedNode.type === 'condition' && (
          <>
            <div className="prop-row">
              <label>条件类型</label>
              <select
                value={isCustomCondition ? 'custom' : selectedNode.condition || ''}
                onChange={(e) => handleConditionChange(e.target.value)}
              >
                {conditionOptionsWithCustom.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {isCustomCondition && (
              <div className="prop-row">
                <label>自定义条件</label>
                <input
                  type="text"
                  value={selectedNode.condition || ''}
                  onChange={(e) => handleCustomConditionChange(e.target.value)}
                  placeholder="请输入自定义条件值"
                />
              </div>
            )}
          </>
        )}

        {selectedNode.type === 'action' && (
          <>
            <div className="prop-row">
              <label>行动类型</label>
              <select
                value={isCustomAction ? 'custom' : selectedNode.actionType || ''}
                onChange={(e) => handleActionTypeChange(e.target.value)}
              >
                {actionOptionsWithCustom.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {isCustomAction && (
              <div className="prop-row">
                <label>自定义行动</label>
                <input
                  type="text"
                  value={selectedNode.actionType || ''}
                  onChange={(e) => handleCustomActionChange(e.target.value)}
                  placeholder="请输入自定义行动值"
                />
              </div>
            )}
            <div className="prop-row">
              <label>目标类型</label>
              <select
                value={selectedNode.targetType || ''}
                onChange={(e) => handleTargetTypeChange(e.target.value)}
              >
                {TARGET_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <div className="prop-row">
          <label>位置</label>
          <span style={{ fontSize: '12px', color: '#a0a0a0' }}>
            X: {Math.round(selectedNode.position.x)}, Y: {Math.round(selectedNode.position.y)}
          </span>
        </div>
      </div>
    );
  };

  const connDrag = connectionDragRef.current;

  return (
    <div className="bt-editor" style={{ display: 'flex', height: '100%', width: '100%' }}>
      <div className="sidebar" style={{ width: '220px' }}>
        <div className="node-tool-panel">
          <h3>节点工具</h3>
          <div className="node-count">
            节点数量: {nodeCount} / {MAX_NODES}
          </div>
          {(Object.keys(NODE_CONFIGS) as NodeType[]).map((type) => {
            const config = NODE_CONFIGS[type];
            const isDisabled = nodeCount >= MAX_NODES;
            return (
              <div
                key={type}
                className={`node-card ${type}`}
                draggable={!isDisabled}
                onDragStart={(e) => handleToolDragStart(e, type)}
                style={{ opacity: isDisabled ? 0.5 : 1, cursor: isDisabled ? 'not-allowed' : 'grab' }}
              >
                {config.name}
              </div>
            );
          })}
        </div>
        {renderPropertiesPanel()}
      </div>

      <div
        className="bt-canvas-container"
        ref={canvasRef}
        onDragOver={handleCanvasDragOver}
        onDrop={handleCanvasDrop}
        onClick={handleCanvasClick}
      >
        <div className="bt-canvas">
          <svg className="connection-svg">
            {connections.map(({ parentId, childId, path }) => (
              <path
                key={`${parentId}-${childId}`}
                d={path}
                onClick={() => handleConnectionClick(parentId, childId)}
                style={{ pointerEvents: 'stroke' }}
              />
            ))}
            {connDrag && (
              <path
                d={createBezierPath(connDrag.startX, connDrag.startY, connDrag.currentX, connDrag.currentY)}
                strokeDasharray="5,5"
                opacity={0.6}
              />
            )}
          </svg>
          {Object.values(nodes).map(renderNode)}
        </div>
      </div>

      {contextMenu.visible && (
        <div
          className="right-click-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="menu-item" onClick={handleSetRootNode}>
            设为根节点
          </div>
          <div className="menu-item danger" onClick={handleDeleteNode}>
            删除节点
          </div>
        </div>
      )}
    </div>
  );
}
