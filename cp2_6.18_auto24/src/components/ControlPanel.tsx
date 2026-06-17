import React, { memo, useCallback, useRef, useState } from 'react'
import {
  ChevronLeft,
  ChevronDown,
  Sliders,
  Grid3X3,
  Rows3,
  Minus,
  Plus,
  Trash2,
  GripVertical,
  Palette,
} from 'lucide-react'
import { useLayoutStore } from '../store'
import type { Breakpoint, GridConfig, FlexConfig } from '../layoutEngine'
import { PresetToolbar } from './PresetToolbar'

interface SubPanelProps {
  title: string
  icon: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}

const SubPanel = memo(function SubPanel(props: SubPanelProps) {
  const { title, icon, defaultOpen = true, children } = props
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={`sub-panel ${open ? 'open' : ''}`}>
      <div
        className="sub-panel-header"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="sub-panel-title">
          {icon}
          <span>{title}</span>
        </div>
        <ChevronDown size={16} className="sub-panel-chevron" />
      </div>
      <div className="sub-panel-body">{children}</div>
    </div>
  )
})

interface SliderWithInputProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (val: number) => void
}

const SliderWithInput = memo(function SliderWithInput(props: SliderWithInputProps) {
  const { label, value, min, max, step = 1, unit = '', onChange } = props
  const inputRef = useRef<HTMLInputElement>(null)

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLInputElement>) => {
      e.preventDefault()
      const delta = e.deltaY < 0 ? step : -step
      const next = Math.max(min, Math.min(max, Number((value + delta).toFixed(2))))
      onChange(next)
    },
    [value, min, max, step, onChange]
  )

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = Number(e.target.value)
      if (Number.isNaN(raw)) return
      const next = Math.max(min, Math.min(max, raw))
      onChange(next)
    },
    [min, max, onChange]
  )

  return (
    <div className="field-row">
      <span className="field-label">{label}</span>
      <div className="field-input">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <input
          ref={inputRef}
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleInput}
          onWheel={handleWheel}
        />
        {unit && <span className="breakpoint-unit">{unit}</span>}
      </div>
    </div>
  )
})

