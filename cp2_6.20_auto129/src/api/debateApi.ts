import { Debate, DebateMessage, User } from '../types';
import { v4 as uuidv4 } from 'uuid';

const mockUsers: User[] = [
  { id: 'user-001', nickname: '文学爱好者', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=reader' },
  { id: 'user-002', nickname: '书虫小明', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoming' },
  { id: 'user-003', nickname: '深夜读书人', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nightreader' },
  { id: 'user-004', nickname: '诗与远方', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=poet' },
  { id: 'user-005', nickname: '评论鉴赏家', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=critic' }
];

const mockDebates: Debate[] = [
  {
    id: 'debate-001',
    title: '《红楼梦》中林黛玉的性格是悲剧的主要原因吗？',
    initiatorId: 'user-002',
    initiator: mockUsers[1],
    reviewId: 'review-1',
    participantCount: 28,
    lastReplyAt: new Date(Date.now() - 1800000).toISOString(),
    proMessages: [
      {
        id: 'msg-1',
        debateId: 'debate-001',
        userId: 'user-002',
        user: mockUsers[1],
        side: 'pro',
        content: '我认为黛玉的多愁善感和敏感多疑是导致她悲剧命运的重要原因。她的性格使她难以适应贾府的复杂环境。',
        createdAt: new Date(Date.now() - 7200000).toISOString()
      },
      {
        id: 'msg-2',
        debateId: 'debate-001',
        userId: 'user-004',
        user: mockUsers[3],
        side: 'pro',
        content: '同意！她太过于自我封闭，如果能像宝钗一样圆滑一些，或许结局会不同。',
        createdAt: new Date(Date.now() - 5400000).toISOString()
      }
    ],
    conMessages: [
      {
        id: 'msg-3',
        debateId: 'debate-001',
        userId: 'user-003',
        user: mockUsers[2],
        side: 'con',
        content: '我不同意。黛玉的悲剧是时代和社会造成的，不是她个人性格的问题。在那样的封建大家庭里，她的真性情反而显得可贵。',
        createdAt: new Date(Date.now() - 6000000).toISOString()
      }
    ]
  },
  {
    id: 'debate-002',
    title: '《活着》是苦难文学的巅峰之作吗？',
    initiatorId: 'user-003',
    initiator: mockUsers[2],
    reviewId: 'review-2',
    participantCount: 45,
    lastReplyAt: new Date(Date.now() - 3600000).toISOString(),
    proMessages: [
      {
        id: 'msg-4',
        debateId: 'debate-002',
        userId: 'user-003',
        user: mockUsers[2],
        side: 'pro',
        content: '余华用平淡的笔触写出了最深沉的苦难，福贵的一生让我泪流满面。这种对生命的思考是其他作品难以企及的。',
        createdAt: new Date(Date.now() - 10000000).toISOString()
      }
    ],
    conMessages: [
      {
        id: 'msg-5',
        debateId: 'debate-002',
        userId: 'user-005',
        user: mockUsers[4],
        side: 'con',
        content: '我觉得苦难描写得有些刻意了。为了苦难而苦难，反而失去了真实感。',
        createdAt: new Date(Date.now() - 8000000).toISOString()
      }
    ]
  },
  {
    id: 'debate-003',
    title: '网络文学能否成为经典文学？',
    initiatorId: 'user-005',
    initiator: mockUsers[4],
    reviewId: 'review-3',
    participantCount: 67,
    lastReplyAt: new Date(Date.now() - 900000).toISOString(),
    proMessages: [
      {
        id: 'msg-6',
        debateId: 'debate-003',
        userId: 'user-005',
        user: mockUsers[4],
        side: 'pro',
        content: '经典不是由载体决定的，而是由时间决定的。现在的网络文学中也有很多优秀作品，经过时间沉淀后也可能成为经典。',
        createdAt: new Date(Date.now() - 5000000).toISOString()
      }
    ],
    conMessages: [
      {
        id: 'msg-7',
        debateId: 'debate-003',
        userId: 'user-001',
        user: mockUsers[0],
        side: 'con',
        content: '网络文学的快餐属性决定了它很难有深度。追求更新速度和爽点的模式，与经典文学所追求的艺术性是背道而驰的。',
        createdAt: new Date(Date.now() - 4000000).toISOString()
      }
    ]
  }
];

export const debateApi = {
  async getDebates(): Promise<Debate[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockDebates.map((d) => ({
          ...d,
          proMessages: [],
          conMessages: []
        })));
      }, 400);
    });
  },

  async getDebateById(id: string): Promise<Debate | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const debate = mockDebates.find((d) => d.id === id);
        resolve(debate || null);
      }, 300);
    });
  },

  async sendMessage(
    debateId: string,
    side: 'pro' | 'con',
    content: string
  ): Promise<DebateMessage> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const debate = mockDebates.find((d) => d.id === debateId);
        const newMessage: DebateMessage = {
          id: uuidv4(),
          debateId,
          userId: 'user-001',
          user: mockUsers[0],
          side,
          content,
          createdAt: new Date().toISOString()
        };
        if (debate) {
          if (side === 'pro') {
            debate.proMessages.push(newMessage);
          } else {
            debate.conMessages.push(newMessage);
          }
          debate.lastReplyAt = new Date().toISOString();
          debate.participantCount += 1;
        }
        resolve(newMessage);
      }, 200);
    });
  },

  async createDebate(data: {
    reviewId: string;
    title: string;
  }): Promise<Debate> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newDebate: Debate = {
          id: uuidv4(),
          title: data.title,
          initiatorId: 'user-001',
          initiator: mockUsers[0],
          reviewId: data.reviewId,
          participantCount: 1,
          lastReplyAt: new Date().toISOString(),
          proMessages: [],
          conMessages: []
        };
        mockDebates.unshift(newDebate);
        resolve(newDebate);
      }, 500);
    });
  }
};
