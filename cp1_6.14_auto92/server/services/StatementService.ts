import { Statement, StatementItem, StatementSummary, Receipt, ReceiptStatus } from '../../shared/types/index.js';
import db from '../db/index.js';
import receiptService from './ReceiptService.js';
import customerService from './CustomerService.js';

interface GenerateStatementRequest {
  customerId: string;
  startDate: string;
  endDate: string;
}

interface StatusSummary {
  count: number;
  totalAmount: number;
  totalTax: number;
  grandTotal: number;
  paidTotal: number;
  pendingTotal: number;
  overdueTotal: number;
}

export class StatementService {
  async generateStatement(request: GenerateStatementRequest): Promise<Statement> {
    return new Promise((resolve, reject) => {
      setImmediate(async () => {
        try {
          const result = await this.processStatementGeneration(request);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  private async processStatementGeneration(request: GenerateStatementRequest): Promise<Statement> {
    const { customerId, startDate, endDate } = request;

    const customerPromise = customerService.getCustomerById(customerId);
    const receiptsPromise = receiptService.getReceiptsForStatement(customerId, startDate, endDate);

    const [customer, receipts] = await Promise.all([customerPromise, receiptsPromise]);

    if (!customer) {
      throw new Error('Customer not found');
    }

    const items = this.processReceiptsInBatches(receipts);
    const summary = this.calculateSummary(receipts);
    const statusSummary = this.calculateStatusSummary(receipts);

    return {
      customerId,
      customerName: customer.name,
      startDate,
      endDate,
      summary,
      items
    };
  }

  private processReceiptsInBatches(receipts: Receipt[]): StatementItem[] {
    const items: StatementItem[] = [];
    const BATCH_SIZE = 50;
    let balance = 0;

    for (let i = 0; i < receipts.length; i += BATCH_SIZE) {
      const batch = receipts.slice(i, i + BATCH_SIZE);

      for (const receipt of batch) {
        const debit = receipt.totalAmount;
        const credit = receipt.status === 'paid' ? receipt.totalAmount : 0;
        balance += debit - credit;

        items.push({
          id: receipt.id,
          date: receipt.date,
          description: receipt.note || `${receipt.transactionType === 'service' ? '服务费' : '商品'} - ${receipt.receiptNo}`,
          debit,
          credit,
          balance
        });
      }
    }

    return items;
  }

  private calculateSummary(receipts: Receipt[]): StatementSummary {
    let totalDebit = 0;
    let totalCredit = 0;

    for (const receipt of receipts) {
      totalDebit += receipt.totalAmount;
      if (receipt.status === 'paid') {
        totalCredit += receipt.totalAmount;
      }
    }

    const openingBalance = 0;
    const closingBalance = openingBalance + totalDebit - totalCredit;

    return {
      openingBalance,
      totalDebit,
      totalCredit,
      closingBalance
    };
  }

  private calculateStatusSummary(receipts: Receipt[]): StatusSummary {
    let paidTotal = 0;
    let pendingTotal = 0;
    let overdueTotal = 0;
    let totalAmount = 0;
    let totalTax = 0;

    for (const receipt of receipts) {
      totalAmount += receipt.amount;
      totalTax += receipt.taxAmount;

      switch (receipt.status) {
        case 'paid':
          paidTotal += receipt.totalAmount;
          break;
        case 'pending':
        case 'partial':
          pendingTotal += receipt.totalAmount;
          break;
        case 'overdue':
          overdueTotal += receipt.totalAmount;
          break;
      }
    }

    return {
      count: receipts.length,
      totalAmount,
      totalTax,
      grandTotal: totalAmount + totalTax,
      paidTotal,
      pendingTotal,
      overdueTotal
    };
  }

  getStatusSummary(statement: Statement): StatusSummary {
    const receipts = db.data.receipts.filter((r: Receipt) =>
      r.customerId === statement.customerId &&
      r.date >= statement.startDate &&
      r.date <= statement.endDate
    );

    return this.calculateStatusSummary(receipts);
  }

  async getStatementStatusBreakdown(customerId: string, startDate: string, endDate: string): Promise<Record<ReceiptStatus, { count: number; amount: number }>> {
    const receipts = await receiptService.getReceiptsForStatement(customerId, startDate, endDate);

    const breakdown: Record<ReceiptStatus, { count: number; amount: number }> = {
      pending: { count: 0, amount: 0 },
      paid: { count: 0, amount: 0 },
      overdue: { count: 0, amount: 0 },
      partial: { count: 0, amount: 0 }
    };

    for (const receipt of receipts) {
      breakdown[receipt.status].count++;
      breakdown[receipt.status].amount += receipt.totalAmount;
    }

    return breakdown;
  }
}

export const statementService = new StatementService();
export default statementService;
