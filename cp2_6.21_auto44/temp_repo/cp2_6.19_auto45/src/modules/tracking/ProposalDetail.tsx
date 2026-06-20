import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2, Edit3 } from 'lucide-react';
import Timeline from '@/modules/tracking/Timeline';
import type { Proposal, DecisionResult } from '@/modules/proposal/types';
import { STATUS_LABELS, STATUS_COLORS, TEMPLATE_LABELS } from '@/modules/proposal/types';
import {
  getProposalById,
  deleteProposal,
  addClientAction,
  calculateTotal,
  formatCurrency,
} from '@/api/mockApi';
import { useToast } from '@/hooks/useToast';
import { useProposalStore } from '@/store/useProposalStore';

export default function ProposalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { loadProposal } = useProposalStore();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [decision, setDecision] = useState<DecisionResult>('accepted');
  const [actionLoading, setActionLoading] = useState<'' | 'view' | 'feedback' | 'decision'>('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getProposalById(id).then((p) => {
      setProposal(p);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="ff-page">
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--ff-muted)' }}>
          加载中...
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="ff-page">
        <Link to="/tracking" className="ff-back-link">
          <ArrowLeft size={16} />
          返回跟踪列表
        </Link>
        <div className="ff-empty-state">
          <div className="ff-empty-state__icon" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.12)' }}>
            <ArrowLeft size={28} />
          </div>
          <div className="ff-empty-state__title">提案不存在</div>
          <p className="ff-empty-state__desc">该提案可能已被删除</p>
        </div>
      </div>
    );
  }

  const total = calculateTotal(proposal.services);

  const handleEdit = () => {
    loadProposal(proposal);
    navigate(`/proposal/${proposal.id}`);
  };

  const handleDelete = async () => {
    if (!id) return;
    const confirmed = window.confirm('确定要删除此提案吗？删除后无法恢复。');
    if (!confirmed) return;
    const ok = await deleteProposal(id);
    if (ok) {
      toast.show('提案已删除');
      navigate('/tracking');
    }
  };

  const handleViewAction = async () => {
    if (!id || actionLoading) return;
    setActionLoading('view');
    const updated = await addClientAction(id, { type: 'view' });
    if (updated) setProposal(updated);
    setActionLoading('');
    toast.show('已记录客户查看');
  };

  const handleFeedbackAction = async () => {
    if (!id || actionLoading || !feedbackMessage.trim()) {
      if (!feedbackMessage.trim()) toast.show('请输入反馈内容');
      return;
    }
    setActionLoading('feedback');
    const updated = await addClientAction(id, { type: 'feedback', message: feedbackMessage.trim() });
    if (updated) {
      setProposal(updated);
      setFeedbackMessage('');
    }
    setActionLoading('');
    toast.show('已记录客户反馈');
  };

  const handleDecisionAction = async () => {
    if (!id || actionLoading) return;
    setActionLoading('decision');
    const updated = await addClientAction(id, { type: 'decision', decision });
    if (updated) setProposal(updated);
    setActionLoading('');
    toast.show('已标记决策结果');
  };

  return (
    <div className="ff-page">
      <Link to="/tracking" className="ff-back-link">
        <ArrowLeft size={16} />
        返回跟踪列表
      </Link>

      <div className="ff-summary">
        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2>{proposal.title}</h2>
            <div className="ff-summary__client" style={{ marginTop: 6, fontSize: 14 }}>
              客户：{proposal.clientName}
            </div>
            <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span
                className="ff-status-tag"
                style={{
                  backgroundColor: `${STATUS_COLORS[proposal.status]}1A`,
                  color: STATUS_COLORS[proposal.status],
                }}
              >
                {STATUS_LABELS[proposal.status]}
              </span>
              <span
                style={{
                  padding: '5px 11px',
                  borderRadius: 999,
                  fontSize: 11.5,
                  fontWeight: 700,
                  backgroundColor: 'rgba(99,102,241,0.08)',
                  color: '#4338ca',
                }}
              >
                模板：{TEMPLATE_LABELS[proposal.template]}
              </span>
            </div>
          </div>
          <div className="ff-summary__actions">
            <button className="ff-btn ff-btn--ghost" onClick={handleEdit}>
              <Edit3 size={16} />
              编辑提案
            </button>
            <button className="ff-btn ff-btn--danger" onClick={handleDelete}>
              <Trash2 size={16} />
              删除提案
            </button>
          </div>
        </div>

        <div className="ff-summary__stat" style={{ textAlign: 'left' }}>
          <div className="ff-summary__stat-label">总金额</div>
          <div
            className="ff-summary__stat-value"
            style={{
              background: 'linear-gradient(135deg, #1e293b, #6366f1)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {formatCurrency(total)}
          </div>
        </div>

        <div className="ff-summary__stat" style={{ textAlign: 'left' }}>
          <div className="ff-summary__stat-label">服务项</div>
          <div className="ff-summary__stat-value">{proposal.services.length}</div>
        </div>

        <div className="ff-summary__stat" style={{ textAlign: 'left' }}>
          <div className="ff-summary__stat-label">互动次数</div>
          <div className="ff-summary__stat-value">{proposal.actions.length}</div>
        </div>
      </div>

      <div className="ff-detail-grid">
        <Timeline actions={proposal.actions} />

        <div className="ff-action-panel">
          <h3>模拟客户行为</h3>

          <div className="ff-action-group">
            <label>标记查看</label>
            <div className="ff-action-btns">
              <button
                className="ff-btn ff-btn--primary"
                onClick={handleViewAction}
                disabled={actionLoading !== ''}
              >
                客户已查看
              </button>
            </div>
          </div>

          <div className="ff-action-group">
            <label>记录客户反馈</label>
            <textarea
              className="ff-textarea"
              placeholder="请输入客户反馈内容..."
              value={feedbackMessage}
              onChange={(e) => setFeedbackMessage(e.target.value)}
              style={{ marginBottom: 10 }}
            />
            <div className="ff-action-btns">
              <button
                className="ff-btn ff-btn--accent"
                onClick={handleFeedbackAction}
                disabled={actionLoading !== ''}
              >
                {actionLoading === 'feedback' ? '提交中...' : '提交反馈'}
              </button>
            </div>
          </div>

          <div className="ff-action-group">
            <label>标记决策结果</label>
            <select
              className="ff-select"
              value={decision}
              onChange={(e) => setDecision(e.target.value as DecisionResult)}
              style={{ marginBottom: 10 }}
            >
              <option value="accepted">接受</option>
              <option value="rejected">拒绝</option>
              <option value="pending">待定</option>
            </select>
            <div className="ff-action-btns">
              <button
                className="ff-btn ff-btn--ghost"
                onClick={handleDecisionAction}
                disabled={actionLoading !== ''}
              >
                {actionLoading === 'decision' ? '提交中...' : '标记决策'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
