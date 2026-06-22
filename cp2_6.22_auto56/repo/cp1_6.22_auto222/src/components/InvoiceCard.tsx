import React from 'react';
import type { Invoice } from '../utils/storage';
import { getStatusColor, getStatusText, formatCurrency, formatDate } from '../utils/invoiceLogic';

interface InvoiceCardProps {
  invoice: Invoice;
  index: number;
  isSelected: boolean;
  isPulsing: boolean;
  onClick: () => void;
}

const InvoiceCard: React.FC<InvoiceCardProps> = ({
  invoice,
  index,
  isSelected,
  isPulsing,
  onClick
}) => {
  const statusColor = getStatusColor(invoice.status);

  return (
    <div
      className={`invoice-card ${isSelected ? 'selected' : ''} ${isPulsing ? 'pulsing' : ''}`}
      style={{
        width: '300px',
        borderRadius: '12px',
        backgroundColor: '#F9FAFB',
        border: '1px solid #E5E7EB',
        borderTop: `4px solid ${statusColor}`,
        boxShadow: '2px 4px 12px rgba(0,0,0,0.1)',
        padding: '20px',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        opacity: 0,
        transform: 'translateY(20px)',
        animation: `slideUp 0.3s ease-out ${index * 50}ms forwards`,
        position: 'relative',
        overflow: 'hidden'
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '4px 8px 20px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '2px 4px 12px rgba(0,0,0,0.1)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>
          {invoice.invoiceNumber}
        </span>
        <span
          style={{
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 500,
            color: '#fff',
            backgroundColor: statusColor
          }}
        >
          {getStatusText(invoice.status)}
        </span>
      </div>

      <div style={{ marginBottom: '8px', fontSize: '16px', fontWeight: 600, color: '#111827' }}>
        {invoice.clientName}
      </div>

      <div style={{ marginBottom: '12px', fontSize: '14px', color: '#6B7280', lineHeight: 1.4 }}>
        {invoice.projectDescription}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '16px' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '4px' }}>
            到期日
          </div>
          <div style={{ fontSize: '13px', color: '#374151' }}>
            {formatDate(invoice.dueDate)}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '4px' }}>
            金额
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#1F2937' }}>
            {formatCurrency(invoice.amount, invoice.currency)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceCard;
