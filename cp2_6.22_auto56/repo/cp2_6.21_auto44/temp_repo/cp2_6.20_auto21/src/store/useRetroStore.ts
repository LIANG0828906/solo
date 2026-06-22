import { create } from 'zustand';
import type {
  TeamMember,
  RetrospectiveSession,
  RetrospectiveTemplate,
  TemplatePhase,
  QuestionStats,
  ActionItem,
  Comment,
  Answer,
  ThemeMode,
} from '@/types';

const mockTeamMembers: TeamMember[] = [
  { id: 'user-001', name: '李工程师', role: 'participant' },
  { id: 'user-002', name: '张产品', role: 'host' },
  { id: 'user-003', name: '王设计', role: 'participant' },
  { id: 'user-004', name: '赵测试', role: 'participant' },
  { id: 'user-005', name: '刘开发', role: 'participant' },
  { id: 'user-006', name: '陈架构', role: 'participant' },
  { id: 'user-007', name: '周运维', role: 'participant' },
  { id: 'user-008', name: '吴运营', role: 'participant' },
];

const mockPhases: TemplatePhase[] = [
  {
    id: 'phase-001',
    name: '开始',
    order: 0,
    questions: [
      {
        id: 'q-001',
        text: '本迭代中，我们应该开始做哪些新的事情？',
        type: 'open',
        order: 0,
      },
      {
        id: 'q-002',
        text: '你对本迭代团队协作效率的评分是？（1-5分）',
        type: 'rating',
        order: 1,
      },
      {
        id: 'q-003',
        text: '有哪些新的技术或工具值得我们尝试？',
        type: 'open',
        order: 2,
      },
    ],
  },
  {
    id: 'phase-002',
    name: '结束',
    order: 1,
    questions: [
      {
        id: 'q-004',
        text: '本迭代中，我们应该停止做哪些事情？',
        type: 'open',
        order: 0,
      },
      {
        id: 'q-005',
        text: '你对本迭代需求变更频率的满意度是？（1-5分）',
        type: 'rating',
        order: 1,
      },
    ],
  },
  {
    id: 'phase-003',
    name: '继续',
    order: 2,
    questions: [
      {
        id: 'q-006',
        text: '本迭代中，哪些好的做法值得我们继续保持？',
        type: 'open',
        order: 0,
      },
      {
        id: 'q-007',
        text: '你对本迭代代码质量的评分是？（1-5分）',
        type: 'rating',
        order: 1,
      },
      {
        id: 'q-008',
        text: '哪些团队协作方式效果很好，应该继续？',
        type: 'open',
        order: 2,
      },
    ],
  },
  {
    id: 'phase-004',
    name: '改进',
    order: 3,
    questions: [
      {
        id: 'q-009',
        text: '我们可以在哪些方面进行改进？',
        type: 'open',
        order: 0,
      },
      {
        id: 'q-010',
        text: '你对本迭代整体表现的评分是？（1-5分）',
        type: 'rating',
        order: 1,
      },
    ],
  },
];

const mockTemplates: RetrospectiveTemplate[] = [
  {
    id: 'template-001',
    name: 'Start-Stop-Continue-Improve',
    description: '经典的四象限复盘模板，帮助团队全面回顾迭代过程',
    phases: mockPhases,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'template-002',
    name: 'What-Went-Well',
    description: '简单的三点复盘模板：做得好的、做得不好的、改进点',
    phases: [
      {
        id: 'phase-005',
        name: '做得好的',
        order: 0,
        questions: [
          { id: 'q-011', text: '本迭代做得好的地方有哪些？', type: 'open', order: 0 },
        ],
      },
      {
        id: 'phase-006',
        name: '待改进的',
        order: 1,
        questions: [
          { id: 'q-012', text: '本迭代需要改进的地方有哪些？', type: 'open', order: 0 },
        ],
      },
      {
        id: 'phase-007',
        name: '行动项',
        order: 2,
        questions: [
          { id: 'q-013', text: '下迭代我们具体要做什么？', type: 'open', order: 0 },
        ],
      },
    ],
    createdAt: '2026-01-05T00:00:00Z',
    updatedAt: '2026-01-05T00:00:00Z',
  },
];

