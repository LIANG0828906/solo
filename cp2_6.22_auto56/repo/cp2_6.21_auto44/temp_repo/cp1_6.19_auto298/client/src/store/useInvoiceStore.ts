import { create } from 'zustand';
import axios from 'axios';
import { Invoice, DashboardStats, InvoiceItem, InvoiceTemplate } from '../types';

const API_BASE = '/api/invoices';

interface InvoiceStore {
  invoices: Invoice[];
  stats: DashboardStats;
  recentInvoices: Invoice[];
  loading: boolean;
  error: string | null;
  statusFilter: string;
  
  fetchInvoices: (status?: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchRecent: () => Promise<void>;
  getInvoiceById: (id: string) => Invoice | undefined;
  
  createInvoice: (data: Partial<Invoice>) => Promise<Invoice>;
  updateInvoice: (id: string, data: Partial<Invoice>) => Promise<Invoice>;
  deleteInvoice: (id: string) => Promise<void>;
  
  sendInvoice: (id: string) => Promise<Invoice>;
  confirmInvoice: (id: string) => Promise<Invoice>;
  
  addPayment: (id: string, amount: number, date: string) => Promise<Invoice>;
  removePayment: (id: string, paymentId: string) => Promise<Invoice>;
  
  setStatusFilter: (status: string) => void;
}

export const useInvoiceStore = create<InvoiceStore>((set, get) => ({
  invoices: [],
  stats: {
    totalCount: 0,
    totalPaid: 0,
    totalPending: 0,
    overdueCount: 0,
  },
  recentInvoices: [],
  loading: false,
  error: null,
  statusFilter: 'all',
  
  fetchInvoices: async (status) => {
    set({ loading: true, error: null });
    try {
      const params = status && status !== 'all' ? { status } : {};
      const { data } = await axios.get<Invoice[]>(API_BASE, { params });
      set({ invoices: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  fetchStats: async () => {
    try {
      const { data } = await axios.get<DashboardStats>(`${API_BASE}/stats`);
      set({ stats: data });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  },
  
  fetchRecent: async () => {
    try {
      const { data } = await axios.get<Invoice[]>(`${API_BASE}/recent`);
      set({ recentInvoices: data });
    } catch (error) {
      console.error('Failed to fetch recent invoices:', error);
    }
  },
  
  getInvoiceById: (id) => {
    return get().invoices.find(inv => inv.id === id);
  },
  
  createInvoice: async (data) => {
    const { data: newInvoice } = await axios.post<Invoice>(API_BASE, data);
    set((state) => ({
      invoices: [newInvoice, ...state.invoices],
    }));
    return newInvoice;
  },
  
  updateInvoice: async (id, data) => {
    const { data: updated } = await axios.put<Invoice>(`${API_BASE}/${id}`, data);
    set((state) => ({
      invoices: state.invoices.map(inv => inv.id === id ? updated : inv),
    }));
    return updated;
  },
  
  deleteInvoice: async (id) => {
    await axios.delete(`${API_BASE}/${id}`);
    set((state) => ({
      invoices: state.invoices.filter(inv => inv.id !== id),
    }));
  },
  
  sendInvoice: async (id) => {
    const { data: updated } = await axios.post<Invoice>(`${API_BASE}/${id}/send`);
    set((state) => ({
      invoices: state.invoices.map(inv => inv.id === id ? updated : inv),
    }));
    return updated;
  },
  
  confirmInvoice: async (id) => {
    const { data: updated } = await axios.post<Invoice>(`${API_BASE}/${id}/confirm`);
    set((state) => ({
      invoices: state.invoices.map(inv => inv.id === id ? updated : inv),
    }));
    return updated;
  },
  
  addPayment: async (id, amount, date) => {
    const { data: updated } = await axios.post<Invoice>(`${API_BASE}/${id}/payments`, { amount, date });
    set((state) => ({
      invoices: state.invoices.map(inv => inv.id === id ? updated : inv),
    }));
    return updated;
  },
  
  removePayment: async (id, paymentId) => {
    const { data: updated } = await axios.delete<Invoice>(`${API_BASE}/${id}/payments/${paymentId}`);
    set((state) => ({
      invoices: state.invoices.map(inv => inv.id === id ? updated : inv),
    }));
    return updated;
  },
  
  setStatusFilter: (status) => {
    set({ statusFilter: status });
  },
}));

export const calculateSubtotal = (items: InvoiceItem[]): number => {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
};

export const calculateTax = (items: InvoiceItem[], taxRate: number): number => {
  return calculateSubtotal(items) * taxRate;
};

export const calculateTotal = (items: InvoiceItem[], taxRate: number): number => {
  return calculateSubtotal(items) + calculateTax(items, taxRate);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};
