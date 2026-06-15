import { addDays, format } from 'date-fns';

export interface ParsedTodo {
  title: string;
  assignee: string;
  dueDate: string;
}

export interface ParsedMeeting {
  title: string;
  conclusions: string[];
  todos: ParsedTodo[];
}

const TITLE_KEYWORDS = ['会议主题', '主题', '议题'];
const CONCLUSION_KEYWORDS = ['结论', '决定', '共识', '达成', '同意', '确认', '决议', '通过'];
const TODO_KEYWORDS = ['待办', '任务', '行动项', '跟进', '推进', '负责', '完成', '落实'];
const SECTION_CONCLUSION_KEYWORDS = ['结论', '决议'];

const BULLET_RE = /^\s*(\d+[.、)\s]|[-•·])\s*/;
const WEEKDAY_MAP: Record<string, number> = {
  '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 0, '天': 0,
};

function extractTitle(lines: string[]): string {
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    for (const kw of TITLE_KEYWORDS) {
      const idx = trimmed.indexOf(kw);
      if (idx !== -1) {
        const after = trimmed.substring(idx + kw.length).replace(/^[\s：:]+/, '');
        if (after) return after;
      }
    }
  }
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed) return trimmed;
  }
  return '未命名会议';
}

function isSectionHeader(line: string, keywords: string[]): boolean {
  const trimmed = line.trim();
  for (const kw of keywords) {
    if (trimmed.includes(kw) && (trimmed.endsWith('：') || trimmed.endsWith(':') || trimmed.endsWith('：') || trimmed.length <= kw.length + 6)) {
      return true;
    }
  }
  return false;
}

function stripBullet(text: string): string {
  return text.replace(BULLET_RE, '').trim();
}

function extractConclusions(lines: string[]): string[] {
  const conclusions: string[] = [];
  let inConclusionSection = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      inConclusionSection = false;
      continue;
    }

    const isHeader = isSectionHeader(trimmed, SECTION_CONCLUSION_KEYWORDS);
    if (isHeader) {
      inConclusionSection = true;
      const afterHeader = trimmed.replace(/^.*?(结论|决议)[：:\s]*/, '').trim();
      if (afterHeader) {
        conclusions.push(afterHeader);
      }
      continue;
    }

    const hasKeyword = CONCLUSION_KEYWORDS.some(kw => trimmed.includes(kw));

    if (inConclusionSection) {
      const isBullet = BULLET_RE.test(trimmed);
      if (isBullet || hasKeyword) {
        conclusions.push(stripBullet(trimmed));
      } else {
        inConclusionSection = false;
      }
    } else if (hasKeyword) {
      conclusions.push(stripBullet(trimmed));
    }
  }

  return conclusions;
}

function extractAssignee(text: string): string {
  const patterns = [
    /([^\s，,。.；;！!？?]{1,4})(负责|跟进|完成|推进|落实)/,
    /由([^\s，,。.；;！!？?]{1,4})/,
    /负责人[：:]\s*([^\s，,。.；;！!？?]{1,4})/,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return m[1];
  }
  return '';
}

function resolveWeekday(ref: Date, weekday: number): Date {
  const refDay = ref.getDay();
  let diff = weekday - refDay;
  if (diff <= 0) diff += 7;
  return addDays(ref, diff);
}

function parseDate(text: string, ref: Date): string {
  let m: RegExpMatchArray | null;

  m = text.match(/(\d{1,2})月(\d{1,2})[日号]/);
  if (m) {
    const month = parseInt(m[1], 10);
    const day = parseInt(m[2], 10);
    const year = ref.getFullYear();
    return format(new Date(year, month - 1, day), 'yyyy-MM-dd');
  }

  m = text.match(/(\d{1,2})\/(\d{1,2})/);
  if (m) {
    const month = parseInt(m[1], 10);
    const day = parseInt(m[2], 10);
    const year = ref.getFullYear();
    return format(new Date(year, month - 1, day), 'yyyy-MM-dd');
  }

  m = text.match(/下?本?周([一二三四五六日天])/);
  if (m) {
    const wd = WEEKDAY_MAP[m[1]];
    if (wd !== undefined) {
      if (text.includes('下周')) {
        return format(addDays(resolveWeekday(ref, wd), 7), 'yyyy-MM-dd');
      }
      if (text.includes('本周')) {
        return format(resolveWeekday(ref, wd), 'yyyy-MM-dd');
      }
    }
  }

  if (text.includes('月底')) {
    const year = ref.getFullYear();
    const month = ref.getMonth();
    return format(new Date(year, month + 1, 0), 'yyyy-MM-dd');
  }

  if (text.includes('年底')) {
    return format(new Date(ref.getFullYear(), 11, 31), 'yyyy-MM-dd');
  }

  return '';
}

function extractTodos(lines: string[], conclusions: string[]): ParsedTodo[] {
  const todos: ParsedTodo[] = [];
  const ref = new Date();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const hasKeyword = TODO_KEYWORDS.some(kw => trimmed.includes(kw));
    if (!hasKeyword) continue;

    const items = splitBullets(trimmed);
    for (const item of items) {
      const title = stripBullet(item).trim();
      if (!title) continue;
      todos.push({
        title,
        assignee: extractAssignee(title),
        dueDate: parseDate(title, ref),
      });
    }
  }

  while (todos.length < 3 && conclusions.length > 0) {
    const idx = todos.length;
    if (idx >= conclusions.length) break;
    todos.push({
      title: `跟进结论${idx + 1}：${conclusions[idx]}`,
      assignee: '',
      dueDate: format(addDays(ref, 7), 'yyyy-MM-dd'),
    });
  }

  while (todos.length < 3) {
    const idx = todos.length;
    todos.push({
      title: `跟进结论${idx + 1}`,
      assignee: '',
      dueDate: format(addDays(ref, 7), 'yyyy-MM-dd'),
    });
  }

  return todos;
}

function splitBullets(text: string): string[] {
  const parts = text.split(/\s+(?=\d+[.、)\s]|[-•·]\s)/);
  if (parts.length <= 1) return [text];
  return parts.filter(p => p.trim());
}

export function parseMeetingContent(text: string): ParsedMeeting {
  const lines = text.split('\n');
  const title = extractTitle(lines);
  const conclusions = extractConclusions(lines);
  const todos = extractTodos(lines, conclusions);
  return { title, conclusions, todos };
}
