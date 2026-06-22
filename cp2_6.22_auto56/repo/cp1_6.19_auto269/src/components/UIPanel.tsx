import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/useGameStore'
import { getUnitsByFaction } from '@/engine/Unit'
import { getEventName } from '@/events/EventSystem'

const factionColors = {
  light: '#4FC3F7',
  dark: '#AB47BC',
}

const factionNames = {
  light: '光明方',
  dark: '暗影方',
}

export function UIPanel() {
  const {
    currentTurn,
    currentPlayer,
    mana,
    maxMana,
    units,
    gameStatus,
    winner,
    gameStartTime,
    activeEvent,
    selectedUnitId,
    endTurn,
    startNewGame,
  } = useGameStore()

  const [gameTime, setGameTime] = useState(0)
  const [showSkillPanel, setShowSkillPanel] = useState(false)

  useEffect(() => {
    if (gameStatus !== 'playing') return

    const timer = setInterval(() => {
      setGameTime(Math.floor((Date.now() - gameStartTime) / 1000))
    }, 1000)

    return () => clearInterval(timer)
  }, [gameStatus, gameStartTime])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const lightUnits = getUnitsByFaction(units, 'light')
  const darkUnits = getUnitsByFaction(units, 'dark')
  const selectedUnit = units.find(u => u.id === selectedUnitId)

  const ManaBar = ({ faction }: { faction: 'light' | 'dark' }) => {
    const currentMana = mana[faction]
    const max = maxMana[faction]
    const percent = (currentMana / max) * 100
    const color = factionColors[faction]

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ color, fontFamily: "'Cinzel Display', serif", fontSize: '0.875rem', fontWeight: 500 }}>
          {factionNames[faction]}
        </span>
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '0.25rem', width: 400, height: 16 }}>
          <motion.div
            style={{
              height: '100%',
              background: `linear-gradient(to right, ${color}CC 0%, ${color}00 100%)`,
            }}
            initial={false}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.5 }}
          />
          <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>
            {currentMana} / {max}
          </div>
          <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, border: '1px solid rgba(201,169,110,0.5)', borderRadius: '0.25rem' }} />
        </div>
      </div>
    )
  }

  const UnitCounter = ({ faction }: { faction: 'light' | 'dark' }) => {
    const count = getUnitsByFaction(units, faction).length
    const color = factionColors[faction]
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ width: '1rem', height: '1rem', borderRadius: '9999px', backgroundColor: color, boxShadow: `0 0 10px ${color}` }} />
        <span style={{ color: 'white', fontWeight: 500 }}>{count} 棋子</span>
      </div>
    )
  }

  return (
    <>
      <div style={{ width: '100%', maxWidth: '56rem', marginLeft: 'auto', marginRight: 'auto', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <ManaBar faction="light" />
          <div style={{ textAlign: 'center', paddingLeft: '1.5rem', paddingRight: '1.5rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', border: '2px solid #C9A96E', borderRadius: '0.5rem', backgroundColor: 'rgba(0,0,0,0.3)' }}>
            <div style={{ color: '#C9A96E', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>回合</div>
            <div style={{ color: 'white', fontSize: '1.5rem', fontWeight: 700, fontFamily: "'Cinzel Display', serif" }}>
              {currentTurn}
            </div>
          </div>
          <ManaBar faction="dark" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <UnitCounter faction="light" />

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
              游戏时间: <span style={{ color: 'white', fontFamily: 'monospace' }}>{formatTime(gameTime)}</span>
            </div>
            <motion.div
              style={{
                paddingLeft: '1rem',
                paddingRight: '1rem',
                paddingTop: '0.5rem',
                paddingBottom: '0.5rem',
                borderRadius: '0.5rem',
                fontWeight: 700,
                backgroundColor: `${factionColors[currentPlayer]}20`,
                border: `2px solid ${factionColors[currentPlayer]}`,
                color: factionColors[currentPlayer],
              }}
              animate={{ boxShadow: [`0 0 10px ${factionColors[currentPlayer]}40`, `0 0 25px ${factionColors[currentPlayer]}60`, `0 0 10px ${factionColors[currentPlayer]}40`] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {factionNames[currentPlayer]}回合
            </motion.div>
            <button
              onClick={endTurn}
              disabled={gameStatus !== 'playing'}
              className="px-6 py-2 bg-transparent border-2 border-[#C9A96E] text-[#C9A96E] font-bold rounded-lg hover:bg-[#C9A96E] hover:text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: "'Cinzel Display', serif" }}
            >
              结束回合
            </button>
          </div>

          <UnitCounter faction="dark" />
        </div>

        {activeEvent && (
          <motion.div
            style={{
              marginTop: '1rem',
              textAlign: 'center',
              paddingTop: '0.5rem',
              paddingBottom: '0.5rem',
              paddingLeft: '1rem',
              paddingRight: '1rem',
              borderRadius: '0.5rem',
              display: 'inline-block',
              backgroundColor: 'rgba(0,0,0,0.6)',
              border: '1px solid #C9A96E',
            }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <span style={{ color: '#C9A96E', fontSize: '0.875rem' }}>⚡ 事件触发: </span>
            <span style={{ color: 'white', fontWeight: 700 }}>{getEventName(activeEvent.type!)}</span>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', marginLeft: '0.5rem' }}>({activeEvent.duration}回合)</span>
          </motion.div>
        )}
      </div>

      {selectedUnit && selectedUnit.faction === currentPlayer && (
        <motion.div
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0,0,0,0.9)',
            border: '2px solid #C9A96E',
            borderRadius: '0.75rem',
            padding: '1rem',
            minWidth: '400px',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: factionColors[selectedUnit.faction], fontFamily: "'Cinzel Display', serif" }}>
              {selectedUnit.name}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
              HP: {selectedUnit.hp}/{selectedUnit.maxHp} | MP: {selectedUnit.mp}/{selectedUnit.maxMp}
            </div>
          </div>

          {!selectedUnit.hasAttacked && (
            <div style={{ gap: '0.5rem' }}>
              <div style={{ color: '#C9A96E', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>技能</div>
              {selectedUnit.skills.map(skill => (
                <button
                  key={skill.id}
                  onClick={() => setShowSkillPanel(!showSkillPanel)}
                  disabled={mana[currentPlayer] < skill.mpCost}
                  className="w-full text-left px-4 py-2 bg-transparent border border-[#C9A96E]/50 rounded-lg hover:border-[#C9A96E] hover:bg-[#C9A96E]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ marginBottom: '0.5rem' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: 'white', fontWeight: 500 }}>{skill.name}</span>
                    <span style={{ color: '#60A5FA', fontSize: '0.875rem' }}>MP: {skill.mpCost}</span>
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{skill.description}</div>
                </button>
              ))}
            </div>
          )}

          {(selectedUnit.hasMoved || selectedUnit.hasAttacked) && (
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', textAlign: 'center', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>
              {selectedUnit.hasMoved && '已移动 '}
              {selectedUnit.hasAttacked && '已行动'}
            </div>
          )}
        </motion.div>
      )}

      <AnimatePresence>
        {gameStatus === 'ended' && winner && (
          <motion.div
            style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: '#0D0D0D', opacity: 0.85 }} />

            <motion.div
              style={{
                position: 'relative',
                padding: '2rem',
                borderRadius: '0.5rem',
                backgroundColor: '#0D0D0D',
                border: '2px solid #C9A96E',
                minWidth: 500,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, width: '0.5rem', height: '0.5rem', borderTop: '2px solid #C9A96E', borderLeft: '2px solid #C9A96E' }} />
              <div style={{ position: 'absolute', top: 0, right: 0, width: '0.5rem', height: '0.5rem', borderTop: '2px solid #C9A96E', borderRight: '2px solid #C9A96E' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '0.5rem', height: '0.5rem', borderBottom: '2px solid #C9A96E', borderLeft: '2px solid #C9A96E' }} />
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: '0.5rem', height: '0.5rem', borderBottom: '2px solid #C9A96E', borderRight: '2px solid #C9A96E' }} />

              <svg style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', width: '0.5rem', height: '0.5rem' }} viewBox="0 0 8 8">
                <polygon points="0,0 4,0 0,4" fill="#C9A96E" />
              </svg>
              <svg style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', width: '0.5rem', height: '0.5rem' }} viewBox="0 0 8 8">
                <polygon points="8,0 4,0 8,4" fill="#C9A96E" />
              </svg>
              <svg style={{ position: 'absolute', bottom: '0.5rem', left: '0.5rem', width: '0.5rem', height: '0.5rem' }} viewBox="0 0 8 8">
                <polygon points="0,8 0,4 4,8" fill="#C9A96E" />
              </svg>
              <svg style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', width: '0.5rem', height: '0.5rem' }} viewBox="0 0 8 8">
                <polygon points="8,8 4,8 8,4" fill="#C9A96E" />
              </svg>

              <div style={{ textAlign: 'center' }}>
                <motion.div
                  style={{
                    fontSize: '2.25rem',
                    fontWeight: 700,
                    marginBottom: '1.5rem',
                    color: factionColors[winner],
                    fontFamily: "'Cinzel Display', serif",
                    textShadow: `0 0 20px ${factionColors[winner]}`,
                  }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {factionNames[winner]} 胜利!
                </motion.div>

                <motion.div
                  style={{ marginBottom: '2rem' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem', borderBottom: '1px solid rgba(201,169,110,0.3)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>剩余棋子数</span>
                    <span style={{ color: 'white', fontWeight: 700 }}>{winner === 'light' ? lightUnits.length : darkUnits.length}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem', borderBottom: '1px solid rgba(201,169,110,0.3)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>总回合数</span>
                    <span style={{ color: 'white', fontWeight: 700 }}>{currentTurn}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>对局时长</span>
                    <span style={{ color: 'white', fontWeight: 700, fontFamily: 'monospace' }}>{formatTime(gameTime)}</span>
                  </div>
                </motion.div>

                <motion.button
                  onClick={startNewGame}
                  className="px-8 py-3 bg-transparent border-2 border-[#C9A96E] text-[#C9A96E] font-bold text-lg rounded-lg hover:bg-[#C9A96E] hover:text-black transition-all duration-300"
                  style={{ fontFamily: "'Cinzel Display', serif" }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  再来一局
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
