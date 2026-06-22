import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInvoiceStore, formatCurrency, formatDate, calculateSubtotal, calculateTax, calculateTotal } from '../store/useInvoiceStore';
import { statusLabels, statusColors } from '../types';
import InvoicePreview from '../components/InvoicePreview';
import './InvoiceDetail.css';

const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getInvoiceById, fetchInvoices, sendInvoice, deleteInvoice, addPayment, removePayment, loading } = useInvoiceStore();
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const invoice = getInvoiceById(id || '');

  useEffect(() => {
    if (invoice) {
      const total = calculateTotal(invoice.items, invoice.taxRate);
      const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
      const remaining = total - totalPaid;
      if (remaining > 0) {
        setPaymentAmount(remaining.toFixed(2));
      }
    }
  }, [invoice]);

  if (!invoice && !loading) {
    return (
      <div className="invoice-detail-page">
        <div className="empty-state">
          <p>发票不存在</p>
          <button className="btn-primary" onClick={() => navigate('/invoices')}>
            返回列表
          </button>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="invoice-detail-page">
        <div className="loading-state">
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  const total = calculateTotal(invoice.items, invoice.taxRate);
  const subtotal = calculateSubtotal(invoice.items);
  const tax = calculateTax(invoice.items, invoice.taxRate);
  const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = total - totalPaid;

  const handleSend = async () => {
    if (confirm(`确定发送发票 ${invoice.invoiceNumber} 到 ${invoice.customerEmail}?`)) {
      await sendInvoice(invoice.id);
      alert('发票已发送！');
    }
  };

  const handleDelete = async () => {
    if (confirm('确定删除这张发票？此操作不可恢复。')) {
      await deleteInvoice(invoice.id);
      navigate('/invoices');
    }
  };

  const handleAddPayment = async () => {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      alert('请输入有效的收款金额');
      return;
    }
    if (amount > balance) {
      alert('收款金额不能超过待收余额');
      return;
    }
    await addPayment(invoice.id, amount, paymentDate);
    setPaymentAmount('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
  };

  const handleRemovePayment = async (paymentId: string) => {
    if (confirm('确定删除这条收款记录？')) {
      await removePayment(invoice.id, paymentId);
    }
  };

  return (
    <div className="invoice-detail-page">
      <div className="page-header">
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate('/invoices')}>
            ← 返回列表
          </button>
          <h1>{invoice.invoiceNumber}</h1>
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
        <div className="header-actions">
          {invoice.status === 'draft' && (
            <button className="btn-primary" onClick={handleSend}>
              📧 发送发票
            </button>
          )}
          {invoice.status === 'sent' && (
            <button className="btn-primary" onClick={handleSend}>
              📧 重新发送
            </button>
          )}
          <button className="btn-secondary" onClick={() => setShowDeleteConfirm(true)}>
            🗑️ 删除
          </button>
        </div>
      </div>

      <div className="detail-layout">
        <div className="detail-content">
          <div className="info-card">
            <h2>客户信息</h2>
            <div className="info-grid">
              <div className="info-item">
                <label>客户名称</label>
                <p>{invoice.customerName}</p>
              </div>
              <div className="info-item">
                <label>客户邮箱</label>
                <p>{invoice.customerEmail || '-'}</p>
              </div>
              <div className="info-item full-width">
                <label>客户地址</label>
                <p>{invoice.customerAddress || '-'}</p>
              </div>
            </div>
          </div>

          <div className="info-card">
            <h2>发票信息</h2>
            <div className="info-grid">
              <div className="info-item">
                <label>开票日期</label>
                <p>{formatDate(invoice.issueDate)}</p>
              </div>
              <div className="info-item">
                <label>截止日期</label>
                <p className={invoice.status === 'overdue' ? 'overdue' : ''}>
                  {formatDate(invoice.dueDate)}
                </p>
              </div>
              <div className="info-item">
                <label>税率</label>
                <p>{(invoice.taxRate * 100).toFixed(0)}%</p>
              </div>
              <div className="info-item">
                <label>模板</label>
                <p>{invoice.template}</p>
              </div>
            </div>
          </div>

          <div className="info-card">
            <h2>项目明细</h2>
            <table className="items-table">
              <thead>
                <tr>
                  <th>描述</th>
                  <th style={{ textAlign: 'center' }}>数量</th>
                  <th style={{ textAlign: 'right' }}>单价</th>
                  <th style={{ textAlign: 'right' }}>小计</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.description}</td>
                    <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</td>
                    <td style={{ textAlign: 'right' }}>
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="totals-section">
              <div className="total-row">
                <span>小计:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="total-row">
                <span>税费 ({(invoice.taxRate * 100).toFixed(0)}%):</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="total-row grand-total">
                <span>总计:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          <div className="info-card">
            <h2>收款记录</h2>
            <div className="payment-summary">
              <div className="summary-item">
                <label>已收款</label>
                <p className="paid">{formatCurrency(totalPaid)}</p>
              </div>
              <div className="summary-item">
                <label>待收款</label>
                <p className={balance > 0 ? 'pending' : 'paid'}>{formatCurrency(balance)}</p>
              </div>
            </div>

            {invoice.payments.length > 0 ? (
              <table className="payments-table">
                <thead>
                  <tr>
                    <th>日期</th>
                    <th style={{ textAlign: 'right' }}>金额</th>
                    <th style={{ textAlign: 'right' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>{formatDate(payment.date)}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(payment.amount)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn-text btn-danger"
                          onClick={() => handleRemovePayment(payment.id)}
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="empty-text">暂无收款记录</p>
            )}

            {balance > 0 && invoice.status !== 'draft' && (
              <div className="add-payment-form">
                <h3>添加收款</h3>
                <div className="payment-inputs">
                  <div className="form-group">
                    <label>金额</label>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="输入收款金额"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="form-group">
                    <label>日期</label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                    />
                  </div>
                  <div className="form-group form-action">
                    <button className="btn-primary" onClick={handleAddPayment}>
                      确认收款
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {invoice.notes && (
            <div className="info-card">
              <h2>备注</h2>
              <p className="notes-text">{invoice.notes}</p>
            </div>
          )}
        </div>

        <div className="preview-section">
          <div className="preview-sticky">
            <h2>发票预览</h2>
            <div className="preview-container">
              <InvoicePreview invoice={invoice} />
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>确认删除</h3>
            <p>确定要删除发票 {invoice.invoiceNumber} 吗？此操作不可恢复。</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                取消
              </button>
              <button className="btn-danger" onClick={handleDelete}>
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetail;
