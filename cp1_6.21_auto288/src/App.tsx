import { useState, useCallback, useEffect } from 'react'
import { Eye, Box, Layers, Menu, X } from 'lucide-react'
import GeologyScene3D from '@/scene/GeologyScene3D'
import InfoPanel from '@/ui/InfoPanel'
import { getViewPresets, type GeologyPoint } from '@/data/geologyData'

function App() {
  const [selectedPoint, setSelectedPoint] = useState<GeologyPoint | null>(null)
  const [highlightPosition, setHighlightPosition] = useState<[number, number, number] | null>(null)
  const [cameraTarget, setCameraTarget] = useState<{
    position: [number, number, number]
    target: [number, number, number]
  } | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const viewPresets = getViewPresets()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handlePointSelected = useCallback((point: GeologyPoint | null) => {
    setSelectedPoint(point)
    if (point) {
      setHighlightPosition([
        point.position.x,
        point.position.y,
        point.position.z,
      ])
      if (isMobile) {
        setIsPanelOpen(true)
      }
    } else {
      setHighlightPosition(null)
    }
  }, [isMobile])

  const handleViewPreset = useCallback((index: number) => {
    const preset = viewPresets[index]
    if (preset) {
      setCameraTarget({
        position: preset.position,
        target: preset.target,
      })
      setTimeout(() => setCameraTarget(null), 700)
    }
  }, [viewPresets])

  const getViewIcon = (iconName: string) => {
    switch (iconName) {
      case 'eye':
        return <Eye size={24} />
      case 'axis-3d':
        return <Box size={24} />
      case 'layers':
        return <Layers size={24} />
      default:
        return <Eye size={24} />
    }
  }

  return (
    <div className="w-screen h-screen bg-[#0A0E27] overflow-hidden relative">
      <div className="absolute top-4 left-4 z-40 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7B9BF2] to-[#4A6B8A] flex items-center justify-center">
          <Layers size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-white text-lg font-bold">地质剖面探测器</h1>
          <p className="text-gray-400 text-xs">Geology Profile Explorer</p>
        </div>
      </div>

      {isMobile && (
        <button
          onClick={() => setIsPanelOpen(true)}
          className="absolute top-4 right-4 z-40 w-10 h-10 rounded-xl bg-[#2A2E5E] flex items-center justify-center text-white hover:bg-[#3A4E8E] transition-colors"
        >
          <Menu size={20} />
        </button>
      )}

      <div
        className={`h-full transition-all duration-300 ${
          isMobile ? 'w-full' : 'w-[calc(100%-320px)]'
        }`}
      >
        <GeologyScene3D
          onPointSelected={handlePointSelected}
          highlightPosition={highlightPosition}
          cameraTarget={cameraTarget}
        />
      </div>

      <div className="absolute bottom-6 left-6 z-40 flex flex-col gap-3">
        {viewPresets.map((preset, index) => (
          <button
            key={preset.name}
            onClick={() => handleViewPreset(index)}
            className="w-15 h-15 rounded-xl bg-[#2A2E5E] flex flex-col items-center justify-center text-white hover:bg-[#3A4E8E] transition-all duration-200 group"
            style={{ width: '60px', height: '60px' }}
            title={preset.name}
          >
            <div className="text-[#7B9BF2] group-hover:text-white transition-colors">
              {getViewIcon(preset.icon)}
            </div>
            <span className="text-[10px] mt-1 text-gray-400 group-hover:text-white transition-colors">
              {preset.name}
            </span>
          </button>
        ))}
      </div>

      <InfoPanel
        selectedPoint={selectedPoint}
        isOpen={isPanelOpen || !isMobile}
        onClose={() => setIsPanelOpen(false)}
      />

      {isMobile && isPanelOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsPanelOpen(false)}
        />
      )}

      <div className="absolute bottom-6 right-[calc(320px+24px)] z-40 hidden md:block">
        <div className="bg-[#1A1E3E]/80 backdrop-blur-md rounded-xl px-4 py-3 text-sm">
          <div className="text-gray-400 mb-1">操作提示</div>
          <div className="text-gray-300 space-y-1 text-xs">
            <div>🖱️ 左键拖拽：旋转场景</div>
            <div>🖱️ 右键拖拽：平移场景</div>
            <div>🖱️ 滚轮：缩放场景</div>
            <div>👆 点击模型：查看地质属性</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
