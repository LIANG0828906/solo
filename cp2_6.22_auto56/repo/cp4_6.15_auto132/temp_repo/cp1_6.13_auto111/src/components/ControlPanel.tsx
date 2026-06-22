import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, Camera, RotateCcw, Undo2, Redo2, ChevronUp, ChevronDown, Image as ImageIcon, Brick, TreePine, Gem, Sun, Snowflake, Lightbulb, Cloud } from 'lucide-react'
import type { PaintingData, WallMaterial, LightPreset } from '@/types'
import { cn } from '@/lib/utils'

interface ControlPanelProps {
  paintings: PaintingData[]
  wallMaterial: WallMaterial
  lightPreset: LightPreset
  onImagesUpload: (files: FileList | File[]) => void
  onWallMaterialChange: (material: WallMaterial) => void
  onLightPresetChange: (preset: LightPreset) => void
  onResetCamera: () => void
  onExportScreenshot: () => void
  onPaintingInteractionEnd: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
}

const MATERIAL_OPTIONS: { value: WallMaterial; label: string; icon: typeof ImageIcon; color: string }[] = [
  { value: 'white', label: '白墙', icon: ImageIcon, color: 'bg-gray-100' },
  { value: 'brick', label: '砖墙', icon: Brick, color: 'bg-amber-700' },
  { value: 'wood', label: '木板墙', icon: TreePine, color: 'bg-amber-300' },
  { value: 'marble', label: '大理石墙', icon: Gem, color: 'bg-slate-200' },
]

const LIGHT_PRESETS: { value: LightPreset; label: string; emoji: string }[] = [
  { value: 'warm', label: '暖光', emoji: '☀️' },
  { value: 'cool', label: '冷光', emoji: '❄️' },
  { value: 'spot', label: '聚光灯', emoji: '💡' },
  { value: 'natural', label: '自然光', emoji: '🌥' },
]

