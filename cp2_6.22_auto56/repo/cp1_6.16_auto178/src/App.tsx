import React, { useState, useEffect, useCallback } from 'react'
import { Settings } from 'lucide-react'
import Toolbar from './modules/editor/components/Toolbar'
import Canvas from './modules/editor/components/Canvas'
import PropertyPanel from './modules/editor/components/PropertyPanel'
import { initCollaboration, disconnectCollaboration } from './modules/editor/services/collaboration'

interface SyncNotification {
  id: number
  count: number
  exiting: boolean
}

const App: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false)
  const [panelOpen, setPanelOpen] = useState(true)
  const [notifications, setNotifications] = useState<SyncNotification[]>([])

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) {
        setPanelOpen(false)
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleSync = useCallback((count: number) => {
    const id = Date.now()
    setNotifications((prev) => [...prev, { id, count, exiting: false }])

    setTimeout(() => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, exiting: true } : n))
      )
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
      }, 200)
    }, 2000)
  }, [])

  useEffect(() => {
    initCollaboration(handleSync)
    return () => disconnectCollaboration()
  }, [handleSync])

  return (
    <div className="w-full h-full flex flex-col bg-[#FAFAFA]">
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              notification.exiting
                ? 'sync-notification-exit'
                : 'sync-notification-enter'
            }`}
            style={{
              backgroundColor: '#E8F5E9',
              color: '#2E7D32',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            已同步 {notification.count} 条更新
          </div>
        ))}
      </div>

      <Toolbar />

      <div className="flex-1 flex overflow-hidden relative">
        <Canvas />

        {isMobile ? (
          <>
            {panelOpen && (
              <div
                className="fixed inset-0 bg-black/30 z-40"
                onClick={() => setPanelOpen(false)}
              />
            )}
            <div
              className={`fixed right-0 top-14 bottom-0 z-50 transition-all duration-200 ease-out ${
                panelOpen ? 'translate-x-0' : 'translate-x-full'
              }`}
              style={{ width: 'min(320px, 85vw)' }}
            >
              <PropertyPanel isOpen={true} onClose={() => setPanelOpen(false)} />
            </div>
            {!panelOpen && (
              <button
                onClick={() => setPanelOpen(true)}
                className="fixed right-4 bottom-4 w-14 h-14 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg hover:bg-blue-600 active:bg-blue-700 transition-all duration-200 z-40"
              >
                <Settings size={24} />
              </button>
            )}
          </>
        ) : (
          <PropertyPanel isOpen={panelOpen} onClose={() => setPanelOpen(false)} />
        )}
      </div>
    </div>
  )
}

export default App
