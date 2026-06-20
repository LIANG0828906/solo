import React, { useState, useEffect } from 'react'
import { RuneType } from '../types'
import { RUNE_DATA } from '../Rune'

interface TopBarProps {
  runeSequence: RuneType[]
  temperature: number
  isForging: boolean
  forgeStartTime: number
  hint: string
  onClearRunes: () => void
}

const TopBar: React.FC<TopBarProps> = ({
  runeSequence,
  temperature,
  isForging,
  forgeStartTime,
  hint,
  onClearRunes
}) => {
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    if (!isForging) {
      setElapsedTime(0)
      return
    }

    const interval = setInterval(() => {
      setElapsedTime(Date.now() - forgeStartTime)
    }, 100)

    return () => clearInterval(interval)
  }, [isForging, forgeStartTime])

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const getTemperatureColor = (): string => {
    const t = (temperature - 500) / 1000
    const r = Math.round(33 + (244 - 33) * t)
    const g = Math.round(150 + (67 - 150) * t)
    const b = Math.round(243 + (54 - 243) * t)
    return `rgb(${r}, ${g}, ${b})`
  }

  const renderSmallRune = (type: RuneType, index: number) => {
    const rune = RUNE_DATA[type]
    return (
      <div
        key={index}
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${rune.color}, ${rune.color}80)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          color: '#fff',
          boxShadow: `0 0 8px ${rune.color}60`,
          border: `2px solid ${rune.color}`,
          fontWeight: 'bold'
        }}
      >
        {index + 1}
      </div>
    )
  }

  return (
    <div
      className="top-bar"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 20,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          minWidth: '250px'
        }}
      >
        <span style={{ color: '#aaa', fontSize: '12px', marginRight: '4px' }}>符文序列:</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          {runeSequence.length === 0 ? (
            <div
              style={{
                color: '#555',
                fontSize: '12px',
                fontStyle: 'italic'
              }}
            >
              空
            </div>
          ) : (
            runeSequence.map((rune, index) => renderSmallRune(rune, index))
          )}
        </div>
        {runeSequence.length > 0 && (
          <button
            onClick={onClearRunes}
            disabled={isForging}
            style={{
              marginLeft: '8px',
              padding: '4px 8px',
              fontSize: '11px',
              background: isForging ? '#333' : 'rgba(255,80,80,0.3)',
              color: isForging ? '#666' : '#ff8888',
              border: '1px solid rgba(255,80,80,0.4)',
              borderRadius: '4px',
              cursor: isForging ? 'not-allowed' : 'pointer'
            }}
          >
            清空
          </button>
        )}
      </div>

      <div
        style={{
          textAlign: 'center',
          maxWidth: '400px',
          flex: 1
        }}
      >
        <div
          style={{
            color: '#FFB300',
            fontSize: '14px',
            fontWeight: 500,
            textShadow: '0 0 10px rgba(255,179,0,0.3)'
          }}
        >
          {hint}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          minWidth: '250px',
          justifyContent: 'flex-end'
        }}
      >
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              color: '#888',
              fontSize: '11px',
              marginBottom: '2px'
            }}
          >
            锻造温度
          </div>
          <div
            style={{
              color: getTemperatureColor(),
              fontSize: '18px',
              fontWeight: 'bold',
              textShadow: `0 0 8px ${getTemperatureColor()}60`
            }}
          >
            {temperature}°C
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              color: '#888',
              fontSize: '11px',
              marginBottom: '2px'
            }}
          >
            {isForging ? '锻造时长' : '准备中'}
          </div>
          <div
            style={{
              color: isForging ? '#4CAF50' : '#555',
              fontSize: '18px',
              fontWeight: 'bold',
              fontFamily: 'monospace'
            }}
          >
            {isForging ? formatTime(elapsedTime) : '--:--'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TopBar
