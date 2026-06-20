import { v4 as uuid } from 'uuid';
import type {
  ParsedResult,
  SkillScores,
  WordFrequency,
  ExperienceItem,
  SkillDimension
} from '../types';
import { SKILL_KEYWORDS, ALL_DIMENSIONS } from '../constants/skillKeywords';

export function parseResume(rawText: string): ParsedResult {
  const normalized = normalizeText(rawText);
  const wordFrequencies = extractWordFrequencies(normalized);
  const skillScores = computeSkillScores(normalized, wordFrequencies);
  const experiences = extractExperiences(normalized);

  return {
    rawText,
    skillScores,
    wordFrequencies: wordFrequencies
      .filter((w) => w.value >= 1)
      .sort((a, b) => b.value - a.value)
      .slice(0, 80),
    experiences: sortExperiencesByDate(experiences),
    parsedAt: Date.now()
  };
}

function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const DATE_PATTERNS: RegExp[] = [
  /(\d{4})[-\/年\.](\d{1,2})?([-\/月\.至到~—–-]+(\d{4})?[-\/年\.]?(\d{1,2})?)?[月至今现在]*/g,
  /(\d{4})\.(\d{1,2})\s*[-~—–]\s*(\d{4})\.(\d{1,2})/g
];

const POSITION_KEYWORDS = [
  '工程师', '高级工程师', '资深工程师', '架构师', '技术专家',
  '经理', '高级经理', '总监', '主管', '组长', '负责人',
  '分析师', '设计师', '产品经理', '项目经理', '运营经理',
  '开发', '前端', '后端', '全栈', '算法', '数据', '测试', '运维',
  '实习生', '助理', '专员', '顾问'
];

const COMPANY_SUFFIXES = [
  '有限公司', '股份有限公司', '科技', '信息技术', '网络科技',
  '信息科技', '软件', '数据科技', '人工智能', '集团', '控股',
  '公司', '工作室', '实验室', '研究所', '大学', '学院'
];

function extractWordFrequencies(normalized: string): WordFrequency[] {
  const counter = new Map<string, number>();

  const upperText = normalized;
  const allKeywords = new Set<string>();
  ALL_DIMENSIONS.forEach((d) => {
    SKILL_KEYWORDS[d].forEach((k) => allKeywords.add(k));
  });

  const sortedKeywords = Array.from(allKeywords).sort(
    (a, b) => b.length - a.length
  );

  for (const kw of sortedKeywords) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(
      `(^|[\\s,，。、；;：:()（）\\[\\]【】"'` + '`' + `\\-—~|/\\\\])${escaped}($|[\\s,，。、；;：:()（）\\[\\]【】"'` + '`' + `\\-—~|/\\\\])`,
      'gi'
    );
    const matches = upperText.match(regex);
    if (matches && matches.length > 0) {
      counter.set(kw, (counter.get(kw) ?? 0) + matches.length);
    }
  }

  const tokens = tokenize(normalized);
  for (const t of tokens) {
    if (t.length < 2) continue;
    if (/^[\d\.%]+$/.test(t)) continue;
    if (allKeywords.has(t)) continue;
    counter.set(t, (counter.get(t) ?? 0) + 1);
  }

  return Array.from(counter.entries()).map(([text, value]) => ({
    text,
    value
  }));
}

