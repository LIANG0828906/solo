import { create } from 'zustand'
import { useSkillStore } from './useSkillStore'

export { useSkillStore, default } from './useSkillStore'
export type {
  SkillDomain,
  SkillNode,
  LearningResource,
  JobRequirement,
  StageStatus,
  PathStage,
  PlanRequest,
  PlanResponse,
  DomainColors,
  UIState,
  SkillGraphNode,
  SkillGraphLink,
  ThemeColors,
  ApiResponse,
  ResourceType,
  TimelineItem,
  SearchResult,
} from '../types'

export type ResourceTypeCompat = 'video' | 'article' | 'book' | 'course' | 'podcast'

export type LearningStatus = 'not_started' | 'in_progress' | 'completed'

export interface Resource {
  id: string
  name: string
  type: ResourceTypeCompat
  duration: string
  difficulty: number
  rating: number
  summary: string
  isFavorite: boolean
}

export interface Skill {
  id: string
  name: string
  proficiency: number
  resources: Resource[]
}

export interface TimelineItemCompat {
  id: string
  skillName: string
  estimatedDuration: string
  resourceId: string
  status: LearningStatus
}

interface AppState {
  searchQuery: string
  skills: Skill[]
  timelineItems: TimelineItemCompat[]
  setSearchQuery: (query: string) => void
  updateProficiency: (skillId: string, proficiency: number) => void
  toggleFavorite: (resourceId: string) => void
  updateLearningStatus: (timelineId: string, status: LearningStatus) => void
}

const convertStatusToCompat = (status: string): LearningStatus => {
  return (status.replace(/-/g, '_') as LearningStatus) || 'not_started'
}

const convertStatusFromCompat = (status: LearningStatus): import('../types').StageStatus => {
  return status.replace(/_/g, '-') as import('../types').StageStatus
}

export const useAppStore = create<AppState>((set) => {
  const syncWithSkillStore = () => {
    const skillState = useSkillStore.getState()
    set({
      searchQuery: skillState.searchQuery,
      skills: skillState.skills.map((skill) => ({
        ...skill,
        resources: [],
      })),
      timelineItems: skillState.learningPath.map((stage) => ({
        id: stage.id,
        skillName: stage.skillName,
        estimatedDuration: `${stage.estimatedDuration}小时`,
        resourceId: stage.resources[0]?.id || '',
        status: convertStatusToCompat(stage.status),
      })),
    })
  }

  useSkillStore.subscribe(syncWithSkillStore)

  return {
    searchQuery: '',
    skills: [],
    timelineItems: [],

    setSearchQuery: (query: string) => {
      useSkillStore.getState().setSearchQuery(query)
      set({ searchQuery: query })
    },

    updateProficiency: (skillId: string, proficiency: number) => {
      useSkillStore.getState().updateProficiency(skillId, proficiency)
      set((state) => ({
        skills: state.skills.map((skill) =>
          skill.id === skillId ? { ...skill, proficiency } : skill
        ),
      }))
    },

    toggleFavorite: (resourceId: string) => {
      useSkillStore.getState().toggleFavorite(resourceId)
    },

    updateLearningStatus: (timelineId: string, status: LearningStatus) => {
      const convertedStatus = convertStatusFromCompat(status)
      useSkillStore.getState().updateStageStatus(timelineId, convertedStatus)
      set((state) => ({
        timelineItems: state.timelineItems.map((item) =>
          item.id === timelineId ? { ...item, status } : item
        ),
      }))
    },
  }
})
