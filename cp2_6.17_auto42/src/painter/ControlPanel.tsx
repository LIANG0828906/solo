import React, { useRef, useState, useEffect } from 'react'
import { useAudioStore, PRESETS, AudioSourceType } from '@/store/AudioStore'
import type { ParticleCanvasHandle } from './ParticleCanvas'
import { AudioEngine } from '@/audio/AudioEngine'

interface ControlPanelProps {
  canvasRef: React.RefObject<ParticleCanvasHandle>
}

const MicIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke={active ? '#3FB950' : '#C9D1D9'} strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: 'all 0.2s ease' }}>
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
)

const FileIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke={active ? '#58A6FF' : '#C9D1D9'} strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: 'all 0.2s ease' }}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
)

const ClearIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="#C9D1D9" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
  </svg>
)

const SaveIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="#C9D1D9" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
)

const StopIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#C9D1D9">
    <rect x="6" y="6" width="12" height="12" rx="2"/>
  </svg>
)

export const ControlPanel: React.FC<ControlPanelProps> = ({ canvasRef }) => {
  const volume = useAudioStore(s => s.volume)
  const sourceType = useAudioStore(s => s.sourceType)
  const presetKey = useAudioStore(s => s.presetKey)
  const setPresetKey = useAudioStore(s => s.setPresetKey)
  const setSourceType = useAudioStore(s => s.setSourceType)
  const beat = useAudioStore(s => s.beat)
  const beatTimestamp = useAudioStore(s => s.beatTimestamp)

  const audioEngineRef = useRef<AudioEngine | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [micActive, setMicActive] = useState(false)
  const [fileActive, setFileActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [beatPulse, setBeatPulse] = useState(false)

  useEffect(() => {
    audioEngineRef.current = new AudioEngine()
    return () => {
      audioEngineRef.current?.destroy()
    }
  }, [])

  useEffect(() => {
    setMicActive(sourceType === 'mic')
    setFileActive(sourceType === 'file')
  }, [sourceType])

  useEffect(() => {
    if (beat) {
      setBeatPulse(true)
      const timer = setTimeout(() => setBeatPulse(false), 150)
      return () => clearTimeout(timer)
    }
  }, [beat, beatTimestamp])

  const handleMicToggle = async () => {
    setError(null)
    if (micActive) {
      audioEngineRef.current?.stop()
      setSourceType(null)
      setMicActive(false)
    } else {
      try {
        await audioEngineRef.current?.startMicrophone()
      } catch (err) {
        setError('无法访问麦克风，请检查权限设置')
      }
    }
  }

  const handleFileClick = () => {
    setError(null)
    if (fileActive) {
      audioEngineRef.current?.stop()
      setSourceType(null)
      setFileActive(false)
    } else {
      fileInputRef.current?.click()
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await audioEngineRef.current?.startFile(file)
    } catch (err) {
      setError('音频文件加载失败')
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleStop = () => {
    audioEngineRef.current?.stop()
    setSourceType(null)
    setMicActive(false)
    setFileActive(false)
    setError(null)
  }

  const handleClear = () => {
    canvasRef.current?.clearCanvas()
  }

  const handleSave = () => {
    canvasRef.current?.saveScreenshot()
  }

  const volumeHeight = Math.max(2, (volume / 100) * 120)

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <h1 style={styles.title}>SoundCanvas</h1>
        <p style={styles.subtitle}>音频可视化画布</p>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionLabel}>音频输入</div>
        <div style={styles.inputButtonGroup}>
          <button
            onClick={handleMicToggle}
            style={{
              ...styles.inputButton,
              ...(micActive ? styles.inputButtonActive : {}),
              boxShadow: micActive ? '0 0 12px rgba(63, 185, 80, 0.4)' : 'none',
            }}
          >
            <MicIcon active={micActive} />
            <span style={{ ...styles.inputButtonText, color: micActive ? '#3FB950' : '#C9D1D9' }}>
              麦克风
            </span>
          </button>

          <button
            onClick={handleFileClick}
            style={{
              ...styles.inputButton,
              ...(fileActive ? styles.inputButtonFileActive : {}),
              boxShadow: fileActive ? '0 0 12px rgba(88, 166, 255, 0.4)' : 'none',
            }}
          >
            <FileIcon active={fileActive} />
            <span style={{ ...styles.inputButtonText, color: fileActive ? '#58A6FF' : '#C9D1D9' }}>
              上传文件
            </span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>

        {sourceType && (
          <button onClick={handleStop} style={styles.stopButton}>
            <StopIcon />
            <span>停止输入</span>
          </button>
        )}

        {error && <div style={styles.error}>{error}</div>}
      </div>

      <div style={styles.section}>
        <div style={styles.sectionLabel}>音量</div>
        <div style={styles.volumeContainer}>
          <div style={styles.volumeBarOuter}>
            <div
              style={{
                ...styles.volumeBarInner,
                height: `${volumeHeight}px`,
                background: `linear-gradient(to top, #58A6FF, ${volume > 70 ? '#FF6B6B' : '#56D364'})`,
                transform: beatPulse ? 'scaleX(1.3)' : 'scaleX(1)',
                boxShadow: beatPulse ? '0 0 10px rgba(255, 107, 107, 0.6)' : 'none',
              }}
            />
          </div>
          <div style={styles.volumeLabels}>
            <span>100</span>
            <span>50</span>
            <span>0</span>
          </div>
          <div style={styles.volumeValue}>{Math.round(volume)}%</div>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionLabel}>粒子预设</div>
        <select
          value={presetKey}
          onChange={(e) => setPresetKey(e.target.value)}
          style={styles.select}
        >
          {Object.entries(PRESETS).map(([key, preset]) => (
            <option key={key} value={key}>{preset.name}</option>
          ))}
        </select>
        <div style={getPresetPreviewStyle(presetKey)}>
          {Array.from({ length: 5 }).map((_, i) => {
            const preset = PRESETS[presetKey]
            const hueRange = preset.hueEnd - preset.hueStart
            const hue = preset.hueStart + (i / 4) * hueRange
            return (
              <div
                key={i}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: `hsl(${hue}, ${preset.saturation}%, ${preset.value}%)`,
                  boxShadow: `0 0 8px hsla(${hue}, ${preset.saturation}%, ${preset.value}%, 0.5)`,
                }}
              />
            )
          })}
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.actionButtons}>
          <button onClick={handleClear} style={styles.actionButton}>
            <ClearIcon />
            <span>清空画布</span>
          </button>
          <button onClick={handleSave} style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}>
            <SaveIcon />
            <span>保存截图</span>
          </button>
        </div>
      </div>

      <div style={styles.footer}>
        <span style={styles.footerHint}>💡 鼠标拖拽产生引力场</span>
      </div>
    </div>
  )
}

