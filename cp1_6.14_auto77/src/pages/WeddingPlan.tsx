import React, { useState, useRef, useCallback } from 'react'
import { useApp } from '@context/AppContext'
import type { TimelineItem } from '@types'

const COLORS = {
  pinkLight: '#FADADD',
  pinkDark: '#E8A8B8',
  gold: '#F7E7CE',
  goldDark: '#D4AF37',
  grayWarm: '#D4C9C0',
  grayText: '#6B5B55',
  grayMuted: '#9B8B85',
  white: '#FFFFFF',
}

interface PresetItem {
  title: string
  icon: string
  color: string
}

const PRESETS: PresetItem[] = [
  { title: '新娘入场', icon: '👰', color: '#ec4899' },
  { title: '誓言交换', icon: '💍', color: '#8b5cf6' },
  { title: '戴戒指', icon: '💎', color: '#3b82f6' },
  { title: '证婚人致辞', icon: '📜', color: '#06b6d4' },
  { title: '交换戒指', icon: '💫', color: '#10b981' },
  { title: '拥吻', icon: '💋', color: '#ef4444' },
  { title: '敬茶', icon: '🍵', color: '#f59e0b' },
  { title: '抛捧花', icon: '💐', color: '#f43f5e' },
  { title: '切蛋糕', icon: '🎂', color: '#d946ef' },
  { title: '退场', icon: '🎉', color: '#6366f1' },
  { title: '致辞', icon: '🎤', color: '#14b8a6' },
  { title: '第一支舞', icon: '💃', color: '#a855f7' },
]

const DEFAULT_DURATION = 10

