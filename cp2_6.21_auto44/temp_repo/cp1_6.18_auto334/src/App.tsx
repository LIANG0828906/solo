import { useEffect, useMemo, useRef, useState } from 'react'
import { create } from 'zustand'
import MainScene from './MainScene'
import BottleInput from './BottleInput'
import type { InputMode } from './BottleInput'
import {
  type Bottle,
  addReply,
  createBottle,
  generateSeedBottles,
  loadBottles,
  saveBottles,
} from './BottleData'

interface BottleStore {
  bottles: Bottle[]
  selectedBottleId: string | null
  isInputOpen: boolean
  inputMode: InputMode
  throwPosition: { x: number; y: number } | null
  myBottlesCount: number
  myRepliesCount: number
  flyingBottleId: string | null
  returningBottleId: string | null
  throwingBottleId: string | null
  init: () => void
  openThrowInput: (x: number, y: number) => void
  closeInput: () => void
  throwBottle: (content: string) => void
  selectBottle: (bottleId: string | null) => void
  setFlying: (bottleId: string | null) => void
  setReturning: (bottleId: string | null) => void
  submitReply: (bottleId: string, content: string) => void
  discoverRandom: () => void
  cleanupExpired: () => void
}

const useBottleStore = create<BottleStore>((set, get) => ({
  bottles: [],
  selectedBottleId: null,
  isInputOpen: false,
  inputMode: 'throw',
  throwPosition: null,
  myBottlesCount: 0,
  myRepliesCount: 0,
  flyingBottleId: null,
  returningBottleId: null,
  throwingBottleId: null,

  init: () => {
    let loaded = loadBottles()
    if (loaded.length === 0) {
      loaded = generateSeedBottles(12)
      saveBottles(loaded)
    }
    const mine = loaded.filter((b) => b.isMine).length
    const replies = loaded.reduce((sum, b) => sum + b.replies.length, 0)
    set({ bottles: loaded, myBottlesCount: mine, myRepliesCount: replies })
  },

  cleanupExpired: () => {
    const { bottles } = get()
    const now = Date.now()
    const active = bottles.filter((b) => b.expiresAt > now)
    if (active.length !== bottles.length) {
      saveBottles(active)
      const mine = active.filter((b) => b.isMine).length
      const replies = active.reduce((sum, b) => sum + b.replies.length, 0)
      set({ bottles: active, myBottlesCount: mine, myRepliesCount: replies })
    }
  },

  openThrowInput: (x, y) => set({
    isInputOpen: true,
    inputMode: 'throw',
    throwPosition: { x, y },
    selectedBottleId: null,
  }),

  closeInput: () => set({ isInputOpen: false, throwPosition: null }),

  throwBottle: (content) => {
    const { throwPosition, bottles } = get()
    if (!throwPosition) return
    const bottle = createBottle(content, throwPosition.x, throwPosition.y)
    const next = [...bottles, bottle]
    saveBottles(next)
    set({
      bottles: next,
      isInputOpen: false,
      throwPosition: null,
      throwingBottleId: bottle.id,
      myBottlesCount: get().myBottlesCount + 1,
    })
    setTimeout(() => {
      if (get().throwingBottleId === bottle.id) {
        set({ throwingBottleId: null })
      }
    }, 950)
  },

  selectBottle: (bottleId) => set({ selectedBottleId: bottleId }),

  setFlying: (bottleId) => set({ flyingBottleId: bottleId }),

  setReturning: (bottleId) => set({ returningBottleId: bottleId }),

  submitReply: (bottleId, content) => {
    const { bottles } = get()
    const idx = bottles.findIndex((b) => b.id === bottleId)
    if (idx < 0) return
    const updated = addReply(bottles[idx], content)
    const next = bottles.slice()
    next[idx] = updated
    saveBottles(next)
    const replies = next.reduce((sum, b) => sum + b.replies.length, 0)
    set({
      bottles: next,
      isInputOpen: false,
      selectedBottleId: null,
      returningBottleId: bottleId,
      myRepliesCount: replies,
    })
    setTimeout(() => {
      if (get().returningBottleId === bottleId) {
        set({ returningBottleId: null })
      }
    }, 750)
  },

  discoverRandom: () => {
    const { bottles, flyingBottleId, selectedBottleId } = get()
    if (bottles.length === 0 || flyingBottleId || selectedBottleId) return
    const candidates = bottles.filter((b) => b.id !== flyingBottleId && b.id !== selectedBottleId)
    if (candidates.length === 0) return
    const pick = candidates[Math.floor(Math.random() * candidates.length)]
    handleBottlePick(pick.id, set, get)
  },
}))