export const ControlPanel = memo(function ControlPanel() {
  const collapsed = useLayoutStore((s) => s.controlPanelCollapsed)
  const mobileOpen = useLayoutStore((s) => s.mobilePanelOpen)
  const togglePanel = useLayoutStore((s) => s.togglePanel)
  const toggleMobilePanel = useLayoutStore((s) => s.toggleMobilePanel)

  const breakpoints = useLayoutStore((s) => s.breakpoints)
  const addBreakpoint = useLayoutStore((s) => s.addBreakpoint)
  const removeBreakpoint = useLayoutStore((s) => s.removeBreakpoint)
  const updateBreakpoint = useLayoutStore((s) => s.updateBreakpoint)
  const reorderBreakpoints = useLayoutStore((s) => s.reorderBreakpoints)

  const grid = useLayoutStore((s) => s.grid)
  const setGrid = useLayoutStore((s) => s.setGrid)

  const flex = useLayoutStore((s) => s.flex)
  const setFlex = useLayoutStore((s) => s.setFlex)

  const dragState = useRef<{ fromIndex: number | null; overIndex: number | null }>({
    fromIndex: null,
    overIndex: null,
  })

  const [draggingValueId, setDraggingValueId] = useState<string | null>(null)
  const valueDragState = useRef<{
    startClientX: number
    startHandleLeft: number
    startValue: number
  } | null>(null)

  const handleValueDragStart = useCallback(
    (e: React.PointerEvent, bp: Breakpoint) => {
      e.stopPropagation()
      e.preventDefault()
      const target = e.currentTarget as HTMLElement
      target.setPointerCapture(e.pointerId)
      const rect = target.getBoundingClientRect()
      valueDragState.current = {
        startClientX: e.clientX,
        startHandleLeft: rect.left,
        startValue: bp.value,
      }
      setDraggingValueId(bp.id)
    },
    []
  )

  const handleValueDragMove = useCallback(
    (e: React.PointerEvent, bpId: string) => {
      if (!valueDragState.current || draggingValueId !== bpId) return
      const { startClientX, startHandleLeft, startValue } = valueDragState.current
      const currentOffsetFromHandle = e.clientX - startHandleLeft
      const initialOffset = startClientX - startHandleLeft
      const deltaX = currentOffsetFromHandle - initialOffset
      const newVal = Math.max(100, Math.min(4000, startValue + deltaX))
      updateBreakpoint(bpId, { value: Math.floor(newVal) })
    },
    [draggingValueId, updateBreakpoint]
  )

  const handleValueDragEnd = useCallback(
    (e: React.PointerEvent, bpId: string) => {
      if (!valueDragState.current || draggingValueId !== bpId) return
      const target = e.currentTarget as HTMLElement
      if (target.hasPointerCapture(e.pointerId)) {
        target.releasePointerCapture(e.pointerId)
      }
      valueDragState.current = null
      setDraggingValueId(null)
    },
    [draggingValueId]
  )

  const handleBpValueChange = useCallback(
    (id: string, val: string) => {
      const num = Number(val)
      if (Number.isNaN(num)) return
      updateBreakpoint(id, { value: Math.max(0, Math.floor(num)) })
    },
    [updateBreakpoint]
  )

  const handleBpLabelChange = useCallback(
    (id: string, val: string) => {
      updateBreakpoint(id, { label: val })
    },
    [updateBreakpoint]
  )

  const handleColorClick = useCallback(
    (bp: Breakpoint) => {
      const current = bp.color
      const picker = document.createElement('input')
      picker.type = 'color'
      picker.value = current
      picker.addEventListener('input', (e: Event) => {
        const val = (e.target as HTMLInputElement).value
        updateBreakpoint(bp.id, { color: val })
      })
      picker.click()
    },
    [updateBreakpoint]
  )

  const handleBpDragStart = useCallback((index: number) => {
    dragState.current.fromIndex = index
  }, [])

  const handleBpDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault()
      dragState.current.overIndex = index
    },
    []
  )

  const handleBpDrop = useCallback(
    (_e: React.DragEvent, toIndex: number) => {
      const from = dragState.current.fromIndex
      if (from == null || from === toIndex) return
      reorderBreakpoints(from, toIndex)
      dragState.current = { fromIndex: null, overIndex: null }
    },
    [reorderBreakpoints]
  )

  const handleBpDragEnd = useCallback(() => {
    dragState.current = { fromIndex: null, overIndex: null }
  }, [])

  const handleWheelNum = (
    e: React.WheelEvent<HTMLInputElement>,
    val: number,
    setter: (p: Record<string, number>) => void,
    key: string,
    min: number,
    max: number,
    step = 1
  ) => {
    e.preventDefault()
    const delta = e.deltaY < 0 ? step : -step
    const next = Math.max(min, Math.min(max, Number((val + delta).toFixed(2))))
    setter({ [key]: next })
  }

  const panelClasses = [
    'control-panel',
    collapsed ? 'collapsed' : '',
    mobileOpen ? 'mobile-open' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <aside className={panelClasses}>
      <div className="control-panel-header">
        <div className="control-panel-title">
          <Sliders size={18} color="#3B82F6" />
          <span>布局控制面板</span>
        </div>
        <button
          type="button"
          className="collapse-btn"
          onClick={() => {
            if (window.matchMedia('(max-width: 900px)').matches) {
              toggleMobilePanel()
            } else {
              togglePanel()
            }
          }}
          title="收起面板"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      <PresetToolbar />

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <SubPanel
          title="断点管理"
          icon={<Palette size={14} color="#3B82F6" />}
          defaultOpen
        >
          <div className="breakpoint-list">
            {breakpoints.map((bp, index) => (
              <div
                key={bp.id}
                className={`breakpoint-item ${draggingValueId === bp.id ? 'dragging-value' : ''}`}
                draggable={draggingValueId !== bp.id}
                onDragStart={() => handleBpDragStart(index)}
                onDragOver={(e) => handleBpDragOver(e, index)}
                onDrop={(e) => handleBpDrop(e, index)}
                onDragEnd={handleBpDragEnd}
                title="拖拽调整顺序"
              >
                <GripVertical size={14} color="#9CA3AF" />
                <button
                  type="button"
                  className="breakpoint-color"
                  style={{ background: bp.color }}
                  onClick={() => handleColorClick(bp)}
                  title="点击修改颜色"
                />
                <div className="breakpoint-input">
                  <input
                    type="text"
                    value={bp.label}
                    maxLength={12}
                    onChange={(e) => handleBpLabelChange(bp.id, e.target.value)}
                  />
                </div>
                <div
                  className="bp-drag-handle"
                  style={{ background: bp.color }}
                  onPointerDown={(e) => handleValueDragStart(e, bp)}
                  onPointerMove={(e) => handleValueDragMove(e, bp.id)}
                  onPointerUp={(e) => handleValueDragEnd(e, bp.id)}
                  onPointerCancel={(e) => handleValueDragEnd(e, bp.id)}
                  onDragStart={(e) => e.preventDefault()}
                  title="拖拽调整断点值"
                />
                <div className="breakpoint-input">
                  <input
                    type="number"
                    min={100}
                    max={4000}
                    value={bp.value}
                    onChange={(e) => handleBpValueChange(bp.id, e.target.value)}
                    onWheel={(e) =>
                      handleWheelNum(
                        e,
                        bp.value,
                        (p) => updateBreakpoint(bp.id, p as Partial<Breakpoint>),
                        'value',
                        100,
                        4000
                      )
                    }
                  />
                  <span className="breakpoint-unit">px</span>
                </div>
                <button
                  type="button"
                  className="breakpoint-remove"
                  onClick={() => removeBreakpoint(bp.id)}
                  disabled={breakpoints.length <= 1}
                  title="删除断点"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="add-breakpoint-btn" onClick={addBreakpoint}>
            <Plus size={14} />
            <span>添加新断点</span>
          </button>
        </SubPanel>

        <SubPanel
          title="网格配置"
          icon={<Grid3X3 size={14} color="#10B981" />}
          defaultOpen
        >
          <SliderWithInput
            label="列数"
            value={grid.columns}
            min={2}
            max={12}
            step={1}
            onChange={(v) => setGrid({ columns: Math.floor(v) })}
          />
          <SliderWithInput
            label="间距"
            value={grid.gap}
            min={4}
            max={32}
            step={1}
            unit="px"
            onChange={(v) => setGrid({ gap: Math.floor(v) })}
          />
          <SliderWithInput
            label="外边距"
            value={grid.margin}
            min={0}
            max={80}
            step={1}
            unit="px"
            onChange={(v) => setGrid({ margin: Math.floor(v) })}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 8,
              padding: '4px 0',
            }}
          >
            <button
              type="button"
              className="btn-secondary"
              style={{ flex: 1, padding: '6px 10px', fontSize: 12 }}
              onClick={() => setGrid({ columns: Math.max(2, grid.columns - 1) })}
            >
              <Minus size={12} /> 减列
            </button>
            <button
              type="button"
              className="btn-secondary"
              style={{ flex: 1, padding: '6px 10px', fontSize: 12 }}
              onClick={() => setGrid({ columns: Math.min(12, grid.columns + 1) })}
            >
              加列 <Plus size={12} />
            </button>
          </div>
        </SubPanel>

        <SubPanel
          title="弹性布局参数"
          icon={<Rows3 size={14} color="#8B5CF6" />}
          defaultOpen
        >
          <SliderWithInput
            label="flex-grow"
            value={flex.grow}
            min={0}
            max={10}
            step={0.1}
            onChange={(v) => setFlex({ grow: Number(v.toFixed(1)) })}
          />
          <SliderWithInput
            label="flex-shrink"
            value={flex.shrink}
            min={0}
            max={10}
            step={0.1}
            onChange={(v) => setFlex({ shrink: Number(v.toFixed(1)) })}
          />
          <SliderWithInput
            label="flex-basis"
            value={flex.basis}
            min={0}
            max={10}
            step={0.1}
            onChange={(v) => setFlex({ basis: Number(v.toFixed(1)) })}
          />
        </SubPanel>
      </div>
    </aside>
  )
})
