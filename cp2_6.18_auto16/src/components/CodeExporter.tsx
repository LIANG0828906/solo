import { useEffect, useState } from 'react'
import { useAnimationStore } from '@/store/animationStore'

export function CodeExporter() {
  const isOpen = useAnimationStore((s) => s.isExportPanelOpen)
  const toggleExportPanel = useAnimationStore((s) => s.toggleExportPanel)
  const selectedTrackId = useAnimationStore((s) => s.selectedTrackId)
  const tracks = useAnimationStore((s) => s.tracks)
  const generateCSS = useAnimationStore((s) => s.generateCSS)
  const [currentTrackId, setCurrentTrackId] = useState<string>('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (selectedTrackId) {
        setCurrentTrackId(selectedTrackId)
      } else if (tracks.length > 0 && !currentTrackId) {
        setCurrentTrackId(tracks[0].id)
      }
    }
  }, [isOpen, selectedTrackId, tracks, currentTrackId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) toggleExportPanel(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, toggleExportPanel])

  const cssCode = currentTrackId ? generateCSS(currentTrackId) : ''

  const handleCopy = async () => {
    if (!cssCode) return
    try {
      await navigator.clipboard.writeText(cssCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = cssCode
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <>
      <div
        className={`code-exporter-overlay ${isOpen ? 'open' : ''}`}
        onClick={() => toggleExportPanel(false)}
      />
      <div className={`code-exporter-panel ${isOpen ? 'open' : ''}`}>
        <div className="code-exporter-header">
          <h2 className="code-exporter-title">📋 CSS 代码导出</h2>
          <button className="code-exporter-close" onClick={() => toggleExportPanel(false)}>
            ×
          </button>
        </div>

        <div className="code-exporter-body">
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', color: '#888', marginBottom: '8px', display: 'block' }}>
              选择动画曲线
            </label>
            <select
              className="curve-select"
              style={{ width: '100%' }}
              value={currentTrackId}
              onChange={(e) => setCurrentTrackId(e.target.value)}
            >
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} - ({t.duration}ms)
                </option>
              ))}
            </select>
          </div>

          {currentTrackId && (() => {
            const track = tracks.find((t) => t.id === currentTrackId)
            if (!track) return null
            return (
              <div
                style={{
                  marginBottom: '16px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: 'rgba(0, 229, 255, 0.06)',
                  border: '1px solid rgba(0, 229, 255, 0.15)',
                  fontSize: '12px',
                  color: '#B0B0C0',
                  fontFamily: 'Consolas, monospace',
                }}
              >
                timing-function:{' '}
                <span style={{ color: '#00E5FF' }}>
                  cubic-bezier({track.curve.x1}, {track.curve.y1}, {track.curve.x2}, {track.curve.y2})
                </span>
                <br />
                keyframes:{' '}
                <span style={{ color: '#FFD700' }}>{track.keyframes.length} 个关键帧</span>
                {' · '}
                duration: <span style={{ color: '#FFA07A' }}>{track.duration}ms</span>
              </div>
            )
          })()}

          <div className="code-block">
            <button className={`copy-button ${copied ? 'copied' : ''}`} onClick={handleCopy}>
              {copied ? '✓ Copied!' : '📄 Copy'}
            </button>
            <pre
              style={{
                margin: 0,
                padding: 0,
                fontFamily: 'inherit',
                fontSize: 'inherit',
                lineHeight: 'inherit',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                marginTop: '28px',
              }}
            >
              <code>{cssCode}</code>
            </pre>
          </div>

          <div
            style={{
              marginTop: '20px',
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.06)',
              border: '1px solid rgba(99, 102, 241, 0.15)',
              fontSize: '12px',
              color: '#A0A0B0',
              lineHeight: 1.7,
            }}
          >
            💡 <strong style={{ color: '#C0C0D0' }}>使用说明：</strong>
            <br />
            1. 将上方 <code style={{ color: '#00E5FF', background: 'rgba(0,229,255,0.1)', padding: '1px 5px', borderRadius: '3px' }}>@keyframes</code> 复制到 CSS 文件中
            <br />
            2. 将 <code style={{ color: '#FFD700', background: 'rgba(255,215,0,0.1)', padding: '1px 5px', borderRadius: '3px' }}>.animated-element</code> 类应用到目标元素
            <br />
            3. 调整 <code style={{ color: '#FFA07A', background: 'rgba(255,160,122,0.1)', padding: '1px 5px', borderRadius: '3px' }}>translateX</code> 像素值适配实际场景
          </div>
        </div>
      </div>
    </>
  )
}
