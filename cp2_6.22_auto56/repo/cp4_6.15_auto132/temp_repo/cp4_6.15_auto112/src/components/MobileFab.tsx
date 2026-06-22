import { Settings, BarChart3 } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'

export default function MobileFab() {
  const toggleDrawer = useAppStore((state) => state.toggleMobileDrawer)
  const setActivePanelTab = useAppStore((state) => state.setActivePanelTab)
  const buildings = useAppStore((state) => state.buildings)
  const analysisResult = useAppStore((state) => state.analysisResult)

  const handleControlClick = () => {
    setActivePanelTab('control')
    toggleDrawer()
  }

  const handleAnalysisClick = () => {
    setActivePanelTab('analysis')
    toggleDrawer()
  }

  return (
    <div className="fixed bottom-6 right-6 z-30 flex flex-col gap-3 md:hidden">
      <button
        onClick={handleAnalysisClick}
        className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-slate-900/80 backdrop-blur-xl border border-cyan-400/30 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-110 active:scale-95"
      >
        <BarChart3 className="text-cyan-400 w-6 h-6 transition-transform group-hover:scale-110" />
        {analysisResult && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full text-white text-xs flex items-center justify-center font-bold animate-pulse">
            ✓
          </span>
        )}
      </button>

      <button
        onClick={handleControlClick}
        className="group flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/40 hover:shadow-cyan-500/60 transition-all duration-300 hover:scale-110 active:scale-95 animate-pulse-slow"
      >
        <Settings className="text-white w-7 h-7 transition-transform group-hover:rotate-90 duration-500" />
        {buildings.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
            {buildings.length}
          </span>
        )}
      </button>
    </div>
  )
}
