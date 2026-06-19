import {
  AppState,
  Assignment,
  Submission,
  ScoreRecord,
  ConsistencyMetrics,
  RaterBiasData,
  BiasTrendPoint,
  ScoreDimension,
} from './types';
import { eventBus } from './eventBus';
import { AppEventType } from './types';

const STUDENTS = [
  { id: 'S001', name: '张三' },
  { id: 'S002', name: '李四' },
  { id: 'S003', name: '王五' },
  { id: 'S004', name: '赵六' },
  { id: 'S005', name: '钱七' },
];

function genDims(): ScoreDimension[] {
  return [
    { id: 'd1', name: '逻辑清晰度', weight: 1 },
    { id: 'd2', name: '格式规范', weight: 1 },
    { id: 'd3', name: '创新性', weight: 1 },
  ];
}

const NOW = new Date('2026-06-19T10:00:00Z').toISOString();

const MOCK_ASSIGNMENTS: Assignment[] = [
  {
    id: 'A001',
    title: '数据结构期中作业：算法设计',
    deadline: '2026-06-10T23:59:59Z',
    totalScore: 15,
    dimensions: genDims(),
    createdAt: '2026-05-20T09:00:00Z',
    submittedCount: 5,
    reviewedCount: 5,
    totalStudents: 5,
    status: 'finished',
  },
  {
    id: 'A002',
    title: '软件工程实践：UML建模报告',
    deadline: '2026-06-15T23:59:59Z',
    totalScore: 15,
    dimensions: genDims(),
    createdAt: '2026-05-28T09:00:00Z',
    submittedCount: 5,
    reviewedCount: 5,
    totalStudents: 5,
    status: 'reviewing',
  },
  {
    id: 'A003',
    title: '操作系统大作业：进程调度模拟',
    deadline: '2026-06-25T23:59:59Z',
    totalScore: 15,
    dimensions: genDims(),
    createdAt: '2026-06-10T09:00:00Z',
    submittedCount: 3,
    reviewedCount: 2,
    totalStudents: 5,
    status: 'submitting',
  },
];

const SAMPLE_CONTENT = `# 算法设计报告

## 一、问题分析
本次作业要求实现最短路径算法的优化版本。我选择了Dijkstra算法，并使用堆优化进行改进。通过分析问题特点，发现传统算法在稀疏图上的时间复杂度较高，因此引入优先队列以降低查找开销。

## 二、核心实现
算法的核心在于维护一个最小堆，每次取出距离最小的节点进行松弛操作。在实现过程中，我使用了邻接表存储图结构，并在松弛操作后更新堆中元素。

## 三、实验结果
测试数据集包含1000个节点和5000条边，优化后的算法运行时间从原先的O(n²)降低到O(m log n)，实测加速比约为15倍。

## 四、创新点
我在堆更新阶段引入了延迟删除策略，避免了频繁的堆结构调整，进一步提升了性能。`;

const MOCK_SUBMISSIONS: Submission[] = [];
for (let i = 0; i < STUDENTS.length; i++) {
  for (let ai = 0; ai < MOCK_ASSIGNMENTS.length; ai++) {
    const a = MOCK_ASSIGNMENTS[ai];
    if (a.id === 'A003' && i > 2) continue;
    const paragraphs = SAMPLE_CONTENT.split(/\n{2,}/).filter((p) => p.trim().length > 0);
    const keywords = ['算法', '优化', 'Dijkstra', '堆', '复杂度', '性能', '邻接表', '松弛操作'];
    MOCK_SUBMISSIONS.push({
      id: `SUB_${a.id}_${STUDENTS[i].id}`,
      assignmentId: a.id,
      studentId: STUDENTS[i].id,
      content: SAMPLE_CONTENT,
      paragraphs,
      keywords,
      submittedAt: NOW,
      hasSubmitted: true,
    });
  }
}

function randScore(seed: number): number {
  const v = 2.5 + Math.sin(seed * 1.3) * 1.2 + ((seed * 17) % 10) / 10;
  return Math.max(0.5, Math.min(5, Math.round(v * 2) / 2));
}

const MOCK_SCORE_RECORDS: ScoreRecord[] = [];
let sid = 0;
for (const a of MOCK_ASSIGNMENTS) {
  for (let i = 0; i < STUDENTS.length; i++) {
    if (a.id === 'A003' && i > 3) continue;
    const mySubId = `SUB_${a.id}_${STUDENTS[i].id}`;
    const others = STUDENTS.filter((_, idx) => idx !== i);
    const shuffled = [...others].sort((x, y) => (x.id.charCodeAt(2) - y.id.charCodeAt(2)));
    const assigned = shuffled.slice(0, 3);
    for (const target of assigned) {
      if (a.id === 'A003' && target.id === 'S005') continue;
      const targetSubId = `SUB_${a.id}_${target.id}`;
      if (!MOCK_SUBMISSIONS.find((s) => s.id === targetSubId)) continue;
      const seed = sid + a.id.charCodeAt(2) + i * 3;
      const scores: Record<string, number> = {};
      scores['d1'] = randScore(seed);
      scores['d2'] = randScore(seed + 1);
      scores['d3'] = randScore(seed + 2);
      const total = Object.values(scores).reduce((s, v) => s + v, 0);
      MOCK_SCORE_RECORDS.push({
        id: `REC_${sid++}`,
        assignmentId: a.id,
        submissionId: targetSubId,
        raterId: STUDENTS[i].id,
        scores,
        totalScore: total,
        submittedAt: NOW,
      });
    }
  }
}

