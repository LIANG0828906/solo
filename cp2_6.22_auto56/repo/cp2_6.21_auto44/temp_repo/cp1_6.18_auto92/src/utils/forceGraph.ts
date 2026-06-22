import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCenter,
  forceCollide,
  Simulation,
  SimulationLinkDatum,
  SimulationNodeDatum,
} from 'd3-force';
import { Character, Relation, GraphNode, GraphLink } from '../types';

export interface SimNode extends SimulationNodeDatum {
  id: string;
  character: Character;
  radius: number;
}

export interface SimLink extends SimulationLinkDatum<SimNode> {
  relation: Relation;
}

const calculateRadius = (stats: number): number => {
  const minRadius = 20;
  const maxRadius = 60;
  const minStats = 10;
  const maxStats = 100;
  const normalized = Math.min(Math.max((stats - minStats) / (maxStats - minStats), 0), 1);
  return minRadius + normalized * (maxRadius - minRadius);
};

const findNodeById = (nodes: SimNode[], id: string): SimNode | undefined => {
  return nodes.find((n) => n.id === id);
};

export const createForceSimulation = (
  characters: Character[],
  relations: Relation[],
  width: number,
  height: number
): { simulation: Simulation<SimNode, SimLink>; nodes: SimNode[]; links: SimLink[] } => {
  const nodes: SimNode[] = characters.map((char) => ({
    id: char.id,
    character: char,
    radius: calculateRadius(char.stats),
  }));

  const links: SimLink[] = relations.map((rel) => ({
    source: rel.sourceId,
    target: rel.targetId,
    relation: rel,
  }));

  const simulation = forceSimulation<SimNode, SimLink>(nodes)
    .force(
      'link',
      forceLink<SimNode, SimLink>(links)
        .id((d) => d.id)
        .distance(150)
        .strength(0.5)
    )
    .force('charge', forceManyBody().strength(-300))
    .force('center', forceCenter(width / 2, height / 2))
    .force(
      'collision',
      forceCollide<SimNode>()
        .radius((d) => d.radius + 10)
        .strength(0.8)
    )
    .alphaDecay(0.02)
    .velocityDecay(0.4);

  return { simulation, nodes, links };
};

export const updateSimulationData = (
  simulation: Simulation<SimNode, SimLink>,
  characters: Character[],
  relations: Relation[]
): { nodes: SimNode[]; links: SimLink[] } => {
  const currentNodes = simulation.nodes();
  const nodes: SimNode[] = characters.map((char) => {
    const existing = findNodeById(currentNodes, char.id);
    return {
      id: char.id,
      character: char,
      radius: calculateRadius(char.stats),
      x: existing?.x,
      y: existing?.y,
      vx: existing?.vx,
      vy: existing?.vy,
    };
  });

  const links: SimLink[] = relations.map((rel) => ({
    source: rel.sourceId,
    target: rel.targetId,
    relation: rel,
  }));

  simulation.nodes(nodes);
  const linkForce = simulation.force('link');
  if (linkForce) {
    (linkForce as ReturnType<typeof forceLink<SimNode, SimLink>>).links(links);
  }
  simulation.alpha(0.3).restart();

  return { nodes, links };
};

export const dragNode = (
  simulation: Simulation<SimNode, SimLink>,
  nodeId: string,
  x: number,
  y: number
): void => {
  const nodes = simulation.nodes();
  const node = findNodeById(nodes, nodeId);
  if (node) {
    node.fx = x;
    node.fy = y;
    simulation.alphaTarget(0.3).restart();
  }
};

export const releaseNode = (
  simulation: Simulation<SimNode, SimLink>,
  nodeId: string
): void => {
  const nodes = simulation.nodes();
  const node = findNodeById(nodes, nodeId);
  if (node) {
    node.fx = null;
    node.fy = null;
    simulation.alphaTarget(0);
  }
};

export const focusNode = (
  simulation: Simulation<SimNode, SimLink>,
  nodeId: string,
  width: number,
  height: number
): void => {
  const nodes = simulation.nodes();
  const node = findNodeById(nodes, nodeId);
  if (node) {
    node.fx = width / 2;
    node.fy = height / 2;
    simulation.alpha(0.5).restart();
    setTimeout(() => {
      const n = findNodeById(simulation.nodes(), nodeId);
      if (n) {
        n.fx = null;
        n.fy = null;
      }
    }, 2000);
  }
};

export const graphToSvg = (
  nodes: GraphNode[],
  links: GraphLink[],
  width: number,
  height: number,
  getNodeColor: (faction: string) => string
): string => {
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="#0A0A2E"/>
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#4A4A6A"/>
        </marker>
      </defs>
      ${links
        .map((link) => {
          const source = typeof link.source === 'object' ? link.source : null;
          const target = typeof link.target === 'object' ? link.target : null;
          if (!source || !target) return '';
          const strokeDasharray = link.relation.style === 'dashed' ? '8,4' : 'none';
          return `<line x1="${source.x}" y1="${source.y}" x2="${target.x}" y2="${target.y}" 
            stroke="#4A4A6A" stroke-width="2" stroke-dasharray="${strokeDasharray}" 
            marker-end="url(#arrowhead)"/>`;
        })
        .join('')}
      ${nodes
        .map(
          (node) => `
        <circle cx="${node.x}" cy="${node.y}" r="${node.radius}" 
          fill="${getNodeColor(node.character.faction)}" 
          stroke="#fff" stroke-width="2"/>
        <text x="${node.x}" y="${node.y - node.radius - 8}" 
          text-anchor="middle" fill="#DFE6E9" font-size="12" font-family="sans-serif">
          ${node.character.name}
        </text>
      `
        )
        .join('')}
    </svg>
  `.trim();
  return svgContent;
};
