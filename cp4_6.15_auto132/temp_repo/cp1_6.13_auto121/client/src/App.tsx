import React, { useState, useEffect, useRef, useCallback } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { LightScene } from './scene'
import { SocketClient } from './socketClient'
import {
  LightConfig,
  ViewerInfo,
  PresetType,
  PRESET_COLORS,
  DEFAULT_LIGHTS
} from './types'

/* -------------------- Slider Component -------------------- */
interface SliderProps {
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  isTemp?: boolean
  onChange: (v: number) => void
  onChangeEnd?: (v: number) => void
}

const Slider: React.FC<SliderProps> = ({ value, min, max, step = 1, unit = '', isTemp = false, onChange, onChangeEnd }) => {
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const pct = ((value - min) / (max - min)) * 100

  const getValFromEvent = useCallback((clientX: number): number => {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return value
    let ratio = (clientX - rect.left) / rect.width
    ratio = Math.max(0, Math.min(1, ratio))
    let v = min + ratio * (max - min)
    if (step > 1) v = Math.round(v / step) * step
    return Math.max(min, Math.min(max, v))
  }, [min, max, step, value])

  useEffect(() => {
    if (!dragging) return
    const onMove = (e: MouseEvent | TouchEvent) => {
      const cx = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
      onChange(getValFromEvent(cx))
    }
    const onUp = (e: MouseEvent | TouchEvent) => {
      setDragging(false)
      const cx = 'changedTouches' in e ? (e as TouchEvent).changedTouches[0].clientX : (e as MouseEvent).clientX
      onChangeEnd?.(getValFromEvent(cx))
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }
  }, [dragging, getValFromEvent, onChange, onChangeEnd])

  return (
    <div className="slider-group">
      <div className="slider-label-row">
        <span className="slider-label">
          {isTemp ? '色温' : '亮度'}
        </span>
        <span className="slider-value">
          {Math.round(value)}{unit}
        </span>
      </div>
      <div
        ref={trackRef}
        className={`slider-track ${dragging ? 'dragging' : ''} ${isTemp ? 'temp-slider' : ''}`}
        onMouseDown={(e) => {
          setDragging(true)
          onChange(getValFromEvent(e.clientX))
        }}
        onTouchStart={(e) => {
          setDragging(true)
          onChange(getValFromEvent(e.touches[0].clientX))
        }}
      >
        <div className="slider-fill" style={{ width: `${pct}%` }} />
        <div className="slider-thumb" style={{ left: `${pct}%` }} />
      </div>
    </div>
  )
}

/* -------------------- Light Card -------------------- */
interface LightCardProps {
  light: LightConfig
  onChange: (partial: Partial<LightConfig>) => void
  onChangeEnd: () => void
}

const LightCard: React.FC<LightCardProps> = ({ light, onChange, onChangeEnd }) => {
  const displayIdx = String(light.id + 1).padStart(2, '0')

  return (
    <div className="light-card">
      <div className="light-header">
        <div
          className="light-icon"
          style={{
            background: `${light.color}22`,
            color: light.color,
            border: `1px solid ${light.color}55`
          }}
        >
          {displayIdx}
        </div>
        <div className="light-info">
          <div className="light-name">Spotlight {displayIdx}</div>
          <div className="light-status">
            {light.brightness}% · {light.colorTemp}K
          </div>
        </div>
      </div>

      <div className="color-picker">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            className={`color-swatch ${light.color === c ? 'selected' : ''}`}
            style={{ background: c, color: c }}
            onClick={() => {
              onChange({ color: c })
              onChangeEnd()
            }}
            aria-label={`color ${c}`}
          />
        ))}
      </div>

      <Slider
        value={light.brightness}
        min={0}
        max={100}
        unit="%"
        onChange={(v) => onChange({ brightness: v })}
        onChangeEnd={onChangeEnd}
      />

      <Slider
        value={light.colorTemp}
        min={3000}
        max={6500}
        unit="K"
        isTemp
        onChange={(v) => onChange({ colorTemp: v })}
        onChangeEnd={onChangeEnd}
      />
    </div>
  )
}

/* -------------------- Presets -------------------- */
interface PresetsProps {
  onApply: (p: PresetType) => void
}

const PRESETS: Array<{ key: PresetType; name: string; icon: string; className: string }> = [
  { key: 'warmDusk', name: '温暖黄昏', icon: '🌅', className: 'warm-dusk' },
  { key: 'coolTech', name: '冷色科技', icon: '💎', className: 'cool-tech' },
  { key: 'softMorning', name: '柔和晨光', icon: '🌤️', className: 'soft-morning' }
]

