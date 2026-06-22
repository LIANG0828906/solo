import React, { useState, useCallback } from 'react';
import axios from 'axios';
import Dashboard from './components/Dashboard';
import type { CommitData, RunResponse } from './types';
import './styles/App.css';

export default function App() {
  const [repoPath, setRepoPath] = useState<string>('C:\\Users\\example\\project');
  const [commits, setCommits] = useState<CommitData[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [parseProgress, setParseProgress] = useState<'idle' | 'parsing' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!repoPath.trim()) {
      setError('请输入Git仓库路径');
      return;
    }

    setError(null);
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
      setParseProgress('parsing');
    }

    try {
      const response = await axios.post<RunResponse>('/api/runs', {
        repoPath: repoPath.trim(),
        useMock: true,
      });

      if (response.data.success && response.data.data) {
        setCommits(response.data.data.commits);
      } else {
        setError(response.data.error || '获取数据失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络请求失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
      if (!isRefresh) {
        setParseProgress('done');
        setTimeout(() => setParseProgress('idle'), 1000);
      }
    }
  }, [repoPath]);

  const handleLoad = () => fetchData(false);
  const handleRefresh = () => fetchData(true);

  const hasData = commits.length > 0;

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
              <circle cx="12" cy="12" r="4" />
              <line x1="16" y1="8" x2="20" y2="4" />
              <line x1="8" y1="16" x2="4" y2="20" />
              <line x1="16" y1="16" x2="20" y2="20" />
              <line x1="8" y1="8" x2="4" y2="4" />
            </svg>
          </div>
          <div className="logo-text">
            <span className="logo-title">GitBoard</span>
            <span className="logo-sub">代码活动看板</span>
          </div>
        </div>

        <div className="sidebar-section">
          <label className="input-label">仓库路径</label>
          <input
            type="text"
            className="repo-input"
            value={repoPath}
            onChange={(e) => setRepoPath(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLoad()}
            placeholder="输入本地Git仓库绝对路径"
          />
        </div>

        <button className="primary-btn" onClick={handleLoad} disabled={loading}>
          {loading ? (
            <>
              <svg className="icon-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="8" />
              </svg>
              加载中...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              加载仓库
            </>
          )}
        </button>

        {hasData && (
          <button className="secondary-btn" onClick={handleRefresh} disabled={loading || refreshing}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className={refreshing ? 'icon-spin' : ''}>
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
            </svg>
            刷新数据
          </button>
        )}

        <div className="sidebar-footer">
          <div className="parse-status">
            {parseProgress === 'parsing' && (
              <div className="status-item parsing">
                <svg className="icon-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="8" />
                </svg>
                <span>解析中...</span>
              </div>
            )}
            {parseProgress === 'done' && (
              <div className="status-item done fade-in">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>解析完成</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="main-content">
        {error && (
          <div className="error-banner">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {!hasData && !loading && !error && (
          <div className="empty-state">
            <div className="empty-illustration">
              <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" strokeWidth="1" opacity="0.6">
                <circle cx="12" cy="12" r="3" />
                <circle cx="6" cy="6" r="2" />
                <circle cx="18" cy="6" r="2" />
                <circle cx="6" cy="18" r="2" />
                <circle cx="18" cy="18" r="2" />
                <line x1="9.5" y1="10.5" x2="7.5" y2="7.5" />
                <line x1="14.5" y1="10.5" x2="16.5" y2="7.5" />
                <line x1="9.5" y1="13.5" x2="7.5" y2="16.5" />
                <line x1="14.5" y1="13.5" x2="16.5" y2="16.5" />
              </svg>
            </div>
            <h2 className="empty-title">输入仓库路径开始分析</h2>
            <p className="empty-desc">系统将自动解析最近 30 天的提交历史，生成多维度可视化报告</p>
          </div>
        )}

        {hasData && (
          <Dashboard
            commits={commits}
            refreshing={refreshing}
          />
        )}
      </main>
    </div>
  );
}
