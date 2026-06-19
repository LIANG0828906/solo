import { motion } from 'framer-motion'
import { Play, Pause, RotateCcw, RefreshCw, Atom } from 'lucide-react'
import { useAppStore } from '@/utils/store'
import { molecularDynamics, isAtomHighEnergy } from '@/core/kinetics'
import { reactionPaths } from '@/model/reaction'

const ELEMENT_LABELS: Record<string, string> = {
  C: '碳',
  H: '氢',
  O: '氧',
  Cl: '氯'
}

const ELEMENT_COLORS: Record<string, string> = {
  C: '#444444',
  H: '#FFFFFF',
  O: '#EF4444',
  Cl: '#22C55E'
}

function ControlButton({
  onClick,
  icon: Icon,
  label,
  disabled = false
}: {
  onClick: () => void
  icon: React.ComponentType<{ size?: number }>
  label: string
  disabled?: boolean
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ backgroundColor: disabled ? '#1E293B' : '#334155' }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      transition={{ duration: 0.1 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: '10px 16px',
        backgroundColor: '#1E293B',
        border: '1px solid #334155',
        borderRadius: 8,
        color: disabled ? '#475569' : '#E2E8F0',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 13,
        fontWeight: 500,
        flex: 1
      }}
    >
      <Icon size={16} />
      <span>{label}</span>
    </motion.button>
  )
}

function AtomEnergyIndicator({
  atomId,
  element,
  energy,
  isHighEnergy
}: {
  atomId: string
  element: string
  energy: number
  isHighEnergy: boolean
}) {
  return (
    <motion.div
      layout
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 10px',
        backgroundColor: '#1E293B',
        borderRadius: 6,
        border: `1px solid ${isHighEnergy ? '#7F1D1D' : '#334155'}`
      }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          backgroundColor: ELEMENT_COLORS[element] || '#888888',
          border: element === 'H' ? '1px solid #475569' : 'none'
        }}
      />
      <span style={{ color: '#94A3B8', fontSize: 12, minWidth: 50 }}>
        {ELEMENT_LABELS[element] || element} {atomId.replace(/\D/g, '')}
      </span>
      <div style={{ flex: 1 }} />
      <motion.div
        animate={
          isHighEnergy
            ? {
                scale: [1, 1.2, 1],
                transition: { duration: 1, repeat: Infinity }
              }
            : {}
        }
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: isHighEnergy ? '#EF4444' : '#22C55E',
          boxShadow: isHighEnergy
            ? '0 0 8px rgba(239, 68, 68, 0.6)'
            : '0 0 4px rgba(34, 197, 94, 0.4)'
        }}
      />
      <span
        style={{
          color: isHighEnergy ? '#EF4444' : '#22C55E',
          fontSize: 11,
          minWidth: 32,
          textAlign: 'right'
        }}
      >
        {energy.toFixed(2)}
      </span>
    </motion.div>
  )
}

