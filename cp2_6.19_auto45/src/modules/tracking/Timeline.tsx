import { Eye, MessageSquare, CheckCircle2 } from 'lucide-react';
import type { ClientAction } from '@/modules/proposal/types';
import { formatDate } from '@/api/mockApi';

interface TimelineProps {
  actions: ClientAction[];
}

const ACTION_COLORS: Record<ClientAction['type'], string> = {
  view: '#10b981',
  feedback: '#f59e0b',
  decision: '#6366f1',
};

const ACTION_TITLES: Record<ClientAction['type'], string> = {
  view: '客户查看了提案',
  feedback: '客户发来反馈',
  decision: '客户做出决策',
};

const DECISION_LABELS: Record<'accepted' | 'rejected' | 'pending', string> = {
  accepted: '接受',
  rejected: '拒绝',
  pending: '待定',
};

export default function Timeline({ actions }: TimelineProps) {
  const sorted = [...actions].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="ff-timeline">
      <h3 className="ff-section__title" style={{ marginBottom: 20 }}>
        <span>客户行为时间线</span>
      </h3>

      {sorted.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--ff-muted)', padding: '30px 20px', fontSize: 14 }}>
          暂无客户行为记录
        </div>
      ) : (
        <div className="ff-timeline__list">
          {sorted.map((action, index) => {
            const color = ACTION_COLORS[action.type];
            const isLatest = index === 0;

            let Icon = Eye;
            if (action.type === 'feedback') Icon = MessageSquare;
            if (action.type === 'decision') Icon = CheckCircle2;

            return (
              <div
                key={action.id}
                className={`ff-timeline-item ${isLatest ? 'latest' : ''}`}
              >
                <div
                  className="ff-timeline-item__dot"
                  style={{ backgroundColor: color }}
                >
                  <Icon size={14} />
                </div>
                <div className="ff-timeline-item__time">
                  {formatDate(action.timestamp)}
                </div>
                <div className="ff-timeline-item__title">
                  {ACTION_TITLES[action.type]}
                </div>

                {action.type === 'feedback' && action.message && (
                  <div className="ff-timeline-item__body">
                    {action.message}
                  </div>
                )}

                {action.type === 'decision' && action.decision && (
                  <div className="ff-timeline-item__body">
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: 8,
                        fontWeight: 700,
                        backgroundColor: action.decision === 'accepted'
                          ? 'rgba(16,185,129,0.12)'
                          : action.decision === 'rejected'
                            ? 'rgba(239,68,68,0.12)'
                            : 'rgba(245,158,11,0.12)',
                        color: action.decision === 'accepted'
                          ? '#059669'
                          : action.decision === 'rejected'
                            ? '#dc2626'
                            : '#d97706',
                      }}
                    >
                      {DECISION_LABELS[action.decision]}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
