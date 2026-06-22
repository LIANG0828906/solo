export type ElementType = 'beatBars' | 'particleGalaxy' | 'waveSphere' | 'lightWall'
export type ThemeType = 'cyber' | 'aurora' | 'lava'

export interface VisualElement {
  id: string
  type: ElementType
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
  sensitivity: number
  rotationSpeed: number
  params: Record<string, number>
}

export const THEME_COLORS: Record<ThemeType, [string, string, string]> = {
  cyber: ['#ff00ff', '#00ffff', '#ffff00'],
  aurora: ['#0000ff', '#00ff88', '#88ffff'],
  lava: ['#ff3300', '#ff8800', '#ffcc00'],
}

export const ELEMENT_DEFAULTS: Record<ElementType, { params: Record<string, number>; rotationSpeed: number; sensitivity: number }> = {
  beatBars: { params: { barCount: 32, spacing: 0.3 }, rotationSpeed: 0, sensitivity: 1.0 },
  particleGalaxy: { params: { particleCount: 2000, galaxyRadius: 3 }, rotationSpeed: 0.5, sensitivity: 1.0 },
  waveSphere: { params: { segments: 32, waveAmplitude: 0.3 }, rotationSpeed: 0.2, sensitivity: 1.0 },
  lightWall: { params: { width: 6, height: 4, flickerRate: 2.0 }, rotationSpeed: 0.1, sensitivity: 1.0 },
}

export const ELEMENT_LABELS: Record<ElementType, string> = {
  beatBars: '跳动柱体',
  particleGalaxy: '旋转粒子星系',
  waveSphere: '起伏波形球体',
  lightWall: '闪烁光墙',
}
