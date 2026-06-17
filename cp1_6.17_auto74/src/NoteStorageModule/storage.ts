import { v4 as uuidv4 } from 'uuid';
import type { Note } from '../types';

const STORAGE_KEY = 'knowledge_base_notes';

function readFromStorage(): Note[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to read from storage:', e);
  }
  return [];
}

function writeToStorage(notes: Note[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (e) {
    console.error('Failed to write to storage:', e);
  }
}

function initializeWithSampleData(): Note[] {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  const sampleNotes: Note[] = [
    {
      id: uuidv4(),
      title: '欢迎使用个人知识库',
      content: '<p>这是一个强大的个人知识管理工具。您可以：</p><ul><li><b>创建和编辑笔记</b></li><li><i>使用标签分类整理</i></li><li>快速全文搜索</li><li>查看数据统计图表</li></ul>',
      tags: ['使用指南', '入门'],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    },
    {
      id: uuidv4(),
      title: 'React 核心概念笔记',
      content: '<p>React 是一个用于构建用户界面的 JavaScript 库。</p><p><b>核心概念：</b></p><ul><li>组件化开发</li><li>虚拟 DOM</li><li>单向数据流</li><li>Hooks</li></ul>',
      tags: ['技术', 'React', '前端'],
      createdAt: yesterday.toISOString(),
      updatedAt: yesterday.toISOString()
    },
    {
      id: uuidv4(),
      title: 'TypeScript 学习笔记',
      content: '<p>TypeScript 是 JavaScript 的超集，添加了静态类型检查。</p><ul><li>类型注解</li><li>接口 Interface</li><li>泛型 Generics</li><li>枚举 Enum</li></ul>',
      tags: ['技术', 'TypeScript', '前端'],
      createdAt: twoDaysAgo.toISOString(),
      updatedAt: twoDaysAgo.toISOString()
    },
    {
      id: uuidv4(),
      title: '每日读书计划',
      content: '<p>本周读书清单：</p><ol><li>《深入理解计算机系统》</li><li>《代码整洁之道》</li><li>《设计模式》</li></ol>',
      tags: ['读书', '计划'],
      createdAt: threeDaysAgo.toISOString(),
      updatedAt: threeDaysAgo.toISOString()
    }
  ];

  writeToStorage(sampleNotes);
  return sampleNotes;
}

let notesCache: Note[] | null = null;

export function getAllNotes(): Note[] {
  if (notesCache === null) {
    notesCache = readFromStorage();
    if (notesCache.length === 0) {
      notesCache = initializeWithSampleData();
    }
  }
  return [...notesCache];
}

export function getNoteById(id: string): Note | undefined {
  const notes = getAllNotes();
  return notes.find(note => note.id === id);
}

export function createNote(noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Note {
  const notes = getAllNotes();
  const now = new Date().toISOString();
  const newNote: Note = {
    ...noteData,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now
  };
  notes.unshift(newNote);
  writeToStorage(notes);
  notesCache = notes;
  return newNote;
}

export function updateNote(id: string, data: Partial<Omit<Note, 'id' | 'createdAt'>>): Note | undefined {
  const notes = getAllNotes();
  const index = notes.findIndex(note => note.id === id);
  if (index !== -1) {
    notes[index] = {
      ...notes[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    writeToStorage(notes);
    notesCache = notes;
    return notes[index];
  }
  return undefined;
}

export function deleteNote(id: string): boolean {
  const notes = getAllNotes();
  const filteredNotes = notes.filter(note => note.id !== id);
  if (filteredNotes.length !== notes.length) {
    writeToStorage(filteredNotes);
    notesCache = filteredNotes;
    return true;
  }
  return false;
}

export function getAllTags(): string[] {
  const notes = getAllNotes();
  const tagSet = new Set<string>();
  notes.forEach(note => {
    note.tags.forEach(tag => tagSet.add(tag));
  });
  return Array.from(tagSet).sort();
}
