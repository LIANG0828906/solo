import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { keyframes } from '@emotion/react'
import EmotionDetector from './EmotionDetector'
import MusicPanel from './MusicPanel'
import Favorites from './Favorites'
import {
  Song, EmotionResult, RecommendResponse,
  FavoriteItem, HistoryItem, EmotionTag
} from './types'

/* ===== 全局动画 ===== */
const gradientMove = keyframes`
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`
const bgDrift = keyframes`
  0%   { transform: translate(0,0) scale(1); }
  50%  { transform: translate(3%,-2%) scale(1.05); }
  100% { transform: translate(0,0) scale(1); }
`
const fadeInDown = keyframes`
  from { opacity: 0; transform: translateY(-14px); }
  to   { opacity: 1; transform: translateY(0); }
`
const slideIn = keyframes`
  from { opacity: 0; transform: translateX(-8px); }
  to   { opacity: 1; transform: translateX(0); }
`

/* ===== 布局样式 ===== */
const BG_PARTICLES = 28
const BG_COLORS = ['#00f0ff', '#c56cf0', '#ff4757', '#ffd93d', '#7bed9f']

const Page = styled.div`
  min-height: 100vh;
  position: relative;
  background:
    radial-gradient(circle at 15% 20%, rgba(0,240,255,0.15), transparent 40%),
    radial-gradient(circle at 85% 10%, rgba(197,108,240,0.18), transparent 45%),
    radial-gradient(circle at 70% 85%, rgba(255,71,87,0.12), transparent 45%),
    linear-gradient(135deg, #05060d 0%, #0a0b1a 50%, #05060d 100%);
  background-size: 200% 200%;
  animation: ${gradientMove} 20s ease infinite;
  overflow: hidden;
`

const Orbs = styled.div`
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  .orb {
    position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.35;
    animation: ${bgDrift} 18s ease-in-out infinite;
  }
  .orb-1 { width: 520px; height: 520px; left: -120px; top: -120px;
           background: radial-gradient(circle, #00f0ff, transparent 70%); }
  .orb-2 { width: 460px; height: 460px; right: -100px; top: 20%;
           background: radial-gradient(circle, #c56cf0, transparent 70%);
           animation-delay: -6s; }
  .orb-3 { width: 500px; height: 500px; left: 30%; bottom: -180px;
           background: radial-gradient(circle, #ff4757, transparent 70%);
           animation-delay: -12s; }
`

const BgParticles = styled.div`
  position: fixed; inset: 0; pointer-events: none; z-index: 1; overflow: hidden;
  .p {
    position: absolute; border-radius: 50%;
    background: radial-gradient(circle, #fff 0%, transparent 70%);
    opacity: 0.6;
    animation: bgFloat 14s linear infinite;
  }
  @keyframes bgFloat {
    0%   { transform: translateY(110vh) scale(0.6); opacity: 0; }
    10%  { opacity: 0.55; }
    90%  { opacity: 0.4; }
    100% { transform: translateY(-20vh) scale(1); opacity: 0; }
  }
`

const Container = styled.div`
  position: relative;
  z-index: 10;
  max-width: 1400px;
  margin: 0 auto;
  padding: 28px 32px 120px;
  @media (max-width: 900px) { padding: 20px 16px 160px; }
`

const Header = styled.header`
  text-align: center;
  margin-bottom: 32px;
  animation: ${fadeInDown} 0.7s ease both;
  h1 {
    margin: 0 0 6px;
    font-size: clamp(28px, 4.2vw, 46px);
    font-weight: 900;
    background: linear-gradient(135deg, #00f0ff 0%, #c56cf0 50%, #ff4757 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    filter: drop-shadow(0 0 22px rgba(0,240,255,0.35));
    letter-spacing: 0.02em;
  }
  p {
    margin: 0;
    font-size: clamp(13px, 1.6vw, 15px);
    color: rgba(255,255,255,0.6);
    letter-spacing: 0.06em;
  }
`

const GridMain = styled.div`
  display: grid;
  grid-template-columns: 380px 1fr 320px;
  gap: 22px;
  align-items: start;
  animation: ${slideIn} 0.6s ease 0.1s both;
  @media (max-width: 1200px) {
    grid-template-columns: 360px 1fr;
  }
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`

const Col = styled.div`
  display: flex; flex-direction: column; gap: 22px;
`

