import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import VoteDetail from '@/components/VoteDetail';
import { useKanbanStore } from '@/store/kanbanStore';

export default function VoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchVote, votes } = useKanbanStore();

  const vote = votes.find((v) => v.id === id);

  useEffect(() => {
    if (!vote && id) {
      fetchVote(id);
    }
  }, [id, vote, fetchVote]);

  return (
    <div className="min-h-screen bg-[#1a1f36]">
      <div className="sticky top-0 z-40 bg-[#1a1f36]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">返回看板</span>
          </button>
          <h1 className="text-white font-semibold text-lg truncate">
            {vote?.title || '投票详情'}
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {vote ? (
          <VoteDetail vote={vote} />
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
            </div>
            <p className="text-gray-400 mb-4">投票不存在或已被删除</p>
            <button
              onClick={() => navigate('/')}
              className="px-5 py-2 bg-[#4a90d9] text-white rounded-lg hover:bg-[#5ba0e9] transition-colors"
            >
              返回看板
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
