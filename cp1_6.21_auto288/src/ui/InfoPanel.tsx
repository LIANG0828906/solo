import { memo } from 'react'
import { MapPin, Layers, Calendar, Hash, Ruler } from 'lucide-react'
import type { GeologyPoint } from '@/data/geologyData'

interface InfoPanelProps {
  selectedPoint: GeologyPoint | null
  isOpen: boolean
  onClose: () => void
}

function InfoPanel({ selectedPoint, isOpen, onClose }: InfoPanelProps) {
  return (
    <div
      className={`fixed right-0 top-0 h-full w-80 bg-[#1A1E3E] rounded-l-2xl shadow-[0_4px_24px_rgba(0,0,0,0.6)] 
        transform transition-transform duration-300 ease-in-out z-50
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        md:translate-x-0`}
      style={{ backdropFilter: 'blur(20px)' }}
    >
      <div className="flex flex-col h-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MapPin size={20} className="text-[#7B9BF2]" />
            地质属性信息
          </h2>
          <button
            onClick={onClose}
            className="md:hidden text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-[#7B9BF2] to-transparent mb-6" />

        {selectedPoint ? (
          <div className="flex-1 space-y-6 overflow-y-auto">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[#7B9BF2] text-sm font-medium">
                <Ruler size={16} />
                <span>深度</span>
              </div>
              <div className="text-2xl font-bold text-white font-mono">
                {selectedPoint.depth.toFixed(2)}
                <span className="text-lg ml-1 text-[#7B9BF2]">米</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[#7B9BF2] text-sm font-medium">
                <Layers size={16} />
                <span>岩性</span>
              </div>
              <div className="text-xl text-white">{selectedPoint.lithology}</div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[#7B9BF2] text-sm font-medium">
                <Calendar size={16} />
                <span>地质年代</span>
              </div>
              <div className="text-xl text-white">{selectedPoint.age}</div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[#7B9BF2] text-sm font-medium">
                <Hash size={16} />
                <span>样本编号</span>
              </div>
              <div className="text-xl text-white font-mono">{selectedPoint.sampleId}</div>
            </div>

            <div className="mt-6 p-4 bg-[#0A0E27] rounded-xl">
              <div className="text-[#7B9BF2] text-sm mb-2">坐标位置</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-xs text-gray-400">X</div>
                  <div className="text-white font-mono">
                    {selectedPoint.position.x.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Y</div>
                  <div className="text-white font-mono">
                    {selectedPoint.position.y.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Z</div>
                  <div className="text-white font-mono">
                    {selectedPoint.position.z.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <MapPin size={48} className="text-[#2A2E5E] mb-4" />
            <p className="text-gray-400 text-lg mb-2">点击模型</p>
            <p className="text-gray-500 text-sm">查看该位置的地质属性信息</p>
          </div>
        )}

        <div className="mt-auto pt-4">
          <div className="h-px bg-gradient-to-r from-transparent via-[#2A2E5E] to-transparent mb-4" />
          <div className="text-xs text-gray-500 text-center">
            地质剖面探测器 v1.0
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(InfoPanel)
