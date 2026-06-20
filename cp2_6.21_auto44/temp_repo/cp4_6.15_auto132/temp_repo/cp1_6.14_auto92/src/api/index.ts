import axios from 'axios';
import type { Customer, Receipt, DashboardStats, ReceiptStatus, PaymentInfo } from '../../shared/types';

const api = axios.create({
  baseURL: '/api',
});

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export const customerApi = {
  searchCustomers: async (search?: string): Promise<Customer[]> => {
    const params = search ? { search } : {};
    const res = await api.get<ApiResponse<Customer[]>>('/customers', { params });
    return res.data.data;
  },

  getCustomerById: async (id: string): Promise<Customer> => {
    const res = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
    return res.data.data;
  },

  createCustomer: async (data: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> => {
    const res = await api.post<ApiResponse<Customer>>('/customers', data);
    return res.data.data;
  },

  updateCustomer: async (id: string, data: Partial<Omit<Customer, 'id' | 'createdAt'>>): Promise<Customer> => {
    const res = await api.put<ApiResponse<Customer>>(`/customers/${id}`, data);
    return res.data.data;
  },

  deleteCustomer: async (id: string): Promise<void> => {
    await api.delete(`/customers/${id}`);
  },
};

export const receiptApi = {
  getReceipts: async (params?: {
    customerId?: string;
    status?: ReceiptStatus;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ data: Receipt[]; total: number; page: number; pageSize: number; totalPages: number }> => {
    const res = await api.get<ApiResponse<{ data: Receipt[]; total: number; page: number; pageSize: number; totalPages: number }>>('/receipts', { params });
    return res.data.data;
  },

  getReceiptById: async (id: string): Promise<Receipt> => {
    const res = await api.get<ApiResponse<Receipt>>(`/receipts/${id}`);
    return res.data.data;
  },

  createReceipt: async (data: Omit<Receipt, 'id' | 'receiptNo' | 'createdAt' | 'status'>): Promise<Receipt> => {
    const res = await api.post<ApiResponse<Receipt>>('/receipts', data);
    return res.data.data;
  },

  updateReceipt: async (id: string, data: Partial<Omit<Receipt, 'id' | 'receiptNo' | 'createdAt'>>): Promise<Receipt> => {
    const res = await api.put<ApiResponse<Receipt>>(`/receipts/${id}`, data);
    return res.data.data;
  },

  updateStatus: async (id: string, status: ReceiptStatus, paymentInfo?: PaymentInfo): Promise<Receipt> => {
    const res = await api.patch<ApiResponse<Receipt>>(`/receipts/${id}/status`, { status, paymentInfo });
    return res.data.data;
  },

  deleteReceipt: async (id: string): Promise<void> => {
    await api.delete(`/receipts/${id}`);
  },
};

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const res = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
    return res.data.data;
  },
};

export const statementApi = {
  getStatement: async (customerId: string, startDate: string, endDate: string) => {
    const res = await api.get(`/statements/${customerId}`, { params: { startDate, endDate } });
    return res.data.data;
  },
  generateStatement: async (customerId: string, startDate: string, endDate: string) => {
    const res = await api.post('/statements', { customerId, startDate, endDate });
    return res.data.data;
  },
};
