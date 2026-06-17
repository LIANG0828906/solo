import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { User, Skill, Message, Invite, ExchangeRecord, RadarDimension } from '@/types';
import { generateMockData } from '@/utils/mockData';

interface AppState {
  currentUser: User;
  users: User[];
  skills: Skill[];
  messages: Message[];
  invites: Invite[];
  exchangeRecords: ExchangeRecord[];
  darkMode: boolean;
  selectedTags: string[];
  searchQuery: string;

  setDarkMode: (value: boolean) => void;
  addSkill: (skill: Omit<Skill, 'id' | 'createdAt'>) => void;
  updateSkill: (id: string, updates: Partial<Skill>) => void;
  removeSkill: (id: string) => void;
  sendInvite: (invite: Omit<Invite, 'id' | 'status' | 'createdAt'>) => void;
  acceptInvite: (inviteId: string) => void;
  rejectInvite: (inviteId: string) => void;
  markMessageRead: (messageId: string) => void;
  markAllMessagesRead: () => void;
  updateRadarScores: (scores: Partial<User['radarScores']>) => void;
  setSelectedTags: (tags: string[]) => void;
  setSearchQuery: (query: string) => void;
  getUserById: (userId: string) => User | undefined;
}

const getInitialState = () => {
  const currentUserId = uuidv4();
  const mockData = generateMockData(currentUserId);
  
  return {
    currentUser: mockData.users[0],
    users: mockData.users,
    skills: mockData.skills,
    messages: mockData.messages,
    invites: mockData.invites,
    exchangeRecords: mockData.exchangeRecords,
    darkMode: false,
    selectedTags: [] as string[],
    searchQuery: '',
  };
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...getInitialState(),

      setDarkMode: (value: boolean) => set({ darkMode: value }),

      addSkill: (skill) => set((state) => ({
        skills: [{
          ...skill,
          id: uuidv4(),
          createdAt: Date.now(),
        }, ...state.skills],
      })),

      updateSkill: (id, updates) => set((state) => ({
        skills: state.skills.map((s) =>
          s.id === id ? { ...s, ...updates } : s
        ),
      })),

      removeSkill: (id) => set((state) => ({
        skills: state.skills.filter((s) => s.id !== id),
      })),

      sendInvite: (invite) => {
        const inviteId = uuidv4();
        const now = Date.now();
        const fromUser = get().getUserById(invite.fromUserId);
        
        set((state) => ({
          invites: [{
            ...invite,
            id: inviteId,
            status: 'pending',
            createdAt: now,
          }, ...state.invites],
          messages: [{
            id: uuidv4(),
            type: 'invite',
            fromUserId: invite.fromUserId,
            toUserId: invite.toUserId,
            title: `${fromUser?.nickname || '用户'} 发起了技能交换邀请`,
            content: `${fromUser?.nickname || '用户'} 希望和你交换 "${invite.skillTitle}"，时间：${invite.expectedTime}。备注：${invite.note}`,
            relatedSkillId: invite.skillId,
            relatedInviteId: inviteId,
            isRead: false,
            createdAt: now,
          }, ...state.messages],
        }));
      },

      acceptInvite: (inviteId) => {
        const invite = get().invites.find((i) => i.id === inviteId);
        if (!invite) return;

        const fromUser = get().getUserById(invite.fromUserId);
        const toUser = get().getUserById(invite.toUserId);
        const now = Date.now();

        set((state) => ({
          invites: state.invites.map((i) =>
            i.id === inviteId ? { ...i, status: 'accepted' } : i
          ),
          messages: [
            {
              id: uuidv4(),
              type: 'accept',
              fromUserId: invite.toUserId,
              toUserId: invite.fromUserId,
              title: `${toUser?.nickname || '用户'} 接受了你的邀请`,
              content: `太好了！${toUser?.nickname || '用户'} 已经接受了你的技能交换邀请"${invite.skillTitle}"，时间：${invite.expectedTime}。`,
              relatedSkillId: invite.skillId,
              relatedInviteId: inviteId,
              isRead: false,
              createdAt: now,
            },
            ...state.messages.map((m) =>
              m.relatedInviteId === inviteId ? { ...m, isRead: true } : m
            ),
          ],
          exchangeRecords: [
            {
              id: uuidv4(),
              fromUserId: invite.fromUserId,
              toUserId: invite.toUserId,
              skillId: invite.skillId,
              skillTitle: invite.skillTitle,
              exchangeTime: invite.expectedTime,
              note: invite.note,
              createdAt: now,
            },
            ...state.exchangeRecords,
          ],
        }));
      },

      rejectInvite: (inviteId) => {
        const invite = get().invites.find((i) => i.id === inviteId);
        if (!invite) return;

        const toUser = get().getUserById(invite.toUserId);
        const now = Date.now();

        set((state) => ({
          invites: state.invites.map((i) =>
            i.id === inviteId ? { ...i, status: 'rejected' } : i
          ),
          messages: [
            {
              id: uuidv4(),
              type: 'reject',
              fromUserId: invite.toUserId,
              toUserId: invite.fromUserId,
              title: `${toUser?.nickname || '用户'} 婉拒了你的邀请`,
              content: `${toUser?.nickname || '用户'} 暂时无法接受你的技能交换邀请"${invite.skillTitle}"，可以尝试其他技能交换。`,
              relatedSkillId: invite.skillId,
              relatedInviteId: inviteId,
              isRead: false,
              createdAt: now,
            },
            ...state.messages.map((m) =>
              m.relatedInviteId === inviteId ? { ...m, isRead: true } : m
            ),
          ],
        }));
      },

      markMessageRead: (messageId) => set((state) => ({
        messages: state.messages.map((m) =>
          m.id === messageId ? { ...m, isRead: true } : m
        ),
      })),

      markAllMessagesRead: () => set((state) => ({
        messages: state.messages.map((m) => ({ ...m, isRead: true })),
      })),

      updateRadarScores: (scores) => set((state) => ({
        currentUser: {
          ...state.currentUser,
          radarScores: {
            ...state.currentUser.radarScores,
            ...scores,
          },
        },
        users: state.users.map((u) =>
          u.id === state.currentUser.id
            ? { ...u, radarScores: { ...u.radarScores, ...scores } }
            : u
        ),
      })),

      setSelectedTags: (tags) => set({ selectedTags: tags }),

      setSearchQuery: (query) => set({ searchQuery: query }),

      getUserById: (userId) => get().users.find((u) => u.id === userId),
    }),
    {
      name: 'skillswap-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        users: state.users,
        skills: state.skills,
        messages: state.messages,
        invites: state.invites,
        exchangeRecords: state.exchangeRecords,
        darkMode: state.darkMode,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && !state.users.length) {
          const initial = getInitialState();
          Object.assign(state, initial);
        }
      },
    }
  )
);

