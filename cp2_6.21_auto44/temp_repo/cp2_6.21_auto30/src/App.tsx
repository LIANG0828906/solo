import { useEffect, useState } from 'react'
import ControlPanel from './components/ControlPanel'
import PreviewArea from './components/PreviewArea'

type LayoutMode = 'desktop' | 'tablet' | 'mobile'

export default function App() {
  const [mode, setMode] = useState<LayoutMode>('desktop')
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    function update() {
      const w = window.innerWidth
      if (w < 640) setMode('mobile')
      else if (w < 1024) setMode('tablet')
      else setMode('desktop')
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    if (mode === 'desktop') setDrawerOpen(false)
  }, [mode])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f4ff 0%, #e8ecf8 100%)',
        fontFamily: 'Inter, system-ui, sans-serif',
        position: 'relative',
        overflow: mode !== 'desktop' && drawerOpen ? 'hidden' : 'initial',
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        html, body, #root { height: 100%; margin: 0; padding: 0; }
      `}</style>

      {mode !== 'desktop' && (
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="打开菜单"
          style={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 40,
            width: 44,
            height: 44,
            borderRadius: 12,
            border: 'none',
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
            minWidth: 44,
            minHeight: 44,
          }}
          className="hamburger-btn"
        >
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      )}

      {mode === 'desktop' ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            padding: '32px 0',
            gap: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
            }}
          >
            <ControlPanel />
            <div style={{ padding: 40, background: 'linear-gradient(135deg, #f8faff 0%, #eef2ff 100%)' }}>
              <PreviewArea />
            </div>
          </div>
        </div>
      ) : mode === 'tablet' ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            padding: '24px 16px',
          }}
        >
          <PreviewArea />
          {drawerOpen && (
            <>
              <div
                onClick={() => setDrawerOpen(false)}
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(0,0,0,0.3)',
                  zIndex: 50,
                  animation: 'fadeIn 0.25s ease',
                }}
              />
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  zIndex: 60,
                  transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
                  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  maxWidth: '82%',
                }}
              >
                <ControlPanel onClose={() => setDrawerOpen(false)} />
              </div>
            </>
          )}
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '72px 12px 16px 12px',
            width: '100%',
          }}
        >
          <div style={{ width: '100%', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: 520, transform: 'scale(0.9)', transformOrigin: 'center' }}>
              <PreviewArea />
            </div>
          </div>
          {drawerOpen && (
            <>
              <div
                onClick={() => setDrawerOpen(false)}
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(0,0,0,0.3)',
                  zIndex: 50,
                  animation: 'fadeIn 0.25s ease',
                }}
              />
              <div
                style={{
                  position: 'fixed',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: '50vh',
                  zIndex: 60,
                  transform: drawerOpen ? 'translateY(0)' : 'translateY(100%)',
                  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    padding: '10px 0 6px 0',
                    background: '#ffffff',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 5,
                      borderRadius: 3,
                      background: '#ddd',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    aria-label="关闭面板"
                    style={{
                      position: 'absolute',
                      right: 14,
                      top: 8,
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      border: 'none',
                      background: 'rgba(99,102,241,0.08)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#6366f1',
                      minWidth: 44,
                      minHeight: 44,
                    }}
                  >
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <div style={{ height: 'calc(50vh - 48px)', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
                  <ControlPanel onClose={() => setDrawerOpen(false)} />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @media (hover: hover) {
          .hamburger-btn:hover {
            background: rgba(255,255,255,0.9);
          }
        }
      `}</style>
    </div>
  )
}
