import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  Task, TaskStatus, Member,
  initDB, saveTasks, loadTasks,
  saveColumns, loadColumns,
  saveMembers as saveMembersDB, loadMembers
} from '@/utils/db';

interface BoardColumn {
  id: TaskStatus;
  title: string;
  taskIds: string[];
}

interface MemberWorkload {
  member: Member;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
}

interface ProjectStat {
  projectName: string;
  todo: number;
  inProgress: number;
  done: number;
}

interface Stats {
  totalTasks: number;
  completedTasks: number;
  avgCompletionTime: number;
  projectStats: ProjectStat[];
}

interface AppState {
  tasks: Record<string, Task>;
  columns: Record<TaskStatus, BoardColumn>;
  members: Member[];
  selectedTaskId: string | null;
  initialized: boolean;

  initStore: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  moveTask: (
    source: { columnId: TaskStatus; index: number },
    destination: { columnId: TaskStatus; index: number }
  ) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  setSelectedTaskId: (id: string | null) => void;

  getMemberWorkload: () => MemberWorkload[];
  getMemberById: (id: string) => Member | undefined;
  getStats: () => Stats;
}

const DEFAULT_MEMBERS: Member[] = [
  { id: 'm1', name: '张伟', avatarColor: '#3498DB' },
  { id: 'm2', name: '李娜', avatarColor: '#E74C3C' },
  { id: 'm3', name: '王芳', avatarColor: '#27AE60' },
  { id: 'm4', name: '刘强', avatarColor: '#9B59B6' },
  { id: 'm5', name: '陈静', avatarColor: '#F39C12' },
];

const DEFAULT_COLUMNS: Record<TaskStatus, BoardColumn> = {
  todo: { id: 'todo', title: '待办', taskIds: [] },
  in_progress: { id: 'in_progress', title: '进行中', taskIds: [] },
  done: { id: 'done', title: '已完成', taskIds: [] },
};

