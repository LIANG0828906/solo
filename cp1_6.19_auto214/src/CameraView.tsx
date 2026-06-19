import { useRef, useEffect, useCallback, useState } from 'react'
import { useCameraStore } from './store'
import { FilterProcessor } from './FilterProcessor'

export function CameraView() {
  const leftCanvasRef = useRef<HTMLCanvasElement>(null)
  const rightCanvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const animationFrameRef = useRef<number>(0)
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [cameraError, setCameraError] = useState(false)

  const {
    zoom,
    focusDistance,
    captureMode,
    filterSettings,
    setZoom,
    setFocusDistance,
    setCaptureMode,
    addPhoto,
    triggerFlash,
  } = useCameraStore()

  const isInFocus = focusDistance >= 1 && focusDistance <= 5

  const drawViewfinder = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      showGrid: boolean
    ) => {
      ctx.save()
      ctx.beginPath()
      ctx.arc(width / 2, height / 2, width / 2 - 4, 0, Math.PI * 2)
      ctx.clip()

      if (videoRef.current && videoRef.current.readyState >= 2) {
        const video = videoRef.current
        const videoAspect = video.videoWidth / video.videoHeight
        const canvasAspect = width / height

        let drawWidth = width * zoom
        let drawHeight = height * zoom

        if (videoAspect > canvasAspect) {
          drawHeight = (width / videoAspect) * zoom
        } else {
          drawWidth = height * videoAspect * zoom
        }

        const offsetX = (width - drawWidth) / 2
        const offsetY = (height - drawHeight) / 2

        ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight)
      } else if (cameraError) {
        const gradient = ctx.createLinearGradient(0, 0, width, height)
        gradient.addColorStop(0, '#2d4a3e')
        gradient.addColorStop(0.5, '#4a6b5a')
        gradient.addColorStop(1, '#3d5a4d')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, width, height)

        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
        for (let i = 0; i < 20; i++) {
          ctx.fillRect(Math.random() * width, Math.random() * height, 2, 2)
        }
      }

      if (showGrid) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
        ctx.lineWidth = 1

        const thirdsX = width / 3
        const thirdsY = height / 3
        ctx.beginPath()
        ctx.moveTo(thirdsX, 0)
        ctx.lineTo(thirdsX, height)
        ctx.moveTo(thirdsX * 2, 0)
        ctx.lineTo(thirdsX * 2, height)
        ctx.moveTo(0, thirdsY)
        ctx.lineTo(width, thirdsY)
        ctx.moveTo(0, thirdsY * 2)
        ctx.lineTo(width, thirdsY * 2)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(width / 2, 0)
        ctx.lineTo(width / 2, height)
        ctx.moveTo(0, height / 2)
        ctx.lineTo(width, height / 2)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
        ctx.stroke()
      } else {
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(width / 2 - 15, height / 2)
        ctx.lineTo(width / 2 + 15, height / 2)
        ctx.moveTo(width / 2, height / 2 - 15)
        ctx.lineTo(width / 2, height / 2 + 15)
        ctx.stroke()

        ctx.fillStyle = '#000'
        ctx.beginPath()
        ctx.arc(width / 2, height / 2, 2, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.restore()

      ctx.strokeStyle = '#000'
      ctx.lineWidth = 12
      ctx.beginPath()
      ctx.arc(width / 2, height / 2, width / 2 - 6, 0, Math.PI * 2)
      ctx.stroke()

      if (captureMode === 'focus' && !showGrid) {
        const focusColor = isInFocus ? '#4ade80' : '#ef4444'
        ctx.strokeStyle = focusColor
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(width / 2, height / 2, width / 2 - 2, 0, Math.PI * 2)
        ctx.stroke()
      }
    },
    [zoom, captureMode, isInFocus, cameraError]
  )

  const drawFocusRing = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const centerX = width / 2
      const centerY = height / 2
      const radius = width / 2 + 8

      const startAngle = Math.PI * 0.75
      const endAngle = Math.PI * 2.25
      const totalAngle = endAngle - startAngle

      const focusProgress = (focusDistance - 0.5) / 99.5
      const focusAngle = startAngle + totalAngle * Math.min(1, focusProgress)

      ctx.strokeStyle = 'rgba(100, 150, 200, 0.6)'
      ctx.lineWidth = 6
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, startAngle, endAngle)
      ctx.stroke()

      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 6
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, startAngle, focusAngle)
      ctx.stroke()

      ctx.fillStyle = '#fff'
      ctx.font = '12px monospace'
      ctx.textAlign = 'center'
      const displayDistance =
        focusDistance >= 100 ? '∞' : focusDistance.toFixed(1) + 'm'
      ctx.fillText(displayDistance, centerX, centerY - radius - 12)

      for (let i = 0; i <= 10; i++) {
        const angle = startAngle + totalAngle * (i / 10)
        const tickLength = i % 5 === 0 ? 10 : 5
        const innerRadius = radius + 12
        const outerRadius = radius + 12 + tickLength

        const x1 = centerX + Math.cos(angle) * innerRadius
        const y1 = centerY + Math.sin(angle) * innerRadius
        const x2 = centerX + Math.cos(angle) * outerRadius
        const y2 = centerY + Math.sin(angle) * outerRadius

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }
    },
    [focusDistance]
  )

  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'environment' },
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch {
        setCameraError(true)
      }
    }

    initCamera()

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  useEffect(() => {
    const render = () => {
      const leftCanvas = leftCanvasRef.current
      const rightCanvas = rightCanvasRef.current

      if (leftCanvas && rightCanvas) {
        const leftCtx = leftCanvas.getContext('2d')
        const rightCtx = rightCanvas.getContext('2d')

        if (leftCtx && rightCtx) {
          const width = leftCanvas.width
          const height = leftCanvas.height

          leftCtx.clearRect(0, 0, width, height)
          rightCtx.clearRect(0, 0, width, height)

          drawViewfinder(leftCtx, width, height, false)
          drawViewfinder(rightCtx, width, height, true)

          if (captureMode === 'focus') {
            drawFocusRing(leftCtx, width, height)
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(render)
    }

    animationFrameRef.current = requestAnimationFrame(render)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [drawViewfinder, drawFocusRing, captureMode])

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()

      if (captureMode === 'focus') {
        const delta = e.deltaY > 0 ? -0.2 : 0.2
        setFocusDistance(focusDistance + delta)
      } else {
        const delta = e.deltaY > 0 ? -0.02 : 0.02
        setZoom(zoom + delta)
      }
    },
    [captureMode, focusDistance, zoom, setFocusDistance, setZoom]
  )

  const handleLeftClick = useCallback(() => {
    if (captureMode === 'viewfinder') {
      setCaptureMode('focus')
      setIsFocusMode(true)
    } else {
      setCaptureMode('viewfinder')
      setIsFocusMode(false)
    }
  }, [captureMode, setCaptureMode])

  const capturePhoto = useCallback(() => {
    const canvas = leftCanvasRef.current
    if (!canvas) return

    triggerFlash()

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = width
    tempCanvas.height = height
    const tempCtx = tempCanvas.getContext('2d')
    if (!tempCtx) return

    tempCtx.drawImage(canvas, 0, 0)

    const imageData = tempCtx.getImageData(0, 0, width, height)
    const processedData = FilterProcessor.process(imageData, filterSettings)
    tempCtx.putImageData(processedData, 0, 0)

    const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.9)
    addPhoto(dataUrl, filterSettings)
  }, [triggerFlash, addPhoto, filterSettings])

  return (
    <div className="camera-view-container">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ display: 'none' }}
      />

      <div className="viewfinders-wrapper">
        <div
          className="prism-decoration"
          aria-hidden="true"
        />

        <div className="viewfinders-row">
          <div
            className="viewfinder-wrapper"
            onWheel={handleWheel}
            onClick={handleLeftClick}
          >
            <canvas
              ref={leftCanvasRef}
              width={240}
              height={240}
              className="viewfinder-canvas"
            />
            <div className="viewfinder-label">FOCUS</div>
          </div>

          <div
            className="viewfinder-wrapper"
            onWheel={handleWheel}
          >
            <canvas
              ref={rightCanvasRef}
              width={240}
              height={240}
              className="viewfinder-canvas"
            />
            <div className="viewfinder-label">COMPOSE</div>
          </div>
        </div>
      </div>

      <div className="shutter-section">
        <button
          className="shutter-button"
          onClick={capturePhoto}
          aria-label="快门"
        >
          <div className="shutter-inner" />
        </button>
      </div>

      <style>{`
        .camera-view-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
        }

        .viewfinders-wrapper {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .prism-decoration {
          width: 200px;
          height: 20px;
          background: linear-gradient(180deg, #d4c4a6 0%, #b8a88a 50%, #9a8a6c 100%);
          clip-path: polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%);
          margin-bottom: -2px;
          position: relative;
          z-index: 2;
          box-shadow: 0 -2px 4px rgba(0,0,0,0.3);
        }

        .viewfinders-row {
          display: flex;
          gap: 20px;
          padding: 20px 24px;
          background: linear-gradient(180deg, #2a2018 0%, #1a1410 100%);
          border-radius: 8px 8px 12px 12px;
          box-shadow: 
            0 4px 8px rgba(0,0,0,0.5),
            inset 0 1px 2px rgba(255,255,255,0.1);
        }

        .viewfinder-wrapper {
          position: relative;
          cursor: pointer;
          transition: transform 0.15s ease;
        }

        .viewfinder-wrapper:hover {
          transform: scale(1.02);
        }

        .viewfinder-wrapper:active {
          transform: scale(0.98);
        }

        .viewfinder-canvas {
          display: block;
          border-radius: 50%;
          background: #000;
        }

        .viewfinder-label {
          position: absolute;
          bottom: -22px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 10px;
          font-family: monospace;
          color: rgba(212, 165, 116, 0.7);
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .shutter-section {
          display: flex;
          justify-content: center;
          padding-top: 16px;
        }

        .shutter-button {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: none;
          background: linear-gradient(145deg, #e8e8e8 0%, #a0a0a0 50%, #6b6b6b 100%);
          box-shadow: 
            0 4px 8px rgba(0,0,0,0.4),
            inset 0 2px 4px rgba(255,255,255,0.6),
            inset 0 -2px 4px rgba(0,0,0,0.3);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
          padding: 0;
        }

        .shutter-button:hover {
          box-shadow: 
            0 2px 4px rgba(0,0,0,0.4),
            inset 0 2px 4px rgba(255,255,255,0.6),
            inset 0 -2px 4px rgba(0,0,0,0.3);
        }

        .shutter-button:active {
          transform: translateY(2px);
          box-shadow: 
            0 1px 2px rgba(0,0,0,0.4),
            inset 0 -2px 4px rgba(255,255,255,0.3),
            inset 0 2px 4px rgba(0,0,0,0.3);
        }

        .shutter-inner {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: linear-gradient(145deg, #c41e3a 0%, #8b0000 100%);
          box-shadow: inset 0 2px 4px rgba(255,255,255,0.3);
        }

        @media (max-width: 700px) {
          .viewfinders-row {
            flex-direction: column;
            gap: 16px;
          }

          .viewfinder-canvas {
            width: 160px;
            height: 160px;
          }

          .prism-decoration {
            width: 140px;
          }

          .shutter-button {
            width: 50px;
            height: 50px;
          }

          .shutter-inner {
            width: 24px;
            height: 24px;
          }
        }
      `}</style>
    </div>
  )
}
