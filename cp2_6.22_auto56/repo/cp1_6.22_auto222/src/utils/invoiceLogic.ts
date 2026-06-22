import { v4 as uuidv4 } from 'uuid';
import type { Invoice, PaymentRecord } from './storage';

export const generateInvoiceNumber = (existingInvoices: Invoice[]): string => {
  const year = new Date().getFullYear();
  const count = existingInvoices.length + 1;
  return `INV-${year}-${String(count).padStart(4, '0')}`;
};

export const calculateOverdueDays = (dueDate: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
};

export const isOverdue = (dueDate: string, status: string): boolean => {
  if (status === 'paid' || status === 'draft') return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  due.setDate(due.getDate() + 1);
  
  return today > due;
};

export const checkOverdueInvoices = (invoices: Invoice[]): { updated: Invoice[]; changedIds: string[] } => {
  const changedIds: string[] = [];
  
  const updated = invoices.map(invoice => {
    if (invoice.status === 'pending' && isOverdue(invoice.dueDate, invoice.status)) {
      changedIds.push(invoice.id);
      return updateInvoiceStatus(invoice, 'overdue', '系统自动标记为逾期');
    }
    return invoice;
  });
  
  return { updated, changedIds };
};

export const updateInvoiceStatus = (
  invoice: Invoice,
  newStatus: 'draft' | 'pending' | 'paid' | 'overdue',
  note?: string
): Invoice => {
  const statusNotes: Record<string, string> = {
    draft: '草稿',
    pending: '发票已发送',
    paid: '款项已到账',
    overdue: '已逾期'
  };
  
  const newRecord: PaymentRecord = {
    id: uuidv4(),
    status: newStatus,
    timestamp: new Date().toISOString(),
    note: note || statusNotes[newStatus]
  };
  
  return {
    ...invoice,
    status: newStatus,
    paymentHistory: [...invoice.paymentHistory, newRecord],
    updatedAt: new Date().toISOString()
  };
};

export const generateReminderText = (invoice: Invoice): string => {
  const overdueDays = calculateOverdueDays(invoice.dueDate);
  const amountStr = formatCurrency(invoice.amount, invoice.currency);
  
  return `尊敬的${invoice.clientName}您好，

发票#${invoice.invoiceNumber}已逾期${overdueDays}天，发票金额为${amountStr}。

项目描述：${invoice.projectDescription}
发票日期：${formatDate(invoice.invoiceDate)}
到期日期：${formatDate(invoice.dueDate)}

请您尽快安排付款，如有任何疑问请随时与我联系。

感谢您的配合！

顺颂商祺`;
};

export const formatCurrency = (amount: number, currency: string): string => {
  const currencySymbols: Record<string, string> = {
    CNY: '¥',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥'
  };
  
  const symbol = currencySymbols[currency] || currency;
  return `${symbol}${amount.toLocaleString()}`;
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    paid: '#10B981',
    overdue: '#EF4444',
    pending: '#F59E0B',
    draft: '#9CA3AF'
  };
  return colors[status] || '#9CA3AF';
};

export const getStatusText = (status: string): string => {
  const texts: Record<string, string> = {
    paid: '已付款',
    overdue: '逾期',
    pending: '待付款',
    draft: '草稿'
  };
  return texts[status] || status;
};
