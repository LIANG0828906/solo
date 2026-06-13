import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import styled from '@emotion/styled'
import { keyframes, css } from '@emotion/react'
import { Song, EmotionResult } from './types'

interface Props {
  songs: Song[]
  emotion: EmotionResult | null
  loading: boolean
  latencyMs?: number
  favoriteIds: Set<string>
  onToggleFavorite: (song: Song) => void
  onPlay: (song: Song) => void
  playingId: string | null
  isPaused: boolean
}

const spin = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`
const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`
const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`
const equalizer = keyframes`
  0%, 100% { transform: scaleY(0.4); }
  50%      { transform: scaleY(1); }
`
const particleFloat = keyframes`
  0%   { transform: translateY(100%) scale(0.4); opacity: 0; }
  10%  { opacity: 1; }
  100% { transform: translateY(-120%) scale(1); opacity: 0; }
`

const Panel = styled.div`
  background: linear-gradient(145deg, rgba(15,20,40,0.85), rgba(8,10,24,0.9));
  backdrop-filter: blur(20px);
  border: 1px solid rgba(197,108,240,0.18);
  border-radius: 24px;
  padding: 28px;
  position: relative;
  overflow: hidden;
`

const Header = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 22px; flex-wrap: wrap; gap: 14px;
`
const Title = styled.h3`
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  display: flex; align-items: center; gap: 10px;
  &::before {
    content: ''; display: inline-block; width: 4px; height: 22px; border-radius: 2px;
    background: linear-gradient(180deg, #c56cf0, #ff4757);
  }
`

const EmotionBadge = styled.div<{ $color: string }>`
  display: inline-flex; align-items: center; gap: 8px;
  padding: 6px 14px;
  border-radius: 999px;
  background: ${p => `linear-gradient(135deg, ${p.$color}33, ${p.$color}11)`};
  border: 1px solid ${p => `${p.$color}88`};
  font-size: 13px;
  span.big { font-size: 20px; filter: drop-shadow(0 0 8px ${p => p.$color}); }
  span.name { color: #fff; font-weight: 600; }
  span.pct  { color: rgba(255,255,255,0.7); font-size: 12px; }
`

const Latency = styled.div`
  font-size: 11px; color: rgba(255,255,255,0.5);
  font-family: 'Orbitron';
  letter-spacing: 0.08em;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 18px;
  position: relative;
`

const Particles = styled.div`
  position: absolute; inset: 0; pointer-events: none; overflow: hidden;
  border-radius: 18px;
`
const Particle = styled.span<{ $left: number; $delay: number; $duration: number; $color: string; $size: number }>`
  position: absolute;
  left: ${p => p.$left}%;
  bottom: -10px;
  width: ${p => p.$size}px; height: ${p => p.$size}px;
  background: radial-gradient(circle, ${p => p.$color}, transparent 70%);
  border-radius: 50%;
  filter: blur(1px);
  animation: ${particleFloat} ${p => p.$duration}s ease-out ${p => p.$delay}s infinite;
`

const Card = styled.div<{ $active: boolean; $color: string }>`
  position: relative;
  background: linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01));
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 18px;
  padding: 14px;
  transition: all 0.35s cubic-bezier(.2,.8,.2,1);
  animation: ${fadeInUp} 0.5s ease both;
  overflow: hidden;
  cursor: pointer;
  &:hover {
    transform: translateY(-6px) scale(1.02);
    border-color: ${p => `${p.$color}88`};
    box-shadow:
      0 14px 40px rgba(0,0,0,0.45),
      0 0 0 1px ${p => `${p.$color}33`},
      0 0 30px ${p => `${p.$color}44`};
  }
  ${p => p.$active && css`
    border-color: ${p.$color}aa;
    box-shadow:
      0 10px 30px rgba(0,0,0,0.4),
      0 0 0 1px ${p.$color}55,
      0 0 40px ${p.$color}55,
      inset 0 0 20px ${p.$color}15;
  `}
  &:hover ${Particles} { opacity: 1; }
`

const CoverWrap = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 12px;
  background: rgba(255,255,255,0.04);
  img {
    width: 100%; height: 100%; object-fit: cover;
    transition: transform 0.5s ease;
  }
