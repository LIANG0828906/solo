import { useEffect, useRef } from 'react'
import { Check } from 'lucide-react'

interface Step {
  order: number
  description: string
}

interface StepTimelineProps {
  steps: Step[]
  currentStep?: number
}

function StepTimeline({ steps, currentStep = 0 }: StepTimelineProps) {
  const currentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (currentRef.current) {
      currentRef.current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [currentStep])

  const sorted = [...steps].sort((a, b) => a.order - b.order)

  return (
    <>
      <div className="hidden md:block overflow-x-auto py-6">
        <div className="flex items-start gap-0 min-w-max px-4">
          {sorted.map((step, idx) => {
            const isCurrent = step.order === currentStep
            const isCompleted = step.order < currentStep
            const isFuture = step.order > currentStep

            return (
              <div
                key={step.order}
                ref={isCurrent ? currentRef : undefined}
                className="flex items-start"
              >
                <div className="flex flex-col items-center" style={{ width: 100 }}>
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-300"
                    style={{
                      borderColor: isCompleted ? '#48bb78' : isCurrent ? '#F4A460' : '#d1d5db',
                      backgroundColor: isCompleted ? '#48bb78' : isCurrent ? '#F4A460' : '#fff',
                      animation: isCurrent ? 'pulseGlow 2s ease-in-out infinite' : undefined,
                    }}
                  >
                    {isCompleted && <Check size={16} className="text-white" />}
                    {isCurrent && (
                      <span className="text-white text-xs font-bold">{step.order}</span>
                    )}
                    {isFuture && (
                      <span className="text-gray-400 text-xs font-bold">{step.order}</span>
                    )}
                  </div>
                  <p
                    className="text-xs text-center mt-2 px-1 leading-tight"
                    style={{
                      color: isCurrent ? '#8B4513' : isCompleted ? '#48bb78' : '#999',
                      fontWeight: isCurrent ? 600 : 400,
                      animation: isCurrent ? 'fadeSlideUp 0.4s ease-out both' : undefined,
                    }}
                  >
                    {step.description}
                  </p>
                </div>
                {idx < sorted.length - 1 && (
                  <div
                    className="h-0.5 w-10 mt-4 shrink-0"
                    style={{
                      backgroundColor: isCompleted ? '#48bb78' : '#d1d5db',
                      transition: 'background-color 0.3s',
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="md:hidden py-4">
        <div className="flex flex-col items-start pl-4">
          {sorted.map((step, idx) => {
            const isCurrent = step.order === currentStep
            const isCompleted = step.order < currentStep

            return (
              <div
                key={step.order}
                ref={isCurrent ? currentRef : undefined}
                className="flex items-start gap-3"
              >
                <div className="flex flex-col items-center">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-300"
                    style={{
                      borderColor: isCompleted ? '#48bb78' : isCurrent ? '#F4A460' : '#d1d5db',
                      backgroundColor: isCompleted ? '#48bb78' : isCurrent ? '#F4A460' : '#fff',
                      animation: isCurrent ? 'pulseGlow 2s ease-in-out infinite' : undefined,
                    }}
                  >
                    {isCompleted && <Check size={14} className="text-white" />}
                    {isCurrent && (
                      <span className="text-white text-[11px] font-bold">{step.order}</span>
                    )}
                    {!isCompleted && !isCurrent && (
                      <span className="text-gray-400 text-[11px] font-bold">{step.order}</span>
                    )}
                  </div>
                  {idx < sorted.length - 1 && (
                    <div
                      className="w-0.5 h-8 shrink-0"
                      style={{
                        backgroundColor: isCompleted ? '#48bb78' : '#d1d5db',
                      }}
                    />
                  )}
                </div>
                <p
                  className="text-sm leading-tight pt-1"
                  style={{
                    color: isCurrent ? '#8B4513' : isCompleted ? '#48bb78' : '#999',
                    fontWeight: isCurrent ? 600 : 400,
                    animation: isCurrent ? 'fadeSlideUp 0.4s ease-out both' : undefined,
                  }}
                >
                  {step.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

export default StepTimeline