/* ===== 底部播放条 ===== */
const PlayerBar = styled.div<{ $show: boolean }>`
  position: fixed;
  left: 50%;
  bottom: ${p => p.$show ? '20px' : '-100px'};
  transform: translateX(-50%);
  width: min(720px, calc(100vw - 32px));
  z-index: 50;
  background: linear-gradient(145deg, rgba(15,20,40,0.95), rgba(8,10,24,0.98));
  backdrop-filter: blur(22px);
  border: 1px solid rgba(0,240,255,0.25);
  border-radius: 22px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow:
    0 -4px 40px rgba(0,0,0,0.45),
    0 0 0 1px rgba(0,240,255,0.12),
    0 0 50px rgba(0,240,255,0.25);
  transition: bottom 0.4s cubic-bezier(.2,.8,.2,1);
  img { width: 54px; height: 54px; border-radius: 14px; object-fit: cover; flex-shrink: 0;
        box-shadow: 0 0 0 2px rgba(0,240,255,0.35); }
  @media (max-width: 600px) {
    padding: 12px;
    gap: 10px;
    img { width: 44px; height: 44px; border-radius: 12px; }
  }
`
const NowInfo = styled.div`
  flex: 1; min-width: 0;
  .t { font-size: 14px; font-weight: 600; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .a { font-size: 12px; color: rgba(255,255,255,0.55); margin-top: 2px;
       overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
`
const PlayControls = styled.div`
  display: flex; align-items: center; gap: 6px;
  button {
    width: 36px; height: 36px; border-radius: 50%;
    background: rgba(255,255,255,0.06);
    display: flex; align-items: center; justify-content: center;
    color: #fff;
    transition: all 0.2s ease;
    svg { width: 16px; height: 16px; }
    &:hover { background: rgba(255,255,255,0.15); transform: scale(1.08); }
    &.play {
      width: 46px; height: 46px;
      background: linear-gradient(135deg, #00f0ff, #c56cf0);
      color: #05060d;
      svg { width: 20px; height: 20px; fill: currentColor; }
      box-shadow: 0 6px 20px rgba(0,240,255,0.45);
    }
  }
`
const Progress = styled.div`
  position: absolute;
  left: 0; top: -2px; height: 3px;
  background: linear-gradient(90deg, #00f0ff, #c56cf0, #ff4757);
  border-radius: 0 3px 3px 0;
  box-shadow: 0 0 10px rgba(0,240,255,0.8);
  transition: width 0.25s linear;
`
const TimeText = styled.div`
  font-family: 'Orbitron';
  font-size: 11px;
  color: rgba(255,255,255,0.55);
  letter-spacing: 0.06em;
  white-space: nowrap;
`

/* ===== 推荐缓存层（性能优化） ===== */
const recommendCache = new Map<string, Promise<RecommendResponse> | RecommendResponse>()
const favCache = { fav: new Set<string>(), dirty: true }

/* ===== 背景粒子组件 ===== */
const BackgroundParticles: React.FC = React.memo(() => {
  const arr = useMemo(() => Array.from({ length: BG_PARTICLES }).map((_, i) => ({
    left: Math.random() * 100,
    size: 1.5 + Math.random() * 3.5,
    delay: Math.random() * 14,
    duration: 10 + Math.random() * 10,
    color: BG_COLORS[i % BG_COLORS.length],
    opacity: 0.3 + Math.random() * 0.5,
    k: i
  })), [])
  return (
    <BgParticles>
      {arr.map(p => (
        <span
          key={p.k}
          className="p"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: `radial-gradient(circle, ${p.color} 0%, transparent 70%)`,
            opacity: p.opacity,
            animationDelay: `-${p.delay}s`,
            animationDuration: `${p.duration}s`
          }}
        />
      ))}
    </BgParticles>
  )
})

