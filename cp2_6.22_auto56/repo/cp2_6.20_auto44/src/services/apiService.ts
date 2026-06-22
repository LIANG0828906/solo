import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { Idea, User, VoteType, WSMessage } from '../types';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

let socket: Socket | null = null;
let messageHandlers: ((msg: WSMessage) => void)[] = [];

export const apiService = {
  async getIdeas(roomId: string): Promise<Idea[]> {
    try {
      const res = await api.get(`/rooms/${roomId}/ideas`);
      return res.data;
    } catch (e) {
      console.warn('API unavailable, using mock data');
      return mockGetIdeas(roomId);
    }
  },

  async createIdea(roomId: string, data: { title: string; description?: string; tags?: string[] }): Promise<Idea> {
    try {
      const res = await api.post(`/rooms/${roomId}/ideas`, data);
      return res.data;
    } catch (e) {
      return mockCreateIdea(roomId, data);
    }
  },

  async voteIdea(roomId: string, ideaId: string, voteType: VoteType): Promise<void> {
    try {
      await api.post(`/rooms/${roomId}/ideas/${ideaId}/vote`, { type: voteType });
    } catch (e) {
      console.warn('Vote API unavailable');
    }
  },

  async getUsers(roomId: string): Promise<User[]> {
    try {
      const res = await api.get(`/rooms/${roomId}/users`);
      return res.data;
    } catch (e) {
      return mockGetUsers(roomId);
    }
  },

  async joinRoom(roomId: string, userName: string): Promise<User> {
    try {
      const res = await api.post(`/rooms/${roomId}/join`, { name: userName });
      return res.data;
    } catch (e) {
      return mockJoinRoom(roomId, userName);
    }
  },

  connectWebSocket(roomId: string, onMessage: (msg: WSMessage) => void): void {
    if (socket && socket.connected) {
      messageHandlers.push(onMessage);
      return;
    }

    try {
      socket = io({
        path: '/ws',
        query: { roomId },
        transports: ['websocket'],
      });

      socket.on('connect', () => {
        console.log('WebSocket connected');
      });

      socket.on('message', (msg: WSMessage) => {
        messageHandlers.forEach((handler) => handler(msg));
      });

      messageHandlers.push(onMessage);

      setTimeout(() => {
        startMockBroadcast();
      }, 2000);
    } catch (e) {
      console.warn('WebSocket unavailable, using mock mode');
      messageHandlers.push(onMessage);
      startMockBroadcast();
    }
  },

  disconnectWebSocket(): void {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    messageHandlers = [];
  },
};

const mockUsers: User[] = [
  { id: 'u1', name: '张伟', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhang', online: true },
  { id: 'u2', name: '李娜', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=li', online: true },
  { id: 'u3', name: '王磊', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang', online: true },
  { id: 'u4', name: '刘芳', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liu', online: false },
];

let mockIdeas: Idea[] = [];
let mockCurrentUser: User | null = null;

const COLORS = [
  'rgba(249, 115, 22, 0.15)',
  'rgba(59, 130, 246, 0.15)',
  'rgba(34, 197, 94, 0.15)',
  'rgba(168, 85, 247, 0.15)',
  'rgba(236, 72, 153, 0.15)',
];

const TAGS = ['产品', '技术', '设计', '运营', '创新'];

function seedMockIdeas(roomId: string): Idea[] {
  const ideas: Idea[] = [];
  const titles = [
    '引入AI智能客服系统',
    '移动端App性能优化',
    '用户积分体系改版',
    '短视频营销计划',
    '会员订阅制方案',
    '社区功能升级',
    '数据可视化大屏',
    '国际化多语言支持',
  ];
  const descs = [
    '通过大语言模型提升客服效率，降低人工成本',
    '针对启动速度和内存占用进行专项优化',
    '重构积分获取和消费路径，提升用户活跃度',
    '利用抖音、小红书等平台进行品牌推广',
    '探索订阅制收费模式，稳定收入来源',
    '增加UGC内容激励机制，建设用户社区',
    '为运营团队提供实时数据监控和分析平台',
    '支持英语、日语等多语言，拓展海外市场',
  ];

  for (let i = 0; i < 8; i++) {
    const author = mockUsers[i % mockUsers.length];
    const tagsCount = Math.floor(Math.random() * 3) + 1;
    const shuffled = [...TAGS].sort(() => Math.random() - 0.5);
    ideas.push({
      id: 'idea-' + (i + 1),
      roomId,
      title: titles[i],
      description: descs[i],
      author,
      tags: shuffled.slice(0, tagsCount),
      votes: {
        agree: Math.floor(Math.random() * 15),
        disagree: Math.floor(Math.random() * 5),
        neutral: Math.floor(Math.random() * 8),
      },
      createdAt: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      bgColor: COLORS[Math.floor(Math.random() * COLORS.length)],
    });
  }
  return ideas;
}

function mockGetIdeas(roomId: string): Idea[] {
  if (mockIdeas.length === 0) {
    mockIdeas = seedMockIdeas(roomId);
  }
  return [...mockIdeas];
}

function mockCreateIdea(
  roomId: string,
  data: { title: string; description?: string; tags?: string[] }
): Idea {
  const user = mockCurrentUser || mockUsers[0];
  const newIdea: Idea = {
    id: 'idea-' + Date.now(),
    roomId,
    title: data.title,
    description: data.description || '',
    author: user,
    tags: data.tags || [],
    votes: { agree: 0, disagree: 0, neutral: 0 },
    createdAt: new Date().toISOString(),
    bgColor: COLORS[Math.floor(Math.random() * COLORS.length)],
  };
  mockIdeas.unshift(newIdea);
  broadcastMsg({ type: 'idea_created', idea: newIdea });
  return newIdea;
}

function mockGetUsers(_roomId: string): User[] {
  return mockUsers.map((u) => ({ ...u }));
}

function mockJoinRoom(roomId: string, userName: string): User {
  const user: User = {
    id: 'user-' + Date.now(),
    name: userName,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName)}`,
    online: true,
  };
  mockCurrentUser = user;
  mockUsers.push(user);
  setTimeout(() => broadcastMsg({ type: 'user_joined', user }), 100);
  return user;
}

function broadcastMsg(msg: WSMessage): void {
  messageHandlers.forEach((h) => {
    try {
      h(msg);
    } catch (e) {
      console.error(e);
    }
  });
}

let mockInterval: ReturnType<typeof setInterval> | null = null;
function startMockBroadcast(): void {
  if (mockInterval) return;
  mockInterval = setInterval(() => {
    if (mockIdeas.length === 0) return;
    const idea = mockIdeas[Math.floor(Math.random() * mockIdeas.length)];
    const types: VoteType[] = ['agree', 'disagree', 'neutral'];
    const t = types[Math.floor(Math.random() * 3)];
    idea.votes[t]++;
    broadcastMsg({
      type: 'vote',
      ideaId: idea.id,
      voteType: t,
      votes: { ...idea.votes },
    });
  }, 4000);
}
