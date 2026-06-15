import React, { useMemo, useState } from 'react'
import styled from '@emotion/styled'
import { keyframes } from '@emotion/react'
import { Song, EmotionTag, FavoriteItem, HistoryItem } from './types'

interface Props {
  favorites: FavoriteItem[]
  history: HistoryItem[]
  onPlay: (song: Song) => void
  onRemoveFavorite: (songId: string) => void
  playingId: string | null
  isPaused: boolean
}

const fadeIn = keyframes`from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); }`

const Panel = styled.div`
  background: linear-gradient(145deg, rgba(15,20,40,0.85), rgba(8,10,24,0.9));
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,71,87,0.18);
  border-radius: 24px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  animation: ${fadeIn} 0.4s ease;
`

const Tabs = styled.div`
  display: flex; gap: 6px; margin-bottom: 20px;
  background: rgba(255,255,255,0.04);
  padding: 4px; border-radius: 14px; width: fit-content;
`

const Tab = styled.button<{ $active: boolean }>`
  padding: 10px 18px; border-radius: 10px; font-size: 13px; font-weight: 600;
  color: ${p => p.$active ? '#05060d' : 'rgba(255,255,255,0.7)'};
  background: ${p => p.$active ? 'linear-gradient(135deg, #00f0ff, #c56cf0)' : 'transparent'};
  transition: all 0.2s ease;
  &:hover { background: ${p => p.$active ? '' : 'rgba(255,255,255,0.06)'}; }
`

const List = styled.div`
  display: flex; flex-direction: column; gap: 8px;
  max-height: 520px; overflow-y: auto; padding-right: 6px;
`

const Row = styled.div<{ $playing: boolean }>`
  display: flex; align-items: center; gap: 12px; padding: 10px 12px;
  border-radius: 14px;
  background: ${p => p.$playing ? 'rgba(0,240,255,0.1)' : 'rgba(255,255,255,0.03)'};
  border: 1px solid ${p => p.$playing ? 'rgba(0,240,255,0.35)' : 'rgba(255,255,255,0.05)'};
  cursor: pointer; transition: all 0.2s ease;
  &:hover { background: rgba(0,240,255,0.08); border-color: rgba(0,240,255,0.25); transform: translateX(2px); }
  img { width: 46px; height: 46px; border-radius: 10px; object-fit: cover; flex-shrink: 0; }
`

const Info = styled.div`
  flex: 1; min-width: 0;
  .title { font-size: 13px; font-weight: 600; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .meta { font-size: 11px; color: rgba(255,255,255,0.55); margin-top: 2px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
`

const RemoveBtn = styled.button`
  width: 30px; height: 30px; border-radius: 50%;
  background: rgba(255,71,87,0.1); border: 1px solid rgba(255,71,87,0.3);
  display: flex; align-items: center; justify-content: center; color: #ff4757;
  transition: all 0.2s ease;
  svg { width: 14px; height: 14px; }
  &:hover { background: rgba(255,71,87,0.25); transform: scale(1.1); }
`

const EmojiTag = styled.span`
  display: inline-flex; padding: 2px 8px; border-radius: 999px;
  background: rgba(255,255,255,0.08); font-size: 11px;
  border: 1px solid rgba(255,255,255,0.12);
`

const Empty = styled.div`
  padding: 32px 16px; text-align: center; color: rgba(255,255,255,0.5); font-size: 13px;
  .emoji { font-size: 38px; display: block; margin-bottom: 10px; opacity: 0.8; }
`

const EMOTION_MAP: Record<EmotionTag, { cn: string; emoji: string; color: string }> = {
  happy:    { cn: '开心',  emoji: '😊', color: '#FFD93D' },
  sad:      { cn: '悲伤',  emoji: '😢', color: '#6EC1E4' },
  angry:    { cn: '愤怒',  emoji: '😠', color: '#FF4757' },
  calm:     { cn: '平静',  emoji: '😌', color: '#7BED9F' },
  excited:  { cn: '兴奋',  emoji: '🤩', color: '#FF6B9D' },
  romantic: { cn: '浪漫',  emoji: '🥰', color: '#C56CF0' },
  tired:    { cn: '疲惫',  emoji: '😴', color: '#A4B0BE' },
  anxious:  { cn: '焦虑',  emoji: '😰', color: '#FFA502' }
}

const Label: React.FC<{ tag: EmotionTag }> = ({ tag }) => {
  const m = EMOTION_MAP[tag]
  return (
    <EmojiTag style={{ borderColor: `${m.color}55`, color: '#fff' }} title={m.cn}>
      {m.emoji} {m.cn}
    </EmojiTag>
  )
}

function formatTime(ts: number) {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

type MixedItem = { id: string; song: Song; ts: number; emotion?: EmotionTag; isFav: boolean }

const Favorites: React.FC<Props> = ({ favorites, history, onPlay, onRemoveFavorite, playingId, isPaused }) => {
  const [tab, setTab] = useState<'fav' | 'hist'>('fav')

  const list: MixedItem[] = useMemo(() => {
    if (tab === 'fav') {
      return favorites.map(f => ({ id: f.id, song: f.song, ts: f.addedAt, isFav: true }))
    }
    return history.map(h => ({ id: h.id, song: h.song, ts: h.playedAt, emotion: h.emotion, isFav: false }))
  }, [tab, favorites, history])

  return (
    <Panel>
      <Tabs>
        <Tab $active={tab === 'fav'} onClick={() => setTab('fav')}>
          ❤️ 收藏夹 {favorites.length > 0 && `(${favorites.length})`}
        </Tab>
        <Tab $active={tab === 'hist'} onClick={() => setTab('hist')}>
          🎧 播放记录
        </Tab>
      </Tabs>

      {list.length === 0 ? (
        <Empty>
          {tab === 'fav' ? (
            <>
              <span className="emoji">💔</span>
              <div>还没有收藏歌曲</div>
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>点击歌曲卡片上的爱心按钮加入收藏</div>
            </>
          ) : (
            <>
              <span className="emoji">🎼</span>
              <div>还没有播放记录</div>
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>播放一首喜欢的音乐开始记录</div>
            </>
          )}
        </Empty>
      ) : (
        <List>
          {list.map((item, i) => {
            const song = item.song
            const playing = playingId === song.id && !isPaused
            return (
              <Row
                key={item.id + i}
                $playing={playing}
                onClick={() => onPlay(song)}
              >
                <img src={song.cover} alt={song.title} loading="lazy" />
                <Info>
                  <div className="title">{song.title}</div>
                  <div className="meta">
                    <span>{song.artist}</span>
                    <span>· {formatTime(item.ts)}</span>
                    {item.emotion && <Label tag={item.emotion} />}
                  </div>
                </Info>
                {item.isFav && (
                  <RemoveBtn
                    onClick={(e) => { e.stopPropagation(); onRemoveFavorite(song.id) }}
                    title="取消收藏"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </RemoveBtn>
                )}
              </Row>
            )
          })}
        </List>
      )}
    </Panel>
  )
}

export default Favorites
