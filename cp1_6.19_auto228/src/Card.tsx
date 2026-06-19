import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from './store'
import { getGradientColor, formatTimestamp } from './utils'

interface CardProps {
  id: string
  index: number
  total: number
}

export default function Card({ id, index, total }: CardProps) {
  const speech = useStore(state => state.speeches.find(s => s.id === id)!)
  const updateSpeech = useStore(state => state.updateSpeech)
  const deleteSpeech = useStore(state => state.deleteSpeech)
  const editingId = useStore(state => state.editingId)
  const setEditingId = useStore(state => state.setEditingId)
  const highlightedId = useStore(state => state.highlightedId)

  const [localSpeaker, setLocalSpeaker] = useState(speech.speaker)
  const [localText, setLocalText] = useState(speech.text)
  const [localTimestamp, setLocalTimestamp] = useState(speech.timestamp)

  const color = getGradientColor(index, total)
  const isEditing = editingId === id
  const isHighlighted = highlightedId === id

  const handleClick = () => {
    if (!isEditing) {
      setLocalSpeaker(speech.speaker)
      setLocalText(speech.text)
      setLocalTimestamp(speech.timestamp)
      setEditingId(id)
    }
  }

  const handleSave = () => {
    updateSpeech(id, {
      speaker: localSpeaker,
      text: localText,
      timestamp: localTimestamp
    })
    setEditingId(null)
  }

  const handleCancel = () => {
    setEditingId(null)
  }

  const handleDelete = () => {
    if (confirm('确定删除这条发言吗？')) {
      deleteSpeech(id)
      setEditingId(null)
    }
  }

  const maxTimestamp = speech.timestamp + 300

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'relative',
        paddingLeft: 40,
        marginBottom: 24,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 11,
          top: 16,
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: color,
          zIndex: 2,
        }}
      />

      <motion.div
        onClick={isEditing ? undefined : handleClick}
        whileHover={{
          translateY: -2,
          boxShadow: isHighlighted
            ? '0 0 15px rgba(78,205,196,0.5), 0 8px 24px rgba(0,0,0,0.1)'
            : '0 4px 12px rgba(0,0,0,0.08)',
        }}
        animate={{
          boxShadow: isHighlighted
            ? '0 0 20px rgba(78,205,196,0.6), 0 8px 30px rgba(78,205,196,0.2)'
            : '0 2px 8px rgba(0,0,0,0.04)',
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        style={{
          width: 480,
          maxWidth: '100%',
          borderRadius: 12,
          backgroundColor: '#F8F9FA',
          borderLeft: `2px solid ${color}`,
          padding: '16px 20px',
          cursor: isEditing ? 'default' : 'pointer',
          position: 'relative',
        }}
      >
        <AnimatePresence mode="wait">
          {!isEditing ? (
            <motion.div
              key="view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                    color: color,
                  }}
                >
                  {speech.speaker}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: '#888',
                    fontFamily: 'monospace',
                  }}
                >
                  {formatTimestamp(speech.timestamp)}
                </span>
              </div>
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: '#333',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {speech.text}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="edit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div style={{ marginBottom: 12 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    color: '#666',
                    marginBottom: 4,
                  }}
                >
                  发言者
                </label>
                <input
                  type="text"
                  value={localSpeaker}
                  onChange={e => setLocalSpeaker(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #E0E0E0',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    backgroundColor: '#fff',
                  }}
                  onFocus={e => (e.target.style.borderColor = color)}
                  onBlur={e => (e.target.style.borderColor = '#E0E0E0')}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    color: '#666',
                    marginBottom: 4,
                  }}
                >
                  发言内容 ({localText.length}/500)
                </label>
                <textarea
                  value={localText}
                  onChange={e => setLocalText(e.target.value.slice(0, 500))}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #E0E0E0',
                    fontSize: 14,
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    lineHeight: 1.6,
                    backgroundColor: '#fff',
                  }}
                  onFocus={e => (e.target.style.borderColor = color)}
                  onBlur={e => (e.target.style.borderColor = '#E0E0E0')}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 4,
                  }}
                >
                  <label style={{ fontSize: 12, color: '#666' }}>
                    时间戳调整
                  </label>
                  <span
                    style={{
                      fontSize: 12,
                      color,
                      fontFamily: 'monospace',
                      fontWeight: 600,
                    }}
                  >
                    {formatTimestamp(localTimestamp)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={maxTimestamp}
                  value={localTimestamp}
                  onChange={e => setLocalTimestamp(Number(e.target.value))}
                  style={{
                    width: '100%',
                    height: 4,
                    borderRadius: 2,
                    appearance: 'none',
                    background: `linear-gradient(to right, ${color} 0%, ${color} ${(localTimestamp / maxTimestamp) * 100}%, #E0E0E0 ${(localTimestamp / maxTimestamp) * 100}%, #E0E0E0 100%)`,
                    cursor: 'pointer',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  onClick={handleDelete}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: '1px solid #FF6B6B',
                    backgroundColor: 'transparent',
                    color: '#FF6B6B',
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.backgroundColor = '#FF6B6B'
                    e.currentTarget.style.color = '#fff'
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = '#FF6B6B'
                  }}
                  onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
                  onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  删除
                </button>
                <button
                  onClick={handleCancel}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: '1px solid #DDD',
                    backgroundColor: '#fff',
                    color: '#666',
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseOver={e => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                  onMouseOut={e => (e.currentTarget.style.backgroundColor = '#fff')}
                  onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
                  onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: 'none',
                    backgroundColor: '#4ECDC4',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseOver={e => (e.currentTarget.style.backgroundColor = '#3BA99A')}
                  onMouseOut={e => (e.currentTarget.style.backgroundColor = '#4ECDC4')}
                  onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
                  onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  保存
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
