import React, { useState } from 'react'
import ColorPalette from './components/ColorPalette'
import UIPreview from './components/UIPreview'
import { useColorStore } from './store'

const App: React.FC = () => {
  const [showExport, setShowExport] = useState(false)
  const [copied, setCopied] = useState(false)
  const exportScheme = useColorStore(state => state.exportScheme)
  const colors = useColorStore(state => state.colors)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportScheme())
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  return (
    <div style={{
      display: 'flex',
      width: '100%',
      height: '100%',
      background: '#F5F5F7',
      flexDirection: 'row',
    }} className="app-container">
      <style>{`
        * { box-sizing: border-box; }
        html, body, #root { margin: 0; padding: 0; width: 100%; height: 100%; }
        @media (max-width: 768px) {
          .app-container {
            flex-direction: column !important;
          }
          .palette-wrapper {
            width: 100% !important;
            flex: 0 0 30% !important;
            min-height: 220px;
          }
          .preview-wrapper {
            width: 100% !important;
            flex: 0 0 70% !important;
            border-left: none !important;
            border-top: 1px solid #E2E8F0;
          }
        }
      `}</style>
      <div className="palette-wrapper" style={{
        flex: '4',
        display: 'flex',
        minWidth: 0,
        minHeight: 0,
      }}>
        <ColorPalette />
      </div>
      <div className="preview-wrapper" style={{
        flex: '6',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid #E2E8F0',
        background: '#fff',
        minWidth: 0,
        minHeight: 0,
      }}>
        <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
          <UIPreview />
        </div>
        <div style={{
          padding: '16px 32px',
          borderTop: '1px solid #F1F5F9',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '12px',
          background: '#fff',
        }}>
          <div style={{
            display: 'flex',
            gap: '6px',
            alignItems: 'center',
          }}>
            {colors.slice(0, 5).map(c => (
              <div key={c.id} style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: c.hex,
                border: '1px solid rgba(0,0,0,0.08)',
              }} />
            ))}
          </div>
          <button
            onClick={() => setShowExport(true)}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              background: '#1E293B',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#334155'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#1E293B'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            导出色板
          </button>
        </div>
      </div>

      {showExport && (
        <div
          onClick={() => setShowExport(false)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '520px',
              width: '90%',
              maxHeight: '60vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#1E293B' }}>
              导出色板
            </h3>
            <pre style={{
              background: '#1E293B',
              color: '#E2E8F0',
              padding: '16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontFamily: 'Monaco, Consolas, monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              marginBottom: '16px',
              maxHeight: '300px',
              overflow: 'auto',
            }}>
              {exportScheme()}
            </pre>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowExport(false)}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  background: '#fff',
                  color: '#475569',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
              >
                关闭
              </button>
              <button
                onClick={handleCopy}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: copied ? '#10B981' : '#1E293B',
                  color: '#fff',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => {
                  if (!copied) e.currentTarget.style.background = '#334155'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = copied ? '#10B981' : '#1E293B'
                }}
              >
                {copied ? '已复制!' : '复制到剪贴板'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
