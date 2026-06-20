import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { db } from '@/utils/db'
import type { Project, Comment, Like } from '@/shared/types'
import { useAuthStore } from '@/modules/auth/store'

interface ProjectState {
  projects: Project[]
  likes: Record<string, string[]>
  comments: Record<string, Comment[]>
  loading: boolean
  init: () => Promise<void>
  addProject: (data: Omit<Project, 'id' | 'createdAt' | 'author'>) => Promise<Project>
  updateProject: (id: string, data: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  getProject: (id: string) => Project | undefined
  getLikeCount: (projectId: string) => number
  isLiked: (projectId: string) => boolean
  toggleLike: (projectId: string) => Promise<boolean>
  getComments: (projectId: string) => Comment[]
  addComment: (projectId: string, content: string) => Promise<Comment>
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  likes: {},
  comments: {},
  loading: false,

  init: async () => {
    set({ loading: true })
    try {
      const projects = await db.getProjects()
      const likesMap: Record<string, string[]> = {}
      const commentsMap: Record<string, Comment[]> = {}

      for (const p of projects) {
        const likes = await db.getLikesByProject(p.id)
        likesMap[p.id] = likes.map(l => l.userId)
        const comments = await db.getCommentsByProject(p.id)
        commentsMap[p.id] = comments.sort((a, b) => b.createdAt - a.createdAt)
      }

      set({
        projects: projects.sort((a, b) => b.createdAt - a.createdAt),
        likes: likesMap,
        comments: commentsMap,
        loading: false,
      })
    } catch (error) {
      console.error('Failed to init project store:', error)
      set({ loading: false })
    }
  },

  addProject: async (data) => {
    const currentUser = useAuthStore.getState().user
    const project: Project = {
      ...data,
      id: uuidv4(),
      author: currentUser.name,
      createdAt: Date.now(),
    }
    await db.saveProject(project)
    set(state => ({
      projects: [project, ...state.projects],
      likes: { ...state.likes, [project.id]: [] },
      comments: { ...state.comments, [project.id]: [] },
    }))
    return project
  },

  updateProject: async (id, data) => {
    const current = get().projects.find(p => p.id === id)
    if (!current) return
    const updated = { ...current, ...data }
    await db.saveProject(updated)
    set(state => ({
      projects: state.projects.map(p => (p.id === id ? updated : p)),
    }))
  },

  deleteProject: async (id) => {
    await db.deleteProject(id)
    set(state => {
      const { [id]: _, ...restLikes } = state.likes
      const { [id]: __, ...restComments } = state.comments
      return {
        projects: state.projects.filter(p => p.id !== id),
        likes: restLikes,
        comments: restComments,
      }
    })
  },

  getProject: (id) => get().projects.find(p => p.id === id),

  getLikeCount: (projectId) => get().likes[projectId]?.length ?? 0,

  isLiked: (projectId) => {
    const currentUserId = useAuthStore.getState().user.id
    return (get().likes[projectId] ?? []).includes(currentUserId)
  },

  toggleLike: async (projectId) => {
    const currentUserId = useAuthStore.getState().user.id
    const currentLikes = get().likes[projectId] ?? []
    const isCurrentlyLiked = currentLikes.includes(currentUserId)

    if (isCurrentlyLiked) {
      await db.deleteLike(projectId, currentUserId)
      set(state => ({
        likes: {
          ...state.likes,
          [projectId]: state.likes[projectId].filter(id => id !== currentUserId),
        },
      }))
      return false
    } else {
      const like: Like = { projectId, userId: currentUserId }
      await db.saveLike(like)
      set(state => ({
        likes: {
          ...state.likes,
          [projectId]: [...(state.likes[projectId] ?? []), currentUserId],
        },
      }))
      return true
    }
  },

  getComments: (projectId) => get().comments[projectId] ?? [],

  addComment: async (projectId, content) => {
    const currentUser = useAuthStore.getState().user
    const comment: Comment = {
      id: uuidv4(),
      projectId,
      user: currentUser.name,
      content,
      createdAt: Date.now(),
    }
    await db.saveComment(comment)
    set(state => ({
      comments: {
        ...state.comments,
        [projectId]: [comment, ...(state.comments[projectId] ?? [])],
      },
    }))
    return comment
  },
}))
