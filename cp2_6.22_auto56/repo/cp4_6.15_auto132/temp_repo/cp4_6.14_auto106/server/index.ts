import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
// restart trigger 2

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

interface ProductDimensions {
  length: number;
  width: number;
  height: number;
}

interface Product {
  id: string;
  name: string;
  category: '陶瓷' | '木雕' | '布艺' | '其他';
  dimensions: ProductDimensions;
  stock: number;
  price: number;
  image: string;
  createdAt: string;
}

interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
}

type OrderStatus = 'pending' | 'processing' | 'completed';

interface Order {
  id: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
}

interface DashboardData {
  todayOrders: number;
  pendingOrders: number;
  lowStockProducts: number;
  monthlySales: number;
  salesTrend: { date: string; amount: number }[];
}

const sampleImages = [
  'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1606722590583-6951b5ea92ad?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1610701596061-2ecf227e85b2?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1528396518501-b53b655eb9b3?w=400&h=300&fit=crop',
];

let products: Product[] = [
  {
    id: uuidv4(),
    name: '青瓷茶盏',
    category: '陶瓷',
    dimensions: { length: 8, width: 8, height: 6 },
    stock: 12,
    price: 168.0,
    image: sampleImages[0],
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: '手工木雕摆件',
    category: '木雕',
    dimensions: { length: 20, width: 10, height: 25 },
    stock: 3,
    price: 328.5,
    image: sampleImages[1],
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: '棉麻手织围巾',
    category: '布艺',
    dimensions: { length: 180, width: 30, height: 1 },
    stock: 8,
    price: 128.0,
    image: sampleImages[2],
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: '手绘陶罐',
    category: '陶瓷',
    dimensions: { length: 15, width: 15, height: 22 },
    stock: 4,
    price: 258.0,
    image: sampleImages[3],
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: '檀木书签套装',
    category: '木雕',
    dimensions: { length: 15, width: 3, height: 1 },
    stock: 20,
    price: 88.0,
    image: sampleImages[4],
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: '刺绣帆布包',
    category: '布艺',
    dimensions: { length: 35, width: 40, height: 10 },
    stock: 2,
    price: 198.0,
    image: sampleImages[5],
    createdAt: new Date().toISOString(),
  },
];

let orders: Order[] = [
  {
    id: uuidv4(),
    customerName: '王小明',
    items: [
      {
        productId: products[0].id,
        productName: products[0].name,
        productImage: products[0].image,
        quantity: 2,
        price: products[0].price,
      },
    ],
    totalAmount: 336.0,
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    customerName: '李雅琴',
    items: [
      {
        productId: products[2].id,
        productName: products[2].name,
        productImage: products[2].image,
        quantity: 1,
        price: products[2].price,
      },
      {
        productId: products[4].id,
        productName: products[4].name,
        productImage: products[4].image,
        quantity: 1,
        price: products[4].price,
      },
    ],
    totalAmount: 216.0,
    status: 'processing',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: uuidv4(),
    customerName: '张伟',
    items: [
      {
        productId: products[1].id,
        productName: products[1].name,
        productImage: products[1].image,
        quantity: 1,
        price: products[1].price,
      },
    ],
    totalAmount: 328.5,
    status: 'completed',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: uuidv4(),
    customerName: '陈思',
    items: [
      {
        productId: products[3].id,
        productName: products[3].name,
        productImage: products[3].image,
        quantity: 1,
        price: products[3].price,
      },
    ],
    totalAmount: 258.0,
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
];

app.get('/api/products', (_req: Request, res: Response) => {
  res.json(products);
});

app.post('/api/products', (req: Request, res: Response) => {
  const { name, category, dimensions, stock, price, image } = req.body;
  const newProduct: Product = {
    id: uuidv4(),
    name,
    category,
    dimensions,
    stock,
    price,
    image,
    createdAt: new Date().toISOString(),
  };
  products.unshift(newProduct);
  res.status(201).json(newProduct);
});

app.put('/api/products/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  products[index] = { ...products[index], ...req.body };
  res.json(products[index]);
});

app.delete('/api/products/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  products = products.filter((p) => p.id !== id);
  res.status(204).send();
});

app.get('/api/orders', (_req: Request, res: Response) => {
  res.json(orders);
});

app.post('/api/orders', (req: Request, res: Response) => {
  const { customerName, items } = req.body;
  const totalAmount = items.reduce(
    (sum: number, item: OrderItem) => sum + item.price * item.quantity,
    0
  );
  const newOrder: Order = {
    id: uuidv4(),
    customerName,
    items,
    totalAmount: Math.round(totalAmount * 100) / 100,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  orders.unshift(newOrder);
  res.status(201).json(newOrder);
});

app.put('/api/orders/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const index = orders.findIndex((o) => o.id === id);
  if (index === -1) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  const oldStatus = orders[index].status;
  const orderItems = orders[index].items;

  if (oldStatus === 'pending' && (status === 'processing' || status === 'completed')) {
    for (const item of orderItems) {
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        product.stock = Math.max(0, product.stock - item.quantity);
      }
    }
  } else if ((oldStatus === 'processing' || oldStatus === 'completed') && status === 'pending') {
    for (const item of orderItems) {
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        product.stock += item.quantity;
      }
    }
  }

  orders[index] = { ...orders[index], status };
  res.json(orders[index]);
});

app.get('/api/dashboard', (_req: Request, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const todayOrders = orders.filter((o) => o.createdAt >= todayISO).length;
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const lowStockProducts = products.filter((p) => p.stock < 5).length;

  const thisMonth = today.getMonth();
  const thisYear = today.getFullYear();
  const monthlySales = orders
    .filter((o) => {
      const d = new Date(o.createdAt);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear && o.status === 'completed';
    })
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const salesTrend: { date: string; amount: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);
    const daySales = orders
      .filter(
        (o) =>
          new Date(o.createdAt) >= d &&
          new Date(o.createdAt) < nextDay &&
          o.status === 'completed'
      )
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const dateStr = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
    salesTrend.push({ date: dateStr, amount: Math.round(daySales * 100) / 100 });
  }

  const data: DashboardData = {
    todayOrders,
    pendingOrders,
    lowStockProducts,
    monthlySales: Math.round(monthlySales * 100) / 100,
    salesTrend,
  };
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
