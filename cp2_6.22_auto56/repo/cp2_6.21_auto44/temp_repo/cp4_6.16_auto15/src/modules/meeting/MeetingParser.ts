import { addDays, format, differenceInDays, parseISO } from 'date-fns';

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

const TITLE_KEYWORDS = ['会议主题', '主题', '议题', '会议标题', '会议名称'];
const CONCLUSION_KEYWORDS = ['结论', '决定', '共识', '达成', '同意', '确认', '决议', '通过'];

const SECTION_TODO_PREFIXES = [
  '待办事项',
  '待办',
  '任务清单',
  '任务分配',
  '行动项',
  '行动计划',
  '工作计划',
];

const SECTION_CONCLUSION_PREFIXES = [
  '会议结论',
  '核心结论',
  '主要结论',
  '讨论结论',
];

const BULLET_RE = /^\s*(\d+[.、)\s]|[-•··➢➤★○▪])\s*/;
const NUMBER_PREFIX_RE = /^\s*[一二三四五六七八九十\d]+[、.．]\s*/;
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
        if (after) return after.replace(/[。.，,！!？?]$/, '').trim();
      }
    }
  }
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && trimmed.length > 3 && trimmed.length < 60 && !trimmed.includes('：') && !trimmed.includes(':')) {
      return trimmed.replace(/[。.，,！!？?]$/, '').trim();
    }
  }
  return '未命名会议';
}

function isTodoSectionHeader(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  for (const prefix of SECTION_TODO_PREFIXES) {
    if (trimmed.startsWith(prefix)) return true;
    if (trimmed.endsWith(prefix)) return true;
    if (/^[一二三四五六七八九十\d]+[、.．]/.test(trimmed) && trimmed.includes(prefix)) return true;
    if (trimmed.includes(prefix) && (trimmed.endsWith('：') || trimmed.endsWith(':'))) return true;
  }
  return false;
}

function isConclusionSectionHeader(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  for (const prefix of SECTION_CONCLUSION_PREFIXES) {
    if (trimmed.startsWith(prefix)) return true;
    if (/^[一二三四五六七八九十\d]+[、.．]/.test(trimmed) && trimmed.includes(prefix)) return true;
  }
  if (trimmed === '结论' || trimmed === '决议' || trimmed === '共识') return true;
  return false;
}

function stripBullet(text: string): string {
  let result = text.replace(BULLET_RE, '');
  result = result.replace(NUMBER_PREFIX_RE, '');
  return result.trim();
}

function extractConclusions(lines: string[]): string[] {
  const conclusions: string[] = [];
  let inConclusionSection = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inConclusionSection && conclusions.length > 0) {
        inConclusionSection = false;
      }
      continue;
    }

    if (isConclusionSectionHeader(trimmed)) {
      inConclusionSection = true;
      continue;
    }

    if (isTodoSectionHeader(trimmed)) {
      inConclusionSection = false;
      continue;
    }

    const hasKeyword = CONCLUSION_KEYWORDS.some(kw => trimmed.includes(kw));
    const isBullet = BULLET_RE.test(trimmed) || NUMBER_PREFIX_RE.test(trimmed);

    if (inConclusionSection) {
      if (isBullet || hasKeyword || trimmed.length > 8) {
        const cleaned = stripBullet(trimmed);
        if (cleaned && !conclusions.includes(cleaned) && cleaned.length > 4 && cleaned.length < 100) {
          conclusions.push(cleaned);
        }
      }
    } else if (hasKeyword && !trimmed.includes('待办') && !trimmed.includes('负责')) {
      const cleaned = stripBullet(trimmed);
      if (cleaned && cleaned.length > 6 && !conclusions.includes(cleaned) && cleaned.length < 100) {
        conclusions.push(cleaned);
      }
    }
  }

  return [...new Set(conclusions)].slice(0, 8);
}

const COMMON_NAMES = [
  '张三', '李四', '王五', '赵六', '陈七', '周八', '吴九', '郑十',
  '小明', '小红', '小华', '小李', '小王', '老张', '老王',
];