function handleBottlePick(
  bottleId: string,
  set: (p: Partial<BottleStore>) => void,
  get: () => BottleStore,
) {
  set({ flyingBottleId: bottleId })
  setTimeout(() => {
    const current = get()
    if (current.flyingBottleId === bottleId) {
      set({ selectedBottleId: bottleId, flyingBottleId: null })
    }
  }, 820)
}

function formatDate(ts: number): string {
  try {
    const d = new Date(ts)
    const now = new Date()
    const diff = now.getTime() - ts
    if (diff < 60 * 1000) return '刚刚'
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}分钟前`
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}小时前`
    const daysAgo = Math.floor(diff / (24 * 3600 * 1000))
    if (daysAgo < 7) return `${daysAgo}天前`
    return `${d.getMonth() + 1}月${d.getDate()}日`
  } catch {
    return ''
  }
}

function timeLeft(ts: number): string {
  try {
    const diff = ts - Date.now()
    if (diff <= 0) return '即将消失'
    const hours = Math.floor(diff / 3600000)
    if (hours < 24) return `${Math.max(1, hours)}小时后沉入海底`
    const days = Math.floor(hours / 24)
    return `${days}天后沉入海底`
  } catch {
    return ''
  }
}

function LogoIcon() {
  return (
    <svg className="logo-icon" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="lg-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F0F8FF" />
          <stop offset="100%" stopColor="#87CEEB" />
        </linearGradient>
      </defs>
      <path
        d="M12.5 2.5 C12.5 1.2 19.5 1.2 19.5 2.5 L19.5 8.5 L22 9.5 C25.5 10.5 27.5 15 27.5 22 L27.5 27 C27.5 29.5 24.5 30.5 16 30.5 C7.5 30.5 4.5 29.5 4.5 27 L4.5 22 C4.5 15 6.5 10.5 10 9.5 L12.5 8.5 Z"
        fill="url(#lg-g)"
        stroke="#FFD700"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <rect x="13.5" y="3" width="5" height="6" rx="1.5" fill="#7B5E28" stroke="#4D3A14" strokeWidth="0.6" />
      <rect x="11" y="14" width="10" height="11" rx="1.5" fill="#FFF3C9" transform="rotate(-8 16 19.5)" />
    </svg>
  )
}

function Icon({ name, className = 'icon' }: { name: 'bottle' | 'reply' | 'compass'; className?: string }) {
  if (name === 'bottle') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M9 2.5 C9 1.5 15 1.5 15 2.5 V6 L17 7.5 C20 9 21 12.5 21 17.5 V20.5 C21 22 19 23 12 23 C5 23 3 22 3 20.5 V17.5 C3 12.5 4 9 7 7.5 L9 6 Z"
          fill="rgba(255,255,255,0.3)" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <rect x="10" y="3" width="4" height="3.2" rx="1" fill="currentColor" opacity="0.8" />
      </svg>
    )
  }
  if (name === 'reply') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M4 5 H20 A1 1 0 0 1 21 6 V16 A1 1 0 0 1 20 17 H12 L7 21 V17 H4 A1 1 0 0 1 3 16 V6 A1 1 0 0 1 4 5 Z"
          fill="rgba(255,255,255,0.3)" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    )
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="rgba(255,255,255,0.3)" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 3 V7 M12 17 V21 M3 12 H7 M17 12 H21 M5.6 5.6 L8.4 8.4 M15.6 15.6 L18.4 18.4 M5.6 18.4 L8.4 15.6 M15.6 8.4 L18.4 5.6"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="12" cy="12" r="3.5" fill="#FFD700" opacity="0.85" />
    </svg>
  )
}

