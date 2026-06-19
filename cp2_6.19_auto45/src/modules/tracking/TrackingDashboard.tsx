import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Inbox, FileText, Send, MessageSquare, CheckCircle2 } from 'lucide-react';
import ProposalCard from '@/modules/tracking/ProposalCard';
import type { Proposal, ProposalStatus } from '@/modules/proposal/types';
import { STATUS_LABELS, STATUS_COLORS } from '@/modules/proposal/types';
import { searchProposals } from '@/api/mockApi';
import { useDashboardFilter } from '@/store/useProposalStore';

export default function TrackingDashboard() {
  const navigate = useNavigate();
  const { keyword, statusFilter, setKeyword, setStatusFilter } = useDashboardFilter();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const startTime = Date.now();

    const promise = statusFilter === 'all'
      ? searchProposals(keyword)
      : searchProposals(keyword, statusFilter as ProposalStatus);

    promise.then((data) => {
      const elapsed = Date.now() - startTime;
      const delay = Math.max(0, 50 - elapsed);
      setTimeout(() => {
        setProposals(data);
        setLoading(false);
      }, delay);
    });
  }, [keyword, statusFilter]);

  const totalCount = proposals.length;
  const sentCount = proposals.filter((p) => p.status === 'sent' || p.status === 'viewed').length;
  const feedbackCount = proposals.filter((p) => p.status === 'feedback').length;
  const decidedCount = proposals.filter((p) => p.status === 'decided').length;

  const statusOptions: Array<{ value: ProposalStatus | 'all'; label: string }> = [
    { value: 'all', label: '全部状态' },
    { value: 'sent', label: STATUS_LABELS.sent },
    { value: 'viewed', label: STATUS_LABELS.viewed },
    { value: 'feedback', label: STATUS_LABELS.feedback },
    { value: 'decided', label: STATUS_LABELS.decided },
  ];

  return (
    <div className="ff-page">
      <h1 className="ff-page__title">提案跟踪</h1>
      <p className="ff-page__subtitle">
        实时监控提案的发送、查看、反馈与决策全流程
      </p>

      <div className="ff-dashboard-tools">
        <div style={{ position: 'relative' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
              pointerEvents: 'none',
            }}
          />
          <input
            className="ff-input"
            placeholder="搜索提案标题或客户名称..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ paddingLeft: 44 }}
          />
        </div>

        <select
          className="ff-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ProposalStatus | 'all')}
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="ff-stats">
        <div className="ff-stat-card">
          <div>
            <div className="ff-stat-card__label">全部提案</div>
            <div className="ff-stat-card__value">{totalCount}</div>
          </div>
          <div
            className="ff-stat-card__dot"
            style={{
              backgroundColor: '#6366f1',
              boxShadow: '0 0 0 4px rgba(99,102,241,0.12)',
            }}
          >
            <FileText size={16} style={{ position: 'absolute', left: -3, top: -3, color: '#6366f1' }} />
          </div>
        </div>

        <div className="ff-stat-card">
          <div>
            <div className="ff-stat-card__label">已发送/已查看</div>
            <div className="ff-stat-card__value">{sentCount}</div>
          </div>
          <div
            className="ff-stat-card__dot"
            style={{
              backgroundColor: STATUS_COLORS.sent,
              boxShadow: `0 0 0 4px ${STATUS_COLORS.sent}1F`,
            }}
          >
            <Send size={16} style={{ position: 'absolute', left: -3, top: -3, color: STATUS_COLORS.sent }} />
          </div>
        </div>

        <div className="ff-stat-card">
          <div>
            <div className="ff-stat-card__label">已反馈</div>
            <div className="ff-stat-card__value">{feedbackCount}</div>
          </div>
          <div
            className="ff-stat-card__dot"
            style={{
              backgroundColor: STATUS_COLORS.feedback,
              boxShadow: `0 0 0 4px ${STATUS_COLORS.feedback}1F`,
            }}
          >
            <MessageSquare size={16} style={{ position: 'absolute', left: -3, top: -3, color: STATUS_COLORS.feedback }} />
          </div>
        </div>

        <div className="ff-stat-card">
          <div>
            <div className="ff-stat-card__label">已决策</div>
            <div className="ff-stat-card__value">{decidedCount}</div>
          </div>
          <div
            className="ff-stat-card__dot"
            style={{
              backgroundColor: STATUS_COLORS.decided,
              boxShadow: `0 0 0 4px ${STATUS_COLORS.decided}1F`,
            }}
          >
            <CheckCircle2 size={16} style={{ position: 'absolute', left: -3, top: -3, color: STATUS_COLORS.decided }} />
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--ff-muted)' }}>
          加载中...
        </div>
      ) : proposals.length === 0 ? (
        <div className="ff-empty-state">
          <div className="ff-empty-state__icon">
            <Inbox size={28} />
          </div>
          <div className="ff-empty-state__title">还没有任何提案</div>
          <p className="ff-empty-state__desc">
            {keyword || statusFilter !== 'all'
              ? '没有匹配的提案，试试调整搜索条件'
              : '去提案编辑器创建你的第一份提案吧'}
          </p>
        </div>
      ) : (
        <div className="ff-card-grid">
          {proposals.map((p) => (
            <ProposalCard
              key={p.id}
              proposal={p}
              onClick={() => navigate(`/tracking/${p.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
