import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import type { GraphNode, GraphEdge, KnowledgeGraph } from '../types';

interface D3Node extends GraphNode, d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: GraphNode['type'];
}

interface D3Edge extends d3.SimulationLinkDatum<D3Node> {
  id: string;
  label: string;
  strength: number;
  cooccurrenceCount: number;
}

interface GraphCanvasProps {
  graph: KnowledgeGraph;
  filterKeyword: string;
  editMode: boolean;
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string | null) => void;
  onGraphChange: (graph: KnowledgeGraph) => void;
}

const NODE_COLORS: Record<string, string> = {
  person: '#ff6b9d',
  tech: '#00d4ff',
  project: '#c77dff',
  concept: '#ffd166',
  other: '#8899aa',
};

const STRONG_EDGE_COLOR = '#ff6b35';
const WEAK_EDGE_COLOR = '#8899aa';

const GraphCanvas: React.FC<GraphCanvasProps> = ({
  graph,
  filterKeyword,
  editMode,
  selectedNodeId,
  onNodeSelect,
  onGraphChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const simulationRef = useRef<d3.Simulation<D3Node, D3Edge> | null>(null);
  const nodesRef = useRef<D3Node[]>([]);
  const edgesRef = useRef<D3Edge[]>([]);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

  const getNodeById = useCallback((id: string): D3Node | undefined => {
    return nodesRef.current.find(n => n.id === id);
  }, []);

  const getConnectedNodeIds = useCallback((node