function tokenize(text: string): string[] {
  const tokens: string[] = [];
  const wordRe = /[A-Za-z][A-Za-z0-9+\-.#]*/g;
  let m: RegExpExecArray | null;
  while ((m = wordRe.exec(text)) !== null) {
    tokens.push(m[0]);
  }
  return tokens;
}

function computeSkillScores(
  _text: string,
  frequencies: WordFrequency[]
): SkillScores {
  const dimRaw: Record<SkillDimension, number> = {
    前端: 0,
    后端: 0,
    数据库: 0,
    设计: 0,
    项目管理: 0,
    沟通: 0
  };

  const freqMap = new Map(frequencies.map((f) => [f.text.toLowerCase(), f.value]));

  ALL_DIMENSIONS.forEach((dim) => {
    const kws = SKILL_KEYWORDS[dim];
    let weighted = 0;
    let hit = 0;
    for (let i = 0; i < kws.length; i++) {
      const kw = kws[i];
      const v = freqMap.get(kw.toLowerCase()) ?? 0;
      const weight = computeKeywordWeight(i, kws.length);
      weighted += v * weight;
      if (v > 0) hit += 1;
    }
    const hitBoost = Math.min(1, hit / Math.max(1, kws.length / 3));
    dimRaw[dim] = weighted * (0.5 + 0.5 * hitBoost);
  });

  const scores: Partial<SkillScores> = {};
  const maxRaw = Math.max(1, ...ALL_DIMENSIONS.map((d) => dimRaw[d]));
  ALL_DIMENSIONS.forEach((dim) => {
    const ratio = dimRaw[dim] / maxRaw;
    const score = sigmoidScale(ratio * 3);
    scores[dim] = Math.round(score * 100);
  });

  return {
    前端: scores.前端!,
    后端: scores.后端!,
    数据库: scores.数据库!,
    设计: scores.设计!,
    项目管理: scores.项目管理!,
    沟通: scores.沟通!
  };
}

function computeKeywordWeight(index: number, total: number): number {
  const t = index / Math.max(1, total - 1);
  return 1.5 - 0.8 * t;
}

function sigmoidScale(x: number): number {
  return 1 / (1 + Math.exp(-x * 2 + 1));
}

function extractExperiences(normalized: string): ExperienceItem[] {
  const lines = normalized.split('\n');
  const blocks: ExperienceItem[] = [];
  let current: Partial<ExperienceItem> | null = null;
  const descLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (current) {
        finalizeBlock(current, descLines);
        if (isValidBlock(current)) {
          blocks.push(buildItem(current));
        }
        current = null;
        descLines.length = 0;
      }
      continue;
    }

    const dateMatch = detectDateRange(trimmed);
    if (dateMatch) {
      if (current) {
        finalizeBlock(current, descLines);
        if (isValidBlock(current)) {
          blocks.push(buildItem(current));
        }
      }
      current = {};
      descLines.length = 0;
      current.startDate = dateMatch.start;
      current.endDate = dateMatch.end;

      const withoutDate = trimmed
        .replace(/\d{4}[-\/年\.](\d{1,2})?([月至今现在\.\/-~\s—–-]{1,8}\d{0,4}[-\/年\.]?\d{0,2}[月至今现在]?)+/g, '')
        .replace(/[·|｜\-\s]+/g, ' ')
        .trim();

      const { company, position } = splitCompanyPosition(withoutDate);
      if (company) current.company = company;
      if (position) current.position = position;
      continue;
    }

    if (current) {
      descLines.push(trimmed);
    }
  }

  if (current) {
    finalizeBlock(current, descLines);
    if (isValidBlock(current)) {
      blocks.push(buildItem(current));
    }
  }

  if (blocks.length === 0) {
    return extractExperiencesFallback(normalized);
  }

  return blocks;
}

function finalizeBlock(item: Partial<ExperienceItem>, lines: string[]): void {
  if (!item.company || !item.position) {
    for (const l of lines) {
      if (!item.company) {
        const c = findCompany(l);
        if (c) {
          item.company = c;
          continue;
        }
      }
      if (!item.position) {
        const p = findPosition(l);
        if (p) {
          item.position = p;
          continue;
        }
      }
      if (item.company && item.position) break;
    }
  }
  const { projects, description } = parseProjectsAndDesc(lines);
  item.projects = projects;
  item.description = description;
}

function isValidBlock(item: Partial<ExperienceItem>): boolean {
  return Boolean(
    (item.company || item.position) &&
      (item.startDate || item.endDate)
  );
}

function buildItem(item: Partial<ExperienceItem>): ExperienceItem {
  return {
    id: uuid(),
    company: item.company ?? '未知公司',
    position: item.position ?? '未知职位',
    startDate: item.startDate ?? '',
    endDate: item.endDate ?? '至今',
    description: item.description ?? '',
    projects: item.projects ?? []
  };
}

