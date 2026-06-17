import { v4 as uuidv4 } from 'uuid';
import type { Note, User, Comment, TagOption } from '@/types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const tagOptions: TagOption[] = [
  { name: '生活', color: '#FF6B6B' },
  { name: '技术', color: '#4ECDC4' },
  { name: '思考', color: '#FFE66D' },
  { name: '灵感', color: '#95E1D3' },
  { name: '读书', color: '#A8E6CF' },
  { name: '旅行', color: '#DDA0DD' },
];

const currentUser: User = {
  id: 'user-1',
  name: '我',
};

const mockUsers: User[] = [
  { id: 'user-2', name: '夜行者' },
  { id: 'user-3', name: '星辰' },
  { id: 'user-4', name: '墨白' },
  { id: 'user-5', name: '清风' },
];

const generateLikeHistory = (count: number, baseTime: number): { timestamp: number }[] => {
  const history: { timestamp: number }[] = [];
  for (let i = 0; i < count; i++) {
    history.push({
      timestamp: baseTime + Math.random() * (Date.now() - baseTime),
    });
  }
  return history.sort((a, b) => a.timestamp - b.timestamp);
};

const generateMockNotes = (): Note[] => {
  const now = Date.now();
  const contents = [
    '深夜的代码总是带着特殊的魔力，每一行都像是在与未来的自己对话。',
    '读完《百年孤独》，才明白孤独是生命的常态，也是最深沉的力量。',
    '今天在咖啡馆遇到一只猫，它盯着我看了很久，仿佛看穿了我的灵魂。',
    '有时候最好的灵感来自最平凡的瞬间，就像雨后的第一缕阳光。',
    '算法之美在于化繁为简，就像人生需要不断做减法。',
    '站在山顶看日落，才发现天地之大，个人之渺小。',
    '写代码和写文章本质上是一样的，都是在表达思想。',
    '每个凌晨三点的灵感，都值得被认真记录下来。',
    '学习一门新语言，就像打开了一扇通往新世界的门。',
    '今天的晚霞特别美，像是有人打翻了天空的调色盘。',
    '调试了一整天的bug，最后发现是少写了一个分号。哭笑不得。',
    '古人说"读万卷书，行万里路"，今天算是体会到了。',
    '音乐是时间的艺术，代码也是。每个字符都有它的节奏。',
    '第一次看见大海的时候，所有的烦恼都变得微不足道了。',
    '最好的设计是看不见的设计，就像最好的代码是最简单的代码。',
  ];

  return contents.map((content, index) => {
    const user = mockUsers[index % mockUsers.length];
    const createdAt = now - (index + 1) * 3600000 * (2 + Math.random() * 3);
    const likeCount = Math.floor(Math.random() * 80) + 5;
    const commentCount = Math.floor(Math.random() * 5);
    const selectedTags = tagOptions
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 3) + 1)
      .map(t => t.name);

    const comments: Comment[] = [];
    for (let i = 0; i < commentCount; i++) {
      const commentUser = mockUsers[(index + i) % mockUsers.length];
      comments.push({
        id: uuidv4(),
        noteId: uuidv4(),
        userId: commentUser.id,
        userName: commentUser.name,
        content: [
          '深有同感！',
          '写得真好。',
          '这也是我一直在想的问题。',
          '太有共鸣了。',
          '记录下来，慢慢品味。',
        ][i % 5],
        createdAt: createdAt + Math.random() * (now - createdAt),
      });
    }

    return {
      id: uuidv4(),
      userId: user.id,
      userName: user.name,
      content,
      tags: selectedTags,
      createdAt,
      likes: likeCount,
      likeHistory: generateLikeHistory(likeCount, createdAt),
      comments,
    };
  }).sort((a, b) => b.createdAt - a.createdAt);
};

let mockNotesCache: Note[] | null = null;

export const fetchNotes = async (page = 1, pageSize = 20): Promise<Note[]> => {
  await delay(500 + Math.random() * 500);
  if (!mockNotesCache) {
    mockNotesCache = generateMockNotes();
  }
  const start = (page - 1) * pageSize;
  return mockNotesCache.slice(start, start + pageSize);
};

export const fetchCurrentUser = async (): Promise<User> => {
  await delay(300);
  return currentUser;
};

export const createNote = async (content: string, tags: string[]): Promise<Note> => {
  await delay(400);
  const now = Date.now();
  const newNote: Note = {
    id: uuidv4(),
    userId: currentUser.id,
    userName: currentUser.name,
    content,
    tags,
    createdAt: now,
    likes: 0,
    likeHistory: [],
    comments: [],
  };
  if (mockNotesCache) {
    mockNotesCache.unshift(newNote);
  }
  return newNote;
};

export const likeNote = async (noteId: string): Promise<{ success: boolean; likes: number }> => {
  await delay(200);
  if (mockNotesCache) {
    const note = mockNotesCache.find(n => n.id === noteId);
    if (note) {
      note.likes += 1;
      note.likeHistory.push({ timestamp: Date.now() });
      return { success: true, likes: note.likes };
    }
  }
  return { success: false, likes: 0 };
};

export const addComment = async (
  noteId: string,
  content: string
): Promise<{ success: boolean; comment: Comment | null }> => {
  await delay(300);
  if (mockNotesCache) {
    const note = mockNotesCache.find(n => n.id === noteId);
    if (note) {
      const comment: Comment = {
        id: uuidv4(),
        noteId,
        userId: currentUser.id,
        userName: currentUser.name,
        content,
        createdAt: Date.now(),
      };
      note.comments.push(comment);
      return { success: true, comment };
    }
  }
  return { success: false, comment: null };
};
