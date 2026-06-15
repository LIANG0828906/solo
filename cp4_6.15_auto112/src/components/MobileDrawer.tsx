import { useCallback, useEffect, useRef } from 'react'
import { X, Settings, BarChart3 } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import ControlPanel from './ControlPanel'
import AnalysisPanel from './AnalysisPanel'

export default function MobileDrawer() {
  const isOpen = useAppStore((state) => state.isMobileDrawerOpen)
  const activeTab = useAppStore((state) => state.activePanelTab)
  const toggleDrawer = useAppStore((state) => state.toggleMobileDrawer)
  const setActivePanelTab = useAppStore((state) => state.setActivePanelTab)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      toggleDrawer()
    }
  }, [toggleDrawer])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        toggleDrawer()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, toggleDrawer])

  return (
    <>
      <div
        ref={overlayRef}
        onClick={handleOverlayClick}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="h-[85vh] bg-slate-900/95 backdrop-blur-xl border-t border-cyan-400/30 rounded-t-3xl shadow-2xl shadow-cyan-500/10 flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-400/20">
            <div className="flex gap-2">
              <button
                onClick={() => setActivePanelTab('control')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                  activeTab === 'control'
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/50'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Settings size={18} />
                <span className="font-medium">控制面板</span>
              </button>
              <button
                onClick={() => setActivePanelTab('analysis')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                  activeTab === 'analysis'
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/50'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <BarChart3 size={18} />
                <span className="font-medium">分析结果</span>
              </button>
            </div>
            <button
              onClick={toggleDrawer}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div
              className={`transition-all duration-300 ${
                activeTab === 'control' ? 'opacity-100' : 'opacity-0 hidden'
              }`}
            >
              <ControlPanel />
            </div>
            <div
              className={`transition-all duration-300 ${
                activeTab === 'analysis' ? 'opacity-100' : 'opacity-0 hidden'
              }`}
            >
              <AnalysisPanel />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
