import { EMOTION_TAGS } from '@/constants/tags';
import type { Work, TagNode, TagLink, EmotionCategory } from '@/types';

export function buildGraphData(works: Work[]): { nodes: TagNode[]; links: TagLink[] } {
  const tagCountMap = new Map<string, number>();
  const tagCategoryMap = new Map<string, EmotionCategory>();
  
  EMOTION_TAGS.forEach((tag) => {
    tagCategoryMap.set(tag.name, tag.category);
  });

  works.forEach((work) => {
    work.tags.forEach((tag) => {
      tagCountMap.set(tag, (tagCountMap.get(tag) || 0) + 1);
    });
  });

  const nodes: TagNode[] = [];
  tagCountMap.forEach((count, tag) => {
    if (count > 0) {
      nodes.push({
        id: tag,
        name: tag,
        category: tagCategoryMap.get(tag) || 'mystery',
        value: count,
      });
    }
  });

  const linkMap = new Map<string, number>();
  works.forEach((work) => {
    const tags = work.tags;
    for (let i = 0; i < tags.length; i++) {
      for (let j = i + 1; j < tags.length; j++) {
        const key = [tags[i], tags[j]].sort().join('|');
        linkMap.set(key, (linkMap.get(key) || 0) + 1);
      }
    }
  });

  const links: TagLink[] = [];
  linkMap.forEach((value, key) => {
    const [source, target] = key.split('|');
    if (tagCountMap.has(source) && tagCountMap.has(target)) {
      links.push({ source, target, value });
    }
  });

  return { nodes, links };
}

export function getNodeRadius(value: number, minR = 8, maxR = 30): number {
  const minVal = 1;
  const maxVal = 20;
  const normalized = Math.min(Math.max((value - minVal) / (maxVal - minVal), 0), 1);
  return minR + normalized * (maxR - minR);
}
