import React, { useCallback, useState } from 'react'
import TokenEditor from './components/TokenEditor'
import CanvasPreview from './components/CanvasPreview'
import { useTokenStore, getColorById, darkenColor } from './store/tokenStore'

const App: React.FC = () => {
  const resetAll = useTokenStore((s) => s.resetAll)
  const getTokensForExport = useTokenStore((s) => s.getTokensForExport)
  const colors = useTokenStore((s) => s.colors)
  const primary = getColorById(colors, 'primary')
  const primaryDark = darkenColor(primary, 0.15)

  const [exportHover, setExportHover] = useState(false)
  const [resetHover, setResetHover] = useState(false)

  const handleExport = useCallback(() => {
    const tokens = getTokensForExport()
    const json = JSON.stringify(tokens, null, 2)
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `design-tokens-${new Date()
      .toISOString()
      .replace(/[:.]/g, '-')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }, [getTokensForExport])

  const handleReset = useCallback(() => {
    const ok = window.confirm('确定要将所有设计令牌重置为默认值吗？此操作不可撤销。')
    if (ok) {
      resetAll()
    }
  }, [resetAll])

  return (
    <div
      style={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        margin: 0,
        padding: 0,
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      <TokenEditor />

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 24px',
            background: '#ffffff',
            borderBottom: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          <div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#111827',
                letterSpacing: '0.2px',
              }}
            >
              实时预览画布
            </div>
            <div
              style={{
                fontSize: '11px',
                color: '#6b7280',
                marginTop: '2px',
              }}
            >
              Live Preview Canvas · 令牌变化实时响应
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleExport}
              onMouseEnter={() => setExportHover(true)}
              onMouseLeave={() => setExportHover(false)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                background: exportHover ? primary : '#374151',
                color: '#fff',
                transition: 'all 200ms ease',
                boxShadow: exportHover
                  ? `0 4px 12px ${primary}40`
                  : '0 1px 3px rgba(0,0,0,0.1)',
                letterSpacing: '0.2px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span style={{ fontSize: '13px' }}>⬇</span>
              导出 JSON
            </button>
            <button
              onClick={handleReset}
              onMouseEnter={() => setResetHover(true)}
              onMouseLeave={() => setResetHover(false)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: resetHover ? `1.5px solid ${primaryDark}` : '1.5px solid #d1d5db',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                background: resetHover ? `${primary}08` : '#ffffff',
                color: resetHover ? primaryDark : '#374151',
                transition: 'all 200ms ease',
                letterSpacing: '0.2px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span style={{ fontSize: '13px' }}>↺</span>
              重置默认
            </button>
          </div>
        </div>

        <CanvasPreview />
      </div>
    </div>
  )
}

export default React.memo(App)