const Presets: React.FC<PresetsProps> = ({ onApply }) => (
  <div className="presets-grid">
    {PRESETS.map((p) => (
      <button
        key={p.key}
        className={`preset-btn ${p.className}`}
        onClick={() => onApply(p.key)}
      >
        <span className="preset-icon">{p.icon}</span>
        <span className="preset-name">{p.name}</span>
      </button>
    ))}
  </div>
)

/* -------------------- Main App -------------------- */
const App: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<LightScene | null>(null)
  const socketRef = useRef<SocketClient | null>(null)
  const debounceRef = useRef<number | null>(null)

  const [entered, setEntered] = useState(false)
  const [roomCode, setRoomCode] = useState('')
  const [inputRoom, setInputRoom] = useState('')
  const [inputName, setInputName] = useState('')
  const [role, setRole] = useState<'artist' | 'viewer'>('viewer')
  const [lights, setLights] = useState<LightConfig[]>(
    JSON.parse(JSON.stringify(DEFAULT_LIGHTS))
  )
  const [viewers, setViewers] = useState<ViewerInfo[]>([])
  const [panelCollapsed, setPanelCollapsed] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2200)
  }, [])

  /* ---------- Socket init ---------- */
  useEffect(() => {
    if (!entered) return
    const client = new SocketClient({
      onLightsUpdate: (newLights, fromSelf) => {
        setLights(JSON.parse(JSON.stringify(newLights)))
        sceneRef.current?.updateLights(newLights, !fromSelf)
      },
      onPresetApplied: (newLights, _preset, fromSelf) => {
        setLights(JSON.parse(JSON.stringify(newLights)))
        sceneRef.current?.updateLights(newLights, true)
        if (!fromSelf) showToast('已应用预设场景')
      },
      onViewersUpdate: (vs) => setViewers(vs),
      onRoomJoined: (data) => {
        setRoomCode(data.roomCode)
        setLights(JSON.parse(JSON.stringify(data.lights)))
        setViewers(data.viewers)
        sceneRef.current?.updateLights(data.lights, false)
        showToast(data.isNewRoom ? '房间已创建' : '已加入房间')
      },
      onRoomLeft: () => {
        setRoomCode('')
        setEntered(false)
      },
      onError: (e) => showToast(e.message || '发生错误')
    })
    client.connect()
    socketRef.current = client
    return () => {
      client.disconnect()
      socketRef.current = null
    }
  }, [entered, showToast])

  /* ---------- Scene init ---------- */
  useEffect(() => {
    if (!canvasRef.current) return
    const scene = new LightScene(canvasRef.current)
    sceneRef.current = scene
    scene.updateLights(lights, false)
    return () => {
      scene.dispose()
      sceneRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ---------- Join room ---------- */
  const handleEnter = () => {
    const name = inputName.trim() || `观众${Math.floor(Math.random() * 900 + 100)}`
    setInputName(name)
    socketRef.current?.joinRoom(inputRoom.trim() || null, name, role)
    setEntered(true)
  }

  /* ---------- Copy room code ---------- */
  const handleCopy = async () => {
    if (!roomCode) return
    try {
      await navigator.clipboard.writeText(roomCode)
      showToast('房间码已复制')
    } catch {
      showToast(`房间码：${roomCode}`)
    }
  }

  /* ---------- Light update (debounced to ~300ms) ---------- */
  const scheduleBroadcast = useCallback(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      socketRef.current?.updateLights(lights)
      debounceRef.current = null
    }, 300)
  }, [lights])

  const handleLightChange = useCallback((id: number, partial: Partial<LightConfig>) => {
    setLights((prev) => {
      const next = prev.map((l) => (l.id === id ? { ...l, ...partial } : l))
      const changed = next.find((l) => l.id === id)
      if (changed) sceneRef.current?.updateLights([changed], true)
      return next
    })
    scheduleBroadcast()
  }, [scheduleBroadcast])

  const handleLightChangeEnd = useCallback((id: number) => {
    sceneRef.current?.triggerGlow(id)
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    socketRef.current?.updateLights(lights)
  }, [lights])

  const handlePreset = useCallback((p: PresetType) => {
    socketRef.current?.applyPreset(p)
    showToast('正在切换预设场景...')
  }, [showToast])

  const viewerUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?room=${roomCode}`
    : ''

  const getAvatarColor = (id: string) => {
    const idx = id.charCodeAt(id.length - 1) % PRESET_COLORS.length
    return PRESET_COLORS[idx]
  }

  /* ---------- Entry Screen ---------- */
  if (!entered) {
    return (
      <div className="entry-screen">
        <div className="entry-card">
          <div className="entry-header">
            <div className="entry-title">LightCanvas</div>
            <div className="entry-subtitle">
              远程展品光照控制平台 · 沉浸式三维交互艺术展
            </div>
          </div>

          <div className="role-tabs">
            <button
              className={`role-tab ${role === 'viewer' ? 'active' : ''}`}
              onClick={() => setRole('viewer')}
            >
              👁️ 观众
            </button>
            <button
              className={`role-tab ${role === 'artist' ? 'active' : ''}`}
              onClick={() => setRole('artist')}
            >
              🎨 艺术家
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">您的昵称</label>
            <input
              className="form-input"
              type="text"
              placeholder={`请输入${role === 'artist' ? '艺术家' : '观众'}昵称`}
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEnter()}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              房间码 {role === 'artist' ? '(留空创建新房间)' : '(必填)'}
            </label>
            <input
              className="form-input"
              type="text"
              placeholder="输入6位房间码或留空创建"
              value={inputRoom}
              maxLength={6}
              onChange={(e) => setInputRoom(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleEnter()}
              style={{ textTransform: 'uppercase', fontFamily: "'SF Mono', Menlo, Consolas, monospace", letterSpacing: '0.15em' }}
            />
          </div>

          <button className="primary-btn" onClick={handleEnter}>
            {role === 'artist' ? (inputRoom.trim() ? '加入房间' : '创建展览房间') : '进入展厅'}
          </button>

          <div className="divider">或</div>

          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
            💡 观众端支持移动端<br/>
            进入后可扫码分享给他人
          </div>
        </div>
      </div>
    )
  }

  /* ---------- Main View ---------- */
  return (
    <div className="app-container">
      <div ref={canvasRef} className="canvas-container" />

      {/* Top Nav */}
      <div className="top-nav">
        <div className="nav-left">
          <div className="app-title">LightCanvas</div>
          {roomCode && (
            <div className="room-code-container">
              <span className="room-code-label">房间码</span>
              <span className="room-code-value" onClick={handleCopy}>{roomCode}</span>
              <button className="copy-btn" onClick={handleCopy}>复制</button>
            </div>
          )}
        </div>
        <div className="nav-right">
          <div className="online-count">
            <span className="pulse-dot" />
            <span className="online-label">在线</span>
            <span className="online-num">{viewers.length}</span>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className={`control-panel ${panelCollapsed ? 'collapsed' : ''}`}>
        <div className="panel-header">
          <div className="panel-title">光照控制台</div>
          <button
            className="collapse-btn"
            onClick={() => setPanelCollapsed((c) => !c)}
            title={panelCollapsed ? '展开' : '折叠'}
          >
            {panelCollapsed ? '◀' : '▶'}
          </button>
        </div>

        {panelCollapsed ? (
          <div className="collapsed-icons">
            {lights.map((l) => (
              <div
                key={l.id}
                className="collapsed-icon"
                onClick={() => setPanelCollapsed(false)}
                style={{
                  background: `${l.color}22`,
                  color: l.color,
                  border: `1px solid ${l.color}55`,
                  opacity: l.brightness / 120 + 0.2
                }}
              >
                {String(l.id + 1).padStart(2, '0')}
              </div>
            ))}
          </div>
        ) : (
          <div className="panel-content">
            <div className="section">
              <div className="section-title">预设场景</div>
              <Presets onApply={handlePreset} />
            </div>

            <div className="section">
              <div className="section-title">射灯控制</div>
              {lights.map((light) => (
                <LightCard
                  key={light.id}
                  light={light}
                  onChange={(partial) => handleLightChange(light.id, partial)}
                  onChangeEnd={() => handleLightChangeEnd(light.id)}
                />
              ))}
            </div>

            <div className="section">
              <div className="section-title">
                在线观众 ({viewers.length}/10)
              </div>
              <div className="viewer-list">
                {viewers.map((v) => (
                  <div key={v.id} className="viewer-item">
                    <div
                      className="viewer-avatar"
                      style={{
                        background: `${getAvatarColor(v.id)}33`,
                        color: getAvatarColor(v.id),
                        border: `1px solid ${getAvatarColor(v.id)}55`
                      }}
                    >
                      {v.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="viewer-name">{v.name}</div>
                    <span className={`viewer-role ${v.role}`}>
                      {v.role === 'artist' ? '艺术家' : '观众'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {role === 'artist' && roomCode && (
              <div className="section">
                <div className="section-title">观众二维码</div>
                <div className="qr-section">
                  <QRCodeSVG
                    value={viewerUrl}
                    size={140}
                    bgColor="transparent"
                    fgColor="#ffffff"
                    level="M"
                    includeMargin
                  />
                  <div className="qr-label">
                    扫描二维码即可进入展厅<br/>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: 10 }}>
                      {viewerUrl}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  )
}

export default App
