export interface User {
  id: string
  email: string
  name: string
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
  setSnapshots: (snapshots: Snapshot[]) => void
  rollbackToSnapshot: (index: number) => void
  setFading: (fading: boolean) => void
}
