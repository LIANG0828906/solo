import { useState, useEffect, useCallback, useMemo } from 'react';
import { Clock, Users, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import { usePollStore } from '@/store';
import StatisticsPanel from './StatisticsPanel';
import type { Poll } from '@/types';

interface PollCardProps {
  poll: Poll;
}

interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

function getCountdown(deadline: number): Countdown {
  const diff = deadline - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds, expired: false };
}

function formatCountdown(cd: Countdown): string {
  if (cd.expired) return '已截止';
  const parts: string[] = [];
  if (cd.days > 0) parts.push(`${cd.days}天`);
  if (cd.hours > 0 || cd.days > 0) parts.push(`${cd.hours}时`);
  parts.push(`${cd.minutes}分${cd.seconds}秒`);
  return parts.join('');
}

export default function PollCard({ poll }: PollCardProps) {
  const vote = usePollStore((s) => s.vote);
  const votedPolls = usePollStore((s) => s.votedPolls);
  const closePoll = usePollStore((s) => s.closePoll);

  const [countdown, setCountdown] = useState<Countdown>(getCountdown(poll.deadline));
  const [showDetails, setShowDetails] = useState(false);

  const selectedOption = votedPolls[poll.id] ?? null;

  const updateCountdown = useCallback(() => {
    const cd = getCountdown(poll.deadline);
    setCountdown(cd);
    if (cd.expired && !poll.isClosed) {
      closePoll(poll.id);
    }
  }, [poll.deadline, poll.isClosed, closePoll, poll.id]);

  useEffect(() => {
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [updateCountdown]);

  const isDisabled = poll.isClosed || countdown.expired;

  const handleVote = (optionId: string) => {
    if (isDisabled) return;
    vote(poll.id, optionId);
  };

  const totalVotes = poll.votes.length;

  const statistics = useMemo(() => {
    return usePollStore.getState().getStats(poll.id);
  }, [poll.id, poll.votes.length]);

  const hasExpired = poll.isClosed || countdown.expired;

  return (
    <div
      className="rounded-xl bg-white transition-all duration-300 overflow-hidden"
      style={{
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        opacity: hasExpired ? 0.6 : 1,
      }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-lg font-semibold text-gray-900 leading-snug">
            {poll.title}
          </h3>
          {hasExpired && (
            <span className="shrink-0 rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
              已截止
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-5 text-sm">
          <div className="flex items-center gap-1.5 text-gray-500">
            <Users size={14} />
            <span>
              <span className="font-semibold text-gray-700">{totalVotes}</span>
              {' '}人已投票
            </span>
          </div>
          <div
            className={`flex items-center gap-1.5 ${
              hasExpired ? 'text-gray-500' : 'text-indigo-600'
            }`}
          >
            <Clock size={14} />
            <span>
              {hasExpired ? '投票已截止' : `剩余 ${formatCountdown(countdown)}`}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {poll.options.map((option) => {
            const isSelected = selectedOption === option.id;
            const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;

            return (
              <div key={option.id} className="group">
                <button
                  onClick={() => handleVote(option.id)}
                  disabled={isDisabled}
                  className={`relative w-full rounded-lg border px-4 py-3 transition-all duration-200 text-left overflow-hidden ${
                    isDisabled
                      ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
                      : isSelected
                      ? 'border-indigo-600 cursor-pointer'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 cursor-pointer'
                  }`}
                >
                  <div
                    className={`absolute inset-y-0 left-0 transition-all duration-500 ease-out ${
                      isSelected ? 'bg-indigo-100/80' : 'bg-gray-100/60'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />

                  <div className="relative z-10 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600'
                            : isDisabled
                            ? 'border-gray-300 bg-gray-100'
                            : 'border-gray-300 group-hover:border-indigo-400'
                        }`}
                      >
                        {isSelected && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <span
                        className={`truncate font-medium ${
                          isSelected && !isDisabled ? 'text-indigo-700' : ''
                        }`}
                      >
                        {option.text}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`text-sm font-semibold tabular-nums ${
                          isSelected && !isDisabled ? 'text-indigo-600' : 'text-gray-500'
                        }`}
                      >
                        {option.votes}
                      </span>
                      <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden shrink-0">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ease-out ${
                            isSelected ? 'bg-indigo-500' : 'bg-gray-400'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span
                        className={`text-xs font-medium tabular-nums min-w-[36px] text-right ${
                          isSelected && !isDisabled ? 'text-indigo-600' : 'text-gray-400'
                        }`}
                      >
                        {totalVotes > 0 ? `${percentage}%` : '—'}
                      </span>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {totalVotes > 0 && (
        <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-between w-full text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <BarChart3 size={15} />
              查看统计详情
            </span>
            {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showDetails && (
            <div className="mt-4 pb-2 animate-in fade-in duration-300">
              <StatisticsPanel pollId={poll.id} statistics={statistics} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
