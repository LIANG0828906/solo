import { useDebateStore } from '@/store/debateStore';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface VotePanelProps {
  isOpen: boolean;
  onClose?: () => void;
}

export function VotePanel({ isOpen }: VotePanelProps) {
  const { voteData, castVote, phase, proDebaters, conDebaters } = useDebateStore();

  if (!isOpen || phase !== 'voting') return null;

  const proPercentage = voteData.totalVotes > 0 
    ? Math.round((voteData.proVotes / voteData.totalVotes) * 100) 
    : 50;
  const conPercentage = voteData.totalVotes > 0 
    ? Math.round((voteData.conVotes / voteData.totalVotes) * 100) 
    : 50;

  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center vote-modal-overlay">
      <div className="vote-modal p-8 rounded-2xl w-full max-w-md mx-4">
        <h2 className="text-2xl font-bold text-white text-center mb-6">
          投票时间
        </h2>
        <p className="text-gray-400 text-center mb-8">
          请选择你支持的一方
        </p>

        <div className="flex justify-around mb-8">
          <div className="flex flex-col items-center">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-2"
              style={{ backgroundColor: '#4A90D9' }}
            >
              {proDebaters.length > 0 ? getInitial(proDebaters[0].name) : '正'}
            </div>
            <span className="text-sm text-gray-400">正方</span>
          </div>
          <div className="flex flex-col items-center">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-2"
              style={{ backgroundColor: '#E63946' }}
            >
              {conDebaters.length > 0 ? getInitial(conDebaters[0].name) : '反'}
            </div>
            <span className="text-sm text-gray-400">反方</span>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => castVote('pro')}
            disabled={voteData.userVoted !== null}
            className="vote-btn flex-1 h-[50px] rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200"
            style={{ 
              backgroundColor: voteData.userVoted === 'pro' ? '#357ABD' : '#4A90D9',
              opacity: voteData.userVoted && voteData.userVoted !== 'pro' ? 0.5 : 1,
            }}
          >
            <ThumbsUp size={20} />
            支持正方
          </button>
          <button
            onClick={() => castVote('con')}
            disabled={voteData.userVoted !== null}
            className="vote-btn flex-1 h-[50px] rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200"
            style={{ 
              backgroundColor: voteData.userVoted === 'con' ? '#C62828' : '#E63946',
              opacity: voteData.userVoted && voteData.userVoted !== 'con' ? 0.5 : 1,
            }}
          >
            <ThumbsDown size={20} />
            支持反方
          </button>
        </div>

        {voteData.userVoted && (
          <div className="vote-result-bar mt-4">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>正方 {proPercentage}%</span>
              <span>反方 {conPercentage}%</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden flex">
              <div 
                className="h-full transition-all duration-500"
                style={{ 
                  width: `${proPercentage}%`,
                  backgroundColor: '#4A90D9',
                }}
              />
              <div 
                className="h-full transition-all duration-500"
                style={{ 
                  width: `${conPercentage}%`,
                  backgroundColor: '#E63946',
                }}
              />
            </div>
            <p className="text-center text-gray-500 text-sm mt-3">
              共 {voteData.totalVotes} 人投票
            </p>
          </div>
        )}

        {voteData.userVoted && (
          <div className="floating-badge">
            已投票
          </div>
        )}
      </div>

      <style>{`
        .vote-modal-overlay {
          backdrop-filter: blur(8px);
          background-color: rgba(0, 0, 0, 0.6);
          animation: fadeIn 0.3s ease;
        }
        .vote-modal {
          background: linear-gradient(145deg, #1e293b, #0f172a);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
          animation: slideUp 0.4s ease;
        }
        .vote-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          filter: brightness(0.9);
        }
        .vote-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .floating-badge {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(74, 222, 128, 0.2);
          color: #4ADE80;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
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
