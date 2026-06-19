interface ProgressBarProps {
  progress: number
  visible: boolean
}

export default function ProgressBar({ progress, visible }: ProgressBarProps) {
  return (
    <div
      className={`transition-all duration-300 ${visible ? 'opacity-100 max-h-16' : 'opacity-0 max-h-0 overflow-hidden'}`}
    >
      <div className="rounded-full h-2 bg-surface-lighter overflow-hidden">
        <div
          className="h-full rounded-full progress-gradient animate-progressShine transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-white/60 text-right">{Math.round(progress)}%</p>
    </div>
  )
}
