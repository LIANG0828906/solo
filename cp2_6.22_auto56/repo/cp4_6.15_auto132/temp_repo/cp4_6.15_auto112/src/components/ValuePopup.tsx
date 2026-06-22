import { useState, useEffect, useRef } from 'react'
import { Calendar, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ValuePopupProps {
  visible: boolean
  value: string
  subtitle?: string
  iconType: 'date' | 'time'
  position?: { x: number; y: number }
  onAnimationEnd?: () => void
}

type AnimationState = 'hidden' | 'entering' | 'visible' | 'exiting'

export const ValuePopup: React.FC<ValuePopupProps> = ({
  visible,
  value,
  subtitle,
  iconType,
  position,
  onAnimationEnd,
}) => {
  const [animationState, setAnimationState] = useState<AnimationState>(
    visible ? 'visible' : 'hidden'
  )
  const exitTimerRef = useRef<number | null>(null)
  const onAnimationEndRef = useRef(onAnimationEnd)
  const wasVisibleRef = useRef(visible)

  useEffect(() => {
    onAnimationEndRef.current = onAnimationEnd
  }, [onAnimationEnd])

  useEffect(() => {
    if (visible && !wasVisibleRef.current) {
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current)
        exitTimerRef.current = null
      }
      setAnimationState('entering')
      const enterTimer = setTimeout(() => {
        setAnimationState('visible')
      }, 200)
      wasVisibleRef.current = true
      return () => clearTimeout(enterTimer)
    }

    if (!visible && wasVisibleRef.current) {
      setAnimationState('exiting')
      exitTimerRef.current = window.setTimeout(() => {
        setAnimationState('hidden')
        onAnimationEndRef.current?.()
      }, 300)
      wasVisibleRef.current = false
      return () => {
        if (exitTimerRef.current) {
          clearTimeout(exitTimerRef.current)
        }
      }
    }
  }, [visible])

  useEffect(() => {
    return () => {
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current)
      }
    }
  }, [])

  if (animationState === 'hidden') return null

  const isEntering = animationState === 'entering'
  const isExiting = animationState === 'exiting'
  const isVisible = animationState === 'visible'

  const IconComponent = iconType === 'date' ? Calendar : Sun

  return (
    <div
      className={cn(
        'pointer-events-none absolute left-1/2 -translate-x-1/2 z-50',
        position ? '' : 'bottom-full mb-3'
      )}
      style={
        position
          ? {
              left: position.x,
              top: position.y,
              transform: 'translate(-50%, -100%)',
            }
          : undefined
      }
    >
      <style>{`
        @keyframes valuePopupEnter {
          0% {
            opacity: 0;
            transform: translateY(12px) scale(0.9);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes valuePopupExit {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: brightness(1);
          }
          30% {
            opacity: 1;
            transform: translateY(-2px) scale(1.05);
            filter: brightness(1.8);
          }
          60% {
            opacity: 0.8;
            transform: translateY(-4px) scale(1.02);
            filter: brightness(1.2);
          }
          100% {
            opacity: 0;
            transform: translateY(-16px) scale(0.95);
            filter: brightness(0.8);
          }
        }
        @keyframes valuePopupFloat {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }
        .value-popup-enter {
          animation: valuePopupEnter 200ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .value-popup-exit {
          animation: valuePopupExit 300ms ease-out forwards;
        }
        .value-popup-float {
          animation: valuePopupFloat 2s ease-in-out infinite;
        }
      `}</style>
      <div
        className={cn(
          'relative flex flex-col items-center px-5 py-3 rounded-2xl',
          'bg-slate-900/80 backdrop-blur-md',
          'border border-cyan-400/50 shadow-lg',
          'shadow-cyan-500/20'
        )}
        style={{
          borderRadius: '16px',
        }}
      >
        <div
          className={cn(
            'flex items-center gap-2',
            isEntering && 'value-popup-enter',
            isExiting && 'value-popup-exit',
            isVisible && 'value-popup-float'
          )}
          onAnimationEnd={(e) => {
            if (e.animationName === 'valuePopupEnter') {
              setAnimationState('visible')
            }
          }}
        >
          <IconComponent
            className={cn(
              'w-5 h-5',
              iconType === 'date' ? 'text-emerald-400' : 'text-amber-400'
            )}
          />
          <span
            className="text-white font-bold tabular-nums tracking-tight"
            style={{
              fontSize: '48px',
              lineHeight: 1.1,
              fontFamily:
                'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
            }}
          >
            {value}
          </span>
        </div>
        {subtitle && (
          <div
            className={cn(
              'mt-1 text-cyan-300 font-medium',
              isEntering && 'value-popup-enter',
              isExiting && 'value-popup-exit',
              isVisible && 'value-popup-float'
            )}
            style={{
              fontSize: '18px',
              animationDelay: isEntering ? '50ms' : '0ms',
            }}
          >
            {subtitle}
          </div>
        )}
        <div
          className="absolute left-1/2 -translate-x-1/2 -bottom-2"
          style={{
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '8px solid rgba(56, 189, 248, 0.5)',
          }}
        />
      </div>
    </div>
  )
}

export default ValuePopup
