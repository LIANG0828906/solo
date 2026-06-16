import React, { useState, useEffect } from 'react';
import { useBoardStore } from '../game/board';
import { createRoom, joinRoom } from '../network/roomManager';
import { Copy, Check, Users, DoorOpen, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const MatchModal: React.FC = () => {
  const { phase, roomCode, players, localPlayer } = useBoardStore();
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const show = phase === 'matching';

  const opponentPlayer = localPlayer === 'playerA' ? 'playerB' : 'playerA';
  const isWaiting = roomCode !== null && !players[opponentPlayer].connected;

  useEffect(() => {
    if (roomCode) {
      copyRoomCode(roomCode);
    }
  }, [roomCode]);

  const copyRoomCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const handleCreateRoom = async () => {
    setIsCreating(true);
    try {
      createRoom();
    } catch (err) {
      console.error('创建房间失败:', err);
    } finally {
      setTimeout(() => setIsCreating(false), 1000);
    }
  };

  const handleJoinRoom = () => {
    if (joinCode.length !== 4 || !/^\d{4}$/.test(joinCode)) {
      alert('请输入有效的4位数字房间码');
      return;
    }
    setIsJoining(true);
    try {
      joinRoom(joinCode);
    } catch (err) {
      console.error('加入房间失败:', err);
    } finally {
      setTimeout(() => setIsJoining(false), 1000);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)' }}
      />

      <div
        className="relative w-full max-w-md modal-enter"
      >
        <div
          className="rounded-3xl p-8 backdrop-blur-xl"
          style={{
            background: 'linear-gradient(145deg, #1A1A2EE0 0%, #16213EE0 100%)',
            border: '1px solid #00FF7F40',
            boxShadow: '0 0 60px #00FF7F20, inset 0 0 40px #FFFFFF05'
          }}
        >
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
              style={{
                background: 'linear-gradient(135deg, #00FF7F30 0%, #FF007F30 100%)',
                border: '2px solid #00FF7F60',
                boxShadow: '0 0 30px #00FF7F30'
              }}
            >
              <Users size={36} color="#00FF7F" strokeWidth={2} />
            </div>
            <h2
              className="text-3xl font-black text-white mb-2"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              LASER MAZE
            </h2>
            <p className="text-gray-400 text-sm" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              激光迷阵 · 双人对战
            </p>
          </div>

          {roomCode && isWaiting ? (
            <div className="space-y-6">
              <div
                className="rounded-2xl p-6"
                style={{
                  background: '#FFFFFF08',
                  border: '1px solid #00FF7F30'
                }}
              >
                <div className="text-center mb-4">
                  <div className="flex items-center justify-center gap-2 text-gray-300 mb-3">
                    <Loader2 size={18} className="animate-spin" color="#00FF7F" />
                    <span className="text-sm" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      等待对手加入...
                    </span>
                  </div>
                  <div className="flex justify-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-400 pulse-dot" style={{ animationDelay: '0s' }} />
                    <span className="w-2 h-2 rounded-full bg-green-400 pulse-dot" style={{ animationDelay: '0.2s' }} />
                    <span className="w-2 h-2 rounded-full bg-green-400 pulse-dot" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">你的房间码</p>
                  <div className="flex items-center justify-center gap-3">
                    <div
                      className="font-black tracking-widest"
                      style={{
                        fontFamily: 'Orbitron, sans-serif',
                        fontSize: '48px',
                        background: 'linear-gradient(135deg, #00FF7F 0%, #FFD700 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textShadow: '0 0 30px #00FF7F30'
                      }}
                    >
                      {roomCode}
                    </div>
                    <button
                      onClick={() => copyRoomCode(roomCode)}
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200',
                        copied
                          ? 'bg-green-500/20 border border-green-500/50'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
                      )}
                    >
                      {copied ? (
                        <Check size={20} color="#00FF7F" />
                      ) : (
                        <Copy size={20} className="text-gray-400" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {copied ? '已复制到剪贴板!' : '点击按钮复制房间码分享给对手'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <button
                onClick={handleCreateRoom}
                disabled={isCreating}
                className={cn(
                  'w-full py-4 rounded-2xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-3',
                  isCreating ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'
                )}
                style={{
                  background: 'linear-gradient(135deg, #00FF7F 0%, #00CC66 100%)',
                  boxShadow: '0 4px 20px #00FF7F40, inset 0 1px 0 rgba(255,255,255,0.2)'
                }}
              >
                <DoorOpen size={22} strokeWidth={2.5} />
                <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '16px' }}>
                  {isCreating ? '创建中...' : '创建房间'}
                </span>
              </button>

              <div className="flex items-center gap-4 py-2">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent to-gray-600" />
                <span className="text-gray-500 text-xs uppercase tracking-wider">或</span>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-gray-600" />
              </div>

              <div className="space-y-3">
                <label className="block text-sm text-gray-300" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  输入房间码加入对战
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="0000"
                    maxLength={4}
                    className="border-glow flex-1 px-5 py-4 rounded-2xl bg-white/5 border-2 outline-none text-white text-center font-bold placeholder-gray-600 transition-all"
                    style={{
                      fontFamily: 'Orbitron, sans-serif',
                      fontSize: '24px',
                      letterSpacing: '0.5em'
                    }}
                  />
                  <button
                    onClick={handleJoinRoom}
                    disabled={isJoining || joinCode.length !== 4}
                    className={cn(
                      'px-6 py-4 rounded-2xl font-bold text-white transition-all duration-300 flex items-center justify-center',
                      joinCode.length === 4 && !isJoining
                        ? 'hover:scale-[1.02] active:scale-[0.98]'
                        : 'opacity-50 cursor-not-allowed'
                    )}
                    style={{
                      background: 'linear-gradient(135deg, #FF007F 0%, #CC0066 100%)',
                      boxShadow: joinCode.length === 4 ? '0 4px 20px #FF007F40, inset 0 1px 0 rgba(255,255,255,0.2)' : 'none'
                    }}
                  >
                    <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '14px' }}>
                      {isJoining ? '加入...' : '加入'}
                    </span>
                  </button>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  请输入对手分享的4位房间码
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchModal;
