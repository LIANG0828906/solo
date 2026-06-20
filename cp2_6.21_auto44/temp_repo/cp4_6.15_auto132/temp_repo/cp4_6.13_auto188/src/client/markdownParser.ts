import { v4 as uuidv4 } from 'uuid';
import type { MindMapNode, NodeMap, ParseResult } from './types';

const LEVEL_GAP_X = 200;
const NODE_HEIGHT = 60;
const ROOT_X = 100;
const ROOT_Y = 300;

function createNode(
  text: string,
  level: number,
  x: number,
  y: number,
  parentId: string | null
): MindMapNode {
  return {
    id: uuidv4(),
    text,
    level,
    x,
    y,
    parentId,
    children: [],
  };
}

function getIndentLevel(line: string): number {
  let indent = 0;
  for (const char of line) {
    if (char === ' ' || char === '\t') {
      indent += char === '\t' ? 2 : 1;
    } else {
      break;
    }
  }
  return Math.floor(indent / 2);
}

function stripListMarker(line: string): string {
  return line.replace(/^(\s*)([-*+]|\d+\.)\s+/, '$1');
}

function parseTitle(line: string): { text: string; level: number } | null {
  const match = line.match(/^(#{1,6})\s+(.+)$/);
  if (!match) return null;
  return {
    text: match[2].trim(),
    level: match[1].length - 1,
  };
}

export function parseMarkdown(markdown: string): ParseResult {
  const lines = markdown.split('\n').filter((line) => line.trim().length > 0);
  const nodes: NodeMap = new Map();
  let rootId: string = '';

  if (lines.length === 0) {
    const root = createNode('思维导图', 0, ROOT_X, ROOT_Y, null);
    nodes.set(root.id, root);
    return { nodes, rootId: root.id };
  }

  const stack: { nodeId: string; level: number }[] = [];
  let yOffset = 0;

  for (const line of lines) {
    const titleInfo = parseTitle(line);

    let text: string;
    let level: number;

    if (titleInfo) {
      text = titleInfo.text;
      level = titleInfo.level;
    } else {
      const indentLevel = getIndentLevel(line);
      text = stripListMarker(line).trim();
      level = indentLevel + 1;
    }

    if (!text) continue;

    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    const parentId = stack.length > 0 ? stack[stack.length - 1].nodeId : null;
    const x = ROOT_X + level * LEVEL_GAP_X;
    const y = ROOT_Y + yOffset * NODE_HEIGHT;

    const node = createNode(text, level, x, y, parentId);
    nodes.set(node.id, node);

    if (parentId) {
      const parent = nodes.get(parentId);
      if (parent) {
        parent.children.push(node.id);
      }
    }

    if (stack.length === 0) {
      rootId = node.id;
    }

    stack.push({ nodeId: node.id, level });
    yOffset++;
  }

  if (!rootId && nodes.size > 0) {
    rootId = nodes.values().next().value?.id || '';
  }

  return { nodes, rootId };
}

export function generateMarkdown(nodes: NodeMap, rootId: string): string {
  const lines: string[] = [];

  function traverse(nodeId: string, depth: number) {
    const node = nodes.get(nodeId);
    if (!node) return;

    const prefix = depth === 0 ? '# ' : `${'  '.repeat(depth - 1)}- `;
    lines.push(`${prefix}${node.text}`);

    for (const childId of node.children) {
      traverse(childId, depth + 1);
    }
  }

  traverse(rootId, 0);
  return lines.join('\n');
}
