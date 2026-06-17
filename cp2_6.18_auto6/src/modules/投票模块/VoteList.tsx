import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppStore } from '../../store';
import type { SortType } from '../../types';
import './VoteList.css';

function VoteList() {
  const votes = useAppStore((state) => state.votes);
  const searchQuery = useAppStore((state) => state.searchQuery);
  const sortType = useAppStore((state) => state.sortType);
  const votedIds = useAppStore((state) => state.votedIds);
  const createVote = useAppStore((state) => state.createVote);
  const castVote = useAppStore((state) => state.castVote);
  const setSearchQuery = useAppStore((state) => state.setSearchQuery);
  const setSortType = useAppStore((state) => state.setSortType);
  const getVotedOption = useAppStore((state) => state.getVotedOption);

  const [title, setTitle] = useState('');
  const [optionsText, setOptionsText] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, setSearchQuery]);

  const filteredVotes = useMemo(() => {
    let result = [...votes];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((v) => v.title.toLowerCase().includes(query));
    }

    switch (sortType) {
      case 'time-desc':
        result.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'time-asc':
        result.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case 'votes-desc':
        result.sort((a, b) => {
          const totalA = a.options.reduce((sum, o) => sum + o.votes, 0);
          const totalB = b.options.reduce((sum, o) => sum + o.votes, 0);
          return totalB - totalA;
        });
        break;
    }

    return result;
  }, [votes, searchQuery, sortType]);

  const hasVoted = useCallback(
    (voteId: string) => !!votedIds[voteId],
    [votedIds]
  );

  const getVotedOptionId = useCallback(
    (voteId: string) => getVotedOption(voteId),
    [getVotedOption]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setFormError('');

      if (!title.trim()) {
        setFormError('请输入投票标题');
        return;
      }

      const optionLines = optionsText
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      if (optionLines.length < 2) {
        setFormError('至少需要2个选项');
        return;
      }

      if (optionLines.length > 6) {
        setFormError('最多支持6个选项');
        return;
      }

      createVote(title.trim(), optionLines);
      setTitle('');
      setOptionsText('');
    },
    [title, optionsText, createVote]
  );

  const handleVote = useCallback(
    (voteId: string, optionId: string) => {
      castVote(voteId, optionId);
    },
    [castVote]
  );

  const handleSortChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSortType(e.target.value as SortType);
    },
    [setSortType]
  );

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTotalVotes = (options: { votes: number }[]) =>
    options.reduce((sum, o) => sum + o.votes, 0);

  return (
    <div className="vote-list-page">
      <div className="page-header">
        <h1 className="page-title">功能投票</h1>
        <hr className="page-divider" />
      </div>

      <form className="create-form" onSubmit={handleSubmit}>
        <h2 className="form-title">创建新投票</h2>
        <input
          type="text"
          className="form-input"
          placeholder="输入投票标题..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="form-textarea"
          placeholder="输入选项（每行一个，至少2个，最多6个）..."
          value={optionsText}
          onChange={(e) => setOptionsText(e.target.value)}
          rows={4}
        />
        {formError && <p className="form-error">{formError}</p>}
        <button type="submit" className="submit-btn">
          创建投票
        </button>
      </form>

      <div className="toolbar">
        <div className="search-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="搜索投票..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="sort-wrapper">
          <select
            className="sort-select"
            value={sortType}
            onChange={handleSortChange}
          >
            <option value="time-desc">按时间降序</option>
            <option value="votes-desc">按票数降序</option>
            <option value="time-asc">按时间升序</option>
          </select>
        </div>
      </div>

      <div className="vote-grid">
        {filteredVotes.map((vote) => {
          const voted = hasVoted(vote.id);
          const total = getTotalVotes(vote.options);
          return (
            <div key={vote.id} className="vote-card">
              <h3 className="vote-title">{vote.title}</h3>
              <div className="vote-options">
                {vote.options.map((option) => {
                  const votedOptionId = getVotedOptionId(vote.id);
                  const isVotedOption = votedOptionId === option.id;
                  return (
                    <button
                      key={option.id}
                      className={`option-btn ${voted ? 'disabled' : ''} ${isVotedOption ? 'voted' : ''}`}
                      onClick={() => !voted && handleVote(vote.id, option.id)}
                      disabled={voted}
                    >
                      <span className="option-text">{option.text}</span>
                      <span className="option-votes">{option.votes}票</span>
                    </button>
                  );
                })}
              </div>
              <div className="vote-footer">
                <span className="total-votes">总票数：{total}</span>
                <span className="create-time">{formatDate(vote.createdAt)}</span>
              </div>
              {voted && <span className="voted-badge">已投票</span>}
            </div>
          );
        })}
      </div>

      {filteredVotes.length === 0 && (
        <div className="empty-state">
          <p>暂无投票，快来创建第一个吧！</p>
        </div>
      )}
    </div>
  );
}

export default VoteList;
