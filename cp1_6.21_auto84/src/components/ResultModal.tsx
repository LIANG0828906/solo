import React from 'react';
import type { Room, Player } from '../types';
import { Trophy, Skull, Zap, X, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import { UNIT_ICONS } from '../data/units';

interface ResultModalProps {
  room: Room;
  onClose: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({ room, onClose }) => {
  const navigate = useNavigate();
  const { reset } = useGameStore();

  const winner = room.players.find((p) => p.id === room.winner);
  const losers = room.players.filter((p) => p.id !== room.winner);

  const getSkillCount = (player: Player) => {
    return player.units.reduce((sum, u) => sum + u.skillTriggered, 0);
  };

  const getAliveUnits = (player: Player) => {
    return player.units.filter((u) => u.health > 0);
  };

  const handleBackToHome = () => {
    reset();
    navigate('/');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-bold text-gray-800">
            战斗结算
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-4 animate-float">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-1">
            {winner ? `${winner.name} 获得胜利！` : '平局'}
          </h3>
          <p className="text-gray-500 text-sm">
            共进行 {room.currentRound} 回合
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-5 h-5 text-green-600" />
              <span className="font-bold text-green-800">胜利方</span>
            </div>
            {winner && (
              <div>
                <div className="font-bold text-lg text-gray-800 mb-2">
                  {winner.name}
                </div>
                <div className="flex gap-2 mb-2">
                  {getAliveUnits(winner).map((unit) => (
                    <div
                      key={unit.id}
                      className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-lg shadow-sm"
                    >
                      {UNIT_ICONS[unit.type]}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>剩余单位</span>
                    <span className="font-bold text-green-600">
                      {getAliveUnits(winner).length}/{winner.units.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>剩余血量</span>
                    <span className="font-bold text-green-600">
                      {winner.totalHealth}/{winner.maxTotalHealth}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>技能触发</span>
                    <span className="font-bold text-purple-600">
                      {getSkillCount(winner)}次
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-gradient-to-br from-red-50 to-rose-100 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Skull className="w-5 h-5 text-red-600" />
              <span className="font-bold text-red-800">战败方</span>
            </div>
            {losers.map((loser) => (
              <div key={loser.id}>
                <div className="font-bold text-lg text-gray-800 mb-2">
                  {loser.name}
                </div>
                <div className="flex gap-2 mb-2">
                  {loser.units.map((unit) => (
                    <div
                      key={unit.id}
                      className={`w-8 h-8 rounded-lg bg-white flex items-center justify-center text-lg shadow-sm ${
                        unit.health <= 0 ? 'opacity-40 grayscale' : ''
                      }`}
                    >
                      {UNIT_ICONS[unit.type]}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>存活单位</span>
                    <span className="font-bold text-red-600">
                      {getAliveUnits(loser).length}/{loser.units.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>剩余血量</span>
                    <span className="font-bold text-red-600">
                      {loser.totalHealth}/{loser.maxTotalHealth}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>技能触发</span>
                    <span className="font-bold text-purple-600">
                      {getSkillCount(loser)}次
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-xl mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-purple-600" />
            <span className="font-bold text-gray-800">技能统计</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            {room.players.flatMap((player) =>
              player.units.map((unit) => (
                <div key={unit.id} className="p-2 bg-white rounded-lg">
                  <div className="text-lg mb-1">{UNIT_ICONS[unit.type]}</div>
                  <div className="text-gray-500">{unit.name}</div>
                  <div className="font-bold text-purple-600">
                    {unit.skillTriggered}次
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <button
          onClick={handleBackToHome}
          className="w-full gradient-btn flex items-center justify-center gap-2"
        >
          <Home className="w-5 h-5" />
          返回主界面
        </button>
      </div>
    </div>
  );
};
