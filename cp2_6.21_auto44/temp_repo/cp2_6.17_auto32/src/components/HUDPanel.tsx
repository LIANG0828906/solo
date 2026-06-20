import React from 'react';
import { useBoardStore } from '../game/board';
import { INITIAL_LIVES, COLORS } from '../game/types';
import { User, Clock, Target, Shield, Crosshair } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HUDPanelProps {
  player: 'playerA' | 'playerB';
}

const HUDPanel: React.FC<HUDPanelProps> = ({ player }) => {
  const { players, timeRemaining, currentTurn, localPlayer, turnPhase, round, phase } = useBoardStore();

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
  const playerName = player === 'playerA' ? '玩家 A' : '玩家 B';
  const playerLabel = player === 'playerA' ? '红方' : '蓝方';

  return (
    <div
      className="rounded-2xl p-5 backdrop-blur-md transition-all duration-300 w-[220px]"
      style={{
        background: '#FFFFFF10',
        border: isCurrentTurn ? `2px solid ${playerColor}` : '1px solid #00FF7F40',
        boxShadow: isCurrentTurn
          ? `0 0 30px ${playerColor}30, 0 0 0 3px ${playerColor}20, inset 0 0 20px ${playerColor}10`
          : 'inset 0 0 20px #FFFFFF05'
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="relative w-12 h-12 rounded-full flex items-center justify-center"
          style={{
            background: `${playerColor}20`,
            border: `2px solid ${playerColor}`,
            boxShadow: `0 0 15px ${playerColor}40`
          }}
        >
          <User size={24} color={playerColor} strokeWidth={2} />
          {isLocalPlayer && (
            <div
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
              style={{ background: '#00FF7F' }}
            >
              你
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className="text-white font-semibold text-base truncate"
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
            <span className="text-xs text-gray-400" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              {playerLabel} · {playerData.connected ? '在线' : '离线'}
            </span>
          </div>
        </div>
      </div>

      {isCurrentTurn && phase === 'playing' && (
        <div
          className="mb-3 px-3 py-1.5 rounded-lg text-center text-xs font-bold"
          style={{
            background: `${playerColor}20`,
            border: `1px solid ${playerColor}40`,
            color: playerColor,
            fontFamily: 'Rajdhani, sans-serif',
            letterSpacing: '0.1em'
          }}
        >
          <Crosshair size={12} className="inline mr-1" />
          {turnPhase === 'adjust' ? '调整阶段' : '发射阶段'}
        </div>
      )}

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Shield size={14} color="#00FF7F" />
            <span className="text-xs text-gray-300" style={{ fontFamily: 'Rajdhani, sans-serif' }}>生命</span>
          </div>
          <span
            className="text-xs font-bold"
            style={{ color: livesRatio <= 0.33 ? '#FF4444' : '#00FF7F', fontFamily: 'Orbitron, sans-serif' }}
          >
            {lives}/{maxLives}
          </span>
        </div>
        <div
          className={cn(
            'h-2.5 rounded-full overflow-hidden bg-gray-800',
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

      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-xl p-2.5"
          style={{ background: '#FFFFFF08' }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Target size={12} color="#FFD700" />
            <span className="text-[10px] text-gray-400" style={{ fontFamily: 'Rajdhani, sans-serif' }}>得分</span>
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
          className="rounded-xl p-2.5"
          style={{ background: '#FFFFFF08' }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Clock size={12} color="#00FF7F" />
            <span className="text-[10px] text-gray-400" style={{ fontFamily: 'Rajdhani, sans-serif' }}>时间</span>
          </div>
          <div
            className="font-bold"
            style={{
              fontFamily: 'Orbitron, sans-serif',
              fontSize: '24px',
              color: isCurrentTurn ? (timeRemaining <= 5 ? '#FF4444' : '#00FF7F') : '#666666',
              textShadow: isCurrentTurn ? `0 0 10px ${timeRemaining <= 5 ? '#FF444440' : '#00FF7F40'}` : 'none'
            }}
          >
            {isCurrentTurn ? `${timeRemaining}` : '--'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HUDPanel;
