export type SoundCategory = 'traffic' | 'nature' | 'crowd' | 'machinery' | 'other'

export interface Sound {
  id: string
  title: string
  fileName: string
  category: SoundCategory
  lat: number
  lng: number
  duration: number
  uploader: string
  uploadTime: string
  description: string
  tags: string[]
  likes: number
  reports: number
  isReported: boolean
}
