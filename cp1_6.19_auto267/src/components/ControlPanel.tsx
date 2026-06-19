import React from 'react';
import { motion } from 'framer-motion';

interface ControlPanelProps {
  temperature: number;
  stirSpeed: number;
  successChance: number;
  onTemperatureChange: (temp: number) => void;
  onStirSpeedChange: (speed: number) => void;
  onSynthesize: () => void;
  canSynthesize: boolean;
  isSynthesizing: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  temperature,
  stirSpeed,
  successChance,
  onTemperatureChange,
  onStirSpeedChange,
  onSynthesize,
  canSynthesize,
  isSynthesizing,
}) => {
  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto mt-8">
      {/* 温度控制 */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span className="text-white/80 text-sm font-medium">加热温度</span>
          <motion.span
            key={temperature}
            initial={{ scale: 1.2, color: '#FFD700' }}
            animate={{ scale: 1, color: 'white' }}
            className="text-amber-400 font-bold text-lg"
          >
            {temperature}°C
          </motion.span>
        </div>
        <div className="relative">
          <div
            className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-2 rounded-full"
            style={{
              background:
                'linear-gradient(to right, #4FC3F7, #81D4FA, #FFE082, #FF8A65, #EF5350)',
            }}
          />
          <input
            type="range"
            min="0"
            max="300"
            value={temperature}
            onChange={(e) => onTemperatureChange(Number(e.target.value))}
            className="relative w-full h-2 opacity-0 cursor-pointer"
            disabled={isSynthesizing}
          />
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white shadow-lg pointer-events-none border-2 border-amber-400"
            style={{
              left: `calc(${(temperature / 300) * 100}% - 10px)`,
            }}
            animate={{
              boxShadow: `0 0 10px rgba(255, 215, 0, ${0.5 + Math.sin(Date.now() / 500) * 0.3})`,
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-white/40">
          <span>0°C</span>
          <span>300°C</span>
        </div>
      </div>

      {/* 搅拌速度控制 */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span className="text-white/80 text-sm font-medium">搅拌速度</span>
          <motion.span
            key={stirSpeed}
            initial={{ scale: 1.2, color: '#9C27B0' }}
            animate={{ scale: 1, color: 'white' }}
            className="text-purple-400 font-bold text-lg"
          >
            {stirSpeed}
          </motion.span>
        </div>
        <div className="relative">
          <div
            className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-2 rounded-full"
            style={{
              background:
                'linear-gradient(to right, #66BB6A, #9CCC65, #BA68C8, #9C27B0)',
            }}
          />
          <input
            type="range"
            min="1"
            max="10"
            value={stirSpeed}
            onChange={(e) => onStirSpeedChange(Number(e.target.value))}
            className="relative w-full h-2 opacity-0 cursor-pointer"
            disabled={isSynthesizing}
          />
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white shadow-lg pointer-events-none border-2 border-purple-400"
            style={{
              left: `calc(${((stirSpeed - 1) / 9) * 100}% - 10px)`,
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-white/40">
          <span>慢</span>
          <span>快</span>
        </div>
      </div>

      {/* 成功概率显示 */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-white/60 text-sm">合成成功率</span>
        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${successChance}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{
              background:
                successChance >= 60
                  ? 'linear-gradient(to right, #66BB6A, #4CAF50)'
                  : successChance >= 30
                  ? 'linear-gradient(to right, #FFB74D, #FF9800)'
                  : 'linear-gradient(to right, #EF5350, #F44336)',
            }}
          />
        </div>
        <motion.span
          key={successChance}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          className={`font-bold text-xl ${
            successChance >= 60
              ? 'text-green-400'
              : successChance >= 30
              ? 'text-amber-400'
              : 'text-red-400'
          }`}
        >
          {successChance}%
        </motion.span>
      </div>

      {/* 合成按钮 */}
      <motion.button
        className="py-4 px-8 rounded-xl font-bold text-white text-lg shadow-lg relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #7B2D8E 0%, #9B59B6 100%)',
          boxShadow: '0 4px 20px rgba(123, 45, 142, 0.4)',
        }}
        whileHover={canSynthesize && !isSynthesizing ? { scale: 1.05, boxShadow: '0 6px 25px rgba(123, 45, 142, 0.6)' } : {}}
        whileTap={canSynthesize && !isSynthesizing ? { scale: 0.98 } : {}}
        onClick={onSynthesize}
        disabled={!canSynthesize || isSynthesizing}
      >
        {isSynthesizing ? (
          <span className="flex items-center justify-center gap-2">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              ⚗️
            </motion.span>
            合成中...
          </span>
        ) : (
          '开始合成'
        )}
        {(!canSynthesize || isSynthesizing) && (
          <div className="absolute inset-0 bg-black/30 cursor-not-allowed" />
        )}
      </motion.button>

      {!canSynthesize && !isSynthesizing && (
        <p className="text-center text-white/40 text-sm">
          请放入至少 2 种材料
        </p>
      )}
    </div>
  );
};
