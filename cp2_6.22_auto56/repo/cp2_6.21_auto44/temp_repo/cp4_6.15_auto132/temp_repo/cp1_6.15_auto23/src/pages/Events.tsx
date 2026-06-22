import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Vote, Check, RefreshCw, Edit2 } from 'lucide-react';
import { api } from '@/api';
import type { Event, Book } from '@/types';
import { cn } from '@/lib/utils';

const CURRENT_MEMBER_ID = 'm_1';
const IS_ADMIN = true;

type EventItem = Event & { book: Book; voteResults: { timeOption: string; count: number }[] };

function VoteBarChart({
  votes,
  votedFor,
  onVote,
}: {
  votes: { timeOption: string; count: number }[];
  votedFor: string | null;
  onVote: (option: string) => void;
}) {
  const max = Math.max(...votes.map(v => v.count), 1);
  return (
    <div className="space-y-3">
      {votes.map(v => {
        const pct = (v.count / max) * 100;
        const isVoted = votedFor === v.timeOption;
        return (
          <button
            key={v.timeOption}
            onClick={() => onVote(v.timeOption)}
            className={cn(
              'w-full text-left p-3 rounded-xl transition-all duration-300 relative overflow-hidden group',
              isVoted
                ? 'bg-forest/5 border-2 border-forest shadow-soft'
                : 'bg-cream hover:bg-forest-pale/20 border-2 border-transparent hover:border-forest/30'
            )}
          >
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-forest via-forest-light to-forest-pale opacity-20 transition-all duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                  isVoted ? 'bg-forest border-forest' : 'border-latte group-hover:border-forest/50'
                )}>
                  {isVoted && <Check className="w-3.5 h-3.5 text-warm-white" />}
                </div>
                <span className={cn('text-sm font-medium transition-colors duration-200', isVoted ? 'text-forest' : 'text-espresso')}>
                  {v.timeOption}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-coffee">{v.count} 票</span>
                <span className={cn(
                  'font-serif text-lg font-bold transition-colors duration-200',
                  isVoted ? 'text-forest' : 'text-espresso'
                )}>
                  {Math.round(pct)}%
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default function Events() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [editTimeEventId, setEditTimeEventId] = useState<string | null>(null);
  const [newTimeOptions, setNewTimeOptions] = useState('');

  const loadEvents = async () => {
    const data = await api.getEvents();
    setEvents(data);
    setLoading(false);
  };

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    const interval = setInterval(loadEvents, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleVote = async (eventId: string, option: string) => {
    setVotingId(eventId);
    try {
      const res = await api.voteEvent(eventId, { memberId: CURRENT_MEMBER_ID, timeOption: option });
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, voteResults: res.results } : e));
    } finally {
      setVotingId(null);
    }
  };

  const applyTimeOptions = async (eventId: string) => {
    const options = newTimeOptions.split('\n').map(s => s.trim()).filter(Boolean);
    if (options.length < 2) return;
    await fetch(`/api/events/${eventId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeOptions: options }),
    });
    setEditTimeEventId(null);
    setNewTimeOptions('');
    loadEvents();
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="font-serif text-3xl font-bold text-espresso mb-2 animate-skeleton-pulse w-40 h-9 rounded" />
        <div className="grid gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-warm-white rounded-card p-6 shadow-soft">
              <div className="animate-skeleton-pulse h-7 w-1/3 rounded mb-4" />
              <div className="space-y-3">
                <div className="animate-skeleton-pulse h-14 rounded-xl" />
                <div className="animate-skeleton-pulse h-14 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-espresso mb-2">活动安排</h1>
          <p className="text-coffee">基于阅读进度自动推荐讨论会时间，一起投票决定最佳时机</p>
        </div>
        <button
          onClick={loadEvents}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-card bg-forest/10 text-forest font-medium hover:bg-forest/20 transition-colors duration-200"
        >
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-20 bg-warm-white rounded-card shadow-soft">
          <Calendar className="w-16 h-16 text-latte mx-auto mb-4" />
          <p className="text-coffee text-lg mb-2">暂无活动安排</p>
          <p className="text-sm text-coffee/70">当多数成员完成指定章节后，将自动推荐讨论时间</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {events.map((e, ei) => {
            const votedFor = e.votes.find(v => v.memberId === CURRENT_MEMBER_ID)?.timeOption || null;
            const totalVotes = e.voteResults.reduce((s, v) => s + v.count, 0);
            return (
              <div
                key={e.id}
                className="bg-warm-white rounded-card p-6 shadow-soft animate-fade-in-up"
                style={{ animationDelay: `${ei * 80}ms` }}
              >
                <div className="flex items-start gap-5 mb-5">
                  <div className="w-16 h-16 rounded-card bg-gradient-to-br from-forest to-forest-light flex items-center justify-center text-warm-white shadow-soft flex-shrink-0">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-serif text-xl font-bold text-espresso mb-1">
                          《{e.book?.title || '未知书籍'}》章节讨论会
                        </h3>
                        <p className="text-sm text-coffee">讨论范围：{e.chapterRange}</p>
                      </div>
                      <span className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium flex-shrink-0',
                        e.status === 'scheduled' ? 'bg-forest/15 text-forest' :
                        e.status === 'suggested' ? 'bg-latte/40 text-coffee' :
                        'bg-coffee/20 text-coffee'
                      )}>
                        {e.status === 'scheduled' ? '已安排' : e.status === 'suggested' ? '推荐中' : '已完成'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-sm text-coffee">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-forest" />
                        推荐时间：{e.suggestedTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-forest" />
                        {totalVotes} 人已投票
                      </span>
                      {IS_ADMIN && (
                        <button
                          onClick={() => {
                            setEditTimeEventId(e.id);
                            setNewTimeOptions(e.timeOptions.join('\n'));
                          }}
                          className="flex items-center gap-1 text-forest hover:underline transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          调整时间
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {editTimeEventId === e.id && (
                  <div className="mb-5 p-4 rounded-card bg-forest/5 border border-forest/20 animate-bubble-in">
                    <p className="text-sm font-medium text-espresso mb-2">修改可选时间（每行一个）</p>
                    <textarea
                      rows={3}
                      value={newTimeOptions}
                      onChange={e => setNewTimeOptions(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-latte/50 bg-warm-white text-espresso text-sm focus:outline-none focus:border-forest focus:ring-2 focus:ring-forest/20 mb-3"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => { setEditTimeEventId(null); setNewTimeOptions(''); }}
                        className="px-4 py-1.5 text-sm rounded-card text-coffee hover:bg-latte/20 transition-colors"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => applyTimeOptions(e.id)}
                        className="px-4 py-1.5 text-sm rounded-card bg-forest text-warm-white hover:bg-forest-light transition-colors"
                      >
                        确认修改
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 mb-3">
                  <Vote className="w-4 h-4 text-forest" />
                  <p className="text-sm font-medium text-espresso">投票选择时间（每 3 秒自动刷新）</p>
                </div>
                <VoteBarChart
                  votes={e.voteResults}
                  votedFor={votedFor}
                  onVote={opt => !votingId && handleVote(e.id, opt)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
