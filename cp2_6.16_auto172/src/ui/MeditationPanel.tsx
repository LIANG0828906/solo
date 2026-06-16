import React, { useState, useEffect, useRef } from 'react'
import { useMeditationStore } from '@/store/meditationStore'

const formatNumberWithCommas = (num: number): string => {
  return Math.floor(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const NumberRoller: React.FC<{ value: number; duration?: number }> = ({ value, duration = 1000 }) => {
  const [displayValue, setDisplayValue] = useState(0)
  const startValueRef = useRef(0)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    startValueRef.current = displayValue
    startTimeRef.current = null

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp
      }

      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const currentValue = startValueRef.current + (value - startValueRef.current) * eased

      setDisplayValue(Math.round(currentValue))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration])

  return <span>{formatNumberWithCommas(displayValue)}</span>
}

const Toast: React.FC<{ message: string; visible: boolean }> = ({ message, visible }) => {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '40px',
        left: '50%',
        transform: visible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(20px)',
        opacity: visible ? 1 : 0,
        transition: 'all 0.3s ease-out',
        padding: '12px 24px',
        background: 'rgba(155, 89, 182, 0.9)',
        color: 'white',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 500,
        backdropFilter: 'blur(10px)',
        zIndex: 1000,
        pointerEvents: 'none',
      }}
    >
      {message}
    </div>
  )
}

const LoadingSpinner: React.FC = () => {
  return (
    <div
      style={{
        width: '24px',
        height: '24px',
        border: '3px solid rgba(255,255,255,0.3)',
        borderTop: '3px solid white',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }}
    >
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  )
}

const BreathingBar: React.FC = () => {
  const { isMeditating, breathingPhase, breathingProgress, inhaleDuration, exhaleDuration } = useMeditationStore()

  const [heightPercent, setHeightPercent] = useState(20)

  useEffect(() => {
    if (!isMeditating) {
      setHeightPercent(20)
      return
    }

    const minHeight = 20
    const maxHeight = 90

    if (breathingPhase === 'inhale') {
      const t = breathingProgress / inhaleDuration
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      setHeightPercent(minHeight + (maxHeight - minHeight) * eased)
    } else {
      const t = breathingProgress / exhaleDuration
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      setHeightPercent(maxHeight - (maxHeight - minHeight) * eased)
    }
  }, [isMeditating, breathingPhase, breathingProgress, inhaleDuration, exhaleDuration])

  if (!isMeditating) return null

  return (
    <div
      style={{
        position: 'fixed',
        left: '40px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '40px',
        height: '300px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        overflow: 'hidden',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: `${heightPercent}%`,
          background: 'linear-gradient(to top, #9B59B6, #3498DB)',
          borderRadius: '20px',
          transition: 'height 0.1s ease-out',
          boxShadow: '0 0 20px rgba(155, 89, 182, 0.5)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          fontSize: '12px',
          fontWeight: 600,
          textShadow: '0 1px 3px rgba(0,0,0,0.3)',
          zIndex: 1,
        }}
      >
        {breathingPhase === 'inhale' ? '吸' : '呼'}
      </div>
    </div>
  )
}

const ParticleCounter: React.FC = () => {
  const { isMeditating, particleCount } = useMeditationStore()
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    setOpacity(isMeditating ? 0.8 : 0)
  }, [isMeditating])

  if (!isMeditating) return null

  return (
    <div
      style={{
        position: 'fixed',
        right: '40px',
        top: '40px',
        color: 'white',
        textAlign: 'right',
        opacity: opacity,
        transition: 'opacity 0.5s ease-out',
      }}
    >
      <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>
        粒子数量
      </div>
      <div style={{ fontSize: '32px', fontWeight: 700, textShadow: '0 2px 10px rgba(155, 89, 182, 0.5)' }}>
        {formatNumberWithCommas(particleCount)}
      </div>
    </div>
  )
}

