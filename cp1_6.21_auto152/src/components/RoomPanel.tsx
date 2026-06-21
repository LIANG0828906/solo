import { useState } from 'react';
import { Users, Wifi, WifiOff, LogOut, Plus, ArrowRight } from 'lucide-react';
import { useGameContext } from '@/contexts/GameContext';
import { breathAnimation } from '@/utils/animations';

export default function RoomPanel() {
  const { roomState, createRoom, joinRoom, leaveRoom, socketConnected } = useGameContext();
  const [mode, setMode] = useState<'create' | 'join' | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!playerName.trim()) return;
    setLoading(true);
    await createRoom(playerName.trim());
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!playerName.trim() || !roomCode.trim()) return;
    setLoading(true);
    await joinRoom(roomCode.trim(), playerName.trim());
    setLoading(false);
  };

  const handleSolo = () => {
    leaveRoom();
    setMode(null);
  };

  if (roomState) {
    return (
      <div
        className="w-full max-w-md mx-auto rounded-2xl p-6"
        style={{ background: 'rgba(45, 27, 78, 0.9)', backdropFilter: 'blur(5px)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Users size={20} />
            房间
          </h3>
          <div className="flex items-center gap-2">
            {socketConnected ? (
              <Wifi size={16} className="text-green-400" />
            ) : (
              <WifiOff size={16} className="text-red-400" />
            )}
            <span className="text-xs text-white/50">
              {socketConnected ? '已连接' : '未连接'}
            </span>
          </div>
        </div>

        <div className="bg-black/30 rounded-lg p-4 mb-4 text-center">
          <div className="text-xs text-white/50 mb-1">房间代码</div>
          <div className="text-3xl font-mono font-bold tracking-widest text-yellow-400">
            {roomState.roomId}
          </div>
        </div>

        <div className="mb-4">
          <div className="text-xs text-white/50 mb-2">玩家列表</div>
          {roomState.players.map((player, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 px-3 rounded-lg mb-1"
              style={{
                background: i === roomState.currentPlayerIndex ? 'rgba(255, 215, 0, 0.15)' : 'transparent',
                borderLeft: i === roomState.currentPlayerIndex ? '3px solid #FFD700' : '3px solid transparent',
              }}
            >
              <span className="text-white text-sm">
                {player}
                {i === roomState.currentPlayerIndex && (
                  <span className="ml-2 text-xs text-yellow-400">← 当前</span>
                )}
              </span>
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: i === roomState.currentPlayerIndex ? '#FFD700' : '#4D79FF' }}
              />
            </div>
          ))}
        </div>

        <button
          className="w-full py-2 rounded-lg text-white/70 text-sm flex items-center justify-center gap-2 hover:text-white transition-colors"
          style={{ background: 'rgba(26, 15, 46, 0.5)' }}
          onClick={handleSolo}
        >
          <LogOut size={14} />
          返回单人模式
        </button>
      </div>
    );
  }

  return (
    <>
      <style>{breathAnimation()}</style>
      <div
        className="w-full max-w-md mx-auto rounded-2xl p-6"
        style={{ background: 'rgba(45, 27, 78, 0.9)', backdropFilter: 'blur(5px)' }}
      >
        <h3 className="text-xl font-bold text-white text-center mb-6 flex items-center justify-center gap-2">
          <Users size={20} />
          多人对战
        </h3>

        <div className="flex items-center justify-center gap-2 mb-4">
          {socketConnected ? (
            <Wifi size={14} className="text-green-400" />
          ) : (
            <WifiOff size={14} className="text-red-400" />
          )}
          <span className="text-xs text-white/50">
            {socketConnected ? '服务器已连接' : '服务器未连接'}
          </span>
        </div>

        {!mode && (
          <div className="space-y-3">
            <input
              className="w-full px-4 py-2 rounded-lg text-white text-sm outline-none"
              style={{ background: 'rgba(26, 15, 46, 0.6)', border: '1px solid #4a3075' }}
              placeholder="输入你的名字"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
            <button
              className="w-full py-3 rounded-lg text-white font-bold flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #4a3075, #6b4c9a)',
                animation: 'breath 2s ease-in-out infinite',
              }}
              onClick={() => setMode('create')}
            >
              <Plus size={18} />
              创建房间
            </button>
            <button
              className="w-full py-3 rounded-lg text-white font-bold flex items-center justify-center gap-2"
              style={{ background: 'rgba(26, 15, 46, 0.6)', border: '1px solid #4a3075' }}
              onClick={() => setMode('join')}
            >
              <ArrowRight size={18} />
              加入房间
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-3">
            <input
              className="w-full px-4 py-2 rounded-lg text-white text-sm outline-none"
              style={{ background: 'rgba(26, 15, 46, 0.6)', border: '1px solid #4a3075' }}
              placeholder="输入你的名字"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
            <button
              className="w-full py-3 rounded-lg text-white font-bold"
              style={{
                background: 'linear-gradient(135deg, #4a3075, #6b4c9a)',
                animation: 'breath 2s ease-in-out infinite',
              }}
              disabled={!playerName.trim() || loading}
              onClick={handleCreate}
            >
              {loading ? '创建中...' : '确认创建'}
            </button>
            <button
              className="w-full py-2 rounded-lg text-white/50 text-sm hover:text-white transition-colors"
              onClick={() => setMode(null)}
            >
              返回
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-3">
            <input
              className="w-full px-4 py-2 rounded-lg text-white text-sm outline-none"
              style={{ background: 'rgba(26, 15, 46, 0.6)', border: '1px solid #4a3075' }}
              placeholder="输入你的名字"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
            <input
              className="w-full px-4 py-2 rounded-lg text-white text-sm font-mono tracking-widest outline-none"
              style={{ background: 'rgba(26, 15, 46, 0.6)', border: '1px solid #4a3075' }}
              placeholder="输入6位房间代码"
              maxLength={6}
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, ''))}
            />
            <button
              className="w-full py-3 rounded-lg text-white font-bold"
              style={{
                background: 'linear-gradient(135deg, #4a3075, #6b4c9a)',
                animation: 'breath 2s ease-in-out infinite',
              }}
              disabled={!playerName.trim() || !roomCode.trim() || loading}
              onClick={handleJoin}
            >
              {loading ? '加入中...' : '确认加入'}
            </button>
            <button
              className="w-full py-2 rounded-lg text-white/50 text-sm hover:text-white transition-colors"
              onClick={() => setMode(null)}
            >
              返回
            </button>
          </div>
        )}
      </div>
    </>
  );
}
