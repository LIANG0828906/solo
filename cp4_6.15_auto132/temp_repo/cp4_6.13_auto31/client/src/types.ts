export interface Exhibition {
  id: string
  name: string
  theme: string
  description: string
  created_at?: string
}

export interface Exhibit {
  id: string
  exhibition_id: string
  title: string
  description: string
  image_data: string
  grid_x: number
  grid_y: number
  wall_side: 'north' | 'south' | 'east' | 'west'
  created_at?: string
}

export interface Danmaku {
  id: string
  exhibit_id: string
  content: string
  user_name: string
  color: string
  likes: number
  is_visible: number
  is_reported: number
  created_at: string
}

export interface ExhibitionDetail extends Exhibition {
  exhibits: Exhibit[]
}
