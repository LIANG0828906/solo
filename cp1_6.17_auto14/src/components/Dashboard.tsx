import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Empty, Tag, Spin, Skeleton } from 'antd';
import { PlusOutlined, TeamOutlined, FileTextOutlined } from '@ant-design/icons';
import { usePollStore } from '../pollStore';
import type { PollListItem } from '../types';

function PollCard({ poll, index }: { poll: PollListItem; index: number }) {
  const navigate = useNavigate();
  const status = poll.isActive ? '进行中' : '已结束';
  const statusColor = poll.isActive ? 'green' : 'default';

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = Date.now();
    const diff = now - ts;
    if (diff < 3600000) return `${Math.max(1, Math.floor(diff / 60000))} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  return (
    <div
      className="qv-card qv-poll-card anim-fade"
      onClick={() => navigate(`/poll/${poll.id}`)}
      style={{ animationDelay: `${Math.min(index * 30, 600)}ms` }}
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
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const polls = usePollStore((s) => s.polls);
  const fetchPolls = usePollStore((s) => s.fetchPolls);
  const wsConnected = usePollStore((s) => s.wsConnected);
  const [loading, setLoading] = useState(polls.length === 0);

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

  const sorted = polls.slice().sort((a, b) => b.createdAt - a.createdAt);
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
      ) : (
        <Spin spinning={loading}>
          <div className="qv-grid">
            {sorted.map((p, i) => (
              <PollCard key={p.id} poll={p} index={i} />
            ))}
          </div>
        </Spin>
      )}
    </div>
  );
}

export default Dashboard;
