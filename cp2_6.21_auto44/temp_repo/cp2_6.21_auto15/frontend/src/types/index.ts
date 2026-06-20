export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  image_url: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: number;
  user: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
  address: string;
}

export interface DeliveryOrder {
  id: number;
  order_ids: number[];
  addresses: string[];
  optimized_route: string[];
  created_at: string;
}

export interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'warning';
}

export interface StoreState {
  cart: CartItem[];
  orders: Order[];
  products: Product[];
  deliveryOrders: DeliveryOrder[];
  selectedCategory: string;
  isCartOpen: boolean;
  toast: ToastState;
  isLoggedIn: boolean;
}

export interface StoreActions {
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'warning') => void;
  toggleCart: () => void;
  setCategory: (category: string) => void;
  setLoggedIn: (value: boolean) => void;
  loadProducts: (products: Product[]) => void;
  loadOrders: (orders: Order[]) => void;
  loadDeliveryOrders: (deliveryOrders: DeliveryOrder[]) => void;
}

export type Store = StoreState & StoreActions;
