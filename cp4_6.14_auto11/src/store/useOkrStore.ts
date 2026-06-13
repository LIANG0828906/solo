import { create } from 'zustand';
import type { Quarter, Objective, KeyResult, SubTask, Dependency, FailureReason } from '@/types';

interface OkrState {
  quarters: Quarter[];
  objectives: Objective[];
  keyResults: KeyResult[];
  subTasks: SubTask[];
  dependencies: Dependency[];
  failureReasons: FailureReason[];
  selectedObjectiveId: string | null;
  selectedDependencyId: string | null;
  mobileNavOpen: boolean;

  setMobileNavOpen: (open: boolean) => void;
  setSelectedObjectiveId: (id: string | null) => void;
  setSelectedDependencyId: (id: string | null) => void;

  addObjective: (obj: Objective) => void;
  updateObjective: (id: string, data: Partial<Objective>) => void;
  deleteObjective: (id: string) => void;

  addKeyResult: (kr: KeyResult) => void;
  updateKeyResult: (id: string, data: Partial<KeyResult>) => void;
  deleteKeyResult: (id: string) => void;

  addSubTask: (task: SubTask) => void;
  updateSubTask: (id: string, data: Partial<SubTask>) => void;
  deleteSubTask: (id: string) => void;

  addDependency: (dep: Dependency) => void;
  removeDependency: (id: string) => void;

  setFailureReasons: (krId: string, reasons: string[]) => void;
}

const STORAGE_KEY = 'okr-store';

function loadFromStorage(): Partial<OkrState> | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch { /* ignore */ }
  return null;
}

