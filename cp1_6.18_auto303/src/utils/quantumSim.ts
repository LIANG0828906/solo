import type { CodeNode, CodeEdge, ParseResult } from './parser';

export interface QuantumNode {
  id: string;
  probability: number;
  color: string;
  radius: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface QuantumState {
  nodes: QuantumNode[];
  edges: CodeEdge[];
}

const COLOR_START = { r: 0, g: 191, b: 255 };
const COLOR_END = { r: 138, g: 43, b: 226 };

function lerpColor(t: number): string {
  const clampedT = Math.max(0, Math.min(1, t));
  const r = Math.round(COLOR_START.r + (COLOR_END.r - COLOR_START.r) * clampedT);
  const g = Math.round(COLOR_START.g + (COLOR_END.g - COLOR_START.g) * clampedT);
  const b = Math.round(COLOR_START.b + (COLOR_END.b - COLOR_START.b) * clampedT);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function calculateWeight(node: CodeNode): number {
  return node.nestDepth * 2 + node.occurrence * 1.5;
}

export function simulateQuantumState(parseResult: ParseResult): QuantumState {
  const { nodes: codeNodes, edges } = parseResult;
  
  if (codeNodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  const weights = codeNodes.map(calculateWeight);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  const maxProbability = Math.max(...weights.map(w => w / totalWeight));
  const minProbability = Math.min(...weights.map(w => w / totalWeight));
  const probRange = maxProbability - minProbability || 1;

  const quantumNodes: QuantumNode[] = codeNodes.map((node, index) => {
    const rawProbability = weights[index] / totalWeight;
    const normalizedProbability = probRange > 0 
      ? (rawProbability - minProbability) / probRange 
      : 0.5;
    const probability = Math.max(0.1, Math.min(1, rawProbability));
    
    return {
      id: node.id,
      probability,
      color: lerpColor(normalizedProbability),
      radius: 10 + probability * 30,
    };
  });

  return {
    nodes: quantumNodes,
    edges,
  };
}
