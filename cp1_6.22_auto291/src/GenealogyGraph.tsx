import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Handle,
  Position,
  NodeProps,
  MarkerType,
  useNodesState,
  useEdgesState,
} from 'react-flow-renderer';
import { GenealogyNode, GenealogyEdge } from './FileGenealogy';
import { FileItem } from './fileData';

interface GenealogyGraphProps {
  genealogyNodes: GenealogyNode[];
  genealogyEdges: GenealogyEdge[];
  files: FileItem[];
  selectedNodeId: string | null;
  highlightedNodeIds: Set<string> | null;
  onNodeClick: (nodeId: string) => void;
  onNodeDoubleClick: (nodeId: string) => void;
}

const getGenerationColor = (generation: number): string => {
  switch (generation) {
    case 0:
      return '#FDE68A';
    case 1:
      return '#93C5FD';
    case 2:
      return '#A7F3D0';
    default:
      return '#C4B5FD';
  }
};

const getEdgeWidth = (similarity: number): number => {
  const minWidth = 1;
  const maxWidth = 4;
  const normalized = (similarity - 0.5) / 0.5;
  return minWidth + normalized * (maxWidth - minWidth);
};

const getEdgeColor = (similarity: number): string => {
  const r1 = 148, g1 = 163, b1 = 184;
  const r2 = 99, g2 = 102, b2 = 241;
  const t = (similarity - 0.5) / 0.5;
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${b})`;
};

interface CustomNodeData {
  label: string;
  generation: number;
  fileType: string;
  isHighlighted: boolean;
  isDimmed: boolean;
}

const CustomNode: React.FC<NodeProps<CustomNodeData>> = ({ data, selected }) => {
  const bgColor = getGenerationColor(data.generation);
  
  return (
    <div
      className={`genealogy-node ${selected ? 'selected' : ''}`}
      style={{
        backgroundColor: data.isDimmed ? 'rgba(248, 250, 252, 0.3)' : '#F8FAFC',
        opacity: data.isDimmed ? 0.3 : 1,
        transition: 'opacity 0.3s ease',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#94A3B8', width: 8, height: 8 }}
      />
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: data.fileType === 'md' ? '#10B981' : '#3B82F6',
            opacity: data.isDimmed ? 0.3 : 1,
          }}
        />
        <span style={{
          fontSize: 12,
          fontWeight: 500,
          color: data.isDimmed ? '#94A3B8' : '#334155',
          maxWidth: 140,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {data.label}
        </span>
      </div>
      <div
        className="generation-badge"
        style={{
          backgroundColor: bgColor,
          opacity: data.isDimmed ? 0.3 : 1,
        }}
      >
        {data.generation}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#94A3B8', width: 8, height: 8 }}
      />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

const GenealogyGraph: React.FC<GenealogyGraphProps> = ({
  genealogyNodes,
  genealogyEdges,
  files,
  selectedNodeId,
  highlightedNodeIds,
  onNodeClick,
  onNodeDoubleClick,
}) => {
  const fileMap = useMemo(() => {
    const map = new Map<string, FileItem>();
    files.forEach(f => map.set(f.id, f));
    return map;
  }, [files]);

  const positions = useMemo(() => {
    const posMap = new Map<string, { x: number; y: number }>();
    
    const generationMap = new Map<number, GenealogyNode[]>();
    genealogyNodes.forEach(node => {
      if (!generationMap.has(node.generation)) {
        generationMap.set(node.generation, []);
      }
      generationMap.get(node.generation)!.push(node);
    });

    const generations = Array.from(generationMap.keys()).sort((a, b) => a - b);
    const horizontalGap = 240;
    const verticalGap = 80;
    const startX = 60;
    const startY = 60;

    generations.forEach(gen => {
      const nodesInGen = generationMap.get(gen)!;
      const totalHeight = nodesInGen.length * verticalGap - verticalGap;
      const startYOffset = startY + Math.max(0, (300 - totalHeight) / 2);

      nodesInGen.forEach((node, index) => {
        posMap.set(node.id, {
          x: startX + gen * horizontalGap,
          y: startYOffset + index * verticalGap,
        });
      });
    });

    return posMap;
  }, [genealogyNodes]);

  const nodes: Node<CustomNodeData>[] = useMemo(() => {
    return genealogyNodes.map(gn => {
      const file = fileMap.get(gn.fileId);
      const label = file ? file.name.slice(0, 8) : gn.fileId.slice(0, 8);
      const pos = positions.get(gn.id) || { x: 0, y: 0 };
      const isHighlighted = highlightedNodeIds?.has(gn.id) ?? false;
      const isDimmed = highlightedNodeIds !== null && !isHighlighted;

      return {
        id: gn.id,
        type: 'custom',
        position: pos,
        data: {
          label,
          generation: gn.generation,
          fileType: file?.type || 'txt',
          isHighlighted,
          isDimmed,
        },
      };
    });
  }, [genealogyNodes, fileMap, positions, highlightedNodeIds]);

  const edges: Edge[] = useMemo(() => {
    return genealogyEdges.map(ge => {
      const strokeWidth = getEdgeWidth(ge.similarity);
      const strokeColor = getEdgeColor(ge.similarity);
      const isDimmed = highlightedNodeIds !== null && 
        !highlightedNodeIds.has(ge.source) && 
        !highlightedNodeIds.has(ge.target);

      return {
        id: ge.id,
        source: ge.source,
        target: ge.target,
        type: 'smoothstep',
        animated: false,
        style: {
          strokeWidth,
          stroke: strokeColor,
          opacity: isDimmed ? 0.2 : 1,
          transition: 'opacity 0.3s ease',
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: strokeColor,
          width: 12,
          height: 12,
        },
        label: `${Math.round(ge.similarity * 100)}%`,
        labelStyle: {
          fontSize: 10,
          fill: '#64748B',
          opacity: isDimmed ? 0.2 : 1,
        },
        labelBgPadding: [4, 2],
        labelBgBorderRadius: 4,
      };
    });
  }, [genealogyEdges, highlightedNodeIds]);

  return (
    <div className="center-canvas" style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => onNodeClick(node.id)}
        onNodeDoubleClick={(_, node) => onNodeDoubleClick(node.id)}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
        style={{ width: '100%', height: '100%' }}
      >
        <Background color="#CBD5E1" gap={20} size={1} />
        <Controls 
          showInteractive={false}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}
        />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as CustomNodeData;
            return getGenerationColor(data.generation);
          }}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}
        />
      </ReactFlow>
    </div>
  );
};

export default GenealogyGraph;
