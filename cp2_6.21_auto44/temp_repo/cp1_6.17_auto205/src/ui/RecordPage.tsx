import React, { useState, useEffect, useRef, useCallback } from 'react'
import { AudioRecorder } from '../audio/AudioRecorder'

interface RecordPageProps {
  onRecordingComplete: (audioData: number[], sampleRate: number) => void
}

function generateDemoAudio(): { audioData: number[]; sampleRate: number } {
  const sampleRate = 44100
  const duration = 5
  const length = sampleRate * duration
  const audioData = new Array(length)
  
  const frequencies = [220, 330, 440, 550, 660, 550, 440, 330]
  const segmentLength = Math.floor(length / frequencies.length)
  
  for (let i = 0; i < length; i++) {
    const segmentIndex = Math.min(Math.floor(i / segmentLength), frequencies.length - 1)
    const freq = frequencies[segmentIndex]
    const nextFreq = frequencies[Math.min(segmentIndex + 1, frequencies.length - 1)]
    const t = (i % segmentLength) / segmentLength
    const currentFreq = freq + (nextFreq - freq) * t * t
    
    const envelope = Math.sin(Math.PI * (i / length))
    
    const sample = 
      Math.sin(2 * Math.PI * currentFreq * i / sampleRate) * 0.3 +
      Math.sin(2 * Math.PI * currentFreq * 2 * i / sampleRate) * 0.1 +
      Math.sin(2 * Math.PI * currentFreq * 3 * i / sampleRate) * 0.05
    
    audioData[i] = sample * envelope * 0.8
  }
  
  return { audioData, sampleRate }
}

export const RecordPage: React.FC<RecordPageProps> = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [volume, setVolume] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const recorderRef = useRef<AudioRecorder | null>(null)
  const pulseRef = useRef<number>(0)

  useEffect(() => {
    recorderRef.current = new AudioRecorder(10000)
    recorderRef.current.setOnVolumeChange((vol) => {
      setVolume(vol)
    })
    recorderRef.current.setOnProgress((prog) => {
      setProgress(prog)
    })

    return () => {
      if (recorderRef.current) {
        recorderRef.current.destroy()
      }
    }
  }, [])

  useEffect(() => {
    if (isRecording) {
      const animate = () => {
        pulseRef.current = volume
      }
      const interval = setInterval(animate, 16)
      return () => clearInterval(interval)
    }
  }, [isRecording, volume])

  const handleClick = useCallback(async () => {
    if (isRecording || isProcessing) return

    try {
      setIsRecording(true)
      setProgress(0)
      await recorderRef.current?.start()
    } catch (error) {
      console.error('Failed to start recording:', error)
      setIsRecording(false)
      alert('无法访问麦克风，请确保已授权麦克风权限')
    }
  }, [isRecording, isProcessing])

  useEffect(() => {
    if (progress >= 1 && isRecording) {
      stopRecording()
    }
  }, [progress, isRecording])

  const stopRecording = useCallback(async () => {
    if (!recorderRef.current || !isRecording) return

    setIsRecording(false)
    setIsProcessing(true)

    try {
      const result = await recorderRef.current.stop()
      onRecordingComplete(result.audioData, result.sampleRate)
    } catch (error) {
      console.error('Failed to stop recording:', error)
      setIsProcessing(false)
    }
  }, [isRecording, onRecordingComplete])

  const handleDemoClick = useCallback(() => {
    if (isProcessing) return
    setIsProcessing(true)
    
    setTimeout(() => {
      const demo = generateDemoAudio()
      onRecordingComplete(demo.audioData, demo.sampleRate)
    }, 500)
  }, [isProcessing, onRecordingComplete])

  const pulseScale = 1 + volume * 0.3

  return (
    <div style={styles.container}>
      <div style={styles.title}>回声实验室</div>
      <div style={styles.subtitle}>点击下方按钮，录制你的声音雕塑</div>
      
      <div style={styles.recordButtonContainer}>
        <div
          onClick={handleClick}
          style={{
            ...styles.recordButtonOuter,
            transform: isRecording ? `scale(${pulseScale})` : 'scale(1)',
            transition: isRecording ? 'transform 0.1s ease-out' : 'transform 0.2s ease',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            opacity: isProcessing ? 0.6 : 1
          }}
        >
          <div style={styles.recordButtonInner}>
            {isRecording ? (
              <div style={styles.recordingIcon} />
            ) : isProcessing ? (
              <div style={styles.processingText}>处理中...</div>
            ) : (
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6200EE"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          ...styles.progressBar,
          opacity: isRecording ? 1 : 0,
          transform: isRecording ? 'translateY(0)' : 'translateY(4px)',
          transition: 'opacity 0.3s ease, transform 0.3s ease'
        }}
      >
        <div
          style={{
            ...styles.progressFill,
            width: `${progress * 100}%`,
            background: `linear-gradient(90deg, #BB86FC, #ffffff)`,
            transition: 'width 0.05s linear'
          }}
        />
      </div>

      <div style={styles.hint}>
        {isRecording ? '正在录制，最长10秒...' : '点击开始录制'}
      </div>
      
      <button
        onClick={handleDemoClick}
        disabled={isProcessing}
        style={{
          ...styles.demoButton,
          opacity: isProcessing ? 0.6 : 1,
          cursor: isProcessing ? 'not-allowed' : 'pointer'
        }}
      >
        试用演示
      </button>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#121212',
    position: 'relative',
    overflow: 'hidden'
  },
  title: {
    fontSize: 36,
    fontWeight: 700,
    color: '#ffffff',
    marginBottom: 8,
    background: 'linear-gradient(135deg, #BB86FC, #03DAC6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 60
  },
  recordButtonContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  recordButtonOuter: {
    width: 100,
    height: 100,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #BB86FC, #6200EE)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 30px rgba(187, 134, 252, 0.4)'
  },
  recordButtonInner: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    background: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.1)'
  },
  recordingIcon: {
    width: 28,
    height: 28,
    borderRadius: 4,
    background: '#CF6679'
  },
  processingText: {
    fontSize: 12,
    color: '#333',
    fontWeight: 500
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    background: 'transparent'
  },
  progressFill: {
    height: '100%',
    borderRadius: '2px 2px 0 0'
  },
  hint: {
    marginTop: 40,
    fontSize: 14,
    color: '#666'
  },
  demoButton: {
    marginTop: 20,
    padding: '10px 24px',
    background: 'transparent',
    border: '1px solid #3A3A4A',
    borderRadius: 8,
    color: '#888',
    fontSize: 14,
    transition: 'all 0.2s ease'
  }
}

export default RecordPage
