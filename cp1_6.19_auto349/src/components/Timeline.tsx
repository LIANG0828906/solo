import { useEffect, useState, forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDiaryStore, type DiaryEntry, type Mood } from '../store/useDiaryStore'
import { audioPlayer } from '../utils/audioPlayer'

const MOOD_CONFIG: Record<Mood, { label: string; color: string; emoji: string }> = {
  happy:     { label: '高兴', color: '#ffd93d', emoji: '😄' },
  calm:      { label: '平静', color: '#6bcb77', emoji: '🧘' },
  sad:       { label: '忧郁', color: '#4d96ff', emoji: '😢' },
  nostalgic: { label: '怀念', color: '#ff6b6b', emoji: '💭' },
  energetic: { label: '活力', color: '#c471ed', emoji: '⚡' },
}

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: { opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.3 } },
}

function formatDisplayDate(dateStr: string) {
  const d = new Date(dateStr)
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`
}

const Card = forwardRef<HTMLDivElement, {
  entry: DiaryEntry
  isNew: boolean
  onAnimated: (id: string) => void
}>(function Card({ entry, isNew, onAnimated }, ref) {
  const [flipped, setFlipped] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isRotating, setIsRotating] = useState(false)
  const deleteEntry = useDiaryStore((s) => s.deleteEntry)
  const moodCfg = MOOD_CONFIG[entry.mood]

  useEffect(() => {
    if (isNew) {
      const t = setTimeout(() => onAnimated(entry.id), 520)
      return () => clearTimeout(t)
    }
  }, [isNew, entry.id, onAnimated])

  useEffect(() => {
    const unsub = audioPlayer.subscribe((playing, songId) => {
      setIsPlaying(playing && songId === entry.song.id)
      setIsRotating(playing && songId === entry.song.id)
    })
    return unsub
  }, [entry.song.id])

  const handleFlip = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-no-flip]')) return
    setFlipped((v) => !v)
  }

  const togglePlay = () => {
    if (isPlaying) audioPlayer.stop()
    else {
      audioPlayer.play(entry.song, 8000)
      setIsRotating(true)
    }
  }

  return (
    <motion.div
      ref={ref}
      layout
      variants={cardVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      whileHover={{ y: -4 }}
      style={{
        perspective: 1200,
        marginBottom: 24,
        willChange: 'transform, opacity',
      }}
    >
      <motion.div
        animate={
          isNew
            ? {
                scale: [1, 1.08, 1],
                boxShadow: [
                  '0 0 0 rgba(102,126,234,0)',
                  '0 0 40px rgba(102,126,234,0.6)',
                  '0 0 0 rgba(102,126,234,0)',
                ],
                transition: { duration: 0.5 },
              }
            : undefined
        }
        onClick={handleFlip}
        style={{
          position: 'relative',
          width: '100%',
          height: 200,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          cursor: 'pointer',
        }}
      >
        {/* 正面 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 20,
            padding: 24,
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.08)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            display: 'flex',
            gap: 20,
          }}
        >
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div
              style={{
                width: 76,
                height: 76,
                borderRadius: '50%',
                padding: 2,
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
              }}
            >
              <img
                src={entry.song.coverUrl}
                alt={entry.song.title}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  background: '#333',
                }}
              />
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div
                style={{
                  fontSize: 13,
                  color: '#999',
                  letterSpacing: 0.5,
                }}
              >
                {formatDisplayDate(entry.date)}
              </div>
              <button
                data-no-flip
                onClick={(e) => {
                  e.stopPropagation()
                  deleteEntry(entry.id)
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: 18,
                  padding: 4,
                  opacity: 0,
                  transition: 'opacity 0.2s',
                }}
                className="delete-btn"
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
                aria-label="删除"
              >
                ×
              </button>
            </div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 600,
                color: '#fff',
                marginBottom: 8,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {entry.song.title}
              <span style={{ color: '#888', fontSize: 13, marginLeft: 8, fontWeight: 400 }}>
                · {entry.song.artist}
              </span>
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                alignSelf: 'flex-start',
                padding: '4px 12px',
                borderRadius: 999,
                background: `${moodCfg.color}22`,
                color: moodCfg.color,
                fontSize: 12,
                marginBottom: 12,
                border: `1px solid ${moodCfg.color}44`,
              }}
            >
              <span style={{ marginRight: 6 }}>{moodCfg.emoji}</span>
              {moodCfg.label}
            </div>
            <div
              style={{
                fontSize: 14,
                color: '#ccc',
                lineHeight: 1.6,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {entry.note || '（未写日记）'}
            </div>
          </div>
        </div>

        {/* 背面 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 20,
            padding: 28,
            background: 'linear-gradient(135deg, rgba(102,126,234,0.1), rgba(118,75,162,0.1))',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(102,126,234,0.2)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              padding: 2,
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              animation: isRotating ? 'spin 4s linear infinite' : undefined,
              flexShrink: 0,
            }}
          >
            <img
              src={entry.song.coverUrl}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
          </div>
          <div
            style={{
              textAlign: 'center',
              color: '#ddd',
              fontSize: 14,
              lineHeight: 1.8,
              whiteSpace: 'pre-line',
              fontStyle: 'italic',
            }}
          >
            "{entry.song.lyricSnippet}"
          </div>
          <button
            data-no-flip
            onClick={(e) => {
              e.stopPropagation()
              togglePlay()
            }}
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              border: 'none',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: '#fff',
              fontSize: 20,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isPlaying
                ? '0 0 24px rgba(102,126,234,0.6)'
                : '0 4px 16px rgba(102,126,234,0.4)',
              transition: 'box-shadow 0.2s',
              flexShrink: 0,
            }}
            aria-label={isPlaying ? '暂停' : '播放'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
})

export default function Timeline() {
  const entries = useDiaryStore((s) => s.entries)
  const latestEntryId = useDiaryStore((s) => s.latestEntryId)
  const clearLatest = useDiaryStore((s) => s.clearLatestEntryId)

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      .delete-btn { opacity: 0; }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      style={{ width: '100%', position: 'relative' }}
    >
      <AnimatePresence initial={false} mode="popLayout">
        {entries.map((entry) => (
          <Card
            key={entry.id}
            entry={entry}
            isNew={entry.id === latestEntryId}
            onAnimated={clearLatest}
          />
        ))}
      </AnimatePresence>
      {entries.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            textAlign: 'center',
            padding: 80,
            color: '#666',
            fontSize: 14,
          }}
        >
          还没有日记，点击右下角 + 开始记录吧 ✨
        </motion.div>
      )}
    </motion.div>
  )
}
