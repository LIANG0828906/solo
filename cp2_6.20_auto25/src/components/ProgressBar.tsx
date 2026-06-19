import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'

interface ProgressBarProps {
  progress: number
  visible: boolean
}

export default function ProgressBar({ progress, visible }: ProgressBarProps) {
  const [isComplete, setIsComplete] = useState(false)
  const [showCheck, setShowCheck] = useState(false)

  useEffect(() => {
    if (progress >= 100) {
      setIsComplete(true)
      setShowCheck(true)
      const timer = setTimeout(() => {
        setShowCheck(false)
      }, 1000)
      return () => clearTimeout(timer)
    } else {
      setIsComplete(false)
    }
  }, [progress])

  return (
    <div
      className={`transition-all duration-300 ${visible ? 'opacity-100 max-h-16' : 'opacity-0 max-h-0 overflow-hidden'}`}
    >
      <div className="rounded-full h-2 bg-surface-lighter overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isComplete ? 'bg-green-500' : 'progress-gradient animate-progressShine'
          }`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-white/60 text-right flex items-center justify-end gap-1">
        {showCheck ? (
          <>
            <Check className="w-3.5 h-3.5 text-green-400 animate-pulse" />
            <span className="text-green-400">上传完成</span>
          </>
        ) : (
          <span>{Math.round(Math.min(progress, 100))}%</span>
        )}
      </p>
    </div>
  )
}
