import React from 'react';
import { motion } from 'framer-motion';
import { GameBoard } from './components/GameBoard';
import { ScorePanel } from './components/ScorePanel';
import { useGameStore } from './store/useGameStore';

const App: React.FC = () => {
  const gameStatus = useGameStore((state) => state.gameStatus);
  const resetGame = useGameStore((state) => state.resetGame);

  return (
    <div
      className="min-h-screen py-6 px-4"
      style={{
        backgroundColor: '#f5e6c8',
        backgroundImage: `
          radial-gradient(circle at 20% 80%, rgba(139, 69, 19, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(139, 69, 19, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 50% 50%, rgba(255, 200, 100, 0.1) 0%, transparent 70%)
        `,
      }}
    >
      <div className="max-w-7xl mx-auto">
        <motion.header
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center mb-8"
        >
          <div className="relative inline-block">
            <h1
              className="text-6xl md:text-7xl mb-3"
              style={{
                fontFamily: '"Ma Shan Zheng", serif',
                color: '#8b4513',
                textShadow: '3px 3px 6px rgba(0,0,0,0.2)',
                letterSpacing: '0.1em',
              }}
            >
              长安木射
            </h1>
            <div
              className="absolute -top-2 -left-6 w-12 h-12 opacity-30"
              style={{
                background: 'radial-gradient(circle, #1a1a1a 0%, transparent 70%)',
                borderRadius: '50%',
              }}
            />
            <div
              className="absolute -bottom-1 -right-4 w-8 h-8 opacity-20"
              style={{
                background: 'radial-gradient(circle, #1a1a1a 0%, transparent 70%)',
                borderRadius: '50%',
              }}
            />
          </div>
          <p
            className="text-xl text-amber-800"
            style={{ fontFamily: '"Ma Shan Zheng", serif' }}
          >
            唐代宫廷游戏 · 修身养性
          </p>
        </motion.header>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-6 text-center"
        >
          <div
            className="inline-block bg-amber-100 border-2 border-amber-700 rounded-lg px-6 py-3 shadow-lg"
            style={{ fontFamily: '"Ma Shan Zheng", serif' }}
          >
            <span className="text-amber-900 text-lg">
              {gameStatus === 'ready' && '🎯 移动鼠标瞄准，按住鼠标蓄力，松开发球！'}
              {gameStatus === 'playing' && '🏃 球在滚动中...'}
              {gameStatus === 'roundEnd' && '⏳ 本轮结束'}
              {gameStatus === 'gameOver' && '🎉 游戏结束'}
            </span>
          </div>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="w-full lg:w-64 order-2 lg:order-1"
          >
            <ScorePanel />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex-1 flex justify-center order-1 lg:order-2"
          >
            <GameBoard />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="w-full lg:w-64 order-3"
          >
            <div className="space-y-4">
              <div
                className="bg-amber-100 border-4 border-amber-700 rounded-lg p-5 shadow-xl"
                style={{ fontFamily: '"Ma Shan Zheng", serif' }}
              >
                <h3
                  className="text-2xl text-amber-900 mb-4 text-center"
                  style={{ fontFamily: '"Ma Shan Zheng", serif' }}
                >
                  游戏规则
                </h3>
                <ul className="space-y-3 text-amber-800">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600">●</span>
                    <span>共十轮，每轮一击</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600">●</span>
                    <span>移动鼠标调整方向</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600">●</span>
                    <span>按住鼠标蓄力，力度条来回变化</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600">●</span>
                    <span>松开鼠标射出木球</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600">●</span>
                    <span>
                      <span className="text-red-700 font-bold">红字</span> 加10分
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600">●</span>
                    <span>
                      <span className="text-gray-900 font-bold">黑字</span> 减10分
                    </span>
                  </li>
                </ul>
              </div>

              <div
                className="bg-amber-100 border-4 border-amber-700 rounded-lg p-5 shadow-xl"
                style={{ fontFamily: '"Ma Shan Zheng", serif' }}
              >
                <h3
                  className="text-xl text-amber-900 mb-3 text-center"
                  style={{ fontFamily: '"Ma Shan Zheng", serif' }}
                >
                  关于木射
                </h3>
                <p className="text-amber-800 text-sm leading-relaxed">
                  木射，又称"十五柱球戏"，是唐代宫廷中盛行的一种投掷游戏。
                  游戏者在一端用木球滚击另一端的十五根木笋，
                  木笋上分别书写"仁义礼智信"等红字和"骄奢淫逸盗"等黑字，
                  击中红字者得分，击中黑字者扣分，以喻修身之道。
                </p>
              </div>

              <button
                onClick={resetGame}
                className="w-full py-3 bg-amber-700 hover:bg-amber-600 text-white text-xl rounded-lg transition-all transform hover:scale-105 shadow-lg border-2 border-amber-900"
                style={{ fontFamily: '"Ma Shan Zheng", serif' }}
              >
                🔄 重新开始
              </button>
            </div>
          </motion.div>
        </div>

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-8 text-center text-amber-700"
          style={{ fontFamily: '"Ma Shan Zheng", serif' }}
        >
          <p className="text-lg">🏮 大唐贞元年间 · 长安城 · 太平坊 🏮</p>
        </motion.footer>
      </div>
    </div>
  );
};

export default App;
