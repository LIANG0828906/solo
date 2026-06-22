export interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  price: number;
  stock: number;
  coverUrl: string;
  description: string;
  category: string;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface CartItem {
  bookId: string;
  book: Book;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  status: 'pending' | 'paid' | 'shipping' | 'delivered';
  shippingAddress: {
    name: string;
    phone: string;
    address: string;
  };
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

export interface Borrow {
  id: string;
  userId: string;
  bookId: string;
  book: Book;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'borrowed' | 'returned' | 'overdue';
  lateFee: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface StatsData {
  totalBooks: number;
  totalUsers: number;
  monthlySales: number;
  salesTrend: { date: string; sales: number }[];
  categoryDistribution: { name: string; value: number; percentage: string }[];
}

export interface FilterOptions {
  category: string;
  priceRange: [number, number];
  stockStatus: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
}
