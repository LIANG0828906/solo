import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCollide,
  forceX,
  forceY,
  Simulation,
  SimulationLinkDatum
} from 'd3';
import type { RenderNode, StoryNode, GraphLink } from '@/types';

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
      .force('collide', forceCollide().radius(42).strength(0.8))
      .force('x', forceX(centerX).strength(0.04))
      .force('y', forceY(centerY).strength(0.04)),
    linkForce,
    containerWidth,
    containerHeight
  };

  function updateNodes(storyNodes: StoryNode[]): RenderNode[] {
    const nodeCount = storyNodes.length;
    const adjustedCharge = nodeCount >= 50 ? -150 : -200;
    context.simulation.force('charge', forceManyBody().strength(adjustedCharge));

    const renderNodes: RenderNode[] = storyNodes.map(node => {
      const existing = context.simulation.nodes().find(n => n.id === node.id);
      const baseX = existing?.x ?? centerX;
      const baseY = existing?.y ?? node.depth * 120 + 80;
      const sideOffset = node.side === 'root' ? 0 : node.side === 'left' ? -60 : 60;
      return {
        ...node,
        x: existing?.x ?? baseX + sideOffset,
        y: existing?.y ?? baseY,
        vx: existing?.vx ?? 0,
        vy: existing?.vy ?? 0,
        fx: existing?.fx,
        fy: existing?.fy
      };
    });

    const links: GraphLink[] = [];
    for (const node of storyNodes) {
      if (node.parentId) {
        links.push({
          source: node.parentId,
          target: node.id
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
    updateNodes
  };
}
