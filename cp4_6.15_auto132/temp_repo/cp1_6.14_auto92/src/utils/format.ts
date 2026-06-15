import dayjs from 'dayjs';
import type { ReceiptStatus } from '../../shared/types';

export const formatCurrency = (amount: number): string => {
  const formatted = new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
  return `¥${formatted}`;
};

export const formatDate = (dateStr: string): string => {
  return dayjs(dateStr).format('YYYY-MM-DD');
};

export const formatDateTime = (dateStr: string): string => {
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm:ss');
};

export const formatReceiptStatus = (status: ReceiptStatus): string => {
  const statusMap: Record<ReceiptStatus, string> = {
    pending: '待支付',
    paid: '已支付',
    overdue: '逾期',
    partial: '部分付款'
  };
  return statusMap[status] || status;
};

export const getStatusColorClass = (status: ReceiptStatus): string => {
  const colorMap: Record<ReceiptStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
    partial: 'bg-blue-100 text-blue-800'
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
};
