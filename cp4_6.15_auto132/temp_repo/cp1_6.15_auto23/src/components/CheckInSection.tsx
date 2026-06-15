import { useState } from 'react';
import { Calendar, User, PenLine, Sparkles } from 'lucide-react';
import { api } from '@/api';
import type { CheckIn, Member } from '@/types';
import { cn } from '@/lib/utils';

const CURRENT_MEMBER_ID = 'm_1';

interface CheckInWithMember extends CheckIn {
  member: Member;
  isNew?: boolean;
}

export default function CheckInSection({
  bookId,
  initialCheckIns,
  onAdded,
}: {
  bookId: string;
  initialCheckIns: CheckInWithMember[];
  onAdded?: () => void;
}) {
  const [checkIns, setCheckIns] = useState<CheckInWithMember[]>(initialCheckIns);
  const [chapter, setChapter] = useState('');
  const [thought, setThought] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapter || submitting) return;
    setSubmitting(true);
    try {
      const data = await api.addCheckIn(bookId, {
        memberId: CURRENT_MEMBER_ID,
        chapter: parseInt(chapter, 10),
        thought,
      });
      setCheckIns(prev => [{ ...data, isNew: true }, ...prev]);
      setChapter('');
      setThought('');
      onAdded?.();
      setTimeout(() => {
        setCheckIns(prev => prev.map(c => (c.id === data.id ? { ...c, isNew: false } : c)));
      }, 2000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-warm-white rounded-card p-6 shadow-soft">
      <h3 className="font-serif text-xl font-bold text-espresso mb-5 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-forest" />
        阅读打卡
      </h3>

      <form onSubmit={submit} className="p-4 rounded-card bg-gradient-to-br from-cream to-forest-pale/20 border border-forest/10 mb-6">
        <p className="text-sm font-medium text-espresso mb-3">记录今日阅读进度</p>
        <div className="flex gap-3 mb-3">
          <div className="flex-1">
            <label className="text-xs text-coffee mb-1 block">当前章节</label>
            <input
              type="number"
              min={0}
              value={chapter}
              onChange={e => setChapter(e.target.value)}
              placeholder="例如：5"
              className="w-full px-3 py-2 rounded-lg border border-latte/50 bg-warm-white text-espresso focus:outline-none focus:border-forest focus:ring-2 focus:ring-forest/20 transition-all duration-200 text-sm"
            />
          </div>
        </div>
        <div className="mb-3">
          <label className="text-xs text-coffee mb-1 block">简短感想</label>
          <textarea
            rows={2}
            value={thought}
            onChange={e => setThought(e.target.value)}
            placeholder="今天的阅读让你印象最深的是..."
            className="w-full px-3 py-2 rounded-lg border border-latte/50 bg-warm-white text-espresso focus:outline-none focus:border-forest focus:ring-2 focus:ring-forest/20 transition-all duration-200 text-sm resize-none"
          />
        </div>
        <button
          type="submit"
          disabled={submitting || !chapter}
          className="w-full py-2.5 rounded-card bg-gradient-to-r from-forest to-forest-light text-warm-white font-medium shadow-soft hover:shadow-hover hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
        >
          <PenLine className="w-4 h-4" />
          {submitting ? '打卡中...' : '打卡记录'}
        </button>
      </form>

      {checkIns.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-latte mx-auto mb-3" />
          <p className="text-coffee">暂无打卡记录，开始你的第一次打卡吧</p>
        </div>
      ) : (
        <div className="relative pl-8">
          <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gradient-to-b from-forest via-forest-light to-forest-pale/30" />
          <div className="space-y-5">
            {checkIns.map((c, i) => (
              <div
                key={c.id}
                className={cn(
                  'relative',
                  c.isNew && 'animate-slide-in-right-shake'
                )}
                style={!c.isNew ? { animation: `fadeInUp 300ms cubic-bezier(0.4, 0, 0.2, 1) both`, animationDelay: `${Math.min(i, 10) * 40}ms` } : undefined}
              >
                <div className="absolute -left-[26px] top-1 w-5 h-5 rounded-full bg-warm-white border-2 border-forest flex items-center justify-center shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-forest" />
                </div>
                <div className="p-4 rounded-card bg-cream/50 hover:bg-cream transition-colors duration-200">
                  <div className="flex items-center gap-2 mb-2">
                    <img src={c.member.avatar} alt={c.member.name} className="w-7 h-7 rounded-full object-cover" />
                    <span className="text-sm font-medium text-espresso">{c.member.name}</span>
                    <span className="text-xs text-coffee flex items-center gap-1 ml-auto">
                      <Calendar className="w-3 h-3" />
                      {new Date(c.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-forest/10 text-forest text-xs font-medium">
                      第 {c.chapter} 章
                    </span>
                  </div>
                  {c.thought && (
                    <p className="text-sm text-coffee leading-relaxed pl-1">{c.thought}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
