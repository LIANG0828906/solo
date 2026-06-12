import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  Product,
  Order,
  OrderStatus,
  Inventory,
  Tool,
  OrderItem,
} from '../types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持JPG和PNG格式'));
    }
  },
});

const dbDir = path.join(__dirname, '../..');
const db = new Database(path.join(dbDir, 'data.db'));
db.pragma('journal_mode = WAL');

const initDb = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      basePrice REAL NOT NULL,
      thumbnail TEXT,
      images TEXT,
      leatherTypes TEXT,
      areaRangeMin REAL NOT NULL,
      areaRangeMax REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      leatherType TEXT NOT NULL,
      color TEXT NOT NULL,
      colorCode TEXT,
      thickness REAL NOT NULL,
      availableArea REAL NOT NULL,
      grade TEXT NOT NULL,
      source TEXT,
      purchaseDate TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT '可用'
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orderNo TEXT NOT NULL UNIQUE,
      customerName TEXT NOT NULL,
      customerPhone TEXT NOT NULL,
      items TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT '待确认',
      statusHistory TEXT NOT NULL,
      estimatedHours INTEGER,
      totalPrice REAL NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT '空闲',
      currentBorrower TEXT,
      borrowDate TEXT,
      expectedReturnDate TEXT,
      actualReturnDate TEXT
    );

    CREATE TABLE IF NOT EXISTS tool_borrow_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      toolId INTEGER NOT NULL,
      toolName TEXT NOT NULL,
      borrower TEXT NOT NULL,
      borrowDate TEXT NOT NULL,
      expectedReturnDate TEXT NOT NULL,
      actualReturnDate TEXT
    );
  `);

  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  if (productCount.count === 0) {
    const insertProduct = db.prepare(`
      INSERT INTO products (name, type, description, basePrice, thumbnail, images, leatherTypes, areaRangeMin, areaRangeMax)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const products = [
      {
        name: '经典短款钱包',
        type: '钱包',
        description: '采用传统植鞣革工艺，手感温润，越用越有味道。多卡位设计，满足日常所需。',
        basePrice: 380,
        thumbnail: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=300&fit=crop',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&h=450&fit=crop',
          'https://images.unsplash.com/photo-1625050252780-7025157c4bf3?w=600&h=450&fit=crop',
        ]),
        leatherTypes: JSON.stringify(['植鞣革', '铬鞣革', '马臀革', '疯马皮']),
        areaRangeMin: 1.5,
        areaRangeMax: 2.0,
      },
      {
        name: '商务手提包',
        type: '手提包',
        description: '简约大气的商务款式，可容纳14寸笔记本电脑。优质五金配件，彰显品味。',
        basePrice: 1280,
        thumbnail: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=300&fit=crop',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=450&fit=crop',
          'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=450&fit=crop',
        ]),
        leatherTypes: JSON.stringify(['植鞣革', '铬鞣革', '疯马皮']),
        areaRangeMin: 6.0,
        areaRangeMax: 10.0,
      },
      {
        name: '复古双肩背包',
        type: '背包',
        description: '复古风格双肩包，大容量设计，适合短途出行。加厚肩带，背负舒适。',
        basePrice: 1680,
        thumbnail: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=450&fit=crop',
          'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&h=450&fit=crop',
        ]),
        leatherTypes: JSON.stringify(['植鞣革', '疯马皮']),
        areaRangeMin: 12.0,
        areaRangeMax: 18.0,
      },
      {
        name: '手工真皮腰带',
        type: '腰带',
        description: '整张牛皮切割，无拼接，结实耐用。复古黄铜扣头，彰显个性。',
        basePrice: 280,
        thumbnail: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=400&h=300&fit=crop',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=600&h=450&fit=crop',
          'https://images.unsplash.com/photo-1590156206657-3e22ad401afc?w=600&h=450&fit=crop',
        ]),
        leatherTypes: JSON.stringify(['植鞣革', '铬鞣革', '疯马皮']),
        areaRangeMin: 0.8,
        areaRangeMax: 1.2,
      },
    ];

    products.forEach((p) => {
      insertProduct.run(
        p.name,
        p.type,
        p.description,
        p.basePrice,
        p.thumbnail,
        p.images,
        p.leatherTypes,
        p.areaRangeMin,
        p.areaRangeMax
      );
    });

    const insertInventory = db.prepare(`
      INSERT INTO inventory (leatherType, color, colorCode, thickness, availableArea, grade, source, purchaseDate, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const inventoryItems = [
      { leatherType: '植鞣革', color: '深棕色', colorCode: '#8B5E3C', thickness: 2.0, availableArea: 25.5, grade: 'A', source: '意大利进口', purchaseDate: '2026-05-15', status: '可用' },
      { leatherType: '植鞣革', color: '浅棕色', colorCode: '#D4A574', thickness: 1.5, availableArea: 18.0, grade: 'A', source: '意大利进口', purchaseDate: '2026-05-15', status: '可用' },
      { leatherType: '植鞣革', color: '黑色', colorCode: '#2C2C2C', thickness: 2.5, availableArea: 12.5, grade: 'B', source: '美国进口', purchaseDate: '2026-05-10', status: '可用' },
      { leatherType: '铬鞣革', color: '酒红色', colorCode: '#8B0000', thickness: 1.0, availableArea: 30.0, grade: 'A', source: '法国进口', purchaseDate: '2026-05-20', status: '可用' },
      { leatherType: '马臀革', color: '深棕色', colorCode: '#6B4423', thickness: 1.5, availableArea: 8.0, grade: 'A', source: '日本进口', purchaseDate: '2026-04-28', status: '可用' },
      { leatherType: '疯马皮', color: '复古棕', colorCode: '#A0522D', thickness: 3.0, availableArea: 22.0, grade: 'B', source: '国产头层', purchaseDate: '2026-05-08', status: '可用' },
      { leatherType: '疯马皮', color: '炭灰色', colorCode: '#4A4A4A', thickness: 2.0, availableArea: 3.5, grade: 'A', source: '国产头层', purchaseDate: '2026-05-05', status: '可用' },
      { leatherType: '植鞣革', color: '原色', colorCode: '#C4A484', thickness: 2.0, availableArea: 0, grade: 'A', source: '意大利进口', purchaseDate: '2026-04-15', status: '已用尽' },
    ];

    inventoryItems.forEach((item) => {
      insertInventory.run(
        item.leatherType,
        item.color,
        item.colorCode,
        item.thickness,
        item.availableArea,
        item.grade,
        item.source,
        item.purchaseDate,
        item.status
      );
    });

    const insertTool = db.prepare(`
      INSERT INTO tools (name, status, currentBorrower, borrowDate, expectedReturnDate, actualReturnDate)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const tools = [
      { name: '削边器 #1', status: '空闲' as const },
      { name: '削边器 #2', status: '空闲' as const },
      { name: '法斩 3mm', status: '空闲' as const },
      { name: '法斩 4mm', status: '借用中' as const, currentBorrower: '张师傅', borrowDate: '2026-06-10', expectedReturnDate: '2026-06-15' },
      { name: '菱斩 3mm', status: '空闲' as const },
      { name: '菱斩 4mm', status: '空闲' as const },
      { name: '冲子 1mm', status: '空闲' as const },
      { name: '冲子 2mm', status: '维修中' as const },
      { name: '边线器', status: '空闲' as const },
      { name: '间距规', status: '空闲' as const },
      { name: '锤子 木柄', status: '空闲' as const },
      { name: '剪刀 专业款', status: '借用中' as const, currentBorrower: '李师傅', borrowDate: '2026-06-11', expectedReturnDate: '2026-06-13' },
    ];

    tools.forEach((tool) => {
      insertTool.run(
        tool.name,
        tool.status,
        tool.currentBorrower || null,
        tool.borrowDate || null,
        tool.expectedReturnDate || null,
        null
      );
    });

    const insertOrder = db.prepare(`
      INSERT INTO orders (orderNo, customerName, customerPhone, items, status, statusHistory, estimatedHours, totalPrice, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date();
    const sampleOrders = [
      {
        orderNo: 'LC20260610001',
        customerName: '王先生',
        customerPhone: '13800138001',
        items: JSON.stringify([{
          productId: 1,
          productName: '经典短款钱包',
          leatherType: '植鞣革',
          thickness: 2.0,
          hardware: '黄铜',
          estimatedArea: [1.5, 2.0],
          price: 380,
          sketchImages: [],
        }]),
        status: '手工缝制',
        statusHistory: JSON.stringify([
          { status: '待确认', timestamp: new Date(now.getTime() - 5 * 86400000).toISOString() },
          { status: '已确认', timestamp: new Date(now.getTime() - 4.5 * 86400000).toISOString(), note: '预计12小时' },
          { status: '皮料裁切', timestamp: new Date(now.getTime() - 4 * 86400000).toISOString() },
          { status: '手工缝制', timestamp: new Date(now.getTime() - 2 * 86400000).toISOString() },
        ]),
        estimatedHours: 12,
        totalPrice: 380,
        createdAt: new Date(now.getTime() - 5 * 86400000).toISOString(),
        updatedAt: new Date(now.getTime() - 2 * 86400000).toISOString(),
      },
      {
        orderNo: 'LC20260611002',
        customerName: '李女士',
        customerPhone: '13900139002',
        items: JSON.stringify([{
          productId: 2,
          productName: '商务手提包',
          leatherType: '疯马皮',
          thickness: 2.5,
          hardware: '古铜',
          estimatedArea: [6.5, 10.8],
          price: 1680,
          sketchImages: [],
        }]),
        status: '皮料裁切',
        statusHistory: JSON.stringify([
          { status: '待确认', timestamp: new Date(now.getTime() - 3 * 86400000).toISOString() },
          { status: '已确认', timestamp: new Date(now.getTime() - 2.5 * 86400000).toISOString(), note: '预计20小时' },
          { status: '皮料裁切', timestamp: new Date(now.getTime() - 1 * 86400000).toISOString() },
        ]),
        estimatedHours: 20,
        totalPrice: 1680,
        createdAt: new Date(now.getTime() - 3 * 86400000).toISOString(),
        updatedAt: new Date(now.getTime() - 1 * 86400000).toISOString(),
      },
      {
        orderNo: 'LC20260612003',
        customerName: '张先生',
        customerPhone: '13700137003',
        items: JSON.stringify([{
          productId: 4,
          productName: '手工真皮腰带',
          leatherType: '植鞣革',
          thickness: 3.0,
          hardware: '黄铜',
          estimatedArea: [0.9, 1.3],
          price: 340,
          sketchImages: [],
        }]),
        status: '待确认',
        statusHistory: JSON.stringify([
          { status: '待确认', timestamp: new Date(now.getTime() - 0.5 * 86400000).toISOString() },
        ]),
        totalPrice: 340,
        createdAt: new Date(now.getTime() - 0.5 * 86400000).toISOString(),
        updatedAt: new Date(now.getTime() - 0.5 * 86400000).toISOString(),
      },
    ];

    sampleOrders.forEach((order) => {
      insertOrder.run(
        order.orderNo,
        order.customerName,
        order.customerPhone,
        order.items,
        order.status,
        order.statusHistory,
        order.estimatedHours || null,
        order.totalPrice,
        order.createdAt,
        order.updatedAt
      );
    });

    console.log('示例数据已插入');
  }
};

initDb();

app.get('/api/products', (_req, res) => {
  const rows = db.prepare('SELECT * FROM products').all() as any[];
  const products: Product[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    description: row.description,
    basePrice: row.basePrice,
    thumbnail: row.thumbnail,
    images: JSON.parse(row.images),
    leatherTypes: JSON.parse(row.leatherTypes),
    areaRange: [row.areaRangeMin, row.areaRangeMax] as [number, number],
  }));
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id) as any;
  if (!row) {
    return res.status(404).json({ message: '产品不存在' });
  }
  const product: Product = {
    id: row.id,
    name: row.name,
    type: row.type,
    description: row.description,
    basePrice: row.basePrice,
    thumbnail: row.thumbnail,
    images: JSON.parse(row.images),
    leatherTypes: JSON.parse(row.leatherTypes),
    areaRange: [row.areaRangeMin, row.areaRangeMax] as [number, number],
  };
  res.json(product);
});

app.get('/api/inventory', (_req, res) => {
  const rows = db.prepare('SELECT * FROM inventory ORDER BY purchaseDate DESC').all() as Inventory[];
  res.json(rows);
});

app.post('/api/inventory', (req, res) => {
  const { leatherType, color, colorCode, thickness, availableArea, grade, source, purchaseDate, status } = req.body;
  const info = db.prepare(`
    INSERT INTO inventory (leatherType, color, colorCode, thickness, availableArea, grade, source, purchaseDate, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(leatherType, color, colorCode || null, thickness, availableArea, grade, source, purchaseDate, status);
  res.json({ id: info.lastInsertRowid });
});

app.put('/api/inventory/:id', (req, res) => {
  const { availableArea, status } = req.body;
  db.prepare('UPDATE inventory SET availableArea = ?, status = ? WHERE id = ?').run(availableArea, status, req.params.id);
  res.json({ success: true });
});

app.get('/api/orders', (_req, res) => {
  const rows = db.prepare('SELECT * FROM orders ORDER BY createdAt DESC').all() as any[];
  const orders: Order[] = rows.map((row) => ({
    id: row.id,
    orderNo: row.orderNo,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    items: JSON.parse(row.items),
    status: row.status,
    statusHistory: JSON.parse(row.statusHistory),
    estimatedHours: row.estimatedHours,
    totalPrice: row.totalPrice,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
  res.json(orders);
});

const generateOrderNo = () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const count = db.prepare('SELECT COUNT(*) as count FROM orders WHERE orderNo LIKE ?').get(`LC${dateStr}%`) as { count: number };
  return `LC${dateStr}${String(count.count + 1).padStart(3, '0')}`;
};

const checkInventory = (items: OrderItem[]): { sufficient: boolean; message: string } => {
  for (const item of items) {
    const requiredArea = item.estimatedArea[1];
    const available = db.prepare(`
      SELECT SUM(availableArea) as total 
      FROM inventory 
      WHERE leatherType = ? AND thickness = ? AND status = '可用'
    `).get(item.leatherType, item.thickness) as { total: number | null };

    if (!available.total || available.total < requiredArea) {
      return {
        sufficient: false,
        message: `${item.leatherType} ${item.thickness}mm 皮料库存不足，需要 ${requiredArea} dm²，仅存 ${available.total || 0} dm²，请及时补货`,
      };
    }
  }
  return { sufficient: true, message: '' };
};

const deductInventory = (items: OrderItem[]) => {
  const updateStmt = db.prepare(`
    UPDATE inventory 
    SET availableArea = availableArea - ?, 
        status = CASE WHEN availableArea - ? <= 0 THEN '已用尽' ELSE status END
    WHERE id = (
      SELECT id FROM inventory 
      WHERE leatherType = ? AND thickness = ? AND status = '可用' AND availableArea >= ?
      ORDER BY purchaseDate ASC 
      LIMIT 1
    )
  `);

  for (const item of items) {
    const areaToDeduct = item.estimatedArea[1];
    let remaining = areaToDeduct;

    while (remaining > 0) {
      const target = db.prepare(`
        SELECT id, availableArea FROM inventory 
        WHERE leatherType = ? AND thickness = ? AND status = '可用' AND availableArea > 0
        ORDER BY purchaseDate ASC 
        LIMIT 1
      `).get(item.leatherType, item.thickness) as { id: number; availableArea: number } | undefined;

      if (!target) break;

      const deduct = Math.min(remaining, target.availableArea);
      updateStmt.run(deduct, deduct, item.leatherType, item.thickness, deduct);
      remaining -= deduct;
    }
  }
};

app.post('/api/orders', (req, res) => {
  const { customerName, customerPhone, items } = req.body;

  const inventoryCheck = checkInventory(items);
  if (!inventoryCheck.sufficient) {
    return res.status(400).json({ message: inventoryCheck.message });
  }

  const orderNo = generateOrderNo();
  const totalPrice = items.reduce((sum: number, item: OrderItem) => sum + item.price, 0);
  const now = new Date().toISOString();
  const statusHistory = [{ status: '待确认', timestamp: now }];

  const info = db.prepare(`
    INSERT INTO orders (orderNo, customerName, customerPhone, items, status, statusHistory, totalPrice, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    orderNo,
    customerName,
    customerPhone,
    JSON.stringify(items),
    '待确认',
    JSON.stringify(statusHistory),
    totalPrice,
    now,
    now
  );

  deductInventory(items);

  res.json({ orderNo, id: info.lastInsertRowid });
});

app.put('/api/orders/:id', (req, res) => {
  const { status, estimatedHours } = req.body;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as any;
  if (!order) {
    return res.status(404).json({ message: '订单不存在' });
  }

  const history = JSON.parse(order.statusHistory);
  history.push({
    status,
    timestamp: new Date().toISOString(),
    ...(status === '已确认' && estimatedHours ? { note: `预计${estimatedHours}小时` } : {}),
  });

  const updateData: any = {
    status,
    statusHistory: JSON.stringify(history),
    updatedAt: new Date().toISOString(),
  };
  if (estimatedHours) {
    updateData.estimatedHours = estimatedHours;
  }

  db.prepare(
    `UPDATE orders SET ${Object.keys(updateData).map((k) => `${k} = ?`).join(', ')} WHERE id = ?`
  ).run(...Object.values(updateData), req.params.id);

  res.json({ success: true });
});

app.get('/api/tools', (_req, res) => {
  const tools = db.prepare('SELECT * FROM tools ORDER BY id').all() as Tool[];
  res.json(tools);
});

app.post('/api/tools/:id/borrow', (req, res) => {
  const { borrower, expectedReturnDate } = req.body;
  const tool = db.prepare('SELECT * FROM tools WHERE id = ?').get(req.params.id) as Tool | undefined;
  if (!tool) {
    return res.status(404).json({ message: '工具不存在' });
  }
  if (tool.status !== '空闲') {
    return res.status(400).json({ message: '该工具当前不可借用' });
  }

  const borrowDate = new Date().toISOString();
  db.prepare(`
    UPDATE tools 
    SET status = '借用中', currentBorrower = ?, borrowDate = ?, expectedReturnDate = ?
    WHERE id = ?
  `).run(borrower, borrowDate, expectedReturnDate, req.params.id);

  db.prepare(`
    INSERT INTO tool_borrow_records (toolId, toolName, borrower, borrowDate, expectedReturnDate)
    VALUES (?, ?, ?, ?, ?)
  `).run(tool.id, tool.name, borrower, borrowDate, expectedReturnDate);

  res.json({ success: true });
});

app.post('/api/tools/:id/return', (req, res) => {
  const tool = db.prepare('SELECT * FROM tools WHERE id = ?').get(req.params.id) as Tool | undefined;
  if (!tool) {
    return res.status(404).json({ message: '工具不存在' });
  }
  if (tool.status !== '借用中') {
    return res.status(400).json({ message: '该工具未被借用' });
  }

  const returnDate = new Date().toISOString();
  db.prepare(`
    UPDATE tools 
    SET status = '空闲', currentBorrower = NULL, borrowDate = NULL, expectedReturnDate = NULL, actualReturnDate = ?
    WHERE id = ?
  `).run(returnDate, req.params.id);

  db.prepare(`
    UPDATE tool_borrow_records 
    SET actualReturnDate = ? 
    WHERE toolId = ? AND actualReturnDate IS NULL
    ORDER BY id DESC LIMIT 1
  `).run(returnDate, req.params.id);

  res.json({ success: true });
});

app.post('/api/upload', upload.array('sketches', 3), (req, res) => {
  const files = req.files as Express.Multer.File[];
  const urls = files.map((file) => `/uploads/${file.filename}`);
  res.json({ urls });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
