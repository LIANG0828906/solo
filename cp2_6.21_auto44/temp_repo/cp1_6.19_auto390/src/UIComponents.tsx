import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBattleStore, type Enemy, type DamageNumber } from './store'
import { MONSTER_TEMPLATES, summonMonster, getMonsterTemplate } from './CallManager'

export function ManaBar() {
  const mana = useBattleStore((s) => s.mana)
  const maxMana = useBattleStore((s) => s.maxMana)
  const manaPulse = useBattleStore((s) => s.manaPulse)
  const manaFlash = useBattleStore((s) => s.manaFlash)
  const pct = (mana / maxMana) * 100

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', flex: 1 }}>
      <span style={{ color: '#7EB8DA', fontSize: 12, fontFamily: "'Courier New', monospace", minWidth: 40 }}>
        MP {Math.floor(mana)}
      </span>
      <div
        style={{
          flex: 1,
          height: 20,
          background: 'rgba(0,0,0,0.4)',
          borderRadius: 10,
          overflow: 'hidden',
          position: 'relative',
          border: '1px solid #4a4a6a',
        }}
      >
        <motion.div
          animate={{
            width: `${pct}%`,
            background: manaFlash
              ? 'linear-gradient(90deg, #FFFFFF, #00BFFF)'
              : 'linear-gradient(90deg, #1E90FF, #00BFFF)',
          }}
          transition={{ duration: 0.5 }}
          style={{ height: '100%', borderRadius: 10 }}
        />
        <AnimatePresence>
          {manaPulse && (
            <motion.div
              key="pulse"
              initial={{ opacity: 0.8, scaleX: 0 }}
              animate={{ opacity: 0, scaleX: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                width: 30,
                height: '100%',
                background: 'radial-gradient(circle, rgba(0,191,255,0.6), transparent)',
                transformOrigin: 'right',
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export function SummonPanel() {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '0 8px' }}>
      {MONSTER_TEMPLATES.map((t) => (
        <SummonButton key={t.id} template={t} />
      ))}
    </div>
  )
}

function SummonButton({ template }: { template: (typeof MONSTER_TEMPLATES)[number] }) {
  const mana = useBattleStore((s) => s.mana)
  const canAfford = mana >= template.cost
  const [justClicked, setJustClicked] = useState(false)

  const handleClick = useCallback(() => {
    if (!canAfford) return
    const success = summonMonster(template.id)
    if (success) {
      setJustClicked(true)
      setTimeout(() => setJustClicked(false), 200)
    }
  }, [canAfford, template.id])

  return (
    <motion.button
      onClick={handleClick}
      animate={justClicked ? { scale: 0.85 } : { scale: 1 }}
      transition={justClicked ? { duration: 0.1, yoyo: Infinity } : { type: 'spring', stiffness: 400, damping: 15 }}
      whileHover={canAfford ? { scale: 1.05 } : {}}
      style={{
        width: 56,
        height: 56,
        borderRadius: 10,
        border: `1px solid ${canAfford ? '#6a6aaa' : '#3a3a4a'}`,
        background: canAfford ? 'rgba(80,80,140,0.3)' : 'rgba(40,40,60,0.3)',
        cursor: canAfford ? 'pointer' : 'not-allowed',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        opacity: canAfford ? 1 : 0.5,
        padding: 0,
        color: 'inherit',
      }}
    >
      <span style={{ fontSize: 20, lineHeight: 1 }}>{template.emoji}</span>
      <span
        style={{
          fontSize: 10,
          color: '#FFD700',
          fontFamily: "'Courier New', monospace",
          fontWeight: 'bold',
          marginTop: 2,
        }}
      >
        {template.cost}
      </span>
    </motion.button>
  )
}

export function FormationArea() {
  const formation = useBattleStore((s) => s.formation)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index)
  }, [])

  const handleDragOver = useCallback((index: number) => {
    setOverIndex(index)
  }, [])

  const handleDragEnd = useCallback(() => {
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      useBattleStore.getState().reorderFormation(dragIndex, overIndex)
    }
    setDragIndex(null)
    setOverIndex(null)
  }, [dragIndex, overIndex])

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '12px 16px',
        minHeight: 72,
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          color: '#8a8aaa',
          fontSize: 11,
          fontFamily: "'Courier New', monospace",
          marginRight: 4,
        }}
      >
        阵型:
      </span>
      <AnimatePresence mode="popLayout">
        {formation.map((m, i) => (
          <FormationCard
            key={m.id}
            monster={m}
            index={i}
            isDragging={dragIndex === i}
            isOver={overIndex === i}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          />
        ))}
      </AnimatePresence>
      {formation.length === 0 && (
        <span style={{ color: '#5a5a7a', fontSize: 11, fontFamily: "'Courier New', monospace" }}>
          点击上方按钮召唤怪物
        </span>
      )}
    </div>
  )
}

