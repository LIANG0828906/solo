import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  SimulationNodeDatum,
  SimulationLinkDatum,
} from 'd3-force';
import { v4 as uuidv4 } from 'uuid';
import { ColorEntry } from '../parser/colorExtractor';

export interface GraphNode extends SimulationNodeDatum {
  id: string;
  type: 'color' | 'selector';
  label: string;
  color?: string;
  usageCount: number;
  x: number;
  y: number;
  radius: number;
}

export interface GraphEdge extends SimulationLinkDatum<GraphNode> {
  source: GraphNode | string;
  target: GraphNode | string;
  lineNum: number;
  count: number;
}

export interface LayoutResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function buildGraph(entries: ColorEntry[]): LayoutResult {
  const colorMap = new Map<string, { count: number; selectors: Set<string> }>();
  const selectorMap = new Map<string, { count: number }>();

  for (const entry of entries) {
    const colorKey = entry.color.toLowerCase();
    if (!colorMap.has(colorKey)) {
      colorMap.set(colorKey, { count: 0, selectors: new Set() });
    }
    const cm = colorMap.get(colorKey)!;
    cm.count++;
    cm.selectors.add(entry.selector);

    if (!selectorMap.has(entry.selector)) {
      selectorMap.set(entry.selector, { count: 0 });
    }
    selectorMap.get(entry.selector)!.count++;
  }

  const nodes: GraphNode[] = [];
  const nodeMap = new Map<string, GraphNode>();

  const minR = 10;
  const maxR = 30;
  const maxCount = Math.max(...Array.from(colorMap.values()).map((c) => c.count), 1);

  for (const [colorKey, data] of colorMap) {
    const radius = minR + (maxR - minR) * (data.count / maxCount);
    const node: GraphNode = {
      id: `color-${uuidv4().slice(0, 8)}`,
      type: 'color',
      label: colorKey,
      color: colorKey,
      usageCount: data.count,
      x: Math.random() * 600 - 300,
      y: Math.random() * 600 - 300,
      radius,
    };
    nodes.push(node);
    nodeMap.set(colorKey, node);
  }

  const selMaxCount = Math.max(...Array.from(selectorMap.values()).map((s) => s.count), 1);
  for (const [selector, data] of selectorMap) {
    const radius = minR + (maxR - minR) * (data.count / selMaxCount);
    const node: GraphNode = {
      id: `sel-${uuidv4().slice(0, 8)}`,
      type: 'selector',
      label: selector,
      usageCount: data.count,
      x: Math.random() * 600 - 300,
      y: Math.random() * 600 - 300,
      radius,
    };
    nodes.push(node);
    nodeMap.set(selector, node);
  }

  const edgeMap = new Map<string, GraphEdge>();
  for (const entry of entries) {
    const colorKey = entry.color.toLowerCase();
    const edgeKey = `${entry.selector}→${colorKey}`;
    if (edgeMap.has(edgeKey)) {
      edgeMap.get(edgeKey)!.count++;
    } else {
      const sourceNode = nodeMap.get(entry.selector);
      const targetNode = nodeMap.get(colorKey);
      if (sourceNode && targetNode) {
        edgeMap.set(edgeKey, {
          source: sourceNode,
          target: targetNode,
          lineNum: entry.lineNum,
          count: 1,
        });
      }
    }
  }

  const edges = Array.from(edgeMap.values());
  return { nodes, edges };
}

export function computeLayout(
  graph: LayoutResult,
  width: number,
  height: number
): Promise<LayoutResult> {
  return new Promise((resolve) => {
    const nodes = graph.nodes.map((n) => ({ ...n }));
    const edges = graph.edges.map((e) => ({
      ...e,
      source: (e.source as GraphNode).id || (e.source as string),
      target: (e.target as GraphNode).id || (e.target as string),
    }));

    const nodeById = new Map(nodes.map((n) => [n.id, n]));

    const simulation = forceSimulation<GraphNode>(nodes)
      .force(
        'link',
        forceLink<GraphNode, SimulationLinkDatum<GraphNode>>(edges as SimulationLinkDatum<GraphNode>[])
          .id((d: GraphNode) => d.id)
          .distance(100)
      )
      .force('charge', forceManyBody().strength(-200))
      .force('center', forceCenter(width / 2, height / 2))
      .force('collide', forceCollide<GraphNode>().radius((d) => d.radius + 8))
      .alphaDecay(0.03)
      .on('end', () => {
        const resolvedEdges = edges.map((e) => {
          const src = e.source as string;
          const tgt = e.target as string;
          return {
            ...e,
            source: nodeById.get(src)!,
            target: nodeById.get(tgt)!,
          };
        });
        resolve({ nodes, edges: resolvedEdges });
      });

    simulation.alpha(1).restart();
  });
}

export function computeLayoutSync(
  graph: LayoutResult,
  width: number,
  height: number
): LayoutResult {
  const nodes = graph.nodes.map((n) => ({ ...n }));
  const edges = graph.edges.map((e) => ({
    ...e,
    source: (e.source as GraphNode).id || (e.source as string),
    target: (e.target as GraphNode).id || (e.target as string),
  }));

  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  let tick = 0;
  const maxTicks = 200;

  const simulation = forceSimulation<GraphNode>(nodes)
    .force(
      'link',
      forceLink<GraphNode, SimulationLinkDatum<GraphNode>>(edges as SimulationLinkDatum<GraphNode>[])
        .id((d: GraphNode) => d.id)
        .distance(100)
    )
    .force('charge', forceManyBody().strength(-200))
    .force('center', forceCenter(width / 2, height / 2))
    .force('collide', forceCollide<GraphNode>().radius((d) => d.radius + 8))
    .alphaDecay(0.03)
    .stop();

  while (tick < maxTicks) {
    simulation.tick();
    tick++;
  }

  const resolvedEdges = edges.map((e) => {
    const src = e.source as string;
    const tgt = e.target as string;
    return {
      ...e,
      source: nodeById.get(src)!,
      target: nodeById.get(tgt)!,
    };
  });

  return { nodes, edges: resolvedEdges };
}
