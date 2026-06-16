import { useVoxelStore, Voxel, AnimationConfig } from './VoxelStore'

export interface VoxelSnapshot {
  version: string
  voxels: Voxel[]
  animation: AnimationConfig
  metadata: {
    createdAt: number
    voxelCount: number
  }
}

const SNAPSHOT_VERSION = '1.0.0'

export function exportSnapshot(): VoxelSnapshot {
  const state = useVoxelStore.getState()
  const snapshot: VoxelSnapshot = {
    version: SNAPSHOT_VERSION,
    voxels: state.voxels.map(v => ({
      id: v.id,
      x: v.x,
      y: v.y,
      z: v.z,
      color: v.color,
      animOffset: v.animOffset,
    })),
    animation: { ...state.animation },
    metadata: {
      createdAt: Date.now(),
      voxelCount: state.voxels.length,
    },
  }
  return snapshot
}

export function serializeSnapshot(snapshot: VoxelSnapshot): string {
  const data = {
    v: snapshot.version,
    a: snapshot.animation,
    m: snapshot.metadata,
    vs: snapshot.voxels.map(v => ({
      i: v.id,
      x: v.x,
      y: v.y,
      z: v.z,
      c: v.color,
      o: v.animOffset,
    })),
  }
  return JSON.stringify(data)
}

export function deserializeSnapshot(json: string): VoxelSnapshot {
  try {
    const data = JSON.parse(json)
    const isCompact = 'vs' in data && 'v' in data
    if (isCompact) {
      return {
        version: data.v,
        animation: data.a,
        metadata: data.m,
        voxels: data.vs.map((v: any) => ({
          id: v.i,
          x: v.x,
          y: v.y,
          z: v.z,
          color: v.c,
          animOffset: v.o,
        })),
      }
    }
    return data as VoxelSnapshot
  } catch (e) {
    throw new Error('无效的快照文件格式')
  }
}

export function downloadSnapshot(snapshot: VoxelSnapshot, filename?: string) {
  const json = serializeSnapshot(snapshot)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const name = filename || `voxelize_${snapshot.metadata.voxelCount}_${Date.now()}.json`
  a.download = name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  showToast(`✅ 保存成功！共 ${snapshot.metadata.voxelCount} 个体素`)
}

export async function readSnapshotFromFile(file: File): Promise<VoxelSnapshot> {
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

export function importSnapshot(snapshot: VoxelSnapshot) {
  if (!snapshot.voxels) {
    throw new Error('快照中未找到体素数据')
  }
  useVoxelStore.getState().importSnapshot({
    voxels: snapshot.voxels,
    animation: snapshot.animation,
  })
  showToast(`✅ 导入成功！共 ${snapshot.voxels.length} 个体素`)
}

let toastEl: HTMLDivElement | null = null
let toastTimer: number | null = null

export function showToast(message: string, duration: number = 2500) {
  if (!toastEl) {
    toastEl = document.createElement('div')
    toastEl.style.cssText = `
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%) translateY(-10px);
      padding: 12px 24px;
      background: rgba(30, 40, 70, 0.95);
      border: 1px solid rgba(96, 192, 255, 0.6);
      border-radius: 10px;
      color: #e0f0ff;
      font-size: 14px;
      font-family: -apple-system, 'Microsoft YaHei', sans-serif;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow: 0 6px 24px rgba(96, 192, 255, 0.25);
      z-index: 99999;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s ease, transform 0.25s ease;
    `
    document.body.appendChild(toastEl)
  }

  toastEl.textContent = message
  requestAnimationFrame(() => {
    if (toastEl) {
      toastEl.style.opacity = '1'
      toastEl.style.transform = 'translateX(-50%) translateY(0)'
    }
  })

  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => {
    if (toastEl) {
      toastEl.style.opacity = '0'
      toastEl.style.transform = 'translateX(-50%) translateY(-10px)'
    }
  }, duration)
}