`

const PlayOverlay = styled.button<{ $playing: boolean }>`
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.6));
  opacity: 0;
  transition: opacity 0.3s ease;
  div.circle {
    width: 56px; height: 56px; border-radius: 50%;
    background: linear-gradient(135deg, #00f0ff, #c56cf0);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 8px 24px rgba(0,240,255,0.45);
    transform: scale(0.9);
    transition: transform 0.3s ease;
    svg { width: 24px; height: 24px; color: #05060d; fill: currentColor; }
  }
  ${Card}:hover & { opacity: 1; }
  ${p => p.$playing && css`
    opacity: 1;
    div.circle { transform: scale(1); }
  `}
  &:hover div.circle { transform: scale(1.08); }
`

const EqualizerBars = styled.div`
  display: flex; align-items: flex-end; gap: 3px; height: 16px;
  span {
    width: 3px; background: #05060d; border-radius: 2px;
    transform-origin: bottom;
    &:nth-child(1) { animation: ${equalizer} 0.9s -0.3s ease-in-out infinite; }
    &:nth-child(2) { animation: ${equalizer} 0.9s -0.15s ease-in-out infinite; }
    &:nth-child(3) { animation: ${equalizer} 0.9s ease-in-out infinite; }
    &:nth-child(4) { animation: ${equalizer} 0.9s -0.45s ease-in-out infinite; }
  }
`

const SongTitle = styled.div`
  font-size: 15px; font-weight: 600; color: #fff;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
`
const SongArtist = styled.div`
  font-size: 12px; color: rgba(255,255,255,0.55);
  margin-top: 2px; margin-bottom: 10px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
`

const CardRow = styled.div`
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
`

const FavBtn = styled.button<{ $fav: boolean }>`
  width: 34px; height: 34px; border-radius: 50%;
  background: ${p => p.$fav
    ? 'linear-gradient(135deg, #ff4757, #c56cf0)'
    : 'rgba(255,255,255,0.05)'};
  border: 1px solid ${p => p.$fav ? '#ff475788' : 'rgba(255,255,255,0.1)'};
  display: flex; align-items: center; justify-content: center;
  transition: all 0.25s ease;
  svg { width: 16px; height: 16px; color: ${p => p.$fav ? '#fff' : 'rgba(255,255,255,0.7)'}; fill: ${p => p.$fav ? 'currentColor' : 'none'}; }
  &:hover {
    transform: scale(1.1);
    box-shadow: ${p => p.$fav ? '0 0 16px #ff4757aa' : '0 0 14px rgba(255,255,255,0.15)'};
  }
`

const Duration = styled.span`
  font-size: 11px; color: rgba(255,255,255,0.5);
  font-family: 'Orbitron';
  letter-spacing: 0.05em;
`

const SkeletonCard = styled.div`
  border-radius: 18px; padding: 14px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  .cover {
    width: 100%; aspect-ratio: 1/1; border-radius: 14px; margin-bottom: 12px;
    background: linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.1), rgba(255,255,255,0.04));
    background-size: 200% 100%;
    animation: ${shimmer} 1.4s linear infinite;
  }
  .line { height: 12px; border-radius: 6px; margin-bottom: 8px;
    background: linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.1), rgba(255,255,255,0.04));
    background-size: 200% 100%;
    animation: ${shimmer} 1.4s linear infinite;
  }
`

const EmptyState = styled.div`
  padding: 40px 20px; text-align: center;
  color: rgba(255,255,255,0.5);
  .big { font-size: 52px; display: block; margin-bottom: 14px;
    filter: drop-shadow(0 0 12px #00f0ff66);
    animation: ${spin} 8s linear infinite;
    display: inline-block;
  }
  p { margin: 6px 0; font-size: 14px; }
  strong { color: #fff; }
`

function formatDuration(s: number) {
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, '0')}`
}

const ParticleField: React.FC<{ color: string }> = ({ color }) => {
  const particles = useMemo(() =>
    Array.from({ length: 10 }).map((_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 3 + Math.random() * 3,
      size: 2 + Math.random() * 4,
      key: i
    })), [color])
  return (
    <Particles>
      {particles.map(p => (
        <Particle key={p.key} $left={p.left} $delay={p.delay} $duration={p.duration} $color={color} $size={p.size} />
      ))}
    </Particles>
  )
}

const MusicPanel: React.FC<Props> = ({
  songs, emotion, loading, latencyMs, favoriteIds,
  onToggleFavorite, onPlay, playingId, isPaused
}) => {
  const accent = emotion?.label.color || '#00f0ff'
  const [hoverId, setHoverId] = useState<string | null>(null)

  return (
    <Panel>
      <Header>
        <Title>推荐歌单 {emotion && <EmotionBadge $color={accent}>
          <span className="big">{emotion.label.emoji}</span>
          <span className="name">{emotion.label.cn}</span>
          <span className="pct">{Math.round((emotion.confidence || 0) * 100)}%</span>
        </EmotionBadge>}</Title>
        {latencyMs !== undefined && !loading && (
          <Latency>⚡ {latencyMs}ms</Latency>
        )}
      </Header>

      {loading ? (
        <Grid>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i}>
              <div className="cover" />
              <div className="line" style={{ width: '75%' }} />
              <div className="line" style={{ width: '50%' }} />
            </SkeletonCard>
          ))}
        </Grid>
      ) : songs.length === 0 ? (
        <EmptyState>
          <span className="big">🎵</span>
          <p><strong>上传自拍照或选择表情</strong>开始情绪推荐</p>
          <p style={{ fontSize: 12 }}>AI 会根据你的情绪状态匹配最契合的音乐</p>
        </EmptyState>
      ) : (
        <Grid>
          {songs.map((song, idx) => {
            const playing = playingId === song.id && !isPaused
            const isActive = playingId === song.id
            const fav = favoriteIds.has(song.id)
            return (
              <Card
                key={song.id}
                $active={isActive}
                $color={accent}
                style={{ animationDelay: `${idx * 60}ms` }}
                onMouseEnter={() => setHoverId(song.id)}
                onMouseLeave={() => setHoverId(null)}
                onClick={() => onPlay(song)}
              >
                {(hoverId === song.id || isActive) && <ParticleField color={accent} />}
                <CoverWrap>
                  <img src={song.cover} alt={song.title} loading="lazy" />
                  <PlayOverlay
                    $playing={playing}
                    onClick={(e) => { e.stopPropagation(); onPlay(song) }}
                  >
                    <div className="circle">
                      {playing ? (
                        <EqualizerBars>
                          <span /><span /><span /><span />
                        </EqualizerBars>
                      ) : (
                        <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      )}
                    </div>
                  </PlayOverlay>
                </CoverWrap>
                <SongTitle title={song.title}>{song.title}</SongTitle>
                <SongArtist title={song.artist}>{song.artist} · {song.album}</SongArtist>
                <CardRow>
                  <Duration>{formatDuration(song.duration)}</Duration>
                  <FavBtn
                    $fav={fav}
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(song) }}
                    aria-label={fav ? '取消收藏' : '收藏'}
                  >
                    <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </FavBtn>
                </CardRow>
              </Card>
            )
          })}
        </Grid>
      )}
    </Panel>
  )
}

export default MusicPanel
