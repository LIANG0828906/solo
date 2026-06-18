import React, { useCallback } from 'react'
import { useWeekStore, TEMPLATES } from '../store/weekStore'
import type { TemplateType } from '../types'

interface DraggableListProps {
  items: { id: string; content: string }[]
  onUpdate: (id: string, content: string) => void
  onRemove: (id: string) => void
  onAdd: () => void
  onReorder: (fromIndex: number, toIndex: number) => void
  placeholder: string
  accentColor: string
  addButtonText: string
  maxLength?: number
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
}) => {
  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, index: number) => {
      e.dataTransfer.setData('text/plain', String(index))
      e.dataTransfer.effectAllowed = 'move'
    },
    []
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, toIndex: number) => {
      e.preventDefault()
      const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10)
      if (fromIndex !== toIndex) {
        onReorder(fromIndex, toIndex)
      }
    },
    [onReorder]
  )

  return (
    <div className="form-list">
      {items.map((item, index) => (
        <div
          key={item.id}
          className="form-item-row"
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, index)}
        >
          <span className="drag-handle" title="拖动排序">⋮⋮</span>
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
          {items.length > 1 && (
            <button
              type="button"
              className="remove-btn"
              onClick={() => onRemove(item.id)}
              title="删除"
            >
              ×
            </button>
          )}
        </div>
      ))}
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
  const colors = TEMPLATES[template]

  if (!currentWeek) {
    return <div className="loading">加载中...</div>
  }

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
          >
            下一周 →
          </button>
        </div>
        <div className="date-range-input">
          <label>日期范围：</label>
          <input
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
        <div className="template-selector">
          {(['professional', 'creative'] as TemplateType[]).map((t) => (
            <button
              key={t}
              type="button"
              className={`template-card ${template === t ? 'active' : ''}`}
              onClick={() => setTemplate(t)}
              style={{
                borderColor:
                  template === t ? TEMPLATES[t].accent : '#d1d5db',
                ['--template-accent' as string]: TEMPLATES[t].accent,
              }}
            >
              <div
                className="template-preview"
                style={{
                  background: t === 'creative'
                    ? TEMPLATES[t].divider
                    : TEMPLATES[t].divider,
                }}
              />
              <span className="template-name">
                {t === 'professional' ? '简约职场' : '活泼创意'}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="form-section">
        <h3 className="form-section-title" style={{ color: colors.title }}>
          本周工作列表
        </h3>
        <DraggableList
          items={currentWeek.currentWork}
          onUpdate={updateCurrentWorkItem}
          onRemove={removeCurrentWorkItem}
          onAdd={addCurrentWorkItem}
          onReorder={reorderCurrentWork}
          placeholder="请输入本周工作内容...（最多500字）"
          accentColor={colors.accent}
          addButtonText="添加工作项"
          maxLength={500}
        />
      </div>

      <div className="form-section">
        <h3 className="form-section-title" style={{ color: colors.title }}>
          下周计划列表
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
        />
      </div>

      <div className="form-section">
        <h3 className="form-section-title" style={{ color: colors.title }}>
          问题与反思
        </h3>
        <textarea
          value={currentWeek.reflection}
          onChange={(e) => updateReflection(e.target.value)}
          placeholder="请输入本周遇到的问题与反思...（最多1000字）"
          maxLength={1000}
          rows={6}
          style={{ ['--focus-border' as string]: colors.accent }}
        />
        <div className="char-count">
          {currentWeek.reflection.length} / 1000
        </div>
      </div>
    </div>
  )
}

export default WeekForm
