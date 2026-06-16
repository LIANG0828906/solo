import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { get, set } from 'idb-keyval';
import { persist } from 'zustand/middleware';
import { addDays, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';

export type VersionStatus = 'planning' | 'developing' | 'testing' | 'released';

export interface Milestone {
  id: string;
  name: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed';
  order: number;
  dependencies: string[];
  createdAt: string;
}

export interface Version {
  id: string;
  name: string;
  description?: string;
  releaseDate: string;
  status: VersionStatus;
  features: string[];
  knownIssues: number;
  milestones: Milestone[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  owner: string;
  versions: Version[];
  color: string;
  createdAt: string;
}

interface ProjectState {
  projects: Project[];
  selectedProjectId: string | null;
  selectedVersionId: string | null;
  filteredProjectIds: string[];
  currentMonth: Date;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'versions'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  selectProject: (id: string | null) => void;
  addVersion: (projectId: string, version: Omit<Version, 'id' | 'milestones'>) => void;
  updateVersion: (projectId: string, versionId: string, updates: Partial<Version>) => void;
  deleteVersion: (projectId: string, versionId: string) => void;
  selectVersion: (id: string | null) => void;
  addMilestone: (projectId: string, versionId: string, milestone: Omit<Milestone, 'id' | 'dependencies'>) => void;
  updateMilestone: (projectId: string, versionId: string, milestoneId: string, updates: Partial<Milestone>) => void;
  deleteMilestone: (projectId: string, versionId: string, milestoneId: string) => void;
  addDependency: (projectId: string, versionId: string, fromId: string, toId: string) => void;
  removeDependency: (projectId: string, versionId: string, fromId: string, toId: string) => void;
  toggleProjectFilter: (projectId: string) => void;
  setFilteredProjects: (ids: string[]) => void;
  setCurrentMonth: (date: Date) => void;
  getPublishedCount: () => number;
  getInProgressCount: () => number;
  getThisWeekMilestones: () => number;
  getCompletionRate: () => number;
}

const generateMockData = (): Project[] => {
  const colors = ['#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#f44336', '#00bcd4'];
  
  const projects: Project[] = [
    {
      id: uuidv4(),
      name: '电商平台',
      description: '企业级电商解决方案',
      owner: '张开发',
      color: colors[0],
      createdAt: new Date().toISOString(),
      versions: [
        {
          id: uuidv4(),
          name: 'v1.0.0',
          description: '首个正式版本',
          releaseDate: addDays(new Date(), -30).toISOString().split('T')[0],
          status: 'released',
          features: ['用户系统', '商品管理', '购物车', '订单系统'],
          knownIssues: 2,
          milestones: [
            { id: uuidv4(), name: '需求评审', status: 'completed', order: 0, dependencies: [], createdAt: new Date().toISOString() },
            { id: uuidv4(), name: 'UI设计', status: 'completed', order: 1, dependencies: [], createdAt: new Date().toISOString() },
            { id: uuidv4(), name: '后端API', status: 'completed', order: 2, dependencies: [], createdAt: new Date().toISOString() },
            { id: uuidv4(), name: '前端开发', status: 'completed', order: 3, dependencies: [], createdAt: new Date().toISOString() },
          ],
        },
        {
          id: uuidv4(),
          name: 'v1.1.0',
          description: '新增营销功能',
          releaseDate: addDays(new Date(), 15).toISOString().split('T')[0],
          status: 'developing',
          features: ['优惠券系统', '秒杀活动', '会员等级'],
          knownIssues: 5,
          milestones: [
            { id: uuidv4(), name: '需求评审', status: 'completed', order: 0, dependencies: [], createdAt: new Date().toISOString() },
            { id: uuidv4(), name: '数据库设计', status: 'completed', order: 1, dependencies: [], createdAt: new Date().toISOString() },
            { id: uuidv4(), name: '后端API完成', status: 'in-progress', order: 2, dependencies: [], createdAt: new Date().toISOString() },
            { id: uuidv4(), name: '前端联调', status: 'pending', order: 3, dependencies: [], createdAt: new Date().toISOString() },
            { id: uuidv4(), name: '测试验收', status: 'pending', order: 4, dependencies: [], createdAt: new Date().toISOString() },
          ],
        },
        {
          id: uuidv4(),
          name: 'v1.2.0',
          description: '数据分析模块',
          releaseDate: addDays(new Date(), 45).toISOString().split('T')[0],
          status: 'planning',
          features: ['数据看板', '销售报表', '用户画像'],
          knownIssues: 0,
          milestones: [
            { id: uuidv4(), name: '方案设计', status: 'pending', order: 0, dependencies: [], createdAt: new Date().toISOString() },
            { id: uuidv4(), name: '技术选型', status: 'pending', order: 1, dependencies: [], createdAt: new Date().toISOString() },
          ],
        },
      ],
    },
    {
      id: uuidv4(),
      name: 'CRM系统',
      description: '客户关系管理系统',
      owner: '李产品',
      color: colors[1],
      createdAt: new Date().toISOString(),
      versions: [
        {
          id: uuidv4(),
          name: 'v2.0.0',
          description: '全新升级版本',
          releaseDate: addDays(new Date(), 7).toISOString().split('T')[0],
          status: 'testing',
          features: ['客户360视图', '销售漏斗', '工单系统', '知识库'],
          knownIssues: 8,
          milestones: [
            { id: uuidv4(), name: '架构设计', status: 'completed', order: 0, dependencies: [], createdAt: new Date().toISOString() },
            { id: uuidv4(), name: '核心模块开发', status: 'completed', order: 1, dependencies: [], createdAt: new Date().toISOString() },
            { id: uuidv4(), name: '集成测试', status: 'in-progress', order: 2, dependencies: [], createdAt: new Date().toISOString() },
            { id: uuidv4(), name: '性能优化', status: 'pending', order: 3, dependencies: [], createdAt: new Date().toISOString() },
          ],
        },
        {
          id: uuidv4(),
          name: 'v2.1.0',
          description: 'AI智能助手',
          releaseDate: addDays(new Date(), 60).toISOString().split('T')[0],
          status: 'planning',
          features: ['AI客服', '智能推荐', '自动报表'],
          knownIssues: 0,
          milestones: [
            { id: uuidv4(), name: '技术调研', status: 'pending', order: 0, dependencies: [], createdAt: new Date().toISOString() },
            { id: uuidv4(), name: '模型选型', status: 'pending', order: 1, dependencies: [], createdAt: new Date().toISOString() },
          ],
        },
      ],
    },
    {
      id: uuidv4(),
      name: '移动办公App',
      description: '企业移动办公应用',
      owner: '王设计',
      color: colors[2],
      createdAt: new Date().toISOString(),
      versions: [
        {
          id: uuidv4(),
          name: 'v3.0.0',
          description: '重构版本',
          releaseDate: addDays(new Date(), 30).toISOString().split('T')[0],
          status: 'developing',
          features: ['全新UI', '消息中心', '审批流程', '通讯录'],
          knownIssues: 3,
          milestones: [
            { id: uuidv4(), name: 'UI设计稿', status: 'completed', order: 0, dependencies: [], createdAt: new Date().toISOString() },
            { id: uuidv4(), name: '基础框架', status: 'completed', order: 1, dependencies: [], createdAt: new Date().toISOString() },
            { id: uuidv4(), name: '消息模块', status: 'in-progress', order: 2, dependencies: [], createdAt: new Date().toISOString() },
            { id: uuidv4(), name: '审批模块', status: 'pending', order: 3, dependencies: [], createdAt: new Date().toISOString() },
            { id: uuidv4(), name: '通讯录', status: 'pending', order: 4, dependencies: [], createdAt: new Date().toISOString() },
          ],
        },
      ],
    },
  ];

  return projects;
};

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: generateMockData(),
      selectedProjectId: null,
      selectedVersionId: null,
      filteredProjectIds: [],
      currentMonth: new Date(),

      addProject: (project) => set((state) => ({
        projects: [...state.projects, { ...project, id: uuidv4(), createdAt: new Date().toISOString(), versions: [] }],
      })),

      updateProject: (id, updates) => set((state) => ({
        projects: state.projects.map((p) => p.id === id ? { ...p, ...updates } : p),
      })),

      deleteProject: (id) => set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        selectedProjectId: state.selectedProjectId === id ? null : state.selectedProjectId,
      })),

      selectProject: (id) => set({ selectedProjectId: id, selectedVersionId: null }),

      addVersion: (projectId, version) => set((state) => ({
        projects: state.projects.map((p) =>
          p.id === projectId
            ? { ...p, versions: [...p.versions, { ...version, id: uuidv4(), milestones: [] }] }
            : p
        ),
      })),

      updateVersion: (projectId, versionId, updates) => set((state) => ({
        projects: state.projects.map((p) =>
          p.id === projectId
            ? {
                ...p,
                versions: p.versions.map((v) => v.id === versionId ? { ...v, ...updates } : v),
              }
            : p
        ),
      })),

      deleteVersion: (projectId, versionId) => set((state) => ({
        projects: state.projects.map((p) =>
          p.id === projectId
            ? { ...p, versions: p.versions.filter((v) => v.id !== versionId) }
            : p
        ),
        selectedVersionId: get().selectedVersionId === versionId ? null : get().selectedVersionId,
      })),

      selectVersion: (id) => set({ selectedVersionId: id }),

      addMilestone: (projectId, versionId, milestone) => set((state) => ({
        projects: state.projects.map((p) =>
          p.id === projectId
            ? {
                ...p,
                versions: p.versions.map((v) =>
                  v.id === versionId
                    ? {
                        ...v,
                        milestones: [...v.milestones, { ...milestone, id: uuidv4(), dependencies: [] }].sort(
                          (a, b) => a.order - b.order
                        ),
                      }
                    : v
                ),
              }
            : p
        ),
      })),

      updateMilestone: (projectId, versionId, milestoneId, updates) => set((state) => ({
        projects: state.projects.map((p) =>
          p.id === projectId
            ? {
                ...p,
                versions: p.versions.map((v) =>
                  v.id === versionId
                    ? {
                        ...v,
                        milestones: v.milestones.map((m) =>
                          m.id === milestoneId ? { ...m, ...updates } : m
                        ),
                      }
                    : v
                ),
              }
            : p
        ),
      })),

      deleteMilestone: (projectId, versionId, milestoneId) => set((state) => ({
        projects: state.projects.map((p) =>
          p.id === projectId
            ? {
                ...p,
                versions: p.versions.map((v) =>
                  v.id === versionId
                    ? {
                        ...v,
                        milestones: v.milestones.filter((m) => m.id !== milestoneId).map((m, i) => ({
                          ...m,
                          order: i,
                        })),
                      }
                    : v
                ),
              }
            : p
        ),
      })),

      addDependency: (projectId, versionId, fromId, toId) => set((state) => ({
        projects: state.projects.map((p) =>
          p.id === projectId
            ? {
                ...p,
                versions: p.versions.map((v) =>
                  v.id === versionId
                    ? {
                        ...v,
                        milestones: v.milestones.map((m) =>
                          m.id === toId && !m.dependencies.includes(fromId)
                            ? { ...m, dependencies: [...m.dependencies, fromId] }
                            : m
                        ),
                      }
                    : v
                ),
              }
            : p
        ),
      })),

      removeDependency: (projectId, versionId, fromId, toId) => set((state) => ({
        projects: state.projects.map((p) =>
          p.id === projectId
            ? {
                ...p,
                versions: p.versions.map((v) =>
                  v.id === versionId
                    ? {
                        ...v,
                        milestones: v.milestones.map((m) =>
                          m.id === toId
                            ? { ...m, dependencies: m.dependencies.filter((d) => d !== fromId) }
                            : m
                        ),
                      }
                    : v
                ),
              }
            : p
        ),
      })),

      toggleProjectFilter: (projectId) => set((state) => {
        const isFiltered = state.filteredProjectIds.includes(projectId);
        return {
          filteredProjectIds: isFiltered
            ? state.filteredProjectIds.filter((id) => id !== projectId)
            : [...state.filteredProjectIds, projectId],
        };
      }),

      setFilteredProjects: (ids) => set({ filteredProjectIds: ids }),

      setCurrentMonth: (date) => set({ currentMonth: date }),

      getPublishedCount: () => {
        const { projects } = get();
        return projects.reduce(
          (acc, p) => acc + p.versions.filter((v) => v.status === 'released').length,
          0
        );
      },

      getInProgressCount: () => {
        const { projects } = get();
        return projects.reduce(
          (acc, p) =>
            acc + p.versions.filter((v) => v.status === 'developing' || v.status === 'testing').length,
          0
        );
      },

      getThisWeekMilestones: () => {
        const { projects } = get();
        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
        let count = 0;

        projects.forEach((p) => {
          p.versions.forEach((v) => {
            try {
              const releaseDate = parseISO(v.releaseDate);
              if (isWithinInterval(releaseDate, { start: weekStart, end: weekEnd })) {
                count += v.milestones.filter((m) => m.status !== 'completed').length;
              }
            } catch {
              // ignore invalid dates
            }
          });
        });

        return count;
      },

      getCompletionRate: () => {
        const { projects } = get();
        let total = 0;
        let completed = 0;

        projects.forEach((p) => {
          p.versions.forEach((v) => {
            total += v.milestones.length;
            completed += v.milestones.filter((m) => m.status === 'completed').length;
          });
        });

        return total > 0 ? Math.round((completed / total) * 100) : 0;
      },
    }),
    {
      name: 'project-management-store',
      storage: {
        getItem: async (name) => {
          const value = await get(name);
          return value ?? null;
        },
        setItem: async (name, value) => {
          await set(name, value);
        },
        removeItem: async (name) => {
          const { del } = await import('idb-keyval');
          await del(name);
        },
      },
    }
  )
);
