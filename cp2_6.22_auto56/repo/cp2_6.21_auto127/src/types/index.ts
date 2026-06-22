export interface User {
  id: string
  email: string
  name: string
}

export const ANNOTATION_COLORS = {
  RED: { value: '#ff6b6b', name: '红色' },
  YELLOW: { value: '#ffd93d', name: '黄色' },
  GREEN: { value: '#6bcb77', name: '绿色' },
  BLUE: { value: '#4d96ff', name: '蓝色' },
} as const

export type AnnotationColorKey = keyof typeof ANNOTATION_COLORS

export const VALID_COLOR_VALUES: readonly string[] = Object.values(ANNOTATION_COLORS).map(
  (c) => c.value
)

export const DEFAULT_COLOR = ANNOTATION_COLORS.RED.value

export function isValidColor(color: string): boolean {
  return VALID_COLOR_VALUES.includes(color)
}

export function getColorName(color: string): string {
  for (const entry of Object.values(ANNOTATION_COLORS)) {
    if (entry.value === color) return entry.name
  }
  return '未知'
}

export function sanitizeAnnotationColor(color: string): string {
  return isValidColor(color) ? color : DEFAULT_COLOR
}

export interface Annotation {
  id: string
  userId: string
  userName: string
  paragraphIndex: number
  color: string
  text: string
  createdAt: string
}

export interface Snapshot {
  id: string
  createdAt: string
  version: number
}

export interface Document {
  id: string
  content: string
  paragraphs: string[]
}

export interface DocState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  documentId: string | null
  content: string
  paragraphs: string[]
  annotations: Annotation[]
  snapshots: Snapshot[]
  currentSnapshotIndex: number
  isFading: boolean

  setUser: (user: User, token: string) => void
  logout: () => void
  setDocument: (doc: Document) => void
  addAnnotation: (annotation: Annotation) => void
  updateAnnotations: (annotations: Annotation[]) => void
  deleteAnnotation: (annotationId: string) => void
  clearParagraphAnnotations: (paragraphIndex: number) => void
  restoreAnnotations: (annotations: Annotation[]) => void
  setSnapshots: (snapshots: Snapshot[]) => void
  rollbackToSnapshot: (index: number) => void
  setFading: (fading: boolean) => void
}
