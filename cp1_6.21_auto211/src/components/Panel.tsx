import { useState, useEffect, useCallback } from 'react'
import { Save, FolderOpen } from 'lucide-react'
import { useCanvasStore, type SavedCanvas } from '@/store/canvasStore'
import { cn } from '@/lib/utils'
import ConfirmModal from './ConfirmModal'
import Notification from './Notification'

export default function Panel() {
  const [isOpen, setIsOpen] = useState(false)
  const [canvases, setCanvases] = useState<SavedCanvas[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [canvasName, setCanvasName] = useState('')
  const { addNotification, addSavedCanvas, setSavedCanvases } = useCanvasStore()

  const loadCanvases = useCallback(async () => {
    try {
      const res = await fetch('/api/canvases')
      if (res.ok) {
        const data = await res.json()
        const sorted = (data.canvases || []).sort(
          (a: SavedCanvas, b: SavedCanvas) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        setCanvases(sorted)
        setSavedCanvases(sorted)
      }
    } catch {
      const local = localStorage.getItem('savedCanvases')
      if (local) {
        const parsed = JSON.parse(local) as SavedCanvas[]
        const sorted = parsed.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        setCanvases(sorted)
        setSavedCanvases(sorted)
      }
    }
  }, [setSavedCanvases])

  useEffect(() => {
    loadCanvases()
  }, [loadCanvases])

  const handleSave = async () => {
    if (!canvasName.trim()) {
      addNotification('请输入画布名称', 'error')
      return
    }
    setIsSaving(true)
    try {
      const canvas = document.querySelector('canvas')
      const thumbnail = canvas ? canvas.toDataURL('image/png', 0.3) : ''
      const data = canvas ? canvas.toDataURL('image/png') : ''

      const newCanvas: SavedCanvas = {
        id: Math.random().toString(36).slice(2),
        name: canvasName,
        thumbnail,
        data,
        updatedAt: new Date().toISOString(),
      }

      try {
        const res = await fetch('/api/canvases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCanvas),
        })
        if (!res.ok) throw new Error('save failed')
      } catch {
        const local = localStorage.getItem('savedCanvases')
        const list: SavedCanvas[] = local ? JSON.parse(local) : []
        list.push(newCanvas)
        localStorage.setItem('savedCanvases', JSON.stringify(list))
      }

      addSavedCanvas(newCanvas)
      setCanvases((prev) =>
        [newCanvas, ...prev.filter((c) => c.id !== newCanvas.id)].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
      )
      addNotification('画布保存成功', 'success')
      setCanvasName('')
      setShowSaveConfirm(false)
    } catch {
      addNotification('保存失败', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLoad = (canvas: SavedCanvas) => {
    const canvasEl = document.querySelector('canvas')
    if (!canvasEl) return
    const ctx = canvasEl.getContext('2d')
    if (!ctx) return
    const img = new Image()
    img.onload = () => {
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height)
      ctx.drawImage(img, 0, 0, canvasEl.width, canvasEl.height)
      addNotification(`已加载：${canvas.name}`, 'success')
    }
    img.src = canvas.data
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed top-4 left-4 z-40 flex items-center gap-2 rounded-xl px-4 py-2.5 text-white text-sm font-medium transition-all duration-200',
          'bg-indigo-600 hover:bg-indigo-700 shadow-lg'
        )}
      >
        <FolderOpen className="w-4 h-4" />
        画布管理
      </button>

      <div
        className={cn(
          'fixed top-16 left-4 z-30 rounded-xl p-4 transition-all duration-300',
          'w-80 max-h-[70vh] overflow-y-auto',
          isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-4 pointer-events-none'
        )}
        style={{
          backgroundColor: 'rgba(30, 41, 59, 0.95)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-base">画布管理</h3>
          <button
            onClick={() => setShowSaveConfirm(true)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-white text-xs font-medium transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            保存画布
          </button>
        </div>

        {canvases.length === 0 ? (
          <div className="text-slate-400 text-sm text-center py-8">暂无保存的画布</div>
        ) : (
          <div className="space-y-3">
            {canvases.map((canvas) => (
              <div
                key={canvas.id}
                onClick={() => handleLoad(canvas)}
                className="rounded-lg p-2 bg-slate-800/50 hover:bg-slate-700/50 cursor-pointer transition-all duration-200 group"
              >
                <div className="overflow-hidden rounded-lg mb-2" style={{ width: 120, height: 90 }}>
                  <img
                    src={canvas.thumbnail}
                    alt={canvas.name}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                  />
                </div>
                <div className="px-1">
                  <div className="text-white text-sm font-medium truncate">{canvas.name}</div>
                  <div className="text-slate-400 text-xs mt-0.5">{formatDate(canvas.updatedAt)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showSaveConfirm}
        title="保存画布"
        onClose={() => setShowSaveConfirm(false)}
        onConfirm={handleSave}
        confirmText={isSaving ? '保存中...' : '保存'}
      >
        <input
          type="text"
          value={canvasName}
          onChange={(e) => setCanvasName(e.target.value)}
          placeholder="请输入画布名称"
          className="w-full rounded-lg bg-slate-700 text-white px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
          }}
        />
      </ConfirmModal>

      <Notification />
    </>
  )
}
