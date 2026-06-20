import { useEffect, useState, useCallback } from 'react';
import { useVoteStore } from './store';
import VoteCard from './components/VoteCard';
import ResultPanel from './components/ResultPanel';
import { EASING } from './ChartRenderer';

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function App() {
  const { 
    votes, 
    currentVote, 
    result, 
    loading, 
    error, 
    currentPage, 
    currentVoteId,
    fetchVotes, 
    fetchVote, 
    submitVote,
    setPage,
    clearError 
  } = useVoteStore();

  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number>(0);
  const [optionVotes, setOptionVotes] = useState<Map<string, number>>(new Map());
  const [animatingNumbers, setAnimatingNumbers] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchVotes();
  }, [fetchVotes]);

  useEffect(() => {
    if (currentPage === 'vote' && currentVote) {
      const timer = setInterval(() => {
        const remaining = Math.max(0, currentVote.endTime - Date.now());
        setCountdown(remaining);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentPage, currentVote]);

  useEffect(() => {
    if (currentVote) {
      const votesMap = new Map<string, number>();
      currentVote.options.forEach(opt => votesMap.set(opt.id, opt.votes));
      setOptionVotes(votesMap);
    }
  }, [currentVote]);

  const handleCardClick = useCallback((voteId: string) => {
    fetchVote(voteId);
    setSelectedOptions([]);
    setPage('vote', voteId);
  }, [fetchVote, setPage]);

  const handleOptionClick = useCallback((optionId: string) => {
    if (!currentVote?.isActive || countdown <= 0) return;

    setSelectedOptions(prev => {
      if (currentVote.multiSelect) {
        return prev.includes(optionId) 
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId];
      } else {
        return prev.includes(optionId) ? [] : [optionId];
      }
    });
  }, [currentVote, countdown]);

  const handleSubmitVote = useCallback(async () => {
    if (!currentVoteId || selectedOptions.length === 0) return;
    
    const success = await submitVote(currentVoteId, { optionIds: selectedOptions });
    if (success) {
      setPage('result', currentVoteId);
    }
  }, [currentVoteId, selectedOptions, submitVote, setPage]);

  const animateNumber = useCallback((optionId: string) => {
    setAnimatingNumbers(prev => new Set(prev).add(optionId));
    setTimeout(() => {
      setAnimatingNumbers(prev => {
        const next = new Set(prev);
        next.delete(optionId);
        return next;
      });
    }, 500);
  }, []);

  const renderListPage = () => (
    <div className="min-h-screen p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-2" style={{ color: '#5D4E37' }}>
          微型投票系统
        </h1>
        <p className="text-center mb-8" style={{ color: '#8D6E63' }}>
          点击卡片进入投票，实时查看结果
        </p>
        
        {loading && <div className="text-center py-12" style={{ color: '#8D6E63' }}>加载中...</div>}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
          {votes.map(vote => (
            <VoteCard
              key={vote.id}
              vote={vote}
              onClick={() => handleCardClick(vote.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );

  const renderVotePage = () => {
    if (!currentVote) return null;

    const progress = (countdown / (currentVote.endTime - currentVote.createdAt)) * 100;
    const totalVotes = currentVote.options.reduce((sum, o) => sum + o.votes, 0);

    return (
      <div className="min-h-screen p-6 md:p-12">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setPage('list')}
            className="mb-6 px-4 py-2 rounded-lg text-white transition-all"
            style={{ 
              backgroundColor: '#8D6E63',
              transition: `all 0.3s ${EASING}`
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6D4C41'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8D6E63'}
          >
            ← 返回列表
          </button>

          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-2xl font-bold" style={{ color: '#5D4E37' }}>{currentVote.title}</h2>
                <div 
                  className="text-3xl font-bold tabular-nums"
                  style={{ 
                    color: '#FF5252',
                    transition: `transform 0.3s ${EASING}`,
                    animation: countdown > 0 && countdown < 60000 ? 'pulse 1s infinite' : 'none'
                  }}
                >
                  {formatTime(countdown)}
                </div>
              </div>
              <p className="mb-4" style={{ color: '#8D6E63' }}>{currentVote.description}</p>
              
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#EFEBE9' }}>
                <div 
                  className="h-full rounded-full transition-all"
                  style={{ 
                    width: `${Math.max(0, progress)}%`,
                    backgroundColor: '#FF5252',
                    transition: `width 1s ${EASING}`
                  }}
                />
              </div>
              
              <div className="flex justify-between mt-2 text-sm" style={{ color: '#8D6E63' }}>
                <span>{currentVote.multiSelect ? '可多选' : '单选'}</span>
                <span>已有 {totalVotes} 人参与投票</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {currentVote.options.map((option, index) => {
                const isSelected = selectedOptions.includes(option.id);
                const color = option.color;
                const voteCount = optionVotes.get(option.id) || 0;
                const isAnimating = animatingNumbers.has(option.id);

                return (
                  <button
                    key={option.id}
                    onClick={() => {
                      handleOptionClick(option.id);
                      animateNumber(option.id);
                    }}
                    disabled={!currentVote.isActive || countdown <= 0}
                    className="relative w-full h-20 rounded-xl flex items-center justify-between px-4 transition-all overflow-hidden"
                    style={{
                      width: '160px',
                      height: '80px',
                      backgroundColor: isSelected ? '#E3F2FD' : '#F0EDE8',
                      border: isSelected ? `1px solid ${color}` : '1px solid transparent',
                      transition: `all 0.3s ${EASING}`,
                      cursor: currentVote.isActive && countdown > 0 ? 'pointer' : 'not-allowed',
                      opacity: currentVote.isActive && countdown > 0 ? 1 : 0.6
                    }}
                    onMouseEnter={(e) => {
                      if (currentVote.isActive && countdown > 0) {
                        e.currentTarget.style.backgroundColor = '#A8D8EA';
                        e.currentTarget.style.borderLeft = `4px solid ${color}`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isSelected ? '#E3F2FD' : '#F0EDE8';
                      e.currentTarget.style.borderLeft = isSelected ? `4px solid ${color}` : '1px solid transparent';
                    }}
                  >
                    <div 
                      className="absolute left-0 top-0 h-full transition-all"
                      style={{ 
                        width: isSelected ? '4px' : '0',
                        backgroundColor: color,
                        transition: `width 0.3s ${EASING}`
                      }}
                    />
                    <span className="font-medium z-10" style={{ color: '#5D4E37' }}>{option.text}</span>
                    <span 
                      className="font-bold z-10 tabular-nums"
                      style={{ 
                        color,
                        fontSize: '14px',
                        transition: `transform 0.3s ${EASING}`,
                        transform: isAnimating ? 'scale(1.3)' : 'scale(1)'
                      }}
                    >
                      {voteCount}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleSubmitVote}
              disabled={selectedOptions.length === 0 || loading || !currentVote.isActive || countdown <= 0}
              className="w-full py-4 rounded-xl text-white font-bold text-lg transition-all"
              style={{
                backgroundColor: selectedOptions.length > 0 && currentVote.isActive && countdown > 0 ? '#8D6E63' : '#BCAAA4',
                cursor: selectedOptions.length > 0 && currentVote.isActive && countdown > 0 ? 'pointer' : 'not-allowed',
                transition: `all 0.3s ${EASING}`,
                transform: selectedOptions.length > 0 && currentVote.isActive && countdown > 0 ? 'scale(1)' : 'scale(0.98)'
              }}
              onMouseEnter={(e) => {
                if (selectedOptions.length > 0 && currentVote.isActive && countdown > 0) {
                  e.currentTarget.style.backgroundColor = '#6D4C41';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = selectedOptions.length > 0 && currentVote.isActive && countdown > 0 ? '#8D6E63' : '#BCAAA4';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {loading ? '提交中...' : '提交投票'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderResultPage = () => {
    if (!result || !currentVoteId) return null;
    return (
      <ResultPanel voteId={currentVoteId} onBack={() => setPage('list')} />
    );
  };

  return (
    <>
      {error && (
        <div 
          className="fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-xl text-white z-50 shadow-lg"
          style={{ backgroundColor: '#FF5252' }}
        >
          <div className="flex items-center gap-3">
            <span>{error}</span>
            <button 
              onClick={clearError}
              className="px-2 py-1 rounded bg-white/20 hover:bg-white/30 transition-all"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {currentPage === 'list' && renderListPage()}
      {currentPage === 'vote' && renderVotePage()}
      {currentPage === 'result' && renderResultPage()}

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </>
  );
}

export default App;
