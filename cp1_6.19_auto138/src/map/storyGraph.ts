import {
  forceSimulation,
  forceCenter,
  forceManyBody,
  forceLink,
  forceCollide,
  Simulation,
  SimulationNodeDatum,
  SimulationLinkDatum,
} from 'd3-force';
import { eventBus, StoryFragment, GraphNode, GraphLink } from '../eventBus';

interface SimNode extends SimulationNodeDatum {
  id: string;
  fragmentId: string;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  id: string;
}

class StoryGraph {
  private simulation: Simulation<SimNode, SimLink> | null = null;
  private nodes: Map<string, SimNode> = new Map();
  private links: Map<string, SimLink> = new Map();
  private fragments: Map<string, StoryFragment> = new Map();
  private width = 800;
  private height = 600;
  private nodeRadius = 50;
  private droppedOrder: string[] = [];

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    eventBus.on('fragment:dropped', (fragmentId, x, y) => {
      this.addNode(fragmentId, x, y);
    });

    eventBus.on('fragment:deleted', (id) => {
      this.removeNode(id);
    });

    eventBus.on('fragment:updated', (fragment) => {
      this.fragments.set(fragment.id, fragment);
      this.updateLinks();
    });

    eventBus.on('link:deleted', (linkId) => {
      this.removeLink(linkId);
    });
  }

  setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    if (this.simulation) {
      this.simulation.force('center', forceCenter(width / 2, height / 2));
      this.simulation.alpha(0.3).restart();
    }
  }

  setFragments(fragments: StoryFragment[]): void {
    fragments.forEach((f) => this.fragments.set(f.id, f));
  }

  addNode(fragmentId: string, x: number, y: number): void {
    if (this.nodes.has(fragmentId)) return;

    const fragment = this.fragments.get(fragmentId);
    if (!fragment) return;

    const node: SimNode = {
      id: fragmentId,
      fragmentId,
      x,
      y,
    };

    this.nodes.set(fragmentId, node);
    this.droppedOrder.push(fragmentId);
    this.updateLinks();
    this.restartSimulation();
  }

  removeNode(fragmentId: string): void {
    if (!this.nodes.has(fragmentId)) return;

    this.nodes.delete(fragmentId);
    this.droppedOrder = this.droppedOrder.filter((id) => id !== fragmentId);

    const linksToRemove: string[] = [];
    this.links.forEach((link, id) => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      if (sourceId === fragmentId || targetId === fragmentId) {
        linksToRemove.push(id);
      }
    });
    linksToRemove.forEach((id) => this.links.delete(id));

    this.restartSimulation();
  }

  private updateLinks(): void {
    this.links.clear();

    const nodesArray = Array.from(this.nodes.values());
    const plotTwistNodes = nodesArray.filter((n) => {
      const f = this.fragments.get(n.fragmentId);
      return f?.type === 'plot-twist';
    });
    const characterNodes = nodesArray.filter((n) => {
      const f = this.fragments.get(n.fragmentId);
      return f?.type === 'character';
    });
    const sceneNodes = nodesArray.filter((n) => {
      const f = this.fragments.get(n.fragmentId);
      return f?.type === 'scene';
    });

    let linkIdCounter = 0;

    plotTwistNodes.forEach((plotNode) => {
      characterNodes.forEach((charNode) => {
        const linkId = `link_${plotNode.id}_${charNode.id}_${++linkIdCounter}`;
        this.links.set(linkId, {
          id: linkId,
          source: plotNode.id,
          target: charNode.id,
        });
      });
    });

    plotTwistNodes.forEach((plotNode) => {
      sceneNodes.forEach((sceneNode) => {
        const linkId = `link_${plotNode.id}_${sceneNode.id}_${++linkIdCounter}`;
        this.links.set(linkId, {
          id: linkId,
          source: plotNode.id,
          target: sceneNode.id,
        });
      });
    });
  }

  removeLink(linkId: string): void {
    if (this.links.delete(linkId)) {
      this.restartSimulation();
    }
  }

  private restartSimulation(): void {
    const nodesArray = Array.from(this.nodes.values()).map((n) => ({ ...n }));
    const linksArray = Array.from(this.links.values()).map((l) => ({
      ...l,
      source: l.source,
      target: l.target,
    }));

    if (this.simulation) {
      this.simulation.stop();
    }

    this.simulation = forceSimulation<SimNode>(nodesArray)
      .force('charge', forceManyBody().strength(-200))
      .force('center', forceCenter(this.width / 2, this.height / 2))
      .force('collision', forceCollide(this.nodeRadius + 10))
      .force('link', forceLink<SimNode, SimLink>(linksArray).id((d) => d.id).distance(150).strength(0.5))
      .alphaDecay(0.02)
      .velocityDecay(0.4)
      .on('tick', () => {
        this.emitGraphUpdate();
      });

    this.simulation.alpha(1).restart();
  }

  private emitGraphUpdate(): void {
    if (!this.simulation) return;

    const nodes = this.simulation.nodes().map((n) => ({
      id: n.id,
      fragmentId: n.fragmentId,
      x: n.x ?? 0,
      y: n.y ?? 0,
      fx: n.fx,
      fy: n.fy,
      vx: n.vx,
      vy: n.vy,
    })) as GraphNode[];

    const links: GraphLink[] = [];
    const nodeMap = new Map(this.simulation.nodes().map((n) => [n.id, n]));

    this.links.forEach((link, linkId) => {
      const sourceId = typeof link.source === 'object' ? link.source.id : String(link.source);
      const targetId = typeof link.target === 'object' ? link.target.id : String(link.target);
      const sourceNode = nodeMap.get(sourceId);
      const targetNode = nodeMap.get(targetId);

      if (sourceNode && targetNode) {
        links.push({
          id: linkId,
          source: sourceId,
          target: targetId,
        });
      }
    });

    eventBus.emit('graph:updated', { nodes, links });
  }

  dragStart(nodeId: string): void {
    if (!this.simulation) return;
    this.simulation.alphaTarget(0.3).restart();

    const node = this.simulation.nodes().find((n) => n.id === nodeId);
    if (node) {
      node.fx = node.x;
      node.fy = node.y;
    }
  }

  dragMove(nodeId: string, x: number, y: number): void {
    if (!this.simulation) return;

    const node = this.simulation.nodes().find((n) => n.id === nodeId);
    if (node) {
      node.fx = x;
      node.fy = y;
    }
  }

  dragEnd(nodeId: string): void {
    if (!this.simulation) return;
    this.simulation.alphaTarget(0);

    const node = this.simulation.nodes().find((n) => n.id === nodeId);
    if (node) {
      node.fx = null;
      node.fy = null;
    }
  }

  getDroppedOrder(): string[] {
    return [...this.droppedOrder];
  }

  getGraphData(): { nodes: GraphNode[]; links: GraphLink[] } {
    const nodes = Array.from(this.nodes.values()).map((n) => ({
      id: n.id,
      fragmentId: n.fragmentId,
      x: n.x ?? 0,
      y: n.y ?? 0,
      fx: n.fx,
      fy: n.fy,
    }));

    const links: GraphLink[] = Array.from(this.links.values()).map((l) => {
      const sourceId = typeof l.source === 'object' ? l.source.id : String(l.source);
      const targetId = typeof l.target === 'object' ? l.target.id : String(l.target);
      return {
        id: l.id,
        source: sourceId,
        target: targetId,
      };
    });

    return { nodes, links };
  }

  destroy(): void {
    if (this.simulation) {
      this.simulation.stop();
      this.simulation = null;
    }
  }
}

export const storyGraph = new StoryGraph();
