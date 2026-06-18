import { motion } from 'framer-motion'
import type { PlayerStats } from '../domain/playerInventory'

interface StatusBarProps {
  stats: PlayerStats
}

function StatRow({
  label,
  value,
  maxValue,
  color,
}: {
  label: string
  value: number
  maxValue?: number
  color?: string
}) {
  const displayValue = maxValue ? `${value}/${maxValue}` : value.toString()

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
      }}
    >
      <span style={{ fontSize: 13, opacity: 0.8 }}>{label}</span>
      <motion.span
        key={value}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          fontWeight: 'bold',
          color: color || '#FFFFFF',
        }}
      >
        {displayValue}
      </motion.span>
    </div>
  )
}

export default function StatusBar({ stats }: StatusBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        position: 'fixed',
        top: 20,
        left: 20,
        width: 200,
        height: 120,
        backgroundColor: '#00000066',
        borderRadius: 8,
        padding: 16,
        backdropFilter: 'blur(8px)',
        zIndex: 10,
      }}
    >
      <div
        style={{
          fontSize: 16,
          fontWeight: 'bold',
          marginBottom: 12,
          borderBottom: '1px solid rgba(255,255,255,0.2)',
          paddingBottom: 8,
        }}
      >
        角色状态
      </div>
      <StatRow label="生命值" value={stats.currentHealth} maxValue={stats.maxHealth} />
      <StatRow label="攻击力" value={stats.attack} color="#FF5252" />
      <StatRow label="防御力" value={stats.defense} color="#64B5F6" />
    </motion.div>
  )
}
