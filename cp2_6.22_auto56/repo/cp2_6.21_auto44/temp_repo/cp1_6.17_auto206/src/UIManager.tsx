import React, { FC, useEffect, useMemo, useState } from 'react'
import { makeObservable, observable, action, runInAction } from 'mobx'
import { observer } from 'mobx-react-lite'
import { Eye, Camera, PanelLeft, PanelRight, Sliders, Info } from 'lucide-react'
import { EventBus, WindLevel } from './EventBus'
import { GeoDataSource, SensorPoint, TIME_STEPS, TEMP_MIN, TEMP_MAX } from './GeoDataSource'
import { temperatureToColor } from './Scene3D'

class UIState {
  timeIndex = 0
  humidityMin = 0
  humidityMax = 100
  windLevel: WindLevel = 'breeze'
  selectedSensor: SensorPoint | null = null
  leftCollapsed = false
  rightCollapsed = false
  hoverSensor: SensorPoint | null = null

  constructor() {
    makeObservable(this, {
      timeIndex: observable,
      humidityMin: observable,
      humidityMax: observable,
      windLevel: observable,
      selectedSensor: observable,
      leftCollapsed: observable,
      rightCollapsed: observable,
      hoverSensor: observable,
      setTime: action,
      setHumidity: action,
      setWindLevel: action,
      setSelected: action,
      setHover: action,
      toggleLeft: action,
      toggleRight: action,
    })
  }
  setTime(v: number) { this.timeIndex = v }
  setHumidity(min: number, max: number) { this.humidityMin = min; this.humidityMax = max }
  setWindLevel(v: WindLevel) { this.windLevel = v }
  setSelected(s: SensorPoint | null) { this.selectedSensor = s }
  setHover(s: SensorPoint | null) { this.hoverSensor = s }
  toggleLeft() { this.leftCollapsed = !this.leftCollapsed }
  toggleRight() { this.rightCollapsed = !this.rightCollapsed }
}

const TimeSlider: FC<{ state: UIState; eventBus: EventBus }> = observer(({ state, eventBus }) => {
  const ticks = Array.from({ length: TIME_STEPS }, (_, i) => i)
  const percent = (state.timeIndex / (TIME_STEPS - 1)) * 100
  return (
    <div style={{
      position: 'absolute', bottom: 28, left: '15%', width: '70%', zIndex: 10,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    }}>
      <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
        {ticks.map((i) => (
          <span key={i} style={{
            color: state.timeIndex === i ? '#E6EDF3' : '#8B949E',
            fontSize: 12, fontFamily: 'monospace', fontWeight: state.timeIndex === i ? 600 : 400,
            transition: 'opacity 0.2s ease-out', opacity: state.timeIndex === i ? 1 : 0.7,
          }}>
            T{i}
          </span>
        ))}
      </div>
      <div style={{
        position: 'relative', width: '100%', height: 6, background: '#333',
        borderRadius: 3, cursor: 'pointer',
      }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
          const idx = Math.round(ratio * (TIME_STEPS - 1))
          runInAction(() => state.setTime(idx))
          eventBus.emit('time:change', idx)
        }}
      >
        <div style={{
          position: 'absolute', left: 0, top: 0, height: '100%',
          width: `${percent}%`, background: '#00BFFF', borderRadius: 3,
        }} />
        <div style={{
          position: 'absolute', top: '50%', left: `${percent}%`,
          transform: 'translate(-50%, -50%)', width: 18, height: 18,
          background: '#00BFFF', borderRadius: '50%', boxShadow: '0 0 8px rgba(0,191,255,0.6)',
          transition: 'opacity 0.2s ease-out', opacity: 1,
        }} />
      </div>
      <div style={{ color: '#8B949E', fontSize: 12 }}>时间轴 — 拖动滑块切换观测时刻</div>
    </div>
  )
})

const ColorLegend: FC = () => {
  const stops = [0, 0.25, 0.5, 0.75, 1]
  const labels = stops.map((s) => Math.round(TEMP_MIN + (TEMP_MAX - TEMP_MIN) * s))
  return (
    <div style={{
      position: 'absolute', top: 20, left: 20, zIndex: 10,
      background: '#161B22', border: '1px solid #30363D', borderRadius: 8,
      padding: '12px 10px', display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{ position: 'relative', width: 20, height: 200, borderRadius: 3, overflow: 'hidden',
        background: 'linear-gradient(to top, #0000FF 0%, #00FFFF 25%, #FFFF00 50%, #FF8800 75%, #FF0000 100%)',
      }} />
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 200 }}>
        {labels.slice().reverse().map((v, i) => (
          <span key={i} style={{ color: '#8B949E', fontSize: 12, fontFamily: 'monospace', lineHeight: 1 }}>
            {v}°C
          </span>
        ))}
      </div>
    </div>
  )
}

