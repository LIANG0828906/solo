import stableStringify from 'json-stable-stringify'
import type { SceneSnapshot } from '@/store/editorStore'

export function serializeSnapshot(snapshot: SceneSnapshot): string {
  return stableStringify(snapshot, { space: 2 })
}

export function deserializeSnapshot(json: string): SceneSnapshot {
  const parsed = JSON.parse(json)
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('快照格式无效')
  }
  if (!parsed.version || parsed.version !== 1) {
    throw new Error('快照版本不兼容')
  }
  if (!Array.isArray(parsed.geometries)) {
    throw new Error('快照缺少几何体数据')
  }
  return parsed as SceneSnapshot
}

export function downloadSnapshot(snapshot: SceneSnapshot, filename?: string): void {
  const json = serializeSnapshot(snapshot)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || `snapshot_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function readSnapshotFromFile(file: File): Promise<SceneSnapshot> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const snapshot = deserializeSnapshot(text)
        resolve(snapshot)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file)
  })
}
