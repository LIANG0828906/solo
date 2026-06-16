import { v4 as uuidv4 } from 'uuid';
import type { Book, Order, OrderItem, OrderStatus } from '../../shared/types';

class Store {
  books: Book[] = [];
  orders: Order[] = [];

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData(): void {
    const now = new Date().toISOString();

    this.books = [
      {
        id: uuidv4(),
        title: '活着',
        author: '余华',
        isbn: '9787506365437',
        price: 25.0,
        stock: 15,
        coverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        title: '百年孤独',
        author: '加西亚·马尔克斯',
        isbn: '9787544253994',
        price: 39.5,
        stock: 8,
        coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        title: '三体',
        author: '刘慈欣',
        isbn: '9787536692930',
        price: 28.8,
        stock: 20,
        coverUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        title: '平凡的世界',
        author: '路遥',
        isbn: '9787530209554',
        price: 45.0,
        stock: 12,
        coverUrl: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=300',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        title: '围城',
        author: '钱钟书',
        isbn: '9787020024759',
        price: 19.9,
        stock: 6,
        coverUrl: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=300',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        title: '红楼梦',
        author: '曹雪芹',
        isbn: '9787020002207',
        price: 55.0,
        stock: 4,
        coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ];

    const orderDate1 = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const orderDate2 = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
    const orderDate3 = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

    this.orders = [
      {
        id: uuidv4(),
        items: [
          { bookId: this.books[0].id, title: this.books[0].title, price: this.books[0].price, quantity: 2 },
          { bookId: this.books[2].id, title: this.books[2].title, price: this.books[2].price, quantity: 1 },
        ],
        totalAmount: 25.0 * 2 + 28.8,
        customerName: '张三',
        customerPhone: '13800138001',
        customerAddress: '北京市朝阳区某街道123号',
        status: 'completed',
        createdAt: orderDate1,
        updatedAt: orderDate1,
      },
      {
        id: uuidv4(),
        items: [
          { bookId: this.books[1].id, title: this.books[1].title, price: this.books[1].price, quantity: 1 },
        ],
        totalAmount: 39.5,
        customerName: '李四',
        customerPhone: '13900139002',
        customerAddress: '上海市浦东新区某路456号',
        status: 'shipped',
        createdAt: orderDate2,
        updatedAt: orderDate2,
      },
      {
        id: uuidv4(),
        items: [
          { bookId: this.books[3].id, title: this.books[3].title, price: this.books[3].price, quantity: 1 },
          { bookId: this.books[4].id, title: this.books[4].title, price: this.books[4].price, quantity: 2 },
        ],
        totalAmount: 45.0 + 19.9 * 2,
        customerName: '王五',
        customerPhone: '13700137003',
        customerAddress: '广州市天河区某大道789号',
        status: 'pending',
        createdAt: orderDate3,
        updatedAt: orderDate3,
      },
      {
        id: uuidv4(),
        items: [
          { bookId: this.books[5].id, title: this.books[5].title, price: this.books[5].price, quantity: 1 },
        ],
        totalAmount: 55.0,
        customerName: '赵六',
        customerPhone: '13600136004',
        customerAddress: '深圳市南山区某科技园',
        status: 'confirmed',
        createdAt: now,
        updatedAt: now,
      },
    ];
  }

  addBook(book: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>): Book {
    const now = new Date().toISOString();
    const newBook: Book = {
      ...book,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    this.books.push(newBook);
    return newBook;
  }

  getBooks(): Book[] {
    return this.books;
  }

  getBookById(id: string): Book | undefined {
    return this.books.find((b) => b.id === id);
  }

  updateBook(id: string, updates: Partial<Book>): Book | undefined {
    const index = this.books.findIndex((b) => b.id === id);
    if (index === -1) return undefined;
    this.books[index] = {
      ...this.books[index],
      ...updates,
      id: this.books[index].id,
      createdAt: this.books[index].createdAt,
      updatedAt: new Date().toISOString(),
    };
    return this.books[index];
  }

  deleteBook(id: string): boolean {
    const index = this.books.findIndex((b) => b.id === id);
    if (index === -1) return false;
    this.books.splice(index, 1);
    return true;
  }

  addOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Order {
    const now = new Date().toISOString();
    const newOrder: Order = {
      ...order,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    this.orders.push(newOrder);
    return newOrder;
  }

  getOrders(page?: number, limit?: number): { orders: Order[]; total: number; page: number; limit: number } {
    const sortedOrders = [...this.orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const total = sortedOrders.length;

    if (page === undefined || limit === undefined) {
      return { orders: sortedOrders, total, page: 1, limit: total };
    }

    const start = (page - 1) * limit;
    const paginatedOrders = sortedOrders.slice(start, start + limit);
    return { orders: paginatedOrders, total, page, limit };
  }

  getOrderById(id: string): Order | undefined {
    return this.orders.find((o) => o.id === id);
  }

  updateOrder(id: string, updates: Partial<Order>): Order | undefined {
    const index = this.orders.findIndex((o) => o.id === id);
    if (index === -1) return undefined;
    this.orders[index] = {
      ...this.orders[index],
      ...updates,
      id: this.orders[index].id,
      createdAt: this.orders[index].createdAt,
      updatedAt: new Date().toISOString(),
    };
    return this.orders[index];
  }

  confirmOrder(orderId: string): { success: boolean; order?: Order; error?: string } {
    const order = this.getOrderById(orderId);
    if (!order) {
      return { success: false, error: '订单不存在' };
    }
    if (order.status !== 'pending') {
      return { success: false, error: '只有待处理订单可以确认' };
    }

    for (const item of order.items) {
      const book = this.getBookById(item.bookId);
      if (!book) {
        return { success: false, error: `图书 ${item.title} 不存在` };
      }
      if (book.stock < item.quantity) {
        return { success: false, error: `图书 ${item.title} 库存不足，当前库存：${book.stock}` };
      }
    }

    for (const item of order.items) {
      const book = this.getBookById(item.bookId);
      if (book) {
        this.updateBook(item.bookId, { stock: book.stock - item.quantity });
      }
    }

    const updatedOrder = this.updateOrder(orderId, { status: 'confirmed' });
    return { success: true, order: updatedOrder };
  }
}

export const store = new Store();
