import { useState, useRef, useEffect } from 'react';
import { Timer } from './Timer';
import { VotePanel } from '@/vote/VotePanel';
import { ChartDisplay } from '@/vote/ChartDisplay';
import { WordCloud } from '@/vote/WordCloud';
import { useDebateStore, type Side } from '@/store/debateStore';
import { Send, LogOut, Users, MessageSquare, Trophy } from 'lucide-react';

export function DebateRoom() {
  const {
    roomId,
    topic,
    currentRound,
    totalRounds,
    phase,
    proDebaters,
    conDebaters,
    arguments: allArguments,
    voteData,
    userSide,
    userName,
    addArgument,
    startDebate,
    resetDebate,
    setTopic,
  } = useDebateStore();

  const [argumentInput, setArgumentInput] = useState('');
  const [editingTopic, setEditingTopic] = useState(false);
  const [topicInput, setTopicInput] = useState(topic);
  const argumentsEndRef = useRef<HTMLDivElement>(null);

  const currentSpeakingSide: Side | null = phase === 'speaking-pro' ? 'pro' : phase === 'speaking-con' ? 'con' : null;
  const canSpeak = (side: Side) => currentSpeakingSide === side && userSide === side;

  useEffect(() => {
    argumentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allArguments]);

  const handleSubmitArgument = () => {
    if (!argumentInput.trim() || !currentSpeakingSide || !canSpeak(currentSpeakingSide)) return;
    addArgument(currentSpeakingSide, argumentInput.trim());
    setArgumentInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitArgument();
    }
  };

  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const handleTopicSave = () => {
    setTopic(topicInput);
    setEditingTopic(false);
  };

  return (
    <div className="debate-room h-screen flex flex-col overflow-hidden">
      <header className="header h-[60px] flex items-center justify-between px-6 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5" style={{ color: '#FFD700' }} />
            <span className="text-white font-semibold text-lg">虚拟辩论赛</span>
          </div>
          <div className="room-badge px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: 'rgba(74, 144, 217, 0.2)', color: '#4A90D9' }}>
            房间号: {roomId || '未设置'}
          </div>
        </div>

        <div className="flex-1 text-center px-4">
          {editingTopic ? (
            <div className="flex items-center justify-center gap-2">
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                className="bg-white/10 text-white text-base px-3 py-1 rounded-lg border border-white/20 focus:outline-none focus:border-blue-500 w-96"
                autoFocus
                onBlur={handleTopicSave}
                onKeyDown={(e) => e.key === 'Enter' && handleTopicSave()}
              />
            </div>
          ) : (
            <h1 
              className="text-white text-xl font-bold cursor-pointer hover:text-blue-300 transition-colors"
              onClick={() => {
                setTopicInput(topic);
                setEditingTopic(true);
              }}
              title="点击编辑辩题"
            >
              {topic}
            </h1>
          )}
        </div>

        <button 
          className="exit-btn px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200"
          style={{ borderColor: '#E63946', color: '#E63946' }}
          onClick={() => {
            if (confirm('确定要退出辩论吗？')) {
              resetDebate();
            }
          }}
        >
          <span className="flex items-center gap-1">
            <LogOut size={16} />
            退出
          </span>
        </button>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div className="pro-section md:w-[40%] flex flex-col p-4 md:p-6 border-r border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={20} style={{ color: '#4A90D9' }} />
              <h2 className="text-lg font-bold" style={{ color: '#4A90D9' }}>正方</h2>
              {currentSpeakingSide === 'pro' && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium animate-pulse" style={{ backgroundColor: 'rgba(74, 144, 217, 0.3)', color: '#4A90D9' }}>
                  发言中
                </span>
              )}
            </div>
            <span className="text-sm text-gray-500">{proDebaters.length} 人</span>
          </div>

          <div className="debater-list flex flex-wrap gap-2 mb-4">
            {proDebaters.map((debater) => (
              <div 
                key={debater.id} 
                className="debater-avatar flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{ backgroundColor: 'rgba(74, 144, 217, 0.15)' }}
              >
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ backgroundColor: '#4A90D9' }}
                >
                  {getInitial(debater.name)}
                </div>
                <span className="text-sm text-gray-300">{debater.name}</span>
                {debater.name === userName && (
                  <span className="text-xs text-blue-400">(我)</span>
                )}
              </div>
            ))}
            {proDebaters.length === 0 && (
              <span className="text-gray-500 text-sm">暂无辩手</span>
            )}
          </div>

          <div className="flex-1 arguments-area overflow-y-auto pr-2 space-y-3">
            {allArguments.filter(a => a.side === 'pro').map((arg) => (
              <div 
                key={arg.id}
                className="argument-card pro-argument p-3 rounded-xl"
                style={{ 
                  backgroundColor: 'rgba(74, 144, 217, 0.3)',
                  maxWidth: '220px',
                }}
              >
                <p className="text-sm text-gray-200">{arg.content}</p>
                <div className="text-xs text-gray-400 mt-1 text-right">
                  {formatTime(arg.timestamp)} · 第{arg.round}轮
                </div>
              </div>
            ))}
            <div ref={argumentsEndRef} />
          </div>

          <div className="mt-4">
            <div className="relative">
              <textarea
                value={argumentInput}
                onChange={(e) => setArgumentInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={canSpeak('pro') ? '输入你的论点...' : currentSpeakingSide === 'con' ? '等待对方发言...' : '辩论尚未开始'}
                disabled={!canSpeak('pro')}
                className="w-full p-3 pr-12 rounded-xl text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 transition-all"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: canSpeak('pro') ? '2px solid rgba(74, 144, 217, 0.5)' : '2px solid transparent',
                }}
                rows={2}
              />
              <button
                onClick={handleSubmitArgument}
                disabled={!canSpeak('pro') || !argumentInput.trim()}
                className="absolute right-3 bottom-3 p-2 rounded-lg transition-all duration-200"
                style={{ 
                  backgroundColor: canSpeak('pro') && argumentInput.trim() ? '#4A90D9' : 'rgba(255, 255, 255, 0.1)',
                  color: canSpeak('pro') && argumentInput.trim() ? 'white' : '#666',
                }}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="center-section md:w-[20%] flex flex-col items-center justify-center p-4 border-y md:border-y-0 md:border-l md:border-r border-white/5 flex-shrink-0 md:flex-shrink">
          <div className="round-info text-center mb-6">
            <div className="text-sm text-gray-500 mb-1">
              第 {currentRound} / {totalRounds} 轮
            </div>
            <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden mx-auto">
              <div 
                className="h-full transition-all duration-500"
                style={{ 
                  width: `${(currentRound / totalRounds) * 100}%`,
                  background: 'linear-gradient(90deg, #4A90D9, #E63946)',
                }}
              />
            </div>
          </div>

          <Timer />

          <div className="mt-8 flex flex-col gap-3">
            {phase === 'waiting' && (
              <button
                onClick={startDebate}
                className="start-btn px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200"
                style={{ 
                  background: 'linear-gradient(135deg, #4A90D9, #357ABD)',
                  boxShadow: '0 4px 15px rgba(74, 144, 217, 0.4)',
                }}
              >
                开始辩论
              </button>
            )}
            {phase === 'finished' && (
              <button
                onClick={resetDebate}
                className="restart-btn px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200"
                style={{ 
                  background: 'linear-gradient(135deg, #E63946, #C62828)',
                  boxShadow: '0 4px 15px rgba(230, 57, 70, 0.4)',
                }}
              >
                重新开始
              </button>
            )}
          </div>

          {phase !== 'waiting' && phase !== 'finished' && (
            <div className="mt-6 text-center">
              <div className="text-xs text-gray-500 mb-2 flex items-center justify-center gap-1">
                <MessageSquare size={12} />
                实时投票
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span style={{ color: '#4A90D9' }}>{voteData.proVotes}</span>
                <span className="text-gray-600">:</span>
                <span style={{ color: '#E63946' }}>{voteData.conVotes}</span>
              </div>
            </div>
          )}
        </div>

        <div className="con-section md:w-[40%] flex flex-col p-4 md:p-6 border-l border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={20} style={{ color: '#E63946' }} />
              <h2 className="text-lg font-bold" style={{ color: '#E63946' }}>反方</h2>
              {currentSpeakingSide === 'con' && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium animate-pulse" style={{ backgroundColor: 'rgba(230, 57, 70, 0.3)', color: '#E63946' }}>
                  发言中
                </span>
              )}
            </div>
            <span className="text-sm text-gray-500">{conDebaters.length} 人</span>
          </div>

          <div className="debater-list flex flex-wrap gap-2 mb-4 justify-end">
            {conDebaters.map((debater) => (
              <div 
                key={debater.id} 
                className="debater-avatar flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{ backgroundColor: 'rgba(230, 57, 70, 0.15)' }}
              >
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ backgroundColor: '#E63946' }}
                >
                  {getInitial(debater.name)}
                </div>
                <span className="text-sm text-gray-300">{debater.name}</span>
                {debater.name === userName && (
                  <span className="text-xs text-red-400">(我)</span>
                )}
              </div>
            ))}
            {conDebaters.length === 0 && (
              <span className="text-gray-500 text-sm">暂无辩手</span>
            )}
          </div>

          <div className="flex-1 arguments-area overflow-y-auto pl-2 space-y-3 flex flex-col items-end">
            {allArguments.filter(a => a.side === 'con').map((arg) => (
              <div 
                key={arg.id}
                className="argument-card con-argument p-3 rounded-xl"
                style={{ 
                  backgroundColor: 'rgba(230, 57, 70, 0.3)',
                  maxWidth: '220px',
                }}
              >
                <p className="text-sm text-gray-200">{arg.content}</p>
                <div className="text-xs text-gray-400 mt-1 text-left">
                  {formatTime(arg.timestamp)} · 第{arg.round}轮
                </div>
              </div>
            ))}
            <div ref={argumentsEndRef} />
          </div>

          <div className="mt-4">
            <div className="relative">
              <textarea
                value={argumentInput}
                onChange={(e) => setArgumentInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={canSpeak('con') ? '输入你的论点...' : currentSpeakingSide === 'pro' ? '等待对方发言...' : '辩论尚未开始'}
                disabled={!canSpeak('con')}
                className="w-full p-3 pr-12 rounded-xl text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 transition-all"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: canSpeak('con') ? '2px solid rgba(230, 57, 70, 0.5)' : '2px solid transparent',
                }}
                rows={2}
              />
              <button
                onClick={handleSubmitArgument}
                disabled={!canSpeak('con') || !argumentInput.trim()}
                className="absolute right-3 bottom-3 p-2 rounded-lg transition-all duration-200"
                style={{ 
                  backgroundColor: canSpeak('con') && argumentInput.trim() ? '#E63946' : 'rgba(255, 255, 255, 0.1)',
                  color: canSpeak('con') && argumentInput.trim() ? 'white' : '#666',
                }}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {phase === 'finished' && (
        <div className="results-panel h-64 md:h-80 border-t border-white/10 p-4 flex gap-4 flex-shrink-0">
          <div className="flex-1 bg-white/5 rounded-2xl p-4">
            <h3 className="text-white font-semibold mb-3 text-center">投票结果</h3>
            <ChartDisplay showFinalResult={true} />
          </div>
          <div className="flex-1 bg-white/5 rounded-2xl p-4">
            <h3 className="text-white font-semibold mb-3 text-center">关键词云</h3>
            <WordCloud />
          </div>
        </div>
      )}

      <VotePanel isOpen={phase === 'voting'} />

      <style>{`
        .debate-room {
          background: linear-gradient(135deg, #1A1A2E 0%, #16213E 100%);
        }
        .header {
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(10px);
        }
        .exit-btn:hover {
          background: rgba(230, 57, 70, 0.1);
          transform: translateY(-1px);
        }
        .pro-section {
          background: linear-gradient(180deg, rgba(74, 144, 217, 0.05) 0%, transparent 100%);
        }
        .con-section {
          background: linear-gradient(180deg, rgba(230, 57, 70, 0.05) 0%, transparent 100%);
        }
        .center-section {
          background: rgba(15, 23, 42, 0.5);
        }
        .argument-card {
          animation: slideIn 0.3s ease;
        }
        .start-btn:hover, .restart-btn:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }
        .start-btn:active, .restart-btn:active {
          transform: translateY(0);
        }
        .debater-avatar {
          transition: transform 0.2s ease;
        }
        .debater-avatar:hover {
          transform: scale(1.05);
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (max-width: 768px) {
          .pro-section, .con-section {
            height: 45%;
          }
          .center-section {
            height: auto;
            padding: 12px;
          }
        }
        .arguments-area::-webkit-scrollbar {
          width: 4px;
        }
        .arguments-area::-webkit-scrollbar-track {
          background: transparent;
        }
        .arguments-area::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}
