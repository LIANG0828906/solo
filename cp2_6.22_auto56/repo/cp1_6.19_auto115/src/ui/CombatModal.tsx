import { motion, AnimatePresence } from 'framer-motion'
import type { Enemy } from '../domain/combatSystem'

interface CombatModalProps {
  isOpen: boolean
  enemy: Enemy | null
  playerHealth: number
  playerMaxHealth: number
  onAttack: () => void
  onClose: () => void
  isPlayerAttacking: boolean
  isEnemyAttacking: boolean
  combatLog: string[]
  combatResult: 'ongoing' | 'win' | 'lose' | null
}

function HealthBar({
  current,
  max,
  label,
}: {
  current: number
  max: number
  label: string
}) {
  const percentage = Math.max(0, (current / max) * 100)
  let barClass = ''
  if (percentage < 30) {
    barClass = 'low'
  } else if (percentage < 60) {
    barClass = 'medium'
  }

  return (
    <div style={{ width: '100%', marginBottom: 12 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 4,
          fontSize: 14,
        }}
      >
        <span>{label}</span>
        <span>
          {current} / {max}
        </span>
      </div>
      <div
        style={{
          width: '100%',
          height: 20,
          backgroundColor: '#333',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <motion.div
          className={`health-bar ${barClass}`}
          initial={{ width: '100%' }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3 }}
          style={{
            height: '100%',
          }}
        />
      </div>
    </div>
  )
}

export default function CombatModal({
  isOpen,
  enemy,
  playerHealth,
  playerMaxHealth,
  onAttack,
  onClose,
  isPlayerAttacking,
  isEnemyAttacking,
  combatLog,
  combatResult,
}: CombatModalProps) {
  return (
    <AnimatePresence>
      {isOpen && enemy && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#00000080',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3, type: 'spring', damping: 25 }}
            style={{
              width: 500,
              maxWidth: '90vw',
              height: 350,
              maxHeight: '90vh',
              backgroundColor: '#2D2D2D',
              borderRadius: 16,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            }}
          >
            <h2
              style={{
                textAlign: 'center',
                marginBottom: 20,
                color: '#FF5252',
                fontSize: 20,
              }}
            >
              ⚔️ 战斗！遭遇 {enemy.name}
            </h2>

            <div style={{ flex: 1 }}>
              <motion.div
                animate={isEnemyAttacking ? { x: [0, -10, 0] } : {}}
                transition={{ duration: 0.3 }}
              >
                <HealthBar
                  current={enemy.currentHealth}
                  max={enemy.maxHealth}
                  label={enemy.name}
                />
              </motion.div>

              <div
                style={{
                  textAlign: 'center',
                  fontSize: 24,
                  margin: '10px 0',
                  color: '#666',
                }}
              >
                VS
              </div>

              <motion.div
                animate={isPlayerAttacking ? { x: [0, 10, 0] } : {}}
                transition={{ duration: 0.3 }}
              >
                <HealthBar
                  current={playerHealth}
                  max={playerMaxHealth}
                  label="勇者"
                />
              </motion.div>
            </div>

            <div
              style={{
                height: 60,
                overflowY: 'auto',
                backgroundColor: '#1A1A1A',
                borderRadius: 8,
                padding: 8,
                marginBottom: 16,
                fontSize: 12,
              }}
            >
              {combatLog.slice(-3).map((log, index) => (
                <div key={index} style={{ marginBottom: 4, color: '#BBB' }}>
                  {log}
                </div>
              ))}
            </div>

            {combatResult === 'ongoing' || combatResult === null ? (
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: '#42A5F5' }}
                whileTap={{ scale: 0.95 }}
                animate={isPlayerAttacking ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.3 }}
                onClick={onAttack}
                style={{
                  width: '100%',
                  padding: '12px 0',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: 'bold',
                }}
              >
                ⚔️ 攻击
              </motion.button>
            ) : (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                style={{
                  width: '100%',
                  padding: '12px 0',
                  backgroundColor: combatResult === 'win' ? '#4CAF50' : '#F44336',
                  color: 'white',
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: 'bold',
                }}
              >
                {combatResult === 'win' ? '🎉 胜利！' : '💀 失败...'}
              </motion.button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
