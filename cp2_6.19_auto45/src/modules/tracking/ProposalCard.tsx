import { Calendar, User } from 'lucide-react';
import type { Proposal } from '@/modules/proposal/types';
import { STATUS_LABELS, STATUS_COLORS } from '@/modules/proposal/types';
import { calculateTotal, formatCurrency, formatDate } from '@/api/mockApi';

interface ProposalCardProps {
  proposal: Proposal;
  onClick?: () => void;
}

export default function ProposalCard({ proposal, onClick }: ProposalCardProps) {
  const total = calculateTotal(proposal.services);

  return (
    <div
      className="ff-proposal-card"
      style={{ cursor: 'pointer' }}
      onClick={onClick}
    >
      <div className="ff-proposal-card__head">
        <div>
          <h3 className="ff-proposal-card__title">{proposal.title}</h3>
          <div className="ff-proposal-card__client" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <User size={13} />
            <span>{proposal.clientName}</span>
          </div>
        </div>
        <span
          className="ff-status-tag"
          style={{
            backgroundColor: `${STATUS_COLORS[proposal.status]}1A`,
            color: STATUS_COLORS[proposal.status],
          }}
        >
          {STATUS_LABELS[proposal.status]}
        </span>
      </div>

      <div className="ff-proposal-card__meta">
        <div>
          <span className="ff-proposal-card__amount">{formatCurrency(total)}</span>
        </div>
        <div className="ff-proposal-card__date" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Calendar size={12} />
          <span>{formatDate(proposal.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
