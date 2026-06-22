import { useEffect, useRef, useState } from 'react'
import type { City, AirQualityCurrent, PollutantKey } from '@/stores/airStore'
import { getAqiLevel, POLLUTANT_RANGES, getPollutantColor } from '@/stores/airStore'

interface CityCardProps {
  city: City
  data?: AirQualityCurrent
  selected: boolean
  onToggle: () => void
  index: number
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function useAnimatedValue(target: number, duration: number = 1000): number {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef(0)
  const initialRef = useRef(0)

  useEffect(() => {
    if (target === undefined) return
    initialRef.current = 0
    startRef.current = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeOut(progress)
      setValue(Math.round(initialRef.current + (target - initialRef.current) * eased))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration])

  return value
}

function PollutantBlock({
  pollutantKey,
  value,
  delay,
}: {
  pollutantKey: PollutantKey
  value: number
  delay: number
}) {
  const range = POLLUTANT_RANGES[pollutantKey]
  const animatedValue = useAnimatedValue(value, 1000)
  const percent = Math.min(((animatedValue - range.min) / (range.max - range.min)) * 100, 100)
  const color = getPollutantColor(pollutantKey, animatedValue)

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        animation: `fadeInUp 0.6s ease-out ${delay}s both`,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.6)',
            fontWeight: 500,
          }}
        >
          {range.label}
        </span>
        <span
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: '#ffffff',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {animatedValue}
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginLeft: 2 }}>
            {range.unit}
          </span>
        </span>
      </div>
      <div
        style={{
          height: 4,
          borderRadius: 2,
          background: 'rgba(255,255,255,0.08)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            height: '100%',
            backgroundColor: color,
            borderRadius: 2,
            transition: 'width 1s ease-out, background-color 0.3s',
            boxShadow: `0 0 6px ${color}80`,
          }}
        />
      </div>
    </div>
  )
}

export default function CityCard({ city, data, selected, onToggle, index }: CityCardProps) {
  const animatedAqi = useAnimatedValue(data?.aqi ?? 0, 1000)
  const aqiInfo = getAqiLevel(animatedAqi)

  return (
    <div
      id={`city-card-${city.id}`}
      onClick={onToggle}
      style={{
        position: 'relative',
        padding: 28,
        borderRadius: 20,
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(15px)',
        WebkitBackdropFilter: 'blur(15px)',
        border: selected
          ? '2px solid #00b4d8'
          : '1px solid rgba(255, 255, 255, 0.1)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.transform = 'translateY(-4px)'
          e.currentTarget.style.borderColor = 'rgba(0, 180, 216, 0.5)'
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.3)'
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
          e.currentTarget.style.boxShadow = 'none'
        }
      }}
    >
      {selected && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #00b4d8, #0077b6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            color: '#ffffff',
          }}
        >
          ✓
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <span style={{ fontSize: 32 }}>{city.icon}</span>
        <h2
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: '#ffffff',
            margin: 0,
            letterSpacing: 1,
          }}
        >
          {city.name}
        </h2>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 12,
          marginBottom: 28,
        }}
      >
        <span
          style={{
            fontSize: 56,
            fontWeight: 800,
            lineHeight: 1,
            color: aqiInfo.color,
            textShadow: `0 0 20px ${aqiInfo.color}50`,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {animatedAqi}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontSize: 14,
              color: aqiInfo.color,
              fontWeight: 600,
            }}
          >
            {aqiInfo.level}
          </span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>AQI</span>
        </div>
      </div>

      {data && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px 16px',
          }}
        >
          <PollutantBlock pollutantKey="pm25" value={data.pm25} delay={index * 0.1 + 0.3} />
          <PollutantBlock pollutantKey="pm10" value={data.pm10} delay={index * 0.1 + 0.4} />
          <PollutantBlock pollutantKey="ozone" value={data.ozone} delay={index * 0.1 + 0.5} />
          <PollutantBlock pollutantKey="no2" value={data.no2} delay={index * 0.1 + 0.6} />
        </div>
      )}

      {data && (
        <div
          style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            fontSize: 11,
            color: 'rgba(255,255,255,0.35)',
            textAlign: 'right',
          }}
        >
          更新于 {data.timestamp}
        </div>
      )}
    </div>
  )
}
