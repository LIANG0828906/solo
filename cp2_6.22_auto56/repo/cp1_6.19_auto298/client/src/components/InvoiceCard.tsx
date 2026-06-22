import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Invoice, statusLabels, statusColors } from '../types';
import { formatCurrency, formatDate, calculateTotal } from '../store/useInvoiceStore';
import './InvoiceCard.css';

interface InvoiceCardProps {
  invoice: Invoice;
  onClick?: () => void;
}

const InvoiceCard: React.FC<InvoiceCardProps> = ({ invoice, onClick }) => {
  const navigate = useNavigate();
  const totalAmount = calculateTotal(invoice.items, invoice.taxRate);
  const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = totalAmount - totalPaid;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/invoices/${invoice.id}`);
    }
  };

  return (
    <div
      className={`invoice-card status-${invoice.status}`}
      onClick={handleClick}
    >
      <div className="invoice-card-header">
        <span className="invoice-number">{invoice.invoiceNumber}</span>
        <span
          className="status-badge"
          style={{
            backgroundColor: statusColors[invoice.status],
            color: 'white',
          }}
        >
          {statusLabels[invoice.status]}
        </span>
      </div>
      <div className="invoice-card-body">
        <div className="customer-name">{invoice.customerName}</div>
        <div className="invoice-amount">
          <span className="amount-label">总金额</span>
          <span className="amount-value">{formatCurrency(totalAmount)}</span>
        </div>
        {balance > 0 && (
          <div className="invoice-balance">
            <span className="balance-label">待收</span>
            <span className="balance-value">{formatCurrency(balance)}</span>
          </div>
        )}
      </div>
      <div className="invoice-card-footer">
        <span className="due-date">截止日期: {formatDate(invoice.dueDate)}</span>
      </div>
    </div>
  );
};

export default InvoiceCard;
