export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
}

export type ReceiptStatus = 'pending' | 'paid' | 'overdue' | 'partial';

export type TransactionType = 'service' | 'product';

export interface PaymentInfo {
  date?: string;
  method?: string;
  amount?: number;
}

export interface Receipt {
  id: string;
  receiptNo: string;
  customerId: string;
  customerName: string;
  transactionType: TransactionType;
  amount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  date: string;
  note: string;
  status: ReceiptStatus;
  paymentInfo?: PaymentInfo;
  createdAt: string;
}

export interface StatementItem {
  id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface StatementSummary {
  openingBalance: number;
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
}

export interface Statement {
  customerId: string;
  customerName: string;
  startDate: string;
  endDate: string;
  summary: StatementSummary;
  items: StatementItem[];
}

export interface DashboardStats {
  monthPending: number;
  monthPaid: number;
  overdueTotal: number;
  customerCount: number;
  recentReceipts: Receipt[];
}
