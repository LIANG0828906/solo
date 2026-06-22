import { motion } from 'framer-motion'
import {
  useParticleStore,
  PhysicsMode,
  ColorScheme,
  physicsModeNames,
  colorSchemeNames,
  colorSchemeColors,
} from '../store/particleStore'

interface ControlPanelProps {
  isCollapsed: boolean
  onToggleCollapse: () => void
  isMobile: boolean
}

const modeColors: Record<PhysicsMode, string> = {
  gravity: '#3498DB',
  vortex: '#E67E22',
  ejection: '#2ECC71',
}

const modes: PhysicsMode[] = ['gravity', 'vortex', 'ejection']
const colorSchemes: ColorScheme[] = ['aurora', 'lava', 'ocean', 'night', 'rainbow']

export default function ControlPanel({ isCollapsed, onToggleCollapse, isMobile }: ControlPanelProps) {
  const {
    speed,
    gravityStrength,
    trailLength,
    maxParticles,
    physicsMode,
    colorScheme,
    setSpeed,
    setGravityStrength,
    setTrailLength,
    setPhysicsMode,
    setColorScheme,
  } = useParticleStore()

  const panelContent = (
    <div
      style={{
        padding: '20px',
        height: '100%',
        overflowY: 'auto' as const,
      }}
    >
      <div style={{ marginBottom: '24px' }}>
        <h2
          style={{
          fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
          fontSize: '14px',
          color: '#ECF0F1',
          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          margin: 0,
          marginBottom: '16px',
          letterSpacing: '1px',
        }}
      >
        ═══ 粒子参数 ═══
      </h2>

      <Slider
        label="运动速度"
        value={speed}
        min={0.1}
        max={3}
        step={0.1}
        onChange={setSpeed}
        displayValue={speed.toFixed(1)}
      />

      <Slider
        label="引力强度"
        value={gravityStrength}
        min={0}
        max={2}
        step={0.1}
        onChange={setGravityStrength}
        displayValue={gravityStrength.toFixed(1)}
      />

      <Slider
        label="拖尾长度"
        value={trailLength}
        min={5}
        max={30}
        step={1}
        onChange={setTrailLength}
        displayValue={String(trailLength)}
      />

      <Slider
        label="粒子上限"
        value={maxParticles}
        min={500}
        max={3000}
        step={100}
        onChange={() => {}}
        displayValue={String(maxParticles)}
        disabled
      />
    </div>

    <div style={{ marginBottom: '24px' }}>
      <h2
        style={{
          fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
          fontSize: '14px',
          color: '#ECF0F1',
          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          margin: 0,
          marginBottom: '16px',
          letterSpacing: '1px',
        }}
      >
        ═══ 物理模式 ═══
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '8px',
        }}
      >
        {modes.map((mode) => (
          <motion.button
            key={mode}
            onClick={() => setPhysicsMode(mode)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            animate={{
              scale: physicsMode === mode ? [1, 1.05, 1] : 1,
              transition: { duration: 0.3,
                type: 'spring' as const,
              },
            }}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              border: `2px solid ${
                physicsMode === mode ? modeColors[mode] : 'rgba(255,255,255,0.05)'
              }`,
              backgroundColor:
                physicsMode === mode
                  ? `${modeColors[mode]}20`
                  : 'rgba(255,255,255,0.05)',
              color: '#ECF0F1',
              fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow:
                physicsMode === mode
                  ? `0 0 15px ${modeColors[mode]}60`
                  : 'none',
            }}
          >
            {physicsModeNames[mode]}
          </motion.button>
        ))}
      </div>
    </div>

    <div>
      <h2
        style={{
          fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
          fontSize: '14px',
          color: '#ECF0F1',
          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          margin: 0,
          marginBottom: '16px',
          letterSpacing: '1px',
        }}
      >
        ═══ 配色方案 ═══
      </h2>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          justifyContent: 'center',
        }}
      >
        {colorSchemes.map((scheme) => (
          <motion.div
            key={scheme}
            onClick={() => setColorScheme(scheme)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            animate={{
              scale: colorScheme === scheme ? [1, 1.15, 1] : 1,
              transition: { duration: 0.3,
                type: 'spring' as const,
              },
            }}
            title={colorSchemeNames[scheme]}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${colorSchemeColors[scheme].join(', ')})`,
                border: `2px solid ${
                  colorScheme === scheme ? '#FFFFFF' : 'rgba(255,255,255,0.3)'
                }`,
                cursor: 'pointer',
                boxShadow:
                  colorScheme === scheme
                    ? '0 0 15px rgba(255,255,255,0.5)'
                    : '0 2px 8px rgba(0,0,0,0.3)',
                transition: 'all 0.3s ease',
              }}
            />
          </motion.div>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '12px',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
        {colorSchemes.map((scheme) => (
          <span
            key={scheme}
            style={{
              fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
              fontSize: '11px',
              color:
                colorScheme === scheme ? '#FFFFFF' : '#7F8C8D',
              transition: 'color 0.3s ease',
            }}
          >
            {colorSchemeNames[scheme]}
          </span>
        ))}
      </div>
    </div>
  </div>
  )

  if (isMobile) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'absolute' as const,
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(20, 20, 40, 0.9)',
            backdropFilter: 'blur(10px)',
            borderBottom: '2px solid rgba(255,255,255,0.05)',
          }}
        >
          <div
            style={{
              height: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 20px',
              cursor: 'pointer',
            }}
            onClick={onToggleCollapse}
          >
            <h2
              style={{
                fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                fontSize: '14px',
                color: '#ECF0F1',
                margin: 0,
              }}
            >
              粒子宇宙沙盒
            </h2>
            <motion.div
                animate={{ rotate: isCollapsed ? 0 : 180 }}
                transition={{ duration: 0.3 }}
              >
                ▼
            </motion.div>
          </div>

          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {panelContent}
            </motion.div>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        width: '280px',
        height: '100%',
        backgroundColor: 'rgba(20, 20, 40, 0.75)',
        backdropFilter: 'blur(10px)',
        borderRadius: '10px',
        border: '2px solid rgba(255,255,255,0.05)',
        boxShadow: '0 4px 30px rgba(0,0,0,0.5)',
        overflow: 'hidden',
      }}
    >
      {panelContent}
    </motion.div>
  )
}

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  displayValue: string
  disabled?: boolean
}

function Slider({ label, value, min, max, step, onChange, displayValue, disabled }: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div style={{ marginBottom: '16px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <span
          style={{
            fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
            fontSize: '12px',
            color: '#BDC3C7',
          }}
        >
          {label}
        </span>
        <motion.span
            key={displayValue}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.15,
              type: 'spring' as const,
            }}
            style={{
              fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
              fontSize: '12px',
              color: '#3498DB',
              fontWeight: 'bold',
              minWidth: '40px',
              textAlign: 'right' as const,
            }}
          >
            {displayValue}
        </motion.span>
      </div>
      <div
        style={{
          position: 'relative' as const,
          height: '4px',
          backgroundColor: '#2C3E50',
          borderRadius: '2px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${percentage}%`,
            backgroundColor: '#3498DB',
            borderRadius: '2px',
            pointerEvents: 'none' as const,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          disabled={disabled}
          style={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '100%',
            height: '16px',
            opacity: 0,
            cursor: disabled ? 'not-allowed' : 'pointer',
            margin: 0,
            pointerEvents: disabled ? 'none' : 'auto',
          }}
        />
        <motion.div
            animate={{ left: `${percentage}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              position: 'absolute',
              top: '50%',
              width: '16px',
              height: '16px',
              backgroundColor: '#3498DB',
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none' as const,
              boxShadow: '0 0 10px rgba(52, 152, 219, 0.5)',
              transition: 'background-color 0.2s ease',
            }}
            whileHover={{
              scale: 1.2,
              backgroundColor: '#2980B9',
            }}
          />
      </div>
    </div>
  )
}