function FormationCard({
  monster,
  index,
  isDragging,
  isOver,
  onDragStart,
  onDragOver,
  onDragEnd,
}: {
  monster: { id: string; templateId: string; slotIndex: number; lastAttackTime: number }
  index: number
  isDragging: boolean
  isOver: boolean
  onDragStart: (i: number) => void
  onDragOver: (i: number) => void
  onDragEnd: () => void
}) {
  const template = getMonsterTemplate(monster.templateId)
  if (!template) return null

  return (
    <motion.div
      layout
      draggable
      onDragStart={() => onDragStart(index)}
      onDragEnter={() => onDragOver(index)}
      onDragEnd={onDragEnd}
      animate={{
        scale: isDragging ? 1.15 : 1,
        opacity: isDragging ? 0.7 : 1,
        borderColor: isOver ? '#FFD700' : '#4a4a6a',
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      initial={{ scale: 0, opacity: 0 }}
      exit={{ scale: 0, opacity: 0 }}
      style={{
        width: 48,
        height: 48,
        borderRadius: 8,
        background: 'rgba(60,60,100,0.5)',
        border: '2px solid #4a4a6a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 24,
        cursor: 'grab',
        position: 'relative',
        boxShadow: isDragging ? '0 0 12px rgba(255,215,0,0.4)' : 'none',
        userSelect: 'none',
      }}
    >
      {template.emoji}
      <span
        style={{
          position: 'absolute',
          bottom: -2,
          right: -2,
          fontSize: 8,
          color: '#FFD700',
          fontFamily: "'Courier New', monospace",
          background: 'rgba(0,0,0,0.6)',
          padding: '1px 3px',
          borderRadius: 4,
        }}
      >
        {template.attack}
      </span>
    </motion.div>
  )
}

export function BattleField() {
  const enemies = useBattleStore((s) => s.enemies)
  const damageNumbers = useBattleStore((s) => s.damageNumbers)

  return (
    <div
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at 70% 40%, #0f3460 0%, transparent 70%)',
      }}
    >
      <AnimatePresence>
        {enemies.map((e) => (
          <EnemyUnit key={e.id} enemy={e} />
        ))}
      </AnimatePresence>
      <AnimatePresence>
        {damageNumbers.map((dn) => (
          <DamageFloat key={dn.id} damageNumber={dn} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function getEnemyEmoji(maxHp: number): string {
  if (maxHp > 80) return '🐉'
  if (maxHp > 60) return '👹'
  if (maxHp > 40) return '👺'
  return '🧟'
}

function EnemyUnit({ enemy }: { enemy: Enemy }) {
  return (
    <motion.div
      initial={{ x: 200, opacity: 0 }}
      animate={enemy.isDying ? { scale: 0, opacity: 0 } : { x: 0, opacity: 1 }}
      transition={enemy.isDying ? { duration: 0.4, ease: 'easeOut' } : { duration: 1, ease: [0.16, 1, 0.3, 1] }}
      exit={{ scale: 0, opacity: 0 }}
      style={{
        position: 'absolute',
        left: enemy.targetX,
        top: enemy.targetY,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 8,
          background: enemy.isDying ? 'rgba(255,69,0,0.3)' : 'rgba(180,40,40,0.6)',
          border: `1px solid ${enemy.isDying ? '#FF4500' : '#8B0000'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          boxShadow: enemy.isDying ? '0 0 20px rgba(255,69,0,0.5)' : '0 0 8px rgba(139,0,0,0.3)',
        }}
      >
        {getEnemyEmoji(enemy.maxHp)}
      </div>
      <div
        style={{
          width: 48,
          height: 4,
          borderRadius: 2,
          background: 'rgba(0,0,0,0.5)',
          marginTop: 3,
          overflow: 'hidden',
        }}
      >
        <motion.div
          animate={{ width: `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%` }}
          transition={{ duration: 0.2 }}
          style={{
            height: '100%',
            background: enemy.hp / enemy.maxHp > 0.5 ? '#32CD32' : enemy.hp / enemy.maxHp > 0.25 ? '#FFD700' : '#FF4500',
            borderRadius: 2,
          }}
        />
      </div>
    </motion.div>
  )
}

function DamageFloat({ damageNumber: dn }: { damageNumber: DamageNumber }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 0, scale: 0.5 }}
      animate={{ opacity: [0, 1, 1, 0], y: [0, -20, -40, -50], scale: [0.5, 1.2, 1, 0.8] }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        left: dn.x,
        top: dn.y,
        color: '#FF4500',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: "'Courier New', monospace",
        textShadow: '0 0 6px rgba(255,69,0,0.8), 0 1px 2px rgba(0,0,0,0.8)',
        pointerEvents: 'none',
        zIndex: 100,
      }}
    >
      -{dn.value}
    </motion.div>
  )
}

export function BattleHUD() {
  const wave = useBattleStore((s) => s.wave)
  const killCount = useBattleStore((s) => s.killCount)

  return (
    <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 50 }}>
      <div style={{ color: '#FFFFFF', fontSize: 24, fontFamily: "'Courier New', monospace", textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>
        波次 {wave}
      </div>
      <div style={{ color: '#32CD32', fontSize: 18, fontFamily: "'Courier New', monospace", textShadow: '0 0 8px rgba(50,205,50,0.3)' }}>
        击杀 {killCount}
      </div>
    </div>
  )
}

export function StatsPanel() {
  const killCount = useBattleStore((s) => s.killCount)
  const wave = useBattleStore((s) => s.wave)
  const mana = useBattleStore((s) => s.mana)
  const formation = useBattleStore((s) => s.formation)
  const enemies = useBattleStore((s) => s.enemies)

  return (
    <div
      style={{
        width: 180,
        background: 'rgba(10,10,30,0.9)',
        borderLeft: '1px solid #4a4a6a',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        fontFamily: "'Courier New', monospace",
        color: '#E0E0E0',
      }}
    >
      <div>
        <div style={{ fontSize: 10, color: '#8a8aaa', marginBottom: 4, letterSpacing: 2 }}>战斗统计</div>
        <div style={{ height: 1, background: 'linear-gradient(90deg, #4a4a6a, transparent)' }} />
      </div>
      <StatItem label="击杀数" value={killCount} color="#32CD32" />
      <StatItem label="当前波次" value={wave} color="#FFFFFF" />
      <StatItem label="魔力值" value={Math.floor(mana)} color="#00BFFF" />
      <StatItem label="我方单位" value={formation.length} color="#FFD700" />
      <StatItem label="敌方存活" value={enemies.filter((e) => !e.isDying).length} color="#FF4500" />
      <div style={{ marginTop: 'auto' }}>
        <div style={{ height: 1, background: 'linear-gradient(90deg, #4a4a6a, transparent)' }} />
        <div style={{ fontSize: 9, color: '#5a5a7a', marginTop: 8, lineHeight: 1.6 }}>
          每2秒恢复5MP<br />
          击杀奖励3MP<br />
          每5秒刷新敌人波次
        </div>
      </div>
    </div>
  )
}

function StatItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: '#6a6a8a' }}>{label}</div>
      <div style={{ fontSize: 22, color, fontWeight: 'bold' }}>{value}</div>
    </div>
  )
}
