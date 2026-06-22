import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import axios from 'axios';

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled';

export interface Order {
  id: string;
  orderNo: string;
  customerName: string;
  phone: string;
  estimatedArrival: string;
  notes: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  estimatedWaitMinutes: number;
  createdAt: string;
  confirmedAt?: string;
}

export interface StatsData {
  totalOrders: number;
  totalRevenue: number;
  lineChartData: { time: string; orders: number }[];
  barChartData: { name: string; count: number; revenue: number; fill: string }[];
}

interface OrderState {
  orders: Order[];
  stats: StatsData | null;
  loading: boolean;
  error: string | null;
  newOrderIds: string[];
}

type OrderAction =
  | { type: 'SET_ORDERS'; payload: Order[] }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER'; payload: Order }
  | { type: 'SET_STATS'; payload: StatsData }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'MARK_ORDER_SEEN'; payload: string }
  | { type: 'SET_NEW_ORDERS'; payload: string[] };

const initialState: OrderState = {
  orders: [],
  stats: null,
  loading: false,
  error: null,
  newOrderIds: [],
};

function orderReducer(state: OrderState, action: OrderAction): OrderState {
  switch (action.type) {
    case 'SET_ORDERS':
      return { ...state, orders: action.payload, loading: false, error: null };
    case 'ADD_ORDER':
      return {
        ...state,
        orders: [action.payload, ...state.orders],
        newOrderIds: state.newOrderIds.includes(action.payload.id)
          ? state.newOrderIds
          : [...state.newOrderIds, action.payload.id],
      };
    case 'UPDATE_ORDER':
      return {
        ...state,
        orders: state.orders.map((order) =>
          order.id === action.payload.id ? action.payload : order
        ),
      };
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'MARK_ORDER_SEEN':
      return {
        ...state,
        newOrderIds: state.newOrderIds.filter((id) => id !== action.payload),
      };
    case 'SET_NEW_ORDERS':
      return { ...state, newOrderIds: action.payload };
    default:
      return state;
  }
}

interface OrderContextType {
  state: OrderState;
  fetchOrders: () => Promise<void>;
  createOrder: (data: {
    customerName: string;
    phone: string;
    estimatedArrival: string;
    notes?: string;
    items: OrderItem[];
  }) => Promise<Order>;
  confirmOrder: (id: string, confirmedArrival?: string) => Promise<void>;
  rejectOrder: (id: string) => Promise<void>;
  cancelOrder: (id: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  markOrderSeen: (id: string) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(orderReducer, initialState);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await axios.get('/api/orders');
      const prevIds = new Set(state.orders.map((o) => o.id));
      const newIds: string[] = [];
      response.data.forEach((order: Order) => {
        if (!prevIds.has(order.id) && order.status === 'pending') {
          newIds.push(order.id);
        }
      });
      dispatch({ type: 'SET_ORDERS', payload: response.data });
      if (newIds.length > 0) {
        dispatch({ type: 'SET_NEW_ORDERS', payload: [...state.newOrderIds, ...newIds] });
      }
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', payload: err.message || '加载订单失败' });
    }
  }, [state.orders, state.newOrderIds]);

  const createOrder = async (data: {
    customerName: string;
    phone: string;
    estimatedArrival: string;
    notes?: string;
    items: OrderItem[];
  }) => {
    try {
      const response = await axios.post('/api/orders', data);
      dispatch({ type: 'ADD_ORDER', payload: response.data });
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || '创建订单失败');
    }
  };

  const confirmOrder = async (id: string, confirmedArrival?: string) => {
    try {
      const response = await axios.put(`/api/orders/${id}/confirm`, { confirmedArrival });
      dispatch({ type: 'UPDATE_ORDER', payload: response.data });
      dispatch({ type: 'MARK_ORDER_SEEN', payload: id });
    } catch (err: any) {
      throw new Error(err.response?.data?.error || '确认订单失败');
    }
  };

  const rejectOrder = async (id: string) => {
    try {
      const response = await axios.put(`/api/orders/${id}/reject`);
      dispatch({ type: 'UPDATE_ORDER', payload: response.data });
      dispatch({ type: 'MARK_ORDER_SEEN', payload: id });
    } catch (err: any) {
      throw new Error(err.response?.data?.error || '拒绝订单失败');
    }
  };

  const cancelOrder = async (id: string) => {
    try {
      const response = await axios.put(`/api/orders/${id}/cancel`);
      dispatch({ type: 'UPDATE_ORDER', payload: response.data });
    } catch (err: any) {
      throw new Error(err.response?.data?.error || '取消订单失败');
    }
  };

  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get('/api/orders/stats');
      dispatch({ type: 'SET_STATS', payload: response.data });
    } catch (err: any) {
      console.error('Failed to fetch stats:', err.message);
    }
  }, []);

  const markOrderSeen = (id: string) => {
    dispatch({ type: 'MARK_ORDER_SEEN', payload: id });
  };

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, []);

  return (
    <OrderContext.Provider
      value={{
        state,
        fetchOrders,
        createOrder,
        confirmOrder,
        rejectOrder,
        cancelOrder,
        fetchStats,
        markOrderSeen,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
}
