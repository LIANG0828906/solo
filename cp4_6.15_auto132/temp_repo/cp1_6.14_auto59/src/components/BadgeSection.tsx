import React, { useState, useMemo, useEffect } from 'react';
import type { CommitData } from '../types';

interface BadgeSectionProps {
  commits: CommitData[];
}

interface AuthorStats {
  author: string;
  fileCount: number;
  additions: number;
  commits: CommitData[];
}

interface ModalData {
  author: string;
  type: 'gold' | 'silver';
  commits: CommitData[];
  fileCount: number;
  additions: number;
}

export default function BadgeSection({ commits }: BadgeSectionProps) {
  const [modalData, setModalData] = useState<ModalData | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);

  const { goldWinner, silverWinner } = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentCommits = commits.filter((commit) => {
      const commitDate = new Date(commit.date);
      return commitDate >= sevenDaysAgo;
    });

    if (recentCommits.length === 0) {
      return { goldWinner: null, silverWinner: null };
    }

    const authorMap = new Map<string, AuthorStats>();

    recentCommits.forEach((commit) => {
      const existing = authorMap.get(commit.author) || {
        author: commit.author,
        fileCount: 0,
        additions: 0,
        commits: [],
      };
      existing.fileCount += commit.files.length;
      existing.additions += commit.additions;
      existing.commits.push(commit);
      authorMap.set(commit.author, existing);
    });

    const stats = Array.from(authorMap.values());

    let gold: AuthorStats | null = null;
    let silver: AuthorStats | null = null;

    stats.forEach((stat) => {
      if (!gold || stat.fileCount > gold.fileCount) {
        gold = stat;
      }
      if (!silver || stat.additions > silver.additions) {
        silver = stat;
      }
    });

    return { goldWinner: gold, silverWinner: silver };
  }, [commits]);

  const handleBadgeClick = (type: 'gold' | 'silver', winner: AuthorStats) => {
    setModalData({
      author: winner.author,
      type,
      commits: winner.commits,
      fileCount: winner.fileCount,
      additions: winner.additions,
    });
    setIsModalVisible(true);
    setIsModalClosing(false);
  };

  const closeModal = () => {
    setIsModalClosing(true);
    setTimeout(() => {
      setIsModalVisible(false);
      setModalData(null);
      setIsModalClosing(false);
    }, 300);
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalVisible && !isModalClosing) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isModalVisible, isModalClosing]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const hasData = goldWinner || silverWinner;

  return (
    <div className="badge-section">
      <style>{`
        .badge-section {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          padding: 20px;
          background-color: rgba(22, 33, 62, 0.6);
          border-radius: 12px;
          position: relative;
        }

        .badge-section-header {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }

        .badge-section-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .badge-section-subtitle {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .guide-icon {
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, var(--accent-blue), var(--accent-green));
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: bold;
          color: var(--bg-primary);
        }

        .badge-card {
          flex: 1;
          min-width: 160px;
          padding: 20px;
          border-radius: 12px;
          text-align: center;
          transition: all 0.3s ease;
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }

        .badge-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.1);
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }

        .badge-card:hover::before {
          opacity: 1;
        }

        .badge-card.gold {
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%);
          color: #1a1a2e;
          box-shadow: 0 4px 20px rgba(251, 191, 36, 0.4);
        }

        .badge-card.silver {
          background: linear-gradient(135deg, #e5e7eb 0%, #9ca3af 50%, #6b7280 100%);
          color: #1a1a2e;
          box-shadow: 0 0 5px rgba(156, 163, 175, 0.5);
        }

        .badge-card.silver .badge-icon {
          animation: pulse 2s infinite;
        }

        .badge-card:hover {
          transform: translateY(-3px);
        }

        .badge-card.gold:hover {
          box-shadow: 0 6px 30px rgba(251, 191, 36, 0.6);
        }

        .badge-icon {
          font-size: 40px;
          margin-bottom: 12px;
          display: inline-block;
        }

        .badge-card.gold .badge-icon {
          animation: spinScale 1s ease-in-out infinite;
        }

        @keyframes spinScale {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.15); }
          100% { transform: rotate(360deg) scale(1); }
        }

        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 5px rgba(156, 163, 175, 0.5);
            filter: drop-shadow(0 0 5px rgba(156, 163, 175, 0.5));
          }
          50% {
            box-shadow: 0 0 25px rgba(156, 163, 175, 0.9), 0 0 40px rgba(156, 163, 175, 0.4);
            filter: drop-shadow(0 0 15px rgba(156, 163, 175, 0.9));
          }
        }

        .badge-title {
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 4px;
          opacity: 0.9;
        }

        .badge-author {
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .badge-hover-value {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 10px;
          background: rgba(0, 0, 0, 0.7);
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          transform: translateY(100%);
          transition: transform 0.3s ease;
          backdrop-filter: blur(4px);
        }

        .badge-card:hover .badge-hover-value {
          transform: translateY(0);
        }

        .badge-empty {
          width: 100%;
          text-align: center;
          padding: 40px 20px;
          color: var(--text-secondary);
        }

        .badge-empty-icon {
          font-size: 48px;
          margin-bottom: 15px;
          opacity: 0.5;
        }

        .badge-empty-text {
          font-size: 14px;
        }

        .badge-tooltip-hint {
          font-size: 11px;
          opacity: 0.7;
          margin-top: 5px;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(26, 26, 46, 0.9);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease-out;
          padding: 20px;
        }

        .modal-overlay.closing {
          animation: fadeOut 0.3s ease-out forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        .modal-content {
          background: var(--bg-card);
          border-radius: 16px;
          max-width: 600px;
          width: 100%;
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          animation: slideUp 0.3s ease-out;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          border: 1px solid var(--border-subtle);
        }

        .modal-overlay.closing .modal-content {
          animation: slideDown 0.3s ease-out forwards;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
        }

        .modal-header {
          padding: 24px;
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .modal-badge {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
        }

        .modal-badge.gold {
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%);
          box-shadow: 0 4px 20px rgba(251, 191, 36, 0.4);
        }

        .modal-badge.silver {
          background: linear-gradient(135deg, #e5e7eb 0%, #9ca3af 50%, #6b7280 100%);
          box-shadow: 0 4px 20px rgba(156, 163, 175, 0.4);
        }

        .modal-badge.gold .modal-badge-icon {
          animation: spinScale 1s ease-in-out infinite;
        }

        .modal-badge.silver .modal-badge-icon {
          animation: pulse 2s infinite;
        }

        .modal-badge-icon {
          display: inline-block;
        }

        .modal-header-info {
          flex: 1;
        }

        .modal-title {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .modal-author {
          font-size: 20px;
          font-weight: 700;
          background: linear-gradient(135deg, var(--accent-blue), var(--accent-green));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .modal-stats {
          display: flex;
          gap: 30px;
          padding: 0 24px;
          margin-top: 16px;
        }

        .modal-stat {
          text-align: center;
        }

        .modal-stat-value {
          font-size: 24px;
          font-weight: 700;
          color: var(--accent-blue);
        }

        .modal-stat-label {
          font-size: 12px;
          color: var(--text-secondary);
          margin-top: 4px;
        }

        .modal-close {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: var(--text-primary);
          font-size: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .modal-close:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.1);
        }

        .modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px 24px;
        }

        .modal-body-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .modal-body-title::before {
          content: '';
          width: 4px;
          height: 16px;
          background: linear-gradient(135deg, var(--accent-blue), var(--accent-green));
          border-radius: 2px;
        }

        .commit-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .commit-item {
          background: rgba(0, 210, 255, 0.05);
          border: 1px solid var(--border-subtle);
          border-radius: 10px;
          padding: 14px 16px;
          transition: all 0.2s ease;
        }

        .commit-item:hover {
          background: rgba(0, 210, 255, 0.1);
          border-color: var(--accent-blue);
        }

        .commit-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .commit-sha {
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 13px;
          color: var(--accent-blue);
          background: rgba(0, 210, 255, 0.1);
          padding: 3px 8px;
          border-radius: 4px;
        }

        .commit-date {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .commit-message {
          font-size: 13px;
          color: var(--text-primary);
          margin-bottom: 10px;
          line-height: 1.5;
        }

        .commit-stats {
          display: flex;
          gap: 20px;
        }

        .commit-stat {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
        }

        .commit-stat-icon {
          font-size: 14px;
        }

        .commit-stat-files {
          color: var(--accent-blue);
        }

        .commit-stat-additions {
          color: var(--accent-green);
        }

        .commit-stat-deletions {
          color: var(--accent-red);
        }

        .modal-empty {
          text-align: center;
          padding: 40px 20px;
          color: var(--text-secondary);
        }

        @media (max-width: 768px) {
          .badge-section {
            flex-wrap: nowrap;
            overflow-x: auto;
            padding: 15px;
            gap: 10px;
            -webkit-overflow-scrolling: touch;
          }

          .badge-section::-webkit-scrollbar {
            height: 4px;
          }

          .badge-section-header {
            flex: 0 0 auto;
            min-width: 120px;
            margin-bottom: 0;
            flex-direction: column;
            align-items: flex-start;
            justify-content: center;
          }

          .badge-card {
            flex: 0 0 auto;
            min-width: 150px;
            padding: 16px;
          }

          .badge-icon {
            font-size: 32px;
            margin-bottom: 8px;
          }

          .badge-author {
            font-size: 13px;
          }

          .modal-header {
            padding: 16px;
            gap: 12px;
          }

          .modal-badge {
            width: 48px;
            height: 48px;
            font-size: 24px;
          }

          .modal-title {
            font-size: 16px;
          }

          .modal-author {
            font-size: 18px;
          }

          .modal-stats {
            padding: 0 16px;
            gap: 20px;
          }

          .modal-stat-value {
            font-size: 20px;
          }

          .modal-body {
            padding: 16px;
          }

          .commit-stats {
            gap: 12px;
          }
        }
      `}</style>

      <div className="badge-section-header">
        <div className="guide-icon">🎖</div>
        <div>
          <div className="badge-section-title">本周之星</div>
          <div className="badge-section-subtitle">最近7天活跃榜</div>
        </div>
      </div>

      {hasData ? (
        <>
          {goldWinner && (
            <div
              className="badge-card gold"
              onClick={() => handleBadgeClick('gold', goldWinner)}
            >
              <div className="badge-icon">🏆</div>
              <div className="badge-title">修改之星 · 金质</div>
              <div className="badge-author">{goldWinner.author}</div>
              <div className="badge-tooltip-hint">点击查看详情</div>
              <div className="badge-hover-value">
                修改文件 {goldWinner.fileCount} 个
              </div>
            </div>
          )}

          {silverWinner && (
            <div
              className="badge-card silver"
              onClick={() => handleBadgeClick('silver', silverWinner)}
            >
              <div className="badge-icon">⭐</div>
              <div className="badge-title">添加之星 · 银质</div>
              <div className="badge-author">{silverWinner.author}</div>
              <div className="badge-tooltip-hint">点击查看详情</div>
              <div className="badge-hover-value">
                新增代码 {silverWinner.additions} 行
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="badge-empty">
          <div className="badge-empty-icon">📭</div>
          <div className="badge-empty-text">最近7天暂无提交数据</div>
        </div>
      )}

      {isModalVisible && modalData && (
        <div
          className={`modal-overlay ${isModalClosing ? 'closing' : ''}`}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isModalClosing) {
              closeModal();
            }
          }}
        >
          <div className="modal-content">
            <div className="modal-header">
              <div className={`modal-badge ${modalData.type}`}>
                <span className="modal-badge-icon">
                  {modalData.type === 'gold' ? '🏆' : '⭐'}
                </span>
              </div>
              <div className="modal-header-info">
                <div className="modal-title">
                  {modalData.type === 'gold' ? '修改之星 · 金质' : '添加之星 · 银质'}
                </div>
                <div className="modal-author">{modalData.author}</div>
              </div>
              <button className="modal-close" onClick={closeModal}>
                ×
              </button>
            </div>

            <div className="modal-stats">
              <div className="modal-stat">
                <div className="modal-stat-value">{modalData.commits.length}</div>
                <div className="modal-stat-label">提交次数</div>
              </div>
              <div className="modal-stat">
                <div className="modal-stat-value">{modalData.fileCount}</div>
                <div className="modal-stat-label">修改文件</div>
              </div>
              <div className="modal-stat">
                <div className="modal-stat-value">{modalData.additions}</div>
                <div className="modal-stat-label">新增行数</div>
              </div>
            </div>

            <div className="modal-body">
              <div className="modal-body-title">最近7天提交记录</div>
              {modalData.commits.length > 0 ? (
                <div className="commit-list">
                  {modalData.commits
                    .sort(
                      (a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    )
                    .map((commit) => (
                      <div key={commit.sha} className="commit-item">
                        <div className="commit-header">
                          <span className="commit-sha">
                            {commit.sha.slice(0, 7)}
                          </span>
                          <span className="commit-date">
                            {formatDate(commit.date)}
                          </span>
                        </div>
                        <div className="commit-message">{commit.message}</div>
                        <div className="commit-stats">
                          <span className="commit-stat commit-stat-files">
                            <span className="commit-stat-icon">📁</span>
                            {commit.files.length} 文件
                          </span>
                          <span className="commit-stat commit-stat-additions">
                            <span className="commit-stat-icon">+</span>
                            {commit.additions}
                          </span>
                          <span className="commit-stat commit-stat-deletions">
                            <span className="commit-stat-icon">−</span>
                            {commit.deletions}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="modal-empty">暂无提交记录</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
