import { useState, useEffect, useRef, useCallback } from 'react'

interface CarbonDashboardProps {
  totalCarbon: number
  maxCarbon?: number
}

function interpolateColor(
  c1: [number, number, number],
  c2: [number, number, number],
  t: number,
): string {
  const r = Math.round(c1[0] + (c2[0] - c1[0]) * t)
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * t)
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * t)
  return `rgb(${r},${g},${b})`
}

function getArcColor(totalCarbon: number): string {
  const green: [number, number, number] = [76, 175, 80]
  const orange: [number, number, number] = [255, 152, 0]
  const red: [number, number, number] = [255, 107, 53]

  if (totalCarbon <= 5) {
    return interpolateColor(green, orange, totalCarbon / 5)
  }
  if (totalCarbon <= 10) {
    return interpolateColor(orange, red, (totalCarbon - 5) / 5)
  }
  return `rgb(${red[0]},${red[1]},${red[2]})`
}

export default function CarbonDashboard({ totalCarbon, maxCarbon = 15 }: CarbonDashboardProps) {
  const [displayValue, setDisplayValue] = useState(totalCarbon)
  const [mounted, setMounted] = useState(false)
  const prevValueRef = useRef(totalCarbon)
  const animationRef = useRef<number>(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const startValue = prevValueRef.current
    const endValue = totalCarbon
    const totalFrames = 40
    const step = (endValue - startValue) / totalFrames
    let frame = 0
    let current = startValue

    const animate = () => {
      frame++
      current += step

      if (frame >= totalFrames) {
        setDisplayValue(endValue)
        prevValueRef.current = endValue
      } else {
        setDisplayValue(current)
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    cancelAnimationFrame(animationRef.current)
    animationRef.current = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationRef.current)
  }, [totalCarbon])

  const percentage = Math.min(totalCarbon / maxCarbon, 1)
  const radius = 80
  const circumference = Math.PI * radius
  const dashoffset = circumference * (1 - percentage)
  const arcColor = getArcColor(totalCarbon)
  const arcPath = 'M 20,100 A 80,80 0 0,1 180,100'

  const getDisplayText = useCallback((val: number) => {
    if (val < 10) return val.toFixed(1)
    return Math.round(val).toString()
  }, [])

  return (
    <div className="flex flex-col items-center justify-center" style={{ fontFamily: 'Nunito, sans-serif' }}>
      <svg viewBox="0 0 200 120" className="w-full max-w-xs">
        <path
          d={arcPath}
          fill="none"
          stroke="#e0e0e0"
          strokeWidth={20}
          strokeLinecap="round"
        />
        <path
          d={arcPath}
          fill="none"
          stroke={arcColor}
          strokeWidth={20}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={mounted ? dashoffset : circumference}
          style={{ transition: 'stroke-dashoffset 0.6s ease-out, stroke 0.6s ease-out' }}
        />
        <text
          x="100"
          y="82"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontSize: '30px', fontWeight: 800, fontFamily: 'Nunito, sans-serif' }}
          fill="#333"
        >
          {getDisplayText(displayValue)}
        </text>
        <text
          x="100"
          y="103"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontSize: '12px', fontWeight: 600, fontFamily: 'Nunito, sans-serif' }}
          fill="#999"
        >
          kg CO₂
        </text>
      </svg>
    </div>
  )
}
