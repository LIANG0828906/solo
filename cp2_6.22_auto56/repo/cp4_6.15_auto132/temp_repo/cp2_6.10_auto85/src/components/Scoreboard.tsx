import { motion } from 'framer-motion';
import { COLORS } from '../gameLogic';

interface ScoreboardProps {
  playerScore: number;
  aiScore: number;
  gameTime: string;
}

export default function Scoreboard({ playerScore, aiScore, gameTime }: ScoreboardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10"
    >
      <div
        className="px-8 py-4 rounded-xl shadow-2xl flex items-center gap-8"
        style={{
          background: `linear-gradient(135deg, rgba(184, 115, 51, 0.95), rgba(139, 90, 43, 0.95))`,
          border: '3px solid #d4a76a',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${COLORS.playerVest}, #d4a017)`,
              boxShadow: '0 2px 8px rgba(244, 197, 66, 0.5)',
            }}
          />
          <span
            className="text-white font-bold text-3xl"
            style={{ fontFamily: 'serif', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
          >
            黄队
          </span>
          <span
            className="text-white font-bold text-5xl min-w-[60px] text-center"
            style={{ fontFamily: 'serif', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
          >
            {playerScore}
          </span>
        </div>

        <div className="text-white/50 text-4xl font-bold">:</div>

        <div className="flex items-center gap-3">
          <span
            className="text-white font-bold text-5xl min-w-[60px] text-center"
            style={{ fontFamily: 'serif', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
          >
            {aiScore}
          </span>
          <span
            className="text-white font-bold text-3xl"
            style={{ fontFamily: 'serif', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
          >
            红队
          </span>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${COLORS.aiVest}, #a02a1b)`,
              boxShadow: '0 2px 8px rgba(192, 58, 43, 0.5)',
            }}
          />
        </div>

        <div className="border-l-2 border-white/30 pl-6 ml-2">
          <div
            className="text-yellow-200 text-2xl font-bold text-center"
            style={{ fontFamily: 'serif', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
          >
            {gameTime}
          </div>
          <div className="text-white/60 text-xs text-center">比赛时间</div>
        </div>
      </div>
    </motion.div>
  );
}