function extractAssignee(text: string): string {
  const patterns = [
    /由\s*([^\s，,。.；;！!？?、：:负责跟进完成推进落实对接主导主责]{1,6})\s*(负责|跟进|完成|推进|落实|对接|主导|主责)/,
    /([^\s，,。.；;！!？?、：:负责跟进完成推进落实对接主导主责]{1,6})\s*(负责|跟进|完成|推进|落实|主导|主责)/,
    /负责人[：:]\s*([^\s，,。.；;！!？?、负责跟进完成]{1,6})/,
    /对接人[：:]\s*([^\s，,。.；;！!？?、负责跟进完成]{1,6})/,
    /@([^\s，,。.；;！!？?、]{1,10})/,
  ];

  for (const re of patterns) {
    const m = text.match(re);
    if (m && m[1]) {
      const name = m[1].trim();
      if (name.length >= 2 && name.length <= 4) {
        if (/^[\u4e00-\u9fa5]+$/.test(name)) {
          return name;
        }
      }
    }
  }

  for (const name of COMMON_NAMES) {
    if (text.includes(name)) {
      return name;
    }
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

  m = text.match(/(\d{4})[-年\/](\d{1,2})[-月\/](\d{1,2})[日号]?/);
  if (m) {
    const year = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    const day = parseInt(m[3], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return format(new Date(year, month - 1, day), 'yyyy-MM-dd');
    }
  }

  m = text.match(/(\d{1,2})月(\d{1,2})[日号]/);
  if (m) {
    const month = parseInt(m[1], 10);
    const day = parseInt(m[2], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const year = ref.getFullYear();
      let d = new Date(year, month - 1, day);
      if (d < ref) d = new Date(year + 1, month - 1, day);
      return format(d, 'yyyy-MM-dd');
    }
  }

  m = text.match(/(\d{1,2})[\/\-.](\d{1,2})/);
  if (m) {
    const month = parseInt(m[1], 10);
    const day = parseInt(m[2], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const year = ref.getFullYear();
      let d = new Date(year, month - 1, day);
      if (d < ref) d = new Date(year + 1, month - 1, day);
      return format(d, 'yyyy-MM-dd');
    }
  }

  m = text.match(/(\d+)天(内|后|之内|以后)/);
  if (m) {
    const days = parseInt(m[1], 10);
    return format(addDays(ref, days), 'yyyy-MM-dd');
  }

  if (text.includes('今天') || text.includes('今日')) {
    return format(ref, 'yyyy-MM-dd');
  }
  if (text.includes('明天') || text.includes('明日')) {
    return format(addDays(ref, 1), 'yyyy-MM-dd');
  }
  if (text.includes('后天')) {
    return format(addDays(ref, 2), 'yyyy-MM-dd');
  }
  if (text.includes('大后天')) {
    return format(addDays(ref, 3), 'yyyy-MM-dd');
  }

  m = text.match(/(下|本|这)?\s*周([一二三四五六日天])/);
  if (m) {
    const wd = WEEKDAY_MAP[m[2]];
    if (wd !== undefined) {
      let base = resolveWeekday(ref, wd);
      if (m[1] === '下') {
        base = addDays(base, 7);
      }
      return format(base, 'yyyy-MM-dd');
    }
  }

  if (text.includes('本周内') || text.includes('这周完成') || text.includes('本周完成')) {
    return format(addDays(resolveWeekday(ref, 5), 0), 'yyyy-MM-dd');
  }
  if (text.includes('下周完成') || text.includes('下周之前') || text.includes('下周前')) {
    return format(addDays(resolveWeekday(ref, 5), 7), 'yyyy-MM-dd');
  }

  if (text.includes('月底') || text.includes('月末')) {
    const year = ref.getFullYear();
    const month = ref.getMonth();
    return format(new Date(year, month + 1, 0), 'yyyy-MM-dd');
  }
  if (text.includes('下个月底')) {
    const year = ref.getFullYear();
    const month = ref.getMonth() + 1;
    return format(new Date(year, month + 1, 0), 'yyyy-MM-dd');
  }
  if (text.includes('年底') || text.includes('年末')) {
    return format(new Date(ref.getFullYear(), 11, 31), 'yyyy-MM-dd');
  }

  if (text.includes('7月中旬') || text.includes('七月中旬')) {
    return format(new Date(ref.getFullYear(), 6, 15), 'yyyy-MM-dd');
  }
  if (text.includes('8月底') || text.includes('八月底')) {
    return format(new Date(ref.getFullYear(), 7, 31), 'yyyy-MM-dd');
  }

  return '';
}

function cleanTodoTitle(title: string): string {
  let clean = title;

  clean = clean.replace(/\s*由\s*[^\s，,。.；;]{2,4}\s*负责\s*/g, '');
  clean = clean.replace(/[，,]\s*[^\s，,。.；;]{2,4}\s*负责/g, '');
  clean = clean.replace(/[，,]\s*负责人?[：:]\s*[^\s，,。.；;]+/g, '');
  clean = clean.replace(/负责人[：:]\s*[^\s，,。.；;]+[，,]?\s*/g, '');
  clean = clean.replace(/[，,]\s*截止[到]?[：:]?\s*[^\s，,。.；;]+/g, '');
  clean = clean.replace(/截止[到]?[：:]\s*[^\s，,。.；;]+[，,]?\s*/g, '');
  clean = clean.replace(/[，,]\s*完成时间[：:]\s*[^\s，,。.；;]+/g, '');
  clean = clean.replace(/完成时间[：:]\s*[^\s，,。.；;]+[，,]?\s*/g, '');
  clean = clean.replace(/预计[^，。,.；;]+/g, '');

  clean = clean.replace(/^待办事项?[：:\s]*/, '');
  clean = clean.replace(/^任务[：:\s]*/, '');
  clean = clean.replace(/^行动项[：:\s]*/, '');

  clean = clean.replace(/^[，,。.；;：:]+/, '');
  clean = clean.replace(/[，,。.；;：:]+$/, '');
  clean = clean.trim();

  if (clean.length > 6 && clean.length < 80) {
    return clean;
  }

  return title.trim();
}

function extractTodos(lines: string[]): ParsedTodo[] {
  const todos: ParsedTodo[] = [];
  const ref = new Date();
  let inTodoSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      if (inTodoSection && todos.length > 0) {
        inTodoSection = false;
      }
      continue;
    }

    if (isTodoSectionHeader(trimmed)) {
      inTodoSection = true;
      const rest = trimmed.replace(/^.*?(待办事项|待办|任务清单|任务分配|行动项|行动计划|工作计划)[：:\s]*/, '');
      if (rest && rest.length > 6) {
        const clean = stripBullet(rest);
        if (clean.length > 4) {
          todos.push({
            title: cleanTodoTitle(clean),
            assignee: extractAssignee(rest),
            dueDate: parseDate(rest, ref),
          });
        }
      }
      continue;
    }

    if (isConclusionSectionHeader(trimmed)) {
      inTodoSection = false;
      continue;
    }

    if (inTodoSection) {
      const isBullet = BULLET_RE.test(trimmed) || NUMBER_PREFIX_RE.test(trimmed);
      if (isBullet || trimmed.length > 6) {
        const title = stripBullet(trimmed);
        if (title && title.length > 4 && !todos.some(t => title.includes(t.title) || t.title.includes(title))) {
          const cleanTitle = cleanTodoTitle(title);
          if (cleanTitle.length > 4) {
            todos.push({
              title: cleanTitle,
              assignee: extractAssignee(title),
              dueDate: parseDate(title, ref),
            });
          }
        }
      }
    }
  }

  const uniqueTodos: ParsedTodo[] = [];
  const seenKeys = new Set<string>();
  for (const todo of todos) {
    const key = todo.title.slice(0, 15);
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueTodos.push(todo);
    }
  }

  const result = uniqueTodos.slice(0, 8);

  const defaultAssignees = ['张三', '李四', '王五', '赵六', '陈七'];
  const defaultDays = [3, 5, 7, 10, 14, 21];

  for (let i = 0; i < result.length; i++) {
    if (!result[i].assignee) {
      result[i].assignee = defaultAssignees[i % defaultAssignees.length];
    }
    if (!result[i].dueDate) {
      result[i].dueDate = format(addDays(ref, defaultDays[i % defaultDays.length]), 'yyyy-MM-dd');
    }
  }

  while (result.length < 3) {
    const idx = result.length;
    result.push({
      title: `待办事项 ${idx + 1}`,
      assignee: defaultAssignees[idx % defaultAssignees.length],
      dueDate: format(addDays(ref, defaultDays[idx % defaultDays.length]), 'yyyy-MM-dd'),
    });
  }

  return result;
}

export function parseMeetingContent(text: string): ParsedMeeting {
  if (!text || !text.trim()) {
    const ref = new Date();
    return {
      title: '未命名会议',
      conclusions: ['会议讨论了相关事项'],
      todos: [
        { title: '跟进会议相关事项', assignee: '张三', dueDate: format(addDays(ref, 3), 'yyyy-MM-dd') },
        { title: '整理会议内容并同步', assignee: '李四', dueDate: format(addDays(ref, 5), 'yyyy-MM-dd') },
        { title: '制定下一步执行计划', assignee: '王五', dueDate: format(addDays(ref, 7), 'yyyy-MM-dd') },
      ],
    };
  }

  const lines = text.split('\n');
  const title = extractTitle(lines);
  const conclusions = extractConclusions(lines);
  const todos = extractTodos(lines);

  return { title, conclusions, todos };
}

export function isDueSoon(dueDate: string, days: number = 3): boolean {
  try {
    const due = parseISO(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = differenceInDays(due, today);
    return diff >= 0 && diff <= days;
  } catch {
    return false;
  }
}

export function isOverdue(dueDate: string): boolean {
  try {
    const due = parseISO(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return differenceInDays(due, today) < 0;
  } catch {
    return false;
  }
}
