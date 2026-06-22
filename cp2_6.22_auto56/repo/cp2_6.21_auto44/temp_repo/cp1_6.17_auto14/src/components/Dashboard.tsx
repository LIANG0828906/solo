import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Empty, Tag, Spin, Skeleton, Tooltip } from 'antd';
import {
  PlusOutlined,
  TeamOutlined,
  FileTextOutlined,
  SearchOutlined,
  CopyOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import { usePollStore } from '../pollStore';
import type { PollListItem } from '../types';

interface PreviewPosition {
  top: number;
  left: number;
}

function useCopyToast() {
  const [toastKey, setToastKey] = useState(0);
  const showToast = useCallback(() => {
    const id = Date.now();
    setToastKey(id);
    const el = document.createElement('div');
    el.className = 'qv-copy-toast';
    el.id = `qv-copy-toast-${id}`;
    el.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:6px;"><polyline points="20 6 9 17 4 12"></polyline></svg>已复制';
    document.body.appendChild(el);
    setTimeout(() => {
      el.remove();
    }, 1500);
  }, []);
  return { showToast, toastKey };
}

function PollCard({
  poll,
  index,
  onCopy,
}: {
  poll: PollListItem;
  index: number;
  onCopy: (code: string) => void;
}) {
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPos, setPreviewPos] = useState<PreviewPosition>({ top: 0, left: 0 });
  const [copying, setCopying] = useState(false);

  const status = poll.isActive ? '进行中' : '已结束';
  const statusColor = poll.isActive ? 'green' : 'default';
  const statusDot = poll.isActive ? '#52C41A' : '#8C8C8C';

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = Date.now();
    const diff = now - ts;
    if (diff < 3600000) return `${Math.max(1, Math.floor(diff / 60000))} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const formatFullTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const handleMouseEnter = () => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const previewWidth = 260;
    const viewportWidth = window.innerWidth;
    let left = rect.right + 12;
    if (left + previewWidth > viewportWidth - 16) {
      left = rect.left - previewWidth - 12;
    }
    let top = rect.top;
    const previewHeight = 180;
    if (top + previewHeight > window.innerHeight - 16) {
      top = Math.max(16, window.innerHeight - previewHeight - 16);
    }
    if (left < 16) {
      left = rect.left;
      top = rect.bottom + 12;
    }
    setPreviewPos({ top: top + window.scrollY, left });
    setShowPreview(true);
  };

  const handleMouseLeave = () => {
    setShowPreview(false);
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (copying) return;
    try {
      await navigator.clipboard.writeText(poll.shortCode);
      setCopying(true);
      onCopy(poll.shortCode);
      setTimeout(() => setCopying(false), 1500);
    } catch {
      onCopy(poll.shortCode);
    }
  };

  const handleCardClick = () => {
    navigate(`/poll/${poll.id}`);
  };

  return (
    <>
      <div
        ref={wrapperRef}
        className="qv-poll-card-wrapper anim-fade"
        style={{ animationDelay: `${Math.min(index * 30, 600)}ms` }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className="qv-card qv-poll-card"
          onClick={handleCardClick}
        >
          <div className="qv-poll-card-header">
            <h3 className="qv-poll-card-title">{poll.title}</h3>
            <span className="qv-poll-card-code">{poll.shortCode}</span>
          </div>
          {poll.description && (
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              {poll.description.length > 40 ? poll.description.slice(0, 40) + '…' : poll.description}
            </div>
          )}
          <div className="qv-poll-card-stats">
            <div className="qv-poll-stat">
              <TeamOutlined style={{ color: 'var(--color-primary)' }} />
              <span>
                参与 <span className="qv-poll-stat-num">{poll.submissionCount}</span>
              </span>
            </div>
            <div className="qv-poll-stat">
              <FileTextOutlined style={{ color: 'var(--color-accent)' }} />
              <span>
                题目 <span className="qv-poll-stat-num">{poll.questionCount}</span>
              </span>
            </div>
          </div>
          <div className="qv-poll-card-footer">
            <span className="qv-poll-card-time">{formatTime(poll.createdAt)}</span>
            <Tag color={statusColor} style={{ margin: 0 }}>
              {status}
            </Tag>
          </div>
          <Tooltip title="复制短码" placement="top">
            <button
              className="qv-poll-copy-btn"
              onClick={handleCopy}
              title="复制短码"
            >
              {copying ? (
                <CheckOutlined style={{ fontSize: 14, color: 'var(--color-success)' }} />
              ) : (
                <CopyOutlined style={{ fontSize: 13 }} />
              )}
            </button>
          </Tooltip>
        </div>
      </div>

      {showPreview && (
        <div
          className={`qv-poll-preview ${showPreview ? 'visible' : ''}`}
          style={{ top: previewPos.top, left: previewPos.left }}
        >
          <div className="qv-poll-preview-header">
            <div className="qv-poll-preview-title" title={poll.title}>
              {poll.title}
            </div>
            <span className="qv-poll-preview-code">{poll.shortCode}</span>
          </div>
          <div className="qv-poll-preview-row">
            <span className="qv-poll-preview-label">
              <TeamOutlined style={{ color: 'var(--color-primary)' }} />
              参与人数
            </span>
            <span className="qv-poll-preview-value">{poll.submissionCount} 人</span>
          </div>
          <div className="qv-poll-preview-row">
            <span className="qv-poll-preview-label">
              <FileTextOutlined style={{ color: 'var(--color-accent)' }} />
              题目数量
            </span>
            <span className="qv-poll-preview-value">{poll.questionCount} 题</span>
          </div>
          <div className="qv-poll-preview-row">
            <span className="qv-poll-preview-label">
              <ClockCircleOutlined style={{ color: 'var(--color-warning)' }} />
              创建时间
            </span>
            <span className="qv-poll-preview-value">{formatFullTime(poll.createdAt)}</span>
          </div>
          <div className="qv-poll-preview-row">
            <span className="qv-poll-preview-label">
              <BulbOutlined style={{ color: statusDot }} />
              当前状态
            </span>
            <span
              className="qv-poll-preview-value"
              style={{ color: statusDot }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: statusDot,
                  marginRight: 6,
                  verticalAlign: 'middle',
                }}
              />
              {status}
            </span>
          </div>
        </div>
      )}
    </>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const polls = usePollStore((s) => s.polls);
  const fetchPolls = usePollStore((s) => s.fetchPolls);
  const wsConnected = usePollStore((s) => s.wsConnected);
  const [loading, setLoading] = useState(polls.length === 0);
  const [searchText, setSearchText] = useState('');
  const { showToast } = useCopyToast();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPolls()
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [fetchPolls]);

  const sorted = useMemo(
    () => polls.slice().sort((a, b) => b.createdAt - a.createdAt),
    [polls]
  );

  const filtered = useMemo(() => {
    const kw = searchText.trim().toLowerCase();
    if (!kw) return sorted;
    return sorted.filter(
      (p) =>
        p.title.toLowerCase().includes(kw) ||
        p.shortCode.toLowerCase().includes(kw) ||
        (p.description && p.description.toLowerCase().includes(kw))
    );
  }, [sorted, searchText]);

  const activeCount = sorted.filter((p) => p.isActive).length;
  const totalVotes = sorted.reduce((s, p) => s + p.submissionCount, 0);

  return (
    <div>
      <div className="qv-dashboard-header">
        <div>
          <h2 className="qv-dashboard-title">仪表盘</h2>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: 13, marginTop: 6 }}>
            共 {sorted.length} 份投票 · {activeCount} 份进行中 · 累计 {totalVotes} 次参与
            <span style={{ marginLeft: 12 }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: wsConnected ? '#4CAF50' : '#BDBDBD',
                  marginRight: 6,
                  verticalAlign: 'middle',
                }}
              />
              <span style={{ fontSize: 12 }}>
                {wsConnected ? '实时连接已就绪' : '连接断开，正在重连…'}
              </span>
            </span>
          </div>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => navigate('/create')}
          style={{ borderRadius: 20, paddingInline: 24, fontWeight: 500 }}
        >
          创建投票
        </Button>
      </div>

      <div className="qv-search-box">
        <span className="qv-search-icon">
          <SearchOutlined style={{ fontSize: 14 }} />
        </span>
        <input
          className="qv-search-input"
          type="text"
          placeholder="搜索投票标题或短码…"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="qv-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} active paragraph={{ rows: 4 }} />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="qv-card" style={{ padding: 64, textAlign: 'center' }}>
          <Empty
            description={
              <div style={{ fontSize: 15 }}>
                <div style={{ marginBottom: 8, color: 'var(--color-text-primary)' }}>
                  还没有创建任何投票
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  让小团队决策更简单、更透明
                </div>
              </div>
            }
            style={{ margin: 0 }}
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/create')}
              style={{ borderRadius: 20 }}
            >
              创建第一个投票
            </Button>
          </Empty>
        </div>
      ) : filtered.length === 0 ? (
        <div className="qv-card" style={{ padding: 40 }}>
          <div className="qv-search-empty">
            <SearchOutlined style={{ fontSize: 28, display: 'block', margin: '0 auto 12px', opacity: 0.3 }} />
            暂无匹配的投票
            {searchText && (
              <div style={{ marginTop: 6, fontSize: 12 }}>
                关键词「<b style={{ color: 'var(--color-text-secondary)' }}>{searchText}</b>」未找到结果
              </div>
            )}
          </div>
        </div>
      ) : (
        <Spin spinning={loading}>
          <div className="qv-grid">
            {filtered.map((p, i) => (
              <PollCard
                key={p.id}
                poll={p}
                index={i}
                onCopy={showToast}
              />
            ))}
          </div>
        </Spin>
      )}
    </div>
  );
}

export default Dashboard;
