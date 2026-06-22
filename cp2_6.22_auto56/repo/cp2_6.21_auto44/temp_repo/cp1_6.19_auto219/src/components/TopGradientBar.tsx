import { motion } from 'framer-motion'

export const TopGradientBar = () => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '20px',
        overflow: 'hidden',
        zIndex: 20,
      }}
    >
      <motion.div
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        style={{
          width: '200%',
          height: '100%',
          background: 'linear-gradient(to right, #FF0000, #00FF00, #0000FF, #FF0000, #00FF00, #0000FF)',
          imageRendering: 'pixelated',
        }}
      />
    </div>
  )
}