const Toolbar: FC<{ state: UIState; eventBus: EventBus }> = observer(({ state, eventBus }) => {
  const btn = (icon: React.ReactNode, tip: string, onClick: () => void) => (
    <button
      title={tip}
      onClick={onClick}
      style={{
        width: 36, height: 36, borderRadius: '50%', background: '#2A2A3A',
        border: '1px solid #555', color: '#E6EDF3', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.2s ease-out, opacity 0.2s ease-out', opacity: 0.9,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = '#3A3A5A'; e.currentTarget.style.opacity = '1' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = '#2A2A3A'; e.currentTarget.style.opacity = '0.9' }}
    >
      {icon}
    </button>
  )
  return (
    <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10, display: 'flex', gap: 10 }}>
      {btn(<Eye size={18} />, '重置视角', () => eventBus.emit('camera:reset', undefined))}
      {btn(<Camera size={18} />, '导出截图', () => eventBus.emit('screenshot:export', undefined))}
      {btn(<PanelLeft size={18} />, state.leftCollapsed ? '展开左面板' : '折叠左面板', () => state.toggleLeft())}
      {btn(<PanelRight size={18} />, state.rightCollapsed ? '展开右面板' : '折叠右面板', () => state.toggleRight())}
    </div>
  )
})

const LeftPanel: FC<{ state: UIState; eventBus: EventBus }> = observer(({ state, eventBus }) => {
  if (state.leftCollapsed) return null
  const windOptions: { value: WindLevel; label: string }[] = [
    { value: 'calm', label: '无风 (≤1.0)' },
    { value: 'breeze', label: '微风 (1.0~3.5)' },
    { value: 'strong', label: '强风 (>3.5)' },
  ]
  const changeHumidity = (min: number, max: number) => {
    const clampedMin = Math.max(0, Math.min(100, min))
    const clampedMax = Math.max(0, Math.min(100, max))
    const [lo, hi] = clampedMin <= clampedMax ? [clampedMin, clampedMax] : [clampedMax, clampedMin]
    runInAction(() => state.setHumidity(lo, hi))
    eventBus.emit('filter:change', { humidityRange: [lo, hi], windLevel: state.windLevel })
  }
  return (
    <div style={{
      position: 'absolute', top: 20, left: state.leftCollapsed ? 52 : 20, width: 260, zIndex: 9,
      background: '#161B22', border: '1px solid #30363D', borderRadius: 8, padding: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Sliders size={14} color="#8B949E" />
        <span style={{ color: '#E6EDF3', fontSize: 14, fontWeight: 600 }}>参数筛选</span>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ width: 160, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ color: '#E6EDF3', fontSize: 12, marginBottom: 6 }}>
              湿度范围 <span style={{ color: '#00BFFF', fontFamily: 'monospace' }}>{state.humidityMin}% ~ {state.humidityMax}%</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#8B949E', fontSize: 11, width: 22 }}>最小</span>
                <input type="range" min={0} max={100} value={state.humidityMin}
                  onChange={(e) => changeHumidity(Number(e.target.value), state.humidityMax)}
                  style={{ flex: 1, accentColor: '#00BFFF', cursor: 'pointer' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#8B949E', fontSize: 11, width: 22 }}>最大</span>
                <input type="range" min={0} max={100} value={state.humidityMax}
                  onChange={(e) => changeHumidity(state.humidityMin, Number(e.target.value))}
                  style={{ flex: 1, accentColor: '#00BFFF', cursor: 'pointer' }} />
              </div>
            </div>
          </div>
          <div>
            <div style={{ color: '#E6EDF3', fontSize: 12, marginBottom: 6 }}>风速过滤</div>
            <select value={state.windLevel}
              onChange={(e) => {
                const v = e.target.value as WindLevel
                runInAction(() => state.setWindLevel(v))
                eventBus.emit('filter:change', {
                  humidityRange: [state.humidityMin, state.humidityMax], windLevel: v,
                })
              }}
              style={{
                width: '100%', background: '#0D1117', color: '#E6EDF3',
                border: '1px solid #30363D', borderRadius: 6, padding: '6px 8px', fontSize: 12,
                cursor: 'pointer', transition: 'opacity 0.2s ease-out',
              }}
            >
              {windOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ width: 100, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ color: '#8B949E', fontSize: 11 }}>当前时刻</div>
          <div style={{ color: '#00BFFF', fontSize: 20, fontFamily: 'monospace', fontWeight: 700 }}>
            T{state.timeIndex}
          </div>
          <div style={{ borderTop: '1px solid #30363D', margin: '4px 0' }} />
          <div style={{ color: '#8B949E', fontSize: 11 }}>传感器</div>
          <div style={{ color: '#E6EDF3', fontSize: 16, fontFamily: 'monospace' }}>
            {state.selectedSensor ? `#${state.selectedSensor.id}` : '—'}
          </div>
          {state.hoverSensor && (
            <>
              <div style={{ borderTop: '1px solid #30363D', margin: '4px 0' }} />
              <div style={{ color: '#8B949E', fontSize: 11 }}>悬停温度</div>
              <div style={{ color: '#FFAA00', fontSize: 16, fontFamily: 'monospace', fontWeight: 600 }}>
                {state.hoverSensor.temperature[state.timeIndex].toFixed(1)}°C
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
})

const MiniBar: FC<{ label: string; value: number; unit: string; color: string }> = ({ label, value, unit, color }) => {
  const pct = Math.max(0, Math.min(1, value))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: '#8B949E', fontSize: 11 }}>{label}</span>
        <span style={{ color: '#E6EDF3', fontSize: 12, fontFamily: 'monospace' }}>
          {value.toFixed(unit === '%' || unit === 'hPa' ? 1 : 2)}{unit}
        </span>
      </div>
      <div style={{ height: 4, background: '#0D1117', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${pct * 100}%`, height: '100%', background: color, borderRadius: 2 }} />
      </div>
    </div>
  )
}

const RightPanel: FC<{ state: UIState }> = observer(({ state }) => {
  if (state.rightCollapsed) return null
  const s = state.selectedSensor
  return (
    <div style={{
      position: 'absolute', top: 80, right: 20, width: 320, zIndex: 9,
      background: '#161B22', border: '1px solid #30363D', borderRadius: 8, padding: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Info size={14} color="#8B949E" />
        <span style={{ color: '#E6EDF3', fontSize: 14, fontWeight: 600 }}>传感器详情</span>
      </div>
      {!s ? (
        <div style={{ color: '#8B949E', fontSize: 12, padding: '20px 0', textAlign: 'center' }}>
          点击地图上的黄色传感器球查看详细数据
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ color: '#E6EDF3', fontSize: 14, fontWeight: 600 }}>传感器 #{s.id}</span>
              <div style={{ color: '#8B949E', fontSize: 12 }}>
                坐标 ({s.gridX}, {s.gridZ})
              </div>
            </div>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: `rgb(${temperatureToColor(s.temperature[state.timeIndex]).r * 255}, ${temperatureToColor(s.temperature[state.timeIndex]).g * 255}, ${temperatureToColor(s.temperature[state.timeIndex]).b * 255})`,
              boxShadow: '0 0 10px rgba(255,170,0,0.4)',
            }} />
          </div>
          <div style={{ borderTop: '1px solid #30363D' }} />
          {Array.from({ length: TIME_STEPS }).map((_, t) => (
            <div key={t} style={{
              background: state.timeIndex === t ? '#1C2128' : 'transparent',
              border: state.timeIndex === t ? '1px solid #30363D' : '1px solid transparent',
              borderRadius: 6, padding: 10, display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  color: state.timeIndex === t ? '#00BFFF' : '#8B949E',
                  fontSize: 12, fontWeight: 700, fontFamily: 'monospace',
                }}>
                  T{t}
                </span>
                {state.timeIndex === t && (
                  <span style={{ color: '#00BFFF', fontSize: 10, padding: '1px 6px',
                    background: 'rgba(0,191,255,0.15)', borderRadius: 4 }}>当前</span>
                )}
              </div>
              <MiniBar label="温度" value={(s.temperature[t] - TEMP_MIN) / (TEMP_MAX - TEMP_MIN)}
                unit="°C" color="#FF6B6B" />
              <MiniBar label="湿度" value={s.humidity[t] / 100} unit="%" color="#4DA8FF" />
              <MiniBar label="风速" value={Math.min(1, s.windSpeed[t] / 6)} unit="m/s" color="#6BFFA5" />
              <MiniBar label="气压" value={(s.pressure[t] - 990) / 40} unit="hPa" color="#D48CFF" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
})

interface UIManagerProps {
  eventBus: EventBus
  dataSource: GeoDataSource
}

export const UIManager: FC<UIManagerProps> = ({ eventBus, dataSource }) => {
  const state = useMemo(() => new UIState(), [])
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight })

  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const narrow = viewport.w < 1280
    runInAction(() => {
      state.leftCollapsed = narrow
      state.rightCollapsed = narrow
    })
  }, [viewport.w, state])

  useEffect(() => {
    const unsub1 = eventBus.on('sensor:click', (s) => runInAction(() => state.setSelected(s)))
    const unsub2 = eventBus.on('sensor:hover', ({ point, hovering }) =>
      runInAction(() => state.setHover(hovering ? point : null)),
    )
    return () => { unsub1(); unsub2() }
  }, [eventBus, state])

  useEffect(() => {
    const unsub = eventBus.on('screenshot:export', () => {
      setTimeout(() => {
        const canvas = document.querySelector('canvas')
        if (!canvas) return
        const url = canvas.toDataURL('image/png')
        const a = document.createElement('a')
        a.href = url
        a.download = `heat-island-T${state.timeIndex}.png`
        a.click()
      }, 50)
    })
    return unsub
  }, [eventBus, state.timeIndex])

  return (
    <>
      <ColorLegend />
      <Toolbar state={state} eventBus={eventBus} />
      <LeftPanel state={state} eventBus={eventBus} />
      <RightPanel state={state} />
      <TimeSlider state={state} eventBus={eventBus} />
    </>
  )
}

export default UIManager
