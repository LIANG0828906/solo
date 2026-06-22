import { useState, useRef, useEffect, useCallback } from 'react'
import { useBreakpointStore } from './stores/breakpointStore'
import { useResizeObserver } from './hooks/useResizeObserver'
import { DeviceFrame } from './components/DeviceFrame'
import { ControlPanel } from './components/ControlPanel'
import html2canvas from 'html2canvas'

const DEMO_URL = '/src/assets/demo.html'

export function App() {
  const { breakpoints } = useBreakpointStore()
  const [panelOpen, setPanelOpen] = useState(false)
  const [targetUrl, setTargetUrl] = useState(DEMO_URL)
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null)
  const [isSnapshotting, setIsSnapshotting] = useState(false)
  const viewportContainerRef = useRef<HTMLDivElement>(null)
  const frameRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const containerWidth = useResizeObserver(viewportContainerRef)

  const setFrameRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
    if (el) {
      frameRefs.current.set(id, el)
    } else {
      frameRefs.current.delete(id)
    }
  }, [])

  const handleSnapshot = async () => {
    setIsSnapshotting(true)
    try {
      const canvases: HTMLCanvasElement[] = []

      for (const bp of breakpoints) {
        const frameEl = frameRefs.current.get(bp.id)
        if (!frameEl) continue

        const iframe = frameEl.querySelector('iframe')
        if (!iframe?.contentDocument?.body) continue

        const canvas = await html2canvas(iframe.contentDocument.body, {
          backgroundColor: '#ffffff',
          scale: 1,
          useCORS: true,
        })
        canvases.push(canvas)
      }

      if (canvases.length === 0) {
        setIsSnapshotting(false)
        return
      }

      const totalWidth = canvases.reduce((sum, c) => sum + c.width + 16, 0) + 16
      const maxHeight = Math.max(...canvases.map((c) => c.height)) + 80

      const combinedCanvas = document.createElement('canvas')
      combinedCanvas.width = totalWidth
      combinedCanvas.height = maxHeight

      const ctx = combinedCanvas.getContext('2d')
      if (!ctx) return

      ctx.fillStyle = '#1E1E2E'
      ctx.fillRect(0, 0, totalWidth, maxHeight)

      let xOffset = 16

      canvases.forEach((canvas, index) => {
        const bp = breakpoints[index]
        if (!bp) return

        ctx.fillStyle = bp.color
        ctx.fillRect(xOffset, 16, canvas.width, 4)

        ctx.fillStyle = '#CDD6F4'
        ctx.font = '14px system-ui, sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(`${bp.label} · ${bp.width}px`, xOffset, 48)

        ctx.drawImage(canvas, xOffset, 64)
        xOffset += canvas.width + 16
      })

      const dataUrl = combinedCanvas.toDataURL('image/png')
      setSnapshotUrl(dataUrl)
    } catch (error) {
      console.error('Snapshot failed:', error)
    } finally {
      setIsSnapshotting(false)
    }
  }

  const handleDownloadSnapshot = () => {
    if (!snapshotUrl) return
    const link = document.createElement('a')
    link.download = `breakpoint-snapshot-${Date.now()}.png`
    link.href = snapshotUrl
    link.click()
  }

  const closeSnapshot = () => {
    setSnapshotUrl(null)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeSnapshot()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="app-container">
      <header className="app-toolbar">
        <div className="toolbar-title">CSS 断点调试器</div>

        <div className="toolbar-url-input-wrapper">
          <input
            type="text"
            className="toolbar-url-input"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="输入调试目标页面 URL"
          />
        </div>

        <button
          className="snapshot-btn"
          onClick={handleSnapshot}
          disabled={isSnapshotting}
        >
          {isSnapshotting ? '生成中...' : '📷 快照'}
        </button>
      </header>

      <div className="app-main">
        <ControlPanel isOpen={panelOpen} onToggle={() => setPanelOpen(!panelOpen)} />

        <div
          className="viewport-container"
          ref={viewportContainerRef}
          style={{
            overflowX: containerWidth < breakpoints.reduce((sum, bp) => sum + bp.width + 16, 0) ? 'auto' : 'hidden',
          }}
        >
          <div className="viewport-grid">
            {breakpoints.map((bp) => (
              <DeviceFrame
                key={bp.id}
                breakpoint={bp}
                src={targetUrl}
                frameRef={setFrameRef(bp.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {snapshotUrl && (
        <div className="snapshot-modal-overlay" onClick={closeSnapshot}>
          <div className="snapshot-modal" onClick={(e) => e.stopPropagation()}>
            <div className="snapshot-modal-header">
              <h3>断点快照对比</h3>
              <div className="snapshot-modal-actions">
                <button className="download-btn" onClick={handleDownloadSnapshot}>
                  ⬇ 下载 PNG
                </button>
                <button className="close-btn" onClick={closeSnapshot}>
                  ✕
                </button>
              </div>
            </div>
            <div className="snapshot-modal-content">
              <img src={snapshotUrl} alt="断点快照对比" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
