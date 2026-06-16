import type { Template, BannerSize } from './types'

export const BANNER_SIZES: BannerSize[] = [
  { id: 'facebook', name: 'Facebook封面', width: 820, height: 312 },
  { id: 'instagram', name: 'Instagram故事', width: 1080, height: 1920 },
  { id: 'web', name: 'Web横幅', width: 728, height: 90 },
]

export const TEMPLATES: Template[] = [
  {
    id: 'classic',
    name: '经典促销',
    background: {
      start: '#FFFFFF',
      end: '#FFF5F5',
      direction: 'vertical',
    },
    titleStyle: {
      color: '#D32F2F',
      fontSizePercent: 6,
      fontWeight: 700,
      shadowColor: 'rgba(211, 47, 47, 0.2)',
      shadowOffsetX: 0,
      shadowOffsetY: 2,
      shadowBlur: 4,
    },
    subtitleStyle: {
      color: '#555555',
      fontSizePercent: 3,
      fontWeight: 400,
    },
    buttonTextStyle: {
      color: '#FFFFFF',
      fontSizePercent: 3.5,
      fontWeight: 700,
    },
    buttonStyle: {
      backgroundColor: '#D32F2F',
      textColor: '#FFFFFF',
      borderRadius: 8,
      paddingX: 24,
      paddingY: 12,
    },
    imageLayout: {
      xPercent: 8,
      yPercent: 15,
      widthPercent: 35,
      heightPercent: 70,
    },
    titleLayout: {
      xPercent: 48,
      yPercent: 20,
      widthPercent: 45,
      heightPercent: 20,
    },
    subtitleLayout: {
      xPercent: 48,
      yPercent: 45,
      widthPercent: 45,
      heightPercent: 20,
    },
    buttonLayout: {
      xPercent: 48,
      yPercent: 68,
      widthPercent: 30,
      heightPercent: 15,
    },
    imageStyle: {
      borderRadius: 12,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
      shadowBlur: 8,
      shadowColor: 'rgba(0, 0, 0, 0.15)',
    },
    accentColor: '#D32F2F',
  },
  {
    id: 'tech',
    name: '科技新品',
    background: {
      start: '#1A1A2E',
      end: '#16213E',
      direction: 'diagonal',
    },
    titleStyle: {
      color: '#FFFFFF',
      fontSizePercent: 6,
      fontWeight: 700,
      useGradient: true,
      gradientStart: '#00D4FF',
      gradientEnd: '#7B61FF',
    },
    subtitleStyle: {
      color: '#B0B8D1',
      fontSizePercent: 3,
      fontWeight: 400,
    },
    buttonTextStyle: {
      color: '#FFFFFF',
      fontSizePercent: 3.5,
      fontWeight: 700,
    },
    buttonStyle: {
      backgroundColor: '#1976D2',
      textColor: '#FFFFFF',
      borderRadius: 8,
      paddingX: 24,
      paddingY: 12,
    },
    imageLayout: {
      xPercent: 55,
      yPercent: 15,
      widthPercent: 38,
      heightPercent: 70,
    },
    titleLayout: {
      xPercent: 8,
      yPercent: 25,
      widthPercent: 42,
      heightPercent: 20,
    },
    subtitleLayout: {
      xPercent: 8,
      yPercent: 48,
      widthPercent: 42,
      heightPercent: 20,
    },
    buttonLayout: {
      xPercent: 8,
      yPercent: 70,
      widthPercent: 28,
      heightPercent: 14,
    },
    imageStyle: {
      borderRadius: 12,
      shadowOffsetX: 0,
      shadowOffsetY: 4,
      shadowBlur: 20,
      shadowColor: 'rgba(0, 212, 255, 0.3)',
    },
    accentColor: '#1976D2',
  },
  {
    id: 'festival',
    name: '节日庆典',
    background: {
      start: '#FFF8E1',
      end: '#FFE0B2',
      direction: 'vertical',
    },
    titleStyle: {
      color: '#5D4037',
      fontSizePercent: 6.5,
      fontWeight: 700,
      useGradient: true,
      gradientStart: '#FFD700',
      gradientEnd: '#FF8F00',
      shadowColor: 'rgba(255, 143, 0, 0.3)',
      shadowOffsetX: 0,
      shadowOffsetY: 2,
      shadowBlur: 6,
    },
    subtitleStyle: {
      color: '#6D4C41',
      fontSizePercent: 3,
      fontWeight: 400,
    },
    buttonTextStyle: {
      color: '#FFFFFF',
      fontSizePercent: 3.5,
      fontWeight: 700,
    },
    buttonStyle: {
      backgroundColor: '#FF6F00',
      textColor: '#FFFFFF',
      borderRadius: 8,
      paddingX: 24,
      paddingY: 12,
    },
    imageLayout: {
      xPercent: 10,
      yPercent: 18,
      widthPercent: 32,
      heightPercent: 64,
    },
    titleLayout: {
      xPercent: 46,
      yPercent: 22,
      widthPercent: 46,
      heightPercent: 22,
    },
    subtitleLayout: {
      xPercent: 46,
      yPercent: 48,
      widthPercent: 46,
      heightPercent: 18,
    },
    buttonLayout: {
      xPercent: 46,
      yPercent: 68,
      widthPercent: 30,
      heightPercent: 15,
    },
    imageStyle: {
      borderRadius: 12,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
      shadowBlur: 10,
      shadowColor: 'rgba(255, 143, 0, 0.25)',
    },
    accentColor: '#FF6F00',
  },
]

export const getTemplateById = (id: string): Template => {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0]
}

export const getSizeById = (id: string): BannerSize => {
  return BANNER_SIZES.find((s) => s.id === id) || BANNER_SIZES[0]
}
