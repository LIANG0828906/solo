export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  stock: number;
  price: number;
  cover: string;
  description: string;
  isBestseller?: boolean;
}

export interface CartItem {
  bookId: string;
  title: string;
  price: number;
  quantity: number;
  cover: string;
}

export interface OrderStats {
  todayOrders: number;
  shippedCount: number;
  lowStockCount: number;
}
