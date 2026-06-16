import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { AppState, AppAction, OrderStatus, CartItem, Order, MenuItem } from './types';
import { stalls, menuItems as initialMenuItems, initialOrders } from './data';
import MapView from './components/MapView';
import StallDetail from './components/StallDetail';
import OrderTracker from './components/OrderTracker';
import CartBubble from './components/CartBubble';

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  stalls: typeof stalls;
} | null>(null);

const initialState: AppState = {
  cart: [],
  orders: initialOrders,
  menuItems: initialMenuItems
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const existingItem = state.cart.find(item => item.menuItemId === action.payload.menuItemId);
      if (existingItem) {
        return {
          ...state,
          cart: state.cart.map(item =>
            item.menuItemId === action.payload.menuItemId
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          )
        };
      }
      return {
        ...state,
        cart: [...state.cart, action.payload]
      };
    }
    case 'UPDATE_CART_QUANTITY': {
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          cart: state.cart.filter(item => item.menuItemId !== action.payload.menuItemId)
        };
      }
      return {
        ...state,
        cart: state.cart.map(item =>
          item.menuItemId === action.payload.menuItemId
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
      };
    }
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter(item => item.menuItemId !== action.payload)
      };
    case 'CLEAR_CART':
      return {
        ...state,
        cart: []
      };
    case 'PLACE_ORDER':
      return {
        ...state,
        orders: [action.payload, ...state.orders],
        cart: []
      };
    case 'UPDATE_ORDER_STATUS':
      return {
        ...state,
        orders: state.orders.map(order =>
          order.id === action.payload.orderId
            ? { ...order, status: action.payload.status }
            : order
        )
      };
    case 'UPDATE_STOCK':
      return {
        ...state,
        menuItems: state.menuItems.map(item => {
          if (item.id === action.payload.menuItemId) {
            const stock = action.payload.stock;
            let stockStatus: '充足' | '紧张' | '售罄' = '充足';
            if (stock <= 0) stockStatus = '售罄';
            else if (stock < 10) stockStatus = '紧张';
            return { ...item, stock, stockStatus };
          }
          return item;
        })
      };
    default:
      return state;
  }
}

function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderId: '', status: OrderStatus.PREPARING } });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, stalls }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}

function AppRoutes() {
  const navigate = useNavigate();
  const { state, dispatch, stalls } = useApp();

  const handleStallClick = (stallId: string) => {
    navigate(`/stall/${stallId}`);
  };

  const handleAddToCart = (item: CartItem) => {
    dispatch({ type: 'ADD_TO_CART', payload: item });
  };

  const handleUpdateQuantity = (menuItemId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_CART_QUANTITY', payload: { menuItemId, quantity } });
  };

  const handleRemoveFromCart = (menuItemId: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: menuItemId });
  };

  const handlePlaceOrder = (items: CartItem[]) => {
    const stallIds = [...new Set(items.map(item => item.stallId))];
    stallIds.forEach(stallId => {
      const stallItems = items.filter(item => item.stallId === stallId);
      const totalPrice = stallItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const order: Order = {
        id: uuidv4(),
        stallId,
        items: stallItems,
        totalPrice,
        status: OrderStatus.PREPARING,
        createdAt: Date.now()
      };
      dispatch({ type: 'PLACE_ORDER', payload: order });
      stallItems.forEach(item => {
        const menuItem = state.menuItems.find(m => m.id === item.menuItemId);
        if (menuItem) {
          dispatch({
            type: 'UPDATE_STOCK',
            payload: { menuItemId: item.menuItemId, stock: Math.max(0, menuItem.stock - item.quantity) }
          });
        }
      });
    });
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderId, status } });
  };

  const cartItemCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <Routes>
        <Route path="/" element={<MapView stalls={stalls} onStallClick={handleStallClick} />} />
        <Route
          path="/stall/:id"
          element={
            <StallDetail
              stalls={stalls}
              menuItems={state.menuItems}
              onAddToCart={handleAddToCart}
              cart={state.cart}
              orders={state.orders.filter(o => o.status !== OrderStatus.PICKED_UP)}
              onUpdateOrderStatus={handleUpdateOrderStatus}
            />
          }
        />
        <Route
          path="/orders"
          element={
            <OrderTracker
              orders={state.orders}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              stalls={stalls}
            />
          }
        />
      </Routes>
      <CartBubble
        cart={state.cart}
        itemCount={cartItemCount}
        onUpdateQuantity={handleUpdateQuantity}
        onRemove={handleRemoveFromCart}
        onPlaceOrder={handlePlaceOrder}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
