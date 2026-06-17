import { useState, useEffect, useCallback, useMemo } from 'react';
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
  if (cd.hours > 0 || cd.days > 0) parts.push(`${cd.hours}小时`);
  parts.push(`${cd.minutes}分${cd.seconds}秒`);
  return parts.join('');
}

export default function PollCard({ poll }: PollCardProps) {
  const vote = usePollStore((s) => s.vote);
  const votedPolls = usePollStore((s) => s.votedPolls);
  const closePoll = usePollStore((s) => s.closePoll);

  const [countdown, setCountdown] = useState<Countdown>(getCountdown(poll.deadline));
  const [showChart, setShowChart] = useState(true);

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
    return usePollStore.getState().getStatistics(poll.id);
  }, [poll.id, poll.votes, poll.options]);

  return (
    <div
      className={`rounded-xl bg-white p-5 transition-all duration-300`}
      style={{
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        opacity: poll.isClosed ? 0.6 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-base font-semibold text-gray-900 leading-snug">
          {poll.title}
        </h3>
        {poll.isClosed && (
          <span className="shrink-0 rounded-md bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
            已截止
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          {totalVotes} 票
        </span>
        {!poll.isClosed && (
          <span className="flex items-center gap-1 text-indigo-600">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {formatCountdown(countdown)}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 mb-4">
        {poll.options.map((option) => {
          const isSelected = selectedOption === option.id;
          const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;

          return (
            <button
              key={option.id}
              onClick={() => handleVote(option.id)}
              disabled={isDisabled}
              className={`relative flex items-center justify-between rounded-lg border px-4 py-3 text-sm transition-all duration-200 text-left overflow-hidden ${
                isDisabled
                  ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
                  : isSelected
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 cursor-pointer'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 cursor-pointer'
              }`}
            >
              {isSelected && !isDisabled && (
                <div
                  className="absolute inset-0 bg-indigo-50/60 transition-all duration-500 ease-out"
                  style={{ width: `${percentage}%` }}
                />
              )}
              {!isSelected && totalVotes > 0 && !isDisabled && (
                <div
                  className="absolute inset-0 bg-gray-50/60 transition-all duration-500 ease-out"
                  style={{ width: `${percentage}%` }}
                />
              )}
              <span className="relative z-10 font-medium truncate">{option.text}</span>
              <span className="relative z-10 shrink-0 text-xs ml-2">
                {totalVotes > 0 && (
                  <span className={`${isSelected ? 'text-indigo-500' : 'text-gray-400'}`}>
                    {option.votes}票 {percentage}%
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {totalVotes > 0 && (
        <div>
          <button
            onClick={() => setShowChart(!showChart)}
            className="text-xs text-indigo-600 hover:text-indigo-700 mb-2 transition-colors"
          >
            {showChart ? '收起图表 ▲' : '展开图表 ▼'}
          </button>
          {showChart && <StatisticsPanel pollId={poll.id} statistics={statistics} />}
        </div>
      )}
    </div>
  );
}
