import {
  Star, Shield, Flame, Leaf, Crown,
  Zap, Heart, Gem, Sun, Moon,
  Mountain, Feather, Target, Compass, Trophy,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ICON_LIST, type IconType } from '@/store/useDesignStore'

const ICON_MAP: Record<IconType, LucideIcon> = {
  Star, Shield, Flame, Leaf, Crown,
  Zap, Heart, Gem, Sun, Moon,
  Mountain, Feather, Target, Compass, Trophy,
}

export default function IconPanel() {
  const handleDragStart = (e: React.DragEvent, iconType: string) => {
    e.dataTransfer.setData('iconType', iconType)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className="w-52 flex-shrink-0 h-full overflow-y-auto pl-2">
      <h3 className="text-xs font-bold uppercase tracking-widest text-badge-accent mb-3 px-1">
        图标库
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {ICON_LIST.map((iconType) => {
          const IconComponent = ICON_MAP[iconType]

          return (
            <div
              key={iconType}
              draggable
              onDragStart={(e) => handleDragStart(e, iconType)}
              className="
                flex flex-col items-center justify-center
                rounded-lg p-3 bg-badge-card
                cursor-grab active:cursor-grabbing
                transition-all duration-200
                hover:bg-badge-secondary/40
                group
              "
            >
              <IconComponent
                size={28}
                strokeWidth={1.5}
                className="text-white transition-colors duration-300 group-hover:text-badge-accent"
              />
              <span className="text-[10px] text-gray-400 mt-1.5 group-hover:text-badge-accent/80 transition-colors duration-300">
                {iconType}
              </span>
            </div>
          )
        })}
      </div>
      <p className="text-[10px] text-gray-500 mt-3 px-1 text-center">
        拖拽图标到画布上放置
      </p>
    </div>
  )
}
