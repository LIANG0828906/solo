import { useState } from 'react';
import { useGameStore } from '../store';
import { wsService } from '../buzzer/websocketService';
import { Users, Play } from 'lucide-react';

export default function WaitingRoom() {
  const [nickname, setNickname] = useState('');
  const [joined, setJoined] = useState(false);
  const players = useGameStore((s) => s.players);
  const currentPlayerId = useGameStore((s) => s.currentPlayerId);

  const handleJoin = () => {
    if (!nickname.trim()) return;
    wsService.connect(nickname.trim());
    const id = wsService.getCurrentPlayerId();
    useGameStore.getState().setCurrentPlayerId(id);
    setJoined(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleJoin();
  };

  const handleStart = () => {
    wsService.startGame();
  };

  const isHost = players.length > 0 && players[0].id === currentPlayerId;

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full">
      <h1 className="neon-title text-5xl md:text-6xl font-bold mb-2">BuzzWise</h1>
      <p className="text-[#A0A0A0] text-[0.9em] mb-10">在线知识竞技场</p>

      <div className="glass-panel w-full max-w-md p-8 mb-8">
        {!joined ? (
          <div className="flex flex-col items-center gap-4">
            <Users className="w-10 h-10 text-[#6C63FF] mb-2" />
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入你的昵称..."
              maxLength={8}
              className="w-full bg-[#1A1A2E] border border-[#FFFFFF30] rounded-xl px-4 py-3 text-white placeholder-[#666] focus:outline-none focus:border-[#6C63FF] transition-colors text-center"
            />
            <button
              onClick={handleJoin}
              disabled={!nickname.trim()}
              className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
            >
              加入房间
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-wrap justify-center gap-4">
              {players.map((p) => (
                <div key={p.id} className="flex flex-col items-center gap-2">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg"
                    style={{ backgroundColor: p.avatarColor }}
                  >
                    {p.nickname.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-white text-sm">{p.nickname}</span>
                  {p.isHost && (
                    <span className="text-[#FFD700] text-xs">房主</span>
                  )}
                </div>
              ))}
            </div>

            <p className="text-[#A0A0A0] text-sm">
              {players.length}/4 人已加入
            </p>

            {isHost ? (
              <button
                onClick={handleStart}
                className="btn-primary flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                开始游戏
              </button>
            ) : (
              <p className="text-[#A0A0A0] text-sm animate-pulse">
                等待房主开始游戏...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
