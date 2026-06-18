import { v4 } from 'uuid';
import type { MindMapNode } from '@/types';

export function parseText(text: string): MindMapNode | null {
  const lines = text.split('\n').filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return null;
  }

  const stack: MindMapNode[] = [];

  for (const line of lines) {
    let indentCount = 0;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      if (char === ' ') {
        indentCount++;
        i++;
      } else if (char === '\t') {
        indentCount += 4;
        i++;
      } else {
        break;
      }
    }

    const level = Math.floor(indentCount / 4);
    const textContent = line.slice(i).trim();

    const node: MindMapNode = {
      id: v4(),
      text: textContent,
      level,
      children: [],
      parentId: null,
      isCollapsed: false,
    };

    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    if (stack.length > 0) {
      const parent = stack[stack.length - 1];
      node.parentId = parent.id;
      parent.children.push(node);
    }

    stack.push(node);
  }

  if (stack.length === 0) {
    return null;
  }

  return stack[0];
}
