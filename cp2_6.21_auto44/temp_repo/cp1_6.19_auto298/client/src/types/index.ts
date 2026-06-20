export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'confirmed' | 'overdue';
export type InvoiceTemplate = 'minimal-white' | 'business-blue' | 'warm-tone';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerAddress: string;
  customerEmail: string;
  items: InvoiceItem[];
  taxRate: number;
  status: InvoiceStatus;
  template: InvoiceTemplate;
  dueDate: string;
  issueDate: string;
  createdAt: string;
  updatedAt: string;
  payments: PaymentRecord[];
  notes?: string;
}

export interface DashboardStats {
  totalCount: number;
  totalPaid: number;
  totalPending: number;
  overdueCount: number;
}

export const statusLabels: Record<InvoiceStatus, string> = {
  draft: '草稿',
  sent: '已发送',
  confirmed: '已确认',
  overdue: '逾期',
};

export const statusColors: Record<InvoiceStatus, string> = {
  draft: '#95A5A6',
  sent: '#F39C12',
  confirmed: '#27AE60',
  overdue: '#E74C3C',
};

export const templateLabels: Record<InvoiceTemplate, string> = {
  'minimal-white': '简约白',
  'business-blue': '商务蓝',
  'warm-tone': '暖色调',
};