function saveToStorage(state: OkrState) {
  try {
    const toSave = {
      quarters: state.quarters,
      objectives: state.objectives,
      keyResults: state.keyResults,
      subTasks: state.subTasks,
      dependencies: state.dependencies,
      failureReasons: state.failureReasons,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch { /* ignore */ }
}

const defaultQuarters: Quarter[] = [
  { id: 'q1-2026', name: '2026 Q1', startDate: '2026-01-01', endDate: '2026-03-31' },
  { id: 'q2-2026', name: '2026 Q2', startDate: '2026-04-01', endDate: '2026-06-30' },
  { id: 'q3-2026', name: '2026 Q3', startDate: '2026-07-01', endDate: '2026-09-30' },
];

const defaultObjectives: Objective[] = [
  { id: 'obj-1', quarterId: 'q2-2026', title: '提升产品市场竞争力', order: 0, dependencyIds: [], dependencyThreshold: 0 },
  { id: 'obj-2', quarterId: 'q2-2026', title: '优化团队协作效率', order: 1, dependencyIds: ['dep-1'], dependencyThreshold: 60 },
  { id: 'obj-3', quarterId: 'q2-2026', title: '扩大用户增长规模', order: 2, dependencyIds: [], dependencyThreshold: 0 },
];

const defaultKeyResults: KeyResult[] = [
  { id: 'kr-1', objectiveId: 'obj-1', title: '产品NPS评分达到50', type: 'numeric', initialValue: 20, targetValue: 50, currentValue: 35, assignee: '张伟' },
  { id: 'kr-2', objectiveId: 'obj-1', title: '完成3个核心功能上线', type: 'numeric', initialValue: 0, targetValue: 3, currentValue: 2, assignee: '李娜' },
  { id: 'kr-3', objectiveId: 'obj-1', title: '用户满意度达标', type: 'boolean', initialValue: 0, targetValue: 1, currentValue: 0, assignee: '王磊' },
  { id: 'kr-4', objectiveId: 'obj-2', title: '会议效率提升至85%', type: 'percentage', initialValue: 0, targetValue: 100, currentValue: 65, assignee: '赵敏' },
  { id: 'kr-5', objectiveId: 'obj-2', title: '文档覆盖率90%', type: 'percentage', initialValue: 0, targetValue: 100, currentValue: 45, assignee: '孙浩' },
  { id: 'kr-6', objectiveId: 'obj-3', title: '新增注册用户5000', type: 'numeric', initialValue: 0, targetValue: 5000, currentValue: 3200, assignee: '陈雪' },
  { id: 'kr-7', objectiveId: 'obj-3', title: '月活跃用户增长30%', type: 'percentage', initialValue: 0, targetValue: 100, currentValue: 78, assignee: '刘洋' },
  { id: 'kr-8', objectiveId: 'obj-3', title: '用户留存率达标', type: 'boolean', initialValue: 0, targetValue: 1, currentValue: 1, assignee: '张伟' },
];

const defaultSubTasks: SubTask[] = [
  { id: 'st-1', keyResultId: 'kr-1', title: '设计NPS调研问卷', status: 'done', assignee: '张伟' },
  { id: 'st-2', keyResultId: 'kr-1', title: '发放并收集用户反馈', status: 'in_progress', assignee: '张伟' },
  { id: 'st-3', keyResultId: 'kr-1', title: '分析NPS数据并输出报告', status: 'todo', assignee: '李娜' },
  { id: 'st-4', keyResultId: 'kr-2', title: '功能A需求评审', status: 'done', assignee: '李娜' },
  { id: 'st-5', keyResultId: 'kr-2', title: '功能B开发与测试', status: 'in_progress', assignee: '王磊' },
  { id: 'st-6', keyResultId: 'kr-2', title: '功能C设计稿确认', status: 'todo', assignee: '李娜' },
  { id: 'st-7', keyResultId: 'kr-4', title: '梳理现有会议流程', status: 'done', assignee: '赵敏' },
  { id: 'st-8', keyResultId: 'kr-4', title: '制定会议规范文档', status: 'in_progress', assignee: '赵敏' },
  { id: 'st-9', keyResultId: 'kr-6', title: '优化注册转化漏斗', status: 'done', assignee: '陈雪' },
  { id: 'st-10', keyResultId: 'kr-6', title: '投放渠道A/B测试', status: 'in_progress', assignee: '刘洋' },
];

const defaultDependencies: Dependency[] = [
  { id: 'dep-1', sourceId: 'obj-1', targetId: 'obj-2', threshold: 60 },
];

const defaultFailureReasons: FailureReason[] = [];

const saved = loadFromStorage();

export const useOkrStore = create<OkrState>((set, get) => ({
  quarters: (saved?.quarters as Quarter[]) || defaultQuarters,
  objectives: (saved?.objectives as Objective[]) || defaultObjectives,
  keyResults: (saved?.keyResults as KeyResult[]) || defaultKeyResults,
  subTasks: (saved?.subTasks as SubTask[]) || defaultSubTasks,
  dependencies: (saved?.dependencies as Dependency[]) || defaultDependencies,
  failureReasons: (saved?.failureReasons as FailureReason[]) || defaultFailureReasons,
  selectedObjectiveId: null,
  selectedDependencyId: null,
  mobileNavOpen: false,

  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
  setSelectedObjectiveId: (id) => set({ selectedObjectiveId: id }),
  setSelectedDependencyId: (id) => set({ selectedDependencyId: id }),

  addObjective: (obj) => {
    set((s) => ({ objectives: [...s.objectives, obj] }));
    saveToStorage(get());
  },
  updateObjective: (id, data) => {
    set((s) => ({ objectives: s.objectives.map((o) => (o.id === id ? { ...o, ...data } : o)) }));
    saveToStorage(get());
  },
  deleteObjective: (id) => {
    set((s) => ({
      objectives: s.objectives.filter((o) => o.id !== id),
      keyResults: s.keyResults.filter((kr) => kr.objectiveId !== id),
      dependencies: s.dependencies.filter((d) => d.sourceId !== id && d.targetId !== id),
      selectedObjectiveId: s.selectedObjectiveId === id ? null : s.selectedObjectiveId,
    }));
    saveToStorage(get());
  },

  addKeyResult: (kr) => {
    set((s) => ({ keyResults: [...s.keyResults, kr] }));
    saveToStorage(get());
  },
  updateKeyResult: (id, data) => {
    set((s) => ({ keyResults: s.keyResults.map((kr) => (kr.id === id ? { ...kr, ...data } : kr)) }));
    saveToStorage(get());
  },
  deleteKeyResult: (id) => {
    set((s) => ({
      keyResults: s.keyResults.filter((kr) => kr.id !== id),
      subTasks: s.subTasks.filter((st) => st.keyResultId !== id),
    }));
    saveToStorage(get());
  },

  addSubTask: (task) => {
    set((s) => {
      const krTasks = s.subTasks.filter((st) => st.keyResultId === task.keyResultId);
      if (krTasks.length >= 10) return s;
      return { subTasks: [...s.subTasks, task] };
    });
    saveToStorage(get());
  },
  updateSubTask: (id, data) => {
    set((s) => {
      const newSubTasks = s.subTasks.map((st) => (st.id === id ? { ...st, ...data } : st));
      const updatedTask = newSubTasks.find((st) => st.id === id);
      if (updatedTask && data.status === 'done') {
        const krTasks = newSubTasks.filter((st) => st.keyResultId === updatedTask.keyResultId);
        const allDone = krTasks.every((st) => st.status === 'done');
        if (allDone && krTasks.length > 0) {
          const krId = updatedTask.keyResultId;
          const kr = s.keyResults.find((k) => k.id === krId);
          if (kr && kr.currentValue < kr.targetValue) {
            return {
              subTasks: newSubTasks,
              keyResults: s.keyResults.map((k) =>
                k.id === krId ? { ...k, currentValue: k.targetValue } : k
              ),
            };
          }
        }
      }
      return { subTasks: newSubTasks };
    });
    saveToStorage(get());
  },
  deleteSubTask: (id) => {
    set((s) => ({ subTasks: s.subTasks.filter((st) => st.id !== id) }));
    saveToStorage(get());
  },

  addDependency: (dep) => {
    set((s) => ({ dependencies: [...s.dependencies, dep] }));
    saveToStorage(get());
  },
  removeDependency: (id) => {
    set((s) => ({ dependencies: s.dependencies.filter((d) => d.id !== id) }));
    saveToStorage(get());
  },

  setFailureReasons: (krId, reasons) => {
    set((s) => {
      const existing = s.failureReasons.filter((fr) => fr.keyResultId !== krId);
      return { failureReasons: [...existing, { keyResultId: krId, reasons }] };
    });
    saveToStorage(get());
  },
}));
