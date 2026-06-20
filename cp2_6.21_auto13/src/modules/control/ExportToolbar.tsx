import { useRef, useEffect, useState, useCallback } from 'react'
import { useStore } from '@/store/useStore'
import { Camera, Film } from 'lucide-react'

declare global {
  interface Window {
    gifshot: {
      createGIF: (options: Record<string, unknown>, callback: (obj: { error?: number; blob?: Blob }) => void) => void
    }
  }
}

export default function ExportToolbar() {
  const triggerScreenshot = useStore((s) => s.triggerScreenshot)
  const toggleRecording = useStore((s) => s.toggleRecording)
  const isRecording = useStore((s) => s.isRecording)
  const recordingTrigger = useStore((s) => s.recordingTrigger)

  const [flash, setFlash] = useState(false)
  const [flashPos, setFlashPos] = useState({ x: 0, y: 0 })
  const framesRef = useRef<string[]>([])
  const recorderRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const handleScreenshot = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    setFlashPos({ x: e.clientX, y: e.clientY })
    setFlash(false)
    requestAnimationFrame(() => {
      setFlash(true)
      setTimeout(() => setFlash(false), 400)
    })
    triggerScreenshot()
  }, [triggerScreenshot])

  const loadGifshot = useCallback((): Promise<void> => {
    if (window.gifshot) return Promise.resolve()
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/gifshot@0.4.5/dist/gifshot.min.js'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load gifshot'))
      document.head.appendChild(script)
    })
  }, [])

  useEffect(() => {
    if (recordingTrigger === 0) return

    if (isRecording) {
      framesRef.current = []
      recorderRef.current = setInterval(() => {
        const canvas = document.querySelector('canvas')
        if (canvas) {
          try {
            const dataUrl = canvas.toDataURL('image/png')
            framesRef.current.push(dataUrl)
          } catch {
            // ignore
          }
        }
      }, 100)
    } else {
      if (recorderRef.current) {
        clearInterval(recorderRef.current)
        recorderRef.current = null
      }

      const frames = framesRef.current
      if (frames.length < 2) return

      loadGifshot().then(() => {
        if (!window.gifshot) return
        window.gifshot.createGIF(
          {
            images: frames,
            gifWidth: 800,
            gifHeight: 600,
            interval: 0.1,
            numFrames: frames.length,
            sampleInterval: 10,
          },
          (obj) => {
            if (obj.error) {
              console.error('GIF creation error:', obj.error)
              return
            }
            if (obj.blob) {
              const url = URL.createObjectURL(obj.blob)
              const link = document.createElement('a')
              link.download = `flowfield-${Date.now()}.gif`
              link.href = url
              link.click()
              URL.revokeObjectURL(url)
            }
          },
        )
      })
    }
  }, [recordingTrigger, isRecording, loadGifshot])

  return (
    <>
      {flash && (
        <div style={{
          position: 'fixed',
          left: flashPos.x,
          top: flashPos.y,
          width: 10,
          height: 10,
          marginLeft: -5,
          marginTop: -5,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.85)',
          pointerEvents: 'none',
          zIndex: 9999,
          animation: 'flashEffect 0.4s ease-out forwards',
          boxShadow: '0 0 10px rgba(255,255,255,0.6), 0 0 20px rgba(180,200,255,0.4)',
        }} />
      )}
      <div style={{
        position: 'absolute',
        right: 16,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '12px 8px',
        background: 'rgba(10,10,30,0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderRadius: 10,
        border: '1px solid rgba(100,140,255,0.15)',
      }}>
        <button
          className="export-btn"
          onClick={handleScreenshot}
          title="截图导出"
          style={{
            width: 40,
            height: 40,
            border: '1px solid rgba(100,140,255,0.2)',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.03)',
            color: 'rgba(160,180,255,0.7)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Camera size={18} />
        </button>
        <button
          className="export-btn"
          onClick={toggleRecording}
          title={isRecording ? '停止录制' : '录制GIF'}
          style={{
            width: 40,
            height: 40,
            border: isRecording ? '1px solid rgba(255,100,100,0.5)' : '1px solid rgba(100,140,255,0.2)',
            borderRadius: 8,
            background: isRecording ? 'rgba(255,60,60,0.15)' : 'rgba(255,255,255,0.03)',
            color: isRecording ? '#ff6b6b' : 'rgba(160,180,255,0.7)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <Film size={18} />
          {isRecording && (
            <div style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#ff4444',
              animation: 'pulse 1s infinite',
            }} />
          )}
        </button>
      </div>
    </>
  )
}
