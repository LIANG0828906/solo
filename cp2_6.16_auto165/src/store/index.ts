import { create } from 'zustand';
import type { Volunteer, Project, TimeTransaction } from '@/types';

interface AppState {
  volunteers: Volunteer[];
  projects: Project[];
  transactions: TimeTransaction[];
  currentVolunteerId: string | null;
  setCurrentVolunteerId: (id: string | null) => void;
  getVolunteerById: (id: string) => Volunteer | undefined;
  getProjectById: (id: string) => Project | undefined;
  rankedVolunteers: Volunteer[];
  getTransactionsByVolunteerId: (id: string) => TimeTransaction[];
}

const mockVolunteers: Volunteer[] = [
  {
    id: 'v1',
    name: '张三',
    contact: '13800138001',
    tags: ['教育', '环保', '社区服务'],
    balance_hours: 42.5,
    donated_hours: 15,
    completed_hours: 87,
    created_at: '2025-01-15T10:00:00Z',
    last_active_at: '2026-06-14T14:30:00Z',
  },
  {
    id: 'v2',
    name: '李四光',
    contact: '13800138002',
    tags: ['动物保护', '教育'],
    balance_hours: 28,
    donated_hours: 32,
    completed_hours: 156,
    created_at: '2024-11-20T08:00:00Z',
    last_active_at: '2026-06-15T09:15:00Z',
  },
  {
    id: 'v3',
    name: '王五',
    contact: '13800138003',
    tags: ['环保', '敬老'],
    balance_hours: 15.5,
    donated_hours: 8,
    completed_hours: 64,
    created_at: '2025-03-10T12:00:00Z',
    last_active_at: '2026-06-10T16:45:00Z',
  },
  {
    id: 'v4',
    name: '赵小明',
    contact: '13800138004',
    tags: ['社区服务', '教育', '动物保护'],
    balance_hours: 56,
    donated_hours: 45,
    completed_hours: 203,
    created_at: '2024-09-01T09:00:00Z',
    last_active_at: '2026-06-15T20:00:00Z',
  },
  {
    id: 'v5',
    name: '陈六',
    contact: '13800138005',
    tags: ['敬老', '环保'],
    balance_hours: 9,
    donated_hours: 5,
    completed_hours: 41,
    created_at: '2025-06-18T14:00:00Z',
    last_active_at: '2026-06-08T11:30:00Z',
  },
];

const mockProjects: Project[] = [
  {
    id: 'p1',
    name: '乡村小学支教计划',
    description: '为偏远地区乡村小学提供志愿者支教服务，涵盖语文、数学、英语等基础课程。',
    cover_image: '',
    required_hours: 500,
    achieved_hours: 387,
    deadline: '2026-08-31T23:59:59Z',
    created_at: '2026-01-01T00:00:00Z',
    status: 'active',
  },
  {
    id: 'p2',
    name: '城市河道清洁行动',
    description: '组织志愿者清理城市河道垃圾，保护水环境，建设美丽家园。',
    cover_image: '',
    required_hours: 200,
    achieved_hours: 200,
    deadline: '2026-05-31T23:59:59Z',
    created_at: '2026-03-01T00:00:00Z',
    status: 'closed',
  },
  {
    id: 'p3',
    name: '敬老院陪伴项目',
    description: '定期探访敬老院，为老人提供陪伴、聊天、文娱活动等关怀服务。',
    cover_image: '',
    required_hours: 300,
    achieved_hours: 142,
    deadline: '2026-12-31T23:59:59Z',
    created_at: '2026-02-01T00:00:00Z',
    status: 'active',
  },
];

