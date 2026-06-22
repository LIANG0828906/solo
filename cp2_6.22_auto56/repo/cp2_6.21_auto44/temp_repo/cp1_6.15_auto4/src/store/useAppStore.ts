import { create } from 'zustand'
import type { Member, Collaboration, RecommendationResult } from '@/utils/recommendationEngine'
import { calculateRecommendations } from '@/utils/recommendationEngine'
import type { SkillWithPriority } from '@/components/SkillTagInput'

interface AppState {
  members: Member[];
  collaborations: Collaboration[];
  recommendations: RecommendationResult[];
  selectedMember: Member | null;
  projectName: string;
  projectSkills: SkillWithPriority[];
  isLoading: boolean;
  showMemberModal: boolean;
  editingMember: Member | null;
  highlightMemberId: string | null;

  setMembers: (members: Member[]) => void;
  addMember: (member: Member) => void;
  updateMember: (member: Member) => void;
  deleteMember: (id: string) => void;
  setCollaborations: (collaborations: Collaboration[]) => void;
  setProjectName: (name: string) => void;
  setProjectSkills: (skills: SkillWithPriority[]) => void;
  runRecommendation: () => void;
  setSelectedMember: (member: Member | null) => void;
  setShowMemberModal: (show: boolean) => void;
  setEditingMember: (member: Member | null) => void;
  setHighlightMemberId: (id: string | null) => void;
  fetchInitialData: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  members: [],
  collaborations: [],
  recommendations: [],
  selectedMember: null,
  projectName: '',
  projectSkills: [],
  isLoading: false,
  showMemberModal: false,
  editingMember: null,
  highlightMemberId: null,

  setMembers: (members) => set({ members }),

  addMember: async (member) => {
    const res = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member),
    })
    if (!res.ok) throw new Error('Failed to add member')
    set((state) => ({ members: [...state.members, member] }))
  },

  updateMember: async (member) => {
    const res = await fetch(`/api/members/${member.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member),
    })
    if (!res.ok) throw new Error('Failed to update member')
    set((state) => ({
      members: state.members.map((m) => (m.id === member.id ? member : m)),
    }))
  },

  deleteMember: async (id) => {
    const res = await fetch(`/api/members/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete member')
    set((state) => ({
      members: state.members.filter((m) => m.id !== id),
    }))
  },

  setCollaborations: (collaborations) => set({ collaborations }),

  setProjectName: (name) => set({ projectName: name }),

  setProjectSkills: (skills) => set({ projectSkills: skills }),

  runRecommendation: () => {
    const { members, collaborations, projectSkills } = get()
    const requiredSkills = projectSkills.filter(s => s.priority === 'required').map(s => s.name)
    const bonusSkills = projectSkills.filter(s => s.priority === 'bonus').map(s => s.name)
    const recommendations = calculateRecommendations(members, collaborations, requiredSkills, bonusSkills)
    set({ recommendations })
  },

  setSelectedMember: (member) => set({ selectedMember: member }),

  setShowMemberModal: (show) => set({ showMemberModal: show }),

  setEditingMember: (member) => set({ editingMember: member }),

  setHighlightMemberId: (id) => set({ highlightMemberId: id }),

  fetchInitialData: async () => {
    set({ isLoading: true })
    try {
      const [membersRes, collaborationsRes] = await Promise.all([
        fetch('/api/members'),
        fetch('/api/collaborations'),
      ])
      if (!membersRes.ok) throw new Error('Failed to fetch members')
      if (!collaborationsRes.ok) throw new Error('Failed to fetch collaborations')
      const members: Member[] = await membersRes.json()
      const collaborations: Collaboration[] = await collaborationsRes.json()
      set({ members, collaborations })
    } finally {
      set({ isLoading: false })
    }
  },
}))
