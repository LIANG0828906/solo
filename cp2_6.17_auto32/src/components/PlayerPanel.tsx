import React from 'react';
import { useBoardStore } from '../game/board';
import { INITIAL_LIVES, COLORS } from '../game/types';
import { User, Clock, Target, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlayerPanelProps {
  player: 'playerA' | 'playerB';
}

const PlayerPanel: React.FC<PlayerPanelProps> = ({ player }) => {
  const { players, timeRemaining, currentTurn, localPlayer } = useBoardStore();

  const playerData = players[player];
  const isCurrentTurn = currentTurn === player;
  const isLocalPlayer = localPlayer === player;

  const lives = playerData.lives;
  const maxLives = INITIAL_LIVES;
  const livesRatio = lives / maxLives;

  const getHealthGradient = () => {
    if (livesRatio > 0.66) {
      return 'linear-gradient(90deg, #00FF7F 0%, #00CC66 100%)';
    } else if (livesRatio > 0.33) {
      return 'linear-gradient(90deg, #FFD700 0%, #FF9900 100%)';
    } else {
      return 'linear-gradient(90deg, #FF4444 0%, #CC0000 100%)';
    }
  };

  const playerColor = player === 'playerA' ? COLORS.playerA : COLORS.playerB;
  const playerName = player === 'playerA' ? '玩家 A (红方)' : '玩家 B (蓝方)';

  return (
    <div
      className="rounded-2xl p-5 backdrop-blur-md transition-all duration-300"
      style={{
        background: '#FFFFFF10',
        border: isCurrentTurn ? `2px solid ${playerColor}` : '1px solid #00FF7F40',
        boxShadow: isCurrentTurn
          ? `0 0 30px ${playerColor}30, 0 0 0 3px ${playerColor}20, inset 0 0 20px ${playerColor}10`
          : 'inset 0 0 20px #FFFFFF05'
      }}
    >
      <div className="flex items-center gap-4 mb-4">
        <div
          className="relative w-14 h-14 rounded-full flex items-center justify-center"
          style={{
            background: `${playerColor}20`,
            border: `2px solid ${playerColor}`,
            boxShadow: `0 0 15px ${playerColor}40`
          }}
        >
          <User size={28} color={playerColor} strokeWidth={2} />
          {isLocalPlayer && (
            <div
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
              style={{ background: '#00FF7F' }}
            >
              你
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3
            className="text-white font-semibold text-lg"
            style={{ fontFamily: 'Rajdhani, sans-serif' }}
          >
            {playerName}
          </h3>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                playerData.connected ? 'bg-green-400' : 'bg-gray-500'
              )}
            />
            <span className="text-xs text-gray-400">
              {playerData.connected ? '已连接' : '等待连接'}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Shield size={16} color="#00FF7F" />
            <span className="text-sm text-gray-300">生命值</span>
          </div>
          <span
            className="text-sm font-bold"
            style={{ color: livesRatio <= 0.33 ? '#FF4444' : '#00FF7F' }}
          >
            {lives} / {maxLives}
          </span>
        </div>
        <div
          className={cn(
            'h-3 rounded-full overflow-hidden bg-gray-800',
            livesRatio <= 0.33 && 'life-low'
          )}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(lives / maxLives) * 100}%`,
              background: getHealthGradient(),
              boxShadow: livesRatio <= 0.33 ? '0 0 10px #FF444480' : 'none'
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div
          className="rounded-xl p-3"
          style={{ background: '#FFFFFF08' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Target size={14} color="#FFD700" />
            <span className="text-xs text-gray-400">得分</span>
          </div>
          <div
            className="font-bold"
            style={{
              fontFamily: 'Orbitron, sans-serif',
              fontSize: '24px',
              color: '#FFD700',
              textShadow: '0 0 10px #FFD70040'
            }}
          >
            {playerData.score}
          </div>
        </div>

        <div
          className="rounded-xl p-3"
          style={{ background: '#FFFFFF08' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Clock size={14} color="#00FF7F" />
            <span className="text-xs text-gray-400">剩余时间</span>
          </div>
          <div
            className="font-bold"
            style={{
              fontFamily: 'Orbitron, sans-serif',
              fontSize: '24px',
              color: isCurrentTurn ? '#00FF7F' : '#888888',
              textShadow: isCurrentTurn ? '0 0 10px #00FF7F40' : 'none'
            }}
          >
            {timeRemaining}s
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerPanel;
