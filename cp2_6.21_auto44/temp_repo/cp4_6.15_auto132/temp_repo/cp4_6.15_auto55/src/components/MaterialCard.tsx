import { memo } from 'react'
import { Package, Hand, Heart, Share2 } from 'lucide-react'
import type { Material } from '@/types'
import { CONDITION_EMOJIS } from '@/types'

interface MaterialCardProps {
  material: Material
  onMarkTaken: (id: string) => void
  onFavorite: (id: string) => void
  onShare: (id: string) => void
  isFavorited: boolean
}

const MaterialCard = memo(function MaterialCard({
  material,
  onMarkTaken,
  onFavorite,
  onShare,
  isFavorited,
}: MaterialCardProps) {
  const isTaken = material.status === 'taken'
  const conditionEmoji = CONDITION_EMOJIS[material.condition - 1] ?? '😐'

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] ${isTaken ? 'material-card-taken pointer-events-none opacity-40 grayscale' : ''}`}
      style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
    >
      {isTaken && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/10">
          <span className="rounded-full bg-red-500 px-4 py-1.5 text-sm font-bold text-white">
            已取走
          </span>
        </div>
      )}

      <div className="relative h-40 w-full overflow-hidden">
        {material.photos.length > 0 ? (
          <img
            src={material.photos[0]}
            alt={material.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-100">
            <Package className="h-12 w-12 text-gray-400" />
          </div>
        )}

        <div className="absolute left-2 top-2 flex items-center gap-1">
          <span className="rounded-full bg-wood/10 px-2.5 py-0.5 text-xs font-medium text-wood">
            {material.materialType}
          </span>
          <span
            className="inline-block h-4 w-4 rounded-full border border-white/60"
            style={{ backgroundColor: material.color }}
          />
        </div>
      </div>

      <div className="p-3">
        <h3 className="truncate font-medium">{material.name}</h3>
        <p className="mt-1 text-sm text-gray-500">{material.dimensions}</p>
        <p className="mt-0.5 text-sm text-gray-500">数量: {material.quantity}</p>

        <div className="mt-2 flex items-center gap-1 text-sm">
          <span>{conditionEmoji}</span>
          <span className="text-gray-600">{material.condition}成新</span>
        </div>
      </div>

      <div className="translate-y-full opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        <div className="flex border-t border-gray-100 bg-white">
          <button
            className="flex flex-1 items-center justify-center gap-1 py-2.5 text-xs text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
            onClick={() => onMarkTaken(material.id)}
          >
            <Hand className="h-3.5 w-3.5" />
            <span>标记已取走</span>
          </button>
          <button
            className="flex flex-1 items-center justify-center gap-1 py-2.5 text-xs text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
            onClick={() => onFavorite(material.id)}
          >
            <Heart className={`h-3.5 w-3.5 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
            <span>收藏</span>
          </button>
          <button
            className="flex flex-1 items-center justify-center gap-1 py-2.5 text-xs text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
            onClick={() => onShare(material.id)}
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>分享</span>
          </button>
        </div>
      </div>
    </div>
  )
})

export default MaterialCard
