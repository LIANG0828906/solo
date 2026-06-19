import axios from 'axios';
import type {
  RetrospectiveTemplate,
  RetrospectiveSession,
  Answer,
  QuestionStats,
  ActionItem,
  ActionSuggestion,
  RadarDataPoint,
  Comment,
  TemplatePhase,
} from '@/types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const mockTemplates: RetrospectiveTemplate[] = [
  {
    id: 'template-1',
    name: 'Start Stop Continue',
    description: '经典的团队反思模板，帮助团队识别需要开始、停止和继续做的事情',
    phases: [
      {
        id: 'phase-1',
        name: 'Start',
        order: 1,
        questions: [
          { id: 'q1', text: '我们应该开始做什么？', type: 'open', order: 1 },
        ],
      },
      {
        id: 'phase-2',
        name: 'Stop',
        order: 2,
        questions: [
          { id: 'q2', text: '我们应该停止做什么？', type: 'open', order: 1 },
        ],
      },
      {
        id: 'phase-3',
        name: 'Continue',
        order: 3,
        questions: [
          { id: 'q3', text: '我们应该继续做什么？', type: 'open', order: 1 },
        ],
      },
    ],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'template-2',
    name: 'Glad Sad Mad',
    description: '情感导向的反思模板，关注团队成员的情绪和感受',
    phases: [
      {
        id: 'phase-4',
        name: 'Glad',
        order: 1,
        questions: [
          { id: 'q4', text: '什么让你感到高兴？', type: 'open', order: 1 },
          { id: 'q5', text: '本周满意度评分', type: 'rating', order: 2 },
        ],
      },
      {
        id: 'phase-5',
        name: 'Sad',
        order: 2,
        questions: [
          { id: 'q6', text: '什么让你感到失望？', type: 'open', order: 1 },
        ],
      },
      {
        id: 'phase-6',
        name: 'Mad',
        order: 3,
        questions: [
          { id: 'q7', text: '什么让你感到沮丧？', type: 'open', order: 1 },
        ],
      },
    ],
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
  },
];

const mockSessions: RetrospectiveSession[] = [
  {
    id: 'session-1',
    projectId: 'proj-1',
    projectName: '电商平台重构',
    templateId: 'template-1',
    status: 'completed',
    members: [
      { id: 'm1', name: '张三', role: 'host', avatar: '' },
      { id: 'm2', name: '李四', role: 'participant', avatar: '' },
      { id: 'm3', name: '王五', role: 'participant', avatar: '' },
    ],
    createdAt: '2024-02-01T10:00:00Z',
    completedAt: '2024-02-01T11:30:00Z',
  },
  {
    id: 'session-2',
    projectId: 'proj-1',
    projectName: '电商平台重构',
    templateId: 'template-2',
    status: 'active',
    members: [
      { id: 'm1', name: '张三', role: 'host', avatar: '' },
      { id: 'm2', name: '李四', role: 'participant', avatar: '' },
    ],
    createdAt: '2024-02-08T10:00:00Z',
  },
];

const mockAnswers: Answer[] = [
  {
    id: 'ans-1',
    questionId: 'q1',
    memberId: 'm1',
    content: '增加单元测试覆盖率',
    isAnonymous: false,
    createdAt: '2024-02-01T10:15:00Z',
    memberName: '张三',
  },
  {
    id: 'ans-2',
    questionId: 'q1',
    memberId: 'm2',
    content: '建立更清晰的代码规范',
    isAnonymous: false,
    createdAt: '2024-02-01T10:20:00Z',
    memberName: '李四',
  },
  {
    id: 'ans-3',
    questionId: 'q2',
    memberId: 'm3',
    content: '减少不必要的会议',
    isAnonymous: true,
    createdAt: '2024-02-01T10:25:00Z',
  },
  {
    id: 'ans-4',
    questionId: 'q5',
    memberId: 'm1',
    content: '',
    rating: 4,
    isAnonymous: false,
    createdAt: '2024-02-01T10:30:00Z',
    memberName: '张三',
  },
];

