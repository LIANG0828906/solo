import React, { useState, useMemo } from 'react';
import ChartPanel from './ChartPanel';
import ActivityTimeline from './ActivityTimeline';
import BadgeSection from './BadgeSection';
import type { CommitData, HighlightState } from '../types';
import '../styles/Dashboard.css';

interface DashboardProps {
  commits: CommitData[];
  refreshing: boolean;
}

export default function Dashboard({ commits, refreshing }: DashboardProps) {
  const [highlight, setHighlight] = useState<HighlightState>({ date: null, author: null });
  const [maskVisible, setMaskVisible] = useState(refreshing);
  const [maskFading, setMaskFading] = useState(false);

  React.useEffect(() => {
    if (refreshing) {
      setMaskVisible(true);
      setMaskFading(false);
    } else if (maskVisible && !refreshing) {
      setMaskFading(true);
      const timer = setTimeout(() => {
        setMaskVisible(false);
        setMaskFading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [refreshing, maskVisible]);

  const stats = useMemo(() => {
    const totalCommits = commits.length;
    const totalAdd = commits.reduce((s, c) => s + c.additions, 0);
    const totalDel = commits.reduce((s, c) => s + c.deletions, 0);
    const totalFiles = commits.reduce((s, c) => s + c.files.length, 0);
    const authors = new Set(commits.map((c) => c.author)).size;
    return { totalCommits, totalAdd, totalDel, totalFiles, authors };
  }, [commits]);

  return (
    <div className="dashboard">
      {maskVisible && (
        <div className={`refreshing-mask ${maskFading ? 'fading' : ''}`}>
          <div className="refreshing-spinner" />
          <div className="refreshing-text">数据更新中...</div>
        </div>
      )}

      <div className="dashboard-left">
        <ChartPanel
          commits={commits}
          highlight={highlight}
          setHighlight={setHighlight}
        />
        <ActivityTimeline
          commits={commits}
          highlight={highlight}
          setHighlight={setHighlight}
        />
      </div>

      <div className="dashboard-right">
        <BadgeSection commits={commits} />

        <div className="stats-section">
          <div className="section-title">整体数据概览</div>
          <div className="stats-grid">
            <div className="stat-card fade-in" style={{ animationDelay: '0ms' }}>
              <div className="stat-icon">📝</div>
              <div className="stat-label">总提交数</div>
              <div className="stat-value">{stats.totalCommits}</div>
            </div>
            <div className="stat-card add fade-in" style={{ animationDelay: '50ms' }}>
              <div className="stat-icon">➕</div>
              <div className="stat-label">新增行数</div>
              <div className="stat-value">{stats.totalAdd.toLocaleString()}</div>
            </div>
            <div className="stat-card del fade-in" style={{ animationDelay: '100ms' }}>
              <div className="stat-icon">➖</div>
              <div className="stat-label">删除行数</div>
              <div className="stat-value">{stats.totalDel.toLocaleString()}</div>
            </div>
            <div className="stat-card files fade-in" style={{ animationDelay: '150ms' }}>
              <div className="stat-icon">📁</div>
              <div className="stat-label">修改文件</div>
              <div className="stat-value">{stats.totalFiles.toLocaleString()}</div>
            </div>
            <div className="stat-card authors fade-in" style={{ animationDelay: '200ms', gridColumn: '1 / -1' }}>
              <div className="stat-icon">👥</div>
              <div className="stat-label">贡献人数</div>
              <div className="stat-value">{stats.authors}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
