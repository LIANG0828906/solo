import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { scoringRuleBank, type ScoringPoint, calculateScore, type ScoreResult } from './ScoringRule';

export interface Assignment {
  id: string;
  index: number;
  question: string;
  studentAnswer: string;
  status: 'pending' | 'reviewed';
  scoringPoints: ScoringPoint[];
  score: ScoreResult;
  reviewComment?: string;
}

interface AppState {
  assignments: Assignment[];
  selectedId: string | null;
  setSelectedQuestion: (id: string) => void;
  updateScoringPoint: (assignmentId: string, pointId: string, checked: boolean) => void;
  submitReview: (assignmentId: string) => void;
  getSelectedAssignment: () => Assignment | undefined;
}

const mockAssignments: Omit<Assignment, 'score'>[] = [
  {
    id: uuidv4(),
    index: 1,
    question: '请简述你对人工智能在教育领域应用的看法。',
    studentAnswer:
      '我认为人工智能在教育领域的应用具有巨大的潜力。首先，人工智能可以实现个性化教学，根据每个学生的学习进度和特点提供定制化的学习内容。例如，智能辅导系统可以自动识别学生的薄弱环节，针对性地出题和讲解。其次，AI还能帮助教师批改作业、统计成绩，大大减轻教师的工作负担。总之，人工智能将彻底改变传统教育模式，让学习变得更加高效和有趣。',
    status: 'pending',
    scoringPoints: scoringRuleBank.map((p) => ({ ...p, checked: false })),
  },
  {
    id: uuidv4(),
    index: 2,
    question: '分析互联网对现代社会人际关系的影响。',
    studentAnswer:
      '互联网对人际关系的影响是双面的。一方面，社交软件让人们可以随时随地联系，即使相隔千里也能保持沟通。另一方面，过度依赖网络交流可能导致面对面交流能力下降。观点上，我认为利大于弊，关键在于如何合理使用。',
    status: 'pending',
    scoringPoints: scoringRuleBank.map((p) => ({ ...p, checked: false })),
  },
  {
    id: uuidv4(),
    index: 3,
    question: '谈谈你对环境保护与经济发展关系的理解。',
    studentAnswer:
      '环境保护和经济发展并不矛盾，而是相辅相成的。首先，良好的生态环境是经济可持续发展的基础。例如，绿水青山就是金山银山的理念已经被广泛接受。其次，发展绿色产业可以创造新的经济增长点。结构上，我们需要从高耗能向低碳转型。总之，走可持续发展道路是唯一正确的选择。',
    status: 'pending',
    scoringPoints: scoringRuleBank.map((p) => ({ ...p, checked: false })),
  },
  {
    id: uuidv4(),
    index: 4,
    question: '请说明你为什么申请这个专业。',
    studentAnswer:
      '我申请这个专业主要有三个原因。第一，我从小就对这个领域充满好奇。第二，这个专业的就业前景很好。第三，我希望将来能在这个行业做出贡献。观点很明确，我非常适合这个专业。',
    status: 'reviewed',
    scoringPoints: scoringRuleBank.map((p) => ({ ...p, checked: false })),
  },
  {
    id: uuidv4(),
    index: 5,
    question: '论述阅读经典文学作品的价值。',
    studentAnswer:
      '阅读经典文学作品对个人成长具有深远的意义。首先，经典作品凝聚了人类智慧的结晶，能够帮助我们深入理解人性和社会。例如，阅读《红楼梦》可以让我们领略中国古代社会的方方面面。其次，经典文学能够提升我们的语言表达能力和审美水平。流畅的文字和优美的描写会潜移默化地影响我们的写作风格。结构上，经典作品往往有着精巧的叙事结构，值得我们反复品味。总之，阅读经典是一场与伟大心灵的对话，能够让我们变得更加深刻和丰富。',
    status: 'pending',
    scoringPoints: scoringRuleBank.map((p) => ({ ...p, checked: false })),
  },
];

function computeInitialScore(assignment: Omit<Assignment, 'score'>): Assignment {
  const selected = assignment.scoringPoints.filter(() => false);
  const score = calculateScore(assignment.studentAnswer, selected, assignment.scoringPoints);
  return { ...assignment, score };
}

const initialAssignments = mockAssignments.map(computeInitialScore);

export const useStore = create<AppState>((set, get) => ({
  assignments: initialAssignments,
  selectedId: initialAssignments[0]?.id ?? null,

  setSelectedQuestion: (id: string) => {
    set({ selectedId: id });
  },

  updateScoringPoint: (assignmentId: string, pointId: string, checked: boolean) => {
    set((state) => {
      const assignments = state.assignments.map((a) => {
        if (a.id !== assignmentId) return a;
        const scoringPoints = a.scoringPoints.map((p) =>
          p.id === pointId ? { ...p, checked } : p
        );
        const selected = scoringPoints.filter((p) => p.checked);
        const score = calculateScore(a.studentAnswer, selected, scoringPoints);
        return { ...a, scoringPoints, score };
      });
      return { assignments };
    });
  },

  submitReview: (assignmentId: string) => {
    set((state) => {
      const assignments = state.assignments.map((a) =>
        a.id === assignmentId ? { ...a, status: 'reviewed' as const } : a
      );
      const currentIndex = assignments.findIndex((a) => a.id === assignmentId);
      const nextPending = assignments.find((a, i) => i > currentIndex && a.status === 'pending');
      const selectedId = nextPending ? nextPending.id : state.selectedId;
      return { assignments, selectedId };
    });
  },

  getSelectedAssignment: () => {
    const state = get();
    return state.assignments.find((a) => a.id === state.selectedId);
  },
}));
