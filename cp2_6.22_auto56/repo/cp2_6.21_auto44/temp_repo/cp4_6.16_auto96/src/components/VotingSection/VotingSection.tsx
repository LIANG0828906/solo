import { useState, useEffect } from 'react';
import { Vote, Plus, Trophy, BookOpenCheck } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { VotingSystem } from '@/modules/voting/VotingSystem';
import type { PollOption } from '@/types';
import './VotingSection.css';

interface VotingSectionProps {
  clubId: string;
  onCreatePollClick?: () => void;
  isHost?: boolean;
}

const CONFETTI_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];

const VotingSection = ({ clubId, onCreatePollClick, isHost = false }: VotingSectionProps) => {
  const polls = useAppStore(state => state.polls);
  const currentMemberMap = useAppStore(state => state.currentMemberMap);
  const [animatedPercentages, setAnimatedPercentages] = useState<Record<string, number>>({});
  const [showConfetti, setShowConfetti] = useState<string | null>(null);
  const [showWinnerConfetti, setShowWinnerConfetti] = useState(false);

  const memberId = currentMemberMap[clubId];

  const activePoll = polls.find(
    p => p.clubId === clubId && p.status === 'active'
  );

  const endedPoll = polls.find(
    p => p.clubId === clubId && p.status === 'ended'
  );

  useEffect(() => {
    if (!activePoll) return;

    const timer = setTimeout(() => {
      const percentages: Record<string, number> = {};
      const totalVotes = activePoll.options.reduce((sum, opt) => sum + opt.voteCount, 0);
      activePoll.options.forEach(opt => {
        percentages[opt.id] = totalVotes > 0 ? (opt.voteCount / totalVotes) * 100 : 0;
      });
      setAnimatedPercentages(percentages);
    }, 50);

    return () => clearTimeout(timer);
  }, [activePoll]);

  useEffect(() => {
    if (endedPoll && endedPoll.status === 'ended') {
      const sorted = [...endedPoll.options].sort((a, b) => b.voteCount - a.voteCount);
      if (sorted.length > 0 && sorted[0].voteCount > 0) {
        setShowWinnerConfetti(true);
        setTimeout(() => setShowWinnerConfetti(false), 2000);
      }
    }
  }, [endedPoll]);

  const currentPoll = activePoll || endedPoll;

  const sortedOptions = currentPoll
    ? [...currentPoll.options].sort((a, b) => b.voteCount - a.voteCount)
    : [];

  const winner = sortedOptions.length > 0 && sortedOptions[0].voteCount > 0 ? sortedOptions[0] : null;

  const showWinnerBanner = endedPoll?.status === 'ended' && winner;

  const hasVoted = activePoll && memberId
    ? VotingSystem.hasUserVoted(activePoll.id, memberId)
    : false;

  const userVote = activePoll && memberId
    ? VotingSystem.getUserVote(activePoll.id, memberId)
    : null;

  const handleVote = (optionId: string) => {
    if (!activePoll || !memberId || hasVoted) return;

    VotingSystem.submitVote(activePoll.id, memberId, optionId);

    const option = activePoll.options.find(o => o.id === optionId);
    if (option && option.voteCount === 0) {
      setShowConfetti(optionId);
      setTimeout(() => setShowConfetti(null), 2000);
    }
  };

  const generateConfetti = (count: number) => {
    const pieces = [];
    for (let i = 0; i < count; i++) {
      const left = Math.random() * 100;
      const delay = Math.random() * 0.5;
      const duration = 1.5 + Math.random() * 1;
      const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      pieces.push(
        <div
          key={i}
          className="confetti-piece"
          style={{
            left: `${left}%`,
            top: '-10px',
            backgroundColor: color,
            animationDelay: `${delay}s`,
            animationDuration: `${duration}s`,
          }}
        />
      );
    }
    return pieces;
  };

  const generateWinnerConfetti = (count: number) => {
    const pieces = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() * Math.PI * 2);
      const distance = 80 + Math.random() * 120;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;
      const delay = Math.random() * 0.3;
      const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      pieces.push(
        <div
          key={i}
          className="winner-confetti-piece"
          style={{
            backgroundColor: color,
            '--tx': `${tx}px`,
            '--ty': `${ty}px`,
            animationDelay: `${delay}s`,
          } as React.CSSProperties}
        />
      );
    }
    return pieces;
  };

  const renderPollCard = (option: PollOption, index: number) => {
    const isWinning = winner?.id === option.id && option.voteCount > 0;
    const isVoted = userVote?.optionId === option.id;
    const percentage = animatedPercentages[option.id] || 0;
    const rank = index + 1;

    return (
      <div
        key={option.id}
        className={`poll-card ${isWinning ? 'poll-card-winning' : ''}`}
      >
        {showConfetti === option.id && (
          <div className="poll-card-confetti">
            {generateConfetti(20)}
          </div>
        )}

        <div className={`poll-card-rank poll-card-rank-${rank}`}>
          {rank}
        </div>

        {isWinning && (
          <div className="poll-trophy">
            <Trophy size={24} color="#fbbf24" fill="#fbbf24" />
          </div>
        )}

        <div className="poll-card-header">
          <span className="poll-book-title">{option.bookTitle}</span>
          <span className="poll-vote-count">{option.voteCount} 票</span>
        </div>

        <p className="poll-description">{option.description}</p>

        <div className="poll-progress-track">
          <div
            className={`poll-progress-fill poll-progress-color-${option.colorIndex % 6}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <button
          className={`poll-vote-btn ${isVoted ? 'poll-vote-btn-voted' : ''}`}
          onClick={() => handleVote(option.id)}
          disabled={hasVoted || activePoll?.status === 'ended'}
        >
          {isVoted ? '已投票' : hasVoted ? '已投票' : '投票'}
        </button>
      </div>
    );
  };

  return (
    <div className="voting-section">
      <div className="voting-header">
        <span className="voting-title">
          <Vote size={18} />
          下一本书投票
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {currentPoll && (
            <span className={`voting-status voting-status-${currentPoll.status}`}>
              {currentPoll.status === 'active' ? '进行中' : '已结束'}
            </span>
          )}
          {isHost && (
            <button
              className="voting-create-btn"
              onClick={onCreatePollClick}
            >
              <Plus size={16} />
              创建投票
            </button>
          )}
        </div>
      </div>

      {showWinnerBanner && winner && (
        <div className="winner-banner">
          {showWinnerConfetti && (
            <div className="winner-confetti-container">
              {generateWinnerConfetti(50)}
            </div>
          )}
          <Trophy className="winner-trophy" size={64} color="#fbbf24" fill="#fbbf24" />
          <div className="winner-subtitle">🎉 下一本书是：</div>
          <div className="winner-title">{winner.bookTitle}</div>
        </div>
      )}

      {currentPoll && sortedOptions.length > 0 ? (
        <div className="poll-cards">
          {sortedOptions.map((option, index) => renderPollCard(option, index))}
        </div>
      ) : (
        <div className="poll-empty">
          <div className="poll-empty-icon">
            <BookOpenCheck size={40} />
          </div>
          <p className="poll-empty-text">暂无进行中的投票</p>
        </div>
      )}
    </div>
  );
};

export default VotingSection;
