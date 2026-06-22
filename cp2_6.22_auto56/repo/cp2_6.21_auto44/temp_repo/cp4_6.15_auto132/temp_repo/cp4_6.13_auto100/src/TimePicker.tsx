import { useState, useRef, useEffect, useCallback } from 'react'
import { useStore } from './store'

interface WheelPickerProps {
  items: string[]
  value: number
  onChange: (index: number) => void
}

function WheelPicker({ items, value, onChange }: WheelPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const itemsRef = useRef<HTMLDivElement>(null)
  const itemHeight = 56
  const visibleItems = 5
  const paddingItems = Math.floor(visibleItems / 2)

  const [currentIndex, setCurrentIndex] = useState(value)
  const isDragging = useRef(false)
  const startY = useRef(0)
  const startTranslate = useRef(0)
  const currentTranslate = useRef(0)
  const velocity = useRef(0)
  const lastY = useRef(0)
  const lastTime = useRef(0)
  const animationFrame = useRef<number | null>(null)

  const allItems = [...items, ...items, ...items]
  const initialIndex = value + items.length

  const updatePosition = useCallback((translate: number, animate = false) => {
    if (itemsRef.current) {
      itemsRef.current.style.transition = animate
        ? 'transform 0.3s cubic-bezier(0.23, 1, 0.32, 1)'
        : 'none'
      itemsRef.current.style.transform = `translateY(${translate}px)`
    }
  }, [])

  const snapToNearest = useCallback((translate: number) => {
    const centerOffset = paddingItems * itemHeight
    const offset = translate + centerOffset
    let index = Math.round(-offset / itemHeight)
    index = Math.max(0, Math.min(index, allItems.length - 1))
    const snappedTranslate = -(index * itemHeight) + centerOffset

    const actualIndex = ((index % items.length) + items.length) % items.length
    setCurrentIndex(actualIndex)
    onChange(actualIndex)

    updatePosition(snappedTranslate, true)
    currentTranslate.current = snappedTranslate

    setTimeout(() => {
      if (index < items.length || index >= items.length * 2) {
        const normalizedIndex = (index % items.length) + items.length
        const normalizedTranslate = -(normalizedIndex * itemHeight) + centerOffset
        updatePosition(normalizedTranslate, false)
        currentTranslate.current = normalizedTranslate
      }
    }, 300)
  }, [allItems.length, items.length, paddingItems, itemHeight, onChange, updatePosition])

  const handleStart = useCallback((clientY: number) => {
    isDragging.current = true
    startY.current = clientY
    lastY.current = clientY
    lastTime.current = Date.now()
    velocity.current = 0
    startTranslate.current = currentTranslate.current
    
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current)
      animationFrame.current = null
    }
    
    if (itemsRef.current) {
      itemsRef.current.style.transition = 'none'
    }
  }, [])

  const handleMove = useCallback((clientY: number) => {
    if (!isDragging.current) return

    const deltaY = clientY - startY.current
    const newTranslate = startTranslate.current + deltaY
    currentTranslate.current = newTranslate
    updatePosition(newTranslate, false)

    const now = Date.now()
    const dt = now - lastTime.current
    if (dt > 0) {
      velocity.current = (clientY - lastY.current) / dt * 16
    }
    lastY.current = clientY
    lastTime.current = now
  }, [startY, updatePosition])

  const handleEnd = useCallback(() => {
    if (!isDragging.current) return
    isDragging.current = false

    let currentVel = velocity.current * 2
    let translate = currentTranslate.current

    const animateMomentum = () => {
      currentVel *= 0.95
      translate += currentVel
      currentTranslate.current = translate
      updatePosition(translate, false)

      if (Math.abs(currentVel) > 0.5) {
        animationFrame.current = requestAnimationFrame(animateMomentum)
      } else {
        snapToNearest(translate)
      }
    }

    if (Math.abs(currentVel) > 1) {
      animationFrame.current = requestAnimationFrame(animateMomentum)
    } else {
      snapToNearest(translate)
    }
  }, [velocity, snapToNearest, updatePosition])

  useEffect(() => {
    const initialTranslate = -(initialIndex * itemHeight) + paddingItems * itemHeight
    currentTranslate.current = initialTranslate
    updatePosition(initialTranslate, false)
  }, [])

  useEffect(() => {
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="wheel-picker"
      onMouseDown={(e) => {
        e.preventDefault()
        handleStart(e.clientY)
      }}
      onMouseMove={(e) => handleMove(e.clientY)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={(e) => {
        handleStart(e.touches[0].clientY)
      }}
      onTouchMove={(e) => {
        handleMove(e.touches[0].clientY)
      }}
      onTouchEnd={handleEnd}
    >
      <div className="wheel-picker-highlight" />
      <div ref={itemsRef} className="wheel-items">
        {allItems.map((item, index) => {
          const actualIndex = ((index % items.length) + items.length) % items.length
          return (
            <div
              key={`${index}-${item}`}
              className={`wheel-item ${actualIndex === currentIndex ? 'active' : ''}`}
            >
              {item}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function TimePicker() {
  const isOpen = useStore((state) => state.isTimePickerOpen)
  const toggleTimePicker = useStore((state) => state.toggleTimePicker)
  const setTargetTime = useStore((state) => state.setTargetTime)
  const triggerMorph = useStore((state) => state.triggerMorph)
  const targetTime = useStore((state) => state.targetTime)

  const [selectedHours, setSelectedHours] = useState(targetTime.hours)
  const [selectedMinutes, setSelectedMinutes] = useState(targetTime.minutes)

  useEffect(() => {
    if (isOpen) {
      setSelectedHours(targetTime.hours)
      setSelectedMinutes(targetTime.minutes)
    }
  }, [isOpen, targetTime.hours, targetTime.minutes])

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'))

  const handleConfirm = () => {
    setTargetTime({ hours: selectedHours, minutes: selectedMinutes })
    triggerMorph()
    toggleTimePicker()
  }

  const handleCancel = () => {
    toggleTimePicker()
  }

  if (!isOpen) return null

  return (
    <div className="time-picker-overlay" onClick={handleCancel}>
      <div className="time-picker-panel" onClick={(e) => e.stopPropagation()}>
        <div className="time-picker-header">
          <button className="time-picker-cancel" onClick={handleCancel}>
            取消
          </button>
          <span className="time-picker-title">设置时间</span>
          <button className="time-picker-confirm" onClick={handleConfirm}>
            确认
          </button>
        </div>
        <div className="wheel-picker-container">
          <WheelPicker
            items={hours}
            value={selectedHours}
            onChange={setSelectedHours}
          />
          <span className="wheel-separator">:</span>
          <WheelPicker
            items={minutes}
            value={selectedMinutes}
            onChange={setSelectedMinutes}
          />
        </div>
      </div>
    </div>
  )
}
