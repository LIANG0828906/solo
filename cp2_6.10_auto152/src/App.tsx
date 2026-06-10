import React, { useCallback, useEffect, useRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SandTable from './components/SandTable'
import ControlPanel from './components/ControlPanel'
import { useGameStore, DefenseType, Position, MAP_WIDTH, MAP_HEIGHT } from './store/gameStore'
import { getWave, getRandomEdgeSpawn, WaveEnemy } from './data/levels'

const App: React.FC = memo(() => {
  const {
    phase,
    currentWave,
    totalWaves,
    selectedDefense,
    placeDefense,
    updateEnemies,
    updateDefenseAttacks,
    spawnEnemy,
    fortressHealth
  } = useGameStore()

  const lastTimeRef = useRef<number>(performance.now())
  const animationFrameRef = useRef<number>()
  const spawnedEnemiesRef = useRef<Set<string>>(new Set())
  const waveStartTimeRef = useRef<number>(0)

  const handlePlaceDefense = useCallback((type: DefenseType, position: Position): boolean => {
    if (phase !== 'preparing') return false
    return placeDefense(type, position)
  }, [phase, placeDefense])

  const handleMapClick = useCallback((e: React.MouseEvent) => {
    if (phase !== 'preparing' || !selectedDefense) return
    
    const target = e.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * MAP_WIDTH
    const y = ((e.clientY - rect.top) / rect.height) * MAP_HEIGHT
    
    handlePlaceDefense(selectedDefense, { x, y })
  }, [phase, selectedDefense, handlePlaceDefense])

  useEffect(() => {
    if (phase !== 'fighting') return

    const wave = getWave(1, currentWave - 1)
    if (!wave) return

    waveStartTimeRef.current = performance.now()
    spawnedEnemiesRef.current.clear()

    const spawnTimers: number[] = wave.enemies.map((enemyConfig: WaveEnemy, index: number) => {
      return setTimeout(() => {
        const enemyKey = `${currentWave}-${index}`
        if (!spawnedEnemiesRef.current.has(enemyKey)) {
          spawnedEnemiesRef.current.add(enemyKey)
          const spawnPos = getRandomEdgeSpawn(enemyConfig.spawnEdge)
          spawnEnemy(enemyConfig.type, spawnPos)
        }
      }, enemyConfig.delay)
    })

    return () => {
      spawnTimers.forEach(timer => clearTimeout(timer))
    }
  }, [phase, currentWave, spawnEnemy])

  useEffect(() => {
    if (phase !== 'fighting') {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      return
    }

    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastTimeRef.current
      lastTimeRef.current = currentTime

      updateEnemies(deltaTime)
      updateDefenseAttacks(currentTime)

      animationFrameRef.current = requestAnimationFrame(gameLoop)
    }

    lastTimeRef.current = performance.now()
    animationFrameRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [phase, updateEnemies, updateDefenseAttacks])

  useEffect(() => {
    if (phase === 'fighting') {
      const wave = getWave(1, currentWave - 1)
      if (wave) {
        const totalDelay = wave.enemies.reduce((max, e) => Math.max(max, e.delay), 0)
        
        const checkTimer = setTimeout(() => {
          const checkInterval = setInterval(() => {
            const state = useGameStore.getState()
            if (state.phase === 'fighting' && state.enemies.length === 0) {
              clearInterval(checkInterval)
              if (currentWave >= totalWaves) {
                useGameStore.setState({ phase: 'victory' })
              }
            }
          }, 500)
          
          return () => clearInterval(checkInterval)
        }, totalDelay + 1000)

        return () => clearTimeout(checkTimer)
      }
    }
  }, [phase, currentWave, totalWaves])

  const renderGameOverlay = () => {
    if (phase === 'victory') {
      return (
        <motion.div
          className="game-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.h1
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            胜利！
          </motion.h1>
          <motion.p
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            烽燧屹立不倒，西域边疆得以安宁
          </motion.p>
          <motion.p
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            最终耐久度: {fortressHealth}%
          </motion.p>
          <motion.button
            className="action-btn"
            style={{ width: '200px', marginTop: '20px' }}
            onClick={() => useGameStore.getState().resetGame()}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6, type: 'spring' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            再战一局
          </motion.button>
        </motion.div>
      )
    }

    if (phase === 'defeat') {
      return (
        <motion.div
          className="game-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.h1
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{ color: '#c45c4e' }}
          >
            战败...
          </motion.h1>
          <motion.p
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            烽燧被攻破，西域门户大开
          </motion.p>
          <motion.p
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            坚持到第 {currentWave} 波
          </motion.p>
          <motion.button
            className="action-btn danger"
            style={{ width: '200px', marginTop: '20px' }}
            onClick={() => useGameStore.getState().resetGame()}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6, type: 'spring' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            重整旗鼓
          </motion.button>
        </motion.div>
      )
    }

    return null
  }

  return (
    <div className="app-container">
      <h1 className="game-title">烽燧戍卒</h1>
      
      <div 
        style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}
        onClick={handleMapClick}
      >
        <SandTable onPlaceDefense={handlePlaceDefense} />
        <AnimatePresence>
          {renderGameOverlay()}
        </AnimatePresence>
      </div>
      
      <ControlPanel />
    </div>
  )
})

App.displayName = 'App'

export default App