export function ControlPanel() {
  const moleculeName = useAppStore((s) => s.moleculeName)
  const currentReaction = useAppStore((s) => s.currentReaction)
  const reactionStatus = useAppStore((s) => s.reactionStatus)
  const atoms = useAppStore((s) => s.atoms)
  const currentTime = useAppStore((s) => s.currentTime)

  const handleStart = () => {
    if (reactionStatus === 'idle' || reactionStatus === 'finished') {
      molecularDynamics.startReaction(currentReaction)
    } else if (reactionStatus === 'paused') {
      molecularDynamics.resumeReaction()
    }
  }

  const handlePause = () => {
    molecularDynamics.pauseReaction()
  }

  const handleReplay = () => {
    molecularDynamics.replayReaction()
  }

  const handleReset = () => {
    molecularDynamics.resetReaction()
  }

  const handleReactionChange = (reactionId: string) => {
    useAppStore.getState().setCurrentReaction(reactionId)
    const reaction = reactionPaths.find((r) => r.id === reactionId)
    if (reaction) {
      useAppStore.getState().setMoleculeName(reaction.moleculeName)
    }
    molecularDynamics.resetReaction()
  }

  const progress = (currentTime / 5) * 100

  return (
    <motion.div
      initial={{ x: -320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        width: 320,
        minWidth: 320,
        height: '100vh',
        backgroundColor: '#1E293B',
        borderRadius: 12,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        overflowY: 'auto',
        boxSizing: 'border-box'
      }}
    >
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 4
          }}
        >
          <Atom size={22} color="#00B4D8" />
          <h1
            style={{
              color: '#F1F5F9',
              fontSize: 18,
              fontWeight: 600,
              margin: 0
            }}
          >
            分子反应可视化
          </h1>
        </div>
        <p style={{ color: '#64748B', fontSize: 12, margin: '4px 0 0 0' }}>
          Molecular Reaction Visualizer
        </p>
      </div>

      <div
        style={{
          backgroundColor: '#0F172A',
          borderRadius: 8,
          padding: 14,
          border: '1px solid #334155'
        }}
      >
        <span
          style={{
            color: '#64748B',
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: 0.5
          }}
        >
          当前分子
        </span>
        <div
          style={{
            color: '#F1F5F9',
            fontSize: 16,
            fontWeight: 600,
            marginTop: 4
          }}
        >
          {moleculeName}
        </div>
      </div>

      <div>
        <label
          style={{
            color: '#94A3B8',
            fontSize: 12,
            marginBottom: 8,
            display: 'block'
          }}
        >
          反应路径
        </label>
        <select
          value={currentReaction}
          onChange={(e) => handleReactionChange(e.target.value)}
          disabled={reactionStatus === 'playing'}
          style={{
            width: '100%',
            padding: '10px 12px',
            backgroundColor: '#0F172A',
            border: '1px solid #334155',
            borderRadius: 8,
            color: '#E2E8F0',
            fontSize: 13,
            cursor: reactionStatus === 'playing' ? 'not-allowed' : 'pointer',
            outline: 'none'
          }}
        >
          {reactionPaths.map((reaction) => (
            <option key={reaction.id} value={reaction.id}>
              {reaction.name}
            </option>
          ))}
        </select>
      </div>

      {reactionStatus !== 'idle' && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 6
            }}
          >
            <span style={{ color: '#64748B', fontSize: 11 }}>
              反应进度
            </span>
            <span style={{ color: '#94A3B8', fontSize: 11 }}>
              {currentTime.toFixed(1)}s / 5.0s
            </span>
          </div>
          <div
            style={{
              height: 6,
              backgroundColor: '#0F172A',
              borderRadius: 3,
              overflow: 'hidden'
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 0.1 }}
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #00B4D8, #FF6B6B)',
                borderRadius: 3
              }}
            />
          </div>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: 8
        }}
      >
        {reactionStatus !== 'playing' ? (
          <ControlButton
            onClick={handleStart}
            icon={Play}
            label={reactionStatus === 'paused' ? '继续' : '开始'}
          />
        ) : (
          <ControlButton onClick={handlePause} icon={Pause} label="暂停" />
        )}
        <ControlButton
          onClick={handleReplay}
          icon={RefreshCw}
          label="回放"
        />
      </div>

      <ControlButton
        onClick={handleReset}
        icon={RotateCcw}
        label="重置"
        disabled={reactionStatus === 'idle'}
      />

      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10
          }}
        >
          <span
            style={{
              color: '#94A3B8',
              fontSize: 12,
              fontWeight: 500
            }}
          >
            原子能量状态
          </span>
          <div
            style={{
              display: 'flex',
              gap: 12,
              fontSize: 10,
              color: '#64748B'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: '#22C55E'
                }}
              />
              稳定
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: '#EF4444'
                }}
              />
              高能
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {atoms.map((atom) => (
            <AtomEnergyIndicator
              key={atom.id}
              atomId={atom.id}
              element={atom.element}
              energy={atom.energy}
              isHighEnergy={isAtomHighEnergy(atom)}
            />
          ))}
        </div>
      </div>

      <div
        style={{
          marginTop: 'auto',
          padding: 12,
          backgroundColor: '#0F172A',
          borderRadius: 8,
          border: '1px solid #334155'
        }}
      >
        <div
          style={{
            color: '#64748B',
            fontSize: 11,
            marginBottom: 6
          }}
        >
          操作提示
        </div>
        <div style={{ color: '#475569', fontSize: 11, lineHeight: 1.6 }}>
          • 拖拽旋转视角，滚轮缩放
          <br />• 选择反应路径后点击开始
          <br />• 能量图表实时显示势垒变化
        </div>
      </div>
    </motion.div>
  )
}
