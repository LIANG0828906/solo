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
  highlightedUserIds: string[];

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
  setHighlightedUserIds: (ids: string[]) => void;
  calculateMatchScore: (userId: string) => number;
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
    highlightedUserIds: [] as string[],
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

      setHighlightedUserIds: (ids) => set({ highlightedUserIds: ids }),

      getUserById: (userId) => get().users.find((u) => u.id === userId),

      calculateMatchScore: (userId) => {
        const state = get();
        const currentUser = state.currentUser;
        const targetUser = state.getUserById(userId);
        if (!targetUser || targetUser.id === currentUser.id) return 0;

        const currentSkills = state.skills.filter((s) => s.userId === currentUser.id);
        const targetSkills = state.skills.filter((s) => s.userId === userId);

        const currentAllTags = new Set(
          currentSkills.flatMap((s) => [...s.tags, s.category])
        );
        const targetAllTags = new Set(
          targetSkills.flatMap((s) => [...s.tags, s.category])
        );

        let score = 0;

        let complementaryCount = 0;
        currentAllTags.forEach((tag) => {
          if (!targetAllTags.has(tag)) {
            targetAllTags.forEach((t) => {
              if (!currentAllTags.has(t)) {
                complementaryCount++;
              }
            });
          }
        });
        complementaryCount = Math.min(
          [...currentAllTags].filter((t) => !targetAllTags.has(t)).length,
          [...targetAllTags].filter((t) => !currentAllTags.has(t)).length
        );
        score += complementaryCount * 15;

        let sameCount = 0;
        currentAllTags.forEach((tag) => {
          if (targetAllTags.has(tag)) sameCount++;
        });
        score += sameCount * 5;

        const radarDims: RadarDimension[] = [
          'frontend',
          'backend',
          'design',
          'dataAnalysis',
          'softSkills',
        ];
        radarDims.forEach((dim) => {
          const diff = Math.abs(
            currentUser.radarScores[dim] - targetUser.radarScores[dim]
          );
          if (diff < 10) score += 10;
        });

        return Math.min(100, score);
      },
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

export const useMatchedUsersForSkill = (skillTagOrTitle: string) =>
  useStore((state) => {
    const query = skillTagOrTitle.toLowerCase();
    const skillMatches = state.skills.filter(
      (s) =>
        s.userId !== state.currentUser.id &&
        (s.title.toLowerCase().includes(query) ||
          s.tags.some((t) => t.toLowerCase().includes(query)) ||
          s.category.toLowerCase().includes(query))
    );

    const userMap = new Map<string, { user: User; score: number }>();
    skillMatches.forEach((skill) => {
      if (!userMap.has(skill.userId)) {
        const user = state.getUserById(skill.userId);
        if (user) {
          userMap.set(skill.userId, {
            user,
            score: state.calculateMatchScore(skill.userId),
          });
        }
      }
    });

    return Array.from(userMap.values())
      .sort((a, b) => b.score - a.score)
      .map((item) => item.user.id);
  });

export const useMatchScore = (userId: string) =>
  useStore((state) => state.calculateMatchScore(userId));

export function getMatchBadgeColor(score: number): string {
  if (score >= 80) return '#22C55E';
  if (score >= 60) return '#3B82F6';
  if (score >= 40) return '#F97316';
  return '#9CA3AF';
}

export type { RadarDimension };
