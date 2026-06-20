import { motion } from 'framer-motion'
import { GameBoard } from './components/GameBoard'
import { UIPanel } from './components/UIPanel'

function App() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <motion.h1
        className="text-transparent bg-clip-text bg-gradient-to-r from-[#C9A96E] via-[#E8D5A3] to-[#C9A96E]"
        style={{ fontFamily: "'Cinzel Display', serif", letterSpacing: '0.1em', fontSize: '2.25rem', fontWeight: 700, marginBottom: '1.5rem' }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        暗影棋盘
      </motion.h1>

      <motion.div
        style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', marginBottom: '1rem' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        Shadow Chessboard
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <UIPanel />
        <GameBoard />
      </motion.div>

      <motion.div
        style={{ marginTop: '1.5rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', textAlign: 'center', maxWidth: '36rem' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
      >
        <p>🔥 火克冰 | ❄️ 冰克雷 | ⚡ 雷克暗 | 🌑 暗克火</p>
        <p style={{ marginTop: '0.25rem' }}>点击己方棋子选择，点击绿色格子移动，点击红色格子攻击</p>
      </motion.div>
    </div>
  )
}

export default App
