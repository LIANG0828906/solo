export function generateId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

export function screenToCanvas(
  screenX: number,
  screenY: number,
  offsetX: number,
  offsetY: number,
  scale: number,
  containerRect: DOMRect
): { x: number; y: number } {
  return {
    x: (screenX - containerRect.left - offsetX) / scale,
    y: (screenY - containerRect.top - offsetY) / scale,
  }
}

export function canvasToScreen(
  canvasX: number,
  canvasY: number,
  offsetX: number,
  offsetY: number,
  scale: number,
  containerRect: DOMRect
): { x: number; y: number } {
  return {
    x: canvasX * scale + offsetX + containerRect.left,
    y: canvasY * scale + offsetY + containerRect.top,
  }
}

export function formatTimestamp(): string {
  const now = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
}

export function distanceBetween(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
}

export function getDefaultComponentProps(
  type: string
): Partial<import('./types').UIComponentProps> {
  const defaults: Record<string, Partial<import('./types').UIComponentProps>> = {
    button: { width: 120, height: 40, borderRadius: 6, backgroundColor: '#4A90D9', textColor: '#FFFFFF', text: '按钮' },
    input: { width: 200, height: 36, borderRadius: 4, backgroundColor: '#FFFFFF', textColor: '#333333', borderColor: '#D0D0D0', placeholder: '请输入...' },
    card: { width: 280, height: 180, borderRadius: 8, backgroundColor: '#FFFFFF', borderColor: '#E0E0E0', text: '卡片标题' },
    navbar: { width: 600, height: 56, borderRadius: 0, backgroundColor: '#FFFFFF', borderColor: '#E0E0E0', text: '导航栏' },
    table: { width: 400, height: 240, borderRadius: 4, backgroundColor: '#FFFFFF', borderColor: '#E0E0E0', text: '表头1,表头2,表头3' },
    text: { width: 200, height: 24, borderRadius: 0, textColor: '#333333', text: '文本内容', fontSize: 14 },
    image: { width: 200, height: 150, borderRadius: 4, backgroundColor: '#F0F0F0', borderColor: '#D0D0D0' },
    checkbox: { width: 20, height: 20, borderRadius: 3, backgroundColor: '#FFFFFF', borderColor: '#D0D0D0', text: '复选框' },
    select: { width: 200, height: 36, borderRadius: 4, backgroundColor: '#FFFFFF', borderColor: '#D0D0D0', text: '下拉选择' },
    textarea: { width: 280, height: 100, borderRadius: 4, backgroundColor: '#FFFFFF', textColor: '#333333', borderColor: '#D0D0D0', placeholder: '请输入...' },
    divider: { width: 300, height: 1, backgroundColor: '#E0E0E0' },
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#4A90D9', text: 'A' },
    badge: { width: 60, height: 24, borderRadius: 12, backgroundColor: '#FF6B35', textColor: '#FFFFFF', text: '标签' },
    switch: { width: 44, height: 24, borderRadius: 12, backgroundColor: '#4A90D9' },
    slider: { width: 200, height: 8, borderRadius: 4, backgroundColor: '#E0E0E0' },
    progress: { width: 200, height: 8, borderRadius: 4, backgroundColor: '#E0E0E0' },
  }
  return defaults[type] || { width: 100, height: 40, borderRadius: 4, backgroundColor: '#FFFFFF' }
}
