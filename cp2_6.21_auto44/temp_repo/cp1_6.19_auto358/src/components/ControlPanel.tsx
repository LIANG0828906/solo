import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TowerType, TOWER_CONFIG } from '@/game/types'
import { useGameStore } from '@/store/gameStore'

const TOWER_TYPES = [
  { type: TowerType.LOW, name: '低频塔', desc: '重甲+20% / 轻甲-30%' },
  { type: TowerType.MID, name: '中频塔', desc: '均衡伤害' },
  { type: TowerType.HIGH, name: '高频塔', desc: '轻甲+30% / 重甲-20%' },
  { type: TowerType.SHIELD, name: '护盾塔', desc: '反射声波(可配置)' },
]

export default function ControlPanel() {
  const {
    score,
    displayScore,
    waveNumber,
    totalWaves,
    waveStatus,
    waveCountdown,
    monstersRemaining,
    waveDamageDealt,
    waveDamagePotential,
    selectedTowerType,
    shieldReflectionRate,
    logs,
    setSelectedTowerType,
    setShieldReflectionRate,
    startWave,
    reset,
  } = useGameStore()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const efficiency = waveDamagePotential > 0
    ? ((waveDamageDealt / waveDamagePotential) * 100).toFixed(1)
    : '0.0'

  const waveStatusText = {
    idle: '待命',
    countdown: `倒计时 ${waveCountdown.toFixed(1)}s`,
    spawning: '怪物生成中...',
    active: '战斗中',
    complete: waveNumber < totalWaves ? `本波完成 (${waveCountdown.toFixed(1)}s)` : '全部完成',
  }[waveStatus]

  const panelContent = (
    <motion.div
      initial={false}
      style={{
        width: isMobile ? '100%' : 260,
        height: isMobile ? 'auto' : '100%',
        maxHeight: isMobile ? '70vh' : '100vh',
        background: 'rgba(26, 26, 46, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderLeft: isMobile ? 'none' : '1px solid rgba(255,255,255,0.08)',
        borderTop: isMobile ? '1px solid rgba(255,255,255,0.08)' : 'none',
        color: '#e0e0e0',
        fontFamily: "'Courier New', monospace",
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div style={{
        padding: '16px 16px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          fontSize: 14,
          letterSpacing: 2,
          marginBottom: 8,
          color: '#888',
        }}>
          SCORE
        </div>
        <motion.div
          key={Math.floor(score)}
          initial={{ scale: 1.05, color: '#fff' }}
          animate={{ scale: 1, color: TOWER_CONFIG[TowerType.HIGH].color }}
          transition={{ duration: 0.2 }}
          style={{
            fontSize: 32,
            fontWeight: 'bold',
            letterSpacing: 1,
          }}
        >
          {Math.floor(displayScore)}
        </motion.div>
      </div>

      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        fontSize: 12,
        lineHeight: 1.8,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#888' }}>波次</span>
          <span>{waveNumber} / {totalWaves}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#888' }}>状态</span>
          <span style={{ color: waveStatus === 'active' ? '#81c784' : '#e0e0e0' }}>
            {waveStatusText}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#888' }}>剩余怪物</span>
          <span style={{ color: '#ff8a65' }}>{monstersRemaining}</span>
        </div>
        {waveStatus === 'complete' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ color: '#888' }}>效率</span>
            <span style={{ color: '#4fc3f7' }}>{efficiency}%</span>
          </div>
        )}
      </div>

      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          fontSize: 12,
          letterSpacing: 2,
          color: '#888',
          marginBottom: 10,
        }}>
          塔类型
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {TOWER_TYPES.map(({ type, name, desc }) => {
            const cfg = TOWER_CONFIG[type]
            const selected = selectedTowerType === type
            return (
              <motion.button
                key={type}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedTowerType(type)}
                style={{
                  padding: '10px 8px',
                  borderRadius: 10,
                  border: selected ? `1.5px solid ${cfg.color}` : '1px solid rgba(255,255,255,0.1)',
                  background: selected ? `${cfg.color}22` : 'rgba(255,255,255,0.03)',
                  cursor: 'pointer',
                  color: '#e0e0e0',
                  fontFamily: 'inherit',
                  fontSize: 11,
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <div style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: cfg.color,
                  }} />
                  <span style={{ fontSize: 12, fontWeight: 'bold' }}>{name}</span>
                </div>
                <div style={{ fontSize: 9, color: '#888', lineHeight: 1.3 }}>{desc}</div>
              </motion.button>
            )
          })}
        </div>
      </div>

      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          fontSize: 12,
          letterSpacing: 2,
          color: '#888',
          marginBottom: 10,
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          <span>护盾反射率</span>
          <span style={{ color: '#ab47bc' }}>{Math.round(shieldReflectionRate * 100)}%</span>
        </div>
        <input
          type="range"
          min={0.5}
          max={0.9}
          step={0.1}
          value={shieldReflectionRate}
          onChange={(e) => setShieldReflectionRate(parseFloat(e.target.value))}
          style={{
            width: '100%',
            accentColor: '#ab47bc',
            cursor: 'pointer',
          }}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 10,
          color: '#555',
          marginTop: 4,
        }}>
          <span>50%</span>
          <span>70%</span>
          <span>90%</span>
        </div>
      </div>

      <div style={{
        padding: '12px 16px',
        display: 'flex',
        gap: 8,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={startWave}
          disabled={waveStatus !== 'idle' && waveStatus !== 'complete'}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: 10,
            border: 'none',
            background: waveStatus === 'idle' || waveStatus === 'complete'
              ? 'linear-gradient(135deg, #4fc3f7, #81c784)'
              : 'rgba(255,255,255,0.05)',
            color: waveStatus === 'idle' || waveStatus === 'complete' ? '#0a0a1a' : '#666',
            cursor: waveStatus === 'idle' || waveStatus === 'complete' ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit',
            fontSize: 13,
            fontWeight: 'bold',
            letterSpacing: 2,
          }}
        >
          {waveNumber === 0 ? '开始波次' : '下一波'}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={reset}
          style={{
            padding: '12px 14px',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.03)',
            color: '#e0e0e0',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 12,
          }}
          title="重置"
        >
          ↺
        </motion.button>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px 12px',
        fontSize: 10.5,
        lineHeight: 1.6,
      }}>
        <div style={{
          fontSize: 11,
          letterSpacing: 2,
          color: '#888',
          marginBottom: 8,
          position: 'sticky',
          top: 0,
          background: 'rgba(26, 26, 46, 0.95)',
          padding: '2px 0',
        }}>
          发射日志
        </div>
        <AnimatePresence initial={false}>
          {logs.slice(-20).reverse().map((log, idx) => {
            const colorMap: Record<string, string> = {
              fire: '#4fc3f7',
              hit: '#ffd54f',
              reflect: '#ab47bc',
              kill: '#ff8a65',
              wave: '#81c784',
            }
            return (
              <motion.div
                key={`${log.timestamp}_${idx}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  padding: '3px 6px',
                  marginBottom: 2,
                  borderRadius: 4,
                  borderLeft: `2px solid ${colorMap[log.type] || '#666'}`,
                  color: '#bbb',
                }}
              >
                <span style={{ color: colorMap[log.type], marginRight: 6 }}>
                  [{log.type.toUpperCase()}]
                </span>
                {log.message}
              </motion.div>
            )
          })}
        </AnimatePresence>
        {logs.length === 0 && (
          <div style={{ color: '#555', fontStyle: 'italic', textAlign: 'center', padding: 20 }}>
            暂无日志
          </div>
        )}
      </div>
    </motion.div>
  )

  return (
    <>
      {!isMobile && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
        }}>
          {panelContent}
        </div>
      )}

      {isMobile && (
        <>
          <AnimatePresence>
            {mobileOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    zIndex: 98,
                  }}
                />
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  style={{
                    position: 'fixed',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 99,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    overflow: 'hidden',
                  }}
                >
                  {panelContent}
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              position: 'fixed',
              right: 20,
              bottom: 20,
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: '#e53935',
              border: 'none',
              color: '#fff',
              fontSize: 24,
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(229, 57, 53, 0.5)',
              zIndex: 100,
            }}
          >
            {mobileOpen ? '×' : '☰'}
          </motion.button>
        </>
      )}
    </>
  )
}