function getPresetPreviewStyle(key: string): React.CSSProperties {
  return {
    display: 'flex',
    gap: '8px',
    marginTop: '10px',
    padding: '10px',
    background: '#0D1117',
    borderRadius: '8px',
    justifyContent: 'space-around',
  }
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    width: '280px',
    height: '100vh',
    background: '#161B22',
    borderRadius: '0 12px 12px 0',
    boxShadow: '2px 0 12px rgba(0, 0, 0, 0.3)',
    padding: '20px 18px',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    flexShrink: 0,
    borderRight: '1px solid #30363D',
  },
  header: {
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid #30363D',
  },
  title: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#C9D1D9',
    marginBottom: '4px',
    letterSpacing: '-0.3px',
  },
  subtitle: {
    fontSize: '12px',
    color: '#8B949E',
    fontWeight: 400,
  },
  section: {
    marginBottom: '22px',
  },
  sectionLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#8B949E',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '10px',
  },
  inputButtonGroup: {
    display: 'flex',
    gap: '8px',
    marginBottom: '10px',
  },
  inputButton: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    padding: '14px 8px',
    background: '#21262D',
    borderRadius: '10px',
    border: '1px solid #30363D',
    transition: 'all 0.2s ease',
  },
  inputButtonActive: {
    background: 'rgba(63, 185, 80, 0.1)',
    borderColor: '#3FB950',
  },
  inputButtonFileActive: {
    background: 'rgba(88, 166, 255, 0.1)',
    borderColor: '#58A6FF',
  },
  inputButtonText: {
    fontSize: '12px',
    fontWeight: 500,
  },
  stopButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '8px 12px',
    background: 'rgba(248, 81, 73, 0.1)',
    border: '1px solid rgba(248, 81, 73, 0.4)',
    borderRadius: '8px',
    color: '#F85149',
    fontSize: '12px',
    fontWeight: 500,
  },
  error: {
    marginTop: '8px',
    padding: '8px 10px',
    background: 'rgba(248, 81, 73, 0.1)',
    borderRadius: '6px',
    fontSize: '11px',
    color: '#F85149',
    lineHeight: 1.4,
  },
  volumeContainer: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '12px',
    padding: '12px',
    background: '#0D1117',
    borderRadius: '10px',
  },
  volumeBarOuter: {
    width: '8px',
    height: '120px',
    background: '#21262D',
    borderRadius: '4px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  volumeBarInner: {
    width: '100%',
    borderRadius: '4px',
    transition: 'height 0.08s ease-out, transform 0.1s ease, box-shadow 0.1s ease',
    minHeight: '2px',
  },
  volumeLabels: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '120px',
    fontSize: '10px',
    color: '#8B949E',
    lineHeight: 1,
  },
  volumeValue: {
    marginLeft: 'auto',
    fontSize: '20px',
    fontWeight: 700,
    color: '#58A6FF',
    fontFamily: 'monospace',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    background: '#21262D',
    border: '1px solid #30363D',
    borderRadius: '8px',
    color: '#C9D1D9',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'border-color 0.2s ease',
  },
  actionButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 16px',
    background: '#21262D',
    border: '1px solid #30363D',
    borderRadius: '10px',
    color: '#C9D1D9',
    fontSize: '13px',
    fontWeight: 500,
    transition: 'all 0.2s ease',
  },
  actionButtonPrimary: {
    background: 'linear-gradient(135deg, #58A6FF, #3FB950)',
    border: 'none',
    color: '#fff',
    fontWeight: 600,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: '16px',
    borderTop: '1px solid #30363D',
  },
  footerHint: {
    fontSize: '11px',
    color: '#8B949E',
  },
}

export default ControlPanel
