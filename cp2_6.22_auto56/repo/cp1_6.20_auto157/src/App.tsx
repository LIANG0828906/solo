import { useState, useRef, useCallback, useEffect } from 'react'
import WallpaperCanvas, { type WaveformType } from './components/WallpaperCanvas'
import ControlPanel, { type WallpaperSize, GRADIENT_PRESETS } from './components/ControlPanel'
import { AudioAnalyzer, decodeAudioFile, type WaveformData } from './utils/audioProcessor'

function generateDefaultSamples(count: number): number[] {
  const samples: number[] = []
  for (let i = 0; i < count; i++) {
    const t = i / count
    const value =
      0.3 +
      0.3 * Math.sin(t * Math.PI * 8) +
      0.2 * Math.sin(t * Math.PI * 16 + 1) +
      0.15 * Math.sin(t * Math.PI * 32 + 2) +
      0.05 * Math.random()
    samples.push(Math.max(0, Math.min(1, value)))
  }
  return samples
}

export default function App() {
  const [waveformType, setWaveformType] = useState<WaveformType>('bars')
  const [gradientColors, setGradientColors] = useState<[string, string]>(GRADIENT_PRESETS[0].colors)
  const [backgroundColor, setBackgroundColor] = useState('#1a1a2e')
  const [samples, setSamples] = useState<number[]>(generateDefaultSamples(128))
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioFileName, setAudioFileName] = useState<string>('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false)
  const [exportMessage, setExportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const audioAnalyzerRef = useRef<AudioAnalyzer | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioUrlRef = useRef<string>('')

  const cleanupAudio = useCallback(() => {
    if (audioAnalyzerRef.current) {
      audioAnalyzerRef.current.destroy()
      audioAnalyzerRef.current = null
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current)
      audioUrlRef.current = ''
    }
  }, [])

  useEffect(() => {
    return () => cleanupAudio()
  }, [cleanupAudio])

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('audio/')) {
        alert('请上传音频文件')
        return
      }

      cleanupAudio()

      setAudioFile(file)
      setAudioFileName(file.name)
      setIsPlaying(false)

      try {
        const waveformData: WaveformData = await decodeAudioFile(file)
        setSamples(waveformData.samples)

        const audioUrl = URL.createObjectURL(file)
        audioUrlRef.current = audioUrl

        const analyzer = new AudioAnalyzer()
        await analyzer.init(audioUrl)
        audioAnalyzerRef.current = analyzer
      } catch (error) {
        console.error('解析音频失败:', error)
      }
    },
    [cleanupAudio]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) handleFileUpload(file)
    },
    [handleFileUpload]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFileUpload(file)
    },
    [handleFileUpload]
  )

  const togglePlay = useCallback(() => {
    if (!audioAnalyzerRef.current) return

    if (audioAnalyzerRef.current.isPlaying()) {
      audioAnalyzerRef.current.pause()
      setIsPlaying(false)
    } else {
      audioAnalyzerRef.current.play()
      setIsPlaying(true)
    }
  }, [])

  const exportWallpaper = useCallback(
    async (size: WallpaperSize) => {
      setIsExporting(true)
      setExportMessage(null)

      try {
        const [width, height] = size.split('x').map(Number)
        const exportCanvas = document.createElement('canvas')
        exportCanvas.width = width
        exportCanvas.height = height
        const ctx = exportCanvas.getContext('2d')
        if (!ctx) throw new Error('无法创建画布上下文')

        ctx.fillStyle = backgroundColor
        ctx.fillRect(0, 0, width, height)

        const gradient = ctx.createLinearGradient(0, 0, width, 0)
        gradient.addColorStop(0, gradientColors[0])
        gradient.addColorStop(1, gradientColors[1])
        ctx.fillStyle = gradient
        ctx.strokeStyle = gradient
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        if (waveformType === 'bars') {
          const barCount = 128
          const gap = 4
          const barWidth = (width - gap * (barCount - 1)) / barCount
          const maxHeight = height * 0.7
          const startY = (height - maxHeight) / 2 + maxHeight

          for (let i = 0; i < barCount; i++) {
            const idx = Math.floor((i / barCount) * samples.length)
            const value = samples[idx] || 0
            const barHeight = Math.max(8, value * maxHeight)
            const x = i * (barWidth + gap)
            const y = startY - barHeight
            const radius = Math.min(barWidth / 2, 10)
            ctx.beginPath()
            ctx.roundRect(x, y, barWidth, barHeight, radius)
            ctx.fill()
          }
        } else if (waveformType === 'line') {
          const centerY = height / 2
          const amplitude = height * 0.35
          const points = 256

          ctx.beginPath()
          for (let i = 0; i <= points; i++) {
            const x = (i / points) * width
            const idx = Math.floor((i / points) * samples.length)
            const value = samples[idx] || 0
            const y = centerY + Math.sin((i / points) * Math.PI * 4) * value * amplitude * 0.3 - value * amplitude
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          ctx.stroke()

          ctx.globalAlpha = 0.5
          ctx.lineWidth = 2
          ctx.beginPath()
          for (let i = 0; i <= points; i++) {
            const x = (i / points) * width
            const idx = Math.floor((i / points) * samples.length)
            const value = samples[idx] || 0
            const y = centerY - Math.sin((i / points) * Math.PI * 4) * value * amplitude * 0.3 + value * amplitude
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          ctx.stroke()
          ctx.globalAlpha = 1
        } else if (waveformType === 'dots') {
          const centerY = height / 2
          const amplitude = height * 0.35
          const dotCount = 96
          const spacing = width / dotCount

          for (let i = 0; i < dotCount; i++) {
            const idx = Math.floor((i / dotCount) * samples.length)
            const value = samples[idx] || 0
            const x = spacing * i + spacing / 2
            const baseRadius = 6
            const radius = baseRadius + value * 14

            for (let j = -3; j <= 3; j++) {
              const offsetY = j * amplitude * 0.25 * value
              const alpha = 1 - Math.abs(j) * 0.2
              const dotRadius = radius * (1 - Math.abs(j) * 0.15)
              ctx.globalAlpha = alpha
              ctx.beginPath()
              ctx.arc(x, centerY + offsetY, Math.max(2, dotRadius), 0, Math.PI * 2)
              ctx.fill()
            }
          }
          ctx.globalAlpha = 1
        }

        const borderSize = Math.floor(Math.min(width, height) * 0.04)
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = width
        tempCanvas.height = height
        const tempCtx = tempCanvas.getContext('2d')
        if (!tempCtx) throw new Error('无法创建临时画布')

        tempCtx.fillStyle = gradientColors[0]
        tempCtx.fillRect(0, 0, width, borderSize)
        tempCtx.fillRect(0, height - borderSize, width, borderSize)
        tempCtx.fillRect(0, 0, borderSize, height)
        tempCtx.fillRect(width - borderSize, 0, borderSize, height)

        ctx.filter = 'blur(12px)'
        ctx.globalAlpha = 0.6
        ctx.drawImage(tempCanvas, 0, 0)
        ctx.filter = 'none'
        ctx.globalAlpha = 1

        const innerBorderSize = borderSize - 6
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
        ctx.lineWidth = 2
        ctx.strokeRect(
          innerBorderSize,
          innerBorderSize,
          width - innerBorderSize * 2,
          height - innerBorderSize * 2
        )

        const dataUrl = exportCanvas.toDataURL('image/png')
        const link = document.createElement('a')
        link.download = `waveform-wallpaper-${size}.png`
        link.href = dataUrl
        link.click()

        setExportMessage({ type: 'success', text: '壁纸导出成功！已开始下载' })
      } catch (error) {
        console.error('导出失败:', error)
        setExportMessage({ type: 'error', text: '导出失败，请重试' })
      } finally {
        setIsExporting(false)
        setTimeout(() => setExportMessage(null), 3000)
      }
    },
    [backgroundColor, gradientColors, waveformType, samples]
  )

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100vh',
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          gap: '20px',
          minWidth: 0,
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '26px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #00d4ff, #9d4edd)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                margin: 0,
                marginBottom: '4px',
              }}
            >
              音乐波形壁纸生成器
            </h1>
            <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', margin: 0 }}>
              上传音乐，创造独一无二的个性化壁纸
            </p>
          </div>
        </header>

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            minHeight: 0,
          }}
        >
          {!audioFile ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              style={{
                flex: 1,
                border: `2px dashed ${isDragging ? 'rgba(0, 212, 255, 0.8)' : 'rgba(255, 255, 255, 0.2)'}`,
                borderRadius: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: isDragging
                  ? 'rgba(0, 212, 255, 0.08)'
                  : 'rgba(255, 255, 255, 0.02)',
                minHeight: '300px',
              }}
            >
              <div
                style={{
                  fontSize: '64px',
                  marginBottom: '20px',
                  opacity: isDragging ? 1 : 0.6,
                  transition: 'opacity 0.3s ease',
                }}
              >
                🎵
              </div>
              <h3 style={{ fontSize: '18px', color: '#fff', margin: 0, marginBottom: '8px' }}>
                {isDragging ? '释放以上传音频' : '拖拽音频文件到此处'}
              </h3>
              <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', margin: 0 }}>
                或点击选择文件（支持 MP3、WAV、OGG 等格式）
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileInput}
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <>
              <div
                style={{
                  flex: 1,
                  position: 'relative',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 8px 40px rgba(0, 0, 0, 0.5)',
                  minHeight: 0,
                }}
              >
                <WallpaperCanvas
                  config={{
                    waveformType,
                    gradientColors,
                    backgroundColor,
                    samples,
                    smoothness: 300,
                  }}
                  audioAnalyzer={audioAnalyzerRef.current}
                  isPlaying={isPlaying}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(157, 78, 221, 0.2))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      flexShrink: 0,
                    }}
                  >
                    🎧
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#fff',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '300px',
                      }}
                    >
                      {audioFileName}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
                      {isPlaying ? '正在播放...' : '已就绪'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    onClick={togglePlay}
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      border: 'none',
                      background: 'linear-gradient(135deg, #00d4ff, #9d4edd)',
                      color: '#fff',
                      fontSize: '20px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 20px rgba(0, 212, 255, 0.35)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
                      e.currentTarget.style.boxShadow = '0 6px 28px rgba(0, 212, 255, 0.5)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)'
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 212, 255, 0.35)'
                    }}
                  >
                    {isPlaying ? '⏸' : '▶'}
                  </button>
                  <button
                    onClick={() => {
                      cleanupAudio()
                      setAudioFile(null)
                      setAudioFileName('')
                      setIsPlaying(false)
                      setSamples(generateDefaultSamples(128))
                    }}
                    style={{
                      padding: '12px 20px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      background: 'rgba(255, 255, 255, 0.06)',
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
                    }}
                  >
                    更换音乐
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {exportMessage && (
          <div
            style={{
              position: 'fixed',
              top: '24px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '14px 24px',
              borderRadius: '12px',
              background: exportMessage.type === 'success'
                ? 'linear-gradient(135deg, rgba(0, 245, 160, 0.9), rgba(0, 217, 245, 0.9))'
                : 'linear-gradient(135deg, rgba(255, 107, 53, 0.9), rgba(255, 64, 129, 0.9))',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 500,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              zIndex: 1000,
              animation: 'slideDown 0.3s ease',
            }}
          >
            {exportMessage.type === 'success' ? '✓ ' : '✕ '}
            {exportMessage.text}
          </div>
        )}
      </div>

      <ControlPanel
        waveformType={waveformType}
        setWaveformType={setWaveformType}
        gradientColors={gradientColors}
        setGradientColors={setGradientColors}
        backgroundColor={backgroundColor}
        setBackgroundColor={setBackgroundColor}
        onExport={exportWallpaper}
        isExporting={isExporting}
        isCollapsed={isPanelCollapsed}
        onToggleCollapse={() => setIsPanelCollapsed(!isPanelCollapsed)}
      />

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
