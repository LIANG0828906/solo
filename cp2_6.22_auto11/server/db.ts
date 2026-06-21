import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.resolve(__dirname, '../data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'recipes.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      image TEXT,
      ingredients TEXT NOT NULL,
      steps TEXT NOT NULL,
      tags TEXT NOT NULL,
      author_id INTEGER NOT NULL,
      rating REAL DEFAULT 0,
      rating_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      rating INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      recipe_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (recipe_id) REFERENCES recipes(id),
      UNIQUE(user_id, recipe_id)
    );

    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      recipe_id INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (recipe_id) REFERENCES recipes(id),
      UNIQUE(user_id, recipe_id)
    );
  `)

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  if (userCount.count === 0) {
    seedData()
  }
}

function seedData() {
  const hashedPassword = bcrypt.hashSync('password123', 10)

  const insertUser = db.prepare(`
    INSERT INTO users (username, password_hash, avatar) VALUES (?, ?, ?)
  `)

  const user1 = insertUser.run('美食达人', hashedPassword, 'https://api.dicebear.com/7.x/avataaars/svg?seed=chef1')
  const user2 = insertUser.run('烘焙小厨', hashedPassword, 'https://api.dicebear.com/7.x/avataaars/svg?seed=chef2')
  const user3 = insertUser.run('健康饮食家', hashedPassword, 'https://api.dicebear.com/7.x/avataaars/svg?seed=chef3')

  const insertRecipe = db.prepare(`
    INSERT INTO recipes (title, description, image, ingredients, steps, tags, author_id, rating, rating_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const recipes = [
    {
      title: '番茄炒蛋',
      description: '经典家常下饭菜，酸甜可口，简单易做',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop',
      ingredients: JSON.stringify([
        { name: '番茄', amount: '2个' },
        { name: '鸡蛋', amount: '3个' },
        { name: '葱花', amount: '适量' },
        { name: '盐', amount: '少许' },
        { name: '白糖', amount: '1勺' },
      ]),
      steps: JSON.stringify([
        { order: 1, content: '番茄洗净切块，鸡蛋打散备用' },
        { order: 2, content: '热锅倒油，倒入蛋液炒至结块盛出' },
        { order: 3, content: '锅中再加少许油，放入番茄翻炒出汁' },
        { order: 4, content: '加入盐和糖调味，倒入炒好的鸡蛋翻炒均匀' },
        { order: 5, content: '撒上葱花即可出锅' },
      ]),
      tags: JSON.stringify(['中餐', '家常菜', '快手菜']),
      authorId: user1.lastInsertRowid,
      rating: 4.5,
      ratingCount: 128,
    },
    {
      title: '提拉米苏',
      description: '意式经典甜品，浓郁咖啡香与绵密口感的完美结合',
      image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&h=500&fit=crop',
      ingredients: JSON.stringify([
        { name: '马斯卡彭奶酪', amount: '250g' },
        { name: '手指饼干', amount: '200g' },
        { name: '浓缩咖啡', amount: '200ml' },
        { name: '鸡蛋', amount: '2个' },
        { name: '细砂糖', amount: '80g' },
        { name: '可可粉', amount: '适量' },
      ]),
      steps: JSON.stringify([
        { order: 1, content: '蛋黄加糖打发至颜色变浅，加入马斯卡彭奶酪拌匀' },
        { order: 2, content: '蛋白打发至硬性发泡，与蛋黄糊翻拌均匀' },
        { order: 3, content: '手指饼干快速蘸取咖啡，铺在容器底部' },
        { order: 4, content: '铺上一层奶酪糊，重复铺层' },
        { order: 5, content: '冷藏4小时以上，食用前筛上可可粉' },
      ]),
      tags: JSON.stringify(['甜点', '意式', '烘焙']),
      authorId: user2.lastInsertRowid,
      rating: 4.8,
      ratingCount: 256,
    },
    {
      title: '鸡胸肉沙拉',
      description: '高蛋白低卡减脂餐，健康又美味',
      image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600&h=400&fit=crop',
      ingredients: JSON.stringify([
        { name: '鸡胸肉', amount: '200g' },
        { name: '生菜', amount: '1颗' },
        { name: '圣女果', amount: '10颗' },
        { name: '黄瓜', amount: '1根' },
        { name: '橄榄油', amount: '2勺' },
        { name: '柠檬汁', amount: '1勺' },
        { name: '黑胡椒', amount: '少许' },
      ]),
      steps: JSON.stringify([
        { order: 1, content: '鸡胸肉用盐和黑胡椒腌制15分钟' },
        { order: 2, content: '平底锅煎至两面金黄，切片备用' },
        { order: 3, content: '生菜撕成小块，黄瓜切片，圣女果对半切' },
        { order: 4, content: '所有蔬菜放入碗中，加入鸡胸肉' },
        { order: 5, content: '淋上橄榄油和柠檬汁，撒上黑胡椒拌匀' },
      ]),
      tags: JSON.stringify(['低卡', '健康', '沙拉']),
      authorId: user3.lastInsertRowid,
      rating: 4.3,
      ratingCount: 89,
    },
    {
      title: '红烧肉',
      description: '肥而不腻，入口即化的经典硬菜',
      image: 'https://images.unsplash.com/photo-1623595119708-26b1f7300075?w=600&h=450&fit=crop',
      ingredients: JSON.stringify([
        { name: '五花肉', amount: '500g' },
        { name: '冰糖', amount: '30g' },
        { name: '生抽', amount: '2勺' },
        { name: '老抽', amount: '1勺' },
        { name: '料酒', amount: '2勺' },
        { name: '八角', amount: '2个' },
        { name: '桂皮', amount: '1小块' },
        { name: '姜片', amount: '5片' },
      ]),
      steps: JSON.stringify([
        { order: 1, content: '五花肉切块，冷水下锅焯水去腥' },
        { order: 2, content: '锅中放少许油，加入冰糖小火炒出糖色' },
        { order: 3, content: '放入五花肉翻炒上色' },
        { order: 4, content: '加入生抽、老抽、料酒、八角、桂皮、姜片' },
        { order: 5, content: '加开水没过肉，大火烧开转小火炖1小时' },
        { order: 6, content: '大火收汁即可出锅' },
      ]),
      tags: JSON.stringify(['中餐', '家常菜', '硬菜']),
      authorId: user1.lastInsertRowid,
      rating: 4.9,
      ratingCount: 342,
    },
    {
      title: '芒果班戟',
      description: '港式经典甜品，芒果与奶油的甜蜜组合',
      image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&h=400&fit=crop',
      ingredients: JSON.stringify([
        { name: '低筋面粉', amount: '100g' },
        { name: '鸡蛋', amount: '2个' },
        { name: '牛奶', amount: '200ml' },
        { name: '淡奶油', amount: '200ml' },
        { name: '糖粉', amount: '50g' },
        { name: '芒果', amount: '2个' },
        { name: '黄油', amount: '20g' },
      ]),
      steps: JSON.stringify([
        { order: 1, content: '面粉过筛，加入鸡蛋、牛奶、融化的黄油搅拌成面糊' },
        { order: 2, content: '平底锅小火，倒入一勺面糊摊成薄饼' },
        { order: 3, content: '淡奶油加糖打发至硬性发泡' },
        { order: 4, content: '芒果切块备用' },
        { order: 5, content: '饼皮中放入奶油和芒果，包成四方形即可' },
      ]),
      tags: JSON.stringify(['甜点', '港式', '烘焙']),
      authorId: user2.lastInsertRowid,
      rating: 4.6,
      ratingCount: 178,
    },
    {
      title: '酸辣土豆丝',
      description: '清脆爽口，开胃下饭的经典素菜',
      image: 'https://images.unsplash.com/photo-1518977676601-b53f82be73b0?w=600&h=350&fit=crop',
      ingredients: JSON.stringify([
        { name: '土豆', amount: '2个' },
        { name: '干辣椒', amount: '5个' },
        { name: '花椒', amount: '少许' },
        { name: '白醋', amount: '2勺' },
        { name: '盐', amount: '适量' },
        { name: '葱花', amount: '适量' },
      ]),
      steps: JSON.stringify([
        { order: 1, content: '土豆去皮切丝，用清水浸泡去除淀粉' },
        { order: 2, content: '锅中放油，加入花椒和干辣椒爆香' },
        { order: 3, content: '捞出花椒，放入土豆丝大火快炒' },
        { order: 4, content: '沿锅边淋入白醋，加盐调味' },
        { order: 5, content: '翻炒均匀，撒上葱花出锅' },
      ]),
      tags: JSON.stringify(['中餐', '家常菜', '素菜', '快手菜']),
      authorId: user1.lastInsertRowid,
      rating: 4.4,
      ratingCount: 156,
    },
    {
      title: '抹茶蛋糕卷',
      description: '清新抹茶味，绵软细腻的日式蛋糕卷',
      image: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=600&h=400&fit=crop',
      ingredients: JSON.stringify([
        { name: '低筋面粉', amount: '80g' },
        { name: '抹茶粉', amount: '10g' },
        { name: '鸡蛋', amount: '4个' },
        { name: '细砂糖', amount: '100g' },
        { name: '淡奶油', amount: '200ml' },
        { name: '牛奶', amount: '50ml' },
        { name: '玉米油', amount: '40ml' },
      ]),
      steps: JSON.stringify([
        { order: 1, content: '蛋黄加糖打散，加入牛奶和玉米油拌匀' },
        { order: 2, content: '筛入低筋面粉和抹茶粉，拌匀成蛋黄糊' },
        { order: 3, content: '蛋白打发至湿性发泡，分三次与蛋黄糊翻拌均匀' },
        { order: 4, content: '倒入烤盘，180度烤15分钟' },
        { order: 5, content: '出炉晾凉，抹上打发的奶油，卷成蛋糕卷' },
        { order: 6, content: '冷藏定型后切片食用' },
      ]),
      tags: JSON.stringify(['甜点', '日式', '烘焙', '抹茶控']),
      authorId: user2.lastInsertRowid,
      rating: 4.7,
      ratingCount: 203,
    },
    {
      title: '番茄牛肉汤',
      description: '酸甜开胃，营养丰富的家常汤品',
      image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&h=400&fit=crop',
      ingredients: JSON.stringify([
        { name: '牛腩', amount: '300g' },
        { name: '番茄', amount: '3个' },
        { name: '土豆', amount: '1个' },
        { name: '胡萝卜', amount: '1根' },
        { name: '洋葱', amount: '半个' },
        { name: '番茄酱', amount: '2勺' },
        { name: '盐', amount: '适量' },
      ]),
      steps: JSON.stringify([
        { order: 1, content: '牛腩切块焯水，番茄去皮切块' },
        { order: 2, content: '锅中放油，炒香洋葱，加入番茄炒出汁' },
        { order: 3, content: '加入番茄酱翻炒，放入牛腩' },
        { order: 4, content: '加开水炖1小时' },
        { order: 5, content: '加入土豆和胡萝卜块，继续炖30分钟' },
        { order: 6, content: '加盐调味即可' },
      ]),
      tags: JSON.stringify(['中餐', '汤品', '家常菜']),
      authorId: user1.lastInsertRowid,
      rating: 4.5,
      ratingCount: 95,
    },
    {
      title: '燕麦水果碗',
      description: '低卡营养早餐，开启元气满满的一天',
      image: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=600&h=400&fit=crop',
      ingredients: JSON.stringify([
        { name: '即食燕麦', amount: '50g' },
        { name: '酸奶', amount: '150g' },
        { name: '蓝莓', amount: '30g' },
        { name: '草莓', amount: '2颗' },
        { name: '香蕉', amount: '半根' },
        { name: '奇亚籽', amount: '1勺' },
        { name: '蜂蜜', amount: '少许' },
      ]),
      steps: JSON.stringify([
        { order: 1, content: '燕麦用少许温水泡软' },
        { order: 2, content: '碗底铺上燕麦，倒入酸奶' },
        { order: 3, content: '蓝莓洗净，草莓切块，香蕉切片' },
        { order: 4, content: '将水果摆放在酸奶上' },
        { order: 5, content: '撒上奇亚籽，淋上蜂蜜即可' },
      ]),
      tags: JSON.stringify(['低卡', '健康', '早餐', '快手菜']),
      authorId: user3.lastInsertRowid,
      rating: 4.2,
      ratingCount: 67,
    },
    {
      title: '麻婆豆腐',
      description: '麻辣鲜香，川菜经典代表',
      image: 'https://images.unsplash.com/photo-1582452919619-56e0fbde7e7e?w=600&h=450&fit=crop',
      ingredients: JSON.stringify([
        { name: '嫩豆腐', amount: '1盒' },
        { name: '猪肉末', amount: '100g' },
        { name: '豆瓣酱', amount: '1勺' },
        { name: '花椒粉', amount: '少许' },
        { name: '生抽', amount: '1勺' },
        { name: '淀粉', amount: '适量' },
        { name: '葱花', amount: '适量' },
      ]),
      steps: JSON.stringify([
        { order: 1, content: '豆腐切块，用盐水浸泡备用' },
        { order: 2, content: '锅中放油，炒香肉末至变色' },
        { order: 3, content: '加入豆瓣酱炒出红油' },
        { order: 4, content: '加入适量水，放入豆腐块' },
        { order: 5, content: '加生抽调味，水淀粉勾芡' },
        { order: 6, content: '撒上花椒粉和葱花即可' },
      ]),
      tags: JSON.stringify(['中餐', '川菜', '家常菜', '下饭菜']),
      authorId: user1.lastInsertRowid,
      rating: 4.6,
      ratingCount: 189,
    },
    {
      title: '芝士焗红薯',
      description: '香甜软糯，超治愈的冬日甜品',
      image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&h=400&fit=crop',
      ingredients: JSON.stringify([
        { name: '红薯', amount: '2个' },
        { name: '马苏里拉芝士', amount: '100g' },
        { name: '黄油', amount: '20g' },
        { name: '牛奶', amount: '30ml' },
        { name: '炼乳', amount: '1勺' },
      ]),
      steps: JSON.stringify([
        { order: 1, content: '红薯洗净对半切，上锅蒸熟' },
        { order: 2, content: '挖出红薯肉，注意保持皮完整' },
        { order: 3, content: '红薯泥中加入黄油、牛奶、炼乳拌匀' },
        { order: 4, content: '将红薯泥填回红薯皮中' },
        { order: 5, content: '表面撒上马苏里拉芝士' },
        { order: 6, content: '烤箱180度烤15分钟至芝士融化金黄' },
      ]),
      tags: JSON.stringify(['甜点', '烘焙', '快手菜', '下午茶']),
      authorId: user2.lastInsertRowid,
      rating: 4.8,
      ratingCount: 234,
    },
    {
      title: '清炒时蔬',
      description: '简单快手，保留蔬菜本真的清甜',
      image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&h=350&fit=crop',
      ingredients: JSON.stringify([
        { name: '西兰花', amount: '半颗' },
        { name: '胡萝卜', amount: '半根' },
        { name: '香菇', amount: '5朵' },
        { name: '蒜', amount: '3瓣' },
        { name: '蚝油', amount: '1勺' },
        { name: '盐', amount: '适量' },
      ]),
      steps: JSON.stringify([
        { order: 1, content: '西兰花切小朵，胡萝卜切片，香菇切块' },
        { order: 2, content: '西兰花焯水后捞出沥干' },
        { order: 3, content: '锅中放油，爆香蒜片' },
        { order: 4, content: '先放胡萝卜和香菇翻炒' },
        { order: 5, content: '加入西兰花，加蚝油和盐调味' },
        { order: 6, content: '大火快炒均匀即可出锅' },
      ]),
      tags: JSON.stringify(['低卡', '健康', '素菜', '快手菜']),
      authorId: user3.lastInsertRowid,
      rating: 4.1,
      ratingCount: 52,
    },
  ]

  recipes.forEach((r) => {
    insertRecipe.run(r.title, r.description, r.image, r.ingredients, r.steps, r.tags, r.authorId, r.rating, r.ratingCount)
  })

  const insertComment = db.prepare(`
    INSERT INTO comments (recipe_id, user_id, content, rating) VALUES (?, ?, ?, ?)
  `)

  const comments = [
    { recipeId: 1, userId: 2, content: '超级好吃！跟着做了，家人都说赞', rating: 5 },
    { recipeId: 1, userId: 3, content: '简单又下饭，新手也能学会', rating: 4 },
    { recipeId: 2, userId: 1, content: '第一次做提拉米苏就成功了，太开心！', rating: 5 },
    { recipeId: 4, userId: 3, content: '肥而不腻，入口即化，绝了！', rating: 5 },
    { recipeId: 6, userId: 2, content: '酸辣爽口，夏天吃太开胃了', rating: 5 },
  ]

  comments.forEach((c) => {
    insertComment.run(c.recipeId, c.userId, c.content, c.rating)
  })
}

