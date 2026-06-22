import { useState, useEffect } from 'react'
import TopBar from '@/components/TopBar'
import Toolbar from '@/components/Toolbar'
import Canvas from '@/components/Canvas'
import PropertyPanel from '@/components/PropertyPanel'
import ToastContainer from '@/components/ToastContainer'
import TemplateModal from '@/components/TemplateModal'
import LoadProjectModal from '@/components/LoadProjectModal'

export default function App() {
  const [isNarrow, setIsNarrow] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    const checkWidth = () => {
      const narrow = window.innerWidth < 1024
      setIsNarrow(narrow)
      setSidebarCollapsed(narrow)
    }
    checkWidth()
    window.addEventListener('resize', checkWidth)
    return () => window.removeEventListener('resize', checkWidth)
  }, [])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        height: '100vh',
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        overflow: 'hidden',
      }}
    >
      <TopBar />

      <div
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {!sidebarCollapsed && (
          <Toolbar />
        )}

        <div
          style={{
            flex: 1,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {isNarrow && (
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                zIndex: 50,
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                borderRadius: 8,
                padding: '6px 10px',
                color: '#F8FAFC',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              {sidebarCollapsed ? '☰ 展开侧栏' : '✕ 收起侧栏'}
            </button>
          )}
          <Canvas />
        </div>

        {!sidebarCollapsed && (
          <PropertyPanel />
        )}
      </div>

      <ToastContainer />
      <TemplateModal />
      <LoadProjectModal />
    </div>
  )
}
