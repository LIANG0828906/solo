import { useEffect, useRef, useState, useCallback } from 'react'
import confetti from 'canvas-confetti'
import { cn } from '@/lib/utils'

interface CarbonCardProps {
  totalCarbon: number
  transportCarbon: number
  foodCarbon: number
  electricityCarbon: number
  level: 'low' | 'medium' | 'high'
  advice: string
  date: string
}

const levelConfig = {
  low: {
    icon: '🍃',
    label: '低碳',
    gradient: 'from-[#e8f5e9] to-[#a8e6cf]',
    badgeBg: 'bg-green-100',
    badgeBorder: 'border-green-400',
  },
  medium: {
    icon: '🍂',
    label: '中等',
    gradient: 'from-[#fff8e1] to-[#ffe082]',
    badgeBg: 'bg-yellow-100',
    badgeBorder: 'border-yellow-400',
  },
  high: {
    icon: '🍁',
    label: '高碳',
    gradient: 'from-[#ffebee] to-[#ff8a65]',
    badgeBg: 'bg-red-100',
    badgeBorder: 'border-red-400',
  },
}

export default function CarbonCard({
  totalCarbon,
  transportCarbon,
  foodCarbon,
  electricityCarbon,
  level,
  advice,
  date,
}: CarbonCardProps) {
  const [showToast, setShowToast] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const config = levelConfig[level]

  useEffect(() => {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#4caf50', '#81c784', '#a5d6a7', '#66bb6a'],
    })
  }, [])

  const handleShare = useCallback(async () => {
    const shareText = `📊 每日碳足迹报告\n📅 ${date}\n🌍 总排放: ${totalCarbon} kg CO₂\n🚗 出行: ${transportCarbon} kg\n🍽 饮食: ${foodCarbon} kg\n💡 用电: ${electricityCarbon} kg\n💡 建议: ${advice}`

    if (navigator.share) {
      try {
        await navigator.share({ title: '每日碳足迹', text: shareText })
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(shareText)
        setShowToast(true)
        setTimeout(() => setShowToast(false), 2000)
      } catch {}
    }
  }, [date, totalCarbon, transportCarbon, foodCarbon, electricityCarbon, advice])

  const handleTouchStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      handleShare()
    }, 500)
  }, [handleShare])

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      handleShare()
    },
    [handleShare],
  )

  const maxCarbon = Math.max(transportCarbon, foodCarbon, electricityCarbon, 0.01)

  const bars = [
    {
      label: '出行',
      value: transportCarbon,
      height: (transportCarbon / maxCarbon) * 120,
      gradient: 'from-[#1b5e20] to-[#4caf50]',
    },
    {
      label: '饮食',
      value: foodCarbon,
      height: (foodCarbon / maxCarbon) * 120,
      gradient: 'from-[#e65100] to-[#ff9800]',
    },
    {
      label: '用电',
      value: electricityCarbon,
      height: (electricityCarbon / maxCarbon) * 120,
      gradient: 'from-[#0d47a1] to-[#42a5f5]',
    },
  ]

  return (
    <div
      className={cn(
        'relative rounded-xl overflow-hidden bg-gradient-to-br shadow-lg p-6 min-h-[320px] max-w-[360px] w-full select-none font-[Nunito]',
        config.gradient,
      )}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div
        className={cn(
          'absolute top-4 left-4 flex items-center gap-1 rounded-full px-3 py-1 border-2 font-bold text-sm',
          config.badgeBg,
          config.badgeBorder,
        )}
      >
        <span>{config.icon}</span>
        <span>{config.label}</span>
      </div>

      <div className="flex flex-col items-center pt-8">
        <span className="text-5xl font-extrabold leading-tight">
          {totalCarbon}
          <span className="text-2xl font-bold ml-1">kg</span>
        </span>
        <span className="text-sm mt-1 opacity-80">CO₂ 碳排放</span>
        <span className="text-xs mt-1 opacity-60">{date}</span>
      </div>

      <div className="flex items-end justify-center gap-6 mt-6">
        {bars.map((bar) => (
          <div key={bar.label} className="flex flex-col items-center">
            <div
              className={cn(
                'w-10 rounded-t-md bg-gradient-to-t',
                bar.gradient,
              )}
              style={{ height: `${bar.height}px` }}
            />
            <span className="text-xs font-bold mt-1">{bar.label}</span>
            <span className="text-xs opacity-70">{bar.value}kg</span>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg bg-black/10 px-3 py-2">
        <p className="text-xs italic opacity-90">"{advice}"</p>
      </div>

      {showToast && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-4 py-1.5 text-white text-sm font-bold">
          已复制!
        </div>
      )}
    </div>
  )
}
