import { create } from 'zustand'

export interface Participant {
  id: string
  name: string
}

export interface Message {
  id?: string
  sender: string
  text: string
  time: string
}

export interface TeamGroup {
  members: Participant[]
  messages: Message[]
}

export interface ActivityState {
  activityId: string | null
  activityName: string
  participants: Participant[]
  groups: Record<number, TeamGroup>
  isGrouping: boolean
  strategy: 'balanced' | 'random'
  setActivity: (activityId: string, activityName?: string, strategy?: 'balanced' | 'random') => void
  setParticipants: (participants: Participant[]) => void
  setGroups: (groups: Record<number, TeamGroup>) => void
  addMessage: (teamId: number, message: Message) => void
  moveMember: (memberId: string, fromTeamId: number | null, toTeamId: number) => void
  setIsGrouping: (val: boolean) => void
  reset: () => void
}

export const useActivityStore = create<ActivityState>((set) => ({
  activityId: null,
  activityName: '',
  participants: [],
  groups: {},
  isGrouping: false,
  strategy: 'balanced',

  setActivity: (activityId, activityName, strategy) =>
    set({
      activityId,
      activityName: activityName ?? '',
      strategy: strategy ?? 'balanced',
    }),

  setParticipants: (participants) => set({ participants }),

  setGroups: (groups) => set({ groups, isGrouping: false }),

  addMessage: (teamId, message) =>
    set((state) => ({
      groups: {
        ...state.groups,
        [teamId]: {
          ...state.groups[teamId],
          messages: [...(state.groups[teamId]?.messages ?? []), message],
        },
      },
    })),

  moveMember: (memberId, fromTeamId, toTeamId) =>
    set((state) => {
      const newGroups: Record<number, TeamGroup> = { ...state.groups }
      let member: Participant | undefined

      if (fromTeamId !== null && newGroups[fromTeamId]) {
        member = newGroups[fromTeamId].members.find((m) => m.id === memberId)
        newGroups[fromTeamId] = {
          ...newGroups[fromTeamId],
          members: newGroups[fromTeamId].members.filter((m) => m.id !== memberId),
        }
      }

      if (!member) {
        member = state.participants.find((p) => p.id === memberId)
      }

      if (member) {
        if (!newGroups[toTeamId]) {
          newGroups[toTeamId] = { members: [], messages: [] }
        }
        newGroups[toTeamId] = {
          ...newGroups[toTeamId],
          members: [...newGroups[toTeamId].members, member],
        }
      }

      return { groups: newGroups }
    }),

  setIsGrouping: (val) => set({ isGrouping: val }),

  reset: () =>
    set({
      activityId: null,
      activityName: '',
      participants: [],
      groups: {},
      isGrouping: false,
      strategy: 'balanced',
    }),
}))
