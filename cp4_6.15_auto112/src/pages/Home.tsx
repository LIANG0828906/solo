import { useState, useEffect } from 'react'
import SceneViewer from '../components/SceneViewer'
import ControlPanel from '../components/ControlPanel'
import AnalysisPanel from '../components/AnalysisPanel'
import MobileDrawer from '../components/MobileDrawer'
import MobileFab from '../components/MobileFab'
import { Sun } from 'lucide-react'

type ScreenSize = 'wide' | 'medium' | 'small'

export default function Home() {
  const [screenSize, setScreenSize] = useState<ScreenSize>('wide')

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      if (width > 1200) {
        setScreenSize('wide')
      } else if (width >= 768) {
        setScreenSize('medium')
      } else {
        setScreenSize('small')
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="w-screen h-screen overflow-hidden bg-gradient-to-b from-[#1a1a2e] to-[#16213e]">
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-3 px-6 py-3 rounded-full bg-slate-900/60 backdrop-blur-xl border border-cyan-400/30 shadow-lg shadow-cyan-500/10">
        <Sun className="text-yellow-400 w-6 h-6 animate-pulse" />
        <h1 className="text-white text-lg font-bold tracking-wide">
          3D 日照阴影模拟分析
        </h1>
      </div>

      <div className="relative w-full h-full flex">
        {screenSize === 'wide' && (
          <>
            <div className="w-80 flex-shrink-0 p-4 overflow-y-auto custom-scrollbar transition-all duration-300 ease-in-out">
              <ControlPanel className="w-full" />
            </div>
            <div className="flex-1 relative">
              <SceneViewer />
            </div>
            <div className="w-80 flex-shrink-0 p-4 overflow-y-auto custom-scrollbar transition-all duration-300 ease-in-out">
              <AnalysisPanel className="w-full" />
            </div>
          </>
        )}

        {screenSize === 'medium' && (
          <div className="flex flex-col w-full h-full">
            <div className="flex-1 relative">
              <SceneViewer />
            </div>
            <div className="h-1/2 flex-shrink-0 bg-slate-900/50 backdrop-blur-xl border-t border-cyan-400/20">
              <div className="h-full flex">
                <div className="w-1/2 p-3 overflow-y-auto custom-scrollbar border-r border-cyan-400/20">
                  <ControlPanel className="w-full" />
                </div>
                <div className="w-1/2 p-3 overflow-y-auto custom-scrollbar">
                  <AnalysisPanel className="w-full" />
                </div>
              </div>
            </div>
          </div>
        )}

        {screenSize === 'small' && (
          <>
            <SceneViewer />
            <MobileFab />
            <MobileDrawer />
          </>
        )}
      </div>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 hidden md:flex items-center gap-4 px-4 py-2 rounded-full bg-slate-900/60 backdrop-blur-md border border-cyan-400/20 text-xs text-gray-400">
        <span>拖拽: 旋转视角</span>
        <span className="w-px h-4 bg-cyan-400/30"></span>
        <span>滚轮: 缩放</span>
        <span className="w-px h-4 bg-cyan-400/30"></span>
        <span>右键: 平移</span>
        <span className="w-px h-4 bg-cyan-400/30"></span>
        <span>点击建筑: 选中并拖拽</span>
      </div>
    </div>
  )
}
