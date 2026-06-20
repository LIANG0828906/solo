import { useCallback, useRef, useState } from 'react'
import { useStore } from './store'
import { audioEngine } from './audioEngine'
import SceneManager from './sceneManager'
import { ElementType, ELEMENT_LABELS, THEME_COLORS, ThemeType } from './types'

const ELEMENT_TYPES: ElementType[] = ['beatBars', 'particleGalaxy', 'waveSphere', 'lightWall']

const ELEMENT_ICONS: Record<ElementType, string> = {
  beatBars: '▮▮▮',
  particleGalaxy: '✦✧',
  waveSphere: '◎',
  lightWall: '▦',
}

function LeftPanel() {
  const addElement = useStore((s) => s.addElement)

  const handleDragStart = (e: React.DragEvent, type: ElementType) => {
    e.dataTransfer.setData('elementType', type)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div style={{
      position: 'absolute',
      left: 16,
      top: 76,
      bottom: 16,
      width: 280,
      background: 'rgba(10,10,26,0.8)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderRadius: 12,
      padding: '16px 12px',
      zIndex: 10,
      border: '1px solid rgba(255,255,255,0.08)',
      overflowY: 'auto',
    }}>
      <h3 style={{
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        fontWeight: 700,
        margin: '0 0 12px 0',
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
      }}>
        可视化元素
      </h3>
      <p style={{
        color: 'rgba(255,255,255,0.4)',
        fontSize: 11,
        margin: '0 0 12px 0',
      }}>
        拖拽到场景中添加
      </p>
      {ELEMENT_TYPES.map((type) => (
        <div
          key={type}
          draggable
          onDragStart={(e) => handleDragStart(e, type)}
          onClick={() => addElement(type)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 12px',
            marginBottom: 8,
            borderRadius: 8,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            cursor: 'grab',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)'
            e.currentTarget.style.boxShadow = '0 0 12px rgba(255,255,255,0.15)'
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = 'none'
            e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
          }}
        >
          <span style={{
            fontSize: 22,
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 8,
            flexShrink: 0,
          }}>
            {ELEMENT_ICONS[type]}
          </span>
          <span style={{
            color: 'rgba(255,255,255,0.85)',
            fontSize: 13,
            fontWeight: 500,
          }}>
            {ELEMENT_LABELS[type]}
          </span>
        </div>
      ))}
    </div>
  )
}

function RightPanel() {
  const selectedId = useStore((s) => s.selectedId)
  const elements = useStore((s) => s.elements)
  const updateElement = useStore((s) => s.updateElement)
  const removeElement = useStore((s) => s.removeElement)
  const syncAllElements = useStore((s) => s.syncAllElements)

  const element = elements.find((el) => el.id === selectedId)

  if (!element) return null

  const paramConfig: Record<string, { min: number; max: number; step: number; label: string }> = {
    barCount: { min: 8, max: 64, step: 1, label: '柱体数量' },
    spacing: { min: 0.1, max: 0.8, step: 0.05, label: '柱体间距' },
    particleCount: { min: 500, max: 3000, step: 100, label: '粒子数量' },
    galaxyRadius: { min: 1, max: 6, step: 0.5, label: '星系半径' },
    segments: { min: 16, max: 48, step: 2, label: '波形细分' },
    waveAmplitude: { min: 0.1, max: 1.0, step: 0.05, label: '起伏幅度' },
    width: { min: 2, max: 12, step: 0.5, label: '光墙宽度' },
    height: { min: 2, max: 8, step: 0.5, label: '光墙高度' },
    flickerRate: { min: 0.5, max: 5, step: 0.5, label: '闪烁频率' },
  }

  return (
    <div style={{
      position: 'absolute',
      right: 16,
      top: 76,
      bottom: 16,
      width: 300,
      background: '#ffffff',
      borderRadius: 12,
      padding: '20px 16px',
      zIndex: 10,
      border: '1px solid #e0e0e0',
      boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
      overflowY: 'auto',
      transition: 'transform 0.3s ease, opacity 0.3s ease',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
      }}>
        <h3 style={{
          color: '#1a1a2e',
          fontSize: 14,
          fontWeight: 700,
          margin: 0,
        }}>
          {ELEMENT_LABELS[element.type]}
        </h3>
        <button
          onClick={() => removeElement(element.id)}
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: 'none',
            background: '#ff3344',
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.3s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          ✕
        </button>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 11, color: '#888', fontWeight: 600, display: 'block', marginBottom: 4 }}>
          响应灵敏度
        </label>
        <input
          type="range"
          min={0.1}
          max={3}
          step={0.1}
          value={element.sensitivity}
          onChange={(e) => updateElement(element.id, { sensitivity: parseFloat(e.target.value) })}
          style={{ width: '100%', accentColor: '#6366f1' }}
        />
        <span style={{ fontSize: 11, color: '#aaa' }}>{element.sensitivity.toFixed(1)}</span>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 11, color: '#888', fontWeight: 600, display: 'block', marginBottom: 4 }}>
          旋转速度
        </label>
        <input
          type="range"
          min={0}
          max={2}
          step={0.05}
          value={element.rotationSpeed}
          onChange={(e) => updateElement(element.id, { rotationSpeed: parseFloat(e.target.value) })}
          style={{ width: '100%', accentColor: '#6366f1' }}
        />
        <span style={{ fontSize: 11, color: '#aaa' }}>{element.rotationSpeed.toFixed(2)}</span>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 11, color: '#888', fontWeight: 600, display: 'block', marginBottom: 4 }}>
          缩放
        </label>
        <input
          type="range"
          min={0.3}
          max={3}
          step={0.1}
          value={element.scale}
          onChange={(e) => updateElement(element.id, { scale: parseFloat(e.target.value) })}
          style={{ width: '100%', accentColor: '#6366f1' }}
        />
        <span style={{ fontSize: 11, color: '#aaa' }}>{element.scale.toFixed(1)}</span>
      </div>

      {Object.entries(element.params).map(([key, value]) => {
        const config = paramConfig[key]
        if (!config) return null
        return (
          <div key={key} style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: '#888', fontWeight: 600, display: 'block', marginBottom: 4 }}>
              {config.label}
            </label>
            <input
              type="range"
              min={config.min}
              max={config.max}
              step={config.step}
              value={value}
              onChange={(e) =>
                updateElement(element.id, {
                  params: { ...element.params, [key]: parseFloat(e.target.value) },
                })
              }
              style={{ width: '100%', accentColor: '#6366f1' }}
            />
            <span style={{ fontSize: 11, color: '#aaa' }}>{value}</span>
          </div>
        )
      })}

      <button
        onClick={syncAllElements}
        style={{
          width: '100%',
          marginTop: 16,
          padding: '10px 0',
          border: '1px solid #e0e0e0',
          borderRadius: 8,
          background: '#f8f8fa',
          color: '#1a1a2e',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#eee'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#f8f8fa'
        }}
      >
        ↻ 同步所有元素节拍
      </button>
    </div>
  )
}