const DataPanel: React.FC = () => {
  const { showDataPanel, duration, averageBreathRate, totalParticles, setShowDataPanel } = useMeditationStore()
  const [toastVisible, setToastVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (showDataPanel) {
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 1200)
    }
  }, [showDataPanel])

  const handleShare = async () => {
    const text = `🧘 AuraFlow 冥想记录\n\n⏱️ 冥想时长：${Math.floor(duration)} 秒\n🌬️ 平均呼吸：${averageBreathRate.toFixed(1)} 次/分钟\n✨ 粒子总数：${formatNumberWithCommas(totalParticles)} 个\n\n#AuraFlow #冥想 #放松`

    try {
      await navigator.clipboard.writeText(text)
      setToastVisible(true)
      setTimeout(() => setToastVisible(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  const handleClose = () => {
    setShowDataPanel(false)
  }

  const breathRatePercent = Math.min(Math.max((averageBreathRate - 4) / 16, 0), 1) * 100
  const barColor = `hsl(${240 - breathRatePercent * 1.5}, 70%, ${50 + breathRatePercent * 0.2}%)`

  return (
    <>
      <div
        style={{
          position: 'fixed',
          right: showDataPanel ? '30px' : '-320px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '280px',
          padding: '24px',
          background: isAnimating 
            ? 'linear-gradient(135deg, rgba(44, 62, 80, 0.85), rgba(155, 89, 182, 0.75))'
            : 'rgba(44, 62, 80, 0.85)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          color: 'white',
          transition: 'right 0.5s cubic-bezier(0.16, 1, 0.3, 1), background 1.2s ease-out',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          opacity: showDataPanel ? 1 : 0,
          pointerEvents: showDataPanel ? 'auto' : 'none',
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>冥想记录</h3>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              fontSize: '20px',
              padding: '0',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '6px' }}>冥想时长</div>
          <div style={{ fontSize: '36px', fontWeight: 700, textShadow: '0 2px 10px rgba(155, 89, 182, 0.5)' }}>
            <NumberRoller value={Math.floor(duration)} />
            <span style={{ fontSize: '16px', fontWeight: 400, marginLeft: '6px', opacity: 0.8 }}>秒</span>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '8px' }}>平均呼吸节奏</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${breathRatePercent}%`,
                  background: `linear-gradient(to right, #9B59B6, ${barColor})`,
                  borderRadius: '4px',
                  transition: 'width 1s ease-out',
                }}
              />
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, minWidth: '50px', textAlign: 'right' }}>
              {averageBreathRate.toFixed(1)}
              <span style={{ fontSize: '10px', opacity: 0.7 }}> 次/分</span>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '6px' }}>粒子总数</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#9B59B6', textShadow: '0 0 20px rgba(155, 89, 182, 0.5)' }}>
            <NumberRoller value={totalParticles} />
          </div>
        </div>

        <button
          onClick={handleShare}
          style={{
            width: '100%',
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #9B59B6, #8E44AD)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'transform 0.15s ease-out, box-shadow 0.2s',
            boxShadow: '0 4px 15px rgba(155, 89, 182, 0.4)',
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'translateY(2px)'
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(155, 89, 182, 0.3)'
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(155, 89, 182, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(155, 89, 182, 0.4)'
          }}
        >
          分享结果
        </button>
      </div>
      <Toast message="已复制到剪贴板" visible={toastVisible} />
    </>
  )
}

const StartButton: React.FC = () => {
  const { isMeditating, startMeditation, stopMeditation } = useMeditationStore()
  const [isPressed, setIsPressed] = useState(false)

  const handleClick = () => {
    if (isMeditating) {
      stopMeditation()
    } else {
      startMeditation()
    }
  }

  return (
    <button
      onClick={handleClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      style={{
        position: 'fixed',
        bottom: '60px',
        left: '50%',
        transform: `translateX(-50%) translateY(${isPressed ? '2px' : '0'})`,
        padding: '16px 48px',
        background: isMeditating
          ? 'linear-gradient(135deg, rgba(231, 76, 60, 0.9), rgba(192, 57, 43, 0.9))'
          : 'linear-gradient(135deg, #9B59B6, #8E44AD)',
        border: 'none',
        borderRadius: '50px',
        color: 'white',
        fontSize: '16px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'transform 0.15s ease-out, box-shadow 0.2s, opacity 0.3s',
        boxShadow: isMeditating
          ? '0 4px 20px rgba(231, 76, 60, 0.4)'
          : '0 6px 25px rgba(155, 89, 182, 0.5)',
        fontFamily: "'Quicksand', sans-serif",
        zIndex: 50,
      }}
    >
      {isMeditating ? '结束冥想' : '开始冥想'}
    </button>
  )
}

const Title: React.FC = () => {
  const { isMeditating } = useMeditationStore()

  return (
    <div
      style={{
        position: 'fixed',
        top: '40px',
        left: '50%',
        transform: 'translateX(-50%)',
        color: 'white',
        textAlign: 'center',
        opacity: isMeditating ? 0.5 : 1,
        transition: 'opacity 0.5s ease',
        zIndex: 10,
      }}
    >
      <h1 style={{ fontSize: '28px', fontWeight: 300, letterSpacing: '8px', margin: 0, textShadow: '0 2px 20px rgba(155, 89, 182, 0.5)' }}>
        AuraFlow
      </h1>
      <p style={{ fontSize: '12px', opacity: 0.7, marginTop: '8px', letterSpacing: '2px' }}>
        沉浸式冥想空间
      </p>
    </div>
  )
}

const Instructions: React.FC = () => {
  const { isMeditating } = useMeditationStore()

  if (isMeditating) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '140px',
        left: '50%',
        transform: 'translateX(-50%)',
        color: 'white',
        textAlign: 'center',
        fontSize: '12px',
        opacity: 0.6,
        lineHeight: 1.8,
        zIndex: 10,
      }}
    >
      <div>拖动鼠标旋转视角 · 滚轮缩放 · 双击重置</div>
      <div style={{ marginTop: '4px' }}>跟随光影呼吸，感受能量流动</div>
    </div>
  )
}

export const MeditationPanel: React.FC = () => {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
      <div style={{ pointerEvents: 'auto' }}>
        <Title />
        <BreathingBar />
        <ParticleCounter />
        <DataPanel />
        <StartButton />
        <Instructions />
      </div>
    </div>
  )
}
