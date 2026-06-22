import { DashboardStats, Receipt } from '../../shared/types/index.js';
import db from '../db/index.js';
import receiptService from './ReceiptService.js';

const OVERDUE_DAYS = 30;

export class DashboardService {
  async getStats(): Promise<DashboardStats> {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const receipts = db.data.receipts;
    const customers = db.data.customers;

    let monthPending = 0;
    let monthPaid = 0;
    let overdueTotal = 0;
    const customerCount = customers.length;

    const processedReceipts: Receipt[] = [];

    for (const receipt of receipts) {
      const processed = receiptService['calculateOverdueStatus'](receipt);
      processedReceipts.push(processed);

      const receiptDate = new Date(receipt.date);
      const isCurrentMonth = receiptDate.getMonth() === currentMonth &&
                            receiptDate.getFullYear() === currentYear;

      if (isCurrentMonth) {
        if (processed.status === 'pending' || processed.status === 'partial') {
          monthPending += receipt.totalAmount;
        } else if (processed.status === 'paid') {
          monthPaid += receipt.totalAmount;
        }
      }

      if (processed.status === 'overdue') {
        overdueTotal += receipt.totalAmount;
      }
    }

    const recentReceipts = processedReceipts
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return {
      monthPending,
      monthPaid,
      overdueTotal,
      customerCount,
      recentReceipts
    };
  }

  async getMonthlyTrend(months: number = 6): Promise<Array<{ month: string; paid: number; pending: number; overdue: number }>> {
    const result: Array<{ month: string; paid: number; pending: number; overdue: number }> = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7);
      const monthLabel = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      let paid = 0;
      let pending = 0;
      let overdue = 0;

      for (const receipt of db.data.receipts) {
        if (!receipt.date.startsWith(monthKey)) continue;

        const processed = receiptService['calculateOverdueStatus'](receipt);

        switch (processed.status) {
          case 'paid':
            paid += receipt.totalAmount;
            break;
          case 'pending':
          case 'partial':
            pending += receipt.totalAmount;
            break;
          case 'overdue':
            overdue += receipt.totalAmount;
            break;
        }
      }

      result.push({ month: monthLabel, paid, pending, overdue });
    }

    return result;
  }

  async getTopCustomers(limit: number = 5): Promise<Array<{ customerId: string; customerName: string; totalAmount: number; receiptCount: number }>> {
    const customerStats = new Map<string, { customerName: string; totalAmount: number; receiptCount: number }>();

    for (const receipt of db.data.receipts) {
      const existing = customerStats.get(receipt.customerId);
      if (existing) {
        existing.totalAmount += receipt.totalAmount;
        existing.receiptCount++;
      } else {
        customerStats.set(receipt.customerId, {
          customerName: receipt.customerName,
          totalAmount: receipt.totalAmount,
          receiptCount: 1
        });
      }
    }

    return Array.from(customerStats.values())
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, limit)
      .map(stat => ({
        customerId: Array.from(customerStats.entries()).find(([_, v]) => v === stat)?.[0] || '',
        ...stat
      }));
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
