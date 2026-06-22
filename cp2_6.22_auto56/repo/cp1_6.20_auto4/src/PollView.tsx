import React, { useState, useEffect, useCallback } from 'react';
import { useWebSocket, PollData, PollOption } from './WebSocketProvider';

interface PollViewProps {
  pollId: string;
  showToast: (message: string) => void;
}

const PollView: React.FC<PollViewProps> = ({ pollId, showToast }) => {
  const [poll, setPoll] = useState<PollData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [voted, setVoted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const { subscribe, unsubscribe } = useWebSocket();

  const fetchPoll = useCallback(async () => {
    try {
      const response = await fetch(`/api/polls/${pollId}`);
      if (!response.ok) {
        throw new Error('投票不存在');
      }
      const data = await response.json();
      setPoll(data);
      setVoted(data.hasVoted || false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [pollId, showToast]);

  useEffect(() => {
    fetchPoll();

    subscribe(pollId, (pollData) => {
      setPoll(pollData);
    });

    return () => {
      unsubscribe(pollId);
    };
  }, [pollId, subscribe, unsubscribe, fetchPoll]);

  const handleOptionClick = (optionId: string) => {
    if (voted || !poll?.isActive || submitting) return;

    if (poll.type === 'single') {
      setSelectedOptions([optionId]);
    } else {
      setSelectedOptions((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
      );
    }
  };

  const handleSubmitVote = async () => {
    if (selectedOptions.length === 0 || !poll?.isActive || submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ optionIds: selectedOptions }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '投票失败');
      }

      setVoted(true);
      showToast('投票成功！');
    } catch (err) {
      showToast(err instanceof Error ? err.message : '投票失败');
    } finally {
      setSubmitting(false);
    }
  };

  const copyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopySuccess(true);
      showToast('链接已复制到剪贴板');
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const formatDeadline = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  const getPercentage = (option: PollOption) => {
    if (!poll || poll.totalVotes === 0) return 0;
    return (option.votes / poll.totalVotes) * 100;
  };

  if (loading) {
    return (
      <div className="poll-view">
        <div className="card">
          <div className="skeleton skeleton-title"></div>
          <div className="skeleton skeleton-line" style={{ width: '80%' }}></div>
          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: '56px' }}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="poll-view">
        <div className="card">
          <h2>投票不存在</h2>
          <p>该投票可能已被删除或链接无效。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="poll-view">
      <div className="card poll-card">
        <div className="poll-header">
          <h1>{poll.title}</h1>
          {poll.description && <p className="poll-description">{poll.description}</p>}
          <div className="poll-meta">
            <span className={`status-badge ${poll.isActive ? 'active' : 'ended'}`}>
              {poll.isActive ? '进行中' : '已结束'}
            </span>
            <span className="vote-count">共 {poll.totalVotes} 票</span>
            {poll.deadline && (
              <span className="deadline">截止：{formatDeadline(poll.deadline)}</span>
            )}
          </div>
        </div>

        <div className="options-list">
          {poll.options.map((option, index) => {
            const percentage = getPercentage(option);
            const isSelected = selectedOptions.includes(option.id);
            const showResults = voted || !poll.isActive;

            return (
              <div
                key={option.id}
                className={`option-item ${isSelected ? 'selected' : ''} ${showResults ? 'show-results' : ''} ${!poll.isActive || voted ? 'disabled' : ''}`}
                onClick={() => handleOptionClick(option.id)}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="option-content">
                  <span className="option-text">{option.text}</span>
                  {showResults && (
                    <span className="option-votes">
                      {option.votes} 票 ({percentage.toFixed(1)}%)
                    </span>
                  )}
                </div>
                {showResults && (
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                )}
                {!showResults && poll.type === 'single' && (
                  <div className={`radio-indicator ${isSelected ? 'checked' : ''}`}></div>
                )}
                {!showResults && poll.type === 'multiple' && (
                  <div className={`checkbox-indicator ${isSelected ? 'checked' : ''}`}>
                    {isSelected && '✓'}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!voted && poll.isActive && (
          <button
            className="btn btn-primary vote-btn"
            onClick={handleSubmitVote}
            disabled={selectedOptions.length === 0 || submitting}
          >
            {submitting ? '提交中...' : '提交投票'}
          </button>
        )}

        {voted && (
          <div className="voted-message">
            <span className="check-icon">✓</span>
            您已成功投票
          </div>
        )}

        <div className="share-section">
          <button className="btn btn-secondary share-btn" onClick={copyShareLink}>
            {copySuccess ? '已复制！' : '分享投票链接'}
          </button>
          <input
            type="text"
            className="share-link"
            value={window.location.href}
            readOnly
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
        </div>
      </div>

      <style>{`
        .poll-view .poll-card {
          overflow: hidden;
        }

        .poll-header {
          margin-bottom: 24px;
        }

        .poll-header h1 {
          margin-bottom: 8px;
          word-break: break-word;
        }

        .poll-description {
          color: #666;
          margin-bottom: 16px;
          line-height: 1.6;
          word-break: break-word;
        }

        .poll-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 13px;
          color: #666;
        }

        .status-badge {
          padding: 4px 10px;
          border-radius: 8px;
          font-weight: 500;
          font-size: 12px;
        }

        .status-badge.active {
          background: #e8f5e9;
          color: #2e7d32;
        }

        .status-badge.ended {
          background: #ffebee;
          color: #c62828;
        }

        .vote-count {
          padding: 4px 0;
        }

        .deadline {
          padding: 4px 0;
        }

        .options-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }

        .option-item {
          position: relative;
          padding: 16px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          background: white;
          overflow: hidden;
        }

        .option-item:hover:not(.disabled) {
          border-color: #3f51b5;
          box-shadow: 0 2px 8px rgba(63, 81, 181, 0.15);
          transform: translateY(-1px);
        }

        .option-item:active:not(.disabled) {
          transform: scale(0.99);
        }

        .option-item.selected {
          border-color: #3f51b5;
          background: #f5f7ff;
        }

        .option-item.disabled {
          cursor: default;
        }

        .option-content {
          position: relative;
          z-index: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .option-text {
          font-size: 15px;
          color: #333;
          word-break: break-word;
          flex: 1;
        }

        .option-votes {
          font-size: 13px;
          color: #3f51b5;
          font-weight: 500;
          white-space: nowrap;
        }

        .progress-bar {
          position: relative;
          z-index: 0;
          height: 6px;
          background: #f0f0f0;
          border-radius: 3px;
          margin-top: 10px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3f51b5, #5c6bc0);
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .radio-indicator {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          border: 2px solid #ccc;
          border-radius: 50%;
          transition: all 0.3s ease;
        }

        .radio-indicator.checked {
          border-color: #3f51b5;
          background: #3f51b5;
          box-shadow: inset 0 0 0 4px white;
        }

        .checkbox-indicator {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          border: 2px solid #ccc;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: white;
          transition: all 0.3s ease;
        }

        .checkbox-indicator.checked {
          border-color: #3f51b5;
          background: #3f51b5;
        }

        .vote-btn {
          width: 100%;
          padding: 14px;
          font-size: 16px;
          margin-bottom: 20px;
        }

        .vote-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .voted-message {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 16px;
          background: #e8f5e9;
          color: #2e7d32;
          border-radius: 8px;
          margin-bottom: 20px;
          font-weight: 500;
        }

        .check-icon {
          width: 24px;
          height: 24px;
          background: #4caf50;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }

        .share-section {
          display: flex;
          gap: 8px;
          padding-top: 20px;
          border-top: 1px solid #eee;
        }

        .share-btn {
          white-space: nowrap;
        }

        .share-link {
          flex: 1;
          font-size: 13px;
          color: #666;
          background: #fafafa;
        }

        @media (max-width: 600px) {
          .share-section {
            flex-direction: column;
          }

          .poll-meta {
            flex-direction: column;
            gap: 6px;
          }
        }
      `}</style>
    </div>
  );
};

export default PollView;
