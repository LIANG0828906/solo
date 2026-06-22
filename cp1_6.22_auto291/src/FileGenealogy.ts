export interface GenealogyNode {
  id: string;
  fileId: string;
  generation: number;
}

export interface GenealogyEdge {
  id: string;
  source: string;
  target: string;
  similarity: number;
}

export interface GenealogyResult {
  nodes: GenealogyNode[];
  edges: GenealogyEdge[];
}

interface FileContent {
  id: string;
  content: string;
  timestamp: number;
}

export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

export function calculateSimilarity(a: string, b: string): number {
  if (a.length === 0 && b.length === 0) return 1;
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 0;
  const distance = levenshteinDistance(a, b);
  return 1 - distance / maxLength;
}

function calculateGeneration(
  fileId: string,
  edges: GenealogyEdge[],
  memo: Map<string, number>
): number {
  if (memo.has(fileId)) {
    return memo.get(fileId)!;
  }
  
  const incomingEdges = edges.filter(e => e.target === fileId);
  
  if (incomingEdges.length === 0) {
    memo.set(fileId, 0);
    return 0;
  }
  
  const maxParentGen = Math.max(
    ...incomingEdges.map(e => calculateGeneration(e.source, edges, memo))
  );
  
  const generation = maxParentGen + 1;
  memo.set(fileId, generation);
  return generation;
}

export function analyzeGenealogy(files: FileContent[]): GenealogyResult {
  const nodes: GenealogyNode[] = [];
  const edges: GenealogyEdge[] = [];
  
  const SIMILARITY_THRESHOLD = 0.5;
  
  const sortedFiles = [...files].sort((a, b) => a.timestamp - b.timestamp);
  
  for (let i = 0; i < sortedFiles.length; i++) {
    for (let j = i + 1; j < sortedFiles.length; j++) {
      const earlier = sortedFiles[i];
      const later = sortedFiles[j];
      
      const similarity = calculateSimilarity(earlier.content, later.content);
      
      if (similarity >= SIMILARITY_THRESHOLD) {
        edges.push({
          id: `edge-${earlier.id}-${later.id}`,
          source: earlier.id,
          target: later.id,
          similarity,
        });
      }
    }
  }
  
  const generationMemo = new Map<string, number>();
  
  for (const file of sortedFiles) {
    const generation = calculateGeneration(file.id, edges, generationMemo);
    nodes.push({
      id: file.id,
      fileId: file.id,
      generation,
    });
  }
  
  return { nodes, edges };
}

export function findOriginalSource(
  fileId: string,
  edges: GenealogyEdge[]
): string | null {
  const incomingEdges = edges.filter(e => e.target === fileId);
  
  if (incomingEdges.length === 0) {
    return null;
  }
  
  const bestEdge = incomingEdges.reduce((best, current) =>
    current.similarity > best.similarity ? current : best
  );
  
  const parentSource = findOriginalSource(bestEdge.source, edges);
  return parentSource || bestEdge.source;
}

export function findAllDescendants(
  fileId: string,
  edges: GenealogyEdge[]
): { id: string; similarity: number }[] {
  const descendants: { id: string; similarity: number }[] = [];
  const visited = new Set<string>();
  
  function dfs(currentId: string, currentSimilarity: number) {
    if (visited.has(currentId)) return;
    visited.add(currentId);
    
    const outgoingEdges = edges.filter(e => e.source === currentId);
    
    for (const edge of outgoingEdges) {
      descendants.push({
        id: edge.target,
        similarity: edge.similarity,
      });
      dfs(edge.target, edge.similarity);
    }
  }
  
  dfs(fileId, 1);
  return descendants;
}

export function findAllAncestors(
  fileId: string,
  edges: GenealogyEdge[]
): string[] {
  const ancestors: string[] = [];
  const visited = new Set<string>();
  
  function dfs(currentId: string) {
    if (visited.has(currentId)) return;
    visited.set(currentId);
    
    const incomingEdges = edges.filter(e => e.target === currentId);
    
    for (const edge of incomingEdges) {
      ancestors.push(edge.source);
      dfs(edge.source);
    }
  }
  
  dfs(fileId);
  return ancestors;
}

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
}

export function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  
  const result: DiffLine[] = [];
  const oldSet = new Set(oldLines);
  const newSet = new Set(newLines);
  
  const maxLen = Math.max(oldLines.length, newLines.length);
  let oldIdx = 0;
  let newIdx = 0;
  
  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    if (oldIdx < oldLines.length && newIdx < newLines.length) {
      if (oldLines[oldIdx] === newLines[newIdx]) {
        result.push({ type: 'unchanged', content: oldLines[oldIdx] });
        oldIdx++;
        newIdx++;
      } else if (!newSet.has(oldLines[oldIdx])) {
        result.push({ type: 'removed', content: oldLines[oldIdx] });
        oldIdx++;
      } else if (!oldSet.has(newLines[newIdx])) {
        result.push({ type: 'added', content: newLines[newIdx] });
        newIdx++;
      } else {
        result.push({ type: 'unchanged', content: oldLines[oldIdx] });
        oldIdx++;
        newIdx++;
      }
    } else if (oldIdx < oldLines.length) {
      result.push({ type: 'removed', content: oldLines[oldIdx] });
      oldIdx++;
    } else if (newIdx < newLines.length) {
      result.push({ type: 'added', content: newLines[newIdx] });
      newIdx++;
    }
  }
  
  return result;
}
