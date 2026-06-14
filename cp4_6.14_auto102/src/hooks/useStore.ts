import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Member, Activity, Announcement, MemberRole } from '@/types';

interface StoreState {
  members: Member[];
  activities: Activity[];
  announcements: Announcement[];
  addMember: (m: Omit<Member, 'id'>) => void;
  updateMember: (id: string, m: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  addActivity: (a: Omit<Activity, 'id' | 'participantIds'>) => void;
  signUpActivity: (activityId: string, memberId: string) => void;
  addAnnouncement: (a: Omit<Announcement, 'id' | 'createdAt'>) => void;
}

const initialMembers: Member[] = [
  { id: uuidv4(), name: '张明轩', role: '社长', joinDate: '2024-09-01', phone: '13800138000' },
  { id: uuidv4(), name: '李思琪', role: '副社长', joinDate: '2024-09-05', phone: '13900139000' },
  { id: uuidv4(), name: '王浩然', role: '干事', joinDate: '2024-10-10', phone: '13700137000' },
  { id: uuidv4(), name: '陈子涵', role: '干事', joinDate: '2024-10-15' },
  { id: uuidv4(), name: '刘雨欣', role: '普通成员', joinDate: '2025-03-01', phone: '13600136000' },
  { id: uuidv4(), name: '赵俊杰', role: '普通成员', joinDate: '2025-03-08' },
];

const now = Date.now();
const initialActivities: Activity[] = [
  {
    id: uuidv4(),
    name: '春季校园摄影展',
    startTime: '2025-04-15T14:00:00',
    endTime: '2025-04-15T18:00:00',
    location: '图书馆一楼展厅',
    maxParticipants: 50,
    description: '记录春日校园的美好瞬间，展出社团成员优秀摄影作品，现场有互动投票环节。',
    participantIds: initialMembers.slice(0, 3).map(m => m.id),
  },
  {
    id: uuidv4(),
    name: '编程技术分享会',
    startTime: '2025-04-20T19:00:00',
    endTime: '2025-04-20T21:00:00',
    location: '教学楼A301',
    maxParticipants: 80,
    description: '邀请学长分享前端开发实战经验，包含React、TypeScript等热门技术栈，欢迎感兴趣的同学参加。',
    participantIds: initialMembers.slice(0, 5).map(m => m.id),
  },
];

const initialAnnouncements: Announcement[] = [
  {
    id: uuidv4(),
    title: '【重要】社团纳新截止通知',
    content: '本学期社团纳新将于4月20日截止，请有意加入的同学尽快在线提交申请，已提交申请的同学请关注短信通知。',
    createdAt: now - 180 * 1000,
    isUrgent: true,
  },
  {
    id: uuidv4(),
    title: '4月例会时间调整',
    content: '原定于4月17日的社团例会改为4月18日晚19:00，地点不变（教学楼B203），请各位成员准时参加。',
    createdAt: now - 3 * 60 * 60 * 1000,
    isUrgent: false,
  },
  {
    id: uuidv4(),
    title: '摄影展作品征集',
    content: '春季校园摄影展作品征集进行中，每人最多提交3幅作品，截止日期4月10日，请发送至社团邮箱。',
    createdAt: now - 8 * 24 * 60 * 60 * 1000,
    isUrgent: false,
  },
];

export const useStore = create<StoreState>((set) => ({
  members: initialMembers,
  activities: initialActivities,
  announcements: initialAnnouncements,

  addMember: (m) => set((s) => ({ members: [...s.members, { ...m, id: uuidv4() }] })),
  updateMember: (id, m) => set((s) => ({
    members: s.members.map(x => x.id === id ? { ...x, ...m } : x)
  })),
  deleteMember: (id) => set((s) => ({ members: s.members.filter(x => x.id !== id) })),

  addActivity: (a) => set((s) => ({
    activities: [...s.activities, { ...a, id: uuidv4(), participantIds: [] }]
  })),
  signUpActivity: (activityId, memberId) => set((s) => ({
    activities: s.activities.map(a => {
      if (a.id !== activityId) return a;
      if (a.participantIds.includes(memberId)) return a;
      if (a.participantIds.length >= a.maxParticipants) return a;
      return { ...a, participantIds: [...a.participantIds, memberId] };
    })
  })),

  addAnnouncement: (a) => set((s) => ({
    announcements: [{ ...a, id: uuidv4(), createdAt: Date.now() }, ...s.announcements]
  })),
}));

export const ROLE_COLORS: Record<MemberRole, string> = {
  '社长': '#ef4444',
  '副社长': '#f97316',
  '干事': '#3b82f6',
  '普通成员': '#94a3b8',
};

export const AVATAR_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f97316',
  '#8b5cf6', '#ec4899', '#14b8a6', '#eab308',
  '#6366f1', '#f43f5e',
];

export function getAvatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function validatePhone(phone: string): boolean {
  if (!phone) return true;
  return /^1[3-9]\d{9}$/.test(phone);
}

export function validateName(name: string): boolean {
  return /^[\u4e00-\u9fa5]{2,10}$/.test(name);
}
