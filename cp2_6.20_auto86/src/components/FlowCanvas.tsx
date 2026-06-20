import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node as FlowNode,
  type Edge as FlowEdge,
  type Connection,
  type NodeMouseHandler,
  type EdgeMouseHandler,
  type ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import useFlowStore from '../store/useFlowStore';
import socketClient from '../socket/socketClient';

interface FlowCanvasProps {
  onZoomChange?: (zoom: number) => void;
}

const FlowCanvas: React.FC<FlowCanvasProps> = ({ onZoomChange }) => {
  const {
    nodes: storeNodes,
    edges: storeEdges,
    selectedNodeId,
    selectNode,
    selectEdge,
    updateNodePosition,
    addEdge: addEdgeToStore,
    setZoomLevel,
  } = useFlowStore();

  const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const lastPositionRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const dragThrottleRef = useRef<number | null>(null);

  useEffect(() => {
    setNodes(storeNodes.map(n => ({ ...n, selected: n.id === selectedNodeId })));
  }, [storeNodes, selectedNodeId, setNodes]);

  useEffect(() => {
    setEdges(storeEdges);
  }, [storeEdges, setEdges]);

  useEffect(() => {
    const handleNodeAdd = (data: any) => {
      const { node, parentId } = data;
      useFlowStore.getState().setNodes([
        ...useFlowStore.getState().nodes,
        {
          id: node.id,
          type: 'default',
          position: { x: node.x, y: node.y },
          data: {
            label: node.title,
            title: node.title,
            note: node.note,
            color: node.color,
            fontSize: node.fontSize,
            parentId,
          },
          style: {
            backgroundColor: node.color,
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: `${node.fontSize}px`,
            color: '#1f2937',
            textAlign: 'center' as const,
            minWidth: '120px',
            transition: 'background-color 200ms ease, border-color 200ms ease, box-shadow 200ms ease',
          },
        },
      ]);

      if (parentId) {
        useFlowStore.getState().setEdges([
          ...useFlowStore.getState().edges,
          {
            id: `e-${parentId}-${node.id}`,
            source: parentId,
            target: node.id,
            type: 'smoothstep',
            animated: false,
            style: { stroke: '#d1d5db', strokeWidth: 2 },
          },
        ]);
      }
    };

    const handleNodeUpdate = (data: any) => {
      const { nodeId, updates } = data;
      useFlowStore.getState().setNodes(
        useFlowStore.getState().nodes.map((node) => {
          if (node.id !== nodeId) return node;
          return {
            ...node,
            position: {
              x: updates.x !== undefined ? updates.x : node.position.x,
              y: updates.y !== undefined ? updates.y : node.position.y,
            },
            data: {
              ...node.data,
              title: updates.title !== undefined ? updates.title : node.data.title,
              label: updates.title !== undefined ? updates.title : node.data.label,
              note: updates.note !== undefined ? updates.note : node.data.note,
              color: updates.color !== undefined ? updates.color : node.data.color,
              fontSize: updates.fontSize !== undefined ? updates.fontSize : node.data.fontSize,
            },
            style: {
              ...node.style,
              backgroundColor: updates.color || node.style?.backgroundColor,
              fontSize: updates.fontSize ? `${updates.fontSize}px` : node.style?.fontSize,
            },
          };
        })
      );
    };

    const handleNodeDelete = (data: any) => {
      const { nodeId } = data;
      const state = useFlowStore.getState();
      useFlowStore.getState().setNodes(state.nodes.filter((n) => n.id !== nodeId));
      useFlowStore.getState().setEdges(
        state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId)
      );
    };

    const handleNodePosition = (data: any) => {
      const { nodeId, x, y } = data;
      useFlowStore.getState().setNodes(
        useFlowStore.getState().nodes.map((node) =>
          node.id === nodeId ? { ...node, position: { x, y } } : node
        )
      );
    };

    const handleEdgeAdd = (data: any) => {
      const { source, target } = data;
      const state = useFlowStore.getState();
      const edgeExists = state.edges.some(
        (e) => e.source === source && e.target === target
      );
      if (!edgeExists) {
        useFlowStore.getState().setEdges([
          ...state.edges,
          {
            id: `e-${source}-${target}`,
            source,
            target,
            type: 'smoothstep',
            animated: false,
            style: { stroke: '#d1d5db', strokeWidth: 2 },
          },
        ]);
      }
    };

    const handleEdgeDelete = (data: any) => {
      const { edgeId } = data;
      useFlowStore.getState().setEdges(
        useFlowStore.getState().edges.filter((e) => e.id !== edgeId)
      );
    };

    socketClient.on('node:add', handleNodeAdd);
    socketClient.on('node:update', handleNodeUpdate);
    socketClient.on('node:delete', handleNodeDelete);
    socketClient.on('node:position', handleNodePosition);
    socketClient.on('edge:add', handleEdgeAdd);
    socketClient.on('edge:delete', handleEdgeDelete);

    return () => {
      window.removeEventListener('mindmap:node:add', handleNodeAdd as any);
      window.removeEventListener('mindmap:node:update', handleNodeUpdate as any);
      window.removeEventListener('mindmap:node:delete', handleNodeDelete as any);
      window.removeEventListener('mindmap:node:position', handleNodePosition as any);
      window.removeEventListener('mindmap:edge:add', handleEdgeAdd as any);
      window.removeEventListener('mindmap:edge:delete', handleEdgeDelete as any);
    };
  }, []);

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        addEdgeToStore(params.source, params.target);
      }
    },
    [addEdgeToStore]
  );

  const handleNodeClick: NodeMouseHandler = useCallback(
    (event, node) => {
      event.stopPropagation();
      selectNode(node.id);
      setContextMenu(null);
    },
    [selectNode]
  );

  const handleEdgeClick: EdgeMouseHandler = useCallback(
    (event, edge) => {
      event.stopPropagation();
      selectEdge(edge.id);
      setContextMenu(null);
    },
    [selectEdge]
  );

  const handlePaneClick = useCallback(() => {
    selectNode(null);
    selectEdge(null);
    setContextMenu(null);
  }, [selectNode, selectEdge]);

  const handleNodeContextMenu: NodeMouseHandler = useCallback(
    (event, node) => {
      event.preventDefault();
      event.stopPropagation();
      setContextMenu({ x: event.clientX, y: event.clientY, nodeId: node.id });
      selectNode(node.id);
    },
    [selectNode]
  );

  const handleContextMenuItemClick = (action: string) => {
    if (!contextMenu) return;
    const { nodeId } = contextMenu;

    switch (action) {
      case 'addChild':
        useFlowStore.getState().addNode(nodeId);
        break;
      case 'delete':
        useFlowStore.getState().deleteNode(nodeId);
        break;
      case 'duplicate':
        const node = useFlowStore.getState().nodes.find((n) => n.id === nodeId);
        if (node) {
          useFlowStore.getState().addNode(node.data.parentId);
        }
        break;
    }
    setContextMenu(null);
  };

  const handleNodeDragStart: NodeMouseHandler = useCallback((event, node) => {
    isDraggingRef.current = true;
    lastPositionRef.current.set(node.id, { x: node.position.x, y: node.position.y });
  }, []);

  const handleNodeDrag: NodeMouseHandler = useCallback(
    (event, node) => {
      if (!isDraggingRef.current) return;

      const lastPos = lastPositionRef.current.get(node.id);
      if (!lastPos) {
        lastPositionRef.current.set(node.id, { x: node.position.x, y: node.position.y });
        return;
      }

      const dx = Math.abs(node.position.x - lastPos.x);
      const dy = Math.abs(node.position.y - lastPos.y);

      if (dx > 2 || dy > 2) {
        lastPositionRef.current.set(node.id, { x: node.position.x, y: node.position.y });

        if (dragThrottleRef.current) {
          cancelAnimationFrame(dragThrottleRef.current);
        }

        dragThrottleRef.current = requestAnimationFrame(() => {
          updateNodePosition(node.id, node.position.x, node.position.y);
          dragThrottleRef.current = null;
        });
      }
    },
    [updateNodePosition]
  );

  const handleNodeDragStop: NodeMouseHandler = useCallback((event, node) => {
    isDraggingRef.current = false;
    lastPositionRef.current.delete(node.id);

    if (dragThrottleRef.current) {
      cancelAnimationFrame(dragThrottleRef.current);
      dragThrottleRef.current = null;
    }
  }, []);

  const handleMoveEnd = useCallback(() => {
    if (reactFlowInstance) {
      const zoom = reactFlowInstance.getZoom();
      setZoomLevel(zoom);
      onZoomChange?.(zoom);
    }
  }, [reactFlowInstance, setZoomLevel, onZoomChange]);

  const handleInit = useCallback((instance: ReactFlowInstance) => {
    setReactFlowInstance(instance);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenu && wrapperRef.current) {
        const menu = document.getElementById('node-context-menu');
        if (menu && !menu.contains(e.target as unknown as HTMLElement)) {
          setContextMenu(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [contextMenu]);

  return (
    <div ref={wrapperRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onPaneClick={handlePaneClick}
        onNodeContextMenu={handleNodeContextMenu}
        onNodeDragStart={handleNodeDragStart}
        onNodeDrag={handleNodeDrag}
        onNodeDragStop={handleNodeDragStop}
        onMoveEnd={handleMoveEnd}
        onInit={handleInit}
        fitView
        minZoom={0.2}
        maxZoom={3.0}
        panOnDrag={false}
        selectionOnDrag={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#e5e7eb" gap={16} />
        <MiniMap
          nodeStrokeColor="#6366f1"
          nodeColor="#ffffff"
          maskColor="rgba(0, 0, 0, 0.1)"
          style={{ border: '1px solid #e5e7eb', borderRadius: '8px' }}
        />
        <Controls showInteractive={false} position="bottom-left" />
      </ReactFlow>

      {contextMenu && (
        <div
          id="node-context-menu"
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            padding: '4px',
            zIndex: 1000,
            minWidth: '140px',
          }}
        >
          <div
            onClick={() => handleContextMenuItemClick('addChild')}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#374151',
              transition: 'background-color 150ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#eef2ff')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            添加子节点
          </div>
          <div
            onClick={() => handleContextMenuItemClick('duplicate')}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#374151',
              transition: 'background-color 150ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#eef2ff')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            复制节点
          </div>
          <div
            onClick={() => handleContextMenuItemClick('delete')}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#ef4444',
              transition: 'background-color 150ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#eef2ff')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            删除节点
          </div>
        </div>
      )}
    </div>
  );
};

export default FlowCanvas;
