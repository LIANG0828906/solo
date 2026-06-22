import { useState } from 'react';
import { useDebateStore, type Side } from '@/store/debateStore';
import { Users, Shuffle, ArrowRight, Trophy, MessageCircle, Vote } from 'lucide-react';

interface HomeProps {
  onEnterRoom: () => void;
}

export function Home({ onEnterRoom }: HomeProps) {
  const { 
    roomId, 
    setRoomId, 
    generateRoomId, 
    joinAs, 
    setUserName, 
    userName 
  } = useDebateStore();
  
  const [roomInput, setRoomInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [step, setStep] = useState<'room' | 'role'>('room');
  const [error, setError] = useState('');

  const handleCreateRoom = () => {
    generateRoomId();
    setStep('role');
  };

  const handleJoinRoom = () => {
    if (!roomInput.trim()) {
      setError('请输入房间号');
      return;
    }
    setRoomId(roomInput.trim().toUpperCase());
    setStep('role');
    setError('');
  };

  const handleSelectRole = (side: Side | 'audience') => {
    if (!nameInput.trim()) {
      setError('请输入你的名字');
      return;
    }
    
    if (side !== 'audience') {
      joinAs(side, nameInput.trim());
    } else {
      setUserName(nameInput.trim());
    }
    setError('');
    onEnterRoom();
  };

  return (
    <div className="home-page min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ backgroundColor: '#4A90D9' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ backgroundColor: '#E63946' }} />
      </div>

      <div className="home-card w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, #4A90D9, #E63946)' }}>
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">虚拟辩论赛</h1>
          <p className="text-gray-400">实时辩论 · 观众投票 · 智能记录</p>
        </div>

        {step === 'room' ? (
          <div className="space-y-6">
            <div className="feature-grid grid grid-cols-3 gap-3 mb-8">
              <div className="feature-item p-3 rounded-xl text-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                <MessageCircle className="w-6 h-6 mx-auto mb-2" style={{ color: '#4A90D9' }} />
                <span className="text-xs text-gray-400">实时辩论</span>
              </div>
              <div className="feature-item p-3 rounded-xl text-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                <Vote className="w-6 h-6 mx-auto mb-2" style={{ color: '#E63946' }} />
                <span className="text-xs text-gray-400">观众投票</span>
              </div>
              <div className="feature-item p-3 rounded-xl text-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                <Trophy className="w-6 h-6 mx-auto mb-2" style={{ color: '#FFD700' }} />
                <span className="text-xs text-gray-400">智能统计</span>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">房间号</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={roomInput}
                  onChange={(e) => {
                    setRoomInput(e.target.value.toUpperCase());
                    setError('');
                  }}
                  placeholder="输入房间号"
                  className="flex-1 px-4 py-3 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all"
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '2px solid transparent',
                  }}
                  maxLength={8}
                />
                <button
                  onClick={handleJoinRoom}
                  className="px-6 py-3 rounded-xl font-medium text-white transition-all duration-200 flex items-center gap-2"
                  style={{ backgroundColor: '#4A90D9' }}
                >
                  加入
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 text-sm text-gray-500" style={{ background: 'linear-gradient(135deg, #1A1A2E, #16213E)' }}>
                  或
                </span>
              </div>
            </div>

            <button
              onClick={handleCreateRoom}
              className="w-full py-4 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2"
              style={{ 
                background: 'linear-gradient(135deg, #E63946, #C62828)',
                boxShadow: '0 4px 20px rgba(230, 57, 70, 0.3)',
              }}
            >
              <Shuffle size={20} />
              创建新房间
            </button>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="room-info text-center p-4 rounded-xl" style={{ backgroundColor: 'rgba(74, 144, 217, 0.1)' }}>
              <span className="text-sm text-gray-400">房间号</span>
              <div className="text-2xl font-bold text-white mt-1 tracking-wider">{roomId}</div>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">你的名字</label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => {
                  setNameInput(e.target.value);
                  setError('');
                }}
                placeholder="请输入你的名字"
                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '2px solid transparent',
                }}
                maxLength={20}
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-3 block">选择身份</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleSelectRole('pro')}
                  className="role-card p-4 rounded-xl text-center transition-all duration-200 border-2"
                  style={{ 
                    backgroundColor: 'rgba(74, 144, 217, 0.1)',
                    borderColor: 'rgba(74, 144, 217, 0.3)',
                  }}
                >
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2"
                    style={{ backgroundColor: '#4A90D9' }}
                  >
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-white">正方</span>
                </button>

                <button
                  onClick={() => handleSelectRole('con')}
                  className="role-card p-4 rounded-xl text-center transition-all duration-200 border-2"
                  style={{ 
                    backgroundColor: 'rgba(230, 57, 70, 0.1)',
                    borderColor: 'rgba(230, 57, 70, 0.3)',
                  }}
                >
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2"
                    style={{ backgroundColor: '#E63946' }}
                  >
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-white">反方</span>
                </button>

                <button
                  onClick={() => handleSelectRole('audience')}
                  className="role-card p-4 rounded-xl text-center transition-all duration-200 border-2"
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2"
                    style={{ backgroundColor: '#6B7280' }}
                  >
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-white">观众</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => setStep('room')}
              className="w-full py-3 rounded-xl font-medium text-gray-400 transition-all duration-200 hover:text-white"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
            >
              返回上一步
            </button>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}
          </div>
        )}
      </div>

      <style>{`
        .home-page {
          background: linear-gradient(135deg, #1A1A2E 0%, #16213E 100%);
          font-family: 'Inter', sans-serif;
        }
        .home-card {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          animation: fadeInUp 0.6s ease;
        }
        .role-card:hover {
          transform: translateY(-4px);
        }
        .role-card:active {
          transform: translateY(-1px);
        }
        button:hover {
          filter: brightness(1.1);
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
