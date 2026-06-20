import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { format } from 'date-fns'

export type TrackStatus = '待录制' | '已录制' | '混音中' | '已定稿'

export interface Project {
  id: string
  name: string
  client: string
  genres: string[]
  bpmMin: number
  bpmMax: number
  ownerId: string
  createdAt: string
}

export interface Track {
  id: string
  projectId: string
  name: string
  description: string
  status: TrackStatus
  collaboratorIds: string[]
  createdAt: string
}

export interface Version {
  id: string
  trackId: string
  versionNumber: string
  uploaderId: string
  uploaderName: string
  uploadTime: string
  note: string
  audioUrl: string
  fileSize: number
}

export interface Comment {
  id: string
  versionId: string
  authorId: string
  authorName: string
  avatarColor: string
  content: string
  emoji: string
  createdAt: string
}

export interface Collaborator {
  id: string
  name: string
  avatarColor: string
}

export interface Notification {
  id: string
  message: string
  createdAt: string
}

const AVATAR_COLORS = ['#6366F1', '#8B5CF6', '#EC4899']

const GENRES = ['流行', '爵士', '电子', '古典', '民谣', 'R&B']

function randomAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
}

const now = new Date()
const fmt = (d: Date) => format(d, 'yyyy-MM-dd HH:mm')

const demoCollaborators: Collaborator[] = [
  { id: 'col-1', name: '张磊', avatarColor: '#6366F1' },
  { id: 'col-2', name: '李薇', avatarColor: '#8B5CF6' },
  { id: 'col-3', name: '王浩', avatarColor: '#EC4899' },
]

const demoProjects: Project[] = [
  {
    id: 'proj-1',
    name: '午夜蓝调 EP',
    client: '蓝调唱片',
    genres: ['爵士', '民谣'],
    bpmMin: 80,
    bpmMax: 120,
    ownerId: 'user-1',
    createdAt: fmt(new Date(now.getTime() - 86400000 * 7)),
  },
  {
    id: 'proj-2',
    name: '电子脉冲 LP',
    client: '数字浪潮工作室',
    genres: ['电子', 'R&B'],
    bpmMin: 120,
    bpmMax: 160,
    ownerId: 'user-1',
    createdAt: fmt(new Date(now.getTime() - 86400000 * 3)),
  },
  {
    id: 'proj-3',
    name: '月光奏鸣曲 Remaster',
    client: '古典之声',
    genres: ['古典'],
    bpmMin: 60,
    bpmMax: 90,
    ownerId: 'user-1',
    createdAt: fmt(new Date(now.getTime() - 86400000)),
  },
]

const demoTracks: Record<string, Track[]> = {
  'proj-1': [
    { id: 'track-1', projectId: 'proj-1', name: '午夜漫步', description: '主旋律轨道，爵士风格', status: '混音中', collaboratorIds: ['col-1', 'col-2'], createdAt: fmt(new Date(now.getTime() - 86400000 * 6)) },
    { id: 'track-2', projectId: 'proj-1', name: '蓝调即兴', description: '萨克斯独奏部分', status: '已录制', collaboratorIds: ['col-1'], createdAt: fmt(new Date(now.getTime() - 86400000 * 5)) },
    { id: 'track-3', projectId: 'proj-1', name: '节奏基底', description: '鼓组和贝斯', status: '已定稿', collaboratorIds: ['col-3'], createdAt: fmt(new Date(now.getTime() - 86400000 * 4)) },
  ],
  'proj-2': [
    { id: 'track-4', projectId: 'proj-2', name: '脉冲序曲', description: '电子合成器主轨', status: '混音中', collaboratorIds: ['col-2'], createdAt: fmt(new Date(now.getTime() - 86400000 * 2)) },
    { id: 'track-5', projectId: 'proj-2', name: '低频震动', description: '808贝斯线', status: '待录制', collaboratorIds: [], createdAt: fmt(new Date(now.getTime() - 86400000)) },
  ],
  'proj-3': [
    { id: 'track-6', projectId: 'proj-3', name: '第一乐章', description: '钢琴独奏', status: '已定稿', collaboratorIds: ['col-1', 'col-3'], createdAt: fmt(new Date(now.getTime() - 86400000 * 1)) },
  ],
}

const demoVersions: Record<string, Version[]> = {
  'track-1': [
    { id: 'ver-1', trackId: 'track-1', versionNumber: 'v1.0', uploaderId: 'col-1', uploaderName: '张磊', uploadTime: fmt(new Date(now.getTime() - 86400000 * 5)), note: '初始录制完成，基础节奏已确立', audioUrl: '', fileSize: 8.2 },
    { id: 'ver-2', trackId: 'track-1', versionNumber: 'v1.1', uploaderId: 'col-2', uploaderName: '李薇', uploadTime: fmt(new Date(now.getTime() - 86400000 * 3)), note: '调整了鼓组的EQ，增加了混响空间感', audioUrl: '', fileSize: 8.5 },
    { id: 'ver-3', trackId: 'track-1', versionNumber: 'v1.2', uploaderId: 'col-1', uploaderName: '张磊', uploadTime: fmt(new Date(now.getTime() - 86400000 * 1)), note: '重新录制了萨克斯部分，增加了动态范围', audioUrl: '', fileSize: 9.1 },
  ],
  'track-2': [
    { id: 'ver-4', trackId: 'track-2', versionNumber: 'v1.0', uploaderId: 'col-1', uploaderName: '张磊', uploadTime: fmt(new Date(now.getTime() - 86400000 * 4)), note: '萨克斯独奏初版', audioUrl: '', fileSize: 6.3 },
  ],
  'track-3': [
    { id: 'ver-5', trackId: 'track-3', versionNumber: 'v1.0', uploaderId: 'col-3', uploaderName: '王浩', uploadTime: fmt(new Date(now.getTime() - 86400000 * 3)), note: '鼓组和贝斯录制完成', audioUrl: '', fileSize: 7.8 },
    { id: 'ver-6', trackId: 'track-3', versionNumber: 'v1.1', uploaderId: 'col-3', uploaderName: '王浩', uploadTime: fmt(new Date(now.getTime() - 86400000 * 1)), note: '贝斯EQ微调，低频更饱满', audioUrl: '', fileSize: 7.9 },
  ],
  'track-4': [
    { id: 'ver-7', trackId: 'track-4', versionNumber: 'v1.0', uploaderId: 'col-2', uploaderName: '李薇', uploadTime: fmt(new Date(now.getTime() - 86400000 * 1)), note: '合成器主轨初版', audioUrl: '', fileSize: 10.5 },
  ],
  'track-6': [
    { id: 'ver-8', trackId: 'track-6', versionNumber: 'v1.0', uploaderId: 'col-1', uploaderName: '张磊', uploadTime: fmt(new Date(now.getTime() - 86400000 * 1)), note: '钢琴独奏录制完成', audioUrl: '', fileSize: 12.1 },
    { id: 'ver-9', trackId: 'track-6', versionNumber: 'v1.1', uploaderId: 'col-3', uploaderName: '王浩', uploadTime: fmt(new Date(now.getTime() - 3600000 * 12)), note: 'Remaster处理，动态范围优化', audioUrl: '', fileSize: 12.4 },
  ],
}

const demoComments: Record<string, Comment[]> = {
  'ver-2': [
    { id: 'cmt-1', versionId: 'ver-2', authorId: 'col-1', authorName: '张磊', avatarColor: '#6366F1', content: '鼓组的低频需要再压一下', emoji: '🔧', createdAt: fmt(new Date(now.getTime() - 86400000 * 2)) },
    { id: 'cmt-2', versionId: 'ver-2', authorId: 'col-2', authorName: '李薇', avatarColor: '#8B5CF6', content: '混响感觉不错👍', emoji: '👍', createdAt: fmt(new Date(now.getTime() - 86400000 * 2 + 3600000)) },
  ],
  'ver-3': [
    { id: 'cmt-3', versionId: 'ver-3', authorId: 'col-3', authorName: '王浩', avatarColor: '#EC4899', content: '萨克斯的动态很棒，但中高频有点刺', emoji: '💡', createdAt: fmt(new Date(now.getTime() - 86400000)) },
  ],
  'ver-9': [
    { id: 'cmt-4', versionId: 'ver-9', authorId: 'col-1', authorName: '张磊', avatarColor: '#6366F1', content: 'Remaster效果很好，可以定稿了', emoji: '❤️', createdAt: fmt(new Date(now.getTime() - 3600000 * 6)) },
  ],
}

export interface ProjectState {
  projects: Project[]
  tracks: Record<string, Track[]>
  versions: Record<string, Version[]>
  comments: Record<string, Comment[]>
  collaborators: Collaborator[]
  selectedProjectId: string | null
  selectedTrackId: string | null
  notifications: Notification[]
  isLoading: boolean

  addProject: (data: Omit<Project, 'id' | 'createdAt'>) => void
  addTrack: (projectId: string, data: { name: string; description: string; status: TrackStatus }) => void
  addVersion: (trackId: string, data: { note: string; uploaderId: string; uploaderName: string }) => void
  addComment: (versionId: string, data: { authorId: string; authorName: string; avatarColor: string; content: string; emoji: string }) => void
  deleteComment: (commentId: string, versionId: string) => void
  selectProject: (id: string | null) => void
  selectTrack: (id: string | null) => void
  assignCollaborators: (trackId: string, collaboratorIds: string[]) => void
  markTrackComplete: (trackId: string) => void
  addCollaborator: (name: string) => Collaborator
  addNotification: (message: string) => void
  removeNotification: (id: string) => void
  setIsLoading: (loading: boolean) => void
  getProjectTracks: (projectId: string) => Track[]
  getTrackVersions: (trackId: string) => Version[]
  getVersionComments: (versionId: string) => Comment[]
  getProjectProgress: (projectId: string) => number
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: demoProjects,
  tracks: demoTracks,
  versions: demoVersions,
  comments: demoComments,
  collaborators: demoCollaborators,
  selectedProjectId: null,
  selectedTrackId: null,
  notifications: [],
  isLoading: false,

