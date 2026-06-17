import type { CSSProperties } from 'react'

export interface Breakpoint {
  id: string
  value: number
  color: string
  label: string
}

export interface GridConfig {
  columns: number
  gap: number
  margin: number
}

export interface FlexConfig {
  grow: number
  shrink: number
  basis: number
}

export interface PresetDefinition {
  id: PresetId
  name: string
  breakpoints: Omit<Breakpoint, 'id'>[]
  grid: GridConfig
  flex: FlexConfig
  description: string
}

export type PresetId = 'blog2' | 'blog3' | 'ecommerce' | 'dashboard' | 'gallery'

export const PRESET_COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#F97316',
]

export const BREAKPOINT_PRESETS: Record<PresetId, PresetDefinition> = {
  blog2: {
    id: 'blog2',
    name: '博客两栏',
    description: '经典博客双栏布局，侧边栏+主内容',
    breakpoints: [
      { value: 640, color: '#3B82F6', label: 'sm' },
      { value: 1024, color: '#10B981', label: 'lg' },
    ],
    grid: { columns: 2, gap: 16, margin: 24 },
    flex: { grow: 1, shrink: 1, basis: 0 },
  },
  blog3: {
    id: 'blog3',
    name: '博客三栏',
    description: '三栏博客布局，双导航栏+内容中心',
    breakpoints: [
      { value: 768, color: '#3B82F6', label: 'md' },
      { value: 1024, color: '#F59E0B', label: 'lg' },
      { value: 1440, color: '#10B981', label: 'xl' },
    ],
    grid: { columns: 3, gap: 20, margin: 32 },
    flex: { grow: 2, shrink: 1, basis: 0 },
  },
  ecommerce: {
    id: 'ecommerce',
    name: '电商网格',
    description: '商品列表密集型网格布局',
    breakpoints: [
      { value: 480, color: '#EF4444', label: 'xs' },
      { value: 768, color: '#3B82F6', label: 'md' },
      { value: 1200, color: '#10B981', label: 'xl' },
    ],
    grid: { columns: 4, gap: 12, margin: 20 },
    flex: { grow: 0, shrink: 0, basis: 220 },
  },
  dashboard: {
    id: 'dashboard',
    name: '仪表盘',
    description: '数据面板卡片布局，适合可视化图表',
    breakpoints: [
      { value: 640, color: '#3B82F6', label: 'sm' },
      { value: 992, color: '#8B5CF6', label: 'lg' },
      { value: 1400, color: '#06B6D4', label: 'xxl' },
    ],
    grid: { columns: 6, gap: 16, margin: 24 },
    flex: { grow: 1, shrink: 0, basis: 300 },
  },
  gallery: {
    id: 'gallery',
    name: '图库瀑布流',
    description: '图片展示型多列瀑布布局',
    breakpoints: [
      { value: 375, color: '#EF4444', label: 'mobile' },
      { value: 768, color: '#F59E0B', label: 'tablet' },
      { value: 1024, color: '#3B82F6', label: 'laptop' },
      { value: 1680, color: '#10B981', label: 'desktop' },
    ],
    grid: { columns: 5, gap: 8, margin: 16 },
    flex: { grow: 1, shrink: 1, basis: 200 },
  },
}

export function sortBreakpoints(breakpoints: Breakpoint[]): Breakpoint[] {
  return [...breakpoints].sort((a, b) => a.value - b.value)
}

export function getActiveBreakpoint(
  deviceWidth: number,
  breakpoints: Breakpoint[]
): Breakpoint | null {
  const sorted = sortBreakpoints(breakpoints)
  let active: Breakpoint | null = null
  for (const bp of sorted) {
    if (deviceWidth >= bp.value) {
      active = bp
    }
  }
  return active
}

export interface ContainerStyleParams {
  grid: GridConfig
  flex: FlexConfig
  deviceWidth: number
  breakpoints: Breakpoint[]
}

export function getContainerStyles(params: ContainerStyleParams): CSSProperties {
  const { grid, deviceWidth, breakpoints } = params
  const sorted = sortBreakpoints(breakpoints)

  let columns = Math.max(1, Math.floor(grid.columns / 2))
  if (sorted.length > 0) {
    for (let i = 0; i < sorted.length; i++) {
      if (deviceWidth >= sorted[i].value) {
        const ratio = (i + 1) / sorted.length
        columns = Math.max(1, Math.round(grid.columns * Math.max(0.4, ratio)))
      }
    }
  }
  if (deviceWidth < 480) columns = 1
  else if (deviceWidth < 768) columns = Math.min(2, columns)
  else if (deviceWidth < 1024) columns = Math.min(3, columns)

  return {
    // @ts-expect-error css custom property
    '--container-columns': columns,
    '--container-gap': `${grid.gap}px`,
    '--container-margin': `${grid.margin}px`,
  } as CSSProperties
}

