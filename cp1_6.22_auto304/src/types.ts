export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface Project {
  id: string;
  name: string;
  customerId: string;
  customerName: string;
  budget: number;
  startDate: string;
  spent: number;
  createdAt: string;
}

export type InvoiceStatus = 'invoiced' | 'partial' | 'paid';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  projectId: string;
  projectName: string;
  amount: number;
  invoiceDate: string;
  dueDate: string;
  status: InvoiceStatus;
  paidAmount: number;
  createdAt: string;
}

export interface MonthlyRevenue {
  month: string;
  amount: number;
}

export interface StatusDistribution {
  status: InvoiceStatus | 'all';
  label: string;
  count: number;
  amount: number;
  percentage: number;
}

export interface ProjectBudgetRate {
  projectId: string;
  projectName: string;
  budget: number;
  spent: number;
  rate: number;
  color: string;
}

export interface DashboardStatsData {
  totalRevenue: number;
  totalProfit: number;
  overdueAmount: number;
  overdueCount: number;
  collectionRate: number;
  monthlyRevenue: MonthlyRevenue[];
  statusDistribution: StatusDistribution[];
  projectBudgetRates: ProjectBudgetRate[];
}

export type FilterStatus = InvoiceStatus | 'all';
