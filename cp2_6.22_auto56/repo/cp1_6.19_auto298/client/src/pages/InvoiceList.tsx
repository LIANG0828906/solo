import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvoiceStore, formatCurrency, formatDate, calculateTotal } from '../store/useInvoiceStore';
import { Invoice, statusLabels, statusColors } from '../types';
import InvoiceCard from '../components/InvoiceCard';
import './InvoiceList.css';

const statusOptions = [
  { value: 'all', label: '全部' },
  { value: 'draft', label: '草稿' },
  { value: 'sent', label: '已发送' },
  { value: 'confirmed', label: '已确认' },
  { value: 'overdue', label: '逾期' },
];

const InvoiceList: React.FC = () => {
  const navigate = useNavigate();
  const { invoices, statusFilter, fetchInvoices, setStatusFilter, loading } = useInvoiceStore();
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(
    typeof window !== 'undefined' && window.innerWidth < 1024 ? 'cards' : 'table'
  );

  useEffect(() => {
    fetchInvoices(statusFilter);
  }, [statusFilter, fetchInvoices]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && viewMode === 'table') {
        setViewMode('cards');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
  };

  const sortedInvoices = [...invoices].sort((a, b) => {
    if (a.status === 'overdue' && b.status !== 'overdue') return -1;
    if (a.status !== 'overdue' && b.status === 'overdue') return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="invoice-list-page">
      <div className="page-header">
        <h1>发票列表</h1>
        <button
          className="btn-primary"
          onClick={() => navigate('/invoices/new')}
        >
          ➕ 新建发票
        </button>
      </div>

      <div className="list-controls">
        <div className="filter-tabs">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              className={`filter-tab ${statusFilter === option.value ? 'active' : ''}`}
              onClick={() => handleStatusChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="view-toggle">
          <button
            className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
          >
            📋
          </button>
          <button
            className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
            onClick={() => setViewMode('cards')}
          >
            📱
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <p>加载中...</p>
        </div>
      ) : sortedInvoices.length === 0 ? (
        <div className="empty-state">
          <p>暂无发票记录</p>
          <button
            className="btn-primary"
            onClick={() => navigate('/invoices/new')}
          >
            创建第一张发票
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <div className="table-container">
          <table className="invoice-table">
            <thead>
              <tr>
                <th>发票编号</th>
                <th>客户名称</th>
                <th>金额</th>
                <th>状态</th>
                <th>截止日期</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedInvoices.map((invoice) => (
                <TableRow
                  key={invoice.id}
                  invoice={invoice}
                  onClick={() => navigate(`/invoices/${invoice.id}`)}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="cards-grid">
          {sortedInvoices.map((invoice) => (
            <InvoiceCard key={invoice.id} invoice={invoice} />
          ))}
        </div>
      )}
    </div>
  );
};

interface TableRowProps {
  invoice: Invoice;
  onClick: () => void;
}

const TableRow: React.FC<TableRowProps> = ({ invoice, onClick }) => {
  const total = calculateTotal(invoice.items, invoice.taxRate);
  const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = total - totalPaid;

  return (
    <tr className="table-row" onClick={onClick}>
      <td>
        <span className="invoice-number">{invoice.invoiceNumber}</span>
      </td>
      <td>
        <div className="customer-info">
          <p className="customer-name">{invoice.customerName}</p>
          <p className="customer-email">{invoice.customerEmail}</p>
        </div>
      </td>
      <td>
        <div className="amount-info">
          <p className="total-amount">{formatCurrency(total)}</p>
          {balance > 0 && <p className="pending-amount">待收: {formatCurrency(balance)}</p>}
        </div>
      </td>
      <td>
        <span
          className="status-badge"
          style={{
            backgroundColor: statusColors[invoice.status],
            color: 'white',
          }}
        >
          {statusLabels[invoice.status]}
        </span>
      </td>
      <td>
        <span className={invoice.status === 'overdue' ? 'overdue-date' : ''}>
          {formatDate(invoice.dueDate)}
        </span>
      </td>
      <td>
        <button
          className="btn-text"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          查看详情
        </button>
      </td>
    </tr>
  );
};

export default InvoiceList;
