import { v4 as uuidv4 } from 'uuid';
import type { EventNode, EventType, Article } from '../types';

interface DateMatch {
  date: string;
  index: number;
  raw: string;
}

interface KeywordMatch {
  keyword: string;
  type: EventType;
  weight: number;
  index: number;
}

const ENGLISH_MONTHS: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

const KEYWORD_RULES: Array<{
  type: EventType;
  pattern: RegExp;
  weight: number;
  contextBonus?: RegExp;
}> = [
  { type: 'milestone', pattern: /里程碑|重大突破|关键节点|标志性/g, weight: 3 },
  { type: 'milestone', pattern: /达成|完成了.*目标|实现了.*突破/g, weight: 2 },
  { type: 'milestone', pattern: /milestone|breakthrough|landmark|watershed/gi, weight: 3 },
  { type: 'milestone', pattern: /首次|第一次|v1\.0|正式版/g, weight: 2 },
  { type: 'milestone', pattern: /上线.*正式版|正式发布/g, weight: 2.5, contextBonus: /正式/ },

  { type: 'achievement', pattern: /发布|上线|推出|发布了/g, weight: 2 },
  { type: 'achievement', pattern: /成功|顺利完成|圆满结束/g, weight: 1.5 },
  { type: 'achievement', pattern: /release|launch|ship|shipped|go live/gi, weight: 2.5 },
  { type: 'achievement', pattern: /用户突破|收入达到|DAU|突破.*万|突破.*亿/g, weight: 2.5 },
  { type: 'achievement', pattern: /获奖|荣获|获得.*奖/g, weight: 2.5 },
  { type: 'achievement', pattern: /通过.*认证|acquired/gi, weight: 2 },
  { type: 'achievement', pattern: /成果|成效|成绩|业绩/g, weight: 1.5 },
  { type: 'achievement', pattern: /达成.*目标|完成.*任务/g, weight: 2 },

  { type: 'iteration', pattern: /迭代|更新|优化|改进|调整/g, weight: 2 },
  { type: 'iteration', pattern: /修复|bug fix|hotfix|patch/gi, weight: 2.5 },
  { type: 'iteration', pattern: /refactor|重构|v\d+\.\d+\.\d+/gi, weight: 2 },
  { type: 'iteration', pattern: /小版本|minor|update/gi, weight: 1.5 },
  { type: 'iteration', pattern: /改进|升级|upgrade/gi, weight: 1.5 },
  { type: 'iteration', pattern: /第.*期|week \d+|sprint/gi, weight: 1.5 },
];

function pad(n: number | string, len = 2): string {
  return String(n).padStart(len, '0');
}

function isValidDate(y: number, mo: number, d: number): boolean {
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return false;
  const date = new Date(y, mo - 1, d);
  return date.getFullYear() === y && date.getMonth() === mo - 1 && date.getDate() === d;
}