export interface User {
  id: number
  username: string
  password_hash: string
  avatar?: string
  created_at: string
}

export interface Recipe {
  id: number
  title: string
  description: string
  image: string
  ingredients: string
  steps: string
  tags: string
  author_id: number
  authorName?: string
  rating: number
  rating_count: number
  created_at: string
}

export interface Comment {
  id: number
  recipe_id: number
  user_id: number
  username: string
  avatar?: string
  content: string
  rating: number
  created_at: string
}

export function getUserById(id: number): Omit<User, 'password_hash'> | undefined {
  const row = db.prepare('SELECT id, username, avatar, created_at FROM users WHERE id = ?').get(id)
  return row as Omit<User, 'password_hash'> | undefined
}

export function getUserByUsername(username: string): User | undefined {
  const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username)
  return row as User | undefined
}

export function createUser(username: string, passwordHash: string, avatar?: string): number {
  const result = db.prepare('INSERT INTO users (username, password_hash, avatar) VALUES (?, ?, ?)').run(username, passwordHash, avatar || null)
  return Number(result.lastInsertRowid)
}

export function getRecipes(page: number = 1, limit: number = 12, tag?: string, search?: string) {
  let query = `
    SELECT r.*, u.username as authorName 
    FROM recipes r 
    JOIN users u ON r.author_id = u.id
    WHERE 1=1
  `
  const params: any[] = []

  if (tag) {
    query += ' AND r.tags LIKE ?'
    params.push(`%${tag}%`)
  }

  if (search) {
    query += ' AND (r.title LIKE ? OR r.description LIKE ? OR r.ingredients LIKE ?)'
    const searchTerm = `%${search}%`
    params.push(searchTerm, searchTerm, searchTerm)
  }

  query += ' ORDER BY r.rating DESC, r.created_at DESC LIMIT ? OFFSET ?'
  params.push(limit, (page - 1) * limit)

  const recipes = db.prepare(query).all(...params) as Recipe[]

  const countQuery = 'SELECT COUNT(*) as count FROM recipes r WHERE 1=1' + (tag ? ' AND r.tags LIKE ?' : '') + (search ? ' AND (r.title LIKE ? OR r.description LIKE ? OR r.ingredients LIKE ?)' : '')
  const countParams: any[] = []
  if (tag) countParams.push(`%${tag}%`)
  if (search) {
    const searchTerm = `%${search}%`
    countParams.push(searchTerm, searchTerm, searchTerm)
  }
  const { count } = db.prepare(countQuery).get(...countParams) as { count: number }

  return {
    recipes,
    total: count,
    hasMore: page * limit < count,
  }
}

