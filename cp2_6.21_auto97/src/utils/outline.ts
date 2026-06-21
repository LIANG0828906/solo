import type { Block, OutlineItem } from '../types';

function parseHeadingLevel(content: string): { level: number; text: string } | null {
  const match = content.match(/^(#{1,6})\s+(.+)$/m);
  if (match) {
    return {
      level: match[1].length,
      text: match[2].trim(),
    };
  }
  return null;
}

export function extractOutline(blocks: Block[]): OutlineItem[] {
  const items: OutlineItem[] = [];
  const stack: { item: OutlineItem; level: number }[] = [];

  blocks.forEach((block) => {
    if (block.type !== 'text') return;

    const heading = parseHeadingLevel(block.content);
    if (!heading) return;

    const newItem: OutlineItem = {
      id: `${block.id}-outline`,
      blockId: block.id,
      text: heading.text,
      level: heading.level,
      children: [],
      collapsed: false,
    };

    while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      items.push(newItem);
    } else {
      stack[stack.length - 1].item.children.push(newItem);
    }

    stack.push({ item: newItem, level: heading.level });
  });

  return items;
}

export function flattenOutline(items: OutlineItem[]): OutlineItem[] {
  const result: OutlineItem[] = [];
  
  function traverse(list: OutlineItem[]) {
    list.forEach(item => {
      result.push(item);
      if (!item.collapsed && item.children.length > 0) {
        traverse(item.children);
      }
    });
  }
  
  traverse(items);
  return result;
}

export function toggleCollapse(items: OutlineItem[], itemId: string): OutlineItem[] {
  return items.map(item => {
    if (item.id === itemId) {
      return { ...item, collapsed: !item.collapsed };
    }
    if (item.children.length > 0) {
      return { ...item, children: toggleCollapse(item.children, itemId) };
    }
    return item;
  });
}

export function findBlockTitle(blocks: Block[], blockId: string): string {
  const block = blocks.find(b => b.id === blockId);
  if (!block) return '未知块';
  
  if (block.type === 'text') {
    const heading = parseHeadingLevel(block.content);
    if (heading) return heading.text;
    const firstLine = block.content.split('\n')[0].trim();
    return firstLine || '文本块';
  } else if (block.type === 'image') {
    return '图片块';
  } else if (block.type === 'code') {
    return `代码块${block.language ? ` (${block.language})` : ''}`;
  }
  return '知识块';
}
