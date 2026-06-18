import React, { useRef } from 'react'
import PuzzleBoard from '../board/PuzzleBoard'
import InfoPanel from '../info/InfoPanel'
import ModelViewer, { ModelViewerRef } from '../three/ModelViewer'
import { usePuzzleState } from '../puzzle/PuzzleCore'

const App: React.FC = () => {
  const {
    state,
    movePiece,
    rotatePiece,
    placePiece,
    incrementTouch,
    resetPuzzle,
    accuracy,
    formatTime,
  } = usePuzzleState()

  const modelViewerRef = useRef<ModelViewerRef>(null)

  const handleReset = () => {
    resetPuzzle()
    if (modelViewerRef.current) {
      modelViewerRef.current.stopRotation()
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F5E6C8',
        backgroundImage: `
          radial-gradient(ellipse at 20% 30%, rgba(210, 180, 140, 0.3) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 70%, rgba(210, 180, 140, 0.2) 0%, transparent 50%),
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(139, 90, 43, 0.03) 2px,
            rgba(139, 90, 43, 0.03) 4px
          ),
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 2px,
            rgba(139, 90, 43, 0.02) 2px,
            rgba(139, 90, 43, 0.02) 4px
          )
        `,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '30px 20px',
        boxSizing: 'border-box',
        fontFamily: '"Georgia", "Times New Roman", serif',
      }}
    >
      <h1
        style={{
          color: '#5D3A1A',
          fontSize: '28px',
          marginBottom: '24px',
          fontWeight: '600',
          letterSpacing: '2px',
          textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
        }}
      >
        🏺 虚拟古董修复与拼图鉴赏
      </h1>

      <div
        style={{
          display: 'flex',
          gap: '24px',
          alignItems: 'flex-start',
        }}
      >
        <div style={{ position: 'relative' }}>
          <PuzzleBoard
            pieces={state.pieces}
            onPieceMove={movePiece}
            onPieceRotate={rotatePiece}
            onPiecePlace={placePiece}
            onTouch={incrementTouch}
            isCompleted={state.isCompleted}
          />
          <ModelViewer ref={modelViewerRef} visible={state.isCompleted} />
        </div>

        <InfoPanel
          state={state}
          accuracy={accuracy}
          formatTime={formatTime}
          onReset={handleReset}
        />
      </div>

      <div
        style={{
          marginTop: '20px',
          color: '#8B5A2B',
          fontSize: '13px',
          opacity: 0.8,
        }}
      >
        拖拽碎片移动位置 · 滚轮旋转碎片 · 靠近目标时自动吸附 · 拼合后解锁历史知识
      </div>
    </div>
  )
}

export default App
