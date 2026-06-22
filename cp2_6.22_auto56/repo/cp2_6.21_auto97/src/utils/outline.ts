import type { Block, OutlineItem } from '../types';

interface HeadingMatch {
  level: number;
  text: string;
  lineIndex: number;
}

function parseAllHeadings(content: string): HeadingMatch[] {
  const headings: HeadingMatch[] = [];
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].trim(),
        lineIndex: idx,
      });
    }
  });

  return headings;
}

export function extractOutline(blocks: Block[]): OutlineItem[] {
  const items: OutlineItem[] = [];
  const stack: { item: OutlineItem; level: number }[] = [];

  blocks.forEach((block) => {
    if (block.type !== 'text') return;

    const headings = parseAllHeadings(block.content);
    if (headings.length === 0) return;

    headings.forEach((heading) => {
      const newItem: OutlineItem = {
        id: `${block.id}-outline-${heading.lineIndex}`,
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
    const headings = parseAllHeadings(block.content);
    if (headings.length > 0) return headings[0].text;
    const firstLine = block.content.split('\n')[0].trim();
    return firstLine || '文本块';
  } else if (block.type === 'image') {
    return '图片块';
  } else if (block.type === 'code') {
    return `代码块${block.language ? ` (${block.language})` : ''}`;
  }
  return '知识块';
}