function createMockTasks(): { tasks: Record<string, Task>; columns: Record<TaskStatus, BoardColumn> } {
  const now = new Date();
  const due = (daysFromNow: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + daysFromNow);
    return d.toISOString().split('T')[0];
  };
  const created = (daysAgo: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString();
  };
  const completed = (daysAgo: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString();
  };

  const tasks: Task[] = [
    { id: uuidv4(), title: '设计产品原型图', description: '完成用户中心和设置页面的高保真原型设计', status: 'todo', assigneeId: 'm1', projectName: '官网重构', dueDate: due(5), createdAt: created(2), completedAt: null },
    { id: uuidv4(), title: '编写API接口文档', description: '整理所有对外API并补充示例代码', status: 'todo', assigneeId: 'm2', projectName: '用户系统', dueDate: due(3), createdAt: created(1), completedAt: null },
    { id: uuidv4(), title: '优化登录加载性能', description: '首屏加载时间需控制在1.5s内', status: 'todo', assigneeId: 'm3', projectName: '性能优化', dueDate: due(7), createdAt: created(3), completedAt: null },
    { id: uuidv4(), title: '修复订单列表分页Bug', description: '切换页码时偶发数据重复显示', status: 'todo', assigneeId: 'm4', projectName: '订单系统', dueDate: due(1), createdAt: created(1), completedAt: null },
    { id: uuidv4(), title: '接入第三方支付SDK', description: '完成支付宝和微信支付接入', status: 'todo', assigneeId: 'm5', projectName: '支付系统', dueDate: due(10), createdAt: created(5), completedAt: null },
    { id: uuidv4(), title: '数据看板前端开发', description: '实现销售趋势、用户增长等图表', status: 'in_progress', assigneeId: 'm1', projectName: '数据分析', dueDate: due(4), createdAt: created(7), completedAt: null },
    { id: uuidv4(), title: '编写单元测试', description: '核心模块测试覆盖率达到80%', status: 'in_progress', assigneeId: 'm2', projectName: '质量保障', dueDate: due(6), createdAt: created(4), completedAt: null },
    { id: uuidv4(), title: '移动端适配', description: '适配iOS/Android主流机型', status: 'in_progress', assigneeId: 'm3', projectName: '官网重构', dueDate: due(5), createdAt: created(6), completedAt: null },
    { id: uuidv4(), title: '用户反馈处理', description: '整理并分类本周用户反馈', status: 'in_progress', assigneeId: 'm5', projectName: '用户系统', dueDate: due(2), createdAt: created(2), completedAt: null },
    { id: uuidv4(), title: '数据库索引优化', description: '慢查询优化，提升10倍查询速度', status: 'done', assigneeId: 'm4', projectName: '性能优化', dueDate: due(-2), createdAt: created(14), completedAt: completed(2) },
    { id: uuidv4(), title: '登录注册功能开发', description: '完成邮箱、手机、第三方登录', status: 'done', assigneeId: 'm2', projectName: '用户系统', dueDate: due(-5), createdAt: created(20), completedAt: completed(5) },
    { id: uuidv4(), title: '需求文档评审', description: '组织产品需求评审会议', status: 'done', assigneeId: 'm1', projectName: '数据分析', dueDate: due(-3), createdAt: created(10), completedAt: completed(3) },
    { id: uuidv4(), title: '部署测试环境', description: '配置CI/CD流水线', status: 'done', assigneeId: 'm4', projectName: '基础设施', dueDate: due(-7), createdAt: created(15), completedAt: completed(7) },
    { id: uuidv4(), title: '安全漏洞修复', description: '修复SQL注入和XSS漏洞', status: 'done', assigneeId: 'm5', projectName: '安全加固', dueDate: due(-4), createdAt: created(12), completedAt: completed(4) },
    { id: uuidv4(), title: '国际化多语言支持', description: '支持中文/英文/日文切换', status: 'done', assigneeId: 'm3', projectName: '官网重构', dueDate: due(-1), createdAt: created(8), completedAt: completed(1) },
  ];

  const taskMap: Record<string, Task> = {};
  const todoIds: string[] = [];
  const inProgressIds: string[] = [];
  const doneIds: string[] = [];

  tasks.forEach(t => {
    taskMap[t.id] = t;
    if (t.status === 'todo') todoIds.push(t.id);
    else if (t.status === 'in_progress') inProgressIds.push(t.id);
    else doneIds.push(t.id);
  });

  return {
    tasks: taskMap,
    columns: {
      todo: { id: 'todo', title: '待办', taskIds: todoIds },
      in_progress: { id: 'in_progress', title: '进行中', taskIds: inProgressIds },
      done: { id: 'done', title: '已完成', taskIds: doneIds },
    },
  };
}

