import React, { useEffect, useState } from 'react';
import { useInvoiceStore } from '../store/useInvoiceStore';
import { Invoice, statusLabels, statusColors } from '../types';
import { formatCurrency, formatDate, calculateTotal } from '../store/useInvoiceStore';
import InvoicePreview from '../components/InvoicePreview';
import './Inbox.css';

const Inbox: React.FC = () => {
  const { invoices, fetchInvoices, confirmInvoice } = useInvoiceStore();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const sentInvoices = invoices.filter(inv => inv.status === 'sent' || inv.status === 'overdue');

  const handleConfirm = async (invoice: Invoice) => {
    await confirmInvoice(invoice.id);
    setSelectedInvoice(null);
    alert('发票已确认收到！');
  };

  return (
    <div className="inbox-page">
      <div className="page-header">
        <h1>📥 模拟收件箱</h1>
        <p className="subtitle">模拟客户视角查看和确认收到的发票</p>
      </div>

      <div className="inbox-layout">
        <div className="inbox-list">
          <div className="list-header">
            <h2>收到的发票</h2>
            <span className="count-badge">{sentInvoices.length}</span>
          </div>
          {sentInvoices.length === 0 ? (
            <div className="empty-inbox">
              <p>暂无待确认的发票</p>
            </div>
          ) : (
            <div className="invoice-list">
              {sentInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className={`inbox-item ${selectedInvoice?.id === invoice.id ? 'selected' : ''}`}
                  onClick={() => setSelectedInvoice(invoice)}
                >
                  <div className="item-header">
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
                  <div className="item-body">
                    <p className="from">来自: 发票管家</p>
                    <p className="subject">{invoice.customerName} - {formatCurrency(calculateTotal(invoice.items, invoice.taxRate))}</p>
                    <p className="date">{formatDate(invoice.issueDate)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="inbox-detail">
          {selectedInvoice ? (
            <div className="detail-view">
              <div className="detail-header">
                <div>
                  <h2>{selectedInvoice.invoiceNumber}</h2>
                  <p className="from-email">发件人: invoice@guanji.com</p>
                </div>
                {selectedInvoice.status !== 'confirmed' && (
                  <button
                    className="btn-primary btn-confirm"
                    onClick={() => handleConfirm(selectedInvoice)}
                  >
                    ✓ 确认收到
                  </button>
                )}
              </div>
              <div className="detail-body">
                <div className="email-content">
                  <p>尊敬的 {selectedInvoice.customerName}：</p>
                  <p>您好！附件是您的发票，请查收。</p>
                  <p>发票金额: <strong>{formatCurrency(calculateTotal(selectedInvoice.items, selectedInvoice.taxRate))}</strong></p>
                  <p>截止日期: {formatDate(selectedInvoice.dueDate)}</p>
                  <p>如有任何疑问，请随时联系我们。</p>
                  <p>此致<br />发票管家</p>
                </div>
                <div className="invoice-attachment">
                  <h3>📎 发票预览</h3>
                  <div className="preview-wrapper">
                    <InvoicePreview invoice={selectedInvoice} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <div className="no-selection-content">
                <span className="icon">📧</span>
                <p>选择一封邮件查看详情</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inbox;
