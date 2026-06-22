import { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import { usePrintStore, ProcessStep } from './store/usePrintStore'
import 字架 from './components/字架'
import 排盘板 from './components/排盘板'
import 工具面板 from './components/工具面板'

const STEPS: { key: ProcessStep; label: string; num: number }[] = [
  { key: 'select', label: '选字', num: 1 },
  { key: 'arrange', label: '排盘', num: 2 },
  { key: 'ink', label: '刷墨', num: 3 },
  { key: 'press', label: '拓印', num: 4 },
  { key: 'reveal', label: '揭纸', num: 5 }
]

export default function App() {
  const {
    currentStep,
    arrangedChars,
    inkConcentration,
    pressProgress,
    isPrinted,
    soundEffect,
    selectedChar,
    setCurrentStep,
    goToNextStep,
    clearAllCharacters,
    addCharacter,
    findNearestEmptySlot,
    isPositionOccupied,
    setIsDragging,
    setDragPosition
  } = usePrintStore()

  const [showInstructions, setShowInstructions] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setShowInstructions(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const char = e.dataTransfer.getData('character') || selectedChar
    
    if (!char) return
    if (currentStep !== 'select' && currentStep !== 'arrange') return

    const centerPanel = document.querySelector('.center-panel')
    if (!centerPanel) return

    const rect = centerPanel.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const relX = (x / rect.width) * 2 - 1
    const relY = -(y / rect.height) * 2 + 1
    
    const col = Math.round((relX + 1) * 3.5)
    const row = Math.round((relY + 1) * 3.5)
    
    let targetRow = Math.max(0, Math.min(7, row))
    let targetCol = Math.max(0, Math.min(7, col))
    
    if (isPositionOccupied(targetRow, targetCol)) {
      const nearest = findNearestEmptySlot(targetRow, targetCol)
      if (nearest) {
        targetRow = nearest.row
        targetCol = nearest.col
      } else {
        return
      }
    }
    
    addCharacter(char, { row: targetRow, col: targetCol })
    setIsDragging(false)
    setDragPosition(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  const getStepHint = () => {
    switch (currentStep) {
      case 'select': return '从左侧字架选择活字，拖拽到中央排盘板'
      case 'arrange': return '调整活字排列，完成后点击"完成排盘"'
      case 'ink': return '拖动刷子在活字表面来回刷动上墨'
      case 'press': return '点击并按住拓包，均匀按压纸张'
      case 'reveal': return '点击"揭纸"查看印刷成品'
      default: return ''
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 'select': return arrangedChars.length > 0
      case 'arrange': return arrangedChars.length > 0
      case 'ink': return inkConcentration >= 80
      case 'press': return pressProgress >= 100
      case 'reveal': return isPrinted
      default: return false
    }
  }

  return (
    <div className="app-container" onDrop={handleDrop} onDragOver={handleDragOver}>
      <AnimatePresence>
        {soundEffect && (
          <motion.div
            className="sound-effect wood-block-sound"
            initial={{ scale: 0.8, opacity: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showInstructions && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            style={{
              position: 'fixed',
              top: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
              background: '#f5e6c8',
              border: '2px solid #3a2a1a',
              padding: '16px 32px',
              borderRadius: '4px',
              boxShadow: '4px 4px 12px rgba(58,42,26,0.3)'
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, textAlign: 'center' }}>
              欢迎来到宋代活字印刷工坊
            </div>
            <div style={{ fontSize: 14, color: '#4a3a2a' }}>
              体验毕昇活字印刷术，选字 → 排盘 → 刷墨 → 拓印 → 揭纸
            </div>
            <button
              onClick={() => setShowInstructions(false)}
              style={{
                position: 'absolute',
                top: 4,
                right: 8,
                background: 'none',
                border: 'none',
                fontSize: 18,
                cursor: 'pointer',
                color: '#3a2a1a'
              }}
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="left-panel">
        <div className="panel-title">字 架</div>
        <字架 />
      </div>

      <div className="center-panel">
        <div className="canvas-container">
          <Canvas
            camera={{ position: [0, 8, 12], fov: 50 }}
            shadows
            gl={{ antialias: true, alpha: false }}
            style={{ background: 'linear-gradient(180deg, #d4e4d4 0%, #c4d4c4 100%)' }}
          >
            <ambientLight intensity={0.6} />
            <directionalLight
              position={[5, 10, 5]}
              intensity={1}
              castShadow
              shadow-mapSize={[2048, 2048]}
            />
            <directionalLight position={[-5, 5, -5]} intensity={0.4} />
            
            <排盘板 />
            
            <OrbitControls
              enablePan={false}
              minDistance={6}
              maxDistance={20}
              minPolarAngle={Math.PI / 6}
              maxPolarAngle={Math.PI / 2.2}
            />
          </Canvas>
        </div>
      </div>

      <div className="right-panel">
        <div className="panel-title">印刷流程</div>
        
        <div className="process-steps">
          {STEPS.map(step => (
            <motion.div
              key={step.key}
              className={`step-item ${currentStep === step.key ? 'active' : ''} ${
                STEPS.indexOf(step) < STEPS.findIndex(s => s.key === currentStep) ? 'completed' : ''
              }`}
              animate={currentStep === step.key ? { x: 4 } : { x: 0 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="step-number">{step.num}</div>
              <div className="step-text">{step.label}</div>
              {STEPS.indexOf(step) < STEPS.findIndex(s => s.key === currentStep) && (
                <span style={{ fontSize: 16 }}>✓</span>
              )}
            </motion.div>
          ))}
        </div>

        <div className="preview-area">
          <div className="preview-card">
            <div className="preview-title">排盘预览</div>
            <div className="preview-grid">
              {Array.from({ length: 64 }).map((_, i) => {
                const row = Math.floor(i / 8)
                const col = i % 8
                const char = arrangedChars.find(
                  c => c.position?.row === row && c.position?.col === col
                )
                return (
                  <div
                    key={i}
                    className={`preview-cell ${char ? 'filled' : ''}`}
                    style={{
                      backgroundColor: char 
                        ? `rgba(74, 58, 42, ${char.inkLevel / 200 + 0.4})`
                        : undefined,
                      color: char && char.inkLevel > 30 ? '#f5e6c8' : undefined
                    }}
                  >
                    {char?.char || ''}
                  </div>
                )
              })}
            </div>
          </div>

          {currentStep === 'ink' && (
            <div className="preview-card">
              <div className="preview-title">墨迹浓度</div>
              <div className="progress-bar">
                <motion.div
                  className="progress-fill"
                  style={{ width: `${inkConcentration}%` }}
                  animate={{ width: `${inkConcentration}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div style={{ textAlign: 'center', fontSize: 12, marginTop: 4 }}>
                {inkConcentration.toFixed(0)}% / 80%
              </div>
            </div>
          )}

          {currentStep === 'press' && (
            <div className="preview-card">
              <div className="preview-title">拓印进度</div>
              <div className="progress-bar">
                <motion.div
                  className="progress-fill"
                  style={{ width: `${pressProgress}%` }}
                  animate={{ width: `${pressProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div style={{ textAlign: 'center', fontSize: 12, marginTop: 4 }}>
                {pressProgress.toFixed(0)}% / 100%
              </div>
            </div>
          )}

          <div className="preview-card">
            <div className="preview-title">
              {isPrinted ? '印刷成品' : '纸张预览'}
            </div>
            <div className="final-paper">
              <div className="paper-content">
                {Array.from({ length: 64 }).map((_, i) => {
                  const row = Math.floor(i / 8)
                  const col = i % 8
                  const char = arrangedChars.find(
                    c => c.position?.row === row && c.position?.col === col
                  )
                  return (
                    <div
                      key={i}
                      className={`paper-char ${isPrinted && char ? 'printed' : ''}`}
                      style={{
                        opacity: isPrinted ? (char?.inkLevel ?? 0) / 100 : 0.1
                      }}
                    >
                      {char?.char || ''}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <工具面板 />

        <div className="hint-text">
          {getStepHint()}
        </div>

        <div style={{ padding: 12, display: 'flex', gap: 8, borderTop: '1px dashed #3a2a1a' }}>
          <motion.button
            className="tool-button"
            style={{ flex: 1 }}
            onClick={goToNextStep}
            disabled={!canProceed()}
            whileHover={{ scale: canProceed() ? 1.02 : 1 }}
            whileTap={{ scale: canProceed() ? 0.98 : 1 }}
          >
            {currentStep === 'reveal' ? '完成' : '下一步'}
          </motion.button>
          <motion.button
            className="tool-button"
            style={{ flex: 1 }}
            onClick={() => {
              clearAllCharacters()
              setCurrentStep('select')
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            重新开始
          </motion.button>
        </div>
      </div>
    </div>
  )
}
