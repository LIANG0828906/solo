import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Song, GradientScheme } from '../types'
import { gradientSchemes } from '../data/mockData'
import { exportAsPNG, exportAsPDF } from '../utils/posterExport'

interface PosterCanvasProps {
  songs: Song[]
  onBack: () => void
}

export default function PosterCanvas({ songs, onBack }: PosterCanvasProps) {
  const [selectedGradient, setSelectedGradient] = useState<GradientScheme>(gradientSchemes[0])
  const [lyricsStartTime, setLyricsStartTime] = useState(0)
  const [displayedWords, setDisplayedWords] = useState<{ word: string; isCurrent: boolean }[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const posterRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const wordsRef = useRef<string[]>([])
  const animStateRef = useRef({
    currentIndex: 0,
    lastTime: 0,
    nextDelay: 100,
    running: false,
  })

  const topSong = songs[0]

  const topArtistName = useMemo(() => {
    const topArtist = songs.reduce((acc, song) => {
      acc[song.artist] = (acc[song.artist] || 0) + song.playCount
      return acc
    }, {} as Record<string, number>)
    return Object.entries(topArtist).sort((a, b) => b[1] - a[1])[0]?.[0] || ''
  }, [songs])

  const totalMinutes = useMemo(() => {
    const totalDuration = songs.reduce((acc, song) => acc + song.duration, 0)
    return Math.floor(totalDuration / 60)
  }, [songs])

  const topGenres = useMemo(() => {
    const allGenres = songs.flatMap(song => song.genres)
    const genreCounts = allGenres.reduce((acc, genre) => {
      acc[genre] = (acc[genre] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    return Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
  }, [songs])

  const words = useMemo(() => {
    const lyrics = topSong?.lyrics || '音乐是灵魂的语言 每一个音符都是心跳的节奏 在旋律中寻找自己 让声音带你飞翔'
    return lyrics.split(/\s+/).filter(w => w.length > 0)
  }, [topSong])

  const runAnimation = useCallback(() => {
    const state = animStateRef.current
    if (!state.running) return

    const now = performance.now()
    
    if (now - state.lastTime >= state.nextDelay) {
      if (state.currentIndex < wordsRef.current.length) {
        setDisplayedWords(prev => {
          const newWords = [...prev]
          if (newWords.length > 0) {
            newWords[newWords.length - 1] = { 
              ...newWords[newWords.length - 1], 
              isCurrent: false 
            }
          }
          newWords.push({ 
            word: wordsRef.current[state.currentIndex], 
            isCurrent: true 
          })
          return newWords
        })
        state.currentIndex++
        state.lastTime = now
        state.nextDelay = 50 + Math.random() * 100
      } else {
        state.running = false
        setDisplayedWords(prev => {
          if (prev.length > 0) {
            const newWords = [...prev]
            newWords[newWords.length - 1] = { 
              ...newWords[newWords.length - 1], 
              isCurrent: false 
            }
            return newWords
          }
          return prev
        })
        return
      }
    }

    animationRef.current = requestAnimationFrame(runAnimation)
  }, [])

  const startLyricsAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    wordsRef.current = words
    animStateRef.current = {
      currentIndex: 0,
      lastTime: performance.now(),
      nextDelay: 50 + Math.random() * 100,
      running: true,
    }
    setDisplayedWords([])

    animationRef.current = requestAnimationFrame(runAnimation)
  }, [words, runAnimation])

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  useEffect(() => {
    startLyricsAnimation()
  }, [selectedGradient, lyricsStartTime])

  const handleExportPNG = async () => {
    if (!posterRef.current) return
    setIsExporting(true)
    try {
      await exportAsPNG(posterRef.current)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportPDF = async () => {
    if (!posterRef.current) return
    setIsExporting(true)
    try {
      await exportAsPDF(posterRef.current)
    } finally {
      setIsExporting(false)
    }
  }

  const gradientStyle = {
    background: `linear-gradient(180deg, ${selectedGradient.colors[0]}, ${selectedGradient.colors[1]})`,
  }

  const generateTagCloudStyle = (index: number, count: number) => {
    const sizes = ['12px', '14px', '16px', '18px', '22px', '26px']
    const rotations = [-8, -4, 0, 4, 8]
    return {
      fontSize: sizes[Math.min(count - 1, sizes.length - 1)],
      transform: `rotate(${rotations[index % rotations.length]}deg)`,
      opacity: 0.6 + (count / 10) * 0.4,
    }
  }

  return (
    <div className="poster-canvas-page">
      <div className="page-layout">
        <div className="controls-panel">
          <button className="back-btn" onClick={onBack}>
            ← 返回
          </button>

          <div className="control-section">
            <h3>背景渐变</h3>
            <div className="gradient-options">
              {gradientSchemes.map(scheme => (
                <button
                  key={scheme.id}
                  className={`gradient-option ${selectedGradient.id === scheme.id ? 'selected' : ''}`}
                  onClick={() => setSelectedGradient(scheme)}
                  title={scheme.name}
                >
                  <div
                    className="gradient-preview"
                    style={{
                      background: `linear-gradient(180deg, ${scheme.colors[0]}, ${scheme.colors[1]})`,
                    }}
                  />
                  <span className="gradient-name">{scheme.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="control-section">
            <h3>歌词起始位置</h3>
            <input
              type="range"
              min="0"
              max="100"
              value={lyricsStartTime}
              onChange={(e) => setLyricsStartTime(Number(e.target.value))}
              className="time-slider"
            />
            <div className="slider-labels">
              <span>开始</span>
              <span>结束</span>
            </div>
          </div>

          <div className="control-section">
            <button className="replay-btn" onClick={startLyricsAnimation}>
              🔄 重新播放动画
            </button>
          </div>

          <div className="control-section">
            <h3>导出海报</h3>
            <div className="export-buttons">
              <button
                className="export-btn png-btn"
                onClick={handleExportPNG}
                disabled={isExporting}
              >
                📥 下载 PNG
              </button>
              <button
                className="export-btn pdf-btn"
                onClick={handleExportPDF}
                disabled={isExporting}
              >
                📄 下载 PDF
              </button>
            </div>
          </div>
        </div>

        <div className="poster-preview">
          <div className="poster-wrapper">
            <div className="poster" ref={posterRef} style={gradientStyle}>
              <div className="poster-content">
                <div className="year-tag">
                  <span className="year-text">2024</span>
                  <span className="recap-text">Recap</span>
                </div>

                <div className="stats-badge">
                  <div className="stat-item">
                    <span className="stat-value">{totalMinutes}</span>
                    <span className="stat-label">分钟</span>
                  </div>
                  <div className="stat-divider" />
                  <div className="stat-item">
                    <span className="stat-value">{songs.length}</span>
                    <span className="stat-label">首歌</span>
                  </div>
                </div>

                <div className="album-art">
                  <div
                    className="album-disc"
                    style={{ background: `radial-gradient(circle, ${topSong?.color || '#fff'}44, transparent)` }}
                  >
                    <div className="album-inner">
                      <span className="album-emoji">🎵</span>
                    </div>
                  </div>
                </div>

                <div className="song-info-section">
                  <h1 className="song-title">{topSong?.name || '未知歌曲'}</h1>
                  <p className="artist-name">{topSong?.artist || '未知艺术家'}</p>
                </div>

                <div className="lyrics-section">
                  <div className="lyrics-container">
                    {displayedWords.map((item, index) => (
                      <span
                        key={index}
                        className={`lyric-word ${item.isCurrent ? 'current' : ''}`}
                      >
                        {item.word}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="genre-cloud">
                  {topGenres.map(([genre, count], index) => (
                    <span
                      key={genre}
                      className="genre-tag"
                      style={generateTagCloudStyle(index, count)}
                    >
                      {genre}
                    </span>
                  ))}
                </div>

                <div className="top-artist-badge">
                  <span className="badge-label">年度最爱歌手</span>
                  <span className="badge-artist">{topArtistName}</span>
                </div>

                <div className="poster-footer">
                  <span className="footer-text">Music Wrapped</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .poster-canvas-page {
          min-height: 100vh;
          color: #fff;
          padding: 20px;
        }

        .page-layout {
          display: flex;
          gap: 30px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .controls-panel {
          width: 280px;
          flex-shrink: 0;
        }

        .back-btn {
          width: 100%;
          padding: 12px 20px;
          margin-bottom: 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .back-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateX(-4px);
        }

        .back-btn:active {
          transform: scale(0.96);
        }

        .control-section {
          margin-bottom: 28px;
        }

        .control-section h3 {
          margin: 0 0 12px;
          font-size: 14px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
        }

        .gradient-options {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
        }

        .gradient-option {
          padding: 4px;
          border: 2px solid transparent;
          border-radius: 8px;
          background: transparent;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .gradient-option:hover {
          transform: translateY(-2px);
        }

        .gradient-option.selected {
          border-color: #fff;
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
        }

        .gradient-preview {
          width: 100%;
          aspect-ratio: 1;
          border-radius: 4px;
        }

        .gradient-name {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.6);
          white-space: nowrap;
        }

        .time-slider {
          width: 100%;
          height: 6px;
          -webkit-appearance: none;
          appearance: none;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          outline: none;
          cursor: pointer;
        }

        .time-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #6c5ce7;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 2px 10px rgba(108, 92, 231, 0.5);
        }

        .time-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 20px rgba(108, 92, 231, 0.7);
        }

        .slider-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
        }

        .replay-btn {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 10px;
          background: #6c5ce7;
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .replay-btn:hover {
          background: linear-gradient(135deg, #6c5ce7, #a29bfe);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(108, 92, 231, 0.5);
        }

        .replay-btn:active {
          transform: scale(0.95);
        }

        .export-buttons {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .export-btn {
          padding: 14px;
          border: none;
          border-radius: 10px;
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .export-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .png-btn {
          background: linear-gradient(135deg, #00b894, #00cec9);
        }

        .png-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 184, 148, 0.5);
        }

        .png-btn:active:not(:disabled) {
          transform: scale(0.95);
        }

        .pdf-btn {
          background: linear-gradient(135deg, #e17055, #fdcb6e);
        }

        .pdf-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(225, 112, 85, 0.5);
        }

        .pdf-btn:active:not(:disabled) {
          transform: scale(0.95);
        }

        .poster-preview {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }

        .poster-wrapper {
          position: sticky;
          top: 20px;
          width: 100%;
          max-width: 400px;
        }

        .poster {
          width: 100%;
          aspect-ratio: 1080 / 1920;
          border-radius: 20px;
          overflow: hidden;
          position: relative;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .poster-content {
          height: 100%;
          padding: 8% 6%;
          display: flex;
          flex-direction: column;
          position: relative;
          color: #fff;
        }

        .year-tag {
          position: absolute;
          top: 6%;
          right: 6%;
          text-align: right;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border-radius: 12px;
        }

        .year-text {
          display: block;
          font-family: 'Playfair Display', serif;
          font-size: 24px;
          font-weight: 900;
          line-height: 1;
        }

        .recap-text {
          display: block;
          font-size: 10px;
          letter-spacing: 2px;
          opacity: 0.8;
          margin-top: 2px;
        }

        .stats-badge {
          display: flex;
          align-items: center;
          gap: 12px;
          position: absolute;
          top: 6%;
          left: 6%;
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border-radius: 12px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .stat-value {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          font-weight: 700;
          line-height: 1;
        }

        .stat-label {
          font-size: 9px;
          opacity: 0.8;
          margin-top: 2px;
        }

        .stat-divider {
          width: 1px;
          height: 24px;
          background: rgba(255, 255, 255, 0.3);
        }

        .album-art {
          display: flex;
          justify-content: center;
          margin-top: 18%;
          margin-bottom: 8%;
        }

        .album-disc {
          width: 180px;
          height: 180px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .album-inner {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(5px);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid rgba(255, 255, 255, 0.3);
        }

        .album-emoji {
          font-size: 48px;
        }

        .song-info-section {
          text-align: center;
          margin-bottom: 8%;
        }

        .song-title {
          font-family: 'Playfair Display', serif;
          font-size: 36px;
          font-weight: 900;
          margin: 0 0 8px;
          line-height: 1.1;
          text-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }

        .artist-name {
          margin: 0;
          font-size: 14px;
          opacity: 0.85;
          letter-spacing: 1px;
        }

        .lyrics-section {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4%;
        }

        .lyrics-container {
          text-align: center;
          line-height: 2;
          font-size: 16px;
        }

        .lyric-word {
          display: inline-block;
          margin: 0 4px;
          opacity: 0.7;
          transition: all 0.3s ease;
        }

        .lyric-word.current {
          opacity: 1;
          transform: scale(1.05) translateY(-2px);
          font-weight: 600;
          background: linear-gradient(135deg, #fff, rgba(255, 255, 255, 0.7));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
          animation: wordFloat 0.6s ease-out;
        }

        @keyframes wordFloat {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(10px);
          }
          100% {
            opacity: 1;
            transform: scale(1.05) translateY(-2px);
          }
        }

        .genre-cloud {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px 12px;
          padding: 6% 4%;
        }

        .genre-tag {
          display: inline-block;
          color: #fff;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        }

        .top-artist-badge {
          text-align: center;
          padding: 16px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          margin-bottom: 6%;
        }

        .badge-label {
          display: block;
          font-size: 10px;
          letter-spacing: 2px;
          opacity: 0.7;
          margin-bottom: 4px;
        }

        .badge-artist {
          display: block;
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          font-weight: 700;
        }

        .poster-footer {
          text-align: center;
          padding-top: 4%;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
        }

        .footer-text {
          font-size: 10px;
          letter-spacing: 4px;
          opacity: 0.6;
          text-transform: uppercase;
        }

        @media (max-width: 1024px) {
          .page-layout {
            flex-direction: column;
          }

          .controls-panel {
            width: 100%;
            order: 2;
          }

          .gradient-options {
            grid-template-columns: repeat(5, 1fr);
          }

          .poster-preview {
            order: 1;
          }

          .poster-wrapper {
            max-width: 350px;
            position: relative;
            top: 0;
          }
        }

        @media (max-width: 768px) {
          .poster-wrapper {
            max-width: 300px;
          }

          .export-buttons {
            flex-direction: row;
          }

          .export-btn {
            flex: 1;
          }
        }
      `}</style>
    </div>
  )
}