function ExpandedView({
  bottle,
  onClose,
  onReply,
}: {
  bottle: Bottle
  onClose: () => void
  onReply: () => void
}) {
  const hintRef = useRef<HTMLTextAreaElement>(null)
  const [replyText, setReplyText] = useState('')

  const submitReply = () => {
    if (!replyText.trim()) return
    const store = useBottleStore.getState()
    store.submitReply(bottle.id, replyText.trim())
  }

  return (
    <>
      <div
        className="modal-mask"
        style={{ background: 'rgba(11,61,145,0.35)' }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      />
      <div className="bottle-expanded" role="dialog" aria-modal="true">
        <div className="expanded-header">
          <div className="expanded-title">
            <span className="dot" />
            来自远方的漂流瓶
          </div>
          <button className="close-btn" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>
        <div className="expanded-scroll">
          <div className="paper-card">
            {bottle.content}
            <div className="meta-row">
              <span className={`meta-tag ${bottle.isMine ? 'mine' : ''}`}>
                {bottle.isMine ? '我的瓶子' : '陌生人'}
              </span>
              <span>{formatDate(bottle.createdAt)} · {timeLeft(bottle.expiresAt)}</span>
            </div>
          </div>

          <div className="replies-section">
            <p className="replies-title">回信 {bottle.replies.length > 0 ? `(${bottle.replies.length})` : ''}</p>
            {bottle.replies.length === 0 ? (
              <p className="empty-replies">还没有回信，来写下第一句吧～</p>
            ) : (
              bottle.replies.map((r) => (
                <div key={r.id} className="reply-item">
                  {r.content}
                  <span className="reply-time">{formatDate(r.createdAt)}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="reply-composer">
          <textarea
            ref={hintRef}
            className="reply-textarea"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value.slice(0, 300))}
            placeholder="写下回信，把温暖传递回去……"
            maxLength={300}
          />
          <div className="reply-actions">
            <span style={{ fontSize: 11, color: 'rgba(240,248,255,0.6)', alignSelf: 'center' }}>
              {replyText.length}/300
            </span>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!replyText.trim()}
              onClick={submitReply}
            >
              发送回信
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default function App() {
  const initRef = useRef(false)
  const [ready, setReady] = useState(false)

  const {
    bottles,
    selectedBottleId,
    isInputOpen,
    inputMode,
    myBottlesCount,
    myRepliesCount,
    flyingBottleId,
    returningBottleId,
    throwingBottleId,
    init,
    openThrowInput,
    closeInput,
    throwBottle,
    selectBottle,
    cleanupExpired,
    discoverRandom,
    setReturning,
  } = useBottleStore()

  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true
      init()
      cleanupExpired()
      requestAnimationFrame(() => setReady(true))
    }
  }, [init, cleanupExpired])

  useEffect(() => {
    const t = setInterval(cleanupExpired, 60 * 1000)
    return () => clearInterval(t)
  }, [cleanupExpired])

  const selectedBottle = useMemo(
    () => bottles.find((b) => b.id === selectedBottleId) ?? null,
    [bottles, selectedBottleId],
  )

  const handleSeaClick = (x: number, y: number) => {
    if (flyingBottleId || returningBottleId || selectedBottleId || throwingBottleId) return
    openThrowInput(x, y)
  }

  const handleBottleClick = (bottleId: string) => {
    if (selectedBottleId || flyingBottleId || returningBottleId || throwingBottleId) return
    useBottleStore.setState({ flyingBottleId: bottleId })
    setTimeout(() => {
      const s = useBottleStore.getState()
      if (s.flyingBottleId === bottleId) {
        useBottleStore.setState({ selectedBottleId: bottleId, flyingBottleId: null })
      }
    }, 820)
  }

  const handleCloseExpanded = () => {
    if (!selectedBottleId) return
    setReturning(selectedBottleId)
    selectBottle(null)
    setTimeout(() => {
      const s = useBottleStore.getState()
      if (s.returningBottleId === selectedBottleId) {
        useBottleStore.setState({ returningBottleId: null })
      }
    }, 750)
  }

  return (
    <div className="app-shell" style={{ opacity: ready ? 1 : 0, transition: 'opacity 0.5s ease-out' }}>
      <div className="app-inner">
        <header className="toolbar">
          <div className="toolbar-inner">
            <div className="logo">
              <LogoIcon />
              <span>灵感漂流瓶</span>
            </div>
            <div className="toolbar-actions">
              <button className="tool-btn" type="button" title="我的瓶子">
                <Icon name="bottle" />
                <span style={{ display: 'inline' }}>我的瓶子</span>
                {myBottlesCount > 0 && <span className="badge">{myBottlesCount}</span>}
              </button>
              <button className="tool-btn" type="button" title="我的回信">
                <Icon name="reply" />
                <span style={{ display: 'inline' }}>我的回信</span>
                {myRepliesCount > 0 && <span className="badge">{myRepliesCount}</span>}
              </button>
              <button className="tool-btn" type="button" title="随机捞一个" onClick={discoverRandom}>
                <Icon name="compass" />
                <span style={{ display: 'inline' }}>发现</span>
              </button>
            </div>
          </div>
        </header>

        <MainScene
          bottles={bottles}
          selectedBottleId={selectedBottleId}
          flyingBottleId={flyingBottleId}
          returningBottleId={returningBottleId}
          throwingBottleId={throwingBottleId}
          onSeaClick={handleSeaClick}
          onBottleClick={handleBottleClick}
        />

        {!selectedBottleId && !isInputOpen && bottles.length > 0 && (
          <div className="tip">点击海面投掷漂流瓶 · 点击瓶子查看内容</div>
        )}

        <BottleInput
          open={isInputOpen}
          mode={inputMode}
          onSubmit={inputMode === 'throw' ? throwBottle : () => undefined}
          onClose={closeInput}
        />

        {selectedBottle && (
          <ExpandedView
            bottle={selectedBottle}
            onClose={handleCloseExpanded}
            onReply={() => {}}
          />
        )}
      </div>
    </div>
  )
}
