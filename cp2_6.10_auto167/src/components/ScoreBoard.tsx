import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { Trophy, RotateCcw, Target, CircleDot, X } from 'lucide-react';

export const ScoreBoard = () => {
  const totalScore = useGameStore((state) => state.totalScore);
  const currentRound = useGameStore((state) => state.currentRound);
  const maxRounds = useGameStore((state) => state.maxRounds);
  const currentRoundScore = useGameStore((state) => state.currentRoundScore);
  const records = useGameStore((state) => state.records);
  const isPlaying = useGameStore((state) => state.isPlaying);
  const resetGame = useGameStore((state) => state.resetGame);
  const startGame = useGameStore((state) => state.startGame);

  const isGameOver = currentRound > maxRounds;
  const remainingRounds = Math.max(0, maxRounds - currentRound + 1);

  const getHitTypeLabel = (type: string) => {
    switch (type) {
      case 'mouth':
        return '壶口';
      case 'ear':
        return '壶耳';
      default:
        return '未中';
    }
  };

  const getHitTypeColor = (type: string) => {
    switch (type) {
      case 'mouth':
        return 'text-yellow-500';
      case 'ear':
        return 'text-green-500';
      default:
        return 'text-gray-400';
    }
  };

  const getHitTypeIcon = (type: string) => {
    switch (type) {
      case 'mouth':
        return <CircleDot className="w-4 h-4" />;
      case 'ear':
        return <Target className="w-4 h-4" />;
      default:
        return <X className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-full flex flex-col rounded-2xl p-6" style={{
      background: 'linear-gradient(145deg, #f5e6c8 0%, #e8d5a8 100%)',
      boxShadow: '0 8px 32px rgba(139, 69, 19, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
    }}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-[#8b4513] mb-1">计分板</h2>
        <div className="text-sm text-[#8b4513]/60">投壶雅戏</div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/50 rounded-xl p-4 text-center">
          <div className="text-xs text-[#8b4513]/60 mb-1">总积分</div>
          <motion.div
            key={totalScore}
            initial={{ scale: 1.2, color: '#c0392b' }}
            animate={{ scale: 1, color: '#c0392b' }}
            transition={{ duration: 0.3 }}
            className="text-3xl font-bold"
          >
            {totalScore}
          </motion.div>
        </div>

        <div className="bg-white/50 rounded-xl p-4 text-center">
          <div className="text-xs text-[#8b4513]/60 mb-1">本轮得分</div>
          <motion.div
            key={currentRoundScore}
            initial={{ scale: 1.2, y: -5 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`text-3xl font-bold ${
              currentRoundScore === 5 ? 'text-yellow-500' :
              currentRoundScore === 3 ? 'text-green-500' :
              currentRoundScore === 0 && records.length > 0 ? 'text-gray-400' :
              'text-[#8b4513]'
            }`}
          >
            {currentRoundScore > 0 ? `+${currentRoundScore}` : currentRoundScore}
          </motion.div>
        </div>
      </div>

      <div className="bg-white/30 rounded-xl p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-[#8b4513]">剩余轮次</span>
          <span className="text-lg font-bold text-[#c0392b]">
            {remainingRounds} / {maxRounds}
          </span>
        </div>
        <div className="w-full h-3 bg-[#8b4513]/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(to right, #c0392b, #e74c3c)',
            }}
            initial={false}
            animate={{ width: `${((currentRound - 1) / maxRounds) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <h3 className="text-sm font-bold text-[#8b4513] mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4" />
          投中记录
        </h3>
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          <AnimatePresence>
            {records.slice().reverse().map((record, index) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between bg-white/40 rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#8b4513]/60 w-8">
                    第{record.round}轮
                  </span>
                  <div className={`flex items-center gap-1 ${getHitTypeColor(record.hitType)}`}>
                    {getHitTypeIcon(record.hitType)}
                    <span className="text-sm font-medium">
                      {getHitTypeLabel(record.hitType)}
                    </span>
                  </div>
                </div>
                <span className={`font-bold ${
                  record.score > 0 ? 'text-[#c0392b]' : 'text-gray-400'
                }`}>
                  {record.score > 0 ? `+${record.score}` : '0'}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
          {records.length === 0 && (
            <div className="text-center text-[#8b4513]/40 py-8 text-sm">
              暂无记录
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-[#8b4513]/20">
        {!isPlaying ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={startGame}
            className="w-full py-4 rounded-xl font-bold text-white text-lg"
            style={{
              background: 'linear-gradient(145deg, #c0392b, #a93226)',
              boxShadow: '0 4px 15px rgba(192, 57, 43, 0.4)',
            }}
          >
            开始游戏
          </motion.button>
        ) : isGameOver ? (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-2xl font-bold text-[#c0392b] mb-4"
            >
              游戏结束！
            </motion.div>
            <div className="text-[#8b4513] mb-4">
              最终得分：
              <span className="text-3xl font-bold text-[#c0392b] ml-2">
                {totalScore}
              </span>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={resetGame}
              className="w-full py-4 rounded-xl font-bold text-white text-lg flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(145deg, #c0392b, #a93226)',
                boxShadow: '0 4px 15px rgba(192, 57, 43, 0.4)',
              }}
            >
              <RotateCcw className="w-5 h-5" />
              再来一局
            </motion.button>
          </div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={resetGame}
            className="w-full py-3 rounded-xl font-medium text-[#8b4513] flex items-center justify-center gap-2 bg-white/50 hover:bg-white/70 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            重新开始
          </motion.button>
        )}
      </div>
    </div>
  );
};
