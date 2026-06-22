import React from 'react';
import { Invoice, InvoiceTemplate } from '../types';
import { calculateSubtotal, calculateTax, calculateTotal, formatCurrency, formatDate } from '../store/useInvoiceStore';
import './InvoicePreview.css';

interface InvoicePreviewProps {
  invoice: Partial<Invoice>;
}

const templateStyles: Record<InvoiceTemplate, { primary: string; secondary: string; bg: string; text: string }> = {
  'minimal-white': {
    primary: '#2C3E50',
    secondary: '#7F8C8D',
    bg: '#FFFFFF',
    text: '#2C3E50',
  },
  'business-blue': {
    primary: '#2980B9',
    secondary: '#3498DB',
    bg: '#FFFFFF',
    text: '#2C3E50',
  },
  'warm-tone': {
    primary: '#E67E22',
    secondary: '#F39C12',
    bg: '#FFFBF5',
    text: '#5D4037',
  },
};

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice }) => {
  const template = invoice.template || 'minimal-white';
  const styles = templateStyles[template];
  const items = invoice.items || [];
  const subtotal = calculateSubtotal(items);
  const tax = calculateTax(items, invoice.taxRate || 0.06);
  const total = calculateTotal(items, invoice.taxRate || 0.06);

  return (
    <div
      className="invoice-preview"
      style={{
        backgroundColor: styles.bg,
        color: styles.text,
      }}
    >
      <div
        className="preview-header"
        style={{
          borderBottom: `3px solid ${styles.primary}`,
        }}
      >
        <div className="header-left">
          <h2 style={{ color: styles.primary }}>发票</h2>
          <p className="invoice-no">
            {invoice.invoiceNumber || 'INV-XXXX-XXX'}
          </p>
        </div>
        <div className="header-right">
          <div className="date-row">
            <span>开票日期:</span>
            <span>{invoice.issueDate ? formatDate(invoice.issueDate) : '--'}</span>
          </div>
          <div className="date-row">
            <span>截止日期:</span>
            <span>{invoice.dueDate ? formatDate(invoice.dueDate) : '--'}</span>
          </div>
        </div>
      </div>

      <div className="preview-section customer-section">
        <div className="section-title" style={{ color: styles.primary }}>
          客户信息
        </div>
        <div className="customer-info">
          <p className="customer-name">{invoice.customerName || '客户名称'}</p>
          <p className="customer-address">{invoice.customerAddress || '客户地址'}</p>
          <p className="customer-email">{invoice.customerEmail || '客户邮箱'}</p>
        </div>
      </div>

      <div className="preview-section">
        <table className="items-table">
          <thead>
            <tr style={{ backgroundColor: styles.primary, color: 'white' }}>
              <th>描述</th>
              <th style={{ textAlign: 'center' }}>数量</th>
              <th style={{ textAlign: 'right' }}>单价</th>
              <th style={{ textAlign: 'right' }}>小计</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: '#95A5A6' }}>
                  暂无项目
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={item.id || index}>
                  <td>{item.description}</td>
                  <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</td>
                  <td style={{ textAlign: 'right' }}>
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="preview-section totals-section">
        <div className="totals">
          <div className="total-row">
            <span>小计:</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="total-row">
            <span>税费 ({((invoice.taxRate || 0.06) * 100).toFixed(0)}%):</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          <div
            className="total-row grand-total"
            style={{
              borderTop: `2px solid ${styles.primary}`,
              color: styles.primary,
            }}
          >
            <span>总计:</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {invoice.notes && (
        <div className="preview-section notes-section">
          <div className="section-title" style={{ color: styles.primary }}>
            备注
          </div>
          <p className="notes-text">{invoice.notes}</p>
        </div>
      )}
    </div>
  );
};

export default InvoicePreview;
