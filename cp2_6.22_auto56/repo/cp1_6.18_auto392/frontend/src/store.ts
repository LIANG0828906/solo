import { create } from 'zustand';
import type { Product, Inquiry, ProductFormData, InquiryFormData } from './types';

interface AppState {
  productList: Product[];
  inquiryList: Inquiry[];
  loading: boolean;
  error: string | null;
  productsFetched: boolean;
  inquiriesFetched: boolean;
  fetchProducts: (force?: boolean) => Promise<void>;
  fetchInquiries: (force?: boolean) => Promise<void>;
  addProduct: (product: ProductFormData) => Promise<void>;
  updateProduct: (id: number, product: ProductFormData) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  submitInquiry: (inquiry: InquiryFormData) => Promise<void>;
  clearError: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  productList: [],
  inquiryList: [],
  loading: false,
  error: null,
  productsFetched: false,
  inquiriesFetched: false,

  fetchProducts: async (force = false) => {
    const { productsFetched, loading } = get();
    if (productsFetched && !force && !loading) return;

    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('获取产品列表失败');
      const data = await response.json();
      set({ productList: data, productsFetched: true });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '未知错误' });
    } finally {
      set({ loading: false });
    }
  },

  fetchInquiries: async (force = false) => {
    const { inquiriesFetched, loading } = get();
    if (inquiriesFetched && !force && !loading) return;

    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/inquiries');
      if (!response.ok) throw new Error('获取询价记录失败');
      const data = await response.json();
      set({ inquiryList: data, inquiriesFetched: true });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '未知错误' });
    } finally {
      set({ loading: false });
    }
  },

  addProduct: async (product: ProductFormData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (!response.ok) throw new Error('新增产品失败');
      const newProduct = await response.json();
      set((state) => ({
        productList: [newProduct, ...state.productList],
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '未知错误' });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  updateProduct: async (id: number, product: ProductFormData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (!response.ok) throw new Error('更新产品失败');
      const updatedProduct = await response.json();
      set((state) => ({
        productList: state.productList.map((p) =>
          p.id === id ? updatedProduct : p
        ),
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '未知错误' });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  deleteProduct: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('删除产品失败');
      set((state) => ({
        productList: state.productList.filter((p) => p.id !== id),
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '未知错误' });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  submitInquiry: async (inquiry: InquiryFormData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inquiry),
      });
      if (!response.ok) throw new Error('提交询价失败');
      const newInquiry = await response.json();
      set((state) => ({
        inquiryList: [newInquiry, ...state.inquiryList],
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '未知错误' });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
