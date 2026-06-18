import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
} from 'd3-force';
import type { RawGraphData, GraphNode, GraphEdge } from '../../types';
import { NODE_COLOR_PALETTE } from '../../types';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const MIN_RADIUS = 8;
const MAX_RADIUS = 20;

function getRandomColor(): string {
  return NODE_COLOR_PALETTE[Math.floor(Math.random() * NODE_COLOR_PALETTE.length)];
}

function calculateDegrees(rawData: RawGraphData): Map<string, number> {
  const degreeMap = new Map<string, number>();
  rawData.nodes.forEach((n) => degreeMap.set(n.id, 0));
  rawData.edges.forEach((e) => {
    degreeMap.set(e.source, (degreeMap.get(e.source) || 0) + 1);
    degreeMap.set(e.target, (degreeMap.get(e.target) || 0) + 1);
  });
  return degreeMap;
}

function radiusFromDegree(degree: number, maxDegree: number): number {
  if (maxDegree === 0) return MIN_RADIUS;
  const ratio = degree / maxDegree;
  return MIN_RADIUS + ratio * (MAX_RADIUS - MIN_RADIUS);
}

export function createInitialGraphData(
  rawData: RawGraphData
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const degreeMap = calculateDegrees(rawData);
  const maxDegree = Math.max(...degreeMap.values(), 1);

  const nodes: GraphNode[] = rawData.nodes.map((n) => {
    const degree = degreeMap.get(n.id) || 0;
    return {
      id: n.id,
      name: n.name || n.id,
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * CANVAS_HEIGHT,
      degree,
      color: getRandomColor(),
      radius: radiusFromDegree(degree, maxDegree),
      highlighted: false,
      visible: true,
    };
  });

  const edges: GraphEdge[] = rawData.edges.map((e, idx) => ({
    id: `edge-${idx}`,
    source: e.source,
    target: e.target,
    visible: true,
  }));

  return { nodes, edges };
}

export function runForceLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  width: number = CANVAS_WIDTH,
  height: number = CANVAS_HEIGHT,
  iterations: number = 300
): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  return new Promise((resolve) => {
    const simNodes = nodes.map((n) => ({ ...n }));
    const simEdges = edges.map((e) => ({ ...e }));

    const maxRadius = Math.max(...simNodes.map((n) => n.radius), MIN_RADIUS);

    const simulation = forceSimulation(simNodes)
      .force(
        'link',
        forceLink(simEdges as any)
          .id((d: any) => d.id)
          .distance(100)
          .strength(0.5)
      )
      .force('charge', forceManyBody().strength(-200))
      .force('center', forceCenter(width / 2, height / 2))
      .force('collision', forceCollide().radius(maxRadius + 5))
      .stop();

    for (let i = 0; i < iterations; i++) {
      simulation.tick();
    }

    const finalNodes: GraphNode[] = simNodes.map((n) => ({
      ...n,
      x: Math.max(n.radius, Math.min(width - n.radius, n.x || width / 2)),
      y: Math.max(n.radius, Math.min(height - n.radius, n.y || height / 2)),
    }));

    resolve({ nodes: finalNodes, edges: simEdges });
  });
}

export async function generateForceLayout(
  rawData: RawGraphData,
  width: number = CANVAS_WIDTH,
  height: number = CANVAS_HEIGHT
): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  const { nodes, edges } = createInitialGraphData(rawData);
  return runForceLayout(nodes, edges, width, height);
}

export function filterGraphByKeyword(
  nodes: GraphNode[],
  edges: GraphEdge[],
  keyword: string
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const kw = keyword.trim().toLowerCase();
  if (!kw) {
    return {
      nodes: nodes.map((n) => ({ ...n, visible: true })),
      edges: edges.map((e) => ({ ...e, visible: true })),
    };
  }

  const matchedIds = new Set<string>();
  nodes.forEach((n) => {
    if (n.name.toLowerCase().includes(kw) || n.id.toLowerCase().includes(kw)) {
      matchedIds.add(n.id);
    }
  });

  edges.forEach((e) => {
    if (matchedIds.has(e.source) || matchedIds.has(e.target)) {
      matchedIds.add(e.source);
      matchedIds.add(e.target);
    }
  });

  return {
    nodes: nodes.map((n) => ({ ...n, visible: matchedIds.has(n.id) })),
    edges: edges.map((e) => ({
      ...e,
      visible: matchedIds.has(e.source) && matchedIds.has(e.target),
    })),
  };
}