const mockCurrentUser: TeamMember = mockTeamMembers[0];

const mockCurrentSession: RetrospectiveSession = {
  id: 'session-001',
  projectId: 'project-001',
  projectName: '智能客服系统 V2.0',
  templateId: 'template-001',
  status: 'active',
  members: mockTeamMembers,
  createdAt: '2026-06-15T09:00:00Z',
};

const generateAnswers = (): Answer[] => {
  const answers: Answer[] = [];
  const memberAnswers: Record<string, Record<string, string>> = {
    'user-001': {
      'q-001': '建议引入自动化测试框架，提高回归测试效率',
      'q-003': '可以尝试使用 AI 代码助手来提升开发效率',
      'q-004': '减少不必要的日常站会时间，控制在15分钟内',
      'q-006': '代码评审机制执行得很好，继续保持',
      'q-008': '跨团队沟通时使用文档同步的方式很有效',
      'q-009': '需求文档需要更详细，减少开发过程中的歧义',
    },
    'user-002': {
      'q-001': '开始建立技术分享机制，每周一次技术分享',
      'q-003': '尝试引入监控告警系统，提前发现线上问题',
      'q-004': '停止在开发过程中频繁变更需求',
      'q-006': '迭代规划会议的组织方式很好，目标清晰',
      'q-008': '每日站会同步进度的机制很好',
      'q-009': '测试环境的稳定性需要提升',
    },
    'user-003': {
      'q-001': '开始做用户调研，收集真实用户反馈',
      'q-003': '可以尝试使用设计系统来统一UI规范',
      'q-004': '减少设计稿的反复修改',
      'q-006': '设计评审流程很规范，继续保持',
      'q-008': '设计师与开发的协作模式很好',
      'q-009': '原型图的交互细节需要更完善',
    },
    'user-004': {
      'q-001': '开始引入性能测试，确保系统稳定性',
      'q-003': '尝试使用测试用例管理工具',
      'q-004': '停止在上线前才进行全面测试',
      'q-006': '测试用例的覆盖率持续提升，很好',
      'q-008': 'Bug 跟踪和闭环机制执行得很好',
      'q-009': '测试环境数据需要更贴近生产环境',
    },
    'user-005': {
      'q-001': '开始做代码重构计划，定期清理技术债务',
      'q-003': '尝试使用微前端架构提升可维护性',
      'q-004': '停止在代码中写硬编码的业务逻辑',
      'q-006': '分支管理策略执行得很好',
      'q-008': 'Pair Programming 解决复杂问题的方式很好',
      'q-009': 'CI/CD 流水线需要优化，加快构建速度',
    },
    'user-006': {
      'q-001': '开始建立架构评审机制',
      'q-003': '尝试引入领域驱动设计（DDD）思想',
      'q-004': '停止在没有经过架构评审的情况下做重大技术决策',
      'q-006': '技术选型的讨论机制很好',
      'q-008': '架构文档的维护和更新很及时',
      'q-009': '系统监控和可观测性需要加强',
    },
    'user-007': {
      'q-001': '开始建立自动化部署流程',
      'q-003': '尝试使用基础设施即代码（IaC）',
      'q-004': '停止手动部署生产环境',
      'q-006': '环境隔离做得很好',
      'q-008': '线上问题的响应和处理流程很规范',
      'q-009': '日志系统需要统一管理',
    },
    'user-008': {
      'q-001': '开始建立用户反馈收集渠道',
      'q-003': '尝试使用数据分析工具来指导产品决策',
      'q-004': '停止在没有数据支撑的情况下做产品决策',
      'q-006': '运营数据的定期复盘机制很好',
      'q-008': '产品需求的优先级排序很合理',
      'q-009': '产品上线后的效果跟踪需要加强',
    },
  };

  const ratings: Record<string, Record<string, number>> = {
    'user-001': { 'q-002': 4, 'q-005': 3, 'q-007': 4, 'q-010': 4 },
    'user-002': { 'q-002': 4, 'q-005': 2, 'q-007': 4, 'q-010': 4 },
    'user-003': { 'q-002': 5, 'q-005': 3, 'q-007': 4, 'q-010': 4 },
    'user-004': { 'q-002': 3, 'q-005': 2, 'q-007': 3, 'q-010': 3 },
    'user-005': { 'q-002': 4, 'q-005': 3, 'q-007': 4, 'q-010': 4 },
    'user-006': { 'q-002': 4, 'q-005': 4, 'q-007': 4, 'q-010': 4 },
    'user-007': { 'q-002': 3, 'q-005': 3, 'q-007': 3, 'q-010': 3 },
    'user-008': { 'q-002': 5, 'q-005': 3, 'q-007': 4, 'q-010': 4 },
  };

  let answerId = 1;
  mockTeamMembers.forEach((member) => {
    mockPhases.forEach((phase) => {
      phase.questions.forEach((question) => {
        if (question.type === 'open') {
          const content = memberAnswers[member.id]?.[question.id];
          if (content) {
            answers.push({
              id: `answer-${answerId++}`,
              questionId: question.id,
              memberId: member.id,
              content,
              isAnonymous: Math.random() > 0.7,
              createdAt: '2026-06-18T10:00:00Z',
              memberName: member.name,
            });
          }
        } else if (question.type === 'rating') {
          const rating = ratings[member.id]?.[question.id] ?? 3;
          answers.push({
            id: `answer-${answerId++}`,
            questionId: question.id,
            memberId: member.id,
            content: '',
            rating,
            isAnonymous: false,
            createdAt: '2026-06-18T10:00:00Z',
            memberName: member.name,
          });
        }
      });
    });
  });

  return answers;
};

