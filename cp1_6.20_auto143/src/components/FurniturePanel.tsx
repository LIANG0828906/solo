import { Square, Circle, Armchair, Lamp } from 'lucide-react'
import { useStore } from '@/store'
import type { FurnitureType } from '@/types'
import { FURNITURE_LABELS, FURNITURE_DIMS } from '@/types'

const FURNITURE_ICONS: Record<FurnitureType, React.ReactNode> = {
  table: <Square size={20} />,
  chair: <Square size={16} />,
  sofa: <Armchair size={20} />,
  lamp: <Lamp size={20} />,
}

const FURNITURE_COLORS: Record<FurnitureType, string> = {
  table: '#8B6914',
  chair: '#888888',
  sofa: '#1a3a5c',
  lamp: '#d4c5a9',
}

export default function FurniturePanel() {
  const { placingType, furniture, setPlacingType } = useStore()

  const types: FurnitureType[] = ['table', 'chair', 'sofa', 'lamp']

  const isPlaced = (type: FurnitureType) => furniture.some((f) => f.type === type)

  const handleClick = (type: FurnitureType) => {
    if (isPlaced(type)) return
    setPlacingType(placingType === type ? null : type)
  }

  return (
    <div className="bg-white rounded-lg border border-[#e0e0e0] p-3">
      <h3 className="text-sm text-[#666] font-medium mb-3">家具面板</h3>
      <div className="grid grid-cols-2 gap-2">
        {types.map((type) => {
          const placed = isPlaced(type)
          const active = placingType === type
          const dims = FURNITURE_DIMS[type]
          return (
            <button
              key={type}
              onClick={() => handleClick(type)}
              disabled={placed}
              className={`btn-press relative flex flex-col items-center gap-1 p-3 rounded-lg text-xs transition-all ${
                placed
                  ? 'bg-[#f0f0f0] text-[#bbb] cursor-not-allowed'
                  : active
                  ? 'bg-[#4A90D9] text-white shadow-md ring-2 ring-[#357ABD]'
                  : 'bg-[#f8f8f8] text-[#333] hover:bg-[#eee] border border-[#e0e0e0]'
              }`}
            >
              <span
                className="mb-1"
                style={{ color: placed ? '#ccc' : active ? '#fff' : FURNITURE_COLORS[type] }}
              >
                {FURNITURE_ICONS[type]}
              </span>
              <span className="font-medium">{FURNITURE_LABELS[type]}</span>
              <span className="text-[10px] opacity-70">
                {dims.width}×{dims.depth}×{dims.height}m
              </span>
              {placed && (
                <span className="absolute top-1 right-1 text-[9px] bg-[#ddd] text-[#888] px-1 rounded">
                  已使用
                </span>
              )}
            </button>
          )
        })}
      </div>
      {placingType && (
        <p className="text-xs text-[#4A90D9] mt-2 text-center">
          点击房间内地面放置 · 右键取消
        </p>
      )}
    </div>
  )
}
