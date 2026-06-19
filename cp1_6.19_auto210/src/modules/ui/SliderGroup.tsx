import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SliderConfig {
  key: string
  label: string
  color: string
  value: number
  onChange: (v: number) => void
}

interface SliderGroupProps {
  sliders: SliderConfig[]
}

function SliderItem({ config }: { config: SliderConfig }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  const updateValue = useCallback((clientX: number) => {
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    config.onChange(Math.round(ratio * 100))
  }, [config])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setDragging(true)
    updateValue(e.clientX)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [updateValue])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return
    updateValue(e.clientX)
  }, [dragging, updateValue])

  const handlePointerUp = useCallback(() => {
    setDragging(false)
  }, [])

  const pct = config.value

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
      }}>
        <span style={{
          color: '#7EC8B8',
          fontSize: 12,
          fontFamily: 'Roboto, sans-serif',
          fontWeight: 500,
          letterSpacing: 0.5,
        }}>{config.label}</span>
        <span style={{
          color: config.color,
          fontSize: 12,
          fontFamily: 'Roboto, sans-serif',
          fontWeight: 700,
          minWidth: 28,
          textAlign: 'right',
        }}>{config.value}</span>
      </div>
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          width: 200,
          height: 8,
          borderRadius: 6,
          background: 'rgba(15, 76, 92, 0.6)',
          position: 'relative',
          cursor: 'pointer',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        <motion.div
          style={{
            height: '100%',
            borderRadius: 6,
            background: config.color,
            opacity: 0.7,
            width: `${pct}%`,
            transition: dragging ? 'none' : 'width 0.1s ease',
          }}
        />
        <motion.div
          animate={{
            left: `${pct}%`,
            scale: dragging ? 1.3 : 1,
            boxShadow: dragging
              ? `0 0 12px ${config.color}80`
              : `0 0 4px ${config.color}40`,
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          style={{
            position: 'absolute',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: config.color,
            border: '2px solid rgba(255,255,255,0.3)',
            cursor: 'grab',
          }}
        />
      </div>
    </div>
  )
}

export function SliderGroup({ sliders }: SliderGroupProps) {
  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      style={{
        position: 'absolute',
        bottom: 80,
        left: 20,
        padding: '16px 20px',
        background: 'rgba(10, 58, 71, 0.8)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: 12,
        border: '1px solid rgba(126, 200, 184, 0.15)',
        zIndex: 10,
      }}
    >
      {sliders.map((s) => (
        <SliderItem key={s.key} config={s} />
      ))}
    </motion.div>
  )
}
