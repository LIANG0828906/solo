import React, { useCallback, useRef, useState, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  useReactFlow,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useMindmapStore } from '../store/mindmapStore';
import CustomNode from './CustomNode';
import { MindmapNode } from '../types';

const nodeTypes = {
  custom: CustomNode,
};

interface MindmapCanvasInnerProps {
  onAddTask: (nodeId: string) => void;
  onNodeSelect: (nodeId: string) => void;
}

const MindmapCanvasInner: React.FC<MindmapCanvasInnerProps> = ({ onAddTask, onNodeSelect }) => {
  const {
    nodes: storeNodes,
    selectedNodeId,
    setSelectedNode,
    addNode,
    updateNode,
    deleteNode,
    setSelectedEdge,
    selectedEdgeId,
    getEdges,
  } = useMindmapStore();

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowInstance = useReactFlow();

  const [creatingNode, setCreatingNode] = useState<{ x: number; y: number } | null>(null);
  const [newNodeTitle, setNewNodeTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (creatingNode && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [creatingNode]);

  useEffect(() => {
    const rfNodes: Node[] = storeNodes.map((node) => ({
      id: node.id,
      type: 'custom',
      position: { x: node.position_x, y: node.position_y },
      data: {
        label: node.title,
        nodeId: node.id,
        onAddTask,
      },
      selected: node.id === selectedNodeId,
    }));
    setNodes(rfNodes);
  }, [storeNodes, selectedNodeId, onAddTask, setNodes]);

  useEffect(() => {
    const edgeData = getEdges();
    const rfEdges: Edge[] = edgeData.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      style: {
        stroke: edge.id === selectedEdgeId ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)',
        strokeWidth: 1.5,
      },
      animated: false,
    }));
    setEdges(rfEdges);
  }, [getEdges, selectedEdgeId, setEdges]);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, [setSelectedNode, setSelectedEdge]);

  const handlePaneDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        !target.closest('.react-flow__node') &&
        !target.closest('.react-flow__edge') &&
        !target.closest('.react-flow__controls') &&
        !target.closest('.react-flow__minimap')
      ) {
        if (!reactFlowWrapper.current) return;
        const bounds = reactFlowWrapper.current.getBoundingClientRect();
        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
        });
        setCreatingNode({ x: position.x, y: position.y });
        setNewNodeTitle('');
      }
    },
    [reactFlowInstance]
  );

  const confirmCreateNode = useCallback(() => {
    if (!creatingNode || !newNodeTitle.trim()) {
      setCreatingNode(null);
      setNewNodeTitle('');
      return;
    }

    const id = `node-${Date.now()}`;
    const newNode: MindmapNode = {
      id,
      title: newNodeTitle.trim(),
      description: '',
      position_x: creatingNode.x,
      position_y: creatingNode.y,
      parent_id: null,
    };
    addNode(newNode);
    setCreatingNode(null);
    setNewNodeTitle('');
    setSelectedNode(id);
    onNodeSelect(id);
  }, [creatingNode, newNodeTitle, addNode, setSelectedNode, onNodeSelect]);

  const cancelCreateNode = useCallback(() => {
    setCreatingNode(null);
    setNewNodeTitle('');
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        confirmCreateNode();
      } else if (e.key === 'Escape') {
        cancelCreateNode();
      }
    },
    [confirmCreateNode, cancelCreateNode]
  );

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      updateNode(node.id, {
        position_x: node.position.x,
        position_y: node.position.y,
      });
    },
    [updateNode]
  );

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node.id);
      onNodeSelect(node.id);
    },
    [setSelectedNode, onNodeSelect]
  );

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      setSelectedEdge(edge.id);
    },
    [setSelectedEdge]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target && params.source !== params.target) {
        updateNode(params.target, { parent_id: params.source });
      }
    },
    [updateNode]
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          deleteNode(selectedNodeId);
        }
      }
    },
    [selectedNodeId, deleteNode]
  );

  return (
    <div
      ref={reactFlowWrapper}
      style={{ width: '100%', height: '100%', position: 'relative' }}
      onKeyDown={onKeyDown}
      onDoubleClick={handlePaneDoubleClick}
      tabIndex={0}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={handleNodeClick}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.3}
        maxZoom={3}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Lines}
          gap={20}
          size={1}
          color="rgba(255,255,255,0.06)"
        />
        <Controls
          style={{
            backgroundColor: 'rgba(30,30,46,0.9)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
          }}
        />
      </ReactFlow>

      {creatingNode && (
        <div
          style={{
            position: 'absolute',
            left: creatingNode.x,
            top: creatingNode.y,
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={newNodeTitle}
            onChange={(e) => setNewNodeTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={cancelCreateNode}
            placeholder="输入节点标题..."
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1.5px solid #3b82f6',
              backgroundColor: '#2a2a3e',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
              minWidth: '150px',
              boxShadow: '0 0 8px 2px rgba(59,130,246,0.4)',
            }}
          />
        </div>
      )}
    </div>
  );
};

const MindmapCanvas: React.FC<{
  onAddTask: (nodeId: string) => void;
  onNodeClick: (nodeId: string) => void;
}> = ({ onAddTask, onNodeClick }) => {
  return (
    <ReactFlowProvider>
      <MindmapCanvasInner onAddTask={onAddTask} onNodeSelect={onNodeClick} />
    </ReactFlowProvider>
  );
};

export default MindmapCanvas;
