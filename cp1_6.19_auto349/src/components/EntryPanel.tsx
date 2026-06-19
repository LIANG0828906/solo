import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDiaryStore, type Mood, type Song } from '../store/useDiaryStore'

const MOODS: Array<{ key: Mood; label: string; emoji: string; color: string }> = [
  { key: 'happy',     label: '高兴',  emoji: '😄', color: '#ffd93d' },
  { key: 'calm',      label: '平静',  emoji: '🧘', color: '#6bcb77' },
  { key: 'sad',       label: '忧郁',  emoji: '😢', color: '#4d96ff' },
  { key: 'nostalgic', label: '怀念',  emoji: '💭', color: '#ff6b6b' },
  { key: 'energetic', label: '活力',  emoji: '⚡', color: '#c471ed' },
]

const todayStr = () => new Date().toISOString().slice(0, 10)

interface Props {
  open: boolean
  onClose: () => void
}

export default function EntryPanel({ open, onClose }: Props) {
  const addEntry = useDiaryStore((s) => s.addEntry)
  const setSearch = useDiaryStore((s) => s.setSearchKeyword)
  const filterSongs = useDiaryStore((s) => s.filterSongs)
  const searchKeyword = useDiaryStore((s) => s.searchKeyword)

  const [date, setDate] = useState(todayStr())
  const [mood, setMood] = useState<Mood | null>(null)
  const [song, setSong] = useState<Song | null>(null)
  const [note, setNote] = useState('')
  const [showFlash, setShowFlash] = useState(false)

  useEffect(() => {
    if (open) {
      setDate(todayStr())
      setMood(null)
      setSong(null)
      setNote('')
      setSearch('')
    }
  }, [open, setSearch])

  const filteredSongs = useMemo(() => filterSongs(), [filterSongs, searchKeyword])

  const canSave = mood !== null && song !== null && note.length <= 200

  const handleSave = () => {
    if (!canSave || !mood || !song) return
    addEntry({ date, mood, song, note })
    setShowFlash(true)
    setTimeout(() => setShowFlash(false), 300)
    onClose()
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="mask"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 90,
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 100,
              background: '#1a1a2e',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: '88vh',
              overflowY: 'auto',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.4)',
            }}
          >
            <div
              style={{
                maxWidth: 768,
                margin: '0 auto',
                padding: '24px 24px 40px',
              }}
            >
              {/* 顶部拖动指示条 */}
              <div
                style={{
                  width: 40,
                  height: 4,
                  background: '#333',
                  borderRadius: 999,
                  margin: '0 auto 20px',
                }}
              />

              {/* 标题 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 20,
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 600, color: '#fff' }}>
                  记录今天的心情
                </div>
                <button
                  onClick={onClose}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#888',
                    fontSize: 24,
                    cursor: 'pointer',
                    lineHeight: 1,
                  }}
                  aria-label="关闭"
                >
                  ×
                </button>
              </div>

              {/* 日期选择器 */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: '#999', marginBottom: 8 }}>
                  日期
                </div>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: '#252536',
                    border: '1px solid #333',
                    borderRadius: 12,
                    color: '#fff',
                    fontSize: 14,
                    outline: 'none',
                    colorScheme: 'dark',
                  }}
                />
              </div>

              {/* 心情选择 */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: '#999', marginBottom: 12 }}>
                  此刻心情
                </div>
                <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
                  {MOODS.map((m) => {
                    const selected = mood === m.key
                    return (
                      <button
                        key={m.key}
                        onClick={() => setMood(m.key)}
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: '50%',
                          border: selected ? `2px solid ${m.color}` : '2px solid transparent',
                          background: selected ? `${m.color}22` : '#252536',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 24,
                          position: 'relative',
                          transition: 'all 0.2s',
                          boxShadow: selected
                            ? `0 0 16px ${m.color}66, 0 0 8px ${m.color}44`
                            : undefined,
                          animation: selected ? 'moodPulse 1.6s ease-in-out infinite' : undefined,
                        }}
                        aria-label={m.label}
                      >
                        <span
                          style={{
                            transform: selected ? 'scale(1.15)' : 'scale(1)',
                            transition: 'transform 0.2s',
                          }}
                        >
                          {m.emoji}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 14,
                    justifyContent: 'center',
                    marginTop: 8,
                  }}
                >
                  {MOODS.map((m) => (
                    <div
                      key={m.key}
                      style={{
                        width: 56,
                        textAlign: 'center',
                        fontSize: 11,
                        color: mood === m.key ? m.color : '#666',
                      }}
                    >
                      {m.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* 歌曲搜索 */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: '#999', marginBottom: 12 }}>
                  选择歌曲
                </div>
                <input
                  type="text"
                  placeholder="搜索歌曲名或歌手..."
                  value={searchKeyword}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: '#252536',
                    border: '1px solid #333',
                    borderRadius: 12,
                    color: '#fff',
                    fontSize: 14,
                    outline: 'none',
                    marginBottom: 12,
                    boxSizing: 'border-box',
                    transition: 'border-color 0.3s',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#667eea')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#333')}
                />
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 10,
                    maxHeight: 260,
                    overflowY: 'auto',
                    padding: 2,
                  }}
                >
                  {filteredSongs.map((s) => {
                    const selected = song?.id === s.id
                    return (
                      <button
                        key={s.id}
                        onClick={() => setSong(s)}
                        style={{
                          border: selected
                            ? '2px solid #667eea'
                            : '2px solid transparent',
                          borderRadius: 12,
                          padding: 8,
                          background: selected ? 'rgba(102,126,234,0.12)' : '#252536',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 6,
                          transition: 'transform 0.2s, border-color 0.2s',
                          transform: selected ? 'scale(1.05)' : 'scale(1)',
                          animation: selected ? 'songFlash 0.2s ease-out' : undefined,
                        }}
                      >
                        <img
                          src={s.coverUrl}
                          alt=""
                          style={{
                            width: 52,
                            height: 52,
                            borderRadius: 10,
                            objectFit: 'cover',
                            background: '#333',
                          }}
                        />
                        <div
                          style={{
                            fontSize: 11,
                            color: '#fff',
                            maxWidth: '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontWeight: 500,
                          }}
                        >
                          {s.title}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: '#888',
                            maxWidth: '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {s.artist}
                        </div>
                      </button>
                    )
                  })}
                  {filteredSongs.length === 0 && (
                    <div
                      style={{
                        gridColumn: '1 / -1',
                        textAlign: 'center',
                        padding: 20,
                        color: '#666',
                        fontSize: 12,
                      }}
                    >
                      没有找到匹配的歌曲
                    </div>
                  )}
                </div>
              </div>

              {/* 日记文本 */}
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <div style={{ fontSize: 13, color: '#999' }}>日记</div>
                  <div
                    style={{
                      fontSize: 11,
                      color: note.length > 200 ? '#ff6b6b' : '#666',
                    }}
                  >
                    {note.length}/200
                  </div>
                </div>
                <textarea
                  placeholder="今天发生了什么？(200字以内)"
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 200))}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: '#252536',
                    border: '1px solid #333',
                    borderRadius: 12,
                    color: '#fff',
                    fontSize: 14,
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.3s',
                    fontFamily: 'inherit',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#667eea')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#333')}
                />
              </div>

              {/* 保存按钮 */}
              <button
                onClick={handleSave}
                disabled={!canSave}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  borderRadius: 14,
                  border: 'none',
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#fff',
                  cursor: canSave ? 'pointer' : 'not-allowed',
                  background: canSave
                    ? 'linear-gradient(135deg, #667eea, #764ba2)'
                    : '#333',
                  opacity: canSave ? 1 : 0.5,
                  transition: 'all 0.2s',
                  boxShadow: canSave
                    ? '0 4px 20px rgba(102,126,234,0.4)'
                    : 'none',
                }}
              >
                保存日记
              </button>
            </div>

            {/* 关键帧动画 */}
            <style>{`
              @keyframes moodPulse {
                0%, 100% { box-shadow: 0 0 12px var(--mc, rgba(0,0,0,0)); }
                50% { box-shadow: 0 0 24px var(--mc, rgba(0,0,0,0.4)), 0 0 40px var(--mc2, rgba(0,0,0,0.2)); }
              }
              @keyframes songFlash {
                0% { border-color: #667eea; box-shadow: 0 0 0 rgba(102,126,234,0); }
                50% { border-color: #fff; box-shadow: 0 0 20px rgba(102,126,234,0.8); }
                100% { border-color: #667eea; box-shadow: 0 0 0 rgba(102,126,234,0); }
              }
            `}</style>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 保存成功闪烁反馈 */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 200,
              padding: '16px 28px',
              background: 'rgba(102,126,234,0.95)',
              borderRadius: 999,
              color: '#fff',
              fontSize: 14,
              fontWeight: 500,
              boxShadow: '0 0 40px rgba(102,126,234,0.8)',
            }}
          >
            ✨ 已记录
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
