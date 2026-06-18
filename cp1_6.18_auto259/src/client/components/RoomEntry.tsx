import React, { useState, useRef, useEffect } from 'react';
import { Users, Plus, LogIn } from 'lucide-react';
import { useAppStore } from '../store';
import type { Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '../types';

interface RoomEntryProps {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
}

export const RoomEntry = ({ socket }: RoomEntryProps) => {
  const [roomId, setRoomId] = useState('');
  const [nickname, setNickname] = useState('');
  const [mode, setMode] = useState<'create' | 'join'>('join');
  const [error, setError] = useState('');
  const roomInputRef = useRef<HTMLInputElement>(null);
  const { setError: setStoreError } = useAppStore();

  useEffect(() => {
    roomInputRef.current?.focus();
  }, []);

  const handleRoomIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setRoomId(value);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStoreError(null);

    if (!roomId || roomId.length !== 4) {
      setError('请输入4位数字房间号');
      return;
    }

    if (!nickname.trim()) {
      setError('请输入昵称');
      return;
    }

    if (socket) {
      socket.emit('room:join', {
        roomId,
        nickname: nickname.trim(),
        isCreator: mode === 'create',
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0E17] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF8906] to-[#FF6B6B] mb-4 shadow-lg shadow-[#FF8906]/30">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            头脑风暴
          </h1>
          <p className="text-[#888899]">
            实时协作，让每个想法都被看见
          </p>
        </div>

        <div className="bg-[#1A1A2E] rounded-2xl p-6 border border-white/5 shadow-2xl">
          <div className="flex mb-6 bg-[#0F0E17] rounded-xl p-1">
            <button
              type="button"
              onClick={() => { setMode('join'); setError(''); }}
              className={`
                flex-1 py-2.5 px-4 rounded-lg text-sm font-medium
                transition-all duration-200
                ${mode === 'join'
                  ? 'bg-[#FF8906] text-white shadow-lg shadow-[#FF8906]/30'
                  : 'text-[#888899] hover:text-white'
                }
              `}
            >
              <LogIn className="w-4 h-4 inline mr-2" />
              加入房间
            </button>
            <button
              type="button"
              onClick={() => { setMode('create'); setError(''); }}
              className={`
                flex-1 py-2.5 px-4 rounded-lg text-sm font-medium
                transition-all duration-200
                ${mode === 'create'
                  ? 'bg-[#FF8906] text-white shadow-lg shadow-[#FF8906]/30'
                  : 'text-[#888899] hover:text-white'
                }
              `}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              创建房间
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-[#888899] mb-2">
                房间号
              </label>
              <input
                ref={roomInputRef}
                type="text"
                value={roomId}
                onChange={handleRoomIdChange}
                placeholder="请输入4位数字"
                className="
                  w-full px-4 py-3 rounded-xl
                  bg-[#0F0E17] border border-white/10
                  text-white text-center text-2xl tracking-[0.5em] font-mono
                  placeholder-[#555566]
                  focus:outline-none focus:border-[#FF8906] focus:ring-2 focus:ring-[#FF8906]/30
                  transition-all duration-200
                "
                maxLength={4}
              />
            </div>

            <div>
              <label className="block text-sm text-[#888899] mb-2">
                昵称
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => { setNickname(e.target.value); setError(''); }}
                placeholder="请输入您的昵称"
                className="
                  w-full px-4 py-3 rounded-xl
                  bg-[#0F0E17] border border-white/10
                  text-white
                  placeholder-[#555566]
                  focus:outline-none focus:border-[#FF8906] focus:ring-2 focus:ring-[#FF8906]/30
                  transition-all duration-200
                "
                maxLength={20}
              />
            </div>

            {error && (
              <div className="text-[#FF4D6D] text-sm text-center py-2 bg-[#FF4D6D]/10 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="
                w-full py-3.5 rounded-xl
                bg-[#FF8906] text-white font-medium
                hover:bg-[#FF9500] hover:shadow-xl hover:shadow-[#FF8906]/30
                active:scale-[0.98]
                transition-all duration-200
                relative overflow-hidden group
              "
            >
              <span className="relative z-10">
                {mode === 'create' ? '创建并进入房间' : '加入房间'}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </button>
          </form>
        </div>

        <p className="text-center text-[#555566] text-xs mt-6">
          输入相同的房间号即可与团队成员一起协作
        </p>
      </div>
    </div>
  );
};
