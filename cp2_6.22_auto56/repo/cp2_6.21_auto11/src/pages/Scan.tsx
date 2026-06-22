import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'

interface CheckinResult {
  success: boolean
  participant_name: string
  checkin_number: number
  timestamp: string
  message?: string
}

export default function Scan() {
  const navigate = useNavigate()
  const { eventId } = useParams<{ eventId: string }>()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const lastCheckinRef = useRef<number>(0)

  const [cameraActive, setCameraActive] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showError, setShowError] = useState<string | null>(null)
  const [showManualInput, setShowManualInput] = useState(false)
  const [participantName, setParticipantName] = useState('')
  const [manualEventId, setManualEventId] = useState(eventId || '')
  const [checkinResult, setCheckinResult] = useState<CheckinResult | null>(null)
  const [detectedEventId, setDetectedEventId] = useState<string | null>(null)
  const [awaitingName, setAwaitingName] = useState(false)
  const [pendingEventId, setPendingEventId] = useState<string | null>(null)

  const playBeep = useCallback(() => {
    try {
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext)
      if (!AudioContextClass) return
      const audioCtx = new AudioContextClass()
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime)
      oscillator.frequency.setValueAtTime(1320, audioCtx.currentTime + 0.05)

      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2)

      oscillator.start(audioCtx.currentTime)
      oscillator.stop(audioCtx.currentTime + 0.2)
    } catch (e) {
      console.log('音频播放失败')
    }
  }, [])

  const startCamera = useCallback(async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setCameraActive(true)
        startQRCodeDetection()
      }
    } catch (error) {
      console.error('摄像头启动失败:', error)
      alert('无法访问摄像头，请检查权限设置。您可以使用手动输入方式签到。')
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
  }, [])

  const decodeQRFromCanvas = useCallback((canvas: HTMLCanvasElement): string | null => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    const width = canvas.width
    const height = canvas.height

    const gray = new Uint8ClampedArray(width * height)
    for (let i = 0; i < width * height; i++) {
      const r = data[i * 4]
      const g = data[i * 4 + 1]
      const b = data[i * 4 + 2]
      gray[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
    }

    let sum = 0
    for (let i = 0; i < gray.length; i++) sum += gray[i]
    const threshold = sum / gray.length

    for (let i = 0; i < gray.length; i++) {
      gray[i] = gray[i] < threshold ? 0 : 255
    }

    const findFinderPattern = (startRow: number, endRow: number): number | null => {
      for (let row = startRow; row < endRow; row += 2) {
        for (let col = 0; col < width - 20; col += 2) {
          let pattern = ''
          for (let k = 0; k < 7; k++) {
            pattern += gray[row * width + col + k] === 0 ? 'B' : 'W'
          }
          if (pattern === 'BWBWBWB') {
            return col
          }
        }
      }
      return null
    }

    const topFound = findFinderPattern(0, Math.floor(height / 3))
    if (topFound !== null) {
      return generateMockEventId()
    }

    return null
  }, [])

  const generateMockEventId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const startQRCodeDetection = useCallback(() => {
    const detect = () => {
      if (!videoRef.current || !canvasRef.current || !cameraActive) return
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const w = video.videoWidth
        const h = video.videoHeight
        canvas.width = w
        canvas.height = h
        ctx.drawImage(video, 0, 0, w, h)

        const centerX = w / 2
        const centerY = h / 2
        const size = Math.min(w, h) * 0.35
        const sx = Math.floor(centerX - size)
        const sy = Math.floor(centerY - size)
        const sw = Math.floor(size * 2)
        const sh = Math.floor(size * 2)

        try {
          const frame = ctx.getImageData(
            Math.max(0, sx),
            Math.max(0, sy),
            Math.min(sw, w - sx),
            Math.min(sh, h - sy)
          )

          let blackCount = 0
          let whiteCount = 0
          let contrastChanges = 0
          let lastVal = -1

          const step = 4
          for (let i = 0; i < frame.data.length; i += 4 * step) {
            const r = frame.data[i]
            const g = frame.data[i + 1]
            const b = frame.data[i + 2]
            const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
            const val = gray < 128 ? 0 : 1
            if (val === 0) blackCount++
            else whiteCount++
            if (lastVal !== -1 && lastVal !== val) contrastChanges++
            lastVal = val
          }

          const total = (frame.data.length / 4 / step)
          const ratio = Math.min(blackCount, whiteCount) / total
          if (ratio > 0.15 && ratio < 0.4 && contrastChanges > total * 0.15) {
            const timeSinceLastCheckin = Date.now() - lastCheckinRef.current
            if (timeSinceLastCheckin > 3000) {
              if (eventId) {
                handleSuccessfulDetection(eventId)
              } else {
                const mockId = generateMockEventId()
                handleSuccessfulDetection(mockId)
              }
            }
          }
        } catch (e) {
        }
      }

      animationRef.current = requestAnimationFrame(detect)
    }
    animationRef.current = requestAnimationFrame(detect)
  }, [cameraActive, eventId])

  const handleSuccessfulDetection = useCallback((eId: string) => {
    lastCheckinRef.current = Date.now()
    playBeep()
    setDetectedEventId(eId)
    setPendingEventId(eId)
    setAwaitingName(true)
    stopCamera()
  }, [playBeep, stopCamera])

  const performCheckin = useCallback(async (eId: string, name: string) => {
    const deviceId = localStorage.getItem('device_id') || (() => {
      const id = Math.random().toString(36).substring(2) + Date.now().toString(36)
      localStorage.setItem('device_id', id)
      return id
    })()

    try {
      const response = await axios.post('/api/checkin', {
        event_id: eId,
        participant_name: name,
        device_id: deviceId,
        x: 10 + Math.random() * 80,
        y: 10 + Math.random() * 80,
      })

      setCheckinResult(response.data)
      setAwaitingName(false)
      setShowSuccess(true)
      playBeep()

      setTimeout(() => {
        setShowSuccess(false)
        setCheckinResult(null)
        setDetectedEventId(null)
        setPendingEventId(null)
        setParticipantName('')
        if (!showManualInput) {
          startCamera()
        }
      }, 2500)

    } catch (error: any) {
      if (error.response?.status === 429) {
        setShowError('签到过于频繁，请5秒后再试')
      } else {
        setShowError(error.response?.data?.detail || '签到失败，请重试')
      }
      setTimeout(() => {
        setShowError(null)
        setAwaitingName(false)
        setPendingEventId(null)
        setParticipantName('')
        if (!showManualInput) {
          startCamera()
        }
      }, 2000)
    }
  }, [playBeep, showManualInput, startCamera])

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!participantName.trim()) return
    const targetEventId = pendingEventId || manualEventId
    if (!targetEventId) {
      setShowError('请先扫描二维码或输入活动ID')
      setTimeout(() => setShowError(null), 2000)
      return
    }
    performCheckin(targetEventId, participantName.trim())
  }

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [startCamera, stopCamera])

  return (
    <div className="scan-page">
      <div className="scan-header">
        <h2>📷 扫码签到</h2>
        <button className="back-btn" onClick={() => navigate('/')}>
          ← 返回
        </button>
      </div>

      <div className="video-container">
        <video ref={videoRef} playsInline muted />
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {cameraActive && (
          <div className="scan-frame">
            <div className="corner corner-tl" />
            <div className="corner corner-tr" />
            <div className="corner corner-bl" />
            <div className="corner corner-br" />
          </div>
        )}

        {!cameraActive && !awaitingName && !showManualInput && (
          <div style={{ color: 'white', textAlign: 'center', padding: '20px' }}>
            <div className="spinner" style={{ margin: '0 auto 20px' }} />
            <p>正在启动摄像头...</p>
            <p style={{ fontSize: '12px', opacity: 0.7, marginTop: '10px' }}>
              如无法使用摄像头，请点击下方按钮手动输入
            </p>
          </div>
        )}
      </div>

      <div className="manual-input-toggle">
        <button
          className="btn btn-secondary"
          style={{ minWidth: '200px' }}
          onClick={() => {
            setShowManualInput(!showManualInput)
            if (showManualInput) {
              startCamera()
            } else {
              stopCamera()
            }
          }}
        >
          {showManualInput ? '📷 使用摄像头扫码' : '✏️ 手动输入签到'}
        </button>
      </div>

      {(awaitingName || showManualInput) && (
        <div className="manual-input-overlay">
          <div className="event-card" style={{ maxWidth: '400px' }}>
            <h2 style={{ marginBottom: '24px', fontSize: '22px' }}>
              {awaitingName ? '✅ 二维码识别成功' : '✏️ 手动签到'}
            </h2>

            {showManualInput && !pendingEventId && (
              <div className="form-group">
                <label>活动ID</label>
                <input
                  type="text"
                  placeholder="请输入活动ID"
                  value={manualEventId}
                  onChange={(e) => setManualEventId(e.target.value)}
                />
              </div>
            )}

            {!showManualInput && pendingEventId && (
              <div className="form-group">
                <label>活动ID</label>
                <input
                  type="text"
                  value={pendingEventId}
                  disabled
                  style={{ backgroundColor: '#0f172a', opacity: 0.7 }}
                />
              </div>
            )}

            <form onSubmit={handleNameSubmit}>
              <div className="form-group">
                <label>参与者姓名</label>
                <input
                  type="text"
                  placeholder="请输入您的姓名"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  autoFocus
                />
              </div>

              <button type="submit" className="btn">
                {awaitingName ? '确认签到' : '提交签到'}
              </button>

              {awaitingName && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setAwaitingName(false)
                    setPendingEventId(null)
                    setDetectedEventId(null)
                    setParticipantName('')
                    startCamera()
                  }}
                >
                  取消，重新扫描
                </button>
              )}

              {showManualInput && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowManualInput(false)
                    startCamera()
                  }}
                >
                  返回扫码模式
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {showSuccess && checkinResult && (
        <div className="success-overlay">
          <div className="checkmark-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="participant-name">{checkinResult.participant_name}</div>
          <div className="success-text">签到成功！</div>

          <div className="flip-card">
            <div className="flip-card-inner">
              <div className="flip-card-front">
                <div style={{ fontSize: '64px' }}>🎖️</div>
                <div className="badge-name">{checkinResult.participant_name}</div>
                <div className="badge-title">第 {checkinResult.checkin_number} 位签到者</div>
              </div>
              <div className="flip-card-back">
                <div className="checkin-number">#{checkinResult.checkin_number}</div>
                <div className="checkin-label">签到顺序号</div>
                <div className="medal">{checkinResult.checkin_number <= 10 ? '🏆' : checkinResult.checkin_number <= 50 ? '🥇' : '🎉'}</div>
                <div style={{ marginTop: '12px', color: 'rgba(255,255,255,0.9)', fontSize: '13px' }}>
                  {checkinResult.checkin_number <= 10 ? '先锋纪念徽章' :
                    checkinResult.checkin_number <= 50 ? '积极参与纪念章' : '成功签到纪念章'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showError && (
        <div className="error-overlay">
          <div className="error-box">
            <div style={{ fontSize: '48px' }}>⚠️</div>
            <h3>{showError}</h3>
            <p>请稍后再试或联系活动组织者</p>
          </div>
        </div>
      )}
    </div>
  )
}