function Toolbar() {
  const isPlaying = useStore((s) => s.isPlaying)
  const setPlaying = useStore((s) => s.setPlaying)
  const currentTime = useStore((s) => s.currentTime)
  const duration = useStore((s) => s.duration)
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const isRecording = useStore((s) => s.isRecording)
  const setRecording = useStore((s) => s.setRecording)
  const audioLoaded = useStore((s) => s.audioLoaded)
  const addElement = useStore((s) => s.addElement)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const [recordPulse, setRecordPulse] = useState(false)

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const maxSize = 2 * 60
    await audioEngine.loadFile(file)
  }, [])

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      audioEngine.stop()
    } else {
      audioEngine.start()
    }
  }, [isPlaying])

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    audioEngine.seek(parseFloat(e.target.value))
  }, [])

  const toggleRecord = useCallback(() => {
    if (isRecording) {
      mediaRecorderRef.current?.stop()
      setRecording(false)
      return
    }
    const canvas = document.querySelector('canvas')
    if (!canvas) return
    const stream = canvas.captureStream(30)
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' })
    chunksRef.current = []
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'music-visualizer.webm'
      a.click()
      URL.revokeObjectURL(url)
    }
    recorder.start()
    mediaRecorderRef.current = recorder
    setRecording(true)
  }, [isRecording, setRecording])

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60)
    const s = Math.floor(t % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 60,
      background: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      zIndex: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <label style={{
          padding: '6px 14px',
          borderRadius: 6,
          background: 'rgba(255,255,255,0.1)',
          color: audioLoaded ? 'rgba(255,255,255,0.9)' : '#fff',
          fontSize: 12,
          cursor: 'pointer',
          border: '1px solid rgba(255,255,255,0.15)',
          transition: 'all 0.3s ease',
          fontWeight: 500,
        }}>
          {audioLoaded ? '✓ 已加载' : '上传音乐'}
          <input
            type="file"
            accept=".mp3,.wav,audio/mpeg,audio/wav"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </label>

        {audioLoaded && (
          <>
            <button
              onClick={togglePlay}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(255,255,255,0.15)',
                color: '#fff',
                fontSize: 16,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
              }}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, minWidth: 36 }}>
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 1}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                style={{
                  width: 180,
                  height: 4,
                  accentColor: THEME_COLORS[theme][0],
                  cursor: 'pointer',
                }}
              />
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, minWidth: 36 }}>
                {formatTime(duration)}
              </span>
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {(['cyber', 'aurora', 'lava'] as ThemeType[]).map((t) => {
          const colors = THEME_COLORS[t]
          return (
            <button
              key={t}
              onClick={() => setTheme(t)}
              style={{
                display: 'flex',
                gap: 2,
                padding: '4px 8px',
                borderRadius: 6,
                border: theme === t ? '2px solid rgba(255,255,255,0.6)' : '2px solid transparent',
                background: 'rgba(255,255,255,0.05)',
                cursor: 'pointer',
                transition: 'all 0.6s ease',
              }}
            >
              {colors.map((c, i) => (
                <div
                  key={i}
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    backgroundColor: c,
                    transition: 'background-color 0.6s ease',
                  }}
                />
              ))}
            </button>
          )
        })}

        <button
          onClick={toggleRecord}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: 'none',
            background: isRecording ? '#ff3344' : 'rgba(255,50,50,0.3)',
            color: '#fff',
            fontSize: 16,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            animation: isRecording ? 'pulse 1s ease-in-out infinite' : 'none',
          }}
        >
          ⏺
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const addElement = useStore((s) => s.addElement)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const type = e.dataTransfer.getData('elementType') as ElementType
      if (type) {
        addElement(type)
      }
    },
    [addElement]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: '#0a0a1a',
      }}
    >
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { overflow: hidden; background: #0a0a1a; }
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          height: 4px;
          border-radius: 2px;
          background: rgba(255,255,255,0.15);
          outline: none;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #fff;
          border: 1px solid rgba(255,255,255,0.3);
          cursor: pointer;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
      `}</style>
      <SceneManager />
      <Toolbar />
      <LeftPanel />
      <RightPanel />
    </div>
  )
}
