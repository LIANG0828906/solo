export enum ArtworkStatus {
  IN_STOCK = 'in_stock',
  LENT_OUT = 'lent_out',
  ON_EXHIBITION = 'on_exhibition',
  DAMAGED = 'damaged'
}

export enum MilestoneType {
  PREPARATION = 'preparation',
  INSTALLATION = 'installation',
  OPENING = 'opening',
  EXHIBITION = 'exhibition',
  TEARDOWN = 'teardown'
}

export enum TransferType {
  LEND = 'lend',
  RETURN = 'return'
}

export interface Task {
  id: string
  title: string
  completed: boolean
  order: number
}

export interface Milestone {
  id: string
  type: MilestoneType
  title: string
  week: number
  tasks: Task[]
}

export interface TransferRecord {
  id: string
  artworkId: string
  type: TransferType
  date: string
  institution?: string
  expectedReturnDate?: string
  notes?: string
  returned?: boolean
}

export interface Artwork {
  id: string
  name: string
  artist: string
  year: number
  material: string
  image?: string
  status: ArtworkStatus
  transferRecords: TransferRecord[]
  createdAt: string
}

export interface Exhibition {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  milestones: Milestone[]
  createdAt: string
}

export interface AppState {
  exhibitions: Exhibition[]
  artworks: Artwork[]
  selectedExhibitionId: string | null
  selectedArtworkId: string | null
}

export interface AppActions {
  addExhibition: (exhibition: Omit<Exhibition, 'id' | 'createdAt'>) => void
  updateExhibition: (id: string, updates: Partial<Exhibition>) => void
  deleteExhibition: (id: string) => void
  selectExhibition: (id: string | null) => void

  addMilestone: (exhibitionId: string, milestone: Omit<Milestone, 'id'>) => void
  updateMilestone: (exhibitionId: string, milestoneId: string, updates: Partial<Milestone>) => void
  deleteMilestone: (exhibitionId: string, milestoneId: string) => void
  reorderMilestones: (exhibitionId: string, milestoneIds: string[]) => void

  addTask: (exhibitionId: string, milestoneId: string, title: string) => void
  toggleTask: (exhibitionId: string, milestoneId: string, taskId: string) => void
  updateTask: (exhibitionId: string, milestoneId: string, taskId: string, updates: Partial<Task>) => void
  deleteTask: (exhibitionId: string, milestoneId: string, taskId: string) => void
  reorderTasks: (exhibitionId: string, milestoneId: string, taskIds: string[]) => void

  addArtwork: (artwork: Omit<Artwork, 'id' | 'createdAt' | 'transferRecords'>) => void
  updateArtwork: (id: string, updates: Partial<Artwork>) => void
  deleteArtwork: (id: string) => void
  selectArtwork: (id: string | null) => void

  lendArtwork: (artworkId: string, record: Omit<TransferRecord, 'id' | 'type' | 'returned' | 'artworkId'>) => void
  returnArtwork: (artworkId: string, transferId: string, notes?: string) => void

  exportData: () => string
}

export type AppStore = AppState & AppActions
