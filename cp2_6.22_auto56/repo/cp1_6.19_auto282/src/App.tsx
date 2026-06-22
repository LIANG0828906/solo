import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import html2canvas from 'html2canvas'
import ParticleCanvas from './components/ParticleCanvas'
import ControlPanel from './components/ControlPanel'
import { useParticleStore, physicsModeNames } from './store/particleStore'

export default function App() {
  const [fps, setFps] = useState(60)
  const [isRecording, setIsRecording] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null!)
  const recordingFramesRef = useRef<HTMLCanvasElement[]>([])
  const recordingIntervalRef = useRef<number | null>(null)
  const recordingStartTimeRef = useRef<number>(0)

  const { particles, maxParticles, physicsMode, clearParticles } = useParticleStore()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleFpsUpdate = useCallback((newFps: number) => {
    setFps(newFps)
  }, [])

  const startRecording = useCallback(() => {
    if (isRecording) return
    setIsRecording(true)
    recordingFramesRef.current = []
    recordingStartTimeRef.current = Date.now()

    const captureFrame = async () => {
      if (!canvasRef.current) return

      const elapsed = Date.now() - recordingStartTimeRef.current
      if (elapsed >= 5000) {
        stopRecording()
        return
      }

      try {
        const canvas = await html2canvas(canvasRef.current, {
          backgroundColor: null,
          scale: 0.5,
        })
        recordingFramesRef.current.push(canvas)
      } catch (err) {
        console.error('Failed to capture frame:', err)
      }
    }

    recordingIntervalRef.current = window.setInterval(captureFrame, 1000 / 15)
  }, [isRecording])

  const stopRecording = useCallback(() => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
      recordingIntervalRef.current = null
    }
    setIsRecording(false)

    if (recordingFramesRef.current.length > 0) {
      downloadGif(recordingFramesRef.current)
    }
    recordingFramesRef.current = []
  }, [])

  const downloadGif = useCallback(async (frames: HTMLCanvasElement[]) => {
    if (frames.length === 0) return

    const firstFrame = frames[0]
    const width = firstFrame.width
    const height = firstFrame.height

    const gif = createGif(frames, width, height, 15)

    const blob = new Blob([gif as unknown as ArrayBuffer], { type: 'image/gif' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `particle-universe-${Date.now()}.gif`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }, [isRecording, startRecording, stopRecording])

  const handleReset = useCallback(() => {
    clearParticles()
  }, [clearParticles])

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    width: '100%',
    height: '100%',
    backgroundColor: '#0B0D1E',
    position: 'relative',
    overflow: 'hidden',
  }

  const canvasContainerStyle: React.CSSProperties = {
    flex: 1,
    position: 'relative',
    padding: isMobile ? (isPanelCollapsed ? '60px 0 40px 0' : '0 0 40px 0') : '0 0 40px 20px',
    display: 'flex',
    flexDirection: 'column',
  }

  const canvasWrapperStyle: React.CSSProperties = {
    flex: 1,
    position: 'relative',
    borderRadius: '10px',
    overflow: 'hidden',
    border: '2px solid rgba(255,255,255,0.05)',
  }

  const buttonContainerStyle: React.CSSProperties = {
    position: 'absolute',
    top: '16px',
    right: '16px',
    display: 'flex',
    gap: '12px',
    zIndex: 50,
  }

  const statusBarStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 0,
    left: isMobile ? 0 : '280px',
    right: 0,
    height: '40px',
    backgroundColor: 'rgba(20, 20, 40, 0.75)',
    backdropFilter: 'blur(10px)',
    borderTop: '2px solid rgba(255,255,255,0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: '0 20px',
    fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
    fontSize: '12px',
    color: '#BDC3C7',
    zIndex: 40,
  }

  return (
    <div style={containerStyle}>
      <AnimatePresence>
        {!isMobile && (
          <div style={{ padding: '20px 0 20px 20px', height: '100%' }}>
            <ControlPanel
              isCollapsed={isPanelCollapsed}
              onToggleCollapse={() => setIsPanelCollapsed(!isPanelCollapsed)}
              isMobile={isMobile}
            />
          </div>
        )}
      </AnimatePresence>

      {isMobile && (
        <ControlPanel
          isCollapsed={isPanelCollapsed}
          onToggleCollapse={() => setIsPanelCollapsed(!isPanelCollapsed)}
          isMobile={isMobile}
        />
      )}

      <div style={canvasContainerStyle}>
        <div style={canvasWrapperStyle}>
          <ParticleCanvas onFpsUpdate={handleFpsUpdate} canvasRef={canvasRef} />

          <div style={buttonContainerStyle}>
            <AnimatePresence>
              <motion.button
                key="record"
                onClick={toggleRecording}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  backgroundColor: isRecording ? ['#E74C3C', '#C0392B', '#E74C3C'] : '#E74C3C',
                  transition: {
                    backgroundColor: isRecording
                      ? { repeat: Infinity, duration: 0.5 }
                      : { duration: 0.2 },
                  },
                }}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isRecording
                    ? '0 0 20px rgba(231, 76, 60, 0.8)'
                    : '0 2px 10px rgba(0,0,0,0.3)',
                  transition: 'all 0.3s ease',
                }}
                title={isRecording ? '停止录制' : '开始录制'}
              >
                <div
                  style={{
                    width: isRecording ? '12px' : '14px',
                    height: isRecording ? '12px' : '14px',
                    borderRadius: isRecording ? '2px' : '50%',
                    backgroundColor: '#FFFFFF',
                  }}
                />
              </motion.button>

              <motion.button
                key="reset"
                onClick={handleReset}
                whileHover={{ scale: 1.1, backgroundColor: '#FFFFFF' }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: '#95A5A6',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                  transition: 'all 0.3s ease',
                }}
                title="重置画布"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
              </motion.button>
            </AnimatePresence>
          </div>
        </div>

        <div style={statusBarStyle}>
          <span>
            粒子：{particles.length}/{maxParticles}
          </span>
          <span>FPS：{fps}</span>
          <span>模式：{physicsModeNames[physicsMode]}</span>
        </div>
      </div>
    </div>
  )
}

