import { MindMapNode, Position } from '../types';

let idCounter = 0;

function generateId(): string {
  idCounter += 1;
  return `node-${Date.now()}-${idCounter}`;
}

function createNode(
  text: string,
  level: 1 | 2 | 3,
  parentId?: string
): MindMapNode {
  return {
    id: generateId(),
    text: text.trim(),
    level,
    children: [],
    collapsed: false,
    position: { x: 0, y: 0 },
    initialPosition: { x: 0, y: 0 },
    parentId,
  };
}

export interface ParsedHeadings {
  text: string;
  level: 1 | 2 | 3;
}

export function extractHeadings(markdown: string): ParsedHeadings[] {
  const lines = markdown.split('\n');
  const headings: ParsedHeadings[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const h1Match = trimmed.match(/^#\s+(.+)$/);
    if (h1Match) {
      headings.push({ text: h1Match[1], level: 1 });
      continue;
    }
    const h2Match = trimmed.match(/^##\s+(.+)$/);
    if (h2Match) {
      headings.push({ text: h2Match[1], level: 2 });
      continue;
    }
    const h3Match = trimmed.match(/^###\s+(.+)$/);
    if (h3Match) {
      headings.push({ text: h3Match[1], level: 3 });
      continue;
    }
  }

  return headings;
}

export function buildTree(headings: ParsedHeadings[]): MindMapNode | null {
  if (headings.length === 0) {
    return null;
  }

  let rootHeading = headings.find((h) => h.level === 1);

  if (!rootHeading) {
    rootHeading = { text: '思维导图根节点', level: 1 };
  }

  const root = createNode(rootHeading.text, 1);
  const lowerHeadings = headings.filter((h) => h !== rootHeading);

  let currentLevel2: MindMapNode | null = null;

  for (const heading of lowerHeadings) {
    if (heading.level === 2) {
      currentLevel2 = createNode(heading.text, 2, root.id);
      root.children.push(currentLevel2);
    } else if (heading.level === 3) {
      if (currentLevel2) {
        const level3Node = createNode(heading.text, 3, currentLevel2.id);
        currentLevel2.children.push(level3Node);
      } else {
        currentLevel2 = createNode('未命名章节', 2, root.id);
        root.children.push(currentLevel2);
        const level3Node = createNode(heading.text, 3, currentLevel2.id);
        currentLevel2.children.push(level3Node);
      }
    }
  }

  return root;
}

export function parseMarkdown(markdown: string): MindMapNode | null {
  const start = performance.now();
  const headings = extractHeadings(markdown);
  const tree = buildTree(headings);
  const elapsed = performance.now() - start;
  console.debug(`[markdownParser] 解析完成，耗时 ${elapsed.toFixed(2)}ms，标题数: ${headings.length}`);
  return tree;
}

export function countNodes(node: MindMapNode | null): number {
  if (!node) return 0;
  let count = 1;
  for (const child of node.children) {
    count += countNodes(child);
  }
  return count;
}

export function flattenTree(node: MindMapNode | null, includeCollapsed = false): MindMapNode[] {
  if (!node) return [];
  const result: MindMapNode[] = [node];
  if (!node.collapsed || includeCollapsed) {
    for (const child of node.children) {
      result.push(...flattenTree(child, includeCollapsed));
    }
  }
  return result;
}

export function findNodeById(root: MindMapNode | null, id: string): MindMapNode | null {
  if (!root) return null;
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
}
