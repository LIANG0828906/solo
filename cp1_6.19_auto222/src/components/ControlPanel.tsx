import { motion } from 'framer-motion'
import { useConfigStore, COLOR_PRESETS, MATERIAL_LABELS, ENVIRONMENT_LABELS, MaterialType, EnvironmentType } from '../store/useConfigStore'

export function ControlPanel() {
  const {
    color,
    material,
    environment,
    setColor,
    setMaterial,
    setEnvironment,
  } = useConfigStore()

  const containerVariants = {
    hidden: { x: -320, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 80,
        damping: 20,
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <motion.div
      style={panelStyle}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div style={headerStyle}>
        <h2 style={titleStyle}>音响配置</h2>
        <p style={subtitleStyle}>自定义您的复古音响</p>
      </div>

      <motion.div style={sectionStyle} variants={itemVariants}>
        <h3 style={sectionTitleStyle}>颜色选择</h3>
        <div style={colorGridStyle}>
          {COLOR_PRESETS.map((c) => (
            <motion.button
              key={c}
              style={{
                ...colorButtonStyle,
                backgroundColor: c,
                border: color === c ? '3px solid #FF6B35' : '3px solid transparent',
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setColor(c)}
              transition={{ type: 'spring', stiffness: 400, damping: 15, duration: 0.1 }}
              aria-label={`颜色 ${c}`}
            />
          ))}
        </div>
      </motion.div>

      <motion.div style={sectionStyle} variants={itemVariants}>
        <h3 style={sectionTitleStyle}>材质切换</h3>
        <div style={buttonGroupStyle}>
          {(Object.keys(MATERIAL_LABELS) as MaterialType[]).map((m) => (
            <motion.button
              key={m}
              style={{
                ...materialButtonStyle,
                backgroundColor: material === m ? 'rgba(255, 107, 53, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: material === m ? '1px solid #FF6B35' : '1px solid rgba(255, 255, 255, 0.1)',
                color: material === m ? '#FF6B35' : '#C0C0C0',
              }}
              whileHover={{
                backgroundColor: material === m ? 'rgba(255, 107, 53, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                scale: 1.02,
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMaterial(m)}
              transition={{ type: 'spring', stiffness: 400, damping: 20, duration: 0.15 }}
            >
              {MATERIAL_LABELS[m]}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <motion.div style={sectionStyle} variants={itemVariants}>
        <h3 style={sectionTitleStyle}>环境切换</h3>
        <div style={envGridStyle}>
          {(Object.keys(ENVIRONMENT_LABELS) as EnvironmentType[]).map((env) => (
            <motion.button
              key={env}
              style={{
                ...envCardStyle,
                background: getEnvGradient(env),
                border: environment === env ? '2px solid #FF6B35' : '2px solid rgba(255, 255, 255, 0.2)',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setEnvironment(env)}
              transition={{ type: 'spring', stiffness: 300, damping: 20, duration: 0.2 }}
            >
              <span style={envLabelStyle}>{ENVIRONMENT_LABELS[env]}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

function getEnvGradient(env: EnvironmentType): string {
  switch (env) {
    case 'studio':
      return 'linear-gradient(135deg, #2C3E50 0%, #1A1D2E 100%)'
    case 'sunset':
      return 'linear-gradient(135deg, #F39C12 0%, #E74C3C 50%, #8E44AD 100%)'
    case 'neon':
      return 'linear-gradient(135deg, #0F0F23 0%, #1A1A4E 50%, #6366F1 100%)'
    default:
      return 'linear-gradient(135deg, #2C3E50 0%, #1A1D2E 100%)'
  }
}

const panelStyle: React.CSSProperties = {
  position: 'fixed',
  left: 0,
  top: 0,
  bottom: 0,
  width: 280,
  background: 'rgba(30, 30, 40, 0.6)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  borderTopRightRadius: 16,
  borderBottomRightRadius: 16,
  padding: '32px 24px',
  zIndex: 100,
  overflowY: 'auto',
  borderRight: '1px solid rgba(255, 255, 255, 0.1)',
}

const headerStyle: React.CSSProperties = {
  marginBottom: 32,
}

const titleStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  color: '#FFFFFF',
  marginBottom: 6,
}

const subtitleStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#888899',
  fontWeight: 400,
}

const sectionStyle: React.CSSProperties = {
  marginBottom: 32,
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: '#E0E0E0',
  marginBottom: 16,
  letterSpacing: 0.5,
}

const colorGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 12,
}

const colorButtonStyle: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: '50%',
  cursor: 'pointer',
  padding: 0,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
}

const buttonGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const materialButtonStyle: React.CSSProperties = {
  height: 48,
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
}

const envGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: 12,
}

const envCardStyle: React.CSSProperties = {
  width: '100%',
  height: 80,
  borderRadius: 8,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  paddingBottom: 8,
  position: 'relative',
  overflow: 'hidden',
}

const envLabelStyle: React.CSSProperties = {
  color: '#FFFFFF',
  fontSize: 13,
  fontWeight: 600,
  textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
  zIndex: 1,
}

export default ControlPanel