export const useUnreadCount = () =>
  useStore((state) => state.messages.filter((m) => !m.isRead).length);

export const useFilteredSkills = () =>
  useStore((state) => {
    const { skills, selectedTags, searchQuery, currentUser } = state;
    return skills.filter((skill) => {
      if (skill.userId === currentUser.id) return false;
      if (selectedTags.length > 0) {
        const hasMatch = skill.tags.some((tag) =>
          selectedTags.includes(tag) || selectedTags.includes(skill.category)
        );
        if (!hasMatch) return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const user = state.getUserById(skill.userId);
        const matchesTitle = skill.title.toLowerCase().includes(query);
        const matchesTags = skill.tags.some((t) => t.toLowerCase().includes(query));
        const matchesUser = user?.nickname.toLowerCase().includes(query);
        if (!matchesTitle && !matchesTags && !matchesUser) return false;
      }
      return true;
    });
  });

export const useUserSkills = (userId: string) =>
  useStore((state) => state.skills.filter((s) => s.userId === userId));

export const useUserExchangeRecords = (userId: string) =>
  useStore((state) =>
    state.exchangeRecords.filter(
      (r) => r.fromUserId === userId || r.toUserId === userId
    )
  );

export const useRadarScores = (userId: string) => {
  const user = useStore((state) =>
    userId === state.currentUser.id
      ? state.currentUser
      : state.users.find((u) => u.id === userId)
  );
  return user?.radarScores || {
    frontend: 50,
    backend: 50,
    design: 50,
    dataAnalysis: 50,
    softSkills: 50,
  };
};

export type { RadarDimension };
