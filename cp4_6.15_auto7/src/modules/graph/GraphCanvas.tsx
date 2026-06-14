import React, { useCallback, useRef, useState, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  NodeTypes,
  Handle,
  Position,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  Connection,
  useEdgesState,
  useNodesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Trash2, Edit3 } from 'lucide-react';
import {
  GraphNode as GraphNodeType,
  GraphEdge as GraphEdgeType,
} from '../data/DataManager';

interface CustomNodeProps {
  data: {
    title: string;
    color: string;
    tags: string[];
    isSelected: boolean;
    isDragging: boolean;
    isFaded: boolean;
  };
}

const CustomNode: React.FC<CustomNodeProps> = ({ data }) => {
  return (
    <>
      <Handle type="target" position={Position.Top} />
    <div
      className={`custom-node ${data.isSelected ? 'selected' : ''} ${
        data.isDragging ? 'dragging' : ''
      } ${data.isFaded ? 'faded' : ''}`}
      style={{
        background: `linear-gradient(135deg, ${data.color}dd, ${data.color}99)`,
        border: `2px solid ${data.color}`,
      }}
    >
      <div className="node-title">{data.title}</div>
      {data.tags && data.tags.length > 0 && (
        <div className="node-tags">
          {data.tags.slice(0, 3).map((tag: string) => (
            <span key={tag} className="node-tag">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
    <Handle type="source" position={Position.Bottom} />
    </>
  );
};

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

interface ContextMenuProps {
  x: number;
  y: number;
  type: 'node' | 'edge' | 'canvas';
  itemId: string | null;
  onEdit?: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, type, onEdit, onDelete, onClose }) => {
  useEffect(() => {
    const handleClick = () => onClose();
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  return (
    <div
      className="context-menu"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      {type === 'node' && onEdit && (
        <div className="context-menu-item" onClick={onEdit}>
          <Edit3 size={16} />
          编辑
        </div>
      )}
      <div className="context-menu-item danger" onClick={onDelete}>
        <Trash2 size={16} />
        {type === 'node' ? '删除节点' : type === 'edge' ? '删除连线' : '删除'}
      </div>
    </div>
  );
};

interface EdgeLabelEditorProps {
  label: string;
  edgeId: string;
  onUpdate: (edgeId: string, label: string) => void;
  x: number;
  y: number;
}

const EdgeLabelEditor: React.FC<EdgeLabelEditorProps> = ({ label, edgeId, onUpdate, x, y }) => {
  const [value, setValue] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleBlur = () => {
    onUpdate(edgeId, value.trim() || '相关');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onUpdate(edgeId, value.trim() || '相关');
    } else if (e.key === 'Escape') {
      onUpdate(edgeId, label);
    }
  };

  return (
    <div
      className="edge-label-editor"
      style={{
        position: 'absolute',
        left: x - 50,
        top: y - 15,
      }}
    >
      <input
        ref={inputRef}
        type="text"
        className="edge-label-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};

interface GraphCanvasProps {
  nodes: GraphNodeType[];
  edges: GraphEdgeType[];
  filteredNodeIds: Set<string>;
  selectedNodeId: string | null;
  onNodeClick: (nodeId: string) => void;
  onNodeDelete: (nodeId: string) => void;
  onEdgeDelete: (edgeId: string) => void;
  onEdgeLabelEdit: (edgeId: string, label: string) => void;
  onAddNode: (position: { x: number; y: number }) => void;
  onNodesChange: (nodes: GraphNodeType[]) => void;
  onAddEdge: (source: string, target: string) => void;
}

const GraphCanvasInner: React.FC<GraphCanvasProps> = ({
  nodes,
  edges,
  filteredNodeIds,
  selectedNodeId,
  onNodeClick,
  onNodeDelete,
  onEdgeDelete,
  onEdgeLabelEdit,
  onAddNode,
  onNodesChange,
  onAddEdge,
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowNodes, setReactFlowNodes, onNodesChangeRF] = useNodesState([]);
  const [reactFlowEdges, setReactFlowEdges, onEdgesChangeRF] = useEdgesState([]);
  const { screenToFlowPosition, fitView } = useReactFlow();
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    type: 'node' | 'edge' | 'canvas';
    itemId: string | null;
  } | null>(null);
  const [editingEdgeLabel, setEditingEdgeLabel] = useState<{
    edgeId: string;
    label: string;
    x: number;
    y: number;
  } | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);

  useEffect(() => {
    const flowNodes: Node[] = nodes.map((node) => ({
      id: node.id,
      type: 'custom',
      position: node.position,
      data: {
        title: node.title,
        color: node.color,
        tags: node.tags,
        isSelected: node.id === selectedNodeId,
        isDragging: node.id === draggingNodeId,
        isFaded: filteredNodeIds.size > 0 && !filteredNodeIds.has(node.id),
      },
    }));
    setReactFlowNodes(flowNodes);
  }, [nodes, selectedNodeId, filteredNodeIds, draggingNodeId, setReactFlowNodes]);

  useEffect(() => {
    const flowEdges: Edge[] = edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      type: 'smoothstep',
      animated: edge.animated,
      style: {
        stroke: 'rgba(100, 200, 255, 0.6)',
        strokeWidth: 2,
      },
      labelStyle: {
        fill: '#e8e8e8',
        fontSize: 12,
      },
      labelBgStyle: {
        fill: '#16213e',
      },
      labelBgPadding: [8, 4],
      labelBgBorderRadius: 4,
    }));
    setReactFlowEdges(flowEdges);
  }, [edges, setReactFlowEdges]);

  useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => fitView({ padding: 0.2 }), 100);
    }
  }, [nodes.length, fitView]);

  const handlePaneClick = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.react-flow__node') && 
          !target.closest('.react-flow__edge') &&
          !target.closest('.react-flow__handle')) {
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
        onAddNode(position);
      }
    },
    [screenToFlowPosition, onAddNode]
  );

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeClick(node.id);
    },
    [onNodeClick]
  );

  const handleNodeDragStart = useCallback((_: React.MouseEvent, node: Node) => {
    setDraggingNodeId(node.id);
  }, []);

  const handleNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setDraggingNodeId(null);
      const updatedNodes = nodes.map((n) =>
        n.id === node.id ? { ...n, position: node.position } : n
      );
      onNodesChange(updatedNodes);
    },
    [nodes, onNodesChange]
  );

  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      setContextMenu({
        show: true,
        x: event.clientX,
        y: event.clientY,
        type: 'node',
        itemId: node.id,
      });
    },
    []
  );

  const handleEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault();
      setContextMenu({
        show: true,
        x: event.clientX,
        y: event.clientY,
        type: 'edge',
        itemId: edge.id,
      });
    },
    []
  );

  const handleEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      const rect = reactFlowWrapper.current?.getBoundingClientRect();
      if (!rect) return;

      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      setEditingEdgeLabel({
        edgeId: edge.id,
        label: edge.label as string || '相关',
        x,
        y,
      });
    },
    []
  );

  const handleConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        onAddEdge(params.source, params.target);
      }
    },
    [onAddEdge]
  );

  const handleContextMenuEdit = useCallback(() => {
    if (contextMenu?.type === 'node' && contextMenu.itemId) {
      onNodeClick(contextMenu.itemId);
    }
    setContextMenu(null);
  }, [contextMenu, onNodeClick]);

  const handleContextMenuDelete = useCallback(() => {
    if (contextMenu?.itemId) {
      if (contextMenu.type === 'node') {
        onNodeDelete(contextMenu.itemId);
      } else if (contextMenu.type === 'edge') {
        onEdgeDelete(contextMenu.itemId);
      }
    }
    setContextMenu(null);
  }, [contextMenu, onNodeDelete, onEdgeDelete]);

  const handleContextMenuClose = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleEdgeLabelUpdate = useCallback(
    (edgeId: string, label: string) => {
      onEdgeLabelEdit(edgeId, label);
      setEditingEdgeLabel(null);
    },
    [onEdgeLabelEdit]
  );

  return (
    <div ref={reactFlowWrapper} className="canvas-container">
      <ReactFlow
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
        onNodesChange={onNodesChangeRF}
        onEdgesChange={onEdgesChangeRF}
        onConnect={handleConnect}
        onPaneClick={handlePaneClick}
        onDoubleClick={handleDoubleClick}
        onNodeClick={handleNodeClick}
        onNodeDragStart={handleNodeDragStart}
        onNodeDragStop={handleNodeDragStop}
        onNodeContextMenu={handleNodeContextMenu}
        onEdgeContextMenu={handleEdgeContextMenu}
        onEdgeClick={handleEdgeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.5}
        maxZoom={3}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Lines}
          gap={20}
          size={1}
          color="#2d2d44"
        />
        <Controls
          position="bottom-right"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
          }}
        />
        <MiniMap
          position="bottom-left"
          style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
        }}
        nodeColor={(node) => node.data.color}
        nodeStrokeWidth={3}
        zoomable
        pannable
        />
      </ReactFlow>

      {contextMenu?.show && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          type={contextMenu.type}
          itemId={contextMenu.itemId}
          onEdit={contextMenu.type === 'node' ? handleContextMenuEdit : undefined}
          onDelete={handleContextMenuDelete}
          onClose={handleContextMenuClose}
        />
      )}

      {editingEdgeLabel && (
        <EdgeLabelEditor
          edgeId={editingEdgeLabel.edgeId}
          label={editingEdgeLabel.label}
          onUpdate={handleEdgeLabelUpdate}
          x={editingEdgeLabel.x}
          y={editingEdgeLabel.y}
        />
      )}
    </div>
  );
};

export const GraphCanvas: React.FC<GraphCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <GraphCanvasInner {...props} />
    </ReactFlowProvider>
  );
};
