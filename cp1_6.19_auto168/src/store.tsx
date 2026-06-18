import { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';

export type OrderStatus = 'design' | 'making' | 'qc' | 'done';
export type CraftType = '陶瓷' | '木雕' | '编织' | '皮具' | '首饰' | '刺绣' | '玻璃' | '其他';

export interface TimelineNode {
  status: OrderStatus;
  timestamp: string;
}

export interface Order {
  id: string;
  orderNo: string;
  customerName: string;
  craftType: CraftType;
  specialRequirements: string;
  expectedDate: string;
  status: OrderStatus;
  createdAt: string;
  statusTimestamps: Record<OrderStatus, string | null>;
  timeline: TimelineNode[];
}

export type FilterType = 'all' | 'inProgress' | 'done';
export type TabType = 'orders' | 'stats';

interface State {
  orders: Order[];
  selectedOrderId: string | null;
  filter: FilterType;
  activeTab: TabType;
  sidebarCollapsed: boolean;
}

type Action =
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'SELECT_ORDER'; payload: string | null }
  | { type: 'SET_FILTER'; payload: FilterType }
  | { type: 'SET_TAB'; payload: TabType }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'UPDATE_ORDER_STATUS'; payload: { orderId: string; status: OrderStatus; timestamp: string } };

const generateOrderNo = (): string => {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = (now.getMonth() + 1).toString().padStart(2, '0');
  const d = now.getDate().toString().padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CRAFT-${y}${m}${d}-${rand}`;
};

const formatTimestamp = (date: Date): string => {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  const hh = date.getHours().toString().padStart(2, '0');
  const mm = date.getMinutes().toString().padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}`;
};

const initialState: State = {
  orders: [],
  selectedOrderId: null,
  filter: 'all',
  activeTab: 'orders',
  sidebarCollapsed: false,
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'ADD_ORDER':
      return {
        ...state,
        orders: [action.payload, ...state.orders],
        selectedOrderId: action.payload.id,
      };
    case 'SELECT_ORDER':
      return { ...state, selectedOrderId: action.payload };
    case 'SET_FILTER':
      return { ...state, filter: action.payload };
    case 'SET_TAB':
      return { ...state, activeTab: action.payload };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
    case 'UPDATE_ORDER_STATUS': {
      const { orderId, status, timestamp } = action.payload;
      return {
        ...state,
        orders: state.orders.map((order) => {
          if (order.id !== orderId) return order;
          const prevStatus = order.status;
          if (prevStatus === status) return order;
          const newNode: TimelineNode = { status, timestamp };
          return {
            ...order,
            status,
            statusTimestamps: {
              ...order.statusTimestamps,
              [status]: timestamp,
            },
            timeline: [...order.timeline, newNode],
          };
        }),
      };
    }
    default:
      return state;
  }
};

interface StoreContextValue {
  state: State;
  addOrder: (data: Omit<Order, 'id' | 'orderNo' | 'status' | 'createdAt' | 'statusTimestamps' | 'timeline'>) => void;
  selectOrder: (id: string | null) => void;
  setFilter: (filter: FilterType) => void;
  setActiveTab: (tab: TabType) => void;
  toggleSidebar: () => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  getSelectedOrder: () => Order | undefined;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const addOrder = useCallback(
    (data: Omit<Order, 'id' | 'orderNo' | 'status' | 'createdAt' | 'statusTimestamps' | 'timeline'>) => {
      const now = new Date();
      const ts = formatTimestamp(now);
      const order: Order = {
        ...data,
        id: crypto.randomUUID(),
        orderNo: generateOrderNo(),
        status: 'design',
        createdAt: ts,
        statusTimestamps: { design: ts, making: null, qc: null, done: null },
        timeline: [{ status: 'design', timestamp: ts }],
      };
      dispatch({ type: 'ADD_ORDER', payload: order });
    },
    [],
  );

  const selectOrder = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_ORDER', payload: id });
  }, []);

  const setFilter = useCallback((filter: FilterType) => {
    dispatch({ type: 'SET_FILTER', payload: filter });
  }, []);

  const setActiveTab = useCallback((tab: TabType) => {
    dispatch({ type: 'SET_TAB', payload: tab });
  }, []);

  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  }, []);

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    const timestamp = formatTimestamp(new Date());
    dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderId, status, timestamp } });
  }, []);

  const getSelectedOrder = useCallback(() => {
    return state.orders.find((o) => o.id === state.selectedOrderId);
  }, [state.orders, state.selectedOrderId]);

  const value: StoreContextValue = {
    state,
    addOrder,
    selectOrder,
    setFilter,
    setActiveTab,
    toggleSidebar,
    updateOrderStatus,
    getSelectedOrder,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = (): StoreContextValue => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
};

export { formatTimestamp };
