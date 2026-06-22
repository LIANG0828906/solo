import React, { useState } from 'react'
import { StoreProvider, useStore } from './store/InspirationStore'
import QuickNotePanel from './components/QuickNotePanel'
import ThemeCanvas from './components/ThemeCanvas'
import TimelineView from './components/TimelineView'
import ExportModal from './components/ExportModal'

const Toolbar: React.FC<{ onExport: () => void }> = ({ onExport }) => {
  const { state, dispatch } = useStore()
  const [showNewThemeInput, setShowNewThemeInput] = useState(false)
  const [newThemeName, setNewThemeName] = useState('')

  const handleCreateTheme = () => {
    if (!newThemeName.trim()) return
    dispatch({ type: 'ADD_THEME', payload: { name: newThemeName.trim() } })
    setNewThemeName('')
    setShowNewThemeInput(false)
  }

  return (
    <div
      style={{
        height: '48px',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 700,
          }}
        >
          灵
        </div>
        <span style={{ fontSize: '15px', fontWeight: 600, color: '#1F2937' }}>灵感织网</span>
      </div>

      <div style={{ width: '1px', height: '24px', backgroundColor: '#E5E7EB' }} />

      <div style={{ display: 'flex', gap: '4px', backgroundColor: '#F3F4F6', padding: '3px', borderRadius: '8px' }}>
        <button
          onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'canvas' })}
          style={{
            padding: '6px 14px',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer',
            backgroundColor: state.viewMode === 'canvas' ? '#FFFFFF' : 'transparent',
            color: state.viewMode === 'canvas' ? '#3B82F6' : '#6B7280',
            fontWeight: 500,
            boxShadow: state.viewMode === 'canvas' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          主题画布
        </button>
        <button
          onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'timeline' })}
          style={{
            padding: '6px 14px',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer',
            backgroundColor: state.viewMode === 'timeline' ? '#FFFFFF' : 'transparent',
            color: state.viewMode === 'timeline' ? '#3B82F6' : '#6B7280',
            fontWeight: 500,
            boxShadow: state.viewMode === 'timeline' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          时间线
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
        {state.themes.length > 0 && (
          <select
            value={state.activeThemeId || ''}
            onChange={(e) =>
              dispatch({ type: 'SET_ACTIVE_THEME', payload: e.target.value || null })
            }
            style={{
              padding: '6px 10px',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '12px',
              backgroundColor: '#FFFFFF',
              color: '#374151',
              outline: 'none',
              cursor: 'pointer',
              minWidth: '140px',
            }}
          >
            <option value="">选择主题...</option>
            {state.themes.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </select>
        )}

        {showNewThemeInput ? (
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              value={newThemeName}
              onChange={(e) => setNewThemeName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateTheme()}
              placeholder="输入主题名称"
              autoFocus
              style={{
                padding: '6px 10px',
                border: '1px solid #3B82F6',
                borderRadius: '6px',
                fontSize: '12px',
                outline: 'none',
                width: '140px',
              }}
            />
            <button
              onClick={handleCreateTheme}
              style={{
                padding: '6px 12px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: '#3B82F6',
                color: '#fff',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              创建
            </button>
            <button
              onClick={() => {
                setShowNewThemeInput(false)
                setNewThemeName('')
              }}
              style={{
                padding: '6px 10px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: '#F3F4F6',
                color: '#6B7280',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              取消
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewThemeInput(true)}
            style={{
              padding: '6px 12px',
              border: '1px dashed #9CA3AF',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              color: '#6B7280',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#3B82F6'
              e.currentTarget.style.color = '#3B82F6'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#9CA3AF'
              e.currentTarget.style.color = '#6B7280'
            }}
          >
            + 新建主题
          </button>
        )}
      </div>

      <button
        onClick={onExport}
        disabled={!state.activeThemeId}
        style={{
          padding: '7px 14px',
          border: 'none',
          borderRadius: '8px',
          backgroundColor: state.activeThemeId ? '#3B82F6' : '#E5E7EB',
          color: state.activeThemeId ? '#FFFFFF' : '#9CA3AF',
          fontSize: '12px',
          fontWeight: 500,
          cursor: state.activeThemeId ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'background-color 0.2s ease',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        导出
      </button>
    </div>
  )
}

const AppContent: React.FC = () => {
  const { state } = useStore()
  const [exportModalOpen, setExportModalOpen] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      <Toolbar onExport={() => setExportModalOpen(true)} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <QuickNotePanel />
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {state.viewMode === 'canvas' ? <ThemeCanvas /> : <TimelineView />}
        </div>
      </div>
      <ExportModal isOpen={exportModalOpen} onClose={() => setExportModalOpen(false)} />
    </div>
  )
}

const App: React.FC = () => {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  )
}

export default App
