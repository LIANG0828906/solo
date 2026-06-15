import { useCallback, useEffect, useState } from 'react'
import useEditorStore from '@/stores/editorStore'
import { exportAsJSON, copyShareLink } from '@/utils/export'
import {
  Type,
  Image,
  HelpCircle,
  Undo2,
  Redo2,
  Save,
  Play,
  Clock,
  Download,
  Share2,
  GripVertical,
  Check,
} from 'lucide-react'
import type { BlockType } from '@/types'
import { cn } from '@/lib/utils'

export default function Toolbar() {
  const canUndo = useEditorStore((s) => s.canUndo)
  const canRedo = useEditorStore((s) => s.canRedo)
  const currentCourseId = useEditorStore((s) => s.currentCourseId)
  const courses = useEditorStore((s) => s.courses)
  const pages = useEditorStore((s) => s.pages)
  const blocks = useEditorStore((s) => s.blocks)
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)
  const save = useEditorStore((s) => s.save)
  const togglePreview = useEditorStore((s) => s.togglePreview)
  const toggleHistoryPanel = useEditorStore((s) => s.toggleHistoryPanel)
  const addBlock = useEditorStore((s) => s.addBlock)

  const [saved, setSaved] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)

  const currentCourse = courses.find((c) => c.id === currentCourseId)

  const handleSave = useCallback(async () => {
    if (!currentCourseId) return
    await save()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [currentCourseId, save])

  const handleExport = useCallback(() => {
    if (!currentCourse || !pages.length) return
    exportAsJSON(currentCourse, pages, blocks)
  }, [currentCourse, pages, blocks])

  const handleShare = useCallback(async () => {
    if (!currentCourseId) return
    const success = await copyShareLink(currentCourseId)
    if (success) {
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    }
  }, [currentCourseId])

  const handleAddBlock = useCallback(
    (type: BlockType) => {
      addBlock(type)
    },
    [addBlock]
  )

  const handleDragStart = useCallback((e: React.DragEvent, type: BlockType) => {
    e.dataTransfer.setData('blockType', type)
    e.dataTransfer.effectAllowed = 'copy'
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          redo()
        } else {
          undo()
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, handleSave])

  return (
    <div className="h-12 bg-primary-900 flex items-center px-3 gap-2 text-white shadow-md z-20">
      <span className="font-display font-bold text-base mr-2 text-accent">
        CourseForge
      </span>

      <div className="h-6 w-px bg-white/20 mx-1" />

      <div className="hidden md:flex items-center gap-1">
        <ToolbarButton
          icon={<Type size={16} />}
          label="文字"
          onClick={() => handleAddBlock('text')}
          draggable
          onDragStart={(e) => handleDragStart(e, 'text')}
          title="添加文字块 (拖拽到画布)"
        />
        <ToolbarButton
          icon={<Image size={16} />}
          label="图片"
          onClick={() => handleAddBlock('image')}
          draggable
          onDragStart={(e) => handleDragStart(e, 'image')}
          title="添加图片块 (拖拽到画布)"
        />
        <ToolbarButton
          icon={<HelpCircle size={16} />}
          label="测验"
          onClick={() => handleAddBlock('quiz')}
          draggable
          onDragStart={(e) => handleDragStart(e, 'quiz')}
          title="添加测验块 (拖拽到画布)"
        />
      </div>

      <div className="h-6 w-px bg-white/20 mx-1" />

      <ToolbarButton
        icon={<Undo2 size={16} />}
        label="撤销"
        onClick={undo}
        disabled={!canUndo}
        title="撤销 (Ctrl+Z)"
      />
      <ToolbarButton
        icon={<Redo2 size={16} />}
        label="重做"
        onClick={redo}
        disabled={!canRedo}
        title="重做 (Ctrl+Shift+Z)"
      />

      <div className="h-6 w-px bg-white/20 mx-1" />

      <ToolbarButton
        icon={saved ? <Check size={16} /> : <Save size={16} />}
        label={saved ? '已保存' : '保存'}
        onClick={handleSave}
        accent
        disabled={!currentCourseId}
        title="保存 (Ctrl+S)"
      />

      <div className="ml-auto flex items-center gap-1">
        <ToolbarButton
          icon={<Clock size={16} />}
          label="历史"
          onClick={toggleHistoryPanel}
          title="版本历史"
        />
        <ToolbarButton
          icon={<Download size={16} />}
          label="导出"
          onClick={handleExport}
          disabled={!currentCourseId}
          title="导出 JSON"
        />
        <ToolbarButton
          icon={shareCopied ? <Check size={16} /> : <Share2 size={16} />}
          label={shareCopied ? '已复制' : '分享'}
          onClick={handleShare}
          disabled={!currentCourseId}
          title="复制分享链接"
        />
        <ToolbarButton
          icon={<Play size={16} />}
          label="预览"
          onClick={togglePreview}
          accent
          disabled={!currentCourseId || pages.length === 0}
          title="全屏预览"
        />
      </div>
    </div>
  )
}

interface ToolbarButtonProps {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  disabled?: boolean
  accent?: boolean
  draggable?: boolean
  onDragStart?: (e: React.DragEvent) => void
  title?: string
}

function ToolbarButton({
  icon,
  label,
  onClick,
  disabled,
  accent,
  draggable,
  onDragStart,
  title,
}: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      title={title}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium',
        'transition-all duration-200 whitespace-nowrap',
        accent
          ? 'bg-accent text-primary-900 hover:bg-accent-600'
          : 'bg-white/10 hover:bg-white/20 text-white',
        disabled && 'opacity-40 cursor-not-allowed',
        !disabled && 'active:scale-95',
        draggable && 'cursor-grab active:cursor-grabbing'
      )}
      disabled={disabled}
    >
      {draggable && <GripVertical size={12} className="opacity-60" />}
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
