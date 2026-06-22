import { useEffect, useRef, useState, useCallback } from 'react';
import { useProposalStore } from './store';
import { ProposalCard } from './components/ProposalCard';
import { authService } from '../user/auth';
import type { ProposalCategory, ProposalStatus } from './types';
import './ProposalList.css';

export const ProposalList = () => {
  const { proposals, loading, hasMore, total, category, status, fetchProposals, loadMore, setCategory, setStatus, setKeyword, deleteProposal } = useProposalStore();
  const [searchInput, setSearchInput] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isAdmin = authService.isAdmin();

  useEffect(() => {
    fetchProposals(true);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]);

  const handleSearch = useCallback(() => {
    setKeyword(searchInput);
  }, [searchInput, setKeyword]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const categories: (ProposalCategory | 'all')[] = ['all', '技术', '市场', '管理'];
  const statuses: (ProposalStatus | 'all')[] = ['all', '审核中', '已通过', '已关闭'];

  const handleDelete = (id: string) => {
    deleteProposal(id);
  };

  return (
    <div className="proposal-list-page">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">提案广场</h1>
          <p className="page-subtitle">共 {total} 个创意提案</p>
        </div>

        <div className="search-bar">
          <div className="search-input-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="搜索提案..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="search-input"
            />
            {searchInput && (
              <button 
                className="clear-btn"
                onClick={() => { setSearchInput(''); setKeyword(''); }}
              >
                ×
              </button>
            )}
          </div>
          <button className="search-btn" onClick={handleSearch}>
            搜索
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <span className="filter-label">分类：</span>
          <div className="filter-buttons">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`filter-btn ${(category || 'all') === cat ? 'active' : ''}`}
                onClick={() => setCategory(cat === 'all' ? undefined : (cat as ProposalCategory))}
              >
                {cat === 'all' ? '全部' : cat}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <span className="filter-label">状态：</span>
          <div className="filter-buttons">
            {statuses.map((stat) => (
              <button
                key={stat}
                className={`filter-btn status-btn ${(status || 'all') === stat ? 'active' : ''}`}
                onClick={() => setStatus(stat === 'all' ? undefined : (stat as ProposalStatus))}
              >
                {stat === 'all' ? '全部' : stat}
              </button>
            ))}
          </div>
        </div>

        {isAdmin && (
          <div className="admin-hint">
            <span className="admin-badge">管理员模式</span>
            <span className="hint-text">悬停卡片可进行置顶/删除操作</span>
          </div>
        )}
      </div>

      <div ref={containerRef} className="proposals-masonry">
        {proposals.map((proposal) => (
          <ProposalCard 
            key={proposal.id} 
            proposal={proposal}
            onDelete={isAdmin ? handleDelete : undefined}
          />
        ))}
      </div>

      <div ref={sentinelRef} className="load-more-sentinel">
        {loading && (
          <div className="loading-more">
            <div className="loading-spinner-small"></div>
            <span>加载中...</span>
          </div>
        )}
        {!hasMore && proposals.length > 0 && (
          <div className="no-more">
            — 已经到底啦 —
          </div>
        )}
        {!loading && proposals.length === 0 && (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <p>暂无提案，快去提交第一个吧！</p>
          </div>
        )}
      </div>
    </div>
  );
};