const mockComments: Comment[] = [
  {
    id: 'c1',
    answerId: 'ans-1',
    memberId: 'm2',
    memberName: '李四',
    content: '同意，单元测试确实很重要',
    likes: 2,
    createdAt: '2024-02-01T10:30:00Z',
    replies: [],
  },
];

const mockActionItems: ActionItem[] = [
  {
    id: 'ai-1',
    title: '建立单元测试规范',
    description: '制定单元测试覆盖率目标和最佳实践文档',
    status: 'in_progress',
    assigneeId: 'm1',
    assigneeName: '张三',
    dueDate: '2024-02-15',
    createdAt: '2024-02-01T12:00:00Z',
  },
  {
    id: 'ai-2',
    title: '优化会议流程',
    description: '减少不必要的会议，提高会议效率',
    status: 'todo',
    assigneeId: 'm2',
    assigneeName: '李四',
    dueDate: '2024-02-20',
    createdAt: '2024-02-01T12:00:00Z',
  },
];

const mockSuggestions: ActionSuggestion[] = [
  { title: '增加单元测试覆盖率', keyword: '测试', frequency: 5 },
  { title: '优化代码审查流程', keyword: '代码审查', frequency: 3 },
  { title: '改善沟通效率', keyword: '沟通', frequency: 4 },
  { title: '建立技术分享机制', keyword: '分享', frequency: 2 },
];

class RetrospectService {
  async getTemplates(): Promise<RetrospectiveTemplate[]> {
    try {
      const response = await api.get<RetrospectiveTemplate[]>('/templates');
      return response.data;
    } catch {
      return mockTemplates;
    }
  }

