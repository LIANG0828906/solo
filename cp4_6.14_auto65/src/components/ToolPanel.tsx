import { useRef, useState, useEffect, useCallback } from 'react'
import type { ToolType } from '../types'

interface ToolButton {
  id: ToolType
  label: string
  color?: string
  key: string
}

const TOOLS: ToolButton[] = [
  { id: 'ground', label: '地面', color: '#92400e', key: '1' },
  { id: 'wall', label: '墙壁', color: '#475569', key: '2' },
  { id: 'platform', label: '平台', color: '#65a30d', key: '3' },
  { id: 'eraser', label: '橡皮擦', color: '#64748b', key: '0' }
]

interface ToolPanelProps {
  currentTool: ToolType
  onToolChange: (tool: ToolType) => void
  onUndo: () => void
  onRedo: () => void
  onSave: () => Promise<boolean>
  onLoad: (file: File) => void
  canUndo: boolean
  canRedo: boolean
}

export default function ToolPanel({
  currentTool,
  onToolChange,
  onUndo,
  onRedo,
  onSave,
  onLoad,
  canUndo,
  canRedo
}: ToolPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const spinTimerRef = useRef<number | null>(null)
  const spinStartTimeRef = useRef<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    return () => {
      if (spinTimerRef.current !== null) {
        clearTimeout(spinTimerRef.current)
        spinTimerRef.current = null
      }
    }
  }, [])

  const handleSave = useCallback(async () => {
    if (isSaving) return false

    if (spinTimerRef.current !== null) {
      clearTimeout(spinTimerRef.current)
      spinTimerRef.current = null
    }

    setIsSaving(true)
    spinStartTimeRef.current = Date.now()

    try {
      const success = await onSave()

      const elapsed = Date.now() - (spinStartTimeRef.current ?? 0)
      const remaining = Math.max(0, 500 - elapsed)

      spinTimerRef.current = window.setTimeout(() => {
        setIsSaving(false)
        spinTimerRef.current = null
        spinStartTimeRef.current = null
      }, remaining)

      return success
    } catch (error) {
      const elapsed = Date.now() - (spinStartTimeRef.current ?? 0)
      const remaining = Math.max(0, 500 - elapsed)

      spinTimerRef.current = window.setTimeout(() => {
        setIsSaving(false)
        spinTimerRef.current = null
        spinStartTimeRef.current = null
      }, remaining)

      return false
    }
  }, [isSaving, onSave])

  const handleLoadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.name.endsWith('.json')) {
      onLoad(file)
      e.target.value = ''
    }
  }, [onLoad])

  const handleToolClick = useCallback((toolId: ToolType) => {
    onToolChange(toolId)
  }, [onToolChange])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement && e.target.type === 'file') return

    switch (e.key) {
      case '1':
        onToolChange('ground')
        break
      case '2':
        onToolChange('wall')
        break
      case '3':
        onToolChange('platform')
        break
      case '0':
        onToolChange('eraser')
        break
      case 'z':
      case 'Z':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          if (e.shiftKey) {
            onRedo()
          } else {
            onUndo()
          }
        }
        break
    }
  }, [onToolChange, onUndo, onRedo])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div
      style={{
        width: '240px',
        background: '#1e293b',
        padding: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        height: '100%',
        flexShrink: 0
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h3 style={{ color: '#f1f5f9', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
          地形刷
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {TOOLS.map(tool => {
            const isActive = currentTool === tool.id
            return (
              <button
                key={tool.id}
                onClick={() => handleToolClick(tool.id)}
                title={`${tool.label} (${tool.key})`}
                style={{
                  width: '48px',
                  height: '48px',
                  border: isActive ? '2px solid #3b82f6' : '2px solid transparent',
                  borderRadius: '6px',
                  background: isActive ? '#334155' : '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  transition: 'all 0.2s ease',
                  color: '#f1f5f9',
                  fontSize: '11px'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = '#64748b'
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = '#475569'
                }}
              >
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: tool.id === 'eraser' ? '50%' : '2px',
                    background: tool.color || '#64748b'
                  }}
                />
                <span>{tool.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h3 style={{ color: '#f1f5f9', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
          敌人
        </h3>
        <button
          onClick={() => handleToolClick('enemy')}
          style={{
            padding: '10px 12px',
            border: currentTool === 'enemy' ? '2px solid #3b82f6' : '2px solid transparent',
            borderRadius: '6px',
            background: currentTool === 'enemy' ? '#334155' : '#475569',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.2s ease',
            color: '#f1f5f9',
            fontSize: '14px'
          }}
          onMouseEnter={(e) => {
            if (currentTool !== 'enemy') e.currentTarget.style.background = '#64748b'
          }}
          onMouseLeave={(e) => {
            if (currentTool !== 'enemy') e.currentTarget.style.background = '#475569'
          }}
        >
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#dc2626'
            }}
          />
          <span>放置敌人</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h3 style={{ color: '#f1f5f9', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
          操作
        </h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderRadius: '6px',
              background: canUndo ? '#475569' : '#334155',
              cursor: canUndo ? 'pointer' : 'not-allowed',
              color: canUndo ? '#f1f5f9' : '#64748b',
              fontSize: '13px',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (canUndo) e.currentTarget.style.background = '#64748b'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = canUndo ? '#475569' : '#334155'
            }}
          >
            撤销 (Ctrl+Z)
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderRadius: '6px',
              background: canRedo ? '#475569' : '#334155',
              cursor: canRedo ? 'pointer' : 'not-allowed',
              color: canRedo ? '#f1f5f9' : '#64748b',
              fontSize: '13px',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (canRedo) e.currentTarget.style.background = '#64748b'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = canRedo ? '#475569' : '#334155'
            }}
          >
            重做 (Ctrl+Shift+Z)
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
        <h3 style={{ color: '#f1f5f9', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
          关卡
        </h3>
        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{
            padding: '10px 12px',
            border: 'none',
            borderRadius: '6px',
            background: isSaving ? '#334155' : '#3b82f6',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            color: 'white',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'background 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            if (!isSaving) e.currentTarget.style.background = '#2563eb'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = isSaving ? '#334155' : '#3b82f6'
          }}
        >
          {isSaving && (
            <div
              style={{
                width: '16px',
                height: '16px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderTopColor: 'white',
                borderRadius: '50%',
                animation: 'spin 0.5s linear infinite'
              }}
            />
          )}
          {isSaving ? '保存中...' : '保存'}
        </button>

        <button
          onClick={handleLoadClick}
          style={{
            padding: '10px 12px',
            border: 'none',
            borderRadius: '6px',
            background: '#475569',
            cursor: 'pointer',
            color: 'white',
            fontSize: '14px',
            transition: 'background 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#64748b'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#475569'}
        >
          加载
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '8px' }}>
        <div>提示：</div>
        <div>• 空格：临时平移</div>
        <div>• 滚轮：缩放 25%-400%</div>
        <div>• 右键敌人：删除</div>
      </div>
    </div>
  )
}
