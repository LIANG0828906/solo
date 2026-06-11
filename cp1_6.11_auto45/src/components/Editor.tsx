import { useState, useEffect, useRef } from 'react'
import { Member, Paragraph, RoomState, MIN_WORDS, MAX_WORDS } from '../types'
import { User, Clock, AlertTriangle, Pencil, Lock, ChevronRight } from 'lucide-react'

interface EditorProps {
  room: RoomState
  myMemberId: string | null
  onSubmit: (content: string) => void
}

function countChars(text: string): number {
  return text.replace(/\s/g, '').length
}

function formatTimeLeft(ms: number): string {
  if (ms <= 0) return '0:00'
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function getInitials(name: string): string {
  return name.slice(0, 2)
}

export default function Editor({ room, myMemberId, onSubmit }: EditorProps) {
  const [content, setContent] = useState('')
  const [isFlipping, setIsFlipping] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const currentWriter: Member | undefined = room.members[room.currentWriterIndex]
  const isMyTurn = myMemberId !== null && currentWriter?.id === myMemberId
  const me = room.members.find((m) => m.id === myMemberId)

  const lastParagraph: (Paragraph & { member?: Member }) | undefined =
    room.paragraphs.length > 0
      ? {
          ...room.paragraphs[room.paragraphs.length - 1],
          member: room.members.find(
            (m) => m.id === room.paragraphs[room.paragraphs.length - 1].memberId,
          ),
        }
      : undefined

  useEffect(() => {
    if (!room.turnDeadline) {
      setTimeLeft(null)
      return
    }
    const update = () => setTimeLeft(room.turnDeadline! - Date.now())
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [room.turnDeadline])

  useEffect(() => {
    if (isMyTurn && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isMyTurn])

  const charCount = countChars(content)
  const canSubmit =
    isMyTurn && charCount >= MIN_WORDS && charCount <= MAX_WORDS && !isFlipping

  const handleSubmit = () => {
    if (!canSubmit) return
    setError(null)
    setIsFlipping(true)
    setTimeout(() => {
      onSubmit(content)
      setContent('')
      setIsFlipping(false)
    }, 400)
  }

  const statusText =
    room.status === 'waiting'
      ? '等待成员加入...'
      : room.status === 'completed'
      ? '创作已完成！'
      : isMyTurn
      ? '轮到你创作啦 ✍️'
      : `正在等待 ${currentWriter?.nickname || '...'} 创作`

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 animate-fadeIn">
        <div className="flex items-center gap-2">
          <h2 className="handwrite-title text-2xl text-ink">{room.name}</h2>
          <span className="px-3 py-1 rounded-full text-sm bg-white/60 text-ink/70 border border-ink/10">
            第 {Math.min(room.currentRound, room.totalRounds)} / {room.totalRounds} 轮
          </span>
        </div>
        <div className="flex items-center gap-2">
          {timeLeft !== null && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${
                timeLeft < 60000 ? 'bg-red-100 text-red-600' : 'bg-white/60 text-ink/70'
              }`}
            >
              <Clock size={14} />
              <span>{formatTimeLeft(timeLeft)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mb-5 p-4 rounded-2xl bg-white/70 border border-ink/10 shadow-sm animate-fadeIn">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            {isMyTurn ? (
              <Pencil size={18} className="text-green-600 animate-pulseSoft" />
            ) : (
              <User size={18} className="text-ink/60" />
            )}
            <span className="text-ink/80">{statusText}</span>
          </div>
          <div className="flex -space-x-2">
            {room.members.map((m) => {
              const isWriter = m.id === currentWriter?.id
              const isMe = m.id === myMemberId
              return (
                <div
                  key={m.id}
                  className={`relative w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-all ${
                    isWriter
                      ? 'ring-2 ring-offset-2 ring-amber-400 scale-110 z-10'
                      : ''
                  }`}
                  style={{
                    backgroundColor: m.color,
                    borderColor: 'white',
                    color: '#2C2C2C',
                  }}
                  title={`${m.nickname}${isMe ? '（你）' : ''}`}
                >
                  {getInitials(m.nickname)}
                  {isWriter && (
                    <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white animate-pulseSoft" />
                  )}
                </div>
              )
            })}
            {Array.from({ length: Math.max(0, 6 - room.members.length) }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="w-9 h-9 rounded-full border-2 border-dashed border-ink/20 bg-white/30"
              />
            ))}
          </div>
        </div>
      </div>

      {lastParagraph && (
        <div className="mb-5 animate-fadeIn">
          <div className="text-sm text-ink/60 mb-2 flex items-center gap-2">
            <ChevronRight size={14} />
            <span>
              上一段 · {lastParagraph.member?.nickname || '匿名'} · 第
              {lastParagraph.round} 轮
            </span>
          </div>
          <div className="paper-texture rounded-2xl p-6 border border-ink/10">
            <p
              className="text-ink leading-relaxed whitespace-pre-wrap"
              style={{
                fontFamily: '"Ma Shan Zheng", cursive',
                fontSize: '18px',
              }}
            >
              {lastParagraph.content}
            </p>
          </div>
        </div>
      )}

      {!lastParagraph && isMyTurn && (
        <div className="mb-5 p-5 rounded-2xl bg-accent3/50 border border-ink/10 animate-fadeIn text-center">
          <p className="handwrite-title text-xl text-ink">
            🎉 你是第一个开始创作的人！写下故事的开头吧～
          </p>
        </div>
      )}

      <div className="animate-fadeIn">
        <div className="text-sm text-ink/60 mb-2 flex items-center justify-between">
          <span className="flex items-center gap-2">
            {isMyTurn ? (
              <>
                <Pencil size={14} />
                <span>轮到你写下一段</span>
              </>
            ) : (
              <>
                <Lock size={14} />
                <span>等待中，暂时无法输入</span>
              </>
            )}
          </span>
          <span
            className={`text-sm ${
              charCount < MIN_WORDS
                ? 'text-amber-600'
                : charCount > MAX_WORDS
                ? 'text-red-500'
                : 'text-green-600'
            }`}
          >
            {charCount} / {MAX_WORDS} 字（最少{MIN_WORDS}字）
          </span>
        </div>
        <div className="paper-texture rounded-2xl border border-ink/10 overflow-hidden">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value)
              setError(null)
            }}
            disabled={!isMyTurn}
            placeholder={
              isMyTurn
                ? '接着上面的故事继续写下去吧...（100-500字）'
                : '还没轮到你，请耐心等待...'
            }
            rows={10}
            className="w-full p-6 bg-transparent resize-none text-ink placeholder-ink/30 disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              fontFamily: '"Ma Shan Zheng", cursive',
              fontSize: '18px',
              lineHeight: '24px',
            }}
          />
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`submit-btn ${isFlipping ? 'flipping' : ''} relative px-8 py-3 rounded-full font-medium transition-all ${
              canSubmit
                ? 'bg-ink text-paper hover:shadow-lg hover:-translate-y-0.5 cursor-pointer'
                : 'bg-ink/20 text-ink/40 cursor-not-allowed'
            }`}
          >
            <span className="flex items-center gap-2">
              <Pencil size={16} />
              <span>提交段落</span>
            </span>
          </button>
        </div>
      </div>

      {me && (
        <div className="mt-8 pt-4 border-t border-ink/10 flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 border-white"
            style={{ backgroundColor: me.color, color: '#2C2C2C' }}
          >
            {getInitials(me.nickname)}
          </div>
          <span className="text-ink/70 text-sm">
            你是 <b>{me.nickname}</b>，故事完成后你的文字会用这个颜色标记
          </span>
        </div>
      )}
    </div>
  )
}
