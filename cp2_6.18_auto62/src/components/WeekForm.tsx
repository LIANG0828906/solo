import React, { useCallback, useRef, useState, useEffect } from 'react'
import { useWeekStore, TEMPLATES } from '../store/weekStore'
import type { TemplateType, WeekItem } from '../types'

interface DraggableListProps {
  items: WeekItem[]
  onUpdate: (id: string, content: string) => void
  onRemove: (id: string) => void
  onAdd: () => void
  onReorder: (fromIndex: number, toIndex: number) => void
  placeholder: string
  accentColor: string
  addButtonText: string
  maxLength?: number
  listLabel: string
}

const DraggableList: React.FC<DraggableListProps> = ({
  items,
  onUpdate,
  onRemove,
  onAdd,
  onReorder,
  placeholder,
  accentColor,
  addButtonText,
  maxLength = 500,
  listLabel,
}) => {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [keyboardDragIndex, setKeyboardDragIndex] = useState<number | null>(null)
  const touchStartY = useRef<number>(0)
  const touchStartIndex = useRef<number | null>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, index: number) => {
      setDraggingIndex(index)
      e.dataTransfer.setData('text/plain', String(index))
      e.dataTransfer.effectAllowed = 'move'
    },
    []
  )

  const handleDragEnd = useCallback(() => {
    setDraggingIndex(null)
    setDragOverIndex(null)
  }, [])

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>, index: number) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      if (dragOverIndex !== index) {
        setDragOverIndex(index)
      }
    },
    [dragOverIndex]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, toIndex: number) => {
      e.preventDefault()
      const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10)
      if (!isNaN(fromIndex) && fromIndex !== toIndex) {
        onReorder(fromIndex, toIndex)
      }
      setDraggingIndex(null)
      setDragOverIndex(null)
    },
    [onReorder]
  )

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>, index: number) => {
      touchStartY.current = e.touches[0].clientY
      touchStartIndex.current = index
      setDraggingIndex(index)
    },
    []
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (touchStartIndex.current === null) return
      e.preventDefault()

      const touchY = e.touches[0].clientY
      const currentEl = itemRefs.current[touchStartIndex.current]
      if (!currentEl) return

      let targetIndex = touchStartIndex.current
      for (let i = 0; i < itemRefs.current.length; i++) {
        const el = itemRefs.current[i]
        if (el) {
          const rect = el.getBoundingClientRect()
          if (touchY >= rect.top && touchY <= rect.bottom) {
            targetIndex = i
            break
          }
          if (i === 0 && touchY < rect.top) {
            targetIndex = 0
            break
          }
          if (i === itemRefs.current.length - 1 && touchY > rect.bottom) {
            targetIndex = i
            break
          }
        }
      }

      if (targetIndex !== dragOverIndex) {
        setDragOverIndex(targetIndex)
      }
    },
    [dragOverIndex]
  )

  const handleTouchEnd = useCallback(() => {
    if (touchStartIndex.current !== null && dragOverIndex !== null) {
      if (touchStartIndex.current !== dragOverIndex) {
        onReorder(touchStartIndex.current, dragOverIndex)
      }
    }
    touchStartIndex.current = null
    touchStartY.current = 0
    setDraggingIndex(null)
    setDragOverIndex(null)
  }, [dragOverIndex, onReorder])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>, index: number) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        if (keyboardDragIndex === null) {
          setKeyboardDragIndex(index)
        } else if (keyboardDragIndex === index) {
          setKeyboardDragIndex(null)
        } else {
          onReorder(keyboardDragIndex, index)
          setKeyboardDragIndex(null)
        }
      } else if (e.key === 'Escape' && keyboardDragIndex !== null) {
        e.preventDefault()
        setKeyboardDragIndex(null)
      } else if (keyboardDragIndex !== null) {
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          const newIndex = Math.max(0, keyboardDragIndex - 1)
          if (newIndex !== keyboardDragIndex) {
            onReorder(keyboardDragIndex, newIndex)
            setKeyboardDragIndex(newIndex)
          }
        } else if (e.key === 'ArrowDown') {
          e.preventDefault()
          const newIndex = Math.min(items.length - 1, keyboardDragIndex + 1)
          if (newIndex !== keyboardDragIndex) {
            onReorder(keyboardDragIndex, newIndex)
            setKeyboardDragIndex(newIndex)
          }
        }
      }
    },
    [keyboardDragIndex, onReorder, items.length]
  )

  useEffect(() => {
    if (keyboardDragIndex !== null && itemRefs.current[keyboardDragIndex]) {
      itemRefs.current[keyboardDragIndex]?.focus()
    }
  }, [keyboardDragIndex])

  return (
    <div className="form-list" role="list" aria-label={listLabel}>
      {items.map((item, index) => {
        const isDragging = draggingIndex === index || keyboardDragIndex === index
        const isDragOver = dragOverIndex === index
        return (
          <div
            key={item.id}
            ref={(el) => { itemRefs.current[index] = el }}
            className={`form-item-row ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onTouchStart={(e) => handleTouchStart(e, index)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onKeyDown={(e) => handleKeyDown(e, index)}
            tabIndex={0}
            role="listitem"
            aria-grabbed={isDragging}
            aria-label={`第${index + 1}项：${item.content || '空条目'}，按空格键拖拽排序`}
          >
            <span className="drag-handle" title="拖动排序（支持触摸、键盘方向键）">
              ⋮⋮
            </span>
            <span className="item-index">{index + 1}.</span>
            <input
              type="text"
              value={item.content}
              onChange={(e) => onUpdate(item.id, e.target.value)}
              placeholder={placeholder}
              maxLength={maxLength}
              style={{
                ['--focus-border' as string]: accentColor,
              }}
            />
            <div className="char-count-inline">
              {item.content.length}/{maxLength}
            </div>
            {items.length > 1 && (
              <button
                type="button"
                className="remove-btn"
                onClick={() => onRemove(item.id)}
                title="删除该项"
                aria-label={`删除第${index + 1}项`}
              >
                ×
              </button>
            )}
          </div>
        )
      })}
      <button
        type="button"
        className="add-btn"
        onClick={onAdd}
        style={{ ['--accent' as string]: accentColor }}
      >
        + {addButtonText}
      </button>
    </div>
  )
}

const WeekForm: React.FC = () => {
  const {
    template,
    setTemplate,
    switchWeek,
    updateDateRange,
    addCurrentWorkItem,
    removeCurrentWorkItem,
    updateCurrentWorkItem,
    reorderCurrentWork,
    addNextPlanItem,
    removeNextPlanItem,
    updateNextPlanItem,
    reorderNextPlan,
    updateReflection,
    getCurrentWeek,
  } = useWeekStore()

  const currentWeek = getCurrentWeek()
  const { colors } = TEMPLATES[template]

  if (!currentWeek) {
    return <div className="loading">加载中...</div>
  }

  const workOverflow = currentWeek.currentWork.some((i) => i.content.length >= 490)
  const reflectionOverflow = currentWeek.reflection.length >= 950

  return (
    <div className="week-form">
      <div className="form-section">
        <h3 className="form-section-title" style={{ color: colors.title }}>
          周次与日期
        </h3>
        <div className="week-switcher">
          <button
            type="button"
            className="week-nav-btn"
            onClick={() => switchWeek(-1)}
            style={{ ['--accent' as string]: colors.accent }}
            aria-label="上一周"
          >
            ← 上一周
          </button>
          <div className="week-display">
            <span className="week-number">
              {currentWeek.year} 年 第 {currentWeek.weekNumber} 周
            </span>
          </div>
          <button
            type="button"
            className="week-nav-btn"
            onClick={() => switchWeek(1)}
            style={{ ['--accent' as string]: colors.accent }}
            aria-label="下一周"
          >
            下一周 →
          </button>
        </div>
        <div className="date-range-input">
          <label htmlFor="dateRange">日期范围：</label>
          <input
            id="dateRange"
            type="text"
            value={currentWeek.dateRange}
            onChange={(e) => updateDateRange(e.target.value)}
            style={{ ['--focus-border' as string]: colors.accent }}
          />
        </div>
      </div>

      <div className="form-section">
        <h3 className="form-section-title" style={{ color: colors.title }}>
          模板选择
        </h3>
        <div className="template-selector" role="radiogroup" aria-label="选择周报模板">
          {(['professional', 'creative'] as TemplateType[]).map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={template === t}
              className={`template-card ${template === t ? 'active' : ''}`}
              onClick={() => setTemplate(t)}
              style={{
                borderColor: template === t ? TEMPLATES[t].colors.accent : '#d1d5db',
                ['--template-accent' as string]: TEMPLATES[t].colors.accent,
              }}
            >
              <div
                className="template-preview"
                style={{
                  background: TEMPLATES[t].colors.divider,
                }}
              />
              <span className="template-name">
                {t === 'professional' ? '简约职场' : '活泼创意'}
              </span>
              <span className="template-desc">
                {t === 'professional' ? '深蓝标题 · 圆点列表' : '紫色标题 · 对勾列表'}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="form-section">
        <h3 className="form-section-title" style={{ color: colors.title }}>
          本周工作列表
          <span className="section-hint">（至少 5 项，每项最多 500 字）</span>
        </h3>
        {workOverflow && (
          <div className="warning-tip" style={{ color: '#f59e0b' }}>
            ⚠ 部分条目已接近字数限制
          </div>
        )}
        <DraggableList
          items={currentWeek.currentWork}
          onUpdate={updateCurrentWorkItem}
          onRemove={removeCurrentWorkItem}
          onAdd={addCurrentWorkItem}
          onReorder={reorderCurrentWork}
          placeholder="请输入本周工作内容..."
          accentColor={colors.accent}
          addButtonText="添加工作项"
          maxLength={500}
          listLabel="本周工作列表"
        />
      </div>

      <div className="form-section">
        <h3 className="form-section-title" style={{ color: colors.title }}>
          下周计划列表
          <span className="section-hint">（至少 3 项）</span>
        </h3>
        <DraggableList
          items={currentWeek.nextPlan}
          onUpdate={updateNextPlanItem}
          onRemove={removeNextPlanItem}
          onAdd={addNextPlanItem}
          onReorder={reorderNextPlan}
          placeholder="请输入下周计划内容..."
          accentColor={colors.accent}
          addButtonText="添加计划项"
          maxLength={500}
          listLabel="下周计划列表"
        />
      </div>

      <div className="form-section">
        <h3 className="form-section-title" style={{ color: colors.title }}>
          问题与反思
          <span className="section-hint">（最多 1000 字）</span>
        </h3>
        <textarea
          value={currentWeek.reflection}
          onChange={(e) => updateReflection(e.target.value)}
          placeholder="请输入本周遇到的问题与反思..."
          maxLength={1000}
          rows={6}
          style={{ ['--focus-border' as string]: colors.accent }}
          aria-describedby="reflection-count"
        />
        <div
          id="reflection-count"
          className={`char-count ${reflectionOverflow ? 'warning' : ''}`}
          style={{ color: reflectionOverflow ? '#f59e0b' : undefined }}
        >
          {currentWeek.reflection.length} / 1000
          {reflectionOverflow && ' ⚠ 接近上限'}
        </div>
      </div>
    </div>
  )
}

export default WeekForm
