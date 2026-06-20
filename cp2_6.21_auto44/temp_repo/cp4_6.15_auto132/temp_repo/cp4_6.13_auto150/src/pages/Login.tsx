import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { ApiService } from '@/services/ApiService';
import { wsService } from '@/services/WebSocketService';
import { ThemeToggle } from '@/components/ThemeToggle';
import { generateRoomCode } from '@/utils/format';

export function Login() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const theme = useStore((state) => state.theme);
  const setUser = useStore((state) => state.setUser);
  const setRoom = useStore((state) => state.setRoom);
  const setSubmissions = useStore((state) => state.setSubmissions);
  const setAssignedSubmissions = useStore((state) => state.setAssignedSubmissions);
  const setPhase = useStore((state) => state.setPhase);
  const setReviewProgress = useStore((state) => state.setReviewProgress);
  
  const handleGenerateCode = async () => {
    setIsLoading(true);
    try {
      const code = await ApiService.generateRoomCode();
      setRoomCode(code);
    } catch {
      const newCode = generateRoomCode();
      setRoomCode(newCode);
    }
    setIsLoading(false);
  };
  
  const handleJoin = async () => {
    if (!nickname.trim()) {
      setError('请输入昵称');
      return;
    }
    if (!roomCode.trim() || roomCode.length !== 6) {
      setError('请输入6位房间码');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await ApiService.login({
        nickname: nickname.trim(),
        roomCode: roomCode.trim().toUpperCase(),
      });
      
      setUser(response.user);
      setRoom(response.room);
      setSubmissions(response.submissions);
      setAssignedSubmissions(response.assignedSubmissions);
      setPhase('reviewing');
      setReviewProgress(0, response.assignedSubmissions.length);
      
      wsService.connect(response.room.id);
      
      navigate('/review');
    } catch (err) {
      setError('登录失败，请检查房间码是否正确');
    }
    
    setIsLoading(false);
  };
  
  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 transition-theme duration-300 ${
        theme === 'dark' ? 'bg-dark-bg' : 'bg-light-bg'
      }`}
    >
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div
        className={`w-full max-w-md p-8 rounded-2xl shadow-xl animate-fade-in transition-theme duration-300 ${
          theme === 'dark' ? 'bg-dark-card' : 'bg-light-card'
        }`}
      >
        <div className="text-center mb-8">
          <h1
            className={`text-3xl font-bold font-inter mb-2 ${
              theme === 'dark' ? 'text-dark-text' : 'text-light-text'
            }`}
          >
            PeerReview
          </h1>
          <p
            className={`text-sm ${
              theme === 'dark' ? 'text-dark-text/60' : 'text-light-text/60'
            }`}
          >
            小组互评与反馈看板
          </p>
        </div>
        
        <div className="space-y-6">
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-dark-text' : 'text-light-text'
              }`}
            >
              👤 昵称
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="请输入你的昵称"
              maxLength={20}
              className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 ${
                theme === 'dark'
                  ? 'bg-dark-bg border-dark-accent1 text-dark-text placeholder-dark-text/40 focus:border-dark-accent2'
                  : 'bg-light-bg border-gray-200 text-light-text placeholder-light-text/40 focus:border-light-accent1'
              } focus:outline-none focus:ring-2 focus:ring-gradient-start/20`}
            />
          </div>
          
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-dark-text' : 'text-light-text'
              }`}
            >
              🏠 房间码
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="6位房间码"
                maxLength={6}
                className={`flex-1 px-4 py-3 rounded-lg border transition-all duration-200 ${
                  theme === 'dark'
                    ? 'bg-dark-bg border-dark-accent1 text-dark-text placeholder-dark-text/40 focus:border-dark-accent2'
                    : 'bg-light-bg border-gray-200 text-light-text placeholder-light-text/40 focus:border-light-accent1'
                } focus:outline-none focus:ring-2 focus:ring-gradient-start/20`}
              />
              <button
                onClick={handleGenerateCode}
                disabled={isLoading}
                className={`px-4 py-3 rounded-lg transition-all duration-200 ${
                  theme === 'dark'
                    ? 'bg-dark-accent1 hover:bg-dark-accent1/80 text-dark-text'
                    : 'bg-gray-100 hover:bg-gray-200 text-light-text'
                } disabled:opacity-50`}
              >
                {isLoading ? '⏳' : '🎲'}
              </button>
            </div>
            <p
              className={`text-xs mt-2 ${
                theme === 'dark' ? 'text-dark-text/40' : 'text-light-text/40'
              }`}
            >
              点击🎲生成新房间码，或输入已有房间码加入
            </p>
          </div>
          
          {error && (
            <div className="px-4 py-3 rounded-lg bg-score-low/20 text-score-low text-sm">
              ⚠️ {error}
            </div>
          )}
          
          <button
            onClick={handleJoin}
            disabled={isLoading}
            className={`w-full py-4 rounded-lg font-medium text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:hover:scale-100`}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                正在连接...
              </span>
            ) : (
              '🚀 加入房间'
            )}
          </button>
        </div>
        
        <div
          className={`mt-6 text-center text-xs ${
            theme === 'dark' ? 'text-dark-text/40' : 'text-light-text/40'
          }`}
        >
          <p>房间码不存在时将自动创建新房间</p>
        </div>
      </div>
    </div>
  );
}