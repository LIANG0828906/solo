import { useEffect, useRef } from 'react'
import { CanvasRenderer } from './modules/CanvasRenderer'
import { ToolPanel } from './modules/ToolPanel'
import { useElementStore } from './store/elementStore'

function App() {
  const undo = useElementStore((s) => s.undo)
  const redo = useElementStore((s) => s.redo)
  const pushHistory = useElementStore((s) => s.pushHistory)
  const exportCanvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    pushHistory()
  }, [pushHistory])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey
      if (!ctrl) return
      const key = e.key.toLowerCase()
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if ((key === 'z' && e.shiftKey) || key === 'y') {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undo, redo])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FDF5E6 0%, #F5E6CC 50%, #FAEBD7 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0.4,
        }}
      >
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1" fill="#5D4037" opacity="0.15" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      <div style={{
        position: 'relative',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '32px 24px 60px',
        minHeight: '100vh',
        boxSizing: 'border-box',
      }}>
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #FFB300, #FF8F00)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFF',
                fontSize: 20,
                fontWeight: 'bold',
                boxShadow: '0 4px 10px rgba(255, 179, 0, 0.4)',
              }}
            >
              ✉
            </div>
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#5D4037',
                  fontFamily: 'Georgia, serif',
                  letterSpacing: 0.5,
                }}
              >
                回声明信片
              </h1>
              <p style={{
                margin: '2px 0 0 0',
                fontSize: 11,
                color: '#8D6E63',
                fontFamily: 'Georgia, serif',
              }}>
                设计属于你的专属数码明信片
              </p>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 11,
            color: '#8D6E63',
            fontFamily: 'Georgia, serif',
          }}>
            <kbd
              style={{
                padding: '3px 8px',
                borderRadius: 6,
                background: '#FFF',
                border: '1px solid #D7CCC8',
                fontSize: 10,
                color: '#5D4037',
                fontFamily: 'monospace',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              Ctrl+Z
            </kbd>
            <span>撤销</span>
          </div>
        </header>

        <div
          style={{
            display: 'flex',
            gap: 20,
            alignItems: 'flex-start',
            justifyContent: 'center',
          }}
        >
          <ToolPanel />

          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: 8,
            }}
          >
            <CanvasRenderer
              onExportRequested={(canvas) => {
                exportCanvasRef.current = canvas
              }}
            />

            <div
              style={{
                marginTop: 16,
                padding: '10px 20px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.6)',
                border: '1px solid rgba(93, 64, 55, 0.1)',
                fontSize: 11,
                color: '#8D6E63',
                fontFamily: 'Georgia, serif',
                textAlign: 'center',
                maxWidth: 600,
                lineHeight: 1.7,
              }}
            >
              <span style={{ color: '#FF8F00', fontWeight: 600 }}>提示：</span>
              选择「文字」在画布点击添加文字，双击文字可编辑内容；
              选择「贴纸」查看精美装饰素材；
              选择「画笔」自由涂鸦绘制。
              拖拽选中元素四周的圆点可缩放，拖拽顶部 ↻ 按钮或按 <b>Shift + 滚轮</b> 可旋转元素。
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
