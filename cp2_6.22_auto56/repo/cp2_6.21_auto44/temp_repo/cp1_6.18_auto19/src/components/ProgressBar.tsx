import { Zone } from '@/types'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  zones: Zone[]
  currentZoneIndex: number
  unlockedZones: string[]
  answeredExhibits: Record<string, boolean>
  totalExhibitsPerZone: number
  onZoneClick: (index: number) => void
}

export default function ProgressBar({
  zones,
  currentZoneIndex,
  unlockedZones,
  answeredExhibits,
  totalExhibitsPerZone,
  onZoneClick,
}: ProgressBarProps) {
  const answeredCount = Object.values(answeredExhibits).filter(Boolean).length
  const totalExhibits = zones.length * totalExhibitsPerZone
  const progress = totalExhibits > 0 ? (answeredCount / totalExhibits) * 100 : 0

  return (
    <div className="w-full bg-wood px-6 py-4">
      <div className="mx-auto max-w-[1200px]">
        <div className="w-[80%]">
          <div className="h-[6px] rounded-[3px] bg-white/20">
            <div
              className="h-full rounded-[3px] bg-gradient-to-r from-gold to-gold-dark transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="mt-2 flex gap-4">
          {zones.map((zone, index) => {
            const isUnlocked = unlockedZones.includes(zone.id)
            const isCurrent = index === currentZoneIndex

            return (
              <span
                key={zone.id}
                className={cn(
                  'cursor-pointer text-sm font-serif',
                  isCurrent && 'font-bold text-white',
                  !isCurrent && isUnlocked && 'text-white',
                  !isUnlocked && 'text-muted cursor-default',
                )}
                onClick={() => {
                  if (isUnlocked) onZoneClick(index)
                }}
              >
                {zone.name}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
