import { useEffect, useRef, useCallback } from 'react'
import { useStore } from '../../store'
import { drawHeatmap } from './textureEngine'

const WORKSPACE_WIDTH = 640
const WORKSPACE_HEIGHT = 480

function TextureModule() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { capturedImage, sensitivity, setSensitivity, setStats, triggerDownload, isDownloading } =
    useStore()

  const renderHeatmap = useCallback(async () => {
    if (!canvasRef.current || !capturedImage) return
    try {
      const stats = await drawHeatmap(canvasRef.current, capturedImage, sensitivity)
      setStats(stats)
    } catch (e) {
      console.error('渲染热力图失败:', e)
    }
  }, [capturedImage, sensitivity, setStats])

  useEffect(() => {
    renderHeatmap()
  }, [renderHeatmap])

  const handleSensitivityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSensitivity(Number(e.target.value))
  }

  const handleDecrease = () => {
    setSensitivity(Math.max(0, sensitivity - 1))
  }

  const handleIncrease = () => {
    setSensitivity(Math.min(100, sensitivity + 1))
  }

  const handleDownload = () => {
    triggerDownload()
  }

  return (
    <div style={styles.container}>
      <div style={styles.workspace}>
        {!capturedImage ? (
          <div style={styles.placeholder}>
            <p style={styles.placeholderText}>请在左侧摄像头预览区点击"拍照抓取"</p>
            <p style={styles.placeholderHint}>抓取的照片将在此显示并生成热力图</p>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            style={{
              ...styles.canvas,
              transition: 'opacity 0.2s ease, filter 0.2s ease',
            }}
          />
        )}
        {isDownloading && (
          <div style={styles.loadingOverlay}>
            <div style={styles.spinner} />
          </div>
        )}
      </div>

      <div style={styles.controls}>
        <div style={styles.sliderContainer}>
          <label style={styles.sliderLabel}>
            纹理敏感度
          </label>
          <div style={styles.sliderRow}>
            <button
              style={{
                ...styles.adjustButton,
                opacity: capturedImage && sensitivity > 0 ? 1 : 0.5,
                cursor: capturedImage && sensitivity > 0 ? 'pointer' : 'not-allowed',
              }}
              onClick={handleDecrease}
              disabled={!capturedImage || sensitivity <= 0}
              onMouseEnter={(e) => {
                if (capturedImage && sensitivity > 0) e.currentTarget.style.backgroundColor = '#42A5F5'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#64B5F6'
              }}
            >
              −
            </button>
            <div style={styles.sliderWrapper}>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={sensitivity}
                onChange={handleSensitivityChange}
                style={styles.slider}
                disabled={!capturedImage}
              />
            </div>
            <button
              style={{
                ...styles.adjustButton,
                opacity: capturedImage && sensitivity < 100 ? 1 : 0.5,
                cursor: capturedImage && sensitivity < 100 ? 'pointer' : 'not-allowed',
              }}
              onClick={handleIncrease}
              disabled={!capturedImage || sensitivity >= 100}
              onMouseEnter={(e) => {
                if (capturedImage && sensitivity < 100) e.currentTarget.style.backgroundColor = '#42A5F5'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#64B5F6'
              }}
            >
              +
            </button>
            <span style={styles.sliderValueLabel}>{sensitivity}</span>
          </div>
          <div style={styles.sliderLegend}>
            <span style={styles.legendLow}>低</span>
            <span style={styles.legendHigh}>高</span>
          </div>
        </div>

        <button
          style={{
            ...styles.downloadButton,
            opacity: capturedImage ? 1 : 0.5,
            cursor: capturedImage && !isDownloading ? 'pointer' : 'not-allowed',
          }}
          onClick={handleDownload}
          disabled={!capturedImage || isDownloading}
          onMouseEnter={(e) => {
            if (capturedImage) e.currentTarget.style.backgroundColor = '#42A5F5'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#64B5F6'
          }}
        >
          下载纹理图
        </button>
      </div>

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #1565C0;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          transition: transform 0.2s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #1565C0;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
  workspace: {
    position: 'relative',
    width: WORKSPACE_WIDTH,
    height: WORKSPACE_HEIGHT,
    maxWidth: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    border: '2px solid #424242',
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    color: '#90A4AE',
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: 500,
    color: '#546E7A',
  },
  placeholderHint: {
    fontSize: 13,
    color: '#90A4AE',
  },
  canvas: {
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  loadingOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: 32,
    height: 32,
    border: `3px solid #1565C0`,
    borderTop: '3px solid transparent',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  controls: {
    width: WORKSPACE_WIDTH,
    maxWidth: '100%',
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    border: '2px solid #424242',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  sliderContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: 500,
    color: '#546E7A',
  },
  sliderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  adjustButton: {
    backgroundColor: '#64B5F6',
    color: '#FFFFFF',
    border: 'none',
    width: 32,
    height: 32,
    borderRadius: 6,
    fontSize: 18,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    lineHeight: 1,
  },
  sliderWrapper: {
    flex: 1,
  },
  slider: {
    width: '100%',
    height: 6,
    WebkitAppearance: 'none',
    appearance: 'none',
    background: '#BDBDBD',
    borderRadius: 3,
    outline: 'none',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
  },
  sliderValueLabel: {
    minWidth: 32,
    textAlign: 'center',
    color: '#0D47A1',
    fontSize: 14,
    fontWeight: 700,
  },
  sliderLegend: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 12,
    color: '#90A4AE',
    paddingLeft: 42,
    paddingRight: 42,
  },
  legendLow: {
    marginLeft: 0,
  },
  legendHigh: {
    marginRight: 0,
  },
  downloadButton: {
    backgroundColor: '#64B5F6',
    color: '#FFFFFF',
    border: 'none',
    padding: '10px 20px',
    borderRadius: 6,
    fontSize: 15,
    fontWeight: 600,
    transition: 'background-color 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
}

export default TextureModule
