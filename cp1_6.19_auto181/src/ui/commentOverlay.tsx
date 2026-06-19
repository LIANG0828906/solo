import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore, formatRelativeTime, type Comment } from '../store/appStore'
import { WaveformThumb } from './WaveformThumb'
import { EMOTION_CONFIG, segmentProcessor } from '../audioEngine/segmentProcessor'

const EMOJIS = ['🔥', '🎸', '✨', '💔', '🎵']
const MAX_COMMENT_LENGTH = 80

export function CommentOverlay() {
  const { selectedSegmentId, segments, comments, addComment, setSelectedSegmentId } = useStore()
  const [commentText, setCommentText] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const selectedSegment = segments.find((s) => s.id === selectedSegmentId)
  const segmentComments = selectedSegmentId ? comments[selectedSegmentId] || [] : []

  useEffect(() => {
    if (selectedSegmentId) {
      setCommentText('')
      setSelectedEmoji('')
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [selectedSegmentId])

  if (!selectedSegment) return null

  const handleSubmit = () => {
    const trimmedText = commentText.trim()
    if (!trimmedText && !selectedEmoji) return

    addComment(selectedSegment.id, trimmedText, selectedEmoji)
    setCommentText('')
    setSelectedEmoji('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape') {
      setSelectedSegmentId(null)
    }
  }

  const emotionConfig = EMOTION_CONFIG[selectedSegment.emotion]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          backdropFilter: 'blur(4px)'
        }}
        onClick={() => setSelectedSegmentId(null)}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{
            width: 480,
            height: 360,
            borderRadius: 16,
            backgroundColor: '#1E1E2E',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: 4,
                  backgroundColor: emotionConfig.color,
                  color: '#FFFFFF',
                  fontSize: 12,
                  fontWeight: 600
                }}
              >
                {emotionConfig.label}
              </span>
              <span style={{ color: '#8888AA', fontSize: 12 }}>
                {segmentProcessor.formatTime(selectedSegment.start)} -{' '}
                {segmentProcessor.formatTime(selectedSegment.end)}
              </span>
            </div>
            <button
              onClick={() => setSelectedSegmentId(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#8888AA',
                fontSize: 20,
                cursor: 'pointer',
                padding: 4,
                lineHeight: 1
              }}
            >
              ×
            </button>
          </div>

          <div style={{ backgroundColor: '#0B0B1A', borderRadius: 8, padding: 12 }}>
            <WaveformThumb
              data={selectedSegment.waveformThumb}
              width={432}
              height={60}
              color={emotionConfig.color}
              backgroundColor="#0B0B1A"
            />
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              paddingRight: 8
            }}
          >
            {segmentComments.length === 0 ? (
              <div
                style={{
                  color: '#666688',
                  fontSize: 13,
                  textAlign: 'center',
                  padding: 20
                }}
              >
                还没有评论，来添加第一条吧！
              </div>
            ) : (
              segmentComments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setSelectedEmoji(selectedEmoji === emoji ? '' : emoji)}
                  style={{
                    fontSize: 20,
                    background: selectedEmoji === emoji ? '#3A3A5C' : 'transparent',
                    border: 'none',
                    borderRadius: 8,
                    padding: 6,
                    cursor: 'pointer',
                    transform: selectedEmoji === emoji ? 'scale(1.2)' : 'scale(1)',
                    transition: 'all 0.2s'
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <textarea
                ref={textareaRef}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
                onKeyDown={handleKeyDown}
                placeholder="添加你的评论..."
                style={{
                  flex: 1,
                  backgroundColor: '#0B0B1A',
                  border: '1px solid #3A3A5C',
                  borderRadius: 8,
                  padding: 10,
                  color: '#FFFFFF',
                  fontSize: 13,
                  resize: 'none',
                  height: 36,
                  outline: 'none'
                }}
              />
              <button
                onClick={handleSubmit}
                disabled={!commentText.trim() && !selectedEmoji}
                style={{
                  backgroundColor: '#6C63FF',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 8,
                  padding: '0 20px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: commentText.trim() || selectedEmoji ? 'pointer' : 'not-allowed',
                  opacity: commentText.trim() || selectedEmoji ? 1 : 0.5
                }}
              >
                发送
              </button>
            </div>
            <div style={{ color: '#666688', fontSize: 11, textAlign: 'right' }}>
              {commentText.length}/{MAX_COMMENT_LENGTH}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function CommentItem({ comment }: { comment: Comment }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex',
        gap: 10,
        padding: 10,
        backgroundColor: '#0B0B1A',
        borderRadius: 8
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          backgroundColor: comment.userColor,
          flexShrink: 0
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 500 }}>
            {comment.userName}
          </span>
          <span style={{ color: '#666688', fontSize: 11 }}>
            {formatRelativeTime(comment.timestamp)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {comment.emoji && <span style={{ fontSize: 16 }}>{comment.emoji}</span>}
          <span style={{ color: '#CCCCDD', fontSize: 13, wordBreak: 'break-word' }}>
            {comment.text}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
