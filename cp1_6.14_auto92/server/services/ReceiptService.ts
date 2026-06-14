import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { Customer, Receipt, ReceiptStatus, PaymentInfo } from '../../shared/types/index.js';

interface ReceiptQuery {
  customerId?: string;
  status?: ReceiptStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const OVERDUE_DAYS = 30;

export class ReceiptService {
  async generateReceiptNo(): Promise<string> {
    const now = new Date();
    const dateKey = now.toISOString().slice(0, 10).replace(/-/g, '');

    const currentCounter = db.data.receiptCounter[dateKey] || 0;
    const nextCounter = currentCounter + 1;

    db.data.receiptCounter[dateKey] = nextCounter;
    await db.write();

    const paddedCounter = nextCounter.toString().padStart(3, '0');
    return `RCT-${dateKey}-${paddedCounter}`;
  }

  private calculateOverdueStatus(receipt: Receipt): Receipt {
    if (receipt.status !== 'pending' && receipt.status !== 'partial') {
      return receipt;
    }

    const receiptDate = new Date(receipt.date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - receiptDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > OVERDUE_DAYS) {
      return { ...receipt, status: 'overdue' as ReceiptStatus };
    }

    return receipt;
  }

  private applyFilters(receipts: Receipt[], query: ReceiptQuery): Receipt[] {
    let filtered = [...receipts];

    if (query.customerId) {
      filtered = filtered.filter(r => r.customerId === query.customerId);
    }

    if (query.status) {
      filtered = filtered.filter(r => {
        const processed = this.calculateOverdueStatus(r);
        return processed.status === query.status;
      });
    }

    if (query.startDate) {
      filtered = filtered.filter(r => r.date >= query.startDate!);
    }

    if (query.endDate) {
      filtered = filtered.filter(r => r.date <= query.endDate!);
    }

    return filtered;
  }

  async getReceipts(query: ReceiptQuery = {}): Promise<PaginatedResult<Receipt>> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;

    const allReceipts = db.data.receipts;
    const filtered = this.applyFilters(allReceipts, query);

    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;

    const paginatedData = filtered.slice(offset, offset + pageSize)
      .map(receipt => this.calculateOverdueStatus(receipt));

    return {
      data: paginatedData,
      total,
      page,
      pageSize,
      totalPages
    };
  }

  async getReceiptById(id: string): Promise<Receipt | undefined> {
    const receipt = db.data.receipts.find((r: Receipt) => r.id === id);
    return receipt ? this.calculateOverdueStatus(receipt) : undefined;
  }

  async createReceipt(receiptData: Omit<Receipt, 'id' | 'receiptNo' | 'createdAt' | 'status'>): Promise<Receipt> {
    const receiptNo = await this.generateReceiptNo();
    const customer = db.data.customers.find((c: Customer) => c.id === receiptData.customerId);

    const newReceipt: Receipt = {
      ...receiptData,
      id: uuidv4(),
      receiptNo,
      customerName: customer?.name || '',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    db.data.receipts.push(newReceipt);
    await db.write();

    return newReceipt;
  }

  async updateReceipt(id: string, updates: Partial<Omit<Receipt, 'id' | 'receiptNo' | 'createdAt'>>): Promise<Receipt | undefined> {
    const receiptIndex = db.data.receipts.findIndex((r: Receipt) => r.id === id);

    if (receiptIndex === -1) {
      return undefined;
    }

    if (updates.customerId) {
      const customer = db.data.customers.find((c: Customer) => c.id === updates.customerId);
      if (customer) {
        updates.customerName = customer.name;
      }
    }

    const updatedReceipt: Receipt = {
      ...db.data.receipts[receiptIndex],
      ...updates
    };

    db.data.receipts[receiptIndex] = updatedReceipt;
    await db.write();

    return this.calculateOverdueStatus(updatedReceipt);
  }

  async updateStatus(id: string, status: ReceiptStatus, paymentInfo?: PaymentInfo): Promise<Receipt | undefined> {
    const receiptIndex = db.data.receipts.findIndex((r: Receipt) => r.id === id);

    if (receiptIndex === -1) {
      return undefined;
    }

    const receipt = db.data.receipts[receiptIndex];
    const currentPaymentInfo = receipt.paymentInfo || {};

    const updatedPaymentInfo: PaymentInfo = {
      ...currentPaymentInfo,
      ...paymentInfo
    };

    if (status === 'paid' || status === 'partial') {
      if (!updatedPaymentInfo.date) {
        updatedPaymentInfo.date = new Date().toISOString().slice(0, 10);
      }
    }

    const updatedReceipt: Receipt = {
      ...receipt,
      status,
      paymentInfo: updatedPaymentInfo
    };

    db.data.receipts[receiptIndex] = updatedReceipt;
    await db.write();

    return this.calculateOverdueStatus(updatedReceipt);
  }

  async deleteReceipt(id: string): Promise<boolean> {
    const initialLength = db.data.receipts.length;
    db.data.receipts = db.data.receipts.filter((r: Receipt) => r.id !== id);

    if (db.data.receipts.length === initialLength) {
      return false;
    }

    await db.write();
    return true;
  }

  async getReceiptsForStatement(customerId: string, startDate: string, endDate: string): Promise<Receipt[]> {
    const receipts = db.data.receipts.filter((r: Receipt) =>
      r.customerId === customerId &&
      r.date >= startDate &&
      r.date <= endDate
    );

    return receipts
      .sort((a: Receipt, b: Receipt) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((r: Receipt) => this.calculateOverdueStatus(r));
  }
}

export const receiptService = new ReceiptService();
export default receiptService;