function createInitialState(): AppState {
  return {
    assignments: MOCK_ASSIGNMENTS,
    submissions: MOCK_SUBMISSIONS,
    scoreRecords: MOCK_SCORE_RECORDS,
    consistencyMetrics: {},
    raterBiasData: {},
    raterBiasTrends: {},
    selectedAssignmentId: MOCK_ASSIGNMENTS[0].id,
    currentUserId: STUDENTS[0].id,
    userRole: 'teacher',
    students: STUDENTS,
  };
}

class Store {
  private state: AppState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = createInitialState();
  }

  getState(): AppState {
    return this.state;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  setSelectedAssignment(id: string): void {
    this.state = { ...this.state, selectedAssignmentId: id };
    this.notify();
  }

  toggleRole(): void {
    this.state = {
      ...this.state,
      userRole: this.state.userRole === 'teacher' ? 'student' : 'teacher',
    };
    this.notify();
  }

  setCurrentUser(id: string): void {
    this.state = { ...this.state, currentUserId: id };
    this.notify();
  }

  addAssignment(a: Assignment): void {
    this.state = { ...this.state, assignments: [...this.state.assignments, a] };
    this.notify();
    eventBus.emit(AppEventType.ASSIGNMENT_CREATED, a);
  }

  submitSubmission(sub: Submission): void {
    const exists = this.state.submissions.findIndex(
      (s) => s.assignmentId === sub.assignmentId && s.studentId === sub.studentId,
    );
    let newSubs = [...this.state.submissions];
    if (exists >= 0) {
      newSubs[exists] = sub;
    } else {
      newSubs.push(sub);
    }
    const newAssignments = this.state.assignments.map((a) =>
      a.id === sub.assignmentId && exists < 0
        ? { ...a, submittedCount: Math.min(a.totalStudents, a.submittedCount + 1) }
        : a,
    );
    this.state = { ...this.state, submissions: newSubs, assignments: newAssignments };
    this.notify();
    eventBus.emit(AppEventType.SUBMISSION_SUBMITTED, sub);
  }

  addScoreRecord(r: ScoreRecord): void {
    const already = this.state.scoreRecords.find(
      (x) => x.assignmentId === r.assignmentId && x.submissionId === r.submissionId && x.raterId === r.raterId,
    );
    let newRecords: ScoreRecord[];
    let newAssignments = this.state.assignments;
    if (already) {
      newRecords = this.state.scoreRecords.map((x) => (x.id === already.id ? r : x));
    } else {
      newRecords = [...this.state.scoreRecords, r];
      newAssignments = this.state.assignments.map((a) =>
        a.id === r.assignmentId
          ? { ...a, reviewedCount: Math.min(a.totalStudents, a.reviewedCount + 1) }
          : a,
      );
    }
    this.state = { ...this.state, scoreRecords: newRecords, assignments: newAssignments };
    this.notify();
    eventBus.emit(AppEventType.SCORE_SUBMITTED, {
      assignmentId: r.assignmentId,
      submissionId: r.submissionId,
      raterId: r.raterId,
    });
  }

  updateConsistencyMetrics(m: ConsistencyMetrics): void {
    this.state = {
      ...this.state,
      consistencyMetrics: { ...this.state.consistencyMetrics, [m.assignmentId]: m },
    };
    this.notify();
    eventBus.emit(AppEventType.CONSISTENCY_CALCULATED, m);
  }

  updateRaterBiasData(assignmentId: string, data: RaterBiasData[]): void {
    this.state = {
      ...this.state,
      raterBiasData: { ...this.state.raterBiasData, [assignmentId]: data },
    };
    this.notify();
  }

  updateRaterBiasTrends(trends: Record<string, BiasTrendPoint[]>): void {
    this.state = { ...this.state, raterBiasTrends: trends };
    this.notify();
    eventBus.emit(AppEventType.BIAS_CALCULATED, this.state.raterBiasData);
  }
}

export const store = new Store();

(function initCompute() {
  import('./eval/ScoringEngine').then(({ recomputeForAssignment }) => {
    for (const a of MOCK_ASSIGNMENTS) {
      recomputeForAssignment(a.id);
    }
  });
})();
