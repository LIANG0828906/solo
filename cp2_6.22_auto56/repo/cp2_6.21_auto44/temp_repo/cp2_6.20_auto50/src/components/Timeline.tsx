import { useEffect, useRef } from 'react'
import { Play, Pause } from 'lucide-react'
import { useClimateStore } from '@/store/useClimateStore'
import { cn } from '@/lib/utils'

const MIN_YEAR = 2000
const MAX_YEAR = 2020

export default function Timeline() {
  const displayYear = useClimateStore((state) => state.displayYear)
  const setYear = useClimateStore((state) => state.setYear)
  const setDisplayYear = useClimateStore((state) => state.setDisplayYear)
  const isPlaying = useClimateStore((state) => state.isPlaying)
  const togglePlaying = useClimateStore((state) => state.togglePlaying)
  const prevYearRef = useRef(displayYear)

  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setDisplayYear((prev) => {
        const next = prev + 2
        if (next > MAX_YEAR) {
          return MIN_YEAR
        }
        return next
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isPlaying, setDisplayYear])

  useEffect(() => {
    setYear(displayYear)
  }, [displayYear, setYear])

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const year = parseInt(e.target.value, 10)
    setDisplayYear(year)
    prevYearRef.current = year
  }

  const yearChanged = prevYearRef.current !== displayYear
  if (yearChanged) {
    prevYearRef.current = displayYear
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4">
      <div className="glass-panel flex items-center gap-4 px-4 py-4 md:px-6">
        <button
          onClick={togglePlaying}
          className={cn(
            'flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full',
            'bg-gradient-to-r from-blue-500 to-purple-500',
            'flex items-center justify-center text-white',
            'transition-all duration-200',
            'hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30',
            'active:scale-95'
          )}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>

        <div className="flex-1 flex flex-col items-center">
          <div
            className={cn(
              'text-xl md:text-2xl font-bold text-white mb-2 transition-transform duration-200',
              yearChanged ? 'scale-110' : 'scale-100'
            )}
          >
            {displayYear}
          </div>

          <div className="relative w-full">
            <input
              type="range"
              min={MIN_YEAR}
              max={MAX_YEAR}
              value={displayYear}
              onChange={handleSliderChange}
              className="w-full h-2 rounded-full appearance-none cursor-pointer
                bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-5
                [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-white
                [&::-webkit-slider-thumb]:shadow-lg
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:transition-transform
                [&::-webkit-slider-thumb]:duration-200
                [&::-webkit-slider-thumb]:hover:scale-125
                [&::-webkit-slider-thumb]:active:scale-90
                [&::-moz-range-thumb]:w-5
                [&::-moz-range-thumb]:h-5
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-white
                [&::-moz-range-thumb]:border-none
                [&::-moz-range-thumb]:shadow-lg
                [&::-moz-range-thumb]:cursor-pointer"
            />
          </div>

          <div className="w-full flex justify-between mt-1 text-xs text-white/40">
            <span>{MIN_YEAR}</span>
            <span>{MAX_YEAR}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
