export type NodeType = 'variable' | 'function' | 'loop' | 'condition';

export interface CodeNode {
  id: string;
  type: NodeType;
  name: string;
  codeSnippet: string;
  nestDepth: number;
  occurrence: number;
}

export interface CodeEdge {
  source: string;
  target: string;
  type: 'assignment' | 'call' | 'flow';
}

export interface ParseResult {
  nodes: CodeNode[];
  edges: CodeEdge[];
  complexity: number;
}

const KEYWORDS = {
  variable: ['const', 'let', 'var'],
  function: ['function', '=>'],
  loop: ['for', 'while', 'do'],
  condition: ['if', 'else', 'switch', 'case', '?'],
};

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function getNestDepth(code: string, position: number): number {
  const before = code.substring(0, position);
  const openBraces = (before.match(/\{/g) || []).length;
  const closeBraces = (before.match(/\}/g) || []).length;
  return Math.max(0, openBraces - closeBraces);
}

function extractName(match: string, type: NodeType): string {
  if (type === 'variable') {
    const varMatch = match.match(/(?:const|let|var)\s+(\w+)/);
    return varMatch ? varMatch[1] : 'variable';
  }
  if (type === 'function') {
    const funcMatch = match.match(/function\s+(\w+)/);
    if (funcMatch) return funcMatch[1];
    const arrowMatch = match.match(/(\w+)\s*=\s*\([^)]*\)\s*=>/);
    if (arrowMatch) return arrowMatch[1];
    return 'anonymous';
  }
  if (type === 'loop') {
    const loopMatch = match.match(/(for|while|do)/);
    return loopMatch ? loopMatch[1] + ' loop' : 'loop';
  }
  if (type === 'condition') {
    const condMatch = match.match(/(if|else|switch|case)/);
    return condMatch ? condMatch[1] : 'condition';
  }
  return 'unknown';
}

export function parseCode(code: string): ParseResult {
  const nodes: CodeNode[] = [];
  const edges: CodeEdge[] = [];
  const nodeMap = new Map<string, CodeNode>();
  const occurrenceMap = new Map<string, number>();

  const lines = code.split('\n');
  let position = 0;

  for (const line of lines) {
    for (const [type, keywords] of Object.entries(KEYWORDS) as [NodeType, string[]][]) {
      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword}\\b[^;{]*`, 'g');
        let match;
        while ((match = regex.exec(line)) !== null) {
          const fullMatch = match[0];
          const name = extractName(fullMatch, type);
          const nestDepth = getNestDepth(code, position + match.index);
          const key = `${type}-${name}`;
          
          occurrenceMap.set(key, (occurrenceMap.get(key) || 0) + 1);
          
          const nodeId = generateId();
          const node: CodeNode = {
            id: nodeId,
            type,
            name,
            codeSnippet: fullMatch.trim().slice(0, 50),
            nestDepth,
            occurrence: occurrenceMap.get(key) || 1,
          };
          
          nodes.push(node);
          nodeMap.set(nodeId, node);
        }
      }
    }
    position += line.length + 1;
  }

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const nodeA = nodes[i];
      const nodeB = nodes[j];
      
      if (Math.abs(nodeA.nestDepth - nodeB.nestDepth) <= 1) {
        const edgeType: CodeEdge['type'] = 
          nodeA.type === 'function' && nodeB.type === 'variable' ? 'assignment' :
          nodeA.type === 'function' && nodeB.type === 'function' ? 'call' : 'flow';
        
        edges.push({
          source: nodeA.id,
          target: nodeB.id,
          type: edgeType,
        });
      }
    }
  }

  const variableNames = nodes.filter(n => n.type === 'variable').map(n => n.name);
  for (const node of nodes) {
    for (const varName of variableNames) {
      if (node.name !== varName && node.codeSnippet.includes(varName)) {
        const varNode = nodes.find(n => n.name === varName && n.type === 'variable');
        if (varNode && !edges.some(e => 
          (e.source === varNode.id && e.target === node.id) ||
          (e.source === node.id && e.target === varNode.id)
        )) {
          edges.push({
            source: varNode.id,
            target: node.id,
            type: 'assignment',
          });
        }
      }
    }
  }

  const complexity = nodes.reduce((sum, node) => 
    sum + node.nestDepth * 2 + node.occurrence * 1.5, 0);

  return { nodes, edges, complexity };
}
