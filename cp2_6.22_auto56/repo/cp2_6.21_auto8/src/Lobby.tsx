import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from './GameStore';
import type { PlayerColor } from './types';

const COLORS: Array<{ value: PlayerColor; label: string; hex: string }> = [
  { value: 'red', label: '红方', hex: '#EF4444' },
  { value: 'blue', label: '蓝方', hex: '#3B82F6' },
  { value: 'yellow', label: '黄方', hex: '#F59E0B' },
  { value: 'green', label: '绿方', hex: '#22C55E' },
];

export default function Lobby() {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState('');
  const [selectedColor, setSelectedColor] = useState<PlayerColor>('red');
  const [numPlayers, setNumPlayers] = useState(2);
  const { initGame, setLocalPlayer } = useGameStore();

  const handleStart = () => {
    if (!playerName.trim()) return;

    const mockPlayers: Array<{ name: string; color: PlayerColor }> = [
      { name: playerName, color: selectedColor },
    ];

    const aiNames = ['小明', '小红', '小刚', '小丽'];
    const aiColors: PlayerColor[] = ['red', 'blue', 'yellow', 'green'].filter(
      (c) => c !== selectedColor,
    ) as PlayerColor[];

    for (let i = 0; i < numPlayers - 1; i++) {
      mockPlayers.push({
        name: aiNames[i % aiNames.length],
        color: aiColors[i % aiColors.length],
      });
    }

    initGame(mockPlayers);
    setLocalPlayer(mockPlayers[0].name);
    navigate('/game');
  };

  return (
    <div className="min-h-screen bg-[#5a3d2b] flex items-center justify-center p-4">
      <div
        className="bg-gradient-to-br from-amber-900/80 to-amber-950/90 rounded-2xl shadow-2xl p-8 max-w-md w-full border-4 border-[#c9a94e]"
        style={{
          backgroundImage: `
            linear-gradient(135deg, rgba(201, 169, 78, 0.1) 0%, transparent 50%, rgba(201, 169, 78, 0.1) 100%)
          `,
        }}
      >
        <h1
          className="text-4xl font-black text-center mb-2 text-[#c9a94e] drop-shadow-lg"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          飞行棋大作战
        </h1>
        <p className="text-amber-200/70 text-center mb-8">多人实时桌面对战</p>

        <div className="space-y-6">
          <div>
            <label className="block text-amber-100 text-sm font-medium mb-2">
              你的昵称
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="输入玩家昵称"
              className="w-full px-4 py-3 bg-amber-950/60 border-2 border-[#c9a94e]/50 rounded-lg text-white placeholder-amber-400/50 focus:outline-none focus:border-[#c9a94e] transition-colors"
              maxLength={12}
            />
          </div>

          <div>
            <label className="block text-amber-100 text-sm font-medium mb-2">
              选择颜色
            </label>
            <div className="grid grid-cols-4 gap-2">
              {COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSelectedColor(color.value)}
                  className={`relative p-3 rounded-lg border-2 transition-all ${
                    selectedColor === color.value
                      ? 'border-[#c9a94e] scale-105 shadow-lg'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: color.hex }}
                >
                  <span className="text-white text-sm font-bold drop-shadow">
                    {color.label}
                  </span>
                  {selectedColor === color.value && (
                    <span className="absolute -top-1 -right-1 text-[#c9a94e] text-lg">★</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-amber-100 text-sm font-medium mb-2">
              玩家数量: {numPlayers} 人
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[2, 3, 4].map((num) => (
                <button
                  key={num}
                  onClick={() => setNumPlayers(num)}
                  className={`py-3 rounded-lg border-2 transition-all font-bold ${
                    numPlayers === num
                      ? 'bg-[#c9a94e] text-amber-900 border-[#c9a94e]'
                      : 'bg-amber-950/60 text-amber-100 border-[#c9a94e]/30 hover:border-[#c9a94e]/60'
                  }`}
                >
                  {num} 人
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={!playerName.trim()}
            className="w-full py-4 bg-gradient-to-r from-[#c9a94e] to-[#b8943b] text-amber-950 font-bold text-lg rounded-xl shadow-lg hover:from-[#d4b85e] hover:to-[#c9a94e] transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            开始游戏
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-[#c9a94e]/30">
          <h3 className="text-[#c9a94e] font-bold mb-3 text-sm">游戏规则</h3>
          <ul className="text-amber-100/70 text-xs space-y-1">
            <li>• 掷骰子点数1-6，点数6可将棋子从基地移出</li>
            <li>• 绕棋盘一圈返回起点即为归位，4子全部归位获胜</li>
            <li>• 落在敌方棋子格可踢回（多子除外）</li>
            <li>• 事件卡每局3张，落在☆格可补充</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