function getNextTime(timeline: TimelineItem[], duration: number): string {
  if (timeline.length === 0) return '09:00'
  const last = timeline[timeline.length - 1]
  const [h, m] = last.time.split(':').map(Number)
  const totalMin = h * 60 + m + (last.duration || DEFAULT_DURATION)
  const nh = Math.min(23, Math.floor(totalMin / 60))
  const nm = totalMin % 60
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`
}

interface EditFormData {
  time: string
  duration: number
  personInCharge: string
  notes: string
}

export default function WeddingPlan() {
  const { wedding, timeline, addTimelineItem, updateTimelineItem, deleteTimelineItem, reorderTimeline } = useApp()

  const [editingItem, setEditingItem] = useState<TimelineItem | null>(null)
  const [editForm, setEditForm] = useState<EditFormData>({ time: '', duration: 10, personInCharge: '', notes: '' })
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [draggedPreset, setDraggedPreset] = useState<PresetItem | null>(null)
  const timelineRef = useRef<HTMLDivElement>(null)

  const handleAddPreset = useCallback(
    (preset: PresetItem) => {
      const time = getNextTime(timeline, DEFAULT_DURATION)
      addTimelineItem({
        title: preset.title,
        time,
        duration: DEFAULT_DURATION,
        personInCharge: '',
        notes: '',
        icon: preset.icon,
        color: preset.color,
      })
    },
    [timeline, addTimelineItem],
  )

  const handleOpenEdit = useCallback((item: TimelineItem) => {
    setEditingItem(item)
    setEditForm({
      time: item.time,
      duration: item.duration,
      personInCharge: item.personInCharge,
      notes: item.notes,
    })
  }, [])

  const handleSaveEdit = useCallback(() => {
    if (!editingItem) return
    updateTimelineItem(editingItem.id, {
      time: editForm.time,
      duration: editForm.duration,
      personInCharge: editForm.personInCharge,
      notes: editForm.notes,
    })
    setEditingItem(null)
  }, [editingItem, editForm, updateTimelineItem])

  const handleDeleteItem = useCallback(
    (id: string) => {
      deleteTimelineItem(id)
    },
    [deleteTimelineItem],
  )

  const handleTimelineDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }, [])

  const handleTimelineDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      if (draggedIndex !== null && draggedIndex !== index) {
        setDragOverIndex(index)
      }
      if (draggedPreset) {
        setDragOverIndex(index)
      }
    },
    [draggedIndex, draggedPreset],
  )

  const handleTimelineDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault()
      setDragOverIndex(null)

      const presetData = e.dataTransfer.getData('application/preset')
      if (presetData) {
        try {
          const preset: PresetItem = JSON.parse(presetData)
          const time = dropIndex < timeline.length ? timeline[dropIndex].time : getNextTime(timeline, DEFAULT_DURATION)
          addTimelineItem({
            title: preset.title,
            time,
            duration: DEFAULT_DURATION,
            personInCharge: '',
            notes: '',
            icon: preset.icon,
            color: preset.color,
          })
        } catch { /* ignore */ }
        setDraggedPreset(null)
        return
      }

      if (draggedIndex === null || draggedIndex === dropIndex) return

      const newItems = [...timeline]
      const [moved] = newItems.splice(draggedIndex, 1)
      newItems.splice(dropIndex, 0, moved)
      reorderTimeline(newItems)
      setDraggedIndex(null)
    },
    [timeline, draggedIndex, draggedPreset, addTimelineItem, reorderTimeline],
  )

  const handleTimelineDragEnd = useCallback(() => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }, [])

  const handlePresetDragStart = useCallback((e: React.DragEvent, preset: PresetItem) => {
    setDraggedPreset(preset)
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('application/preset', JSON.stringify(preset))
  }, [])

  const handlePresetDragEnd = useCallback(() => {
    setDraggedPreset(null)
  }, [])

  const handleTimelineAreaDragOver = useCallback(
    (e: React.DragEvent) => {
      if (draggedPreset) {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'
        setDragOverIndex(timeline.length)
      }
    },
    [draggedPreset, timeline.length],
  )

  const handleTimelineAreaDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOverIndex(null)
      const presetData = e.dataTransfer.getData('application/preset')
      if (presetData) {
        try {
          const preset: PresetItem = JSON.parse(presetData)
          handleAddPreset(preset)
        } catch { /* ignore */ }
      }
      setDraggedPreset(null)
    },
    [handleAddPreset],
  )

  const formatDuration = (min: number): string => {
    if (min < 60) return `${min}分钟`
    const h = Math.floor(min / 60)
    const m = min % 60
    return m > 0 ? `${h}小时${m}分钟` : `${h}小时`
  }

  const weddingTitle = wedding ? `${wedding.brideName} & ${wedding.groomName} 的婚礼流程` : '婚礼流程'

  return (
    <div
      style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${COLORS.pinkLight}20 0%, ${COLORS.gold}30 100%)`,
        padding: '32px 24px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 32,
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: COLORS.grayText,
                margin: 0,
              }}
            >
              {weddingTitle}
            </h1>
            <p
              style={{
                fontSize: 14,
                color: COLORS.grayMuted,
                margin: '6px 0 0',
              }}
            >
              点击预设添加环节，拖拽调整顺序
            </p>
          </div>
          <button
            onClick={() => handleAddPreset(PRESETS[0])}
            style={{
              padding: '10px 24px',
              border: 'none',
              borderRadius: 12,
              background: `linear-gradient(135deg, ${COLORS.goldDark}, ${COLORS.gold})`,
              color: COLORS.white,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(212, 175, 55, 0.35)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(212, 175, 55, 0.45)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(212, 175, 55, 0.35)'
            }}
          >
            + 添加环节
          </button>
        </div>

        <div
          className="wedding-plan-layout"
          style={{
            display: 'flex',
            gap: 24,
            alignItems: 'flex-start',
          }}
        >
          <div
            style={{
              width: 280,
              flexShrink: 0,
              background: COLORS.white,
              borderRadius: 16,
              padding: 20,
              boxShadow: '0 2px 12px rgba(107, 91, 85, 0.08)',
            }}
            className="wedding-plan-sidebar"
          >
            <h3
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: COLORS.grayText,
                margin: '0 0 16px',
              }}
            >
              环节预设
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
              }}
            >
              {PRESETS.map((preset) => (
                <div
                  key={preset.title}
                  draggable
                  onDragStart={(e) => handlePresetDragStart(e, preset)}
                  onDragEnd={handlePresetDragEnd}
                  onClick={() => handleAddPreset(preset)}
                  style={{
                    padding: '10px 8px',
                    borderRadius: 12,
                    background: `${preset.color}10`,
                    border: `1px solid ${preset.color}30`,
                    cursor: 'grab',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    userSelect: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = `0 4px 12px ${preset.color}25`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <span style={{ fontSize: 24 }}>{preset.icon}</span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: preset.color,
                      textAlign: 'center',
                      lineHeight: 1.3,
                    }}
                  >
                    {preset.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            ref={timelineRef}
            onDragOver={handleTimelineAreaDragOver}
            onDrop={handleTimelineAreaDrop}
            style={{
              flex: 1,
              minHeight: 400,
              position: 'relative',
            }}
          >
            {timeline.length === 0 && !draggedPreset ? (
              <div
                style={{
                  height: 400,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `${COLORS.pinkLight}30`,
                  borderRadius: 16,
                  border: `2px dashed ${COLORS.pinkDark}`,
                  color: COLORS.grayMuted,
                  fontSize: 16,
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 48 }}>💍</span>
                <span>从左侧拖拽或点击预设添加婚礼环节</span>
              </div>
            ) : (
              <div style={{ position: 'relative', paddingLeft: 80 }}>
                <div
                  style={{
                    position: 'absolute',
                    left: 35,
                    top: 0,
                    bottom: 0,
                    width: 2,
                    background: `linear-gradient(180deg, ${COLORS.pinkDark}, ${COLORS.gold})`,
                    borderRadius: 1,
                  }}
                />

                {timeline.map((item, index) => (
                  <React.Fragment key={item.id}>
                    {dragOverIndex === index && (
                      <div
                        style={{
                          height: 4,
                          borderRadius: 2,
                          background: COLORS.pinkDark,
                          margin: '4px 0',
                          boxShadow: `0 0 8px ${COLORS.pinkDark}60`,
                          transition: 'all 0.2s',
                        }}
                      />
                    )}
                    <div
                      draggable
                      onDragStart={(e) => handleTimelineDragStart(e, index)}
                      onDragOver={(e) => handleTimelineDragOver(e, index)}
                      onDrop={(e) => handleTimelineDrop(e, index)}
                      onDragEnd={handleTimelineDragEnd}
                      style={{
                        position: 'relative',
                        marginBottom: 16,
                        opacity: draggedIndex === index ? 0.3 : 1,
                        transform: draggedIndex === index ? 'scale(0.98)' : 'scale(1)',
                        transition: 'opacity 0.2s, transform 0.2s',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          left: -53,
                          top: 18,
                          fontSize: 14,
                          fontWeight: 600,
                          color: COLORS.grayText,
                          width: 46,
                          textAlign: 'right',
                          fontFamily: 'monospace',
                        }}
                      >
                        {item.time}
                      </div>
                      <div
                        style={{
                          position: 'absolute',
                          left: -6,
                          top: 18,
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          background: item.color,
                          border: `2px solid ${COLORS.white}`,
                          boxShadow: `0 0 0 2px ${item.color}40`,
                          zIndex: 1,
                        }}
                      />
                      <div
                        onDragOver={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleTimelineDragOver(e, index)
                        }}
                        onDrop={(e) => {
                          e.stopPropagation()
                          handleTimelineDrop(e, index)
                        }}
                        style={{
                          padding: '14px 16px',
                          background: COLORS.white,
                          borderRadius: 12,
                          boxShadow: '0 2px 8px rgba(107, 91, 85, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          cursor: 'grab',
                          transition: 'box-shadow 0.25s, transform 0.25s',
                          border: dragOverIndex === index
                            ? `2px dashed ${COLORS.pinkDark}`
                            : '2px solid transparent',
                          background: dragOverIndex === index
                            ? `rgba(232, 168, 184, 0.1)`
                            : COLORS.white,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = '0 8px 24px rgba(107, 91, 85, 0.15)'
                          e.currentTarget.style.transform = 'translateY(-2px)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(107, 91, 85, 0.08)'
                          e.currentTarget.style.transform = 'translateY(0)'
                        }}
                      >
                        <div
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 10,
                            background: `${item.color}15`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 22,
                            flexShrink: 0,
                          }}
                        >
                          {item.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 15,
                              fontWeight: 600,
                              color: COLORS.grayText,
                              marginBottom: 4,
                            }}
                          >
                            {item.title}
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              fontSize: 13,
                              color: COLORS.grayMuted,
                            }}
                          >
                            <span>⏱ {formatDuration(item.duration)}</span>
                            {item.personInCharge && <span>👤 {item.personInCharge}</span>}
                          </div>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            gap: 6,
                            flexShrink: 0,
                          }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenEdit(item)
                            }}
                            style={{
                              width: 32,
                              height: 32,
                              border: 'none',
                              borderRadius: 8,
                              background: `${COLORS.gold}60`,
                              color: COLORS.goldDark,
                              cursor: 'pointer',
                              fontSize: 14,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'background 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = `${COLORS.gold}`
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = `${COLORS.gold}60`
                            }}
                          >
                            ✎
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteItem(item.id)
                            }}
                            style={{
                              width: 32,
                              height: 32,
                              border: 'none',
                              borderRadius: 8,
                              background: '#fee2e2',
                              color: '#ef4444',
                              cursor: 'pointer',
                              fontSize: 14,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'background 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#fecaca'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#fee2e2'
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                ))}

                {dragOverIndex === timeline.length && (
                  <div
                    style={{
                      height: 4,
                      borderRadius: 2,
                      background: COLORS.pinkDark,
                      margin: '4px 0',
                      boxShadow: `0 0 8px ${COLORS.pinkDark}60`,
                    }}
                  />
                )}

                <div
                  onDragOver={(e) => {
                    if (draggedPreset) {
                      e.preventDefault()
                      setDragOverIndex(timeline.length)
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setDragOverIndex(null)
                    const presetData = e.dataTransfer.getData('application/preset')
                    if (presetData) {
                      try {
                        const preset: PresetItem = JSON.parse(presetData)
                        handleAddPreset(preset)
                      } catch { /* ignore */ }
                    }
                    setDraggedPreset(null)
                  }}
                  style={{
                    padding: '20px 16px',
                    border: `2px dashed ${COLORS.grayWarm}`,
                    borderRadius: 12,
                    textAlign: 'center',
                    color: COLORS.grayMuted,
                    fontSize: 13,
                    cursor: draggedPreset ? 'copy' : 'default',
                    transition: 'border-color 0.2s, background 0.2s',
                    background: dragOverIndex === timeline.length
                      ? 'rgba(232, 168, 184, 0.1)'
                      : 'transparent',
                    borderColor: dragOverIndex === timeline.length
                      ? COLORS.pinkDark
                      : COLORS.grayWarm,
                  }}
                >
                  拖拽到此处添加环节
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {editingItem && (
        <>
          <div
            onClick={() => setEditingItem(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(107, 91, 85, 0.3)',
              zIndex: 998,
            }}
          />
          <div
            className="wedding-plan-panel"
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: 380,
              background: COLORS.white,
              boxShadow: '-8px 0 32px rgba(107, 91, 85, 0.15)',
              zIndex: 999,
              padding: 32,
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideInRight 0.3s ease-out',
              overflowY: 'auto',
            }}
          >
            <style>{`
              @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
              }
            `}</style>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 28,
              }}
            >
              <h3
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: COLORS.grayText,
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 24 }}>{editingItem.icon}</span>
                编辑环节
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                style={{
                  width: 32,
                  height: 32,
                  border: 'none',
                  borderRadius: 8,
                  background: '#f5f5f5',
                  cursor: 'pointer',
                  fontSize: 16,
                  color: COLORS.grayMuted,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    color: COLORS.grayText,
                    marginBottom: 8,
                  }}
                >
                  环节名称
                </label>
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: `${editingItem.color}08`,
                    border: `1px solid ${editingItem.color}30`,
                    fontSize: 15,
                    fontWeight: 600,
                    color: editingItem.color,
                  }}
                >
                  {editingItem.icon} {editingItem.title}
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    color: COLORS.grayText,
                    marginBottom: 8,
                  }}
                >
                  开始时间
                </label>
                <input
                  type="time"
                  value={editForm.time}
                  onChange={(e) => setEditForm((f) => ({ ...f, time: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: `1px solid ${COLORS.grayWarm}`,
                    fontSize: 15,
                    color: COLORS.grayText,
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    color: COLORS.grayText,
                    marginBottom: 8,
                  }}
                >
                  时长（分钟）
                </label>
                <input
                  type="number"
                  min={1}
                  max={480}
                  value={editForm.duration}
                  onChange={(e) => setEditForm((f) => ({ ...f, duration: Math.max(1, Number(e.target.value)) }))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: `1px solid ${COLORS.grayWarm}`,
                    fontSize: 15,
                    color: COLORS.grayText,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    color: COLORS.grayText,
                    marginBottom: 8,
                  }}
                >
                  负责人
                </label>
                <input
                  type="text"
                  value={editForm.personInCharge}
                  onChange={(e) => setEditForm((f) => ({ ...f, personInCharge: e.target.value }))}
                  placeholder="输入负责人姓名"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: `1px solid ${COLORS.grayWarm}`,
                    fontSize: 15,
                    color: COLORS.grayText,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    color: COLORS.grayText,
                    marginBottom: 8,
                  }}
                >
                  备注
                </label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="添加备注信息..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: `1px solid ${COLORS.grayWarm}`,
                    fontSize: 14,
                    color: COLORS.grayText,
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    lineHeight: 1.6,
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 12,
                marginTop: 24,
                paddingTop: 20,
                borderTop: `1px solid ${COLORS.grayWarm}40`,
              }}
            >
              <button
                onClick={() => setEditingItem(null)}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  border: `1px solid ${COLORS.grayWarm}`,
                  borderRadius: 10,
                  background: COLORS.white,
                  color: COLORS.grayMuted,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f9f9f9'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = COLORS.white
                }}
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  border: 'none',
                  borderRadius: 10,
                  background: `linear-gradient(135deg, ${COLORS.goldDark}, ${COLORS.gold})`,
                  color: COLORS.white,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(212, 175, 55, 0.35)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(212, 175, 55, 0.45)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(212, 175, 55, 0.35)'
                }}
              >
                保存
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        @media (max-width: 768px) {
          .wedding-plan-sidebar {
            width: 100% !important;
          }
          .wedding-plan-layout {
            flex-direction: column !important;
          }
          .wedding-plan-panel {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  )
}
