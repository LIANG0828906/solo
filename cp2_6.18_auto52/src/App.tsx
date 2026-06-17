import { useState, useMemo } from 'react';
import { Plus, Search, BarChart3 } from 'lucide-react';
import { usePollStore } from '@/store';
import PollCreator from '@/components/PollCreator';
import PollCard from '@/components/PollCard';
import type { Poll } from '@/types';

function useFilteredPolls() {
  const polls = usePollStore((s) => s.polls);
  const searchKeyword = usePollStore((s) => s.searchKeyword);

  return useMemo(() => {
    const now = Date.now();
    const closed = polls.map((p) =>
      !p.isClosed && now >= p.deadline ? { ...p, isClosed: true } : p
    );

    const keyword = searchKeyword.trim().toLowerCase();
    const active = closed.filter((p) => !p.isClosed);
    const expired = closed.filter((p) => p.isClosed);

    const sortByTime = (a: Poll, b: Poll) => b.createdAt - a.createdAt;

    if (!keyword) {
      return [...active.sort(sortByTime), ...expired.sort(sortByTime)];
    }

    const filterFn = (p: Poll) => p.title.toLowerCase().includes(keyword);
    return [
      ...active.filter(filterFn).sort(sortByTime),
      ...expired.filter(filterFn).sort(sortByTime),
    ];
  }, [polls, searchKeyword]);
}

export default function App() {
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const searchKeyword = usePollStore((s) => s.searchKeyword);
  const setSearchKeyword = usePollStore((s) => s.setSearchKeyword);
  const filteredPolls = useFilteredPolls();

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <nav className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[800px] items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <BarChart3 size={22} className="text-indigo-600" />
            <span className="text-lg font-bold tracking-tight text-gray-900">
              QuickPoll
            </span>
          </div>
          <button
            onClick={() => setIsCreatorOpen(true)}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #4F46E5, #6366F1)',
            }}
          >
            <Plus size={16} />
            创建投票
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-[800px] px-4 py-6 sm:px-6">
        <div className="mb-5">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索投票标题..."
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 placeholder:text-gray-400 sm:max-w-xs max-sm:w-full"
            />
          </div>
        </div>

        {filteredPolls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <BarChart3 size={48} className="mb-3 opacity-30" />
            <p className="text-sm">
              {searchKeyword ? '没有找到匹配的投票' : '还没有投票，点击上方按钮创建一个吧'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredPolls.map((poll) => (
              <PollCard key={poll.id} poll={poll} />
            ))}
          </div>
        )}
      </main>

      <PollCreator
        isOpen={isCreatorOpen}
        onClose={() => setIsCreatorOpen(false)}
      />
    </div>
  );
}
