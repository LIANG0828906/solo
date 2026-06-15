import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import Modal from './Modal';
import '../styles/VoteCreator.css';
import type { CreateVoteResponse, HistoryItem } from '../types';

const SESSION_KEY = 'livevote_session_id';
const HISTORY_KEY = 'livevote_history';

function getSessionId(): string {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

function VoteCreator() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    getSessionId();
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await fetch('/api/history');
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleAddOption = () => {
    if (options.length < 8) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      setError('请输入投票标题');
      return false;
    }
    const validOptions = options.filter((opt) => opt.trim() !== '');
    if (validOptions.length < 2) {
      setError('至少需要 2 个有效选项');
      return false;
    }
    if (validOptions.length > 8) {
      setError('最多支持 8 个选项');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    const validOptions = options.filter((opt) => opt.trim() !== '');

    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          options: validOptions,
          sessionId: getSessionId(),
        }),
      });

      if (response.ok) {
        const data: CreateVoteResponse = await response.json();
        await loadHistory();
        navigate(`/vote/${data.voteId}`);
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.message || '创建投票失败，请重试');
        setModalMessage(errData.message || '创建投票失败，请重试');
        setShowModal(true);
      }
    } catch (err) {
      console.error('Create vote error:', err);
      setError('网络错误，请检查连接后重试');
      setModalMessage('网络错误，请检查连接后重试');
      setShowModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHistoryClick = (voteId: string) => {
    navigate(`/vote/${voteId}?readonly=1`);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="page-transition">
      <div className="vote-creator-container">
        <div className="vote-creator-card">
          <h1 className="vote-creator-title">创建新投票</h1>
          <p className="vote-creator-subtitle">快速创建实时匿名投票，即时收集反馈</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">投票标题</label>
              <input
                type="text"
                className="input-field"
                placeholder="请输入投票标题"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                投票选项 ({options.length}/8)
              </label>
              <div className="options-list">
                {options.map((option, index) => (
                  <div key={index} className="option-input-row">
                    <input
                      type="text"
                      className="input-field option-input"
                      placeholder={`选项 ${index + 1}`}
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      maxLength={200}
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        className="remove-option-btn"
                        onClick={() => handleRemoveOption(index)}
                        title="删除选项"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="add-option-btn"
                onClick={handleAddOption}
                disabled={options.length >= 8}
              >
                + 添加选项
              </button>
            </div>

            {error && <p className="error-text">{error}</p>}

            <button
              type="submit"
              className="btn btn-primary create-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? '创建中...' : '创建投票'}
            </button>
          </form>
        </div>
      </div>

      <div className="history-section">
        <h2 className="history-title">历史投票</h2>
        {history.length > 0 ? (
          <div className="history-list">
            {history.map((item) => (
              <div
                key={item.id}
                className="history-card"
                onClick={() => handleHistoryClick(item.id)}
              >
                <h3 className="history-card-title">{item.title}</h3>
                <div className="history-card-meta">
                  <span>{formatDate(item.createdAt)}</span>
                  <span className="history-card-votes">{item.totalVotes} 票</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-history">
            <div className="empty-history-icon">📊</div>
            <p>暂无历史投票记录</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        title="提示"
        message={modalMessage}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
}

export default VoteCreator;
