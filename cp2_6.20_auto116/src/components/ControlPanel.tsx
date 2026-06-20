import React from 'react';
import { Heart, Zap, Swords, SkipForward } from 'lucide-react';

interface ControlPanelProps {
  playerHealth: number;
  playerMaxHealth: number;
  playerMana: number;
  playerMaxMana: number;
  aiHealth: number;
  aiMaxHealth: number;
  aiMana: number;
  aiMaxMana: number;
  turnNumber: number;
  isPlayerTurn: boolean;
  onEndTurn: () => void;
  disabled?: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  playerHealth,
  playerMaxHealth,
  playerMana,
  playerMaxMana,
  aiHealth,
  aiMaxHealth,
  aiMana,
  aiMaxMana,
  turnNumber,
  isPlayerTurn,
  onEndTurn,
  disabled = false,
}) => {
  const healthPercentage = (playerHealth / playerMaxHealth) * 100;
  const aiHealthPercentage = (aiHealth / aiMaxHealth) * 100;

  return (
    <div
      className="p-4 rounded-xl space-y-4"
      style={{
        background: 'rgba(26, 26, 46, 0.85)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 215, 0, 0.2)',
      }}
    >
      <div className="text-center">
        <span
          className={`text-sm font-bold ${isPlayerTurn ? 'text-yellow-400' : 'text-gray-500'}`}
        >
          第 {turnNumber} 回合 - {isPlayerTurn ? '你的回合' : 'AI回合'}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Swords size={16} className="text-red-400" />
            <span className="text-gray-300">AI</span>
          </div>
          <span className="text-red-400 font-bold">
            {aiHealth}/{aiMaxHealth}
          </span>
        </div>
        <div className="h-3 rounded-full overflow-hidden bg-gray-700">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${aiHealthPercentage}%`,
              background: 'linear-gradient(90deg, #ff4444, #cc0000)',
            }}
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Zap size={14} className="text-blue-400" />
          <span>费用: {aiMana}/{aiMaxMana}</span>
        </div>
      </div>

      <div className="border-t border-gray-700/50 pt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Heart size={16} className="text-red-500" />
            <span className="text-gray-300">生命值</span>
          </div>
          <span className="text-red-400 font-bold">
            {playerHealth}/{playerMaxHealth}
          </span>
        </div>
        <div className="h-4 rounded-full overflow-hidden bg-gray-700">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${healthPercentage}%`,
              background: 'linear-gradient(90deg, #ff6b6b, #ee5a5a)',
              boxShadow: '0 0 10px rgba(255, 107, 107, 0.5)',
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-center gap-3">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle, #4a9eff, #2563eb)',
            boxShadow: '0 0 20px rgba(74, 158, 255, 0.5), inset 0 2px 4px rgba(255,255,255,0.3)',
          }}
        >
          <div className="text-center">
            <div className="text-white font-bold text-lg">{playerMana}</div>
            <div className="text-blue-200 text-xs">/{playerMaxMana}</div>
          </div>
        </div>
        <div className="text-gray-400 text-sm">
          <div>当前费用</div>
          <div className="text-xs">用于召唤卡牌</div>
        </div>
      </div>

      <button
        className="w-full py-3 rounded-xl font-bold text-white transition-all duration-200
                   hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                   disabled:hover:scale-100"
        style={{
          background: disabled
            ? 'linear-gradient(135deg, #666, #444)'
            : 'linear-gradient(135deg, #ffd700, #ff8c00)',
          boxShadow: disabled
            ? 'none'
            : '0 4px 15px rgba(255, 215, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
        }}
        onClick={onEndTurn}
        disabled={disabled || !isPlayerTurn}
      >
        <div className="flex items-center justify-center gap-2">
          <SkipForward size={20} />
          <span>结束回合</span>
        </div>
      </button>
    </div>
  );
};
