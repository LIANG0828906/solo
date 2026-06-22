import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { TOTAL_ROUNDS, SCORE_RULES } from '../game/constants';

export const ScorePanel: React.FC = () => {
  const round = useGameStore((state) => state.round);
  const score = useGameStore((state) => state.score);
  const pins = useGameStore((state) => state.pins);

  const redDownCount = pins.filter((p) => p.isDown && p.type === 'red').length;
  const blackDownCount = pins.filter((p) => p.isDown && p.type === 'black').length;
  const redTotalCount = pins.filter((p) => p.type === 'red').length;
  const blackTotalCount = pins.filter((p) => p.type === 'black').length;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      <div
        className="relative p-6 rounded-lg shadow-2xl border-4 overflow-hidden"
        style={{
          borderColor: '#8b4513',
          background: 'linear-gradient(135deg, #c9a66b 0%, #a67c52 50%, #c9a66b 100%)',
        }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 10px,
                rgba(139, 69, 19, 0.3) 10px,
                rgba(139, 69, 19, 0.3) 11px
              ),
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 30px,
                rgba(139, 69, 19, 0.2) 30px,
                rgba(139, 69, 19, 0.2) 32px
              )
            `,
          }}
        />

        <div className="relative z-10">
          <h2
            className="text-3xl text-center mb-6 text-amber-100"
            style={{
              fontFamily: '"Ma Shan Zheng", serif',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            }}
          >
            计分卷轴
          </h2>

          <div className="space-y-4">
            <div className="bg-amber-900 bg-opacity-40 rounded-lg p-4 border-2 border-amber-600">
              <div
                className="text-amber-100 text-lg mb-1"
                style={{ fontFamily: '"Ma Shan Zheng", serif' }}
              >
                当前轮次
              </div>
              <div
                className="text-4xl font-bold text-amber-100"
                style={{ fontFamily: '"Ma Shan Zheng", serif' }}
              >
                {round} / {TOTAL_ROUNDS}
              </div>
            </div>

            <div className="bg-amber-900 bg-opacity-40 rounded-lg p-4 border-2 border-amber-600">
              <div
                className="text-amber-100 text-lg mb-1"
                style={{ fontFamily: '"Ma Shan Zheng", serif' }}
              >
                总得分
              </div>
              <motion.div
                key={score}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.3 }}
                className={`text-5xl font-bold ${score >= 0 ? 'text-red-400' : 'text-gray-300'}`}
                style={{ fontFamily: '"Ma Shan Zheng", serif' }}
              >
                {score}
              </motion.div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-red-900 bg-opacity-50 rounded-lg p-3 border-2 border-red-700">
                <div
                  className="text-red-200 text-sm mb-1"
                  style={{ fontFamily: '"Ma Shan Zheng", serif' }}
                >
                  红字击倒
                </div>
                <div
                  className="text-2xl font-bold text-red-300"
                  style={{ fontFamily: '"Ma Shan Zheng", serif' }}
                >
                  {redDownCount} / {redTotalCount}
                </div>
                <div
                  className="text-xs text-red-300 mt-1"
                  style={{ fontFamily: '"Ma Shan Zheng", serif' }}
                >
                  每个 +{SCORE_RULES.red} 分
                </div>
              </div>

              <div className="bg-gray-900 bg-opacity-60 rounded-lg p-3 border-2 border-gray-600">
                <div
                  className="text-gray-300 text-sm mb-1"
                  style={{ fontFamily: '"Ma Shan Zheng", serif' }}
                >
                  黑字击倒
                </div>
                <div
                  className="text-2xl font-bold text-gray-300"
                  style={{ fontFamily: '"Ma Shan Zheng", serif' }}
                >
                  {blackDownCount} / {blackTotalCount}
                </div>
                <div
                  className="text-xs text-gray-400 mt-1"
                  style={{ fontFamily: '"Ma Shan Zheng", serif' }}
                >
                  每个 {SCORE_RULES.black} 分
                </div>
              </div>
            </div>

            <div className="bg-amber-900 bg-opacity-30 rounded-lg p-4 border-2 border-amber-700">
              <div
                className="text-amber-100 text-lg mb-3 text-center"
                style={{ fontFamily: '"Ma Shan Zheng", serif' }}
              >
                图例说明
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  <span
                    className="w-8 h-8 flex items-center justify-center bg-amber-100 rounded border-2 border-amber-700 text-red-700 font-bold"
                    style={{ fontFamily: '"Ma Shan Zheng", serif' }}
                  >
                    仁
                  </span>
                  <span
                    className="text-amber-100"
                    style={{ fontFamily: '"Ma Shan Zheng", serif' }}
                  >
                    仁义礼智信忠孝廉 - 加分
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="w-8 h-8 flex items-center justify-center bg-amber-100 rounded border-2 border-amber-700 text-gray-900 font-bold"
                    style={{ fontFamily: '"Ma Shan Zheng", serif' }}
                  >
                    骄
                  </span>
                  <span
                    className="text-amber-100"
                    style={{ fontFamily: '"Ma Shan Zheng", serif' }}
                  >
                    骄奢淫逸盗耻贪 - 减分
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="absolute top-0 left-0 w-full h-4"
          style={{
            background: 'linear-gradient(to bottom, #5d3a1a 0%, transparent 100%)',
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-full h-4"
          style={{
            background: 'linear-gradient(to top, #5d3a1a 0%, transparent 100%)',
          }}
        />
        <div
          className="absolute top-0 left-0 h-full w-3"
          style={{
            background: 'linear-gradient(to right, #5d3a1a 0%, transparent 100%)',
          }}
        />
        <div
          className="absolute top-0 right-0 h-full w-3"
          style={{
            background: 'linear-gradient(to left, #5d3a1a 0%, transparent 100%)',
          }}
        />
      </div>

      <div
        className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 rounded-full border-2 border-amber-800"
        style={{
          background: 'linear-gradient(180deg, #8b6914 0%, #6b4f0f 50%, #8b6914 100%)',
        }}
      />
      <div
        className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-16 h-6 rounded-full border-2 border-amber-800"
        style={{
          background: 'linear-gradient(180deg, #8b6914 0%, #6b4f0f 50%, #8b6914 100%)',
        }}
      />
    </motion.div>
  );
};
