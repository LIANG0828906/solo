import { useCallback, useEffect } from 'react'
import { useStore } from '@/store'
import { MaterialsBoard } from '@/MaterialsBoard'
import { ProjectGallery } from '@/ProjectGallery'
import NavBar from '@/components/NavBar'
import FavoritesDrawer from '@/components/FavoritesDrawer'
import PublishMaterialModal from '@/components/PublishMaterialModal'
import PublishProjectModal from '@/components/PublishProjectModal'
import ConfirmDialog from '@/components/ConfirmDialog'
import NotificationBell from '@/components/NotificationBell'

export default function App() {
  const {
    activeTab,
    setActiveTab,
    showFavoritesDrawer,
    setShowFavoritesDrawer,
    showPublishMaterial,
    setShowPublishMaterial,
    showPublishProject,
    setShowPublishProject,
    confirmDialog,
    setConfirmDialog,
    updateMaterialStatus,
    addNotification,
    notifications,
    markNotificationRead,
  } = useStore()

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleConfirmTaken = useCallback(() => {
    if (!confirmDialog) return
    updateMaterialStatus(confirmDialog.materialId, 'taken')
    addNotification({
      type: 'taken',
      message: confirmDialog.message,
      materialId: confirmDialog.materialId,
    })
    setConfirmDialog(null)
  }, [confirmDialog, updateMaterialStatus, addNotification, setConfirmDialog])

  const handleOpenPublish = useCallback(
    (type: 'material' | 'project') => {
      if (type === 'material') {
        setShowPublishMaterial(true)
      } else {
        setShowPublishProject(true)
      }
    },
    [setShowPublishMaterial, setShowPublishProject]
  )

  useEffect(() => {
    if (unreadCount > 0) {
      const timer = setTimeout(() => {
        notifications.filter((n) => !n.read).forEach((n) => {
          markNotificationRead(n.id)
        })
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [unreadCount, notifications, markNotificationRead])

  return (
    <div className="min-h-screen bg-sky-light">
      <NavBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenFavorites={() => setShowFavoritesDrawer(true)}
        notificationCount={unreadCount}
        onOpenPublish={handleOpenPublish}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[88px] pb-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-dark mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            {activeTab === 'materials' ? '余料看板' : '项目灵感'}
          </h1>
          <p className="text-gray-500 text-sm">
            {activeTab === 'materials'
              ? '发现身边闲置的装修余料，让资源找到新主人'
              : '探索DIY创意项目，找到你心仪的手作灵感'}
          </p>
        </div>

        <div className="relative overflow-hidden">
          <div
            className="transition-transform duration-300 ease-smooth"
            style={{
              transform: activeTab === 'materials' ? 'translateX(0)' : 'translateX(-100%)',
              position: activeTab === 'materials' ? 'relative' : 'absolute',
              width: '100%',
              top: 0,
              left: 0,
            }}
          >
            <MaterialsBoard />
          </div>
          <div
            className="transition-transform duration-300 ease-smooth"
            style={{
              transform: activeTab === 'projects' ? 'translateX(0)' : 'translateX(100%)',
              position: activeTab === 'projects' ? 'relative' : 'absolute',
              width: '100%',
              top: 0,
              left: 0,
              opacity: activeTab === 'projects' ? 1 : 0,
              pointerEvents: activeTab === 'projects' ? 'auto' : 'none',
            }}
          >
            <ProjectGallery />
          </div>
        </div>
      </main>

      <div className="fixed bottom-6 right-6 z-30 md:hidden">
        <button
          onClick={() => handleOpenPublish(activeTab === 'materials' ? 'material' : 'project')}
          className="btn-hover w-14 h-14 rounded-full bg-forest text-white shadow-lg flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40 hidden md:block">
        <NotificationBell
          count={unreadCount}
          onClick={() => {
            notifications.forEach((n) => markNotificationRead(n.id))
          }}
        />
        {unreadCount > 0 && (
          <div className="mt-2 max-w-[200px] bg-white rounded-card shadow-card p-3 animate-fade-in">
            {notifications.slice(0, 3).map((n) => (
              <div key={n.id} className="text-xs text-gray-600 py-1 border-b last:border-0">
                {n.message}
              </div>
            ))}
          </div>
        )}
      </div>

      <FavoritesDrawer />
      {showPublishMaterial && <PublishMaterialModal />}
      {showPublishProject && <PublishProjectModal />}
      {confirmDialog && (
        <ConfirmDialog
          show={confirmDialog.show}
          message={confirmDialog.message}
          onConfirm={handleConfirmTaken}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

      <footer className="bg-cream/50 py-6 text-center text-xs text-gray-400">
        <p>余料交换 — 让闲置焕发新生</p>
      </footer>
    </div>
  )
}
