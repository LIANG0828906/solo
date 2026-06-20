import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePrintStore, getCharactersByRadical, RADICALS } from '../store/usePrintStore'

export default function 字架() {
  const {
    activeRadical,
    currentMaterial,
    selectedChar,
    setActiveRadical,
    setCurrentMaterial,
    setSelectedChar,
    setIsDragging,
    setDragPosition,
    currentStep
  } = usePrintStore()

  const characters = getCharactersByRadical(activeRadical)
  const dragRef = useRef<HTMLDivElement>(null)

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, char: string) => {
    if (currentStep !== 'select' && currentStep !== 'arrange') {
      e.preventDefault()
      return
    }
    e.dataTransfer.setData('character', char)
    e.dataTransfer.effectAllowed = 'copy'
    setSelectedChar(char)
    setIsDragging(true)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    setDragPosition(null)
  }

  const handleNativeDrag = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.clientX && e.clientY) {
      setDragPosition({ x: e.clientX, y: e.clientY })
    }
  }

  const handleCharacterClick = (char: string) => {
    if (currentStep !== 'select' && currentStep !== 'arrange') return
    setSelectedChar(selectedChar === char ? null : char)
  }

  return (
    <div className="panel-content" ref={dragRef}>
      <div className="radical-tabs">
        {RADICALS.map(radical => (
          <motion.button
            key={radical}
            className={`radical-tab ${activeRadical === radical ? 'active' : ''}`}
            onClick={() => setActiveRadical(radical)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {radical}
          </motion.button>
        ))}
      </div>

      <div className="character-grid">
        <AnimatePresence mode="popLayout">
          {characters.map((char, index) => (
            <motion.div
              key={char}
              className={`character-item ${selectedChar === char ? 'dragging' : ''}`}
              draggable={currentStep === 'select' || currentStep === 'arrange'}
              onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent<HTMLDivElement>, char)}
              onDragEnd={handleDragEnd}
              onDrag={(e) => handleNativeDrag(e as unknown as React.DragEvent<HTMLDivElement>)}
              onClick={() => handleCharacterClick(char)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: index * 0.03, type: 'spring', stiffness: 300 }}
              whileHover={{ 
                scale: 1.1, 
                rotate: -2,
                transition: { type: 'spring', stiffness: 400 }
              }}
              whileTap={{ scale: 0.95 }}
              style={{
                background: currentMaterial === 'wood' 
                  ? 'linear-gradient(135deg, #c8a45a 0%, #a8843a 50%, #88642a 100%)'
                  : 'linear-gradient(135deg, #d4b896 0%, #b49876 50%, #947856 100%)',
                boxShadow: selectedChar === char
                  ? '0 0 20px rgba(200, 164, 90, 0.8), 4px 4px 8px rgba(58,42,26,0.4)'
                  : '2px 2px 4px rgba(58,42,26,0.3), inset 1px 1px 2px rgba(255,255,255,0.3)'
              }}
            >
              <span style={{
                display: 'inline-block',
                transform: 'scaleX(-1)',
                textShadow: '1px 1px 2px rgba(255,255,255,0.3), -1px -1px 1px rgba(0,0,0,0.2)'
              }}>
                {char}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="material-switch">
        <motion.button
          className={`material-btn ${currentMaterial === 'wood' ? 'active' : ''}`}
          onClick={() => setCurrentMaterial('wood')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          🪵 木纹
        </motion.button>
        <motion.button
          className={`material-btn ${currentMaterial === 'clay' ? 'active' : ''}`}
          onClick={() => setCurrentMaterial('clay')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          🏺 泥陶
        </motion.button>
      </div>

      <div style={{ padding: '12px', fontSize: '12px', color: '#4a3a2a', textAlign: 'center' }}>
        共 {characters.length} 字 · 点击选中 · 拖拽放置
      </div>
    </div>
  )
}