export function getRecipeById(id: number): (Recipe & { authorName: string }) | undefined {
  const row = db.prepare(`
    SELECT r.*, u.username as authorName 
    FROM recipes r 
    JOIN users u ON r.author_id = u.id
    WHERE r.id = ?
  `).get(id)
  return row as (Recipe & { authorName: string }) | undefined
}

export function createRecipe(data: {
  title: string
  description: string
  image: string
  ingredients: string
  steps: string
  tags: string
  authorId: number
}): number {
  const result = db.prepare(`
    INSERT INTO recipes (title, description, image, ingredients, steps, tags, author_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(data.title, data.description, data.image, data.ingredients, data.steps, data.tags, data.authorId)
  return Number(result.lastInsertRowid)
}

export function matchRecipesByIngredients(ingredients: string[]) {
  const allRecipes = db.prepare(`
    SELECT r.*, u.username as authorName 
    FROM recipes r 
    JOIN users u ON r.author_id = u.id
  `).all() as Recipe[]

  const lowerIngredients = ingredients.map((i) => i.toLowerCase())

  const scored = allRecipes.map((recipe) => {
    const recipeIngredients: { name: string; amount: string }[] = JSON.parse(recipe.ingredients)
    const recipeIngredientNames = recipeIngredients.map((i) => i.name.toLowerCase())

    const matched = lowerIngredients.filter((ing) =>
      recipeIngredientNames.some((name) => name.includes(ing) || ing.includes(name))
    )

    const matchScore = recipeIngredientNames.length > 0 ? matched.length / recipeIngredientNames.length : 0

    return {
      ...recipe,
      matchScore,
      matchedIngredients: matched,
      missingIngredients: recipeIngredientNames.filter((name) =>
        !lowerIngredients.some((ing) => name.includes(ing) || ing.includes(name))
      ),
    }
  })

  return scored
    .filter((r) => r.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 20)
}

export function getComments(recipeId: number): Comment[] {
  return db.prepare(`
    SELECT c.*, u.username, u.avatar
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.recipe_id = ?
    ORDER BY c.created_at DESC
  `).all(recipeId) as Comment[]
}

export function createComment(recipeId: number, userId: number, content: string, rating: number): number {
  const result = db.prepare(`
    INSERT INTO comments (recipe_id, user_id, content, rating)
    VALUES (?, ?, ?, ?)
  `).run(recipeId, userId, content, rating)

  const comments = getComments(recipeId)
  if (comments.length > 0) {
    const avgRating = comments.reduce((sum, c) => sum + c.rating, 0) / comments.length
    db.prepare('UPDATE recipes SET rating = ?, rating_count = ? WHERE id = ?').run(
      Math.round(avgRating * 10) / 10,
      comments.length,
      recipeId
    )
  }

  return Number(result.lastInsertRowid)
}

export function getFavorites(userId: number): Recipe[] {
  return db.prepare(`
    SELECT r.*, u.username as authorName
    FROM favorites f
    JOIN recipes r ON f.recipe_id = r.id
    JOIN users u ON r.author_id = u.id
    WHERE f.user_id = ?
    ORDER BY f.created_at DESC
  `).all(userId) as Recipe[]
}

export function addFavorite(userId: number, recipeId: number): boolean {
  try {
    db.prepare('INSERT INTO favorites (user_id, recipe_id) VALUES (?, ?)').run(userId, recipeId)
    return true
  } catch {
    return false
  }
}

export function removeFavorite(userId: number, recipeId: number): boolean {
  const result = db.prepare('DELETE FROM favorites WHERE user_id = ? AND recipe_id = ?').run(userId, recipeId)
  return result.changes > 0
}

export function isFavorited(userId: number, recipeId: number): boolean {
  const row = db.prepare('SELECT COUNT(*) as count FROM favorites WHERE user_id = ? AND recipe_id = ?').get(userId, recipeId) as { count: number }
  return row.count > 0
}

export function getRelatedRecipes(recipeId: number, limit: number = 6): Recipe[] {
  const recipe = getRecipeById(recipeId)
  if (!recipe) return []

  const tags: string[] = JSON.parse(recipe.tags)
  if (tags.length === 0) return []

  const placeholders = tags.map(() => '?').join(', ')

  return db.prepare(`
    SELECT r.*, u.username as authorName
    FROM recipes r
    JOIN users u ON r.author_id = u.id
    WHERE r.id != ? AND (
      ${tags.map(() => 'r.tags LIKE ?').join(' OR ')}
    )
    ORDER BY r.rating DESC
    LIMIT ?
  `).all(recipeId, ...tags.map((t) => `%${t}%`), limit) as Recipe[]
}

export function getAllTags(): string[] {
  const recipes = db.prepare('SELECT tags FROM recipes').all() as { tags: string }[]
  const tagSet = new Set<string>()
  recipes.forEach((r) => {
    JSON.parse(r.tags).forEach((t: string) => tagSet.add(t))
  })
  return Array.from(tagSet)
}

export default db
