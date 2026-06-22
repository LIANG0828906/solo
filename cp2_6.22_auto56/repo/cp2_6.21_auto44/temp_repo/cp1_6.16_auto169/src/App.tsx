import React, { useEffect, useRef, useState } from 'react'
import { ParticleScene } from './scene'
import { GestureDetector, HandPosition } from './gesture'
import { Controls } from './controls'
import { useSculptureStore, ColorTheme } from './store'

const canvasStyle: React.CSSProperties = {
  display: 'block',
  width: '100vw',
  height: '100vh',
  background: '#000000',
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 0
}

const previewVideoStyle: React.CSSProperties = {
  position: 'fixed',
  top: '20px',
  left: '20px',
  width: '200px',
  height: '150px',
  borderRadius: '10px',
  objectFit: 'cover',
  boxShadow: '0 0 10px rgba(0, 150, 255, 0.5)',
  zIndex: 1000,
  transform: 'scaleX(-1)',
  opacity: 0.85,
  border: '1px solid rgba(0, 150, 255, 0.3)'
}

const hiddenVideoStyle: React.CSSProperties = {
  display: 'none'
}

const loadingOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: '#000000',
  zIndex: 9999,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#E0E0E0',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
}

const spinnerStyle: React.CSSProperties = {
  width: '48px',
  height: '48px',
  border: '3px solid rgba(24, 255, 255, 0.2)',
  borderTopColor: '#18FFFF',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
  marginBottom: '20px',
  boxShadow: '0 0 20px rgba(24, 255, 255, 0.3)'
}

const keyframesStyle = `
@keyframes spin {
  to { transform: rotate(360deg); }
}
@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
`

export const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewVideoRef = useRef<HTMLVideoElement>(null)
  const hiddenVideoRef = useRef<HTMLVideoElement>(null)
  const sceneRef = useRef<ParticleScene | null>(null)
  const gestureRef = useRef<GestureDetector | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingText, setLoadingText] = useState('初始化3D场景...')
  const [error, setError] = useState<string | null>(null)

  const {
    particleCount,
    colorTheme,
    isFrozen,
    resetTrigger
  } = useSculptureStore()

  useEffect(() => {
    if (!canvasRef.current) return

    const scene = new ParticleScene()
    sceneRef.current = scene
    scene.init(canvasRef.current)

    setLoadingText('启动摄像头与手势识别...')

    const initGesture = async () => {
      try {
        if (!hiddenVideoRef.current) {
          throw new Error('视频元素未准备好')
        }
        const gesture = new GestureDetector()
        gestureRef.current = gesture

        let primaryHand: number | null = null

        await gesture.init(hiddenVideoRef.current, {
          onPinchStart: (handIndex: number, pos: HandPosition) => {
            if (!sceneRef.current) return
            if (primaryHand === null) {
              primaryHand = handIndex
            }
            if (primaryHand === handIndex) {
              sceneRef.current.selectParticlesByScreen(
                pos.normalizedX,
                pos.normalizedY,
                1.2
              )
            }
          },
          onPinchMove: (handIndex: number, pos: HandPosition) => {
            if (!sceneRef.current) return
            if (primaryHand === handIndex) {
              sceneRef.current.dragSelectedByScreen(
                pos.normalizedX,
                pos.normalizedY
              )
            }
          },
          onPinchEnd: (handIndex: number) => {
            if (!sceneRef.current) return
            if (primaryHand === handIndex) {
              sceneRef.current.clearSelection()
              sceneRef.current.clearTrails()
              primaryHand = null
            }
          },
          onTwoHandScale: (scaleFactor: number, center: { x: number; y: number }) => {
            if (!sceneRef.current) return
            sceneRef.current.scaleSelected(scaleFactor, center)
          }
        })

        if (previewVideoRef.current && hiddenVideoRef.current) {
          previewVideoRef.current.srcObject = hiddenVideoRef.current.srcObject
        }

        setLoading(false)
      } catch (err) {
        console.error('手势识别初始化失败:', err)
        setError(
          '无法访问摄像头或初始化手势识别。' +
          '请确保您已授予摄像头权限，并使用支持WebGL的现代浏览器。' +
          '您仍可以通过控制面板体验粒子系统！'
        )
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(initGesture, 500)

    return () => {
      clearTimeout(timeoutId)
      if (gestureRef.current) {
        gestureRef.current.dispose()
        gestureRef.current = null
      }
      if (sceneRef.current) {
        sceneRef.current.dispose()
        sceneRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.setParticleCount(particleCount)
    }
  }, [particleCount])

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.setColorTheme(colorTheme as ColorTheme)
    }
  }, [colorTheme])

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.setFrozen(isFrozen)
    }
  }, [isFrozen])

  useEffect(() => {
    if (resetTrigger > 0 && sceneRef.current) {
      sceneRef.current.reset()
    }
  }, [resetTrigger])

  return (
    <>
      <style>{keyframesStyle}</style>

      <canvas ref={canvasRef} style={canvasStyle} />

      <video
        ref={hiddenVideoRef}
        style={hiddenVideoStyle}
        playsInline
        muted
        autoPlay
      />

      <video
        ref={previewVideoRef}
        style={previewVideoStyle}
        playsInline
        muted
        autoPlay
      />

      <Controls />

      {loading && (
        <div style={loadingOverlayStyle}>
          <div style={spinnerStyle} />
          <div style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#18FFFF',
            marginBottom: '12px'
          }}>
            粒子雕塑生成工具
          </div>
          <div style={{
            fontSize: '14px',
            color: 'rgba(224, 224, 224, 0.7)',
            animation: 'pulse 1.5s ease-in-out infinite'
          }}>
            {loadingText}
          </div>
          <div style={{
            marginTop: '24px',
            padding: '16px',
            maxWidth: '420px',
            textAlign: 'center',
            fontSize: '12px',
            lineHeight: 1.8,
            color: 'rgba(224, 224, 224, 0.5)',
            borderTop: '1px solid rgba(24, 255, 255, 0.1)',
            paddingTop: '20px'
          }}>
            首次加载需要下载手势识别模型，可能需要几秒钟。
            <br />
            请确保浏览器已授予摄像头访问权限。
          </div>
        </div>
      )}

      {error && !loading && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(30, 30, 30, 0.95)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 109, 0, 0.5)',
          borderRadius: '12px',
          padding: '28px 32px',
          color: '#E0E0E0',
          zIndex: 9999,
          maxWidth: '480px',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: 700,
            color: '#FF6D00',
            marginBottom: '12px'
          }}>
            ⚠ 摄像头/手势识别不可用
          </div>
          <div style={{
            fontSize: '13px',
            lineHeight: 1.7,
            color: 'rgba(224, 224, 224, 0.8)',
            marginBottom: '20px'
          }}>
            {error}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: '1px solid rgba(24, 255, 255, 0.5)',
              background: 'rgba(24, 255, 255, 0.1)',
              color: '#18FFFF',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#18FFFF'
              e.currentTarget.style.color = '#000000'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(24, 255, 255, 0.1)'
              e.currentTarget.style.color = '#18FFFF'
            }}
          >
            重新尝试
          </button>
        </div>
      )}
    </>
  )
}

export default App
