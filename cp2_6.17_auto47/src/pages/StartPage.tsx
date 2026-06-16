import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore, type SaveData } from '../store/gameStore'

export default function StartPage() {
  const navigate = useNavigate()
  const { saveSlots, loadAllSaves, loadProgress, initializeSampleStory, nodes } = useGameStore()
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null)

  useEffect(() => {
    loadAllSaves()
  }, [loadAllSaves])

  const handleNewGame = () => {
    if (nodes.length === 0) {
      initializeSampleStory()
    }
    navigate('/play/0')
  }

  const handleLoadGame = async (slotIndex: number) => {
    if (saveSlots[slotIndex]) {
      await loadProgress(slotIndex)
      navigate(`/play/${slotIndex}`)
    }
  }

  const handleEditor = () => {
    if (nodes.length === 0) {
      initializeSampleStory()
    }
    navigate('/editor')
  }

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#12121D',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '40px',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1
          style={{
            fontSize: '48px',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #6C5CE7, #A29BFE, #F39C12)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '4px',
            marginBottom: '12px',
          }}
        >
          叙事引擎
        </h1>
        <p style={{ fontSize: '16px', color: '#B2BEC3', letterSpacing: '2px' }}>
          非线性叙事冒险 · 交互式故事引擎
        </p>
      </div>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {saveSlots.map((save: SaveData | null, idx: number) => (
          <div
            key={idx}
            onClick={() => handleLoadGame(idx)}
            onMouseEnter={() => setHoveredSlot(idx)}
            onMouseLeave={() => setHoveredSlot(null)}
            style={{
              width: '160px',
              height: '100px',
              backgroundColor: '#2D2D3F',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: save ? 'pointer' : 'default',
              transition: 'transform 0.2s, box-shadow 0.2s',
              transform: hoveredSlot === idx ? 'scale(1.05)' : 'scale(1)',
              border: save ? '1px solid #6C5CE7' : '1px solid #4A4E69',
              opacity: save ? 1 : 0.5,
            }}
          >
            <span style={{ fontSize: '14px', color: '#E2E8F0', marginBottom: '4px' }}>
              存档 {idx + 1}
            </span>
            {save ? (
              <span style={{ fontSize: '11px', color: '#B2BEC3' }}>
                {formatTime(save.timestamp)}
              </span>
            ) : (
              <span style={{ fontSize: '11px', color: '#6C5CE7' }}>空</span>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        <button
          onClick={handleNewGame}
          style={{
            width: '200px',
            height: '48px',
            fontSize: '16px',
            fontWeight: 600,
            color: '#E2E8F0',
            backgroundColor: '#6C5CE7',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.2s, transform 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#A29BFE'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#6C5CE7'
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)' }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          开始冒险
        </button>
        <button
          onClick={handleEditor}
          style={{
            width: '200px',
            height: '48px',
            fontSize: '16px',
            fontWeight: 600,
            color: '#E2E8F0',
            backgroundColor: '#F39C12',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.2s, transform 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#E67E22'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#F39C12'
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)' }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          故事编辑器
        </button>
      </div>
    </div>
  )
}
