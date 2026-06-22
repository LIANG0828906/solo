import { useEffect, useState } from 'react'
import { useProjectStore, type EffectType, type Clip } from '@/stores/projectStore'
import { clamp } from '@/utils/wavEncoder'

const EFFECT_TYPES: { key: EffectType; label: string }[] = [
  { key: 'fadeIn', label: '淡入' },
  { key: 'fadeOut', label: '淡出' },
  { key: 'echo', label: '回声' },
  { key: 'lowpass', label: '低通' },
  { key: 'highpass', label: '高通' }
]

function defaultParams(type: EffectType): Record<string, number> {
  switch (type) {
    case 'fadeIn':
    case 'fadeOut': return { duration: 1 }
    case 'echo': return { delay: 0.25, feedback: 0.4 }
    case 'lowpass':
    case 'highpass': return { frequency: 5000 }
  }
}

export default function EffectPanel() {
  const { effectPanelClipId, openEffectPanel, tracks, updateEffect, removeEffect } = useProjectStore()
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [activeType, setActiveType] = useState<EffectType | null>(null)
  const [params, setParams] = useState<Record<string, number>>({})
  const [clip, setClip] = useState<Clip | null>(null)

  useEffect(() => {
    if (!effectPanelClipId) { setClip(null); return }
    let found: Clip | null = null
    for (const t of tracks) {
      for (const c of t.clips) if (c.id === effectPanelClipId) found = c
    }
    setClip(found)
    if (found) {
      const rect = document.getElementById(`clip-${found.id}`)?.getBoundingClientRect()
      if (rect) {
        setPos({
          x: clamp(rect.right + 10, 10, window.innerWidth - 300),
          y: clamp(rect.top, 10, window.innerHeight - 400)
        })
      }
      if (!activeType && found.effects.length > 0) {
        const e = found.effects[0]
        setActiveType(e.type)
        setParams({ ...e.params })
      } else if (!activeType) {
        setActiveType('fadeIn')
        setParams(defaultParams('fadeIn'))
      }
    }
  }, [effectPanelClipId, tracks])

  if (!effectPanelClipId || !clip) return null

  function selectType(t: EffectType) {
    setActiveType(t)
    const existing = clip.effects.find((e) => e.type === t)
    setParams(existing ? { ...existing.params } : defaultParams(t))
  }

  function confirm() {
    if (!activeType) return
    updateEffect(clip.id, activeType, params)
    openEffectPanel(null)
  }

  function removeActive() {
    if (!activeType) return
    removeEffect(clip.id, activeType)
    openEffectPanel(null)
  }

  function renderParam(key: string, label: string, min: number, max: number, step = 0.01, unit = '') {
    return (
      <div className="param-row">
        <div className="param-label">
          <span>{label}</span>
          <span className="param-value">{params[key]?.toFixed?.(2) ?? params[key]}{unit}</span>
        </div>
        <input
          className="param-slider"
          type="range"
          min={min}
          max={max}
          step={step}
          value={params[key] ?? min}
          onChange={(e) => setParams({ ...params, [key]: Number(e.target.value) })}
        />
      </div>
    )
  }

  return (
    <div className="effect-panel" style={{ left: pos.x, top: pos.y }}>
      <div className="effect-title">🎛 效果 · {clip.name}</div>
      <div className="effect-type-tabs">
        {EFFECT_TYPES.map((t) => (
          <button
            key={t.key}
            className={`effect-tab ${activeType === t.key ? 'active' : ''}`}
            onClick={() => selectType(t.key)}
            style={{ opacity: clip.effects.some((e) => e.type === t.key) ? 1 : 0.75 }}
          >
            {t.label}{clip.effects.some((e) => e.type === t.key) ? ' ✓' : ''}
          </button>
        ))}
      </div>

      {activeType === 'fadeIn' && renderParam('duration', '时长', 0, 3, 0.05, 's')}
      {activeType === 'fadeOut' && renderParam('duration', '时长', 0, 3, 0.05, 's')}
      {activeType === 'echo' && (
        <>
          {renderParam('delay', '延迟时间', 0.1, 0.5, 0.01, 's')}
          {renderParam('feedback', '反馈量', 0, 0.8, 0.01)}
        </>
      )}
      {(activeType === 'lowpass' || activeType === 'highpass') && (
        renderParam('frequency', '截止频率', 20, 20000, 10, 'Hz')
      )}

      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
        已添加 {clip.effects.length}/2 个效果
      </div>

      <div className="effect-panel-actions">
        <button className="btn-cancel" onClick={() => openEffectPanel(null)}>取消</button>
        {clip.effects.some((e) => e.type === activeType) && (
          <button
            className="btn-cancel"
            style={{ background: 'rgba(233,69,96,0.25)', color: '#fff' }}
            onClick={removeActive}
          >
            移除
          </button>
        )}
        <button className="btn-confirm" onClick={confirm}>确认</button>
      </div>
    </div>
  )
}
