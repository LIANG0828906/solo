import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCollide,
  forceX,
  forceY,
  type Simulation,
  type SimulationLinkDatum,
} from 'd3';
import type { RenderNode, StoryNode, GraphLink, SentimentType } from '@/types';

export const SENTIMENT_NODE_COLORS: Record<SentimentType, { fill: string; stroke: string }> = {
  neutral: { fill: '#1E3A5F', stroke: '#0F2744' },
  positive: { fill: '#2D6A4F', stroke: '#1B4332' },
  conflict: { fill: '#9B2335', stroke: '#6B1824' },
};

export const SENTIMENT_LINK_COLORS: Record<SentimentType, string> = {
  neutral: '#1E3A5F',
  positive: '#2D6A4F',
  conflict: '#9B2335',
};

export function getNodeColor(node: StoryNode): { fill: string; stroke: string } {
  if (node.parentId === null) {
    return { fill: '#1E3A5F', stroke: '#0F2744' };
  }
  return SENTIMENT_NODE_COLORS[node.sentiment];
}

export function getLinkColor(childNode: StoryNode): string {
  return SENTIMENT_LINK_COLORS[childNode.sentiment];
}

export function buildVinePath(
  sx: number,
  sy: number,
  tx: number,
  ty: number
): string {
  const midX = (sx + tx) / 2;
  const dy = ty - sy;
  const cp1Y = sy + dy * 0.35;
  const cp2Y = sy + dy * 0.65;
  const horizontalOffset = (tx - sx) * 0.15;
  return [
    `M${sx},${sy}`,
    `C${sx + horizontalOffset},${cp1Y}`,
    `${tx - horizontalOffset},${cp2Y}`,
    `${tx},${ty}`,
  ].join(' ');
}

interface SimulationContext {
  simulation: Simulation<RenderNode, SimulationLinkDatum<RenderNode>>;
  linkForce: ReturnType<typeof forceLink<RenderNode, SimulationLinkDatum<RenderNode>>>;
  containerWidth: number;
  containerHeight: number;
}

export function createLayoutSimulation(
  containerWidth: number,
  containerHeight: number
): {
  simulation: Simulation<RenderNode, SimulationLinkDatum<RenderNode>>;
  updateNodes: (nodes: StoryNode[]) => RenderNode[];
} {
  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;

  const linkForce = forceLink<RenderNode, SimulationLinkDatum<RenderNode>>()
    .distance(120)
    .strength(0.6)
    .id((d: RenderNode) => d.id);

  const context: SimulationContext = {
    simulation: forceSimulation<RenderNode, SimulationLinkDatum<RenderNode>>()
      .alphaDecay(0.022)
      .velocityDecay(0.4)
      .force('link', linkForce)
      .force('charge', forceManyBody().strength(-200))
      .force('collide', forceCollide<RenderNode>().radius(42).strength(0.8))
      .force('x', forceX(centerX).strength(0.04))
      .force('y', forceY(centerY).strength(0.04)),
    linkForce,
    containerWidth,
    containerHeight,
  };

  function updateNodes(storyNodes: StoryNode[]): RenderNode[] {
    const nodeCount = storyNodes.length;
    const adjustedCharge = nodeCount >= 50 ? -150 : -200;
    context.simulation.force('charge', forceManyBody().strength(adjustedCharge));

    const existingNodes = context.simulation.nodes();
    const existingMap = new Map(existingNodes.map(n => [n.id, n]));

    const renderNodes: RenderNode[] = storyNodes.map(node => {
      const existing = existingMap.get(node.id);
      const sideOffset = node.side === 'root' ? 0 : node.side === 'left' ? -80 : 80;
      return {
        ...node,
        x: existing?.x ?? centerX + sideOffset,
        y: existing?.y ?? node.depth * 120 + 80,
        vx: existing?.vx ?? 0,
        vy: existing?.vy ?? 0,
        fx: existing?.fx,
        fy: existing?.fy,
      };
    });

    const links: GraphLink[] = [];
    for (const node of storyNodes) {
      if (node.parentId) {
        links.push({
          source: node.parentId,
          target: node.id,
        });
      }
    }

    context.simulation.nodes(renderNodes);
    context.linkForce.links(links as unknown as SimulationLinkDatum<RenderNode>[]);
    context.simulation.alpha(1).restart();

    return renderNodes;
  }

  return {
    simulation: context.simulation,
    updateNodes,
  };
}
