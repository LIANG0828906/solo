import type { Invoice, InvoiceStatus, FilterStatus } from './types';

export class InvoiceManager {
  private invoices: Invoice[] = [];
  private invoiceCounter: number = 1000;

  constructor(initialInvoices: Invoice[] = []) {
    this.invoices = initialInvoices;
    if (initialInvoices.length > 0) {
      const maxNum = Math.max(
        ...initialInvoices.map((inv) => {
          const match = inv.invoiceNumber.match(/-(\d+)$/);
          return match ? parseInt(match[1], 10) : 1000;
        })
      );
      this.invoiceCounter = maxNum + 1;
    }
  }

  getInvoices(): Invoice[] {
    return [...this.invoices];
  }

  createInvoice(
    data: Omit<Invoice, 'id' | 'invoiceNumber' | 'status' | 'paidAmount' | 'createdAt'>
  ): Invoice {
    const newInvoice: Invoice = {
      ...data,
      id: crypto.randomUUID(),
      invoiceNumber: this.generateInvoiceNumber(),
      status: 'invoiced',
      paidAmount: 0,
      createdAt: new Date().toISOString(),
    };
    this.invoices.push(newInvoice);
    this.invoiceCounter++;
    return newInvoice;
  }

  updateInvoiceStatus(
    id: string,
    status: InvoiceStatus,
    paidAmount?: number
  ): Invoice | null {
    const index = this.invoices.findIndex((inv) => inv.id === id);
    if (index === -1) return null;

    const invoice = this.invoices[index];
    const updatedPaidAmount =
      paidAmount !== undefined
        ? paidAmount
        : status === 'paid'
        ? invoice.amount
        : status === 'partial'
        ? invoice.amount / 2
        : 0;

    this.invoices[index] = {
      ...invoice,
      status,
      paidAmount: updatedPaidAmount,
    };
    return this.invoices[index];
  }

  getNextStatus(current: InvoiceStatus): InvoiceStatus {
    const order: InvoiceStatus[] = ['invoiced', 'partial', 'paid'];
    const currentIndex = order.indexOf(current);
    return order[(currentIndex + 1) % order.length];
  }

  getInvoicesByProject(projectId: string): Invoice[] {
    return this.invoices.filter((inv) => inv.projectId === projectId);
  }

  getInvoicesByStatus(status: FilterStatus): Invoice[] {
    if (status === 'all') return this.getInvoices();
    return this.invoices.filter((inv) => inv.status === status);
  }

  getOverdueDays(invoice: Invoice): number {
    if (invoice.status === 'paid') return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(invoice.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  isOverdue(invoice: Invoice): boolean {
    return this.getOverdueDays(invoice) > 0;
  }

  getNextInvoiceNumber(): string {
    const year = new Date().getFullYear();
    return `INV-${year}-${this.invoiceCounter.toString().padStart(4, '0')}`;
  }

  generateInvoiceNumber(): string {
    return this.getNextInvoiceNumber();
  }

  getStatusLabel(status: InvoiceStatus): string {
    const labels: Record<InvoiceStatus, string> = {
      invoiced: '已开票',
      partial: '部分收款',
      paid: '已结清',
    };
    return labels[status];
  }

  getStatusColor(status: InvoiceStatus): string {
    const colors: Record<InvoiceStatus, string> = {
      invoiced: '#2196F3',
      partial: '#FF9800',
      paid: '#4CAF50',
    };
    return colors[status];
  }

  filterInvoices(keyword: string, status: FilterStatus): Invoice[] {
    let result = this.getInvoices();

    if (status !== 'all') {
      result = result.filter((inv) => inv.status === status);
    }

    if (keyword.trim()) {
      const lowerKeyword = keyword.toLowerCase();
      result = result.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(lowerKeyword) ||
          inv.projectName.toLowerCase().includes(lowerKeyword)
      );
    }

    return result;
  }
}
