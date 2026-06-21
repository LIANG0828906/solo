import React, { useEffect, useRef } from 'react'
import { useScoreStore } from './store/useScoreStore'
import { TrackList } from './components/TrackList'
import { ScoreEditor } from './components/ScoreEditor'
import { playerEngine } from './audio/PlayerEngine'

const App: React.FC = () => {
  const {
    isPlaying,
    isLooping,
    currentBeat,
    togglePlay,
    stop,
    toggleLoop,
    exportScore,
    importScore,
  } = useScoreStore()

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isPlaying) {
      playerEngine.play()
    } else {
      playerEngine.pause()
    }
    return () => {
      playerEngine.pause()
    }
  }, [isPlaying])

  useEffect(() => {
    return () => {
      playerEngine.dispose()
    }
  }, [])

  const handleExport = () => {
    const data = exportScore()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `score_${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        const success = importScore(data)
        if (!success) {
          alert('文件格式错误，请检查JSON结构')
        }
      } catch {
        alert('文件解析失败，请导入正确的JSON文件')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleStop = () => {
    stop()
    playerEngine.stop()
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const nativeEvent = e.nativeEvent
    const offsetX = nativeEvent.offsetX
    const target = e.currentTarget
    const width = target.getBoundingClientRect().width
    const progress = Math.max(0, Math.min(1, offsetX / width))
    const newBeat = Math.floor(progress * 32)
    const clampedBeat = Math.max(0, Math.min(31, newBeat))
    playerEngine.seekToBeat(clampedBeat)
  }

  const progressPercent = (currentBeat / 31) * 100

  return (
    <div className="app-container">
      <header className="top-menu">
        <div className="menu-title">🎵 虚拟乐器合奏编排</div>
        <div className="menu-buttons">
          <button className="menu-btn" onClick={handleExport}>
            📤 导出
          </button>
          <button className="menu-btn" onClick={handleImportClick}>
            📥 导入
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>
      </header>

      <main className="main-content">
        <aside className="sidebar">
          <TrackList />
        </aside>

        <section className="editor-area">
          <ScoreEditor />
        </section>
      </main>

      <footer className="control-bar">
        <div className="control-buttons">
          <button
            className={`control-btn play-btn ${isPlaying ? 'playing' : ''}`}
            onClick={togglePlay}
            title={isPlaying ? '暂停' : '播放'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button className="control-btn stop-btn" onClick={handleStop} title="停止">
            ⏹
          </button>
          <button
            className={`control-btn loop-btn ${isLooping ? 'active' : ''}`}
            onClick={toggleLoop}
            title="循环"
          >
            ↻
          </button>
        </div>

        <div className="progress-container">
          <div className="progress-bar" onClick={handleProgressClick}>
            <div
              className="progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="beat-info">
          第{currentBeat + 1}拍 / 第32拍
        </div>
      </footer>
    </div>
  )
}

export default App
