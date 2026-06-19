import { useEffect, useRef } from 'react'
import { useStore } from './store'
import Card from './Card'

export default function Timeline() {
  const speeches = useStore(state => state.speeches)
  const isPlaying = useStore(state => state.isPlaying)
  const playbackSpeed = useStore(state => state.playbackSpeed)
  const currentPlayIndex = useStore(state => state.currentPlayIndex)
  const setCurrentPlayIndex = useStore(state => state.setCurrentPlayIndex)
  const togglePlay = useStore(state => state.togglePlay)
  const setHighlightedId = useStore(state => state.setHighlightedId)

  const containerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isPlaying || speeches.length === 0) {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      return
    }

    let idx = currentPlayIndex < 0 ? 0 : currentPlayIndex
    if (idx >= speeches.length) {
      idx = 0
    }

    const advance = () => {
      const speech = speeches[idx]
      if (!speech) {
        togglePlay()
        setCurrentPlayIndex(-1)
        setHighlightedId(null)
        return
      }

      setCurrentPlayIndex(idx)
      setHighlightedId(speech.id)

      const cardEl = cardRefs.current.get(speech.id)
      if (cardEl && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect()
        const cardRect = cardEl.getBoundingClientRect()
        const offset = cardRect.top - containerRect.top - containerRect.height / 2 + cardRect.height / 2
        containerRef.current.scrollTo({
          top: containerRef.current.scrollTop + offset,
          behavior: 'smooth',
        })
      }

      const SCROLL_DURATION = 5000
      const HOLD_DURATION = 2000
      const totalDuration = (SCROLL_DURATION + HOLD_DURATION) / playbackSpeed

      timerRef.current = window.setTimeout(() => {
        idx++
        if (idx >= speeches.length) {
          togglePlay()
          setCurrentPlayIndex(-1)
          setHighlightedId(null)
          return
        }
        advance()
      }, totalDuration)
    }

    advance()

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [isPlaying, playbackSpeed, speeches.length])

  useEffect(() => {
    if (!isPlaying) {
      setHighlightedId(null)
    }
  }, [isPlaying, setHighlightedId])

  const setCardRef = (id: string) => (el: HTMLDivElement | null) => {
    if (el) {
      cardRefs.current.set(id, el)
    } else {
      cardRefs.current.delete(id)
    }
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        height: '100%',
        overflowY: 'auto',
        paddingTop: 40,
        paddingBottom: 120,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 15,
          top: 0,
          bottom: 0,
          width: 2,
          background: 'linear-gradient(to bottom, #FF6B6B, #4ECDC4)',
          zIndex: 1,
        }}
      />

      {speeches.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            paddingLeft: 40,
            paddingTop: 100,
            color: '#AAA',
          }}
        >
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          <p style={{ marginTop: 16, fontSize: 14 }}>还没有发言记录</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>在顶部表单中添加第一条发言吧～</p>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          {speeches.map((speech, index) => (
            <div key={speech.id} ref={setCardRef(speech.id)}>
              <Card id={speech.id} index={index} total={speeches.length} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
