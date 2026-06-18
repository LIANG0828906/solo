export interface DailySale {
  date: string;
  quantity: number;
  revenue: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  price: number;
  stock: number;
  category?: string;
  description?: string;
  coverImage?: string;
  createdAt: string;
  dailySales: DailySale[];
}

export interface SalesData {
  totalRevenue: number;
  totalBooksSold: number;
  dailySales: DailySale[];
  topSellingBooks: {
    bookId: string;
    title: string;
    quantity: number;
    revenue: number;
  }[];
  categorySales: {
    category: string;
    revenue: number;
    quantity: number;
  }[];
}

export type FormErrors = Partial<Record<keyof Book, string>>;
