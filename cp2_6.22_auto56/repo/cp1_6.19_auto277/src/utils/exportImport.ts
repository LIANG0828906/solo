import type { CanvasExport, Bubble, Connection } from '@/types'

const EXPORT_VERSION = '1.0.0'

export function exportCanvas(bubbles: Bubble[], connections: Connection[]): void {
  const data: CanvasExport = {
    version: EXPORT_VERSION,
    bubbles,
    connections,
    exportedAt: new Date().toISOString()
  }
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bubble-canvas-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function importCanvas(file: File): Promise<CanvasExport> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const data = JSON.parse(text) as CanvasExport
        if (!data.version || !Array.isArray(data.bubbles) || !Array.isArray(data.connections)) {
          throw new Error('无效的画布文件格式')
        }
        resolve(data)
      } catch (err) {
        reject(new Error('文件解析失败：' + (err as Error).message))
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file)
  })
}
