import { useState, useRef, useCallback, memo } from 'react'
import useEditorStore from '@/stores/editorStore'
import BlockRenderer from '@/components/BlockRenderer'
import type { BlockType } from '@/types'
import { Type, Image, HelpCircle, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

type DragFromToolbarState = {
  type: BlockType
  x: number
  y: number
  width: number
  height: number
} | null

const BLOCK_DEFAULTS: Record<BlockType, { width: number; height: number; label: string }> = {
  text: { width: 300, height: 200, label: '释放添加文字块' },
  image: { width: 300, height: 200, label: '释放添加图片块' },
  quiz: { width: 350, height: 260, label: '释放添加测验块' },
}

const Canvas = memo(function Canvas() {
  const currentPageId = useEditorStore((s) => s.currentPageId)
  const pages = useEditorStore((s) => s.pages)
  const blocks = useEditorStore((s) => s.blocks)
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId)
  const selectBlock = useEditorStore((s) => s.selectBlock)
  const moveBlock = useEditorStore((s) => s.moveBlock)
  const moveBlockEnd = useEditorStore((s) => s.moveBlockEnd)
  const updateBlock = useEditorStore((s) => s.updateBlock)
  const addBlock = useEditorStore((s) => s.addBlock)
  const addQuizOption = useEditorStore((s) => s.addQuizOption)
  const removeQuizOption = useEditorStore((s) => s.removeQuizOption)
  const updateQuizOption = useEditorStore((s) => s.updateQuizOption)
  const deleteBlock = useEditorStore((s) => s.deleteBlock)

  const canvasRef = useRef<HTMLDivElement>(null)
  const [dragFromToolbar, setDragFromToolbar] = useState<DragFromToolbarState>(null)
  const [dragOverCanvas, setDragOverCanvas] = useState(false)

  const currentPage = pages.find((p) => p.id === currentPageId)
  const pageBlocks = blocks.filter((b) => b.pageId === currentPageId)

  const handleToolbarDragStart = useCallback((type: BlockType) => {
    const defaults = BLOCK_DEFAULTS[type]
    setDragFromToolbar({
      type,
      x: 100,
      y: 100,
      width: defaults.width,
      height: defaults.height,
    })
  }, [])

  const handleToolbarDragMove = useCallback((clientX: number, clientY: number) => {
    if (!dragFromToolbar || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = Math.max(0, clientX - rect.left - dragFromToolbar.width / 2)
    const y = Math.max(0, clientY - rect.top - dragFromToolbar.height / 2)
    setDragFromToolbar((prev) => (prev ? { ...prev, x, y } : null))
  }, [dragFromToolbar])

  const handleCanvasDrop = useCallback(() => {
    if (dragFromToolbar && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const x = Math.max(20, dragFromToolbar.x)
      const y = Math.max(20, dragFromToolbar.y)
      addBlock(dragFromToolbar.type, x, y)
    }
    setDragFromToolbar(null)
    setDragOverCanvas(false)
  }, [dragFromToolbar, addBlock])

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (dragFromToolbar) {
        handleToolbarDragMove(e.clientX, e.clientY)
      }
    },
    [dragFromToolbar, handleToolbarDragMove]
  )

  const handleCanvasMouseUp = useCallback(() => {
    if (dragFromToolbar) {
      handleCanvasDrop()
    }
  }, [dragFromToolbar, handleCanvasDrop])

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === canvasRef.current) {
        selectBlock(null)
      }
    },
    [selectBlock]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOverCanvas(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOverCanvas(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOverCanvas(false)
      const blockType = e.dataTransfer.getData('blockType') as BlockType
      if (blockType && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect()
        const x = Math.max(20, e.clientX - rect.left - 150)
        const y = Math.max(20, e.clientY - rect.top - 100)
        addBlock(blockType, x, y)
      }
    },
    [addBlock]
  )

  if (!currentPage) {
    return (
      <div className="flex-1 bg-canvas flex items-center justify-center">
        <div className="text-gray-400 text-sm">请先创建或选择一个页面</div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-canvas overflow-auto flex items-start justify-center p-8">
      <div className="mb-4 flex gap-2 md:hidden">
        <ToolbarBlockButton type="text" icon={<Type size={16} />} label="文字" onDragStart={handleToolbarDragStart} />
        <ToolbarBlockButton type="image" icon={<Image size={16} />} label="图片" onDragStart={handleToolbarDragStart} />
        <ToolbarBlockButton type="quiz" icon={<HelpCircle size={16} />} label="测验" onDragStart={handleToolbarDragStart} />
      </div>

      <div
        ref={canvasRef}
        className={cn(
          'w-[800px] min-h-[500px] rounded-lg shadow-md relative transition-all duration-200',
          dragOverCanvas && 'ring-2 ring-accent/50'
        )}
        style={{ backgroundColor: currentPage.backgroundColor || '#ffffff' }}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onClick={handleCanvasClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {pageBlocks.map((block) => (
          <BlockRenderer
            key={block.id}
            block={block}
            isSelected={selectedBlockId === block.id}
            onSelect={() => selectBlock(block.id)}
            onUpdate={(updates) => updateBlock(block.id, updates)}
            onMove={(id, x, y) => moveBlock(id, x, y)}
            onMoveEnd={(id, x, y) => moveBlockEnd(id, x, y)}
            onDelete={(id) => deleteBlock(id)}
            onAddQuizOption={() => addQuizOption(block.id)}
            onRemoveQuizOption={(optionId) => removeQuizOption(block.id, optionId)}
            onUpdateQuizOption={(optionId, updates) => updateQuizOption(block.id, optionId, updates)}
          />
        ))}

        {dragFromToolbar && (
          <div
            className={cn(
              'absolute pointer-events-none border-2 border-dashed rounded-lg',
              'border-accent/60 bg-accent/5 transition-all duration-75',
              'flex items-center justify-center'
            )}
            style={{
              left: dragFromToolbar.x,
              top: dragFromToolbar.y,
              width: dragFromToolbar.width,
              height: dragFromToolbar.height,
            }}
          >
            <span className="text-accent-700 text-sm font-medium">
              {BLOCK_DEFAULTS[dragFromToolbar.type].label}
            </span>
          </div>
        )}

        {selectedBlockId && (
          <div className="absolute -top-8 right-0 flex gap-1">
            <button
              onClick={() => deleteBlock(selectedBlockId)}
              className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
            >
              删除
            </button>
          </div>
        )}
      </div>
    </div>
  )
})

interface ToolbarBlockButtonProps {
  type: BlockType
  icon: React.ReactNode
  label: string
  onDragStart: (type: BlockType) => void
}

function ToolbarBlockButton({ type, icon, label, onDragStart }: ToolbarBlockButtonProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('blockType', type)
    e.dataTransfer.effectAllowed = 'copy'
    onDragStart(type)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    onDragStart(type)
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onMouseDown={handleMouseDown}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-md cursor-grab',
        'bg-white border border-gray-200 text-gray-700',
        'hover:bg-accent/10 hover:border-accent/40 hover:text-accent-700',
        'transition-colors duration-200 text-xs font-medium',
        'active:cursor-grabbing'
      )}
    >
      <GripVertical size={12} className="text-gray-400" />
      {icon}
      <span>{label}</span>
    </div>
  )
}

export default Canvas