const mockTransactions: TimeTransaction[] = [
  { id: 't1', volunteer_id: 'v1', project_id: 'p1', type: 'complete', hours: 8, created_at: '2026-06-14T14:30:00Z', description: '完成乡村小学支教一天' },
  { id: 't2', volunteer_id: 'v1', project_id: 'p3', type: 'donate', hours: 3, created_at: '2026-06-12T10:00:00Z', description: '捐赠3小时给敬老院项目' },
  { id: 't3', volunteer_id: 'v1', project_id: 'p1', type: 'complete', hours: 6, created_at: '2026-06-08T16:00:00Z', description: '完成支教课程准备' },
  { id: 't4', volunteer_id: 'v1', project_id: 'p1', type: 'complete', hours: 10, created_at: '2026-06-01T09:00:00Z', description: '周末支教活动' },
  { id: 't5', volunteer_id: 'v1', project_id: 'p2', type: 'complete', hours: 4, created_at: '2026-05-25T14:00:00Z', description: '河道清洁志愿活动' },
  { id: 't6', volunteer_id: 'v2', project_id: 'p1', type: 'complete', hours: 12, created_at: '2026-06-15T09:15:00Z', description: '连续两天支教' },
  { id: 't7', volunteer_id: 'v2', project_id: 'p1', type: 'donate', hours: 10, created_at: '2026-06-10T11:00:00Z', description: '捐赠10小时' },
  { id: 't8', volunteer_id: 'v2', project_id: 'p3', type: 'complete', hours: 6, created_at: '2026-06-05T15:00:00Z', description: '敬老院陪伴服务' },
  { id: 't9', volunteer_id: 'v2', project_id: 'p1', type: 'complete', hours: 8, created_at: '2026-05-28T10:00:00Z', description: '支教活动' },
  { id: 't10', volunteer_id: 'v2', project_id: 'p2', type: 'complete', hours: 5, created_at: '2026-05-20T14:00:00Z', description: '河道清洁' },
  { id: 't11', volunteer_id: 'v3', project_id: 'p2', type: 'complete', hours: 4, created_at: '2026-06-10T16:45:00Z', description: '参与河道清洁' },
  { id: 't12', volunteer_id: 'v3', project_id: 'p3', type: 'complete', hours: 8, created_at: '2026-06-01T14:00:00Z', description: '敬老院陪伴' },
  { id: 't13', volunteer_id: 'v3', project_id: 'p3', type: 'donate', hours: 2, created_at: '2026-05-25T10:00:00Z', description: '小额捐赠' },
  { id: 't14', volunteer_id: 'v4', project_id: 'p1', type: 'complete', hours: 16, created_at: '2026-06-15T20:00:00Z', description: '高强度支教周末' },
  { id: 't15', volunteer_id: 'v4', project_id: 'p1', type: 'donate', hours: 20, created_at: '2026-06-12T09:00:00Z', description: '大额时捐' },
  { id: 't16', volunteer_id: 'v4', project_id: 'p3', type: 'complete', hours: 10, created_at: '2026-06-08T15:00:00Z', description: '敬老院大型活动' },
  { id: 't17', volunteer_id: 'v4', project_id: 'p1', type: 'complete', hours: 12, created_at: '2026-06-02T10:00:00Z', description: '支教服务' },
  { id: 't18', volunteer_id: 'v5', project_id: 'p3', type: 'complete', hours: 6, created_at: '2026-06-08T11:30:00Z', description: '敬老服务' },
  { id: 't19', volunteer_id: 'v5', project_id: 'p2', type: 'complete', hours: 5, created_at: '2026-05-28T14:00:00Z', description: '清洁活动' },
];

export const useAppStore = create<AppState>((set, get) => ({
  volunteers: mockVolunteers,
  projects: mockProjects,
  transactions: mockTransactions,
  currentVolunteerId: 'v1',
  setCurrentVolunteerId: (id) => set({ currentVolunteerId: id }),
  getVolunteerById: (id) => get().volunteers.find((v) => v.id === id),
  getProjectById: (id) => get().projects.find((p) => p.id === id),
  rankedVolunteers: [...mockVolunteers].sort((a, b) => b.completed_hours - a.completed_hours),
  getTransactionsByVolunteerId: (id) =>
    [...get().transactions]
      .filter((t) => t.volunteer_id === id && (t.type === 'donate' || t.type === 'complete'))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5),
}));