function extractDates(text: string): DateMatch[] {
  const results: DateMatch[] = [];
  const seenPositions = new Set<number>();

  function addMatch(date: string, index: number, raw: string): void {
    for (let i = index; i < index + raw.length; i++) {
      if (seenPositions.has(i)) return;
    }
    for (let i = index; i < index + raw.length; i++) {
      seenPositions.add(i);
    }
    results.push({ date, index, raw });
  }

  for (const m of text.matchAll(/(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s]\d{1,2}:\d{2})?/g)) {
    if (m.index !== undefined) {
      const y = +m[1], mo = +m[2], d = +m[3];
      if (isValidDate(y, mo, d)) {
        addMatch(`${pad(y, 4)}-${pad(mo)}-${pad(d)}`, m.index, m[0]);
      }
    }
  }

  for (const m of text.matchAll(/(\d{4})[年\.\/](\d{1,2})[月\.\/](\d{1,2})[日号.]?/g)) {
    if (m.index !== undefined) {
      const y = +m[1], mo = +m[2], d = +m[3];
      if (isValidDate(y, mo, d)) {
        addMatch(`${pad(y, 4)}-${pad(mo)}-${pad(d)}`, m.index, m[0]);
      }
    }
  }

  for (const m of text.matchAll(/(?<!\d)(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?!\d)/g)) {
    if (m.index !== undefined) {
      const d = +m[1], mo = +m[2], y = +m[3];
      if (isValidDate(y, mo, d)) {
        addMatch(`${pad(y, 4)}-${pad(mo)}-${pad(d)}`, m.index, m[0]);
      }
    }
  }

  for (const m of text.matchAll(
    /(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})/gi
  )) {
    if (m.index !== undefined) {
      const mo = ENGLISH_MONTHS[m[1].toLowerCase()];
      const d = +m[2];
      const y = +m[3];
      if (mo && d >= 1 && d <= 31) {
        addMatch(`${pad(y, 4)}-${pad(mo)}-${pad(d)}`, m.index, m[0]);
      }
    }
  }

  for (const m of text.matchAll(
    /(\d{1,2})(?:st|nd|rd|th)?\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{4})/gi
  )) {
    if (m.index !== undefined) {
      const d = +m[1];
      const mo = ENGLISH_MONTHS[m[2].toLowerCase()];
      const y = +m[3];
      if (mo && d >= 1 && d <= 31) {
        addMatch(`${pad(y, 4)}-${pad(mo)}-${pad(d)}`, m.index, m[0]);
      }
    }
  }

  for (const m of text.matchAll(
    /(\d{4})(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)(\d{1,2})/gi
  )) {
    if (m.index !== undefined) {
      const y = +m[1];
      const mo = ENGLISH_MONTHS[m[2].toLowerCase()];
      const d = +m[3];
      if (mo && d >= 1 && d <= 31) {
        addMatch(`${pad(y, 4)}-${pad(mo)}-${pad(d)}`, m.index, m[0]);
      }
    }
  }

  const today = new Date();
  const relativePatterns = [
    { re: /今天|今日|today/gi, offset: 0 },
    { re: /昨天|昨日|yesterday/gi, offset: -1 },
    { re: /前天|the day before yesterday/gi, offset: -2 },
    { re: /明天|明日|tomorrow/gi, offset: 1 },
    { re: /(\d+)\s*天前|(\d+)\s*days? ago/gi, offsetMatch: true, sign: -1, unit: 'day' },
    { re: /(\d+)\s*周前|(\d+)\s*weeks? ago/gi, offsetMatch: true, sign: -1, unit: 'week' },
    { re: /(\d+)\s*个月前|(\d+)\s*months? ago/gi, offsetMatch: true, sign: -1, unit: 'month' },
  ];

  for (const rp of relativePatterns) {
    for (const m of text.matchAll(rp.re)) {
      if (m.index !== undefined) {
        let d = new Date(today);
        if (rp.offsetMatch) {
          const num = parseInt(m[1] || m[2] || '0', 10);
          const sign = rp.sign || 1;
          if (rp.unit === 'day') d.setDate(d.getDate() + sign * num);
          else if (rp.unit === 'week') d.setDate(d.getDate() + sign * num * 7);
          else if (rp.unit === 'month') d.setMonth(d.getMonth() + sign * num);
        } else {
          d.setDate(d.getDate() + (rp.offset || 0));
        }
        const dateStr = `${pad(d.getFullYear(), 4)}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        addMatch(dateStr, m.index, m[0]);
      }
    }
  }

  results.sort((a, b) => a.index - b.index);
  return results;
}

function findKeywordMatches(text: string): KeywordMatch[] {
  const matches: KeywordMatch[] = [];

  for (const rule of KEYWORD_RULES) {
    for (const m of text.matchAll(rule.pattern)) {
      if (m.index !== undefined) {
        let weight = rule.weight;
        if (rule.contextBonus) {
          const context = text.slice(
            Math.max(0, m.index - 20),
            Math.min(text.length, m.index + m[0].length + 20)
          );
          if (rule.contextBonus.test(context)) {
            weight *= 1.5;
          }
        }
        matches.push({
          keyword: m[0],
          type: rule.type,
          weight,
          index: m.index,
        });
      }
    }
  }

  return matches;
}

function detectEventType(text: string, keywords: KeywordMatch[]): EventType {
  const scores: Record<EventType, number> = {
    milestone: 0,
    achievement: 0,
    iteration: 0,
  };

  for (const kw of keywords) {
    scores[kw.type] += kw.weight;
  }

  let maxType: EventType = 'iteration';
  let maxScore = 0;
  for (const [type, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxType = type as EventType;
    }
  }

  if (maxScore === 0) {
    const len = text.length;
    if (len > 500) return 'milestone';
    if (len > 200) return 'achievement';
    return 'iteration';
  }

  return maxType;
}

function extractTitle(section: string, dateRaw = ''): string {
  const headingMatch = section.match(/^#{1,6}\s+(.+)$/m);
  if (headingMatch) return headingMatch[1].trim();

  const cleanSection = section.replace(dateRaw, '').trim();
  const firstLine = cleanSection
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length > 3);

  if (firstLine) {
    let cleaned = firstLine
      .replace(/^[-–—*]\s*/, '')
      .replace(/^【[^】]*】\s*/, '')
      .replace(/^\d+[.、\)]\s*/, '')
      .replace(/\d{4}[-年.\s]\d{1,2}[-月.\s]\d{1,2}[日号.]?/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleaned.length > 80) cleaned = cleaned.slice(0, 77) + '...';
    return cleaned || '未命名事件';
  }

  return '未命名事件';
}

function generateSummary(text: string): string {
  let clean = text
    .replace(/^#{1,6}\s+.+$/gm, '')
    .replace(/^[-*•]\s+/gm, '')
    .replace(/[*_`#\[\]()]/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return clean.slice(0, 120) + (clean.length > 120 ? '...' : '');
}

function detectReferences(nodes: EventNode[], text: string): void {
  const refPatterns = [
    /如前文所述|如前所述|如上所述|如上文/g,
    /参见|参阅|参考|参看/g,
    /前述|上述|之前的|前文/g,
    /见第.*章|见第.*节/g,
    /see (?:above|before|previous)/gi,
    /refer to (?:the )?(?:above|previous|earlier)/gi,
    /as (?:mentioned|stated|described) (?:above|before|previously)/gi,
  ];

  for (let i = 0; i < nodes.length; i++) {
    const nodeText = nodes[i].rawText;
    let hasRef = false;
    for (const pat of refPatterns) {
      if (pat.test(nodeText)) {
        hasRef = true;
        break;
      }
    }
    if (hasRef) {
      const prevNodes = nodes
        .slice(0, i)
        .filter((n) => n.articleId === nodes[i].articleId)
        .slice(-3)
        .map((n) => n.id);
      nodes[i].references = [...new Set([...nodes[i].references, ...prevNodes])];
    }
  }
}

function mergeNearbyDates(dates: DateMatch[], minGap = 20): DateMatch[] {
  if (dates.length <= 1) return dates;

  const merged: DateMatch[] = [dates[0]];
  for (let i = 1; i < dates.length; i++) {
    const last = merged[merged.length - 1];
    if (dates[i].date === last.date && dates[i].index - last.index < minGap) {
      continue;
    }
    merged.push(dates[i]);
  }
  return merged;
}

export function parseArticle(article: Article): EventNode[] {
  const text = article.content;
  let dates = extractDates(text);
  dates = mergeNearbyDates(dates, 50);

  const allKeywords = findKeywordMatches(text);

  if (dates.length === 0) {
    const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim().length > 8);
    if (paragraphs.length <= 1) {
      return [
        {
          id: uuidv4(),
          articleId: article.id,
          title: extractTitle(text),
          date: article.createdAt.split('T')[0],
          summary: generateSummary(text),
          rawText: text,
          eventType: detectEventType(text, allKeywords),
          order: 0,
          references: [],
        },
      ];
    }

    const nodes: EventNode[] = paragraphs.map((para, i) => {
      const paraKeywords = findKeywordMatches(para);
      return {
        id: uuidv4(),
        articleId: article.id,
        title: extractTitle(para),
        date: article.createdAt.split('T')[0],
        summary: generateSummary(para),
        rawText: para.trim(),
        eventType: detectEventType(para, paraKeywords),
        order: i,
        references: [],
      };
    });

    detectReferences(nodes, text);
    return nodes;
  }

  const sections: { date: string; text: string; rawDate: string }[] = [];

  for (let i = 0; i < dates.length; i++) {
    const startIdx = dates[i].index;
    const endIdx = i + 1 < dates.length ? dates[i + 1].index : text.length;
    const sectionText = text.slice(startIdx, endIdx).trim();
    if (sectionText.length > 0) {
      sections.push({
        date: dates[i].date,
        text: sectionText,
        rawDate: dates[i].raw,
      });
    }
  }

  const beforeFirstDate = text.slice(0, dates[0].index).trim();
  if (beforeFirstDate.length > 30) {
    sections.unshift({
      date: dates[0].date,
      text: beforeFirstDate,
      rawDate: '',
    });
  }

  const nodes: EventNode[] = sections.map((section, i) => {
    const sectionKeywords = findKeywordMatches(section.text);
    return {
      id: uuidv4(),
      articleId: article.id,
      title: extractTitle(section.text, section.rawDate),
      date: section.date,
      summary: generateSummary(section.text),
      rawText: section.text,
      eventType: detectEventType(section.text, sectionKeywords),
      order: i,
      references: [],
    };
  });

  detectReferences(nodes, text);

  return nodes.sort((a, b) => {
    const cmp = a.date.localeCompare(b.date);
    if (cmp !== 0) return cmp;
    return a.order - b.order;
  });
}

export { extractDates, findKeywordMatches, detectEventType, mergeNearbyDates };
