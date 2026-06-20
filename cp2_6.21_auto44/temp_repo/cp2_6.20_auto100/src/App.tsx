import { useState, useEffect, useRef, useCallback } from 'react'
import { Song, PageView } from './types'
import DataInput from './components/DataInput'
import PosterCanvas from './components/PosterCanvas'
import { stopAllAudio } from './utils/audioEngine'

function App() {
  const [currentView, setCurrentView] = useState<PageView>('input')
  const [songs, setSongs] = useState<Song[]>([])
  const barRefs = useRef<(HTMLDivElement | null)[]>([])
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    const bars = barRefs.current
    let lastTime = 0
    const barHeights = [30, 30, 30]
    const targetHeights = [30, 30, 30]

    const animate = (timestamp: number) => {
      if (timestamp - lastTime > 100 + Math.random() * 150) {
        for (let i = 0; i < 3; i++) {
          targetHeights[i] = 20 + Math.random() * 60
        }
        lastTime = timestamp
      }

      for (let i = 0; i < 3; i++) {
        barHeights[i] += (targetHeights[i] - barHeights[i]) * 0.15
        
        const bar = bars[i]
        if (bar) {
          bar.style.height = `${barHeights[i]}%`
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  useEffect(() => {
    return () => {
      stopAllAudio()
    }
  }, [])

  const handleSongsLoaded = useCallback((loadedSongs: Song[]) => {
    setSongs(loadedSongs)
  }, [])

  const handleGoToPoster = useCallback(() => {
    if (songs.length > 0) {
      setCurrentView('poster')
    }
  }, [songs])

  const handleBackToInput = useCallback(() => {
    setCurrentView('input')
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <div className="logo-wrapper">
            <span className="logo-icon">🎵</span>
            <h1 className="app-title">Music Wrapped</h1>
          </div>
          <p className="app-subtitle">生成你的专属听歌报告海报</p>
        </div>
        <div className="header-right">
          <div className="audio-visualizer">
            <div ref={el => barRefs.current[0] = el} className="viz-bar bar-1" />
            <div ref={el => barRefs.current[1] = el} className="viz-bar bar-2" />
            <div ref={el => barRefs.current[2] = el} className="viz-bar bar-3" />
          </div>
        </div>
      </header>

      <main className="app-main">
        {currentView === 'input' && (
          <DataInput
            onSongsLoaded={handleSongsLoaded}
            onNext={handleGoToPoster}
          />
        )}
        {currentView === 'poster' && (
          <PosterCanvas
            songs={songs}
            onBack={handleBackToInput}
          />
        )}
      </main>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html, body, #root {
          height: 100%;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .app {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
          background-size: 400% 400%;
          animation: gradientShift 15s ease infinite;
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .app-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 40px;
          color: #fff;
        }

        .header-left {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .logo-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-icon {
          font-size: 28px;
          filter: drop-shadow(0 0 20px rgba(162, 155, 254, 0.6));
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 0 20px rgba(162, 155, 254, 0.6));
          }
          50% {
            transform: scale(1.1);
            filter: drop-shadow(0 0 30px rgba(162, 155, 254, 0.9));
          }
        }

        .app-title {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          font-weight: 900;
          background: linear-gradient(135deg, #fff, #a29bfe);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 0 40px rgba(162, 155, 254, 0.3);
        }

        .app-subtitle {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
          margin-left: 40px;
        }

        .header-right {
          display: flex;
          align-items: center;
        }

        .audio-visualizer {
          display: flex;
          align-items: flex-end;
          gap: 4px;
          height: 40px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .viz-bar {
          width: 4px;
          background: linear-gradient(180deg, #a29bfe, #6c5ce7);
          border-radius: 2px;
          transition: height 0.1s ease-out;
          box-shadow: 0 0 10px rgba(162, 155, 254, 0.5);
        }

        .app-main {
          min-height: calc(100vh - 100px);
        }

        @media (max-width: 1024px) {
          .app-header {
            padding: 20px 24px;
          }

          .app-title {
            font-size: 22px;
          }

          .app-subtitle {
            font-size: 12px;
            margin-left: 36px;
          }
        }

        @media (max-width: 768px) {
          .app-header {
            flex-direction: column;
            gap: 16px;
            padding: 20px;
          }

          .header-left {
            align-items: center;
          }

          .app-subtitle {
            margin-left: 0;
            text-align: center;
          }
        }
      `}</style>
    </div>
  )
}

export default App