function detectDateRange(line: string): { start: string; end: string } | null {
  const re1 =
    /(\d{4})[-\/年\.](\d{1,2})?[月]?\s*[-~—–至到]+\s*(\d{4})?[-\/年\.]?(\d{1,2})?[月]?(至今|现在)?/;
  const m1 = line.match(re1);
  if (m1) {
    const startY = m1[1];
    const startM = m1[2] ?? '01';
    const endY = m1[3] ?? (m1[5] ? '至今' : startY);
    const endM = m1[4] ?? (m1[5] ? '' : startM);
    const start = `${startY}.${pad2(startM)}`;
    const end = endY === '至今' || m1[5] ? '至今' : `${endY}.${pad2(endM)}`;
    return { start, end };
  }

  const re2 = /(\d{4})\s*年\s*(\d{1,2})\s*月/;
  const m2 = line.match(re2);
  if (m2) {
    return { start: `${m2[1]}.${pad2(m2[2])}`, end: '至今' };
  }

  return null;
}

function pad2(s: string): string {
  if (s.length === 0) return '01';
  return s.padStart(2, '0');
}

function splitCompanyPosition(text: string): {
  company: string;
  position: string;
} {
  const seps = /[·|｜\/\[\]()（）【】]|\s-\s|\s{2,}|,|，/;
  const parts = text.split(seps).map((p) => p.trim()).filter(Boolean);

  let company = '';
  let position = '';

  for (const p of parts) {
    if (!position && findPosition(p)) {
      position = findPosition(p)!;
    } else if (!company && findCompany(p)) {
      company = findCompany(p)!;
    } else if (!position && /工程|经理|总监|主管|组长|负责|开发|设计|产品|运营|分析|测试|算法|数据|架构/.test(p)) {
      position = p;
    } else if (!company && /公司|科技|集团|有限|大学|学院|实验室|工作室/.test(p)) {
      company = p;
    }
  }

  if (!company && parts.length > 0 && !position) {
    company = parts[0];
  }
  if (!position && parts.length > 1) {
    position = parts[parts.length - 1];
  }
  if (!company && !position && parts[0]) {
    const middle = Math.floor(parts[0].length / 2);
    company = parts[0].slice(0, middle);
    position = parts[0].slice(middle);
  }

  return {
    company: company.slice(0, 30),
    position: position.slice(0, 30)
  };
}

function findCompany(text: string): string | null {
  for (const suf of COMPANY_SUFFIXES) {
    const idx = text.indexOf(suf);
    if (idx >= 0) {
      let start = Math.max(0, idx - 24);
      const prev = text.slice(start, idx);
      const separators = /[\s|｜｜，,\/\[\]()（）【】\-—~·•]/g;
      const lastSep = Math.max(
        ...[...prev.matchAll(separators)].map((m) => (m.index ?? 0) + start + 1),
        start - 1
      );
      if (lastSep >= start) start = lastSep;
      const result = text.slice(start, idx + suf.length).trim();
      return result.replace(/^[\s|｜｜，,\/\[\]()（）【】\-—~·•]+/, '');
    }
  }
  return null;
}

function findPosition(text: string): string | null {
  for (const kw of POSITION_KEYWORDS) {
    const idx = text.lastIndexOf(kw);
    if (idx >= 0) {
      const start = Math.max(0, idx - 8);
      return text.slice(start, idx + kw.length).trim();
    }
  }
  return null;
}

