import React, { useState, useRef, useEffect } from 'react'
import { useRecallStore } from '@/stores/recallStore'
import type { Recall, RecallType } from '@/types'

const ModalRecorder: React.FC = () => {
  const { selectedLocation, isModalOpen, setModalOpen, submitRecall, recalls, isLoading } = useRecallStore()
  const [recallType, setRecallType] = useState<RecallType>('text')
  const [textContent, setTextContent] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const timerRef = useRef<number | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const modalRef = useRef<HTMLDivElement>(null)

  const MAX_TEXT_LENGTH = 300
  const MAX_RECORDING_TIME = 20
  const remainingChars = MAX_TEXT_LENGTH - textContent.length
  const locationRecalls = (selectedLocation && recalls[selectedLocation.id]) || []

  useEffect(() => {
    if (isModalOpen) {
      setRecallType('text')
      setTextContent('')
      setAudioBlob(null)
      setAudioUrl(null)
      setRecordingTime(0)
    }
  }, [isModalOpen])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  const handleClose = () => {
    setModalOpen(false)
    if (isRecording) {
      stopRecording()
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose()
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= MAX_RECORDING_TIME - 1) {
            stopRecording()
            return MAX_RECORDING_TIME
          }
          return prev + 1
        })
      }, 1000)
    } catch (error) {
      console.error('Failed to start recording:', error)
      alert('无法访问麦克风，请检查权限设置')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const handleSubmit = async () => {
    if (!selectedLocation) return

    let content = ''
    if (recallType === 'text') {
      if (!textContent.trim()) return
      content = textContent.trim()
    } else if (recallType === 'audio') {
      if (!audioBlob) return
      content = audioUrl || ''
    }

    setIsSubmitting(true)
    try {
      await submitRecall(selectedLocation.id, recallType, content)
      setTextContent('')
      setAudioBlob(null)
      setAudioUrl(null)
      setRecordingTime(0)
    } catch (error) {
      console.error('Failed to submit recall:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const heatData = useRecallStore((state) => state.heatData)

  const getHeatPercentage = () => {
    if (!selectedLocation) return 0
    return heatData[selectedLocation.id]?.heat_score || 0
  }

  if (!isModalOpen || !selectedLocation) return null

  const heatPercentage = getHeatPercentage()

  return (
    <div
      className="modal-overlay fade-in"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        ref={modalRef}
        className="glass-card fade-in"
        style={{
          width: '100%',
          maxWidth: '600px',
          maxHeight: '85vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '24px 24px 0',
            borderBottom: '1px solid rgba(93, 64, 55, 0.1)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h2
                style={{
                  fontFamily: 'ZCOOL XiaoWei, serif',
                  fontSize: '24px',
                  color: '#3E2723',
                  marginBottom: '4px',
                }}
              >
                {selectedLocation.name}
              </h2>
              <p style={{ fontSize: '13px', color: '#8D6E63' }}>{selectedLocation.description}</p>
            </div>
            <button
              onClick={handleClose}
              className="btn btn-ghost"
              style={{ padding: '6px 12px', fontSize: '18px' }}
            >
              ×
            </button>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#8D6E63', marginBottom: '6px' }}>
              <span>当前热度</span>
              <span style={{ fontWeight: '600', color: '#5D4037' }}>{Math.round(heatPercentage)}%</span>
            </div>
            <div
              style={{
                height: '8px',
                borderRadius: '4px',
                background: 'rgba(93, 64, 55, 0.1)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  borderRadius: '4px',
                  background: `linear-gradient(to right, #1E88E5, #FFC107, #E53935)`,
                  width: `${heatPercentage}%`,
                  transition: 'width 0.5s ease-out',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button
              className={`btn ${recallType === 'text' ? 'btn-secondary' : 'btn-ghost'}`}
              onClick={() => setRecallType('text')}
              style={{ flex: 1 }}
            >
              ✍️ 文字回忆
            </button>
            <button
              className={`btn ${recallType === 'audio' ? 'btn-secondary' : 'btn-ghost'}`}
              onClick={() => setRecallType('audio')}
              style={{ flex: 1 }}
            >
              🎤 声音回忆
            </button>
          </div>

          {recallType === 'text' ? (
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value.slice(0, MAX_TEXT_LENGTH))}
                placeholder="写下你在这里的故事..."
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '12px',
                  border: '1px solid rgba(93, 64, 55, 0.2)',
                  borderRadius: '8px',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  resize: 'vertical',
                  background: 'rgba(255, 255, 255, 0.8)',
                  color: '#3E2723',
                  outline: 'none',
                  transition: 'border-color 0.2s ease-out',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#4CAF50'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(93, 64, 55, 0.2)'
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  right: '10px',
                  bottom: '10px',
                  fontSize: '11px',
                  color: remainingChars < 30 ? '#E53935' : '#8D6E63',
                  fontWeight: remainingChars < 30 ? '600' : '400',
                }}
              >
                {remainingChars} / {MAX_TEXT_LENGTH}
              </span>
            </div>
          ) : (
            <div style={{ marginBottom: '16px' }}>
              {!audioBlob ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '24px',
                    border: '1px dashed rgba(93, 64, 55, 0.3)',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.5)',
                  }}
                >
                  <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                    {isRecording && (
                      <>
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '50%',
                            background: 'rgba(229, 57, 53, 0.3)',
                            animation: 'pulse-ring 0.8s ease-out infinite',
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '50%',
                            background: 'rgba(229, 57, 53, 0.2)',
                            animation: 'pulse-ring 0.8s ease-out infinite',
                            animationDelay: '0.4s',
                          }}
                        />
                      </>
                    )}
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      style={{
                        position: 'relative',
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        border: 'none',
                        background: isRecording ? '#E53935' : '#4CAF50',
                        color: 'white',
                        fontSize: '24px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                        transition: 'all 0.2s ease-out',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isRecording ? (
                        <div style={{ width: '24px', height: '24px', background: 'white', borderRadius: '2px' }} />
                      ) : (
                        '🎤'
                      )}
                    </button>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', color: '#3E2723', marginBottom: '4px' }}>
                      {isRecording ? '正在录音...' : '点击开始录音'}
                    </div>
                    {isRecording && (
                      <div style={{ fontSize: '24px', fontWeight: '600', color: '#E53935' }}>
                        {MAX_RECORDING_TIME - recordingTime}s
                      </div>
                    )}
                    <div style={{ fontSize: '12px', color: '#8D6E63', marginTop: '4px' }}>
                      最长 {MAX_RECORDING_TIME} 秒
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <audio controls src={audioUrl || undefined} style={{ width: '100%' }} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => {
                      setAudioBlob(null)
                      setAudioUrl(null)
                      setRecordingTime(0)
                    }}>
                      🔄 重新录制
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              (recallType === 'text' && !textContent.trim()) ||
              (recallType === 'audio' && !audioBlob)
            }
            style={{
              width: '100%',
              opacity:
                isSubmitting ||
                (recallType === 'text' && !textContent.trim()) ||
                (recallType === 'audio' && !audioBlob)
                  ? 0.5
                  : 1,
              cursor:
                isSubmitting ||
                (recallType === 'text' && !textContent.trim()) ||
                (recallType === 'audio' && !audioBlob)
                  ? 'not-allowed'
                  : 'pointer',
              marginBottom: '20px',
            }}
          >
            {isSubmitting ? '提交中...' : '✨ 留下回忆'}
          </button>
        </div>

        <div style={{ padding: '0 24px 24px', overflowY: 'auto', flex: 1 }}>
          <h3 style={{ fontSize: '14px', color: '#5D4037', marginBottom: '12px', fontWeight: '500' }}>
            回忆列表 ({locationRecalls.length})
          </h3>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#8D6E63' }}>
              加载中...
            </div>
          ) : locationRecalls.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#8D6E63' }}>
              <div style={{ fontSize: '40px', marginBottom: '8px' }}>📝</div>
              还没有回忆，成为第一个留下故事的人吧
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {locationRecalls.map((recall: Recall, index: number) => (
                <div
                  key={recall.id}
                  className="glass-card fade-in"
                  style={{
                    padding: '16px',
                    animationDelay: `${index * 0.1}s`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '16px' }}>
                      {recall.type === 'text' ? '✍️' : '🎤'}
                    </span>
                    <span style={{ fontSize: '11px', color: '#8D6E63' }}>
                      {formatDate(recall.timestamp)}
                    </span>
                  </div>
                  {recall.type === 'text' ? (
                    <p style={{ fontSize: '14px', color: '#3E2723', lineHeight: '1.7' }}>
                      {recall.content}
                    </p>
                  ) : (
                    <audio controls src={recall.content} style={{ width: '100%' }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ModalRecorder