export default function ControlPanel(props: ControlPanelProps) {
  const {
    paintings,
    wallMaterial,
    lightPreset,
    onImagesUpload,
    onWallMaterialChange,
    onLightPresetChange,
    onResetCamera,
    onExportScreenshot,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
  } = props

  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImagesUpload(e.target.files)
      e.target.value = ''
    }
  }, [onImagesUpload])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
    if (files.length > 0) {
      onImagesUpload(files)
    }
  }, [onImagesUpload])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDraggingOver(false)
  }, [])

  const panelContent = (
    <div className="p-5 space-y-5 h-full overflow-y-auto">
      <div className="text-center">
        <h1 className="text-xl font-bold text-white tracking-wide drop-shadow-lg">ArtPlacer</h1>
        <p className="text-xs text-white/70 mt-1">三维画作布局预览</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-white/90 mb-2 drop-shadow">画作上传</label>
        <div
          className={cn(
            'border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-300',
            isDraggingOver
              ? 'border-sky-400 bg-sky-500/20 shadow-[0_0_20px_rgba(56,189,248,0.5)]'
              : 'border-white/40 bg-white/5 hover:bg-white/10'
          )}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-white/80" />
          <p className="text-sm text-white/90">点击或拖拽上传图片</p>
          <p className="text-xs text-white/60 mt-1">最多 8 张 ({paintings.length}/8)</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            disabled={paintings.length >= 8}
          />
        </div>
        {paintings.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mt-3">
            {paintings.map((p) => (
              <div key={p.id} className="relative aspect-square rounded-lg overflow-hidden border border-white/20">
                <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-white/90 mb-2 drop-shadow">墙面材质</label>
        <div className="grid grid-cols-2 gap-2">
          {MATERIAL_OPTIONS.map((opt) => {
            const Icon = opt.icon
            const selected = wallMaterial === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => onWallMaterialChange(opt.value)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                  'shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_18px_rgba(0,0,0,0.3)] hover:-translate-y-0.5',
                  selected
                    ? 'bg-white text-gray-900 ring-2 ring-sky-400'
                    : 'bg-white/15 backdrop-blur text-white hover:bg-white/25'
                )}
              >
                <span className={cn('w-5 h-5 rounded-md flex items-center justify-center', selected ? opt.color : 'bg-white/20')}>
                  <Icon className="w-3 h-3" />
                </span>
                <span>{opt.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-white/90 mb-2 drop-shadow">灯光预设</label>
        <div className="flex justify-between gap-2">
          {LIGHT_PRESETS.map((preset) => {
            const selected = lightPreset === preset.value
            return (
              <button
                key={preset.value}
                onClick={() => onLightPresetChange(preset.value)}
                title={preset.label}
                className={cn(
                  'relative w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all duration-500',
                  'shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_18px_rgba(0,0,0,0.3)] hover:-translate-y-0.5',
                  selected
                    ? 'bg-white'
                    : 'bg-white/15 backdrop-blur hover:bg-white/25'
                )}
              >
                <span className="relative z-10">{preset.emoji}</span>
                {selected && (
                  <span className="absolute inset-0 rounded-full bg-white/60 animate-ping" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={cn(
            'flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
            'shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_18px_rgba(0,0,0,0.3)] hover:-translate-y-0.5',
            canUndo
              ? 'bg-white/15 backdrop-blur text-white hover:bg-white/25'
              : 'bg-white/5 text-white/30 cursor-not-allowed'
          )}
        >
          <Undo2 className="w-4 h-4" />
          撤销
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={cn(
            'flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
            'shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_18px_rgba(0,0,0,0.3)] hover:-translate-y-0.5',
            canRedo
              ? 'bg-white/15 backdrop-blur text-white hover:bg-white/25'
              : 'bg-white/5 text-white/30 cursor-not-allowed'
          )}
        >
          <Redo2 className="w-4 h-4" />
          重做
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onResetCamera}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium bg-white/15 backdrop-blur text-white hover:bg-white/25 transition-all duration-200 shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_18px_rgba(0,0,0,0.3)] hover:-translate-y-0.5"
        >
          <RotateCcw className="w-4 h-4" />
          重置视角
        </button>
        <button
          onClick={onExportScreenshot}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-400 hover:to-blue-500 transition-all duration-200 shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_18px_rgba(0,0,0,0.3)] hover:-translate-y-0.5"
        >
          <Camera className="w-4 h-4" />
          导出截图
        </button>
      </div>

      <div className="text-xs text-white/50 space-y-1 pt-3 border-t border-white/10">
        <p>🖱 左键拖拽：移动画作</p>
        <p>🖱 滚轮悬停画作：缩放大小</p>
        <p>🖱 右键拖拽：旋转画作</p>
        <p>🖱 中键拖拽：平移视角</p>
        <p>⌨ Ctrl+Z / Ctrl+Shift+Z：撤销/重做</p>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <>
        <div
          className={cn(
            'fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 ease-out',
            isMobileOpen
              ? 'translate-y-0 max-h-[85vh]'
              : 'translate-y-[calc(100%-56px)]'
          )}
        >
          <div
            className="bg-white/15 backdrop-blur-xl rounded-t-2xl shadow-2xl border border-white/20 overflow-hidden"
            style={{
              WebkitBackdropFilter: 'blur(15px)',
              background: 'rgba(255,255,255,0.15)',
            }}
          >
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="w-full h-14 flex items-center justify-center text-white/90 active:bg-white/10"
            >
              {isMobileOpen ? <ChevronDown className="w-6 h-6" /> : <ChevronUp className="w-6 h-6" />}
            </button>
            <div className="max-h-[calc(85vh-56px)] overflow-y-auto">{panelContent}</div>
          </div>
        </div>
      </>
    )
  }

  return (
    <div
      className="fixed top-4 right-4 bottom-4 w-[280px] z-30 rounded-2xl overflow-hidden border border-white/20 shadow-2xl"
      style={{
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(15px)',
        WebkitBackdropFilter: 'blur(15px)',
      }}
    >
      {panelContent}
    </div>
  )
}
