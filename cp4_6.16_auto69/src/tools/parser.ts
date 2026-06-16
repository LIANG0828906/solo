import { v4 as uuidv4 } from 'uuid';
import type { EventNode, EventType, Article } from '../types';

const KEYWORD_MAP: Record<EventType, string[]> = {
  milestone: ['里程碑', '突破', '达成', '重大', '关键', 'milestone', 'breakthrough', 'landmark'],
  achievement: ['发布', '上线', '完成', '成功', '实现', 'release', 'launch', 'completed', 'achieved', 'shipped'],
  iteration: ['迭代', '更新', '优化', '修复', '改进', '调整', 'update', 'fix', 'improve', 'refactor', 'patch'],
};

function detectEventType(text: string): EventType {
  let maxScore = 0;
  let detectedType: EventType = 'iteration';

  for (const [type, keywords] of Object.entries(KEYWORD_MAP)) {
    let score = 0;
    for (const kw of keywords) {
      const regex = new RegExp(kw, 'gi');
      const matches = text.match(regex);
      if (matches) score += matches.length;
    }
    if (score > maxScore) {
      maxScore = score;
      detectedType = type as EventType;
    }
  }

  return detectedType;
}

function extractDates(text: string): { date: string; index: number }[] {
  const results: { date: string; index: number }[] = [];

  for (const match of text.matchAll(/(\d{4})-(\d{2})-(\d{2})/g)) {
    if (match.index !== undefined) {
      results.push({ date: match[0], index: match.index });
    }
  }

  for (const match of text.matchAll(/(\d{4})年(\d{1,2})月(\d{1,2})日/g)) {
    if (match.index !== undefined) {
      const y = match[1];
      const m = match[2].padStart(2, '0');
      const d = match[3].padStart(2, '0');
      results.push({ date: `${y}-${m}-${d}`, index: match.index });
    }
  }

  for (const match of text.matchAll(/(\d{4})\.(\d{2})\.(\d{2})/g)) {
    if (match.index !== undefined) {
      results.push({ date: `${match[1]}-${match[2]}-${match[3]}`, index: match.index });
    }
  }

  results.sort((a, b) => a.index - b.index);
  return results;
}

function extractTitle(section: string): string {
  const headingMatch = section.match(/^#{1,6}\s+(.+)$/m);
  if (headingMatch) return headingMatch[1].trim();

  const firstLine = section
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length > 0 && !l.match(/^\d{4}[-年.\s]/));
  if (firstLine) {
    const cleaned = firstLine
      .replace(/\d{4}[-年]\d{1,2}[-月]\d{1,2}[日.]?\s*/g, '')
      .replace(/^[-–—]\s*/, '')
      .trim();
    return cleaned.slice(0, 60) || '未命名事件';
  }

  return '未命名事件';
}

function generateSummary(text: string): string {
  const cleanText = text
    .replace(/^#{1,6}\s+.+$/gm, '')
    .replace(/[*_`#\[\]()！？。，、；：""''【】]/g, '')
    .replace(/\n+/g, ' ')
    .trim();

  return cleanText.slice(0, 100) + (cleanText.length > 100 ? '...' : '');
}

function detectReferences(nodes: EventNode[]): void {
  const refPatterns = [
    /如前文所述/g,
    /参见/g,
    /参考/g,
    /引用/g,
    /见前/g,
    /前述/g,
    /see above/gi,
    /refer to/gi,
    /as mentioned/gi,
  ];

  for (let i = 0; i < nodes.length; i++) {
    for (const pattern of refPatterns) {
      if (pattern.test(nodes[i].rawText)) {
        const refs = nodes
          .slice(0, i)
          .filter((n) => n.articleId === nodes[i].articleId)
          .slice(-2)
          .map((n) => n.id);
        nodes[i].references = [...new Set([...nodes[i].references, ...refs])];
      }
    }
  }
}

export function parseArticle(article: Article): EventNode[] {
  const text = article.content;
  const dates = extractDates(text);

  if (dates.length === 0) {
    const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim().length > 10);
    if (paragraphs.length <= 1) {
      return [
        {
          id: uuidv4(),
          articleId: article.id,
          title: article.title,
          date: article.createdAt.split('T')[0],
          summary: generateSummary(text),
          rawText: text,
          eventType: detectEventType(text),
          order: 0,
          references: [],
        },
      ];
    }

    const nodes: EventNode[] = paragraphs.map((para, i) => ({
      id: uuidv4(),
      articleId: article.id,
      title: extractTitle(para),
      date: article.createdAt.split('T')[0],
      summary: generateSummary(para),
      rawText: para.trim(),
      eventType: detectEventType(para),
      order: i,
      references: [],
    }));

    detectReferences(nodes);
    return nodes;
  }

  const nodes: EventNode[] = [];
  const sections: { date: string; text: string }[] = [];

  for (let i = 0; i < dates.length; i++) {
    const startIdx = dates[i].index;
    const endIdx = i + 1 < dates.length ? dates[i + 1].index : text.length;
    const sectionText = text.slice(startIdx, endIdx).trim();
    if (sectionText.length > 0) {
      sections.push({ date: dates[i].date, text: sectionText });
    }
  }

  const beforeFirstDate = text.slice(0, dates[0].index).trim();
  if (beforeFirstDate.length > 20) {
    sections.unshift({
      date: dates[0].date,
      text: beforeFirstDate,
    });
  }

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    nodes.push({
      id: uuidv4(),
      articleId: article.id,
      title: extractTitle(section.text),
      date: section.date,
      summary: generateSummary(section.text),
      rawText: section.text,
      eventType: detectEventType(section.text),
      order: i,
      references: [],
    });
  }

  detectReferences(nodes);

  return nodes.sort((a, b) => a.date.localeCompare(b.date));
}
