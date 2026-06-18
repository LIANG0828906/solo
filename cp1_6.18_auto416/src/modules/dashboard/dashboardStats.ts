import type { GraphNode, GraphEdge, GraphStats } from '../../types';

export function calculateStats(
  nodes: GraphNode[],
  edges: GraphEdge[]
): GraphStats {
  const visibleNodes = nodes.filter((n) => n.visible);
  const visibleEdges = edges.filter((e) => e.visible);

  const nodeCount = visibleNodes.length;
  const edgeCount = visibleEdges.length;

  let totalDegree = 0;
  let maxDegree = 0;
  let maxCentralityNode = '';
  const centralityMap = new Map<string, number>();

  visibleNodes.forEach((n) => {
    centralityMap.set(n.id, 0);
  });

  visibleEdges.forEach((e) => {
    centralityMap.set(e.source, (centralityMap.get(e.source) || 0) + 1);
    centralityMap.set(e.target, (centralityMap.get(e.target) || 0) + 1);
  });

  visibleNodes.forEach((n) => {
    const degree = centralityMap.get(n.id) || 0;
    totalDegree += degree;
    if (degree > maxDegree) {
      maxDegree = degree;
      maxCentralityNode = n.name;
    }
  });

  const averageDegree = nodeCount > 0 ? totalDegree / nodeCount : 0;
  const normalizedCentrality = nodeCount > 1 ? maxDegree / (nodeCount - 1) : 0;

  return {
    nodeCount,
    edgeCount,
    averageDegree: Math.round(averageDegree * 100) / 100,
    maxCentrality: Math.round(normalizedCentrality * 100) / 100,
    maxCentralityNode,
  };
}
