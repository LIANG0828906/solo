import React, { useState, useEffect, useRef, useCallback } from 'react';
import VotePanel from './VotePanel';
import ResultChart from './charts/ResultChart';
import { Vote, VoteType, VoteOption, WSMessage, VoteSubmission } from './types';
import { v4 as uuidv4 } from 'uuid';

type UserRole = 'host' | 'participant';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>('host');
  const [votes, setVotes] = useState<Vote[]>([]);
  const [selectedVoteId, setSelectedVoteId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const clientIdRef = useRef<string>(uuidv4());

  const [voteType, setVoteType] = useState<VoteType>('single');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);

  const selectedVote = votes.find(v => v.id === selectedVoteId) || null;

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onmessage = (event) => {
      const message: WSMessage = JSON.parse(event.data);

      switch (message.type) {
        case 'init':
          clientIdRef.current = message.payload.clientId;
          setVotes(message.payload.votes || []);
          if (message.payload.votes?.length > 0) {
            const activeVote = message.payload.votes.find((v: Vote) => v.isActive);
            if (activeVote) {
              setSelectedVoteId(activeVote.id);
            }
          }
          break;

        case 'vote_update':
          const updatedVote = message.payload.vote as Vote;
          setVotes(prevVotes => {
            const existingIndex = prevVotes.findIndex(v => v.id === updatedVote.id);
            if (existingIndex >= 0) {
              const newVotes = [...prevVotes];
              newVotes[existingIndex] = updatedVote;
              return newVotes;
            }
            return [...prevVotes, updatedVote];
          });
          if (message.payload.action === 'started') {
            setSelectedVoteId(updatedVote.id);
          }
          break;

        case 'vote_list':
          setVotes(message.payload.votes || []);
          break;
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const sendMessage = useCallback((type: string, payload: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  const handleCreateVote = () => {
    if (!question.trim()) return;

    let voteOptions: VoteOption[] = [];
    if (voteType === 'rating') {
      voteOptions = [
        { id: uuidv4(), text: '1星' },
        { id: uuidv4(), text: '2星' },
        { id: uuidv4(), text: '3星' },
        { id: uuidv4(), text: '4星' },
        { id: uuidv4(), text: '5星' }
      ];
    } else {
      voteOptions = options
        .filter(o => o.trim())
        .map(text => ({ id: uuidv4(), text: text.trim() }));
    }

    if (voteOptions.length < 2) return;

    sendMessage('start_vote', {
      type: voteType,
      question: question.trim(),
      options: voteOptions
    });

    setIsModalOpen(false);
    setQuestion('');
    setOptions(['', '']);
    setVoteType('single');
  };

  const handleEndVote = () => {
    if (selectedVoteId) {
      sendMessage('end_vote', { voteId: selectedVoteId });
    }
  };

  const handleSubmitVote = (submission: Omit<VoteSubmission, 'participantId' | 'voteId'>) => {
    if (!selectedVoteId) return;
    sendMessage('submit_vote', {
      voteId: selectedVoteId,
      participantId: clientIdRef.current,
      ...submission
    } as VoteSubmission);
  };

  const handleExportCSV = () => {
    if (selectedVoteId) {
      window.open(`/api/votes/${selectedVoteId}/export`, '_blank');
    }
  };

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const activeVotes = votes.filter(v => v.isActive);
  const endedVotes = votes.filter(v => !v.isActive);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-title">
          <div className="app-title-icon">📊</div>
          <span>实时投票系统</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="role-selector">
            <button
              className={`role-btn ${role === 'host' ? 'active' : ''}`}
              onClick={() => setRole('host')}
            >
              主持人
            </button>
            <button
              className={`role-btn ${role === 'participant' ? 'active' : ''}`}
              onClick={() => setRole('participant')}
            >
              参会者
            </button>
          </div>

          <div className="connection-status">
            <span className={`status-dot ${isConnected ? '' : 'disconnected'}`}></span>
            <span>{isConnected ? '已连接' : '连接中...'}</span>
          </div>
        </div>
      </header>

      <div className="main-layout">
        <div className="card vote-enter-animation" key={selectedVoteId || 'empty'}>
          <div className="card-header">
            <h2 className="card-title">
              {role === 'host' ? '投票管理' : '参与投票'}
            </h2>
            {selectedVote && (
              <span className={`vote-status ${selectedVote.isActive ? 'active' : 'ended'}`}>
                {selectedVote.isActive ? '进行中' : '已结束'}
              </span>
            )}
          </div>

          {role === 'host' && (
            <div style={{ marginBottom: '20px', display: 'flex', gap: '12px' }}>
              <button className="create-vote-btn" onClick={() => setIsModalOpen(true)}>
                + 创建投票
              </button>
              {selectedVote && selectedVote.isActive && (
                <button className="end-vote-btn" onClick={handleEndVote}>
                  结束投票
                </button>
              )}
            </div>
          )}

          {votes.length > 0 && (
            <div style={{ marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {[...activeVotes, ...endedVotes].map(vote => (
                <button
                  key={vote.id}
                  onClick={() => setSelectedVoteId(vote.id)}
                  style={{
                    padding: '6px 14px',
                    border: '2px solid',
                    borderColor: selectedVoteId === vote.id ? 'var(--primary-blue)' : 'var(--medium-gray)',
                    background: selectedVoteId === vote.id ? 'var(--primary-light)' : 'var(--white)',
                    borderRadius: '20px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    color: selectedVoteId === vote.id ? 'var(--primary-blue)' : 'var(--text-secondary)',
                    fontWeight: '500',
                    transition: 'all 0.15s ease',
                    maxWidth: '200px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {vote.isActive ? '● ' : '○ '}
                  {vote.question}
                </button>
              ))}
            </div>
          )}

          {selectedVote ? (
            <VotePanel
              vote={selectedVote}
              isHost={role === 'host'}
              onSubmitVote={handleSubmitVote}
              onEndVote={handleEndVote}
            />
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🗳️</div>
              <div className="empty-state-text">
                {role === 'host' ? '暂无投票，点击上方按钮创建' : '暂无进行中的投票'}
              </div>
              <div className="empty-state-hint">等待主持人发起投票...</div>
            </div>
          )}
        </div>

        <div className="card vote-enter-animation" key={`chart-${selectedVoteId || 'empty'}`}>
          <div className="card-header">
            <h2 className="card-title">实时结果</h2>
            {role === 'host' && selectedVote && !selectedVote.isActive && (
              <button className="export-btn" onClick={handleExportCSV}>
                导出CSV
              </button>
            )}
          </div>

          {selectedVote ? (
            <ResultChart vote={selectedVote} />
          ) : (
            <div className="empty-state" style={{ minHeight: '300px' }}>
              <div className="empty-state-icon">📈</div>
              <div className="empty-state-text">选择投票查看结果</div>
            </div>
          )}
        </div>
      </div>

      <div className={`modal-overlay ${isModalOpen ? 'open' : ''}`} onClick={() => setIsModalOpen(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">创建投票</h2>
            <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
          </div>

          <div className="form-group">
            <label className="form-label">投票类型</label>
            <div className="type-selector">
              <div
                className={`type-option ${voteType === 'single' ? 'selected' : ''}`}
                onClick={() => setVoteType('single')}
              >
                <div className="type-option-icon">◉</div>
                <div className="type-option-label">单选题</div>
              </div>
              <div
                className={`type-option ${voteType === 'multiple' ? 'selected' : ''}`}
                onClick={() => setVoteType('multiple')}
              >
                <div className="type-option-icon">☑</div>
                <div className="type-option-label">多选题</div>
              </div>
              <div
                className={`type-option ${voteType === 'rating' ? 'selected' : ''}`}
                onClick={() => setVoteType('rating')}
              >
                <div className="type-option-icon">⭐</div>
                <div className="type-option-label">评分题</div>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">问题内容</label>
            <textarea
              className="form-textarea"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="请输入投票问题..."
              rows={3}
            />
          </div>

          {voteType !== 'rating' && (
            <div className="form-group">
              <label className="form-label">选项</label>
              {options.map((opt, index) => (
                <div key={index} className="option-input-group">
                  <input
                    type="text"
                    className="form-input"
                    value={opt}
                    onChange={e => updateOption(index, e.target.value)}
                    placeholder={`选项 ${index + 1}`}
                  />
                  <button
                    className="remove-option-btn"
                    onClick={() => removeOption(index)}
                    disabled={options.length <= 2}
                  >
                    ×
                  </button>
                </div>
              ))}
              {options.length < 10 && (
                <button className="add-option-btn" onClick={addOption}>
                  + 添加选项
                </button>
              )}
            </div>
          )}

          <div className="modal-footer">
            <button className="btn-secondary" onClick={() => setIsModalOpen(false)}>
              取消
            </button>
            <button
              className="btn-primary"
              onClick={handleCreateVote}
              disabled={!question.trim() || (voteType !== 'rating' && options.filter(o => o.trim()).length < 2)}
            >
              发起投票
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
