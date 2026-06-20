import { useCallback, useRef, useState } from 'react'
import { csvParse } from 'd3-dsv'
import { useStore, type ColorMapName, type FieldDataPoint } from '@/store/useStore'
import { Upload, Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react'

const COLOR_MAPS: { value: ColorMapName; label: string }[] = [
  { value: 'rainbow', label: '彩虹' },
  { value: 'heatmap', label: '热力图' },
  { value: 'blueCyan', label: '蓝青' },
  { value: 'redGreen', label: '红绿' },
  { value: 'grayscale', label: '灰度' },
]

export default function ControlPanel() {
  const panelOpen = useStore((s) => s.panelOpen)
  const togglePanel = useStore((s) => s.togglePanel)
  const setFieldData = useStore((s) => s.setFieldData)
  const colorMap = useStore((s) => s.colorMap)
  const density = useStore((s) => s.density)
  const timeStep = useStore((s) => s.timeStep)
  const arrowScale = useStore((s) => s.arrowScale)
  const isRunning = useStore((s) => s.isRunning)
  const start = useStore((s) => s.start)
  const pause = useStore((s) => s.pause)
  const reset = useStore((s) => s.reset)
  const setParam = useStore((s) => s.setParam)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const parseCSV = useCallback((text: string, name: string) => {
    try {
      const parsed = csvParse(text.trim())
      if (parsed.length === 0) {
        setError('CSV文件为空')
        return
      }

      const firstRow = parsed[0]
      const requiredCols = ['x', 'y', 'u', 'v']
      for (const col of requiredCols) {
        if (!(col in firstRow)) {
          setError(`缺少列: ${col}`)
          return
        }
      }

      const data: FieldDataPoint[] = parsed
        .map((row) => ({
          x: Number(row.x),
          y: Number(row.y),
          u: Number(row.u),
          v: Number(row.v),
        }))
        .filter((d) => !isNaN(d.x) && !isNaN(d.y) && !isNaN(d.u) && !isNaN(d.v))

      if (data.length < 4) {
        setError('数据点不足，至少需要4个有效数据点')
        return
      }

      setFieldData(data)
      setFileName(name)
      setError(null)
    } catch {
      setError('CSV解析失败，请检查文件格式')
    }
  }, [setFieldData])

  const handleFile = useCallback((file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      setError('文件大小超过2MB限制')
      return
    }
    if (!file.name.endsWith('.csv')) {
      setError('仅支持.csv格式文件')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      parseCSV(text, file.name)
    }
    reader.readAsText(file)
  }, [parseCSV])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      height: '100vh',
      zIndex: 100,
      display: 'flex',
      alignItems: 'stretch',
    }}>
      <div
        className="panel-wrapper"
        style={{
          width: panelOpen ? 280 : 0,
          overflow: 'hidden',
          background: 'rgba(10,10,30,0.7)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRight: panelOpen ? '1px solid rgba(100,140,255,0.2)' : '0px solid rgba(100,140,255,0)',
          transition: 'width 0.3s ease-out, border-right-width 0.3s ease-out',
        }}
      >
        <div style={{ width: 280, height: '100%', overflowY: 'auto', padding: '20px 16px', boxSizing: 'border-box' }}>
          <h2 style={{
            fontFamily: "'Noto Sans SC', sans-serif",
            fontSize: 16,
            fontWeight: 700,
            color: '#c8d6ff',
            margin: '0 0 20px 0',
            letterSpacing: 1,
          }}>
            流场控制
          </h2>

          <div
            className={`upload-zone${dragOver ? ' dragging' : ''}`}
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: dragOver ? '2px dashed rgba(100,200,255,0.7)' : '2px dashed rgba(100,140,255,0.3)',
              borderRadius: 8,
              padding: '20px 12px',
              textAlign: 'center',
              cursor: 'pointer',
              marginBottom: 20,
              background: dragOver ? 'rgba(100,180,255,0.12)' : 'rgba(255,255,255,0.02)',
            }}
          >
            <Upload size={20} color="rgba(100,160,255,0.7)" style={{ marginBottom: 8 }} />
            <div style={{
              fontFamily: "'Noto Sans SC', sans-serif",
              fontSize: 12,
              color: 'rgba(160,180,255,0.7)',
              lineHeight: 1.6,
            }}>
              {fileName || '拖拽或点击上传 CSV 文件'}
              <br />
              <span style={{ fontSize: 10, color: 'rgba(140,160,220,0.5)' }}>.csv 格式，最大 2MB</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={onFileChange}
              style={{ display: 'none' }}
            />
          </div>

          {error && (
            <div style={{
              fontSize: 11,
              color: '#ff6b6b',
              marginBottom: 12,
              padding: '6px 8px',
              background: 'rgba(255,80,80,0.1)',
              borderRadius: 4,
              fontFamily: "'Noto Sans SC', sans-serif",
            }}>
              {error}
            </div>
          )}

          <label style={{ display: 'block', marginBottom: 16 }}>
            <span style={{
              fontFamily: "'Noto Sans SC', sans-serif",
              fontSize: 12,
              color: 'rgba(160,180,255,0.8)',
              display: 'block',
              marginBottom: 8,
            }}>颜色映射</span>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {COLOR_MAPS.map((cm) => (
                <button
                  key={cm.value}
                  className="colormap-btn"
                  onClick={() => setParam('colorMap', cm.value)}
                  style={{
                    padding: '4px 10px',
                    fontSize: 11,
                    fontFamily: "'Noto Sans SC', sans-serif",
                    border: colorMap === cm.value ? '1px solid rgba(100,180,255,0.8)' : '1px solid rgba(100,140,255,0.2)',
                    borderRadius: 4,
                    background: colorMap === cm.value ? 'rgba(100,140,255,0.18)' : 'rgba(255,255,255,0.03)',
                    color: colorMap === cm.value ? '#a0c4ff' : 'rgba(160,180,255,0.6)',
                    cursor: 'pointer',
                  }}
                >
                  {cm.label}
                </button>
              ))}
            </div>
          </label>

          <label style={{ display: 'block', marginBottom: 16 }}>
            <span style={{
              fontFamily: "'Noto Sans SC', sans-serif",
              fontSize: 12,
              color: 'rgba(160,180,255,0.8)',
              display: 'flex',
              justifyContent: 'space-between',
            }}>
              密度 <span style={{ color: 'rgba(120,150,220,0.6)', fontSize: 11 }}>{Math.round(density * 100)}%</span>
            </span>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={density}
              onChange={(e) => setParam('density', Number(e.target.value))}
              style={{
                width: '100%',
                marginTop: 6,
                accentColor: '#5080cc',
              }}
            />
          </label>

          <label style={{ display: 'block', marginBottom: 16 }}>
            <span style={{
              fontFamily: "'Noto Sans SC', sans-serif",
              fontSize: 12,
              color: 'rgba(160,180,255,0.8)',
              display: 'flex',
              justifyContent: 'space-between',
            }}>
              时间步长 <span style={{ color: 'rgba(120,150,220,0.6)', fontSize: 11 }}>{timeStep.toFixed(3)}</span>
            </span>
            <input
              type="range"
              min={0.01}
              max={0.1}
              step={0.005}
              value={timeStep}
              onChange={(e) => setParam('timeStep', Number(e.target.value))}
              style={{
                width: '100%',
                marginTop: 6,
                accentColor: '#5080cc',
              }}
            />
          </label>

          <label style={{ display: 'block', marginBottom: 24 }}>
            <span style={{
              fontFamily: "'Noto Sans SC', sans-serif",
              fontSize: 12,
              color: 'rgba(160,180,255,0.8)',
              display: 'flex',
              justifyContent: 'space-between',
            }}>
              箭头缩放 <span style={{ color: 'rgba(120,150,220,0.6)', fontSize: 11 }}>{arrowScale.toFixed(1)}</span>
            </span>
            <input
              type="range"
              min={0.5}
              max={2.0}
              step={0.1}
              value={arrowScale}
              onChange={(e) => setParam('arrowScale', Number(e.target.value))}
              style={{
                width: '100%',
                marginTop: 6,
                accentColor: '#5080cc',
              }}
            />
          </label>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="action-btn"
              onClick={isRunning ? pause : start}
              style={{
                flex: 1,
                padding: '10px 0',
                fontSize: 13,
                fontFamily: "'Noto Sans SC', sans-serif",
                fontWeight: 500,
                border: '1px solid rgba(100,180,255,0.3)',
                borderRadius: 6,
                background: isRunning
                  ? 'rgba(80,140,255,0.15)'
                  : 'rgba(60,120,220,0.2)',
                color: isRunning ? '#80b0ff' : '#a0c8ff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              {isRunning ? <Pause size={14} /> : <Play size={14} />}
              {isRunning ? '暂停' : '开始'}
            </button>
            <button
              className="action-btn"
              onClick={reset}
              style={{
                flex: 1,
                padding: '10px 0',
                fontSize: 13,
                fontFamily: "'Noto Sans SC', sans-serif",
                fontWeight: 500,
                border: '1px solid rgba(100,140,255,0.2)',
                borderRadius: 6,
                background: 'rgba(255,255,255,0.03)',
                color: 'rgba(160,180,255,0.7)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <RotateCcw size={14} />
              重启
            </button>
          </div>
        </div>
      </div>

      <button
        className="collapse-btn"
        onClick={togglePanel}
        style={{
          alignSelf: 'center',
          width: 24,
          height: 48,
          border: '1px solid rgba(100,140,255,0.2)',
          borderLeft: 'none',
          borderRadius: '0 6px 6px 0',
          background: 'rgba(10,10,30,0.6)',
          backdropFilter: 'blur(8px)',
          color: 'rgba(160,180,255,0.7)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {panelOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>
    </div>
  )
}