/* ===== 主组件 ===== */
const App: React.FC = () => {
  /* 情绪 & 推荐状态 */
  const [emotion, setEmotion] = useState<EmotionResult | null>(null)
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(false)
  const [latencyMs, setLatencyMs] = useState<number | undefined>(undefined)

  /* 收藏 & 历史 */
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [history, setHistory] = useState<HistoryItem[]>([])
  const favoriteIds = useMemo(() => new Set(favorites.map(f => f.id)), [favorites])

  /* 播放器状态 —— 音频预加载池 */
  const audioPoolRef = useRef<Map<string, HTMLAudioElement>>(new Map())
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [isPaused, setIsPaused] = useState(true)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const historyReportedRef = useRef<Set<string>>(new Set())

  /* ========= 初始化加载收藏/历史 ========= */
  useEffect(() => {
    const init = async () => {
      try {
        const [f, h] = await Promise.all([
          fetch('/api/favorites').then(r => r.json()).then(d => d.items || []),
          fetch('/api/history').then(r => r.json()).then(d => d.items || [])
        ])
        setFavorites(f)
        setHistory(h)
        favCache.fav = new Set(f.map((x: FavoriteItem) => x.id))
        favCache.dirty = false
      } catch { /* ignore */ }
    }
    init()
  }, [])

  /* ========= 推荐处理（带缓存） ========= */
  const handleRecommendResult = useCallback((data: RecommendResponse) => {
    if (!data || !data.songs) return
    setEmotion(data.emotion)
    setSongs(data.songs)
    setLatencyMs(data.latencyMs)
    // 预加载推荐歌单的音频 —— 保证切换 < 200ms
    preloadSongs(data.songs)
  }, [])

  /* 音频预加载池（核心性能优化） */
  const preloadSongs = useCallback((list: Song[]) => {
    const pool = audioPoolRef.current
    list.slice(0, 6).forEach(song => {
      if (pool.has(song.id)) return
      try {
        const a = new Audio()
        a.preload = 'auto'
        a.src = song.previewUrl
        a.volume = 0
        // 尝试触发元数据加载
        a.load()
        pool.set(song.id, a)
      } catch { /* ignore */ }
    })
  }, [])

  /* 获取/复用 Audio 实例（性能 < 200ms 关键） */
  const getAudio = useCallback((song: Song): HTMLAudioElement => {
    const pool = audioPoolRef.current
    let a = pool.get(song.id)
    if (!a) {
      a = new Audio(song.previewUrl)
      a.preload = 'auto'
      pool.set(song.id, a)
    }
    return a
  }, [])

  /* 解绑当前音频的事件，防内存泄漏 */
  const detachAudioListeners = useCallback((a: HTMLAudioElement | null) => {
    if (!a) return
    a.ontimeupdate = null
    a.ondurationchange = null
    a.onended = null
    a.onplay = null
    a.onpause = null
  }, [])

  /* ========= 播放处理（优化切换响应） ========= */
  const playSong = useCallback((song: Song) => {
    const t0 = performance.now()
    const prevAudio = currentAudioRef.current

    // 同一切歌逻辑：暂停/播放切换
    if (playingId === song.id) {
      if (prevAudio) {
        if (prevAudio.paused) {
          prevAudio.play().catch(() => {})
          setIsPaused(false)
        } else {
          prevAudio.pause()
          setIsPaused(true)
        }
      }
      return
    }

    // 停止上一首
    if (prevAudio) {
      try { prevAudio.pause() } catch {}
      detachAudioListeners(prevAudio)
    }

    // 取音频实例（从预加载池，加载过的直接用）
    const audio = getAudio(song)
    currentAudioRef.current = audio

    // 事件绑定
    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime)
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100)
    }
    audio.ondurationchange = () => {
      setDuration(audio.duration)
    }
    audio.onended = () => {
      setIsPaused(true)
      setProgress(0)
      setCurrentTime(0)
    }
    audio.onplay = () => { setIsPaused(false) }
    audio.onpause = () => { setIsPaused(true) }

    // 直接从 0 播放（如果已缓冲则即时响应）
    try {
      if (audio.currentTime > 0.01) audio.currentTime = 0
    } catch {}
    const playPromise = audio.play()
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => { /* autoplay blocked */ })
    }

    setPlayingId(song.id)
    setProgress(0)
    setCurrentTime(0)
    setDuration(audio.duration || 0)

    // 上报到历史（防抖去重：30s 内同一首不重复）
    const histKey = `${song.id}-${Math.floor(Date.now() / 30000)}`
    if (!historyReportedRef.current.has(histKey)) {
      historyReportedRef.current.add(histKey)
      const payload = { song, emotion: emotion?.primary }
      fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(r => r.json()).then(d => {
        if (d?.item) setHistory(prev => [d.item, ...prev].slice(0, 100))
      }).catch(() => {})
    }

    // 预加载当前播放列表的下一首
    const idx = songs.findIndex(s => s.id === song.id)
    if (idx >= 0 && songs[idx + 1]) getAudio(songs[idx + 1])

    // 性能埋点
    const switchTime = performance.now() - t0
    if (switchTime > 200) {
      console.warn(`[perf] 歌曲切换 ${switchTime.toFixed(0)}ms (目标 <200ms)`)
    }
  }, [emotion, playingId, songs, getAudio, detachAudioListeners])

  /* 底部控制条：上/下一首切换 */
  const togglePause = useCallback(() => {
    const a = currentAudioRef.current
    if (!a) return
    if (a.paused) { a.play().catch(() => {}); setIsPaused(false) }
    else { a.pause(); setIsPaused(true) }
  }, [])

  const nextSong = useCallback(() => {
    if (!playingId) return
    const idx = songs.findIndex(s => s.id === playingId)
    if (idx >= 0 && songs[idx + 1]) playSong(songs[idx + 1])
    else if (songs.length) playSong(songs[0])
  }, [playingId, songs, playSong])

  const prevSong = useCallback(() => {
    if (!playingId) return
    const idx = songs.findIndex(s => s.id === playingId)
    if (idx > 0) playSong(songs[idx - 1])
    else if (songs.length) playSong(songs[songs.length - 1])
  }, [playingId, songs, playSong])

  /* ========= 收藏接口（乐观更新 + 防抖） ========= */
  const favPendingRef = useRef<Map<string, number>>(new Map())

  const toggleFavorite = useCallback(async (song: Song) => {
    // 乐观更新 UI —— 即时响应
    const existed = favoriteIds.has(song.id)
    if (existed) {
      setFavorites(prev => prev.filter(f => f.id !== song.id))
    } else {
      const tempItem: FavoriteItem = { id: song.id, song, addedAt: Date.now() }
      setFavorites(prev => [tempItem, ...prev])
    }

    // 防抖：短时间多次点击合并一次请求
    const key = song.id
    const existing = favPendingRef.current.get(key)
    if (existing) window.clearTimeout(existing)

    const timer = window.setTimeout(async () => {
      favPendingRef.current.delete(key)
      try {
        if (existed) {
          await fetch(`/api/favorites/${song.id}`, { method: 'DELETE' })
        } else {
          const r = await fetch('/api/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ song })
          })
          const d = await r.json()
          // 如果服务端实际状态和乐观不一致，修正
          if (existed && !d.removed) {
            setFavorites(prev => {
              if (prev.find(f => f.id === song.id)) return prev
              return [{ id: song.id, song, addedAt: Date.now() }, ...prev]
            })
          }
        }
      } catch {
        // 失败回滚
        if (existed) {
          setFavorites(prev => {
            if (prev.find(f => f.id === song.id)) return prev
            return [{ id: song.id, song, addedAt: Date.now() }, ...prev]
          })
        } else {
          setFavorites(prev => prev.filter(f => f.id !== song.id))
        }
      }
    }, 120)
    favPendingRef.current.set(key, timer)
  }, [favoriteIds])

  const removeFavorite = useCallback((songId: string) => {
    const song = favorites.find(f => f.id === songId)?.song
    if (!song) return
    toggleFavorite(song)
  }, [favorites, toggleFavorite])

  /* ========= 渲染 ========= */
  const currentSong = useMemo(() =>
    (playingId ? (songs.find(s => s.id === playingId) || favorites.find(f => f.id === playingId)?.song || history.find(h => h.song.id === playingId)?.song) : null),
    [playingId, songs, favorites, history]
  )

  const fmt = (s: number) => {
    if (!isFinite(s)) return '0:00'
    const m = Math.floor(s / 60)
    return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`
  }

  return (
    <Page>
      <Orbs>
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </Orbs>
      <BackgroundParticles />

      <Container>
        <Header>
          <h1>🎧 EMOTION MUSIC</h1>
          <p>感知你的情绪 · 匹配专属歌单 · 沉浸式霓虹体验</p>
        </Header>

        <GridMain>
          <Col>
            <EmotionDetector
              onAnalyzing={setLoading}
              onResult={handleRecommendResult}
              currentEmotion={emotion}
            />
          </Col>

          <Col>
            <MusicPanel
              songs={songs}
              emotion={emotion}
              loading={loading}
              latencyMs={latencyMs}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleFavorite}
              onPlay={playSong}
              playingId={playingId}
              isPaused={isPaused}
            />
          </Col>

          <Col>
            <Favorites
              favorites={favorites}
              history={history}
              onPlay={playSong}
              onRemoveFavorite={removeFavorite}
              playingId={playingId}
              isPaused={isPaused}
            />
          </Col>
        </GridMain>
      </Container>

      {/* 底部播放条 */}
      <PlayerBar $show={!!currentSong}>
        {currentSong && (
          <>
            <Progress style={{ width: `${progress}%` }} />
            <img src={currentSong.cover} alt="" />
            <NowInfo>
              <div className="t">{currentSong.title}</div>
              <div className="a">{currentSong.artist} · {currentSong.album}</div>
            </NowInfo>
            <TimeText>{fmt(currentTime)}</TimeText>
            <PlayControls>
              <button onClick={prevSong} title="上一首">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
              </button>
              <button className="play" onClick={togglePause} title={isPaused ? '播放' : '暂停'}>
                {isPaused
                  ? <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  : <svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>
                }
              </button>
              <button onClick={nextSong} title="下一首">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zM6 18l8.5-6L6 6z"/></svg>
              </button>
            </PlayControls>
            <TimeText>{fmt(duration)}</TimeText>
          </>
        )}
      </PlayerBar>
    </Page>
  )
}

export default App
