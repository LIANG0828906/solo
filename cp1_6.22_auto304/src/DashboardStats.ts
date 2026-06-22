import type {
  Project,
  Invoice,
  DashboardStatsData,
  MonthlyRevenue,
  StatusDistribution,
  ProjectBudgetRate,
  InvoiceStatus,
} from './types';

export class DashboardStats {
  static calculateStats(projects: Project[], invoices: Invoice[]): DashboardStatsData {
    return {
      totalRevenue: this.getTotalRevenue(invoices),
      totalProfit: this.getTotalProfit(projects, invoices),
      overdueAmount: this.getOverdueAmount(invoices),
      overdueCount: this.getOverdueCount(invoices),
      collectionRate: this.getCollectionRate(invoices),
      monthlyRevenue: this.getMonthlyRevenue(invoices, 6),
      statusDistribution: this.getStatusDistribution(invoices),
      projectBudgetRates: this.getProjectBudgetRates(projects, invoices),
    };
  }

  static getTotalRevenue(invoices: Invoice[]): number {
    return invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  }

  static getTotalProfit(projects: Project[], invoices: Invoice[]): number {
    const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
    const totalRevenue = this.getTotalRevenue(invoices);
    return totalRevenue - totalBudget * 0.7;
  }

  static getOverdueAmount(invoices: Invoice[]): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return invoices
      .filter((inv) => {
        if (inv.status === 'paid') return false;
        const dueDate = new Date(inv.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return today > dueDate;
      })
      .reduce((sum, inv) => sum + (inv.amount - inv.paidAmount), 0);
  }

  static getOverdueCount(invoices: Invoice[]): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return invoices.filter((inv) => {
      if (inv.status === 'paid') return false;
      const dueDate = new Date(inv.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return today > dueDate;
    }).length;
  }

  static getCollectionRate(invoices: Invoice[]): number {
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    if (totalAmount === 0) return 0;
    const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    return (totalPaid / totalAmount) * 100;
  }

  static getMonthlyRevenue(invoices: Invoice[], months: number): MonthlyRevenue[] {
    const result: MonthlyRevenue[] = [];
    const today = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const monthLabel = `${date.getFullYear()}年${date.getMonth() + 1}月`;

      const monthRevenue = invoices
        .filter((inv) => {
          const invDate = new Date(inv.invoiceDate);
          return (
            invDate.getFullYear() === date.getFullYear() &&
            invDate.getMonth() === date.getMonth()
          );
        })
        .reduce((sum, inv) => sum + inv.paidAmount, 0);

      result.push({
        month: monthLabel,
        amount: monthRevenue,
      });
    }

    return result;
  }

  static getStatusDistribution(invoices: Invoice[]): StatusDistribution[] {
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const statuses: InvoiceStatus[] = ['invoiced', 'partial', 'paid'];

    return statuses.map((status) => {
      const statusInvoices = invoices.filter((inv) => inv.status === status);
      const count = statusInvoices.length;
      const amount = statusInvoices.reduce((sum, inv) => sum + inv.amount, 0);
      const labels: Record<InvoiceStatus, string> = {
        invoiced: '已开票',
        partial: '部分收款',
        paid: '已结清',
      };

      return {
        status,
        label: labels[status],
        count,
        amount,
        percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
      };
    });
  }

  static getProjectBudgetRates(
    projects: Project[],
    invoices: Invoice[]
  ): ProjectBudgetRate[] {
    return projects.map((project) => {
      const projectInvoices = invoices.filter((inv) => inv.projectId === project.id);
      const spent = projectInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
      const rate = project.budget > 0 ? (spent / project.budget) * 100 : 0;
      let color = '#4CAF50';
      if (rate >= 80 && rate <= 100) color = '#FF9800';
      if (rate > 100) color = '#F44336';

      return {
        projectId: project.id,
        projectName: project.name,
        budget: project.budget,
        spent,
        rate,
        color,
      };
    });
  }

  static getAverageMonthlyRevenue(monthlyRevenue: MonthlyRevenue[]): number {
    if (monthlyRevenue.length === 0) return 0;
    const total = monthlyRevenue.reduce((sum, m) => sum + m.amount, 0);
    return total / monthlyRevenue.length;
  }
}
