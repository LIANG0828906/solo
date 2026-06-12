import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { initDatabase, getDb, Booth, Product, User, Message } from './database';
import { initSocket } from './socket';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

initDatabase();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
  },
});

initSocket(io);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  
  if (existing) {
    return res.status(400).json({ error: '用户名已存在' });
  }

  const userId = uuidv4();
  const now = Date.now();
  
  db.prepare('INSERT INTO users (id, username, password, created_at) VALUES (?, ?, ?, ?)')
    .run(userId, username, password, now);

  const boothId = uuidv4();
  db.prepare(`
    INSERT INTO booths (id, user_id, name, description, bg_color, primary_color, accent_color, visit_count, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
  `).run(boothId, userId, `${username}的展位`, '欢迎来到我的展位！✨', '#FFF8F0', '#C0874E', '#FF6B6B', now);

  const user = { id: userId, username };
  const booth = { id: boothId, name: `${username}的展位` };
  
  res.json({ user, booth });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;
  
  if (!user || user.password !== password) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const booth = db.prepare('SELECT * FROM booths WHERE user_id = ?').get(user.id) as Booth | undefined;
  
  res.json({ 
    user: { id: user.id, username: user.username }, 
    booth: booth ? { id: booth.id, name: booth.name } : null 
  });
});

app.get('/api/booths/ranking', (_req, res) => {
  const db = getDb();
  
  const booths = db.prepare(`
    SELECT b.*, 
           COALESCE(SUM(p.favorite_count), 0) as total_favorites
    FROM booths b
    LEFT JOIN products p ON p.booth_id = b.id
    GROUP BY b.id
    ORDER BY (b.visit_count + COALESCE(SUM(p.favorite_count), 0) * 3) DESC
    LIMIT 20
  `).all() as (Booth & { total_favorites: number })[];

  res.json(booths);
});

app.get('/api/booth/:id', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  
  const booth = db.prepare('SELECT * FROM booths WHERE id = ?').get(id) as Booth | undefined;
  
  if (!booth) {
    return res.status(404).json({ error: '展位不存在' });
  }

  db.prepare('UPDATE booths SET visit_count = visit_count + 1 WHERE id = ?').run(id);
  booth.visit_count += 1;

  const products = db.prepare('SELECT * FROM products WHERE booth_id = ? ORDER BY created_at DESC').all(id) as Product[];
  
  res.json({ booth: { ...booth, visit_count: booth.visit_count }, products });
});

app.put('/api/booth/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, bg_color, primary_color, accent_color, cover_image } = req.body;
  const db = getDb();
  
  const booth = db.prepare('SELECT * FROM booths WHERE id = ?').get(id) as Booth | undefined;
  
  if (!booth) {
    return res.status(404).json({ error: '展位不存在' });
  }

  db.prepare(`
    UPDATE booths 
    SET name = COALESCE(?, name),
        description = COALESCE(?, description),
        bg_color = COALESCE(?, bg_color),
        primary_color = COALESCE(?, primary_color),
        accent_color = COALESCE(?, accent_color),
        cover_image = COALESCE(?, cover_image)
    WHERE id = ?
  `).run(name, description, bg_color, primary_color, accent_color, cover_image, id);

  const updatedBooth = db.prepare('SELECT * FROM booths WHERE id = ?').get(id);
  res.json({ booth: updatedBooth });
});

app.get('/api/booth/:id/products', (req, res) => {
  const { id } = req.params;
  const { sort = 'created_at', order = 'desc' } = req.query;
  
  const validSorts = ['price', 'created_at', 'favorite_count'];
  const validOrders = ['asc', 'desc'];
  
  const sortBy = validSorts.includes(sort as string) ? sort : 'created_at';
  const orderBy = validOrders.includes(order as string) ? order : 'desc';
  
  const db = getDb();
  const products = db.prepare(`
    SELECT * FROM products 
    WHERE booth_id = ? 
    ORDER BY ${sortBy} ${orderBy === 'asc' ? 'ASC' : 'DESC'}
  `).all(id) as Product[];
  
  res.json({ products });
});

app.post('/api/booth/:id/products', (req, res) => {
  const { id } = req.params;
  const { name, description, price, image, category } = req.body;
  
  if (!name || !image) {
    return res.status(400).json({ error: '商品名称和图片不能为空' });
  }

  const db = getDb();
  
  const count = db.prepare('SELECT COUNT(*) as count FROM products WHERE booth_id = ?').get(id) as { count: number };
  if (count.count >= 20) {
    return res.status(400).json({ error: '最多只能上架20件商品' });
  }

  const productId = uuidv4();
  const now = Date.now();
  
  db.prepare(`
    INSERT INTO products (id, booth_id, name, description, price, image, category, favorite_count, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
  `).run(productId, id, name, description || '', price || 0, image, category || '其他', now);

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  res.status(201).json({ product });
});

app.put('/api/product/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, price, image, category } = req.body;
  const db = getDb();
  
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  
  if (!product) {
    return res.status(404).json({ error: '商品不存在' });
  }

  db.prepare(`
    UPDATE products 
    SET name = COALESCE(?, name),
        description = COALESCE(?, description),
        price = COALESCE(?, price),
        image = COALESCE(?, image),
        category = COALESCE(?, category)
    WHERE id = ?
  `).run(name, description, price, image, category, id);

  const updatedProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  res.json({ product: updatedProduct });
});

app.delete('/api/product/:id', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  
  if (!product) {
    return res.status(404).json({ error: '商品不存在' });
  }

  db.prepare('DELETE FROM products WHERE id = ?').run(id);
  res.json({ success: true });
});

app.post('/api/product/:id/favorite', (req, res) => {
  const { id } = req.params;
  const { visitorId } = req.body;
  
  if (!visitorId) {
    return res.status(400).json({ error: '访客ID不能为空' });
  }

  const db = getDb();
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as Product | undefined;
  
  if (!product) {
    return res.status(404).json({ error: '商品不存在' });
  }

  const existing = db.prepare('SELECT id FROM favorites WHERE product_id = ? AND visitor_id = ?').get(id, visitorId);
  
  if (existing) {
    return res.json({ favorited: true, favorite_count: product.favorite_count });
  }

  const favId = uuidv4();
  const now = Date.now();
  
  db.prepare('INSERT INTO favorites (id, product_id, visitor_id, created_at) VALUES (?, ?, ?, ?)')
    .run(favId, id, visitorId, now);
  
  db.prepare('UPDATE products SET favorite_count = favorite_count + 1 WHERE id = ?').run(id);
  
  const updated = db.prepare('SELECT favorite_count FROM products WHERE id = ?').get(id);
  res.json({ favorited: true, favorite_count: updated.favorite_count });
});

app.get('/api/booth/:id/messages', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  
  const messages = db.prepare(`
    SELECT * FROM messages 
    WHERE booth_id = ? 
    ORDER BY created_at DESC 
    LIMIT 50
  `).all(id).reverse();
  
  res.json({ messages });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready`);
});
