import type { PlantNode, SymbiosisLink } from '../data/plantData';

export interface GraphEngineState {
  nodes: Map<string, PlantNode>;
  adjacency: Map<string, Set<string>>;
  links: Map<string, SymbiosisLink>;
}

export function createGraphState(): GraphEngineState {
  return {
    nodes: new Map(),
    adjacency: new Map(),
    links: new Map(),
  };
}

export function buildGraph(plants: PlantNode[], links: SymbiosisLink[]): GraphEngineState {
  const state = createGraphState();

  plants.forEach((p) => {
    state.nodes.set(p.id, { ...p });
    if (!state.adjacency.has(p.id)) {
      state.adjacency.set(p.id, new Set());
    }
  });

  links.forEach((link) => {
    state.links.set(link.id, { ...link });
    if (state.adjacency.has(link.source)) {
      state.adjacency.get(link.source)!.add(link.target);
    }
    if (state.adjacency.has(link.target)) {
      state.adjacency.get(link.target)!.add(link.source);
    }
  });

  return state;
}

export function addNode(state: GraphEngineState, node: PlantNode): GraphEngineState {
  const newState: GraphEngineState = {
    nodes: new Map(state.nodes),
    adjacency: new Map(state.adjacency),
    links: new Map(state.links),
  };
  newState.nodes.set(node.id, { ...node });
  if (!newState.adjacency.has(node.id)) {
    newState.adjacency.set(node.id, new Set());
  }
  return newState;
}

export function addLinkToGraph(state: GraphEngineState, link: SymbiosisLink): GraphEngineState {
  const newState: GraphEngineState = {
    nodes: new Map(state.nodes),
    adjacency: new Map(state.adjacency),
    links: new Map(state.links),
  };
  newState.links.set(link.id, { ...link });
  if (newState.adjacency.has(link.source)) {
    const set = new Set(newState.adjacency.get(link.source)!);
    set.add(link.target);
    newState.adjacency.set(link.source, set);
  }
  if (newState.adjacency.has(link.target)) {
    const set = new Set(newState.adjacency.get(link.target)!);
    set.add(link.source);
    newState.adjacency.set(link.target, set);
  }
  return newState;
}

export function removeNode(state: GraphEngineState, nodeId: string): GraphEngineState {
  const newState: GraphEngineState = {
    nodes: new Map(state.nodes),
    adjacency: new Map(state.adjacency),
    links: new Map(state.links),
  };
  const adj = newState.adjacency.get(nodeId);
  if (adj) {
    adj.forEach((otherId) => {
      const otherAdj = newState.adjacency.get(otherId);
      if (otherAdj) {
        const newSet = new Set(otherAdj);
        newSet.delete(nodeId);
        newState.adjacency.set(otherId, newSet);
      }
    });
  }
  newState.nodes.delete(nodeId);
  newState.adjacency.delete(nodeId);

  newState.links.forEach((link, id) => {
    if (link.source === nodeId || link.target === nodeId) {
      newState.links.delete(id);
    }
  });
  return newState;
}

export function removeLink(state: GraphEngineState, linkId: string): GraphEngineState {
  const link = state.links.get(linkId);
  if (!link) return state;
  const newState: GraphEngineState = {
    nodes: new Map(state.nodes),
    adjacency: new Map(state.adjacency),
    links: new Map(state.links),
  };
  newState.links.delete(linkId);
  const srcAdj = newState.adjacency.get(link.source);
  if (srcAdj) {
    const set = new Set(srcAdj);
    set.delete(link.target);
    newState.adjacency.set(link.source, set);
  }
  const tgtAdj = newState.adjacency.get(link.target);
  if (tgtAdj) {
    const set = new Set(tgtAdj);
    set.delete(link.source);
    newState.adjacency.set(link.target, set);
  }
  return newState;
}

export function getNode(state: GraphEngineState, id: string): PlantNode | undefined {
  return state.nodes.get(id);
}

export function getLink(state: GraphEngineState, id: string): SymbiosisLink | undefined {
  return state.links.get(id);
}

export function getNeighbors(state: GraphEngineState, nodeId: string): string[] {
  const adj = state.adjacency.get(nodeId);
  return adj ? Array.from(adj) : [];
}

export function getLinksBetween(state: GraphEngineState, idA: string, idB: string): SymbiosisLink[] {
  const results: SymbiosisLink[] = [];
  state.links.forEach((link) => {
    if (
      (link.source === idA && link.target === idB) ||
      (link.source === idB && link.target === idA)
    ) {
      results.push(link);
    }
  });
  return results;
}

export function getAllNodesArray(state: GraphEngineState): PlantNode[] {
  return Array.from(state.nodes.values());
}

export function getAllLinksArray(state: GraphEngineState): SymbiosisLink[] {
  return Array.from(state.links.values());
}

export function getNodeCount(state: GraphEngineState): number {
  return state.nodes.size;
}

export function getLinkCount(state: GraphEngineState): number {
  return state.links.size;
}

export function searchNodesByName(state: GraphEngineState, query: string): PlantNode[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const results: PlantNode[] = [];
  state.nodes.forEach((n) => {
    if (n.name.toLowerCase().includes(q) || n.scientificName.toLowerCase().includes(q)) {
      results.push(n);
    }
  });
  return results;
}
