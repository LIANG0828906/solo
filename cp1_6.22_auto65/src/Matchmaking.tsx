import React, { useState } from 'react';
import { Users, Gamepad2, Shuffle, LogIn, Crown, User } from 'lucide-react';
import { useGameStore } from './store/gameStore';
import { useWebSocket } from './hooks/useWebSocket';

interface MatchmakingProps {
  onStartGame?: () => void;
}

export const Matchmaking: React.FC<MatchmakingProps> = () => {
  const { nickname, setNickname, leaderboard, players, roomId, gameState } = useGameStore();
  const { send, isConnected } = useWebSocket();
  const [roomInput, setRoomInput] = useState('');
  const [localNickname, setLocalNickname] = useState(nickname || '');

  const handleRandomMatch = () => {
    if (!localNickname.trim()) return;
    setNickname(localNickname.trim());
    send({
      type: 'RANDOM_MATCH',
      nickname: localNickname.trim(),
    });
  };

  const handleCreateRoom = () => {
    if (!localNickname.trim()) return;
    setNickname(localNickname.trim());
    send({
      type: 'CREATE_ROOM',
      nickname: localNickname.trim(),
    });
  };

  const handleJoinRoom = () => {
    if (!localNickname.trim() || !roomInput.trim()) return;
    setNickname(localNickname.trim());
    send({
      type: 'JOIN_ROOM',
      nickname: localNickname.trim(),
      roomId: roomInput.trim().toUpperCase(),
    });
  };

  const getTrophyIcon = (index: number) => {
    if (index === 0) return <Crown className="w-6 h-6 text-yellow-400 trophy-1" />;
    if (index === 1) return <Crown className="w-6 h-6 text-gray-300 trophy-2" />;
    if (index === 2) return <Crown className="w-6 h-6 text-amber-600 trophy-3" />;
    return <span className="w-6 h-6 flex items-center justify-center text-gray-500 font-bold text-sm">{index + 1}</span>;
  };

  const isInRoom = roomId !== null && (gameState === 'waiting' || gameState === 'countdown');

  return (
    <div className="w-full h-full overflow-y-auto bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#1a1a2e]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="text-5xl md:text-6xl font-bold mb-3"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
            音律对战
          </h1>
          <p className="text-gray-400 text-lg">多人实时音乐节奏对战</p>
          <div className={`inline-flex items-center gap-2 mt-3 px-4 py-1 rounded-full text-sm ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            {isConnected ? '服务器已连接' : '连接中...'}
          </div>
        </div>

        {!isInRoom ? (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 card-hover">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Gamepad2 className="w-6 h-6 text-indigo-400" />
                开始对战
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">你的昵称</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      value={localNickname}
                      onChange={(e) => setLocalNickname(e.target.value)}
                      placeholder="输入昵称..."
                      maxLength={12}
                      className="w-full bg-white/5 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                    />
                  </div>
                </div>

                <button
                  onClick={handleRandomMatch}
                  disabled={!localNickname.trim() || !isConnected}
                  className="w-full btn-glow bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 text-lg"
                >
                  <Shuffle className="w-5 h-5" />
                  随机匹配
                </button>

                <button
                  onClick={handleCreateRoom}
                  disabled={!localNickname.trim() || !isConnected}
                  className="w-full btn-glow bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 text-lg"
                >
                  <Users className="w-5 h-5" />
                  创建房间
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-[#1a1a2e]/80 px-4 text-sm text-gray-500">或输入房间号加入</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={roomInput}
                    onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                    placeholder="房间号"
                    maxLength={6}
                    className="flex-1 bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all tracking-widest text-center font-mono text-lg"
                  />
                  <button
                    onClick={handleJoinRoom}
                    disabled={!localNickname.trim() || !roomInput.trim() || !isConnected}
                    className="btn-glow bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2"
                  >
                    <LogIn className="w-5 h-5" />
                    加入
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Crown className="w-6 h-6 text-yellow-400" />
                排行榜
              </h2>

              <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.playerId}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      index < 3
                        ? 'bg-gradient-to-r from-white/10 to-transparent'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                    style={{
                      boxShadow: index === 0 ? 'inset 0 0 20px rgba(255, 215, 0, 0.1)' : undefined,
                    }}
                  >
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                      {getTrophyIcon(index)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white truncate">{entry.nickname}</div>
                      <div className="text-sm text-gray-400">
                        胜率 {entry.winRate}% · {entry.totalGames} 场
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold" style={{
                        color: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#a78bfa'
                      }}>
                        {entry.wins}
                      </div>
                      <div className="text-xs text-gray-500">胜场</div>
                    </div>
                  </div>
                ))}

                {leaderboard.length === 0 && (
                  <div className="text-center py-10 text-gray-500">
                    暂无排行数据
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <div className="text-center mb-8">
              <div className="text-sm text-gray-400 mb-2">房间号</div>
              <div className="text-4xl font-bold font-mono tracking-widest text-white mb-4">
                {roomId}
              </div>
              <div className="text-gray-400">
                {gameState === 'countdown' ? '游戏即将开始...' : `等待玩家加入 (${players.length}/4)`}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[0, 1, 2, 3].map((index) => {
                const player = players[index];
                const colors = ['#3b82f6', '#ef4444', '#22c55e', '#eab308'];
                return (
                  <div
                    key={index}
                    className={`relative aspect-square rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
                      player ? 'scale-100' : 'scale-95 opacity-40'
                    }`}
                    style={{
                      borderColor: player ? colors[index] : 'rgba(255,255,255,0.1)',
                      backgroundColor: player ? colors[index] + '20' : 'rgba(255,255,255,0.03)',
                    }}
                  >
                    {player ? (
                      <>
                        <div
                          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-2"
                          style={{ backgroundColor: colors[index] }}
                        >
                          {player.nickname.charAt(0).toUpperCase()}
                        </div>
                        <div className="font-semibold text-white text-center px-2 truncate w-full">
                          {player.nickname}
                        </div>
                      </>
                    ) : (
                      <div className="text-5xl text-gray-600">?</div>
                    )}
                    <div className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full bg-black/40 text-gray-300">
                      P{index + 1}
                    </div>
                  </div>
                );
              })}
            </div>

            {gameState === 'waiting' && players.length >= 2 && (
              <div className="text-center text-green-400 animate-pulse">
                玩家已就位，即将开始...
              </div>
            )}

            {gameState === 'waiting' && players.length < 2 && (
              <div className="text-center text-gray-400">
                等待更多玩家加入...
              </div>
            )}
          </div>
        )}

        <div className="mt-10 text-center text-gray-500 text-sm">
          <p>按键说明：D / F / J / K 对应四条轨道</p>
          <p className="mt-1">移动端可直接点击屏幕下方按钮</p>
        </div>
      </div>
    </div>
  );
};
