import { useCallback, useState } from 'react'

interface LoadingScreenProps {
  onFileDrop: (file: File) => void
  onDemo: () => void
  isAnalyzing: boolean
  bpm: number
}

export default function LoadingScreen({ onFileDrop, onDemo, isAnalyzing, bpm }: LoadingScreenProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [beatPulse, setBeatPulse] = useState(0)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const files = e.dataTransfer.files
      if (files.length > 0) {
        const file = files[0]
        if (file.type.includes('audio/') || file.name.match(/\.(mp3|wav|ogg)$/i)) {
          onFileDrop(file)

          const pulseInterval = setInterval(() => {
            setBeatPulse(1)
            setTimeout(() => setBeatPulse(0), 200)
          }, 500)

          setTimeout(() => clearInterval(pulseInterval), 3000)
        }
      }
    },
    [onFileDrop]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        onFileDrop(files[0])
      }
    },
    [onFileDrop]
  )

  return (
    <div className="loading-screen">
      <div className="loading-title">节奏跑酷</div>
      <div className="loading-subtitle">Rhythm Runner</div>

      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <div className="drop-icon">🎵</div>
        <div className="drop-text">
          {isAnalyzing ? '正在分析音乐...' : '拖拽音乐文件到这里'}
        </div>
        <div className="drop-hint">支持 MP3、WAV、OGG 格式</div>
        <input
          id="file-input"
          type="file"
          accept="audio/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      <button className="demo-button" onClick={onDemo}>
        🎮 演示模式
      </button>

      {(bpm > 0 || isAnalyzing) && (
        <div className="bpm-display">
          <div className="bpm-value">{bpm || '--'}</div>
          <div className="bpm-label">BPM</div>
          <div
            className="energy-bar"
            style={{
              transform: `scaleX(${0.3 + beatPulse * 0.7})`,
              opacity: 0.5 + beatPulse * 0.5,
            }}
          />
        </div>
      )}

      <div className="controls-hint">
        <span>键盘：A / S / D 切换车道</span>
        <span>触屏：左右滑动切换</span>
      </div>

      <style>{`
        .loading-screen {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          background: linear-gradient(180deg, #0D1117 0%, #161B22 100%);
        }

        .loading-title {
          font-size: 48px;
          font-weight: bold;
          color: #C9D1D9;
          margin-bottom: 8px;
          letter-spacing: 8px;
        }

        .loading-subtitle {
          font-size: 16px;
          color: #8B949E;
          margin-bottom: 60px;
          letter-spacing: 2px;
        }

        .drop-zone {
          width: 400px;
          height: 100px;
          border: 2px dashed #58A6FF;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: rgba(88, 166, 255, 0.05);
        }

        .drop-zone:hover {
          background: rgba(88, 166, 255, 0.1);
        }

        .drop-zone.dragging {
          border: 2px solid #58A6FF;
          box-shadow: 0 0 30px rgba(88, 166, 255, 0.5);
          background: rgba(88, 166, 255, 0.15);
        }

        .drop-icon {
          font-size: 32px;
          margin-bottom: 8px;
        }

        .drop-text {
          font-size: 16px;
          color: #C9D1D9;
          margin-bottom: 4px;
        }

        .drop-hint {
          font-size: 12px;
          color: #8B949E;
        }

        .demo-button {
          margin-top: 30px;
          padding: 12px 32px;
          font-size: 16px;
          font-weight: bold;
          color: #C9D1D9;
          background: transparent;
          border: 1px solid #30363D;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .demo-button:hover {
          background: rgba(88, 166, 255, 0.1);
          border-color: #58A6FF;
          color: #58A6FF;
        }

        .bpm-display {
          margin-top: 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .bpm-value {
          font-size: 48px;
          font-weight: bold;
          color: #58A6FF;
          line-height: 1;
        }

        .bpm-label {
          font-size: 14px;
          color: #8B949E;
          margin-top: 4px;
          letter-spacing: 2px;
        }

        .energy-bar {
          width: 200px;
          height: 4px;
          background: #FFD700;
          margin-top: 16px;
          border-radius: 2px;
          transition: transform 0.1s ease, opacity 0.1s ease;
          transform-origin: center;
        }

        .controls-hint {
          position: absolute;
          bottom: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: #8B949E;
          font-size: 12px;
        }

        @media (max-width: 768px) {
          .drop-zone {
            width: 80%;
            height: 120px;
          }

          .loading-title {
            font-size: 32px;
          }

          .bpm-value {
            font-size: 36px;
          }

          .energy-bar {
            width: 150px;
          }

          .controls-hint {
            flex-direction: column;
            gap: 4px;
            bottom: 20px;
          }
        }
      `}</style>
    </div>
  )
}
