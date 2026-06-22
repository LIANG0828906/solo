import { motion } from 'framer-motion';
import { Rocket } from 'lucide-react';
import { AssembleBay } from './components/AssembleBay';
import { BattleSim } from './components/BattleSim';
import { useGameStore } from './gameStore';

function App() {
  const battleState = useGameStore(state => state.battleState);

  return (
    <div className="min-h-screen w-full p-4 lg:p-6" style={{ backgroundColor: '#1a1a2e' }}>
      <motion.header
        className="mb-6 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="flex items-center justify-center gap-3 mb-2"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
        >
          <Rocket size={36} className="text-[#4FC3F7]" />
          <h1
            className="text-3xl lg:text-4xl font-bold bg-clip-text text-transparent"
            style={{
              backgroundImage: 'linear-gradient(135deg, #4FC3F7, #29B6F6, #4FC3F7)',
              fontFamily: 'Orbitron, sans-serif',
            }}
          >
            星际船坞
          </h1>
          <Rocket size={36} className="text-[#4FC3F7]" style={{ transform: 'scaleX(-1)' }} />
        </motion.div>
        <p className="text-[#A0A0B0] text-sm">
          飞船改造 · 模块装配 · 战斗模拟
        </p>
      </motion.header>

      <main
        className={`
          gap-4 lg:gap-6 h-[calc(100vh-140px)]
          ${battleState ? 'flex flex-col lg:flex-row' : 'flex flex-col'}
        `}
      >
        {battleState ? (
          <>
            <motion.div
              className="flex-1 overflow-hidden"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AssembleBay />
            </motion.div>
            <motion.div
              className="flex-1 lg:max-w-[480px] overflow-hidden"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <BattleSim />
            </motion.div>
          </>
        ) : (
          <motion.div
            className="h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <AssembleBay />
          </motion.div>
        )}
      </main>

      <footer className="mt-4 text-center text-xs text-[#606070]">
        <p>🚀 拖拽模块到飞船插槽进行装配 · 点击启动战斗测试实战效果</p>
      </footer>
    </div>
  );
}

export default App;
