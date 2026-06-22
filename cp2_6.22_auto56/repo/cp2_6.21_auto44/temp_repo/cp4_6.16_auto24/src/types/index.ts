export interface User {
  id: string
  username: string
  email: string
  password: string
  createdAt: string
}

export interface Artwork {
  id: string
  exhibitionId: string
  title: string
  author: string
  createdAt: string
  description: string
  imageData: string
  position: {
    x: number
    y: number
    scale: number
  }
  wallIndex: number
  likes: number
}

export interface Comment {
  id: string
  artworkId: string
  username: string
  content: string
  createdAt: string
  likes: number
}

export interface Exhibition {
  id: string
  ownerId: string
  ownerName: string
  name: string
  themeColor: string
  colorScheme: ColorScheme
  createdAt: string
  updatedAt: string
}

export interface ColorScheme {
  id: number
  name: string
  primary: string
  secondary: string
  accent: string
  wallColor: string
  floorColor: string
  bgColor: string
}

export const COLOR_SCHEMES: ColorScheme[] = [
  { id: 1, name: '经典简约', primary: '#2D2D2D', secondary: '#4A4A4A', accent: '#6366F1', wallColor: '#F0F0F0', floorColor: '#E0E0E0', bgColor: '#F5F5F5' },
  { id: 2, name: '温暖木调', primary: '#5D4037', secondary: '#8D6E63', accent: '#FF7043', wallColor: '#F5EDE4', floorColor: '#D7C9B8', bgColor: '#FAF6F0' },
  { id: 3, name: '海洋深蓝', primary: '#0D47A1', secondary: '#1976D2', accent: '#00BCD4', wallColor: '#E3F2FD', floorColor: '#BBDEFB', bgColor: '#E8F4FC' },
  { id: 4, name: '森林绿意', primary: '#1B5E20', secondary: '#388E3C', accent: '#66BB6A', wallColor: '#E8F5E9', floorColor: '#C8E6C9', bgColor: '#F1F8E9' },
  { id: 5, name: '优雅紫调', primary: '#4A148C', secondary: '#7B1FA2', accent: '#AB47BC', wallColor: '#F3E5F5', floorColor: '#E1BEE7', bgColor: '#FAF5FC' },
  { id: 6, name: '日落橙红', primary: '#BF360C', secondary: '#E64A19', accent: '#FF5722', wallColor: '#FBE9E7', floorColor: '#FFCCBC', bgColor: '#FFF3E0' },
  { id: 7, name: '纯净粉调', primary: '#880E4F', secondary: '#C2185B', accent: '#EC407A', wallColor: '#FCE4EC', floorColor: '#F8BBD0', bgColor: '#FFF5F8' },
  { id: 8, name: '暗夜黑金', primary: '#212121', secondary: '#424242', accent: '#FFD700', wallColor: '#2C2C2C', floorColor: '#1A1A1A', bgColor: '#121212' },
  { id: 9, name: '柔和青瓷', primary: '#006064', secondary: '#00838F', accent: '#26C6DA', wallColor: '#E0F7FA', floorColor: '#B2EBF2', bgColor: '#E0F7FA' },
  { id: 10, name: '玫红浪漫', primary: '#AD1457', secondary: '#D81B60', accent: '#F06292', wallColor: '#FCE4EC', floorColor: '#F48FB1', bgColor: '#FFF0F5' },
]