export interface GenerateCssParams {
  breakpoints: Breakpoint[]
  grid: GridConfig
  flex: FlexConfig
}

function indent(n: number, str: string): string {
  return '  '.repeat(n) + str
}

export function generateFullCss(params: GenerateCssParams): string {
  const { breakpoints, grid, flex } = params
  const sorted = sortBreakpoints(breakpoints)

  const lines: string[] = []

  lines.push('/* ============================================')
  lines.push('   响应式布局 CSS - 由 Responsive Layout Lab 生成')
  lines.push('   ============================================ */')
  lines.push('')

  lines.push(':root {')
  lines.push(indent(1, `--grid-columns: ${grid.columns};`))
  lines.push(indent(1, `--grid-gap: ${grid.gap}px;`))
  lines.push(indent(1, `--grid-margin: ${grid.margin}px;`))
  lines.push(indent(1, `--flex-grow: ${flex.grow};`))
  lines.push(indent(1, `--flex-shrink: ${flex.shrink};`))
  lines.push(indent(1, `--flex-basis: ${flex.basis}${flex.basis === 0 ? '' : 'px'};`))
  lines.push('}')
  lines.push('')

  lines.push('/* -------- 基础容器 -------- */')
  lines.push('.layout-container {')
  lines.push(indent(1, 'box-sizing: border-box;'))
  lines.push(indent(1, 'width: 100%;'))
  lines.push(indent(1, 'display: grid;'))
  lines.push(indent(1, `grid-template-columns: repeat(${Math.max(1, Math.floor(grid.columns / 3))}, 1fr);`))
  lines.push(indent(1, `gap: var(--grid-gap);`))
  lines.push(indent(1, `padding: var(--grid-margin);`))
  lines.push(indent(1, 'transition: all 0.15s ease;'))
  lines.push('}')
  lines.push('')

  lines.push('/* -------- 弹性项目 -------- */')
  lines.push('.flex-item {')
  lines.push(indent(1, 'flex: var(--flex-grow) var(--flex-shrink) var(--flex-basis);'))
  lines.push(indent(1, 'min-width: 0;'))
  lines.push('}')
  lines.push('')

  lines.push('/* -------- 卡片组件 -------- */')
  lines.push('.layout-card {')
  lines.push(indent(1, 'background: #FFFFFF;'))
  lines.push(indent(1, 'border-radius: 8px;'))
  lines.push(indent(1, 'box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);'))
  lines.push(indent(1, 'padding: 12px;'))
  lines.push(indent(1, 'overflow: hidden;'))
  lines.push(indent(1, 'transition: all 0.15s ease;'))
  lines.push('}')
  lines.push('')
  lines.push('.layout-card:hover {')
  lines.push(indent(1, 'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);'))
  lines.push(indent(1, 'transform: translateY(-1px);'))
  lines.push('}')
  lines.push('')

  lines.push('/* ============================================')
  lines.push('   Media Queries - 响应式断点')
  lines.push('   ============================================ */')
  lines.push('')

  sorted.forEach((bp, idx) => {
    const colCount = Math.min(
      grid.columns,
      Math.max(1, Math.round(grid.columns * ((idx + 1) / Math.max(1, sorted.length))))
    )
    lines.push(`/* 断点: ${bp.label} (${bp.value}px) - 颜色: ${bp.color} */`)
    lines.push(`@media (min-width: ${bp.value}px) {`)
    lines.push(indent(1, '.layout-container {'))
    lines.push(indent(2, `grid-template-columns: repeat(${colCount}, 1fr);`))
    lines.push(indent(1, '}'))
    if (idx === sorted.length - 1) {
      lines.push('')
      lines.push(indent(1, '/* 大屏可进一步增加密度 */'))
    }
    lines.push('}')
    lines.push('')
  })

  lines.push('/* -------- 移动端兜底 (< 480px) -------- */')
  lines.push('@media (max-width: 479px) {')
  lines.push(indent(1, '.layout-container {'))
  lines.push(indent(2, 'grid-template-columns: 1fr;'))
  lines.push(indent(2, `padding: ${Math.max(8, Math.floor(grid.margin / 2))}px;`))
  lines.push(indent(2, `gap: ${Math.max(4, Math.floor(grid.gap / 2))}px;`))
  lines.push(indent(1, '}'))
  lines.push('}')
  lines.push('')

  lines.push('/* -------- 小屏移动端 (< 375px) -------- */')
  lines.push('@media (max-width: 374px) {')
  lines.push(indent(1, '.layout-container {'))
  lines.push(indent(2, `padding: ${Math.max(4, Math.floor(grid.margin / 3))}px;`))
  lines.push(indent(1, '}'))
  lines.push('}')

  return lines.join('\n')
}

export function pickNextBreakpointColor(existingColors: string[]): string {
  for (const color of PRESET_COLORS) {
    if (!existingColors.includes(color)) {
      return color
    }
  }
  return PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]
}