function parseProjectsAndDesc(lines: string[]): {
  projects: string[];
  description: string;
} {
  const projects: string[] = [];
  const descBuf: string[] = [];

  const projPrefixes = ['项目名称', '负责项目', '项目经历', '主要项目', '参与项目'];
  const quoted = /[《"“]([^》”"]{2,40})[》"”]/g;

  for (const l of lines) {
    let matched = false;
    for (const p of projPrefixes) {
      if (l.includes(p)) {
        const clean = l
          .replace(/^[-*·•\s]+/, '')
          .replace(/.*[:：]\s*/, '')
          .trim();
        if (clean.length > 1) {
          const names = clean.split(/[、,，;；/]+/).map((s) => s.trim()).filter(Boolean);
          projects.push(...names);
          matched = true;
        }
        break;
      }
    }

    let m: RegExpExecArray | null;
    const re = new RegExp(quoted.source, quoted.flags);
    while ((m = re.exec(l)) !== null) {
      if (!projects.includes(m[1])) projects.push(m[1]);
    }

    if (!matched && /[-*·•\s]/.test(l.slice(0, 1)) || l.length > 6) {
      descBuf.push(l);
    }
  }

  return {
    projects: Array.from(new Set(projects)).slice(0, 8),
    description: descBuf.join('\n').slice(0, 600)
  };
}

function extractExperiencesFallback(normalized: string): ExperienceItem[] {
  const sections = normalized.split(/\n\n+/);
  const items: ExperienceItem[] = [];
  for (let i = 0; i < Math.min(4, sections.length); i++) {
    const s = sections[i].slice(0, 200);
    if (s.length < 6) continue;
    const lines = s.split('\n');
    items.push({
      id: uuid(),
      company: findCompany(s) || lines[0]?.slice(0, 20) || '公司' + (i + 1),
      position: findPosition(s) || '职位' + (i + 1),
      startDate: `202${4 - i}.0${Math.max(1, i + 1)}`,
      endDate: i === 0 ? '至今' : `202${5 - i}.0${i + 2}`,
      description: lines.slice(1, 5).join('\n').slice(0, 200),
      projects: []
    });
  }
  return items;
}

function sortExperiencesByDate(items: ExperienceItem[]): ExperienceItem[] {
  const weight = (d: string): number => {
    if (d === '至今' || !d) return 999999;
    const m = d.match(/(\d{4})\.(\d{1,2})/);
    if (!m) return 0;
    return parseInt(m[1]) * 12 + parseInt(m[2]);
  };
  return [...items].sort((a, b) => weight(b.startDate) - weight(a.startDate));
}

export function computeMatchScore(
  skillScores: SkillScores,
  baseline: SkillScores,
  keywords: string[],
  wordFrequencies: WordFrequency[]
) {
  const comparisons = ALL_DIMENSIONS.map((dim) => {
    const resumeScore = skillScores[dim];
    const baselineScore = baseline[dim];
    const diffPercent = Math.round(
      ((resumeScore - baselineScore) / Math.max(1, baselineScore)) * 100
    );
    return {
      dimension: dim,
      resumeScore,
      baselineScore,
      diffPercent,
      hasWarning: diffPercent < -20
    };
  });

  const weightSum = ALL_DIMENSIONS.reduce((s, d) => s + baseline[d], 0);
  const weighted = ALL_DIMENSIONS.reduce(
    (s, d) =>
      s +
      (Math.min(skillScores[d], baseline[d] * 1.1) / baseline[d]) *
        (baseline[d] / weightSum) *
        100,
    0
  );

  const freqMap = new Map(wordFrequencies.map((w) => [w.text.toLowerCase(), true]));
  const matchedKw = keywords.filter((k) => freqMap.has(k.toLowerCase()));
  const missingKw = keywords.filter(
    (k) => !freqMap.has(k.toLowerCase())
  );

  const kwBoost =
    (matchedKw.length / Math.max(1, keywords.length)) * 10;
  const totalScore = Math.max(
    0,
    Math.min(100, Math.round(weighted * 0.9 + kwBoost))
  );

  let scoreColor: 'red' | 'orange' | 'green' = 'orange';
  if (totalScore < 60) scoreColor = 'red';
  else if (totalScore >= 80) scoreColor = 'green';

  return {
    totalScore,
    scoreColor,
    comparisons,
    matchedKeywords: matchedKw.slice(0, 15),
    missingKeywords: missingKw.slice(0, 15)
  };
}