const mockAnswers = generateAnswers();

const calculateQuestionStats = (answers: Answer[]): QuestionStats[] => {
  const statsMap = new Map<string, QuestionStats>();

  mockPhases.forEach((phase) => {
    phase.questions.forEach((question) => {
      const questionAnswers = answers.filter((a) => a.questionId === question.id);
      const ratingAnswers = questionAnswers.filter((a) => a.rating !== undefined);
      const averageRating =
        ratingAnswers.length > 0
          ? ratingAnswers.reduce((sum, a) => sum + (a.rating ?? 0), 0) / ratingAnswers.length
          : 0;

      const ratingDistribution = [0, 0, 0, 0, 0];
      ratingAnswers.forEach((a) => {
        const idx = Math.min(Math.max((a.rating ?? 1) - 1, 0), 4);
        ratingDistribution[idx]++;
      });

      statsMap.set(question.id, {
        questionId: question.id,
        questionText: question.text,
        questionType: question.type,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution,
        answerCount: questionAnswers.length,
        answers: questionAnswers,
      });
    });
  });

  return Array.from(statsMap.values());
};

const mockQuestionStats = calculateQuestionStats(mockAnswers);

const mockComments: Comment[] = [
  {
    id: 'comment-001',
    answerId: 'answer-1',
    memberId: 'user-002',
    memberName: '张产品',
    content: '非常好的建议！我们可以在下个迭代就引入自动化测试框架。',
    likes: 3,
    createdAt: '2026-06-18T11:00:00Z',
    replies: [
      {
        id: 'comment-002',
        answerId: 'answer-1',
        memberId: 'user-004',
        memberName: '赵测试',
        content: '我可以负责调研具体的测试框架选型。',
        parentId: 'comment-001',
        likes: 1,
        createdAt: '2026-06-18T11:30:00Z',
        replies: [],
      },
    ],
  },
  {
    id: 'comment-003',
    answerId: 'answer-7',
    memberId: 'user-005',
    memberName: '刘开发',
    content: '同意，站会确实经常超时，可以优化一下流程。',
    likes: 5,
    createdAt: '2026-06-18T10:30:00Z',
    replies: [],
  },
  {
    id: 'comment-004',
    answerId: 'answer-13',
    memberId: 'user-006',
    memberName: '陈架构',
    content: '代码评审确实提升了整体代码质量，建议增加评审的深度。',
    likes: 2,
    createdAt: '2026-06-18T12:00:00Z',
    replies: [],
  },
];