function createGif(frames: HTMLCanvasElement[], width: number, height: number, fps: number): Uint8Array {
  const delay = Math.round(100 / fps)
  const byteArray: number[] = []

  writeString(byteArray, 'GIF89a')
  writeUInt16(byteArray, width)
  writeUInt16(byteArray, height)
  byteArray.push(0xf6)
  byteArray.push(0)
  byteArray.push(0)

  const palette = createColorPalette()
  for (const color of palette) {
    byteArray.push(color.r)
    byteArray.push(color.g)
    byteArray.push(color.b)
  }

  writeNetscapeExtension(byteArray, 0)

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i]
    writeGraphicsControlExtension(byteArray, delay)
    writeImageDescriptor(byteArray, 0, 0, width, height)
    writeImageData(byteArray, frame, palette, width, height)
  }

  byteArray.push(0x3b)

  return new Uint8Array(byteArray)
}

function createColorPalette(): { r: number; g: number; b: number }[] {
  const palette: { r: number; g: number; b: number }[] = []

  palette.push({ r: 11, g: 13, b: 30 })
  palette.push({ r: 26, g: 10, b: 46 })

  for (let i = 0; i < 254; i++) {
    const hue = (i / 254) * 360
    const { r, g, b } = hslToRgb(hue / 360, 1, 0.6)
    palette.push({ r, g, b })
  }

  return palette
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  let r, g, b

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  }
}

function writeString(byteArray: number[], str: string) {
  for (let i = 0; i < str.length; i++) {
    byteArray.push(str.charCodeAt(i))
  }
}

function writeUInt16(byteArray: number[], value: number) {
  byteArray.push(value & 0xff)
  byteArray.push((value >> 8) & 0xff)
}

