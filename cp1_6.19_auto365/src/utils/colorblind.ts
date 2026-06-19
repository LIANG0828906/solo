import type { ColorblindMode } from '../types'

export const colorblindMatrices: Record<ColorblindMode, string> = {
  normal: '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0',
  protanopia: '0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0',
  deuteranopia: '0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0',
  tritanopia: '0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0',
  achromatopsia: '0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0 0 0 1 0'
}

export const colorblindLabels: Record<ColorblindMode, string> = {
  normal: '正常视觉',
  protanopia: '红色盲',
  deuteranopia: '绿色盲',
  tritanopia: '蓝色盲',
  achromatopsia: '全色盲'
}
