import { useState } from 'react';
import { Announcement } from '../types';

interface AnnouncementCardProps {
  announcement: Announcement;
  onInitiateVote: (announcementId: string) => void;
  onViewVote: (announcementId: string) => void;
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  return new Date(timestamp).toLocaleDateString('zh-CN');
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

function getTotalVotes(votes?: { options: { votes: number }[] }[]): number {
  if (!votes || votes.length === 0) return 0;
  return votes.reduce(
    (total, vote) =>
      total + vote.options.reduce((sum, opt) => sum + opt.votes, 0),
    0
  );
}

function AnnouncementCard({ announcement, onInitiateVote, onViewVote }: AnnouncementCardProps) {
  const [expanded, setExpanded] = useState(false);

  const hasVotes = announcement.votes && announcement.votes.length > 0;
  const totalVotes = getTotalVotes(announcement.votes);

  const handleCardClick = () => {
    setExpanded(prev => !prev);
  };

  const handleVoteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasVotes) {
      onViewVote(announcement.id);
    } else {
      onInitiateVote(announcement.id);
    }
  };

  const handleInitiateVoteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onInitiateVote(announcement.id);
  };

  return (
    <div className="announcement-card" onClick={handleCardClick}>
      <div className="card-header">
        <h3 className="card-title" title={announcement.title}>
          {truncateText(announcement.title, 30)}
        </h3>
        <span className="card-meta">{formatTimeAgo(announcement.createdAt)}</span>
      </div>

      <div className="card-author">作者：{announcement.author}</div>

      {!expanded && (
        <p className="card-summary">{truncateText(announcement.content, 100)}</p>
      )}

      <div className={`card-content ${expanded ? 'expanded' : ''}`}>
        <div className="card-content-inner">
          <p className="card-content-text">{announcement.content}</p>

          <div className="card-actions">
            <button className="action-btn" onClick={handleInitiateVoteClick}>
              发起投票
            </button>
            {hasVotes && (
              <button className="action-btn" onClick={handleVoteClick}>
                查看投票 ({totalVotes}票)
              </button>
            )}
          </div>

          {hasVotes && (
            <div className="card-footer">
              {announcement.votes!.map(vote => {
                const voteTotal = vote.options.reduce((sum, opt) => sum + opt.votes, 0);
                return (
                  <div key={vote.id} className="vote-stat">
                    <div className="vote-stat-title">{vote.title}</div>
                    {vote.options.map(option => {
                      const percentage = voteTotal > 0 ? (option.votes / voteTotal) * 100 : 0;
                      return (
                        <div key={option.id} className="vote-stat-item">
                          <div className="vote-stat-label">
                            <span>{option.text}</span>
                            <span>
                              {option.votes}票 ({percentage.toFixed(0)}%)
                            </span>
                          </div>
                          <div className="vote-stat-bar">
                            <div
                              className="vote-stat-fill"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AnnouncementCard;
