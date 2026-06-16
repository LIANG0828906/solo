export type InvoiceStatus = 'pending' | 'approved' | 'archived';

export interface Invoice {
  id: string;
  invoiceNo: string;
  customerName: string;
  amount: number;
  date: string;
  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceFormData {
  invoiceNo: string;
  customerName: string;
  amount: number | '';
  date: string;
  status: InvoiceStatus;
}

export interface FormErrors {
  invoiceNo?: string;
  customerName?: string;
  amount?: string;
  date?: string;
  status?: string;
}

export function generateInvoiceNo(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV${year}${month}${day}${random}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isFutureDate(dateStr: string): boolean {
  const inputDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  inputDate.setHours(0, 0, 0, 0);
  return inputDate.getTime() > today.getTime();
}

export function aggregateMonthlyData(invoices: Invoice[]): { month: string; amount: number }[] {
  const map = new Map<string, number>();

  invoices.forEach((invoice) => {
    const date = new Date(invoice.date);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const current = map.get(month) || 0;
    map.set(month, current + invoice.amount);
  });

  return Array.from(map.entries())
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export function aggregateCustomerData(invoices: Invoice[]): { name: string; value: number }[] {
  const map = new Map<string, number>();

  invoices.forEach((invoice) => {
    const current = map.get(invoice.customerName) || 0;
    map.set(invoice.customerName, current + invoice.amount);
  });

  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
