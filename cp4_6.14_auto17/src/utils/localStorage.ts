import type { Note, NoteWithoutMeta } from '../types';

const STORAGE_KEY = 'digital_garden_notes_v1';

const delay = (ms = 50) => new Promise<void>((r) => setTimeout(r, ms));

export async function loadNotes(): Promise<Note[]> {
  await delay();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getSeedNotes();
    const parsed = JSON.parse(raw) as Note[];
    if (!Array.isArray(parsed)) return getSeedNotes();
    return parsed;
  } catch {
    return getSeedNotes();
  }
}

export async function saveNotes(notes: Note[]): Promise<void> {
  await delay();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function extractTags(content: string): string[] {
  const re = /#(\S+)/g;
  const set = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    set.add(m[1]);
  }
  return Array.from(set);
}

export function extractLinkedIds(content: string, allNotes: Note[]): string[] {
  const re = /\[\[([^\]]+)\]\]/g;
  const map = new Map(allNotes.map((n) => [n.title.trim(), n.id]));
  const set = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    const title = m[1].trim();
    if (map.has(title)) set.add(map.get(title) as string);
  }
  return Array.from(set);
}

export function extractTitle(content: string, fallback = '无标题笔记'): string {
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('# ')) {
      return trimmed.slice(2).trim() || fallback;
    }
    return trimmed.slice(0, 40) || fallback;
  }
  return fallback;
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function genId(): string {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 10)
  );
}

export function createNote(partial: NoteWithoutMeta, allNotes: Note[]): Note {
  const id = genId();
  const ts = nowISO();
  const title = extractTitle(partial.content);
  const tags = extractTags(partial.content);
  const linkedIds = extractLinkedIds(partial.content, allNotes);
  return {
    id,
    title,
    content: partial.content,
    createdAt: ts,
    updatedAt: ts,
    tags,
    linkedIds,
  };
}

export function updateNote(note: Note, content: string, allNotes: Note[]): Note {
  return {
    ...note,
    content,
    title: extractTitle(content, note.title),
    tags: extractTags(content),
    linkedIds: extractLinkedIds(content, allNotes),
    updatedAt: nowISO(),
  };
}

export function rebuildNoteLinks(allNotes: Note[]): Note[] {
  return allNotes.map((n) => ({
    ...n,
    linkedIds: extractLinkedIds(n.content, allNotes),
  }));
}

function getSeedNotes(): Note[] {
  const now = nowISO();
  const seed: Note[] = [
    {
      id: genId(),
      title: '欢迎来到数字花园',
      content:
        '# 欢迎来到数字花园\n\n这是一个用于记录灵感、创作片段和关联笔记的空间。\n\n## 如何使用\n\n- **双向链接**：使用 `[[笔记标题]]` 语法创建链接，例如 [[知识管理入门]]\n- **标签系统**：使用 `#标签` 添加分类，例如 #灵感 #写作\n- **关系图谱**：右上角视图中可以看到笔记之间的连接关系\n\n## 代码示例\n\n```js\nconst greet = (name) => `Hello, ${name}!`;\nconsole.log(greet("World"));\n```\n\n开始记录你的想法吧！ #入门 #指南',
      createdAt: now,
      updatedAt: now,
      tags: ['入门', '指南'],
      linkedIds: [],
    },
    {
      id: genId(),
      title: '知识管理入门',
      content:
        '# 知识管理入门\n\n知识管理的核心在于**连接**而非**收集**。\n\n## 核心原则\n\n1. 及时记录灵感\n2. 定期回顾整理\n3. 建立笔记之间的关联\n\n参考：[[欢迎来到数字花园]] 的入门指南\n\n推荐阅读相关方法：\n- Zettelkasten 卡片盒笔记法\n- PARA 项目组织法\n\n#方法论 #学习',
      createdAt: now,
      updatedAt: now,
      tags: ['方法论', '学习'],
      linkedIds: [],
    },
    {
      id: genId(),
      title: '每日灵感集',
      content:
        '# 每日灵感集\n\n## 2024-01-15\n\n> "简单就是终极的复杂。" —— 达芬奇\n\n今天思考的问题：\n- 如何让笔记系统真正「长」在脑子里\n- 写作是最好的思考工具\n\n关联：[[知识管理入门]]\n\n#灵感 #写作 #思考',
      createdAt: now,
      updatedAt: now,
      tags: ['灵感', '写作', '思考'],
      linkedIds: [],
    },
  ];
  return rebuildNoteLinks(seed);
}
