import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Send, Wifi, WifiOff, BarChart3, Check, CheckCircle2 } from 'lucide-react';
import { usePollStore } from '@/store/pollStore';
import { getPoll, submitVote } from '@/utils/api';
import { getDeviceId } from '@/utils/device';
import * as socket from '@/utils/socket';

const colors = [
  '#3B82F6',
  '#EF4444',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#F97316',
];

function AnimatedVoteCount({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (prevValueRef.current === value) return;

    const startValue = prevValueRef.current;
    const diff = value - startValue;
    const duration = 500;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(startValue + diff * eased));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        prevValueRef.current = value;
        setDisplayValue(value);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  return <>{displayValue}</>;
}

export default function VotePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentPoll,
    setCurrentPoll,
    selectedOptionIds,
    toggleSelectedOption,
    isSocketConnected,
    updatePollVote,
    markAsVoted,
    hasVoted,
  } = usePollStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clickingOptionId, setClickingOptionId] = useState<number | null>(null);
  const [justVoted, setJustVoted] = useState(false);

  useEffect(() => {
    if (!id) return;

    const loadPoll = async () => {
      try {
        const poll = await getPoll(id);
        setCurrentPoll(poll);
        socket.joinPoll(id);
        socket.onVoteUpdate((updatedPoll) => {
          setCurrentPoll(updatedPoll);
        });
        socket.onPollData((pollData) => {
          setCurrentPoll(pollData);
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setIsLoading(false);
      }
    };

    loadPoll();

    return () => {
      socket.leavePoll(id);
    };
  }, [id, setCurrentPoll, updatePollVote]);

  const handleOptionClick = useCallback(
    (optionId: number, showResults: boolean) => {
      if (showResults) return;
      setClickingOptionId(optionId);
      toggleSelectedOption(optionId);
      setTimeout(() => setClickingOptionId(null), 200);
    },
    [toggleSelectedOption],
  );

  const handleVote = async () => {
    if (selectedOptionIds.length === 0 || !currentPoll || !id) return;
    if (hasVoted(id)) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await submitVote(id, selectedOptionIds, getDeviceId());
      markAsVoted(id);
      setJustVoted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '投票失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error && !currentPoll) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col items-center justify-center p-4">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-blue-500 text-white rounded-xl"
        >
          返回首页
        </button>
      </div>
    );
  }

  if (!currentPoll) {
    return null;
  }

  const voted = id ? hasVoted(id) : false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            返回
          </button>
          <div className="flex items-center gap-2">
            {isSocketConnected ? (
              <Wifi className="w-5 h-5 text-green-500" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-500" />
            )}
            <Link
              to={`/poll/${id}/results`}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              结果
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 mb-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {currentPoll.title}
            </h1>
            {currentPoll.description && (
              <p className="text-slate-600 dark:text-slate-400">
                {currentPoll.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-4 text-sm">
              <span className="text-slate-500 dark:text-slate-400">{currentPoll.totalVotes} 票</span>
              {currentPoll.isMultipleChoice && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-xs">
                  多选
                </span>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm mb-4">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {currentPoll.options.map((option, index) => {
              const percentage =
                currentPoll.totalVotes > 0
                  ? Math.round((option.votes / currentPoll.totalVotes) * 100)
                  : 0;
              const isSelected = selectedOptionIds.includes(option.id);
              const showResults = voted;
              const color = colors[index % colors.length];
              const isClicking = clickingOptionId === option.id;
              const isMyVote = voted && isSelected;

              return (
                <button
                  key={option.id}
                  onClick={() => handleOptionClick(option.id, showResults)}
                  disabled={showResults}
                  className={`w-full relative overflow-hidden rounded-xl border-2 transition-all duration-200
                    ${isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md'
                    }
                    ${showResults && !isSelected ? 'opacity-50' : ''}
                    ${isClicking ? 'scale-[0.98]' : 'scale-100'}
                    ${showResults ? 'cursor-default' : 'cursor-pointer active:scale-[0.98]'}
                  `}
                  style={{
                    transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.2s, opacity 0.3s, box-shadow 0.2s',
                  }}
                >
                  {showResults && (
                    <div
                      className="absolute inset-y-0 left-0 transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: color + '20',
                      }}
                    />
                  )}
                  <div className="relative flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                          isSelected ? 'scale-110' : ''
                        } ${justVoted && isMyVote ? 'animate-[pop_0.4s_ease]' : ''}`}
                        style={{ backgroundColor: color }}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <span className={`font-medium transition-colors duration-200 ${
                        showResults && !isSelected
                          ? 'text-slate-400 dark:text-slate-500'
                          : 'text-slate-900 dark:text-white'
                      }`}>
                        {option.text}
                      </span>
                      {isMyVote && justVoted && (
                        <CheckCircle2
                          className="w-5 h-5 animate-[fadeSlideIn_0.4s_ease_forwards]"
                          style={{ color }}
                        />
                      )}
                    </div>
                    {showResults && (
                      <div className="flex items-center gap-3">
                        <span className="text-slate-600 dark:text-slate-400">
                          <AnimatedVoteCount value={option.votes} /> 票
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {percentage}%
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {!voted && (
          <button
            onClick={handleVote}
            disabled={selectedOptionIds.length === 0 || isSubmitting}
            className="w-full py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.96] disabled:transform-none flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
            {isSubmitting ? '提交中...' : '提交投票'}
          </button>
        )}

        {voted && (
          <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-4 rounded-xl text-center animate-[fadeSlideIn_0.3s_ease_forwards]">
            您已成功投票！
          </div>
        )}
      </div>
    </div>
  );
}