function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
  const B = Math.max(0, (num & 0x0000FF) - amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

export { darkenColor };

export const useStore = create<AppState>((set, get) => ({
  tasks: {},
  columns: { ...DEFAULT_COLUMNS },
  members: DEFAULT_MEMBERS,
  selectedTaskId: null,
  initialized: false,

  initStore: async () => {
    await initDB();
    const [savedTasks, savedColumns, savedMembers] = await Promise.all([
      loadTasks(),
      loadColumns(),
      loadMembers(),
    ]);

    if (savedMembers && savedMembers.length > 0) {
      if (Object.keys(savedTasks).length > 0 && savedColumns) {
        set({
          tasks: savedTasks,
          columns: savedColumns,
          members: savedMembers,
          initialized: true,
        });
      } else {
        const mock = createMockTasks();
        set({
          tasks: mock.tasks,
          columns: mock.columns,
          members: savedMembers,
          initialized: true,
        });
      }
    } else {
      const mock = createMockTasks();
      set({
        tasks: mock.tasks,
        columns: mock.columns,
        members: DEFAULT_MEMBERS,
        initialized: true,
      });
      await saveMembersDB(DEFAULT_MEMBERS);
      await saveTasks(mock.tasks);
      await saveColumns(mock.columns);
    }
  },

  addTask: (task) => {
    const id = uuidv4();
    const newTask: Task = {
      ...task,
      id,
      createdAt: new Date().toISOString(),
    };
    set(state => {
      const newTasks = { ...state.tasks, [id]: newTask };
      const newColumns = {
        ...state.columns,
        [task.status]: {
          ...state.columns[task.status],
          taskIds: [...state.columns[task.status].taskIds, id],
        },
      };
      saveTasks(newTasks);
      saveColumns(newColumns);
      return { tasks: newTasks, columns: newColumns };
    });
  },

  moveTask: (source, destination) => {
    if (source.columnId === destination.columnId && source.index === destination.index) return;
    set(state => {
      const newColumns = JSON.parse(JSON.stringify(state.columns)) as Record<TaskStatus, BoardColumn>;
      const sourceCol = newColumns[source.columnId];
      const destCol = newColumns[destination.columnId];
      const [movedId] = sourceCol.taskIds.splice(source.index, 1);
      destCol.taskIds.splice(destination.index, 0, movedId);

      const newTasks = { ...state.tasks };
      if (source.columnId !== destination.columnId) {
        newTasks[movedId] = {
          ...newTasks[movedId],
          status: destination.columnId,
          completedAt: destination.columnId === 'done' ? new Date().toISOString() : null,
        };
      }
      saveTasks(newTasks);
      saveColumns(newColumns);
      return { tasks: newTasks, columns: newColumns };
    });
  },

  updateTask: (id, patch) => {
    set(state => {
      const task = state.tasks[id];
      if (!task) return state;
      const newTasks = { ...state.tasks, [id]: { ...task, ...patch } };
      let newColumns = state.columns;

      if (patch.status && patch.status !== task.status) {
        newColumns = JSON.parse(JSON.stringify(state.columns)) as Record<TaskStatus, BoardColumn>;
        const oldCol = newColumns[task.status];
        const newCol = newColumns[patch.status];
        const idx = oldCol.taskIds.indexOf(id);
        if (idx >= 0) oldCol.taskIds.splice(idx, 1);
        newCol.taskIds.push(id);
        if (patch.status === 'done') {
          newTasks[id].completedAt = new Date().toISOString();
        } else {
          newTasks[id].completedAt = null;
        }
        saveColumns(newColumns);
      }

      saveTasks(newTasks);
      return { tasks: newTasks, columns: newColumns };
    });
  },

  deleteTask: (id) => {
    set(state => {
      const task = state.tasks[id];
      if (!task) return state;
      const newTasks = { ...state.tasks };
      delete newTasks[id];
      const newColumns = JSON.parse(JSON.stringify(state.columns)) as Record<TaskStatus, BoardColumn>;
      const col = newColumns[task.status];
      const idx = col.taskIds.indexOf(id);
      if (idx >= 0) col.taskIds.splice(idx, 1);
      saveTasks(newTasks);
      saveColumns(newColumns);
      return { tasks: newTasks, columns: newColumns, selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId };
    });
  },

  setSelectedTaskId: (id) => set({ selectedTaskId: id }),

  getMemberWorkload: () => {
    const { members, tasks } = get();
    return members.map(member => {
      const memberTasks = Object.values(tasks).filter(t => t.assigneeId === member.id);
      const totalTasks = memberTasks.length;
      const completedTasks = memberTasks.filter(t => t.status === 'done').length;
      return {
        member,
        totalTasks,
        completedTasks,
        completionRate: totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100),
      };
    });
  },

  getMemberById: (id) => {
    return get().members.find(m => m.id === id);
  },

  getStats: () => {
    const { tasks } = get();
    const all = Object.values(tasks);
    const totalTasks = all.length;
    const completedTasks = all.filter(t => t.status === 'done').length;

    let totalHours = 0;
    let completedCount = 0;
    all.forEach(t => {
      if (t.status === 'done' && t.completedAt) {
        const created = new Date(t.createdAt).getTime();
        const finished = new Date(t.completedAt).getTime();
        totalHours += (finished - created) / (1000 * 60 * 60);
        completedCount++;
      }
    });
    const avgCompletionTime = completedCount === 0 ? 0 : Math.round((totalHours / completedCount) * 10) / 10;

    const projectMap: Record<string, ProjectStat> = {};
    all.forEach(t => {
      if (!projectMap[t.projectName]) {
        projectMap[t.projectName] = { projectName: t.projectName, todo: 0, inProgress: 0, done: 0 };
      }
      if (t.status === 'todo') projectMap[t.projectName].todo++;
      else if (t.status === 'in_progress') projectMap[t.projectName].inProgress++;
      else projectMap[t.projectName].done++;
    });

    return {
      totalTasks,
      completedTasks,
      avgCompletionTime,
      projectStats: Object.values(projectMap),
    };
  },
}));