function writeNetscapeExtension(byteArray: number[], loopCount: number) {
  byteArray.push(0x21)
  byteArray.push(0xff)
  byteArray.push(0x0b)
  writeString(byteArray, 'NETSCAPE2.0')
  byteArray.push(0x03)
  byteArray.push(0x01)
  writeUInt16(byteArray, loopCount)
  byteArray.push(0x00)
}

function writeGraphicsControlExtension(byteArray: number[], delay: number) {
  byteArray.push(0x21)
  byteArray.push(0xf9)
  byteArray.push(0x04)
  byteArray.push(0x00)
  writeUInt16(byteArray, delay)
  byteArray.push(0x00)
  byteArray.push(0x00)
}

function writeImageDescriptor(
  byteArray: number[],
  left: number,
  top: number,
  width: number,
  height: number
) {
  byteArray.push(0x2c)
  writeUInt16(byteArray, left)
  writeUInt16(byteArray, top)
  writeUInt16(byteArray, width)
  writeUInt16(byteArray, height)
  byteArray.push(0x00)
}

function writeImageData(
  byteArray: number[],
  canvas: HTMLCanvasElement,
  palette: { r: number; g: number; b: number }[],
  width: number,
  height: number
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  const indexedPixels: number[] = []

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = data[i + 3]

    if (a < 128) {
      indexedPixels.push(0)
    } else {
      let minDist = Infinity
      let minIndex = 0

      for (let j = 0; j < palette.length; j++) {
        const dr = r - palette[j].r
        const dg = g - palette[j].g
        const db = b - palette[j].b
        const dist = dr * dr + dg * dg + db * db

        if (dist < minDist) {
          minDist = dist
          minIndex = j
        }
      }

      indexedPixels.push(minIndex)
    }
  }

  lzwEncode(byteArray, indexedPixels, 8)
}

function lzwEncode(byteArray: number[], pixels: number[], minCodeSize: number) {
  const clearCode = 1 << minCodeSize
  const eoiCode = clearCode + 1

  let codeSize = minCodeSize + 1
  let dict: Map<string, number> = new Map()
  let nextCode = eoiCode + 1

  const resetDict = () => {
    dict = new Map()
    for (let i = 0; i < clearCode; i++) {
      dict.set(String(i), i)
    }
    dict.set(String(clearCode), clearCode)
    dict.set(String(eoiCode), eoiCode)
    nextCode = eoiCode + 1
    codeSize = minCodeSize + 1
  }

  resetDict()

  const output: number[] = []
  let bitBuffer = 0
  let bitCount = 0

  const writeCode = (code: number) => {
    bitBuffer |= code << bitCount
    bitCount += codeSize

    while (bitCount >= 8) {
      output.push(bitBuffer & 0xff)
      bitBuffer >>= 8
      bitCount -= 8
    }
  }

  writeCode(clearCode)

  let current = String(pixels[0])

  for (let i = 1; i < pixels.length; i++) {
    const next = pixels[i]
    const combined = current + ',' + next

    if (dict.has(combined)) {
      current = combined
    } else {
      const code = dict.get(current)!
      writeCode(code)

      if (nextCode < 4096) {
        dict.set(combined, nextCode)
        nextCode++

        if (nextCode > 1 << codeSize && codeSize < 12) {
          codeSize++
        }
      } else {
        writeCode(clearCode)
        resetDict()
      }

      current = String(next)
    }
  }

  writeCode(dict.get(current)!)
  writeCode(eoiCode)

  if (bitCount > 0) {
    output.push(bitBuffer & 0xff)
  }

  byteArray.push(minCodeSize)

  for (let i = 0; i < output.length; i += 255) {
    const chunk = output.slice(i, i + 255)
    byteArray.push(chunk.length)
    for (const b of chunk) {
      byteArray.push(b)
    }
  }

  byteArray.push(0)
}
