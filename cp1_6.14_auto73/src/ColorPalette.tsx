import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ColorItem } from './types'

interface SortablePaletteItemProps {
  color: ColorItem
  id: string
  onRemove: (hex: string) => void
}

function SortablePaletteItem({ color, id, onRemove }: SortablePaletteItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`palette-item ${isDragging ? 'dragging' : ''}`}
    >
      <div
        className="palette-color"
        style={{ backgroundColor: color.hex }}
        {...attributes}
        {...listeners}
      />
      <div className="palette-item-info">
        <div className="palette-item-hex">{color.hex.toUpperCase()}</div>
      </div>
      <button
        className="palette-item-remove"
        onClick={(e) => {
          e.stopPropagation()
          onRemove(color.hex)
        }}
      >
        ×
      </button>
    </div>
  )
}

interface ColorPaletteProps {
  colors: ColorItem[]
  onReorder: (colors: ColorItem[]) => void
  onRemove: (hex: string) => void
}

function ColorPalette({ colors, onReorder, onRemove }: ColorPaletteProps) {
  const [showExport, setShowExport] = useState(false)
  const [copied, setCopied] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = colors.findIndex((_, i) => `color-${i}` === active.id)
    const newIndex = colors.findIndex((_, i) => `color-${i}` === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      onReorder(arrayMove(colors, oldIndex, newIndex))
    }
  }

  const generateCSSVars = () => {
    if (colors.length === 0) return ''
    const lines = colors.map((color, i) => `  --color-${i + 1}: ${color.hex};`)
    return `:root {\n${lines.join('\n')}\n}`
  }

  const generateSvg = () => {
    if (colors.length === 0) return ''
    const rectWidth = 100 / colors.length
    const rects = colors.map((color, i) =>
      `<rect x="${i * rectWidth}%" y="0" width="${rectWidth}%" height="100%" fill="${color.hex}" />`
    ).join('')
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 80">${rects}</svg>`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const cssContent = generateCSSVars()
  const svgContent = generateSvg()

  return (
    <div className="palette-section">
      <div className="palette-header">
        <span className="palette-title">色卡</span>
        <span className="palette-count">{colors.length} 个颜色</span>
      </div>

      {colors.length === 0 ? (
        <div className="empty-state" style={{ padding: '40px 20px' }}>
          <div className="empty-state-icon">🎨</div>
          <p className="empty-state-text">点击图片中的颜色添加到色卡</p>
        </div>
      ) : (
        <>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={colors.map((_, i) => `color-${i}`)}
              strategy={verticalListSortingStrategy}
            >
              <div className="palette-grid">
                {colors.map((color, index) => (
                  <SortablePaletteItem
                    key={color.hex + index}
                    id={`color-${index}`}
                    color={color}
                    onRemove={onRemove}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <button
            className="export-btn"
            onClick={() => setShowExport(!showExport)}
            disabled={colors.length === 0}
          >
            {showExport ? '收起导出' : '导出色卡'}
          </button>

          {showExport && (
            <div className="export-preview">
              <h4>SVG 预览</h4>
              <div
                className="svg-palette"
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />

              <h4>CSS 变量</h4>
              <pre className="export-code">{cssContent}</pre>

              <button
                className="copy-btn"
                onClick={() => copyToClipboard(cssContent)}
              >
                {copied ? '已复制 ✓' : '复制 CSS 变量'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ColorPalette
