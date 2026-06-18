import React, { useState, useMemo } from 'react';
import { useTicketStore, Ticket, TicketStatus } from '../store/ticketStore';

const statusLabels: Record<TicketStatus | 'all', string> = {
  all: '全部',
  pending: '待审核',
  reviewing: '审核中',
  approved: '已通过',
  rejected: '已驳回',
  completed: '退款完成',
};

const statusColors: Record<TicketStatus, string> = {
  pending: '#F59E0B',
  reviewing: '#3B82F6',
  approved: '#10B981',
  rejected: '#EF4444',
  completed: '#8B5CF6',
};

const filterButtons: (TicketStatus | 'all')[] = [
  'all',
  'pending',
  'reviewing',
  'approved',
  'rejected',
  'completed',
];

interface TicketCardProps {
  ticket: Ticket;
  onReview: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onComplete: (id: string) => void;
}

const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  onReview,
  onApprove,
  onReject,
  onComplete,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const [statusKey, setStatusKey] = useState(0);

  const handleReview = () => {
    setShowPulse(true);
    onReview(ticket.id);
    setTimeout(() => setShowPulse(false), 600);
  };

  const handleStatusChange = (action: () => void) => {
    setStatusKey((prev) => prev + 1);
    action();
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncatedReason =
    ticket.reason.length > 30
      ? ticket.reason.slice(0, 30) + '...'
      : ticket.reason;

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: isHovered
          ? '0 6px 20px rgba(0,0,0,0.12)'
          : '0 2px 8px rgba(0,0,0,0.06)',
        padding: '16px',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {showPulse && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: '12px',
            boxShadow: 'inset 0 0 0 3px #3B82F6',
            animation: 'pulse-border 0.6s ease-out',
            pointerEvents: 'none',
          }}
        />
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '12px',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '13px',
              color: '#6B7280',
              marginBottom: '4px',
            }}
          >
            {ticket.id}
          </div>
          <div
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#111827',
            }}
          >
            {ticket.itemName || '未命名商品'}
          </div>
        </div>
        <span
          key={statusKey}
          style={{
            padding: '4px 10px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 500,
            color: '#FFFFFF',
            backgroundColor: statusColors[ticket.status],
            animation: 'fadeIn 0.3s ease',
          }}
        >
          {statusLabels[ticket.status]}
        </span>
      </div>

      <div
        style={{
          fontSize: '24px',
          fontWeight: 700,
          color: '#D97706',
          marginBottom: '8px',
        }}
      >
        ¥{ticket.amount.toFixed(2)}
      </div>

      <div
        style={{
          fontSize: '13px',
          color: '#6B7280',
          marginBottom: '12px',
        }}
      >
        订单号：{ticket.orderId}
      </div>

      <div
        style={{
          fontSize: '12px',
          color: '#9CA3AF',
          marginBottom: '16px',
        }}
      >
        创建时间：{formatDate(ticket.createdAt)}
      </div>

      {isHovered && ticket.reason && (
        <div
          style={{
            fontSize: '13px',
            color: '#4B5563',
            padding: '8px 12px',
            backgroundColor: '#F9FAFB',
            borderRadius: '8px',
            marginBottom: '12px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {truncatedReason}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {ticket.status === 'pending' && (
          <button
            onClick={handleReview}
            style={{
              flex: 1,
              padding: '8px 16px',
              backgroundColor: '#3B82F6',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#2563EB';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#3B82F6';
            }}
          >
            审核
          </button>
        )}
        {ticket.status === 'reviewing' && (
          <>
            <button
              onClick={() => handleStatusChange(() => onApprove(ticket.id))}
              style={{
                flex: 1,
                padding: '8px 16px',
                backgroundColor: '#10B981',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#059669';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#10B981';
              }}
            >
              通过
            </button>
            <button
              onClick={() => handleStatusChange(() => onReject(ticket.id))}
              style={{
                flex: 1,
                padding: '8px 16px',
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#DC2626';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#EF4444';
              }}
            >
              驳回
            </button>
          </>
        )}
        {ticket.status === 'approved' && (
          <button
            onClick={() => handleStatusChange(() => onComplete(ticket.id))}
            style={{
              flex: 1,
              padding: '8px 16px',
              backgroundColor: '#8B5CF6',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#7C3AED';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#8B5CF6';
            }}
          >
            标记退款完成
          </button>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes pulse-border {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
          }
          100% {
            opacity: 0;
            transform: scale(1.02);
          }
        }
      `}</style>
    </div>
  );
};

const TicketBoard: React.FC = () => {
  const tickets = useTicketStore((state) => state.tickets);
  const statusFilter = useTicketStore((state) => state.statusFilter);
  const updateFilter = useTicketStore((state) => state.updateFilter);
  const updateStatus = useTicketStore((state) => state.updateStatus);
  const approve = useTicketStore((state) => state.approve);
  const reject = useTicketStore((state) => state.reject);

  const filteredTickets = useMemo(() => {
    if (statusFilter === 'all') return tickets;
    return tickets.filter((ticket) => ticket.status === statusFilter);
  }, [tickets, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<TicketStatus | 'all', number> = {
      all: tickets.length,
      pending: 0,
      reviewing: 0,
      approved: 0,
      rejected: 0,
      completed: 0,
    };
    tickets.forEach((ticket) => {
      counts[ticket.status]++;
    });
    return counts;
  }, [tickets]);

  const handleReview = (id: string) => {
    updateStatus(id, 'reviewing');
  };

  const handleComplete = (id: string) => {
    updateStatus(id, 'completed');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h2
        style={{
          fontSize: '20px',
          fontWeight: 600,
          marginBottom: '16px',
          color: '#111827',
        }}
      >
        工单看板
      </h2>

      <div
        style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '20px',
        }}
      >
        {filterButtons.map((filter) => (
          <button
            key={filter}
            onClick={() => updateFilter(filter)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: statusFilter === filter ? '#4F46E5' : '#E5E7EB',
              color: statusFilter === filter ? '#FFFFFF' : '#374151',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition:
                'background-color 0.25s ease, color 0.25s ease',
            }}
          >
            {statusLabels[filter]}
            <span
              style={{
                padding: '2px 8px',
                backgroundColor: statusFilter === filter ? 'rgba(255,255,255,0.2)' : '#F3F4F6',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              {statusCounts[filter]}
            </span>
          </button>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          overflowY: 'auto',
          flex: 1,
          alignContent: 'flex-start',
        }}
      >
        {filteredTickets.length === 0 ? (
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '60px 0',
              color: '#9CA3AF',
              fontSize: '14px',
            }}
          >
            暂无工单
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onReview={handleReview}
              onApprove={approve}
              onReject={reject}
              onComplete={handleComplete}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TicketBoard;
