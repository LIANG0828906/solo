import { useState, useEffect } from 'react';
import { Announcement, Vote, VoteOption } from '../types';

interface VoteModalProps {
  announcement: Announcement;
  showCreate: boolean;
  onClose: () => void;
  onVoteCreated: (vote: Vote) => void;
  onVoteSubmitted: (vote: Vote) => void;
}

function VoteModal({
  announcement,
  showCreate,
  onClose,
  onVoteCreated,
  onVoteSubmitted
}: VoteModalProps) {
  const [mode, setMode] = useState<'create' | 'view'>(showCreate ? 'create' : 'view');
  const [voteTitle, setVoteTitle] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [selectedVoteId, setSelectedVoteId] = useState<string | null>(null);
  const [votedIds, setVotedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('voted_ids');
    if (stored) {
      setVotedIds(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    if (announcement.votes && announcement.votes.length > 0) {
      setSelectedVoteId(announcement.votes[0].id);
    }
  }, [announcement.votes]);

  const handleAddOption = () => {
    if (options.length < 4) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleCreateVote = async () => {
    if (!voteTitle.trim()) {
      alert('请输入投票标题');
      return;
    }
    const validOptions = options.filter(opt => opt.trim() !== '');
    if (validOptions.length < 2) {
      alert('至少需要2个有效选项');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          announcementId: announcement.id,
          title: voteTitle,
          options: validOptions
        })
      });
      const data = await response.json();
      if (data.vote) {
        onVoteCreated(data.vote);
      }
    } catch (error) {
      console.error('创建投票失败:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleVote = async (voteId: string, optionId: string) => {
    if (votedIds.includes(voteId)) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/votes/${voteId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ optionId })
      });
      const data = await response.json();
      if (data.vote) {
        const newVotedIds = [...votedIds, voteId];
        setVotedIds(newVotedIds);
        localStorage.setItem('voted_ids', JSON.stringify(newVotedIds));
        onVoteSubmitted(data.vote);
      }
    } catch (error) {
      console.error('投票失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedVote = announcement.votes?.find(v => v.id === selectedVoteId);
  const hasVoted = selectedVoteId ? votedIds.includes(selectedVoteId) : false;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getTotalVotes = (voteOptions: VoteOption[]) => {
    return voteOptions.reduce((sum, opt) => sum + opt.votes, 0);
  };

  const getPercentage = (votes: number, total: number) => {
    return total > 0 ? (votes / total) * 100 : 0;
  };

  const handleOptionClick = (optionId: string) => {
    if (!hasVoted && !submitting && selectedVote) {
      handleVote(selectedVote.id, optionId);
    }
  };

  const getOptionClassName = () => {
    let className = 'vote-option-card';
    if (hasVoted) {
      className += ' voted disabled';
    }
    return className;
  };

  const renderCreateMode = () => {
    return (
      <>
        <div className="form-group">
          <label>投票标题 *</label>
          <input
            type="text"
            className="vote-option-input"
            value={voteTitle}
            onChange={e => setVoteTitle(e.target.value)}
            placeholder="请输入投票标题"
          />
        </div>

        <div className="form-group">
          <label>投票选项 * (至少2个，最多4个)</label>
          <div className="vote-options-list">
            {options.map((option, index) => (
              <div key={index} className="vote-option-item">
                <input
                  type="text"
                  className="vote-option-input"
                  value={option}
                  onChange={e => handleOptionChange(index, e.target.value)}
                  placeholder={`选项 ${index + 1}`}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    className="vote-option-delete"
                    onClick={() => handleRemoveOption(index)}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          {options.length < 4 && (
            <button
              type="button"
              className="add-option-btn"
              onClick={handleAddOption}
            >
              + 添加选项
            </button>
          )}
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>
            取消
          </button>
          <button
            className="submit-btn"
            onClick={handleCreateVote}
            disabled={creating}
          >
            {creating ? '创建中...' : '创建投票'}
          </button>
        </div>
      </>
    );
  };

  const renderViewMode = () => {
    const totalVotes = selectedVote ? getTotalVotes(selectedVote.options) : 0;

    return (
      <>
        {announcement.votes && announcement.votes.length > 1 && (
          <div className="form-group">
            <label>选择投票</label>
            <select
              className="vote-option-input"
              value={selectedVoteId || ''}
              onChange={e => setSelectedVoteId(e.target.value)}
            >
              {announcement.votes.map(vote => (
                <option key={vote.id} value={vote.id}>
                  {vote.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedVote && (
          <>
            <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>
              {selectedVote.title}
              {hasVoted && <span className="voted-badge">已投票</span>}
            </h3>

            <div className="vote-options-display">
              {selectedVote.options.map(option => {
                const percentage = getPercentage(option.votes, totalVotes);
                const widthStyle = { width: percentage + '%' };

                return (
                  <div
                    key={option.id}
                    className={getOptionClassName()}
                    onClick={() => handleOptionClick(option.id)}
                  >
                    <div className="option-label">
                      <span>{option.text}</span>
                      <span className="option-vote-count">
                        {option.votes}票 ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="option-progress">
                      <div
                        className="option-progress-fill"
                        style={widthStyle}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ fontSize: '13px', color: '#888', marginBottom: '16px' }}>
              共 {totalVotes} 票
            </div>
          </>
        )}

        <div className="modal-actions">
          <button
            className="action-btn"
            onClick={() => setMode('create')}
            style={{ marginRight: 'auto' }}
          >
            发起新投票
          </button>
          <button className="cancel-btn" onClick={onClose}>
            关闭
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">
            {mode === 'create' ? '发起投票' : '投票详情'}
          </h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {mode === 'create' ? renderCreateMode() : renderViewMode()}
      </div>
    </div>
  );
}

export default VoteModal;
