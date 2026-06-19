import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  MarkerType,
  BaseEdge,
  getBezierPath,
  type EdgeProps,
  type NodeProps,
  type Node,
  type Edge
} from 'reactflow';
import { useGameStore } from '../stores/gameStore';
import type { SceneNode, SceneEdge } from '../types';

const CustomNode = ({ data, selected }: NodeProps) => {
  const nodeData = data as SceneNode & { label: string };
  const setSelectedNode = useGameStore((s) => s.setSelectedNode);
  const updateNode = useGameStore((s) => s.updateNode);
  const [imgError, setImgError] = React.useState(false);
  const hasRules = nodeData.variableRules && nodeData.variableRules.length > 0;

  const handleClick = useCallback(() => {
    setSelectedNode(nodeData.id);
  }, [nodeData.id, setSelectedNode]);

  const handleDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      updateNode(nodeData.id, {
        position: { x: node.position.x, y: node.position.y }
      });
    },
    [nodeData.id, updateNode]
  );

  return (
    <div
      onClick={handleClick}
      onMouseUp={(e) => {
        const target = e.currentTarget.closest('.react-flow__node');
        if (target) {
          const nodeEl = target as HTMLElement;
          const transform = nodeEl.style.transform;
          const match = transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
          if (match) {
            updateNode(nodeData.id, {
              position: { x: parseFloat(match[1]), y: parseFloat(match[2]) }
            });
          }
        }
      }}
      className={`relative w-[180px] rounded-lg shadow-card transition-all duration-300 cursor-pointer overflow-hidden ${
        nodeData.isStart ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-bg-main' : ''
      } ${selected ? 'ring-2 ring-highlight ring-offset-2 ring-offset-bg-main scale-105' : ''}`}
      style={{
        backgroundColor: '#16213e'
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#e94560', border: '2px solid #16213e', width: 12, height: 12 }}
      />

      <div className="w-full overflow-hidden" style={{ width: '160px', height: '90px', margin: '10px auto 0' }}>
        {nodeData.backgroundImageUrl && !imgError ? (
          <img
            src={nodeData.backgroundImageUrl}
            alt="背景预览"
            className="w-full h-full object-cover rounded"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full rounded flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #0f3460 0%, #16213e 50%, #1a1a2e 100%)'
            }}
          >
            <span className="text-2xl opacity-60">🎭</span>
          </div>
        )}
      </div>

      <div className="p-3">
        <h4
          className="text-text-main font-semibold text-sm truncate mb-1"
          style={{
            textShadow: '0 0 12px rgba(233, 69, 96, 0.15), 0 0 24px rgba(233, 69, 96, 0.08)',
            letterSpacing: '0.3px'
          }}
        >
          {nodeData.title || nodeData.label || '未命名场景'}
        </h4>
        <div className="flex items-center gap-2 flex-wrap">
          {nodeData.isStart && (
            <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
              开始
            </span>
          )}
          <span
            className={`inline-block px-2 py-0.5 text-[10px] rounded-full border ${
              hasRules
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
            }`}
          >
            {hasRules ? `${nodeData.variableRules!.length} 规则` : '无逻辑'}
          </span>
        </div>
      </div>

      <div
        className="h-1.5 flex items-center justify-center gap-1.5"
        style={{
          background: 'rgba(26, 26, 46, 0.6)',
          borderTop: '1px solid rgba(15, 52, 96, 0.4)'
        }}
      >
        <span
          className="w-2 h-2 rounded-full transition-all duration-300"
          style={{
            backgroundColor: hasRules ? '#22c55e' : '#64748b',
            boxShadow: hasRules ? '0 0 8px rgba(34, 197, 94, 0.5)' : 'none'
          }}
        />
        <span className="text-[9px] uppercase tracking-wider" style={{ color: hasRules ? '#86efac' : '#94a3b8' }}>
          {hasRules ? 'LOGIC' : 'STATIC'}
        </span>
        <span
          className="w-2 h-2 rounded-full transition-all duration-300"
          style={{
            backgroundColor: hasRules ? '#22c55e' : '#64748b',
            boxShadow: hasRules ? '0 0 8px rgba(34, 197, 94, 0.5)' : 'none'
          }}
        />
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#e94560', border: '2px solid #16213e', width: 12, height: 12 }}
      />
    </div>
  );
};

const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd
}: EdgeProps) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: '#e94560',
          strokeWidth: 2,
          filter: 'drop-shadow(0 0 3px rgba(233, 69, 96, 0.5))'
        }}
      />
      <path
        d={edgePath}
        fill="none"
        stroke="#e94560"
        strokeWidth={2}
        strokeDasharray="5 5"
        className="animate-flow-dash"
        style={{
          pointerEvents: 'none',
          opacity: 0.7
        }}
      />
    </>
  );
};

const EditorCanvas: React.FC = () => {
  const story = useGameStore((s) => s.story);
  const setSelectedNode = useGameStore((s) => s.setSelectedNode);
  const updateNode = useGameStore((s) => s.updateNode);
  const addEdgeToStore = useGameStore((s) => s.addEdge);

  const nodes: Node[] = useMemo(() => {
    if (!story) return [];
    return story.nodes.map((node: SceneNode) => ({
      id: node.id,
      type: 'custom',
      position: node.position,
      data: {
        ...node,
        label: node.title
      }
    }));
  }, [story]);

  const edges: Edge[] = useMemo(() => {
    if (!story) return [];
    return story.edges.map((edge: SceneEdge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'custom',
      animated: true,
      label: edge.label,
      data: edge,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#e94560'
      }
    }));
  }, [story]);

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(nodes);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(edges);

  React.useEffect(() => {
    setRfNodes(nodes);
  }, [nodes, setRfNodes]);

  React.useEffect(() => {
    setRfEdges(edges);
  }, [edges, setRfEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        setRfEdges((eds) => {
          const newEdges = addEdge(
            {
              ...params,
              type: 'custom',
              animated: true,
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#e94560'
              }
            },
            eds
          );
          addEdgeToStore({
            source: params.source!,
            target: params.target!,
            label: '新选项',
            conditions: []
          });
          return newEdges;
        });
      }
    },
    [setRfEdges, addEdgeToStore]
  );

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      updateNode(node.id, {
        position: { x: node.position.x, y: node.position.y }
      });
    },
    [updateNode]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node.id);
    },
    [setSelectedNode]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);
  const edgeTypes = useMemo(() => ({ custom: CustomEdge }), []);

  const defaultEdgeOptions = useMemo(
    () => ({
      type: 'custom',
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#e94560'
      }
    }),
    []
  );

  return (
    <div className="w-full h-full bg-bg-main rounded-lg overflow-hidden">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onlyRenderVisibleElements={true}
        proOptions={{ hideAttribution: true }}
        fitView
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          color="rgba(160, 160, 176, 0.3)"
        />
        <Controls
          className="!bg-bg-card"
          position="bottom-right"
        />
        <MiniMap
          nodeColor="#e94560"
          maskColor="rgba(15, 52, 96, 0.5)"
          position="bottom-right"
          style={{
            background: '#16213e',
            borderRadius: '8px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            marginBottom: '60px'
          }}
        />
      </ReactFlow>
    </div>
  );
};

export default EditorCanvas;