  async createTemplate(data: Omit<RetrospectiveTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<RetrospectiveTemplate> {
    try {
      const response = await api.post<RetrospectiveTemplate>('/templates', data);
      return response.data;
    } catch {
      const newTemplate: RetrospectiveTemplate = {
        ...data,
        id: `template-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return newTemplate;
    }
  }

  async createRetrospective(data: Omit<RetrospectiveSession, 'id' | 'status' | 'createdAt'>): Promise<RetrospectiveSession> {
    try {
      const response = await api.post<RetrospectiveSession>('/retrospectives', data);
      return response.data;
    } catch {
      const newSession: RetrospectiveSession = {
        ...data,
        id: `session-${Date.now()}`,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      return newSession;
    }
  }

  async getRetrospectiveQuestions(id: string): Promise<{ phases: TemplatePhase[]; stats: QuestionStats[] }> {
    try {
      const response = await api.get<{ phases: TemplatePhase[]; stats: QuestionStats[] }>(`/retrospectives/${id}/questions`);
      return response.data;
    } catch {
      const template = mockTemplates[0];
      const stats: QuestionStats[] = template.phases.flatMap((phase) =>
        phase.questions.map((q) => ({
          questionId: q.id,
          questionText: q.text,
          questionType: q.type,
          averageRating: q.type === 'rating' ? 4.2 : 0,
          ratingDistribution: q.type === 'rating' ? [0, 1, 2, 5, 3] : [],
          answerCount: mockAnswers.filter((a) => a.questionId === q.id).length,
          answers: mockAnswers.filter((a) => a.questionId === q.id),
        }))
      );
      return {
        phases: template.phases,
        stats,
      };
    }
  }

  async submitAnswer(id: string, data: Omit<Answer, 'id' | 'createdAt'>): Promise<Answer> {
    try {
      const response = await api.post<Answer>(`/retrospectives/${id}/answers`, data);
      return response.data;
    } catch {
      const newAnswer: Answer = {
        ...data,
        id: `ans-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      return newAnswer;
    }
  }

  async getRetrospectiveStats(id: string): Promise<QuestionStats[]> {
    try {
      const response = await api.get<QuestionStats[]>(`/retrospectives/${id}/stats`);
      return response.data;
    } catch {
      const template = mockTemplates[0];
      return template.phases.flatMap((phase) =>
        phase.questions.map((q) => ({
          questionId: q.id,
          questionText: q.text,
          questionType: q.type,
          averageRating: q.type === 'rating' ? 4.2 : 0,
          ratingDistribution: q.type === 'rating' ? [0, 1, 2, 5, 3] : [],
          answerCount: mockAnswers.filter((a) => a.questionId === q.id).length,
          answers: mockAnswers.filter((a) => a.questionId === q.id),
        }))
      );
    }
  }

  async generateActionSuggestions(id: string): Promise<{ suggestions: ActionSuggestion[]; topKeywords: string[] }> {
    try {
      const response = await api.get<{ suggestions: ActionSuggestion[]; topKeywords: string[] }>(
        `/retrospectives/${id}/suggestions`
      );
      return response.data;
    } catch {
      return {
        suggestions: mockSuggestions,
        topKeywords: ['测试', '沟通', '代码审查', '分享', '文档'],
      };
    }
  }

  async createActionItem(data: Omit<ActionItem, 'id' | 'createdAt'>): Promise<ActionItem> {
    try {
      const response = await api.post<ActionItem>('/action-items', data);
      return response.data;
    } catch {
      const newActionItem: ActionItem = {
        ...data,
        id: `ai-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      return newActionItem;
    }
  }

  async updateActionItem(id: string, data: Partial<Omit<ActionItem, 'id' | 'createdAt'>>): Promise<ActionItem> {
    try {
      const response = await api.put<ActionItem>(`/action-items/${id}`, data);
      return response.data;
    } catch {
      const existing = mockActionItems.find((item) => item.id === id) || mockActionItems[0];
      return {
        ...existing,
        ...data,
      };
    }
  }

  async getActionItems(id: string): Promise<ActionItem[]> {
    try {
      const response = await api.get<ActionItem[]>(`/retrospectives/${id}/action-items`);
      return response.data;
    } catch {
      return mockActionItems;
    }
  }

  async getHistoryList(): Promise<RetrospectiveSession[]> {
    try {
      const response = await api.get<RetrospectiveSession[]>('/retrospectives/history');
      return response.data;
    } catch {
      return mockSessions;
    }
  }

  async getRadarData(id: string): Promise<RadarDataPoint[]> {
    try {
      const response = await api.get<RadarDataPoint[]>(`/retrospectives/${id}/radar`);
      return response.data;
    } catch {
      return [
        { dimension: '沟通效率', value: 85, sessionId: id, sessionName: '电商平台重构' },
        { dimension: '代码质量', value: 78, sessionId: id, sessionName: '电商平台重构' },
        { dimension: '团队协作', value: 92, sessionId: id, sessionName: '电商平台重构' },
        { dimension: '需求理解', value: 75, sessionId: id, sessionName: '电商平台重构' },
        { dimension: '交付速度', value: 80, sessionId: id, sessionName: '电商平台重构' },
        { dimension: '技术创新', value: 70, sessionId: id, sessionName: '电商平台重构' },
      ];
    }
  }

  async addComment(data: Omit<Comment, 'id' | 'likes' | 'createdAt' | 'replies'>): Promise<Comment> {
    try {
      const response = await api.post<Comment>('/comments', data);
      return response.data;
    } catch {
      const newComment: Comment = {
        ...data,
        id: `c-${Date.now()}`,
        likes: 0,
        createdAt: new Date().toISOString(),
        replies: [],
      };
      return newComment;
    }
  }

  async likeComment(id: string): Promise<{ likes: number }> {
    try {
      const response = await api.post<{ likes: number }>(`/comments/${id}/like`);
      return response.data;
    } catch {
      const comment = mockComments.find((c) => c.id === id);
      return { likes: (comment?.likes || 0) + 1 };
    }
  }
}

export const retrospectService = new RetrospectService();
