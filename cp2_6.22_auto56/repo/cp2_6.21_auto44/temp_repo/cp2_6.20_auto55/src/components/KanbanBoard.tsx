import { useState, useEffect, useMemo } from 'react';
import VoteCard from './VoteCard';
import VoteCreator from './VoteCreator';
import Navbar from './Navbar';
import SearchFilter from './SearchFilter';
import NotificationToast from './NotificationToast';
import type { Vote } from '@/types';
import { useKanbanStore } from '@/store/kanbanStore';
import { STATUS_LABELS, VOTE_TYPE_LABELS } from '@/utils/constants';
import { Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUSES = ['todo', 'active', 'ended'] as const;

export default function KanbanBoard() {
  const { votes, filters, isLoading, fetchVotes, deleteVote, getFilteredVotes } = useKanbanStore();
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [editingVote, setEditingVote] = useState<Vote | null>(null);
  const [timeAxisIndex, setTimeAxisIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    fetchVotes();
  }, [fetchVotes]);

  const filteredVotes = useMemo(() => {
    return getFilteredVotes();
  }, [votes, filters, getFilteredVotes]);

  const votesByStatus = useMemo(() => {
    const result: Record<string, Vote[]> = { todo: [], active: [], ended: [] };
    filteredVotes.forEach((vote) => {
      if (result[vote.status]) {
        result[vote.status].push(vote);
      }
    });
    return result;
  }, [filteredVotes]);

  const handleEditVote = (vote: Vote) => {
    setEditingVote(vote);
    setIsCreatorOpen(true);
  };

  const handleDeleteVote = async (voteId: string) => {
    await deleteVote(voteId);
  };

  const handleCreatorClose = () => {
    setIsCreatorOpen(false);
    setEditingVote(null);
  };

  const handleTimeAxisScroll = (direction: 'left' | 'right') => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeAxisIndex((prev) => {
      if (direction === 'left') return Math.max(0, prev - 1);
      return prev + 1;
    });
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault();
      if (e.deltaX > 30) handleTimeAxisScroll('right');
      else if (e.deltaX < -30) handleTimeAxisScroll('left');
    }
  };

  if (isLoading && votes.length === 0) {
    return (
      <div className="min-h-screen bg-[#1a1f36] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#4a90d9]" />
        <span className="ml-3 text-gray-300">加载中...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1f36]">
      <Navbar onOpenVoteCreator={() => setIsCreatorOpen(true)} />

      <div className="pt-20 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">投票看板</h1>
              <p className="text-gray-400 text-sm mt-1">
                共 {votes.length} 个投票，当前筛选 {filteredVotes.length} 个
              </p>
            </div>
            <button
              onClick={() => setIsCreatorOpen(true)}
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-[#4a90d9] hover:bg-[#5ba0e9] text-white rounded-lg transition-all duration-200 font-medium shadow-lg shadow-[#4a90d9]/20"
            >
              <Plus size={18} />
              创建投票
            </button>
          </div>

          <div className="mb-6">
            <SearchFilter />
          </div>

          <div
            className="relative"
            onWheel={handleWheel}
          >
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10">
              <button
                onClick={() => handleTimeAxisScroll('left')}
                disabled={timeAxisIndex === 0}
                className={cn(
                  'w-10 h-10 rounded-full bg-[#2a2f4a] text-white shadow-lg flex items-center justify-center transition-all duration-200',
                  timeAxisIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#3a3f5a]'
                )}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
            </div>

            <div
              className={cn(
                'grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 transition-all duration-300 ease-out'
              )}
              style={{
                transform: `translateX(-${timeAxisIndex * 20}px)`,
              }}
            >
              {STATUSES.map((status) => {
                const columnVotes = votesByStatus[status] || [];
                return (
                  <div
                    key={status}
                    className="flex flex-col min-h-[60vh]"
                  >
                    <div className="flex items-center justify-between mb-4 px-1">
                      <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                        {STATUS_LABELS[status]}
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300 font-normal">
                          {columnVotes.length}
                        </span>
                      </h2>
                      {status === 'todo' && (
                        <button
                          onClick={() => setIsCreatorOpen(true)}
                          className="sm:hidden w-8 h-8 rounded-lg bg-[#4a90d9] text-white flex items-center justify-center"
                        >
                          <Plus size={16} />
                        </button>
                      )}
                    </div>

                    <div
                      className={cn(
                        'flex-1 rounded-2xl p-4 transition-all duration-200',
                        'bg-[#2a2f4a]/50 backdrop-blur-sm border border-white/5'
                      )}
                    >
                      <div className="space-y-4">
                        {columnVotes.length === 0 ? (
                          <div className="py-12 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4"/><path d="M9 11V7a3 3 0 0 1 6 0v4"/></svg>
                            </div>
                            <p className="text-gray-500 text-sm">暂无{STATUS_LABELS[status]}的投票</p>
                            {status === 'todo' && (
                              <button
                                onClick={() => setIsCreatorOpen(true)}
                                className="mt-4 text-sm text-[#4a90d9] hover:text-[#5ba0e9] transition-colors"
                              >
                                立即创建 →
                              </button>
                            )}
                          </div>
                        ) : (
                          <div
                            className="space-y-4"
                            style={{
                              animation: 'fadeInUp 0.4s ease-out',
                            }}
                          >
                            {columnVotes.map((vote) => (
                              <div
                                key={vote.id}
                                style={{
                                  animation: `fadeInUp 0.5s ease-out ${columnVotes.indexOf(vote) * 0.05}s both`,
                                }}
                              >
                                <VoteCard
                                  vote={vote}
                                  onEdit={handleEditVote}
                                  onDelete={handleDeleteVote}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#4a90d9] to-[#ff7b54] rounded-full transition-all duration-500"
                        style={{
                          width: `${votes.length > 0 ? (columnVotes.length / votes.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10">
              <button
                onClick={() => handleTimeAxisScroll('right')}
                className="w-10 h-10 rounded-full bg-[#2a2f4a] text-white shadow-lg flex items-center justify-center hover:bg-[#3a3f5a] transition-all duration-200"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>
          </div>

          <div className="mt-8 flex justify-center gap-2">
            {[0, 1, 2].map((idx) => (
              <button
                key={idx}
                onClick={() => {
                  setIsAnimating(true);
                  setTimeAxisIndex(idx);
                  setTimeout(() => setIsAnimating(false), 300);
                }}
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  timeAxisIndex === idx
                    ? 'w-8 bg-[#4a90d9]'
                    : 'w-2 bg-white/20 hover:bg-white/30'
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <VoteCreator
        isOpen={isCreatorOpen}
        onClose={handleCreatorClose}
        editVote={editingVote}
      />
      <NotificationToast />

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(16px);
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
