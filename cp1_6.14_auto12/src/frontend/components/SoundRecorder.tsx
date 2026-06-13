import { useState, useRef, useEffect, useCallback } from 'react'
import axios from 'axios'
import type { SoundCategory } from '../../shared/types'

interface SoundRecorderProps {
  position: { lat: number; lng: number }
  onClose: () => void
  onUploaded: () => void
}

type RecordingState = 'idle' | 'recording' | 'paused' | 'finished'

const MIN_DURATION = 5
const MAX_DURATION = 60

function SoundRecorder({ position, onClose, onUploaded }: SoundRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [duration, setDuration] = useState(0)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<SoundCategory>('other')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [uploader, setUploader] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioBlobRef = useRef<Blob | null>(null)
  const audioUrlRef = useRef<string | null>(null)
  const timerRef = useRef<number | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const drawWaveform = useCallback(() => {
    if (!analyserRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const analyser = analyserRef.current
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw)
      analyser.getByteFrequencyData(dataArray)

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const barWidth = 4
      const barGap = 3
      const barCount = Math.floor(canvas.width / (barWidth + barGap))
      const startX = (canvas.width - barCount * (barWidth + barGap)) / 2

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * bufferLength)
        const barHeight = (dataArray[dataIndex] / 255) * (canvas.height - 20)

        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height)
        gradient.addColorStop(0, '#4ab8a9')
        gradient.addColorStop(1, '#2d8a7e')

        ctx.fillStyle = gradient
        const x = startX + i * (barWidth + barGap)
        const y = (canvas.height - barHeight) / 2
        ctx.beginPath()
        ctx.roundRect(x, y, barWidth, barHeight, 2)
        ctx.fill()
      }
    }

    draw()
  }, [])

  const startRecording = async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)
      analyserRef.current = analyser

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        audioBlobRef.current = blob
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current)
        }
        audioUrlRef.current = URL.createObjectURL(blob)
        setRecordingState('finished')
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }
      }

      mediaRecorder.start()
      setRecordingState('recording')
      setDuration(0)
      drawWaveform()

      const startTime = Date.now()
      timerRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        setDuration(elapsed)
        if (elapsed >= MAX_DURATION) {
          stopRecording()
        }
      }, 100)
    } catch (err) {
      setError('无法访问麦克风，请检查权限设置')
      console.error('Recording error:', err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop()
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.pause()
      setRecordingState('paused')
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'paused') {
      mediaRecorderRef.current.resume()
      setRecordingState('recording')

      const startTime = Date.now() - duration * 1000
      timerRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        setDuration(elapsed)
        if (elapsed >= MAX_DURATION) {
          stopRecording()
        }
      }, 100)
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() && tags.length < 3 && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleUpload = async () => {
    if (!audioBlobRef.current) {
      setError('请先录制音频')
      return
    }

    if (duration < MIN_DURATION) {
      setError(`录音时长至少需要${MIN_DURATION}秒`)
      return
    }

    if (!title.trim()) {
      setError('请输入录音标题')
      return
    }

    setIsUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('audio', audioBlobRef.current, 'recording.webm')
      formData.append('title', title)
      formData.append('category', category)
      formData.append('lat', String(position.lat))
      formData.append('lng', String(position.lng))
      formData.append('duration', String(duration))
      formData.append('uploader', uploader || '匿名用户')
      formData.append('description', description)
      tags.forEach((tag) => formData.append('tags', tag))

      await axios.post('/api/sounds', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      onUploaded()
    } catch (err) {
      setError('上传失败，请重试')
      console.error('Upload error:', err)
    } finally {
      setIsUploading(false)
    }
  }

  const handleReset = () => {
    setRecordingState('idle')
    setDuration(0)
    audioBlobRef.current = null
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current)
      audioUrlRef.current = null
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current)
      if (audioContextRef.current) audioContextRef.current.close()
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="recorder-modal-overlay" onClick={onClose}>
      <div className="recorder-modal" onClick={(e) => e.stopPropagation()}>
        <div className="recorder-header">
          <h2>录制环境声音</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>
          📍 位置: {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
        </p>

        <div className="waveform-container">
          {recordingState === 'idle' || recordingState === 'finished' ? (
            <canvas ref={canvasRef} width={400} height={100} style={{ display: 'none' }} />
          ) : (
            <canvas ref={canvasRef} width={400} height={100} />
          )}
          {recordingState === 'idle' && (
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              点击下方按钮开始录音
            </span>
          )}
          {recordingState === 'finished' && audioUrlRef.current && (
            <audio
              src={audioUrlRef.current}
              controls
              style={{ width: '90%' }}
            />
          )}
        </div>

        <div className="recording-info">
          <div className="info-item">
            <div className="info-label">录音时长</div>
            <div className={`info-value ${recordingState === 'recording' ? 'recording' : ''}`}>
              {formatDuration(duration)}
            </div>
          </div>
          <div className="info-item">
            <div className="info-label">状态</div>
            <div className="info-value">
              {recordingState === 'idle' && '等待开始'}
              {recordingState === 'recording' && '🔴 录制中'}
              {recordingState === 'paused' && '⏸ 已暂停'}
              {recordingState === 'finished' && '✓ 已完成'}
            </div>
          </div>
        </div>

        <div className="recorder-controls">
          {recordingState === 'idle' && (
            <button className="record-btn" onClick={startRecording} title="开始录音">
              ●
            </button>
          )}
          {recordingState === 'recording' && (
            <>
              <button className="control-btn" onClick={pauseRecording} title="暂停">
                ⏸
              </button>
              <button
                className="record-btn recording"
                onClick={stopRecording}
                title="停止录音"
              >
                ■
              </button>
            </>
          )}
          {recordingState === 'paused' && (
            <>
              <button className="control-btn primary" onClick={resumeRecording} title="继续">
                ▶
              </button>
              <button className="control-btn" onClick={stopRecording} title="停止">
                ■
              </button>
            </>
          )}
          {recordingState === 'finished' && (
            <button className="control-btn" onClick={handleReset} title="重新录制">
              🔄
            </button>
          )}
        </div>

        {error && (
          <div
            style={{
              color: 'var(--accent-red)',
              fontSize: '0.85rem',
              marginBottom: '12px',
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}

        {recordingState === 'finished' && (
          <>
            <div className="form-group">
              <label>标题 *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="给这段声音起个名字"
                maxLength={50}
              />
            </div>

            <div className="form-group">
              <label>声音类型</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as SoundCategory)}
              >
                <option value="traffic">交通</option>
                <option value="nature">自然</option>
                <option value="crowd">人群</option>
                <option value="machinery">机械</option>
                <option value="other">其他</option>
              </select>
            </div>

            <div className="form-group">
              <label>上传者昵称</label>
              <input
                type="text"
                value={uploader}
                onChange={(e) => setUploader(e.target.value)}
                placeholder="你的昵称（选填）"
                maxLength={20}
              />
            </div>

            <div className="form-group">
              <label>描述</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="描述一下这段声音..."
                maxLength={200}
              />
            </div>

            <div className="form-group">
              <label>标签 (最多3个)</label>
              <div className="tags-input-container">
                {tags.map((tag) => (
                  <span key={tag} className="tag-badge">
                    {tag}
                    <span className="tag-remove" onClick={() => handleRemoveTag(tag)}>
                      ×
                    </span>
                  </span>
                ))}
                {tags.length < 3 && (
                  <input
                    type="text"
                    className="tags-input"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="输入标签按回车添加"
                    maxLength={15}
                  />
                )}
              </div>
            </div>

            <button
              className="upload-btn"
              onClick={handleUpload}
              disabled={isUploading || duration < MIN_DURATION}
            >
              {isUploading ? (
                <>
                  <span className="loading-spinner" style={{ marginRight: '8px' }} />
                  上传中...
                </>
              ) : (
                '上传声音标记'
              )}
            </button>

            {duration < MIN_DURATION && (
              <p
                style={{
                  color: 'var(--accent-orange)',
                  fontSize: '0.8rem',
                  marginTop: '8px',
                  textAlign: 'center',
                }}
              >
                录音时长不足{MIN_DURATION}秒，请重新录制
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default SoundRecorder
