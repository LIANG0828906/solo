import type { EventType, HealthStatus } from '@/types'

export interface EventConfig {
  label: string
  color: string
  gradientFrom: string
  gradientTo: string
}

export const eventConfig: Record<EventType, EventConfig> = {
  sowing: {
    label: '播种',
    color: '#8B7355',
    gradientFrom: '#A0826D',
    gradientTo: '#6B5344'
  },
  germination: {
    label: '发芽',
    color: '#7CB342',
    gradientFrom: '#9CCC65',
    gradientTo: '#558B2F'
  },
  watering: {
    label: '浇水',
    color: '#42A5F5',
    gradientFrom: '#64B5F6',
    gradientTo: '#1E88E5'
  },
  fertilizing: {
    label: '施肥',
    color: '#66BB6A',
    gradientFrom: '#81C784',
    gradientTo: '#43A047'
  },
  pruning: {
    label: '修剪',
    color: '#FFA726',
    gradientFrom: '#FFB74D',
    gradientTo: '#FB8C00'
  },
  harvest: {
    label: '收获',
    color: '#FF7043',
    gradientFrom: '#FF8A65',
    gradientTo: '#F4511E'
  },
  pests: {
    label: '病虫害',
    color: '#EF5350',
    gradientFrom: '#E57373',
    gradientTo: '#E53935'
  }
}

export function getEventHealthStatus(type: EventType): HealthStatus {
  if (type === 'watering' || type === 'fertilizing' || type === 'germination' || type === 'sowing' || type === 'harvest') {
    return 'healthy'
  }
  if (type === 'pests' || type === 'pruning') {
    return 'warning'
  }
  return 'none'
}

export const healthyGradient = 'linear-gradient(135deg, #81C784 0%, #43A047 100%)'
export const warningGradient = 'linear-gradient(135deg, #FFB74D 0%, #FB8C00 100%)'
export const noneGradient = 'linear-gradient(135deg, #BDBDBD 0%, #9E9E9E 100%)'

export function getHealthGradient(status: HealthStatus): string {
  switch (status) {
    case 'healthy':
      return healthyGradient
    case 'warning':
      return warningGradient
    case 'none':
      return noneGradient
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function compressImage(file: File, maxWidth: number = 800, quality: number = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('无法创建canvas上下文'))
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export const defaultPlantIcon = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#E8F5E9" rx="12"/><path d="M50 80 V40" stroke="#5B8C5A" stroke-width="3" fill="none"/><ellipse cx="50" cy="35" rx="18" ry="22" fill="#81C784"/><path d="M35 40 Q25 25 35 15 Q45 25 50 35" fill="#66BB6A"/><path d="M65 40 Q75 25 65 15 Q55 25 50 35" fill="#66BB6A"/></svg>'
)}`