const mockActionItems: ActionItem[] = [
  {
    id: 'action-001',
    title: '引入自动化测试框架',
    description: '调研并选择合适的自动化测试框架，在下个迭代开始接入',
    status: 'todo',
    assigneeId: 'user-004',
    assigneeName: '赵测试',
    dueDate: '2026-06-30T00:00:00Z',
    createdAt: '2026-06-19T09:00:00Z',
  },
  {
    id: 'action-002',
    title: '优化站会流程',
    description: '制定站会议事规则，严格控制时间在15分钟内',
    status: 'in_progress',
    assigneeId: 'user-002',
    assigneeName: '张产品',
    dueDate: '2026-06-25T00:00:00Z',
    createdAt: '2026-06-19T09:00:00Z',
  },
  {
    id: 'action-003',
    title: '建立技术分享机制',
    description: '每周五下午安排1小时技术分享，轮流主讲',
    status: 'todo',
    assigneeId: 'user-006',
    assigneeName: '陈架构',
    dueDate: '2026-07-05T00:00:00Z',
    createdAt: '2026-06-19T09:00:00Z',
  },
  {
    id: 'action-004',
    title: '优化需求文档模板',
    description: '完善需求文档模板，增加验收标准和交互细节说明',
    status: 'completed',
    assigneeId: 'user-003',
    assigneeName: '王设计',
    dueDate: '2026-06-20T00:00:00Z',
    createdAt: '2026-06-19T09:00:00Z',
    completedAt: '2026-06-20T08:00:00Z',
  },
];

interface RetroState {
  currentUser: TeamMember;
  activeRetrospectId: string | null;
  currentSession: RetrospectiveSession | null;
  templates: RetrospectiveTemplate[];
  currentTemplate: RetrospectiveTemplate | null;
  phases: TemplatePhase[];
  currentPhaseIndex: number;
  questionStats: QuestionStats[];
  actionItems: ActionItem[];
  comments: Comment[];
  theme: ThemeMode;
  setCurrentUser: (user: TeamMember) => void;
  setActiveRetrospectId: (id: string | null) => void;
  loadSession: (sessionId: string) => void;
  setCurrentPhase: (index: number) => void;
  updateAnswer: (questionId: string, content: string, rating?: number) => void;
  addComment: (answerId: string, content: string, parentId?: string) => void;
  toggleLike: (commentId: string) => void;
  addActionItem: (item: Omit<ActionItem, 'id' | 'createdAt' | 'status'>) => void;
  updateActionStatus: (itemId: string, status: ActionItem['status']) => void;
  toggleTheme: () => void;
}

