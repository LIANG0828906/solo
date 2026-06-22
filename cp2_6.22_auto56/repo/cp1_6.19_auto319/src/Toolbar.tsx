import { useWhiteboardStore } from './store'
import type { ToolType } from './types'

const tools: { type: ToolType; label: string; icon: React.ReactNode }[] = [
  {
    type: 'select',
    label: '选择',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
      </svg>
    ),
  },
  {
    type: 'rect',
    label: '矩形',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="5" width="18" height="14" rx="1" />
      </svg>
    ),
  },
  {
    type: 'circle',
    label: '圆形',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
  },
  {
    type: 'line',
    label: '连线',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="5" y1="19" x2="19" y2="5" />
        <circle cx="5" cy="19" r="2" fill="currentColor" />
        <circle cx="19" cy="5" r="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    type: 'arrow',
    label: '箭头',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="5" y1="19" x2="19" y2="5" />
        <polyline points="10 5 19 5 19 14" />
      </svg>
    ),
  },
  {
    type: 'text',
    label: '文字',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="4 7 4 4 20 4 20 7" />
        <line x1="9" y1="20" x2="15" y2="20" />
        <line x1="12" y1="4" x2="12" y2="20" />
      </svg>
    ),
  },
]

const Toolbar = () => {
  const {
    currentTool,
    setCurrentTool,
    selectedId,
    deleteSelected,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useWhiteboardStore()

  const handleExport = async () => {
    const svg = document.getElementById('whiteboard-svg')
    if (!svg) return

    const canvas = document.createElement('canvas')
    const rect = svg.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#2d2d2d'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(svg)
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)
    const img = new Image()

    img.onload = () => {
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
      const link = document.createElement('a')
      link.download = `whiteboard-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
    img.src = url
  }

  return (
    <div
      style={{
        width: 240,
        height: '100%',
        backgroundColor: '#1e1e1e',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 0',
        gap: 8,
        borderRight: '1px solid #333',
      }}
    >
      <div
        style={{
          padding: '0 16px 16px',
          borderBottom: '1px solid #333',
          marginBottom: 8,
        }}
      >
        <h2
          style={{
            color: '#fff',
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          白板工具
        </h2>
      </div>

      <div style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {tools.map((tool) => {
          const isActive = currentTool === tool.type
          return (
            <button
              key={tool.type}
              onClick={() => setCurrentTool(tool.type)}
              title={tool.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 16px',
                border: 'none',
                background: 'transparent',
                color: isActive ? '#fff' : '#ccc',
                cursor: 'pointer',
                fontSize: 14,
                borderRadius: 4,
                position: 'relative',
                transition: 'background-color 0.2s ease, color 0.15s ease',
                ...(isActive
                  ? {
                      backgroundColor: '#333',
                    }
                  : {}),
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#333'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 3,
                    height: 24,
                    backgroundColor: '#FF6B35',
                    borderRadius: '0 2px 2px 0',
                  }}
                />
              )}
              {tool.icon}
              <span>{tool.label}</span>
            </button>
          )
        })}
      </div>

      <div
        style={{
          marginTop: 'auto',
          padding: '16px 8px 8px',
          borderTop: '1px solid #333',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <button
          onClick={deleteSelected}
          disabled={!selectedId}
          title="删除选中 (Delete)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 16px',
            border: 'none',
            background: 'transparent',
            color: selectedId ? '#ff6b6b' : '#666',
            cursor: selectedId ? 'pointer' : 'not-allowed',
            fontSize: 14,
            borderRadius: 4,
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (selectedId) {
              e.currentTarget.style.backgroundColor = '#333'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          <span>删除</span>
        </button>

        <div style={{ display: 'flex', gap: 4, padding: '0 8px' }}>
          <button
            onClick={undo}
            disabled={!canUndo()}
            title="撤销 (Ctrl+Z)"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px',
              border: 'none',
              background: 'transparent',
              color: canUndo() ? '#ccc' : '#666',
              cursor: canUndo() ? 'pointer' : 'not-allowed',
              fontSize: 14,
              borderRadius: 4,
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (canUndo()) {
                e.currentTarget.style.backgroundColor = '#333'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </button>

          <button
            onClick={redo}
            disabled={!canRedo()}
            title="重做 (Ctrl+Shift+Z)"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px',
              border: 'none',
              background: 'transparent',
              color: canRedo() ? '#ccc' : '#666',
              cursor: canRedo() ? 'pointer' : 'not-allowed',
              fontSize: 14,
              borderRadius: 4,
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (canRedo()) {
                e.currentTarget.style.backgroundColor = '#333'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
            </svg>
          </button>
        </div>

        <button
          onClick={handleExport}
          title="导出PNG"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 16px',
            margin: '4px 8px 0',
            border: 'none',
            background: '#4A90D9',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 14,
            borderRadius: 4,
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#5AA0E9'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#4A90D9'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>导出PNG</span>
        </button>
      </div>
    </div>
  )
}

export default Toolbar