  addProject: (data) => {
    const project: Project = {
      ...data,
      id: uuidv4(),
      createdAt: fmt(new Date()),
    }
    set((state) => ({
      projects: [...state.projects, project],
      tracks: { ...state.tracks, [project.id]: [] },
    }))
  },

  addTrack: (projectId, data) => {
    const track: Track = {
      ...data,
      id: uuidv4(),
      projectId,
      collaboratorIds: [],
      createdAt: fmt(new Date()),
    }
    set((state) => ({
      tracks: {
        ...state.tracks,
        [projectId]: [...(state.tracks[projectId] || []), track],
      },
      versions: { ...state.versions, [track.id]: [] },
    }))
  },

  addVersion: (trackId, data) => {
    const existingVersions = get().versions[trackId] || []
    const majorNum = existingVersions.length > 0
      ? parseInt(existingVersions[existingVersions.length - 1].versionNumber.split('.')[0].replace('v', ''))
      : 1
    const minorNum = existingVersions.length > 0
      ? parseInt(existingVersions[existingVersions.length - 1].versionNumber.split('.')[1]) + 1
      : 0
    const versionNumber = `v${majorNum}.${minorNum}`

    const version: Version = {
      id: uuidv4(),
      trackId,
      versionNumber,
      uploaderId: data.uploaderId,
      uploaderName: data.uploaderName,
      uploadTime: fmt(new Date()),
      note: data.note,
      audioUrl: '',
      fileSize: parseFloat((5 + Math.random() * 10).toFixed(1)),
    }
    set((state) => ({
      versions: {
        ...state.versions,
        [trackId]: [...(state.versions[trackId] || []), version],
      },
      comments: { ...state.comments, [version.id]: [] },
    }))
  },

  addComment: (versionId, data) => {
    const comment: Comment = {
      ...data,
      id: uuidv4(),
      versionId,
      createdAt: fmt(new Date()),
    }
    set((state) => ({
      comments: {
        ...state.comments,
        [versionId]: [...(state.comments[versionId] || []), comment],
      },
    }))
  },

  deleteComment: (commentId, versionId) => {
    set((state) => ({
      comments: {
        ...state.comments,
        [versionId]: (state.comments[versionId] || []).filter((c) => c.id !== commentId),
      },
    }))
  },

  selectProject: (id) => set({ selectedProjectId: id }),

  selectTrack: (id) => set({ selectedTrackId: id }),

  assignCollaborators: (trackId, collaboratorIds) => {
    set((state) => {
      const newTracks = { ...state.tracks }
      for (const projectId of Object.keys(newTracks)) {
        newTracks[projectId] = newTracks[projectId].map((t) =>
          t.id === trackId ? { ...t, collaboratorIds } : t
        )
      }
      return { tracks: newTracks }
    })
    const collabs = get().collaborators.filter((c) => collaboratorIds.includes(c.id))
    collabs.forEach((c) => {
      get().addNotification(`已将曲目指派给 ${c.name}`)
    })
  },

  markTrackComplete: (trackId) => {
    set((state) => {
      const newTracks = { ...state.tracks }
      for (const projectId of Object.keys(newTracks)) {
        newTracks[projectId] = newTracks[projectId].map((t) =>
          t.id === trackId ? { ...t, status: '已定稿' as TrackStatus } : t
        )
      }
      return { tracks: newTracks }
    })
    get().addNotification('曲目已标记为定稿')
  },

  addCollaborator: (name) => {
    const collab: Collaborator = {
      id: uuidv4(),
      name,
      avatarColor: randomAvatarColor(),
    }
    set((state) => ({
      collaborators: [...state.collaborators, collab],
    }))
    return collab
  },

  addNotification: (message) => {
    const notification: Notification = {
      id: uuidv4(),
      message,
      createdAt: fmt(new Date()),
    }
    set((state) => ({
      notifications: [...state.notifications, notification],
    }))
    setTimeout(() => {
      get().removeNotification(notification.id)
    }, 5000)
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }))
  },

  setIsLoading: (loading) => set({ isLoading: loading }),

  getProjectTracks: (projectId) => get().tracks[projectId] || [],

  getTrackVersions: (trackId) => get().versions[trackId] || [],

  getVersionComments: (versionId) => get().comments[versionId] || [],

  getProjectProgress: (projectId) => {
    const tracks = get().tracks[projectId] || []
    if (tracks.length === 0) return 0
    const finalized = tracks.filter((t) => t.status === '已定稿').length
    return Math.round((finalized / tracks.length) * 100)
  },
}))