export const useRetroStore = create<RetroState>((set, get) => ({
  currentUser: mockCurrentUser,
  activeRetrospectId: mockCurrentSession.id,
  currentSession: mockCurrentSession,
  templates: mockTemplates,
  currentTemplate: mockTemplates[0],
  phases: mockPhases,
  currentPhaseIndex: 0,
  questionStats: mockQuestionStats,
  actionItems: mockActionItems,
  comments: mockComments,
  theme: 'light',

  setCurrentUser: (user: TeamMember) => set({ currentUser: user }),

  setActiveRetrospectId: (id: string | null) => set({ activeRetrospectId: id }),

  loadSession: (sessionId: string) => {
    const session = mockCurrentSession.id === sessionId ? mockCurrentSession : null;
    const template = session
      ? mockTemplates.find((t) => t.id === session.templateId) ?? null
      : null;
    set({
      currentSession: session,
      currentTemplate: template,
      phases: template?.phases ?? [],
      currentPhaseIndex: 0,
    });
  },

  setCurrentPhase: (index: number) => {
    const { phases } = get();
    if (index >= 0 && index < phases.length) {
      set({ currentPhaseIndex: index });
    }
  },

  updateAnswer: (questionId: string, content: string, rating?: number) => {
    const { currentUser, questionStats } = get();
    const now = new Date().toISOString();

    const updatedStats = questionStats.map((stat) => {
      if (stat.questionId !== questionId) return stat;

      const existingAnswerIndex = stat.answers.findIndex(
        (a) => a.memberId === currentUser.id,
      );

      let newAnswers: Answer[];
      if (existingAnswerIndex >= 0) {
        newAnswers = [...stat.answers];
        newAnswers[existingAnswerIndex] = {
          ...newAnswers[existingAnswerIndex],
          content,
          rating,
          createdAt: now,
        };
      } else {
        newAnswers = [
          ...stat.answers,
          {
            id: `answer-${Date.now()}`,
            questionId,
            memberId: currentUser.id,
            memberName: currentUser.name,
            content,
            rating,
            isAnonymous: false,
            createdAt: now,
          },
        ];
      }

      const ratingAnswers = newAnswers.filter((a) => a.rating !== undefined);
      const averageRating =
        ratingAnswers.length > 0
          ? ratingAnswers.reduce((sum, a) => sum + (a.rating ?? 0), 0) / ratingAnswers.length
          : 0;

      const ratingDistribution = [0, 0, 0, 0, 0];
      ratingAnswers.forEach((a) => {
        const idx = Math.min(Math.max((a.rating ?? 1) - 1, 0), 4);
        ratingDistribution[idx]++;
      });

      return {
        ...stat,
        answers: newAnswers,
        answerCount: newAnswers.length,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution,
      };
    });

    set({ questionStats: updatedStats });
  },

  addComment: (answerId: string, content: string, parentId?: string) => {
    const { currentUser, comments } = get();
    const now = new Date().toISOString();

    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      answerId,
      memberId: currentUser.id,
      memberName: currentUser.name,
      content,
      parentId,
      likes: 0,
      createdAt: now,
      replies: [],
    };

    if (parentId) {
      const addReply = (commentsList: Comment[]): Comment[] => {
        return commentsList.map((c) => {
          if (c.id === parentId) {
            return { ...c, replies: [...c.replies, newComment] };
          }
          if (c.replies.length > 0) {
            return { ...c, replies: addReply(c.replies) };
          }
          return c;
        });
      };
      set({ comments: addReply(comments) });
    } else {
      set({ comments: [...comments, newComment] });
    }
  },

  toggleLike: (commentId: string) => {
    const { comments } = get();

    const toggleLikeInComments = (commentsList: Comment[]): Comment[] => {
      return commentsList.map((c) => {
        if (c.id === commentId) {
          return { ...c, likes: c.likes + 1 };
        }
        if (c.replies.length > 0) {
          return { ...c, replies: toggleLikeInComments(c.replies) };
        }
        return c;
      });
    };

    set({ comments: toggleLikeInComments(comments) });
  },

  addActionItem: (item: Omit<ActionItem, 'id' | 'createdAt' | 'status'>) => {
    const { actionItems } = get();
    const now = new Date().toISOString();

    const newItem: ActionItem = {
      ...item,
      id: `action-${Date.now()}`,
      status: 'todo',
      createdAt: now,
    };

    set({ actionItems: [...actionItems, newItem] });
  },

  updateActionStatus: (itemId: string, status: ActionItem['status']) => {
    const { actionItems } = get();
    const now = new Date().toISOString();

    const updatedItems = actionItems.map((item) => {
      if (item.id !== itemId) return item;
      return {
        ...item,
        status,
        completedAt: status === 'completed' ? now : item.completedAt,
      };
    });

    set({ actionItems: updatedItems });
  },

  toggleTheme: () => {
    set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' }));
  },
}));
