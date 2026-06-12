import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

const db = new Database('./community.db')

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT,
    points INTEGER DEFAULT 100,
    reputation INTEGER DEFAULT 100,
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    points INTEGER NOT NULL,
    image TEXT,
    status TEXT DEFAULT 'available',
    owner_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    points INTEGER NOT NULL,
    deadline DATETIME NOT NULL,
    status TEXT DEFAULT 'open',
    publisher_id TEXT NOT NULL,
    accepted_user_id TEXT,
    rating INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (publisher_id) REFERENCES users(id),
    FOREIGN KEY (accepted_user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS task_applications (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(task_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    user_id TEXT NOT NULL,
    target_id TEXT,
    points INTEGER NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_items_owner ON items(owner_id);
  CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
  CREATE INDEX IF NOT EXISTS idx_tasks_publisher ON tasks(publisher_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
  CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
  CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);
`)

const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
if (userCount.count === 0) {
  const insertUser = db.prepare(
    'INSERT INTO users (id, username, password, email, points, reputation) VALUES (?, ?, ?, ?, ?, ?)'
  )
  const insertItem = db.prepare(
    'INSERT INTO items (id, title, description, points, owner_id) VALUES (?, ?, ?, ?, ?)'
  )
  const insertTask = db.prepare(
    'INSERT INTO tasks (id, title, description, points, deadline, publisher_id) VALUES (?, ?, ?, ?, ?, ?)'
  )

  const hashedPassword = bcrypt.hashSync('123456', 10)

  const user1Id = uuidv4()
  const user2Id = uuidv4()
  const user3Id = uuidv4()

  insertUser.run(user1Id, '张三', hashedPassword, 'zhangsan@example.com', 100, 100)
  insertUser.run(user2Id, '李四', hashedPassword, 'lisi@example.com', 150, 85)
  insertUser.run(user3Id, '王五', hashedPassword, 'wangwu@example.com', 200, 95)

  insertItem.run(uuidv4(), '二手自行车', '九成新，骑行顺畅，适合通勤', 50, user1Id)
  insertItem.run(uuidv4(), '编程书籍', '《JavaScript高级程序设计》第四版，全新未拆封', 30, user1Id)
  insertItem.run(uuidv4(), '机械键盘', 'Cherry青轴，使用半年，手感极佳', 80, user2Id)
  insertItem.run(uuidv4(), '无线鼠标', 'Logitech M590，静音按键', 25, user2Id)
  insertItem.run(uuidv4(), '显示器支架', '可调节高度，人体工学设计', 45, user3Id)
  insertItem.run(uuidv4(), '运动耳机', 'Sony WF-1000XM4，降噪效果好', 120, user3Id)

  const now = new Date()
  const deadline1 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const deadline2 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const deadline3 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

  insertTask.run(
    uuidv4(),
    '帮忙取快递',
    '小区门口快递点，大件物品，需要帮忙搬到5楼',
    20,
    deadline1.toISOString(),
    user1Id
  )
  insertTask.run(
    uuidv4(),
    '网页设计求助',
    '需要设计一个简单的个人作品集页面，有参考设计稿',
    100,
    deadline2.toISOString(),
    user2Id
  )
  insertTask.run(
    uuidv4(),
    '数学题解答',
    '高等数学微积分题目5道，需要详细解答过程',
    30,
    deadline3.toISOString(),
    user3Id
  )
}

export interface DBUser {
  id: string
  username: string
  password: string
  email?: string
  points: number
  reputation: number
  avatar?: string
  created_at: string
}

export interface DBItem {
  id: string
  title: string
  description?: string
  points: number
  image?: string
  status: string
  owner_id: string
  created_at: string
  owner?: DBUser
}

export interface DBTask {
  id: string
  title: string
  description?: string
  points: number
  deadline: string
  status: string
  publisher_id: string
  accepted_user_id?: string
  rating?: number
  created_at: string
  publisher?: DBUser
  accepted_user?: DBUser
}

export interface DBTaskApplication {
  id: string
  task_id: string
  user_id: string
  message?: string
  status: string
  created_at: string
  user?: DBUser
}

export interface DBTransaction {
  id: string
  type: string
  user_id: string
  target_id?: string
  points: number
  description: string
  created_at: string
}

export const getUserById = db.prepare(
  'SELECT * FROM users WHERE id = ?'
) as unknown as Database.Statement

export const getUserByUsername = db.prepare(
  'SELECT * FROM users WHERE username = ?'
) as unknown as Database.Statement

export const insertUser = db.prepare(
  'INSERT INTO users (id, username, password, email, points, reputation) VALUES (?, ?, ?, ?, ?, ?)'
) as unknown as Database.Statement

export const updateUserPoints = db.prepare(
  'UPDATE users SET points = points + ? WHERE id = ?'
) as unknown as Database.Statement

export const updateUserReputation = db.prepare(
  'UPDATE users SET reputation = reputation + ? WHERE id = ?'
) as unknown as Database.Statement

export const getItems = db.prepare(`
  SELECT items.*, users.username as owner_username, users.avatar as owner_avatar, users.reputation as owner_reputation
  FROM items
  JOIN users ON items.owner_id = users.id
  WHERE users.reputation >= 60 AND items.status = 'available'
  ORDER BY items.created_at DESC
`) as unknown as Database.Statement

export const getItemById = db.prepare(`
  SELECT items.*, users.username as owner_username, users.avatar as owner_avatar, users.reputation as owner_reputation
  FROM items
  JOIN users ON items.owner_id = users.id
  WHERE items.id = ?
`) as unknown as Database.Statement

export const insertItem = db.prepare(
  'INSERT INTO items (id, title, description, points, image, owner_id) VALUES (?, ?, ?, ?, ?, ?)'
) as unknown as Database.Statement

export const updateItemStatus = db.prepare(
  'UPDATE items SET status = ? WHERE id = ?'
) as unknown as Database.Statement

export const getItemsByOwner = db.prepare(
  'SELECT * FROM items WHERE owner_id = ? ORDER BY created_at DESC'
) as unknown as Database.Statement

export const getTasks = db.prepare(`
  SELECT tasks.*, users.username as publisher_username, users.avatar as publisher_avatar
  FROM tasks
  JOIN users ON tasks.publisher_id = users.id
  ORDER BY tasks.deadline DESC
`) as unknown as Database.Statement

export const getTaskById = db.prepare(`
  SELECT tasks.*, 
         users.username as publisher_username, users.avatar as publisher_avatar,
         accepted.username as accepted_username, accepted.avatar as accepted_avatar
  FROM tasks
  JOIN users ON tasks.publisher_id = users.id
  LEFT JOIN users as accepted ON tasks.accepted_user_id = accepted.id
  WHERE tasks.id = ?
`) as unknown as Database.Statement

export const insertTask = db.prepare(
  'INSERT INTO tasks (id, title, description, points, deadline, publisher_id) VALUES (?, ?, ?, ?, ?, ?)'
) as unknown as Database.Statement

export const updateTaskStatus = db.prepare(
  'UPDATE tasks SET status = ? WHERE id = ?'
) as unknown as Database.Statement

export const updateTaskAcceptedUser = db.prepare(
  'UPDATE tasks SET accepted_user_id = ?, status = ? WHERE id = ?'
) as unknown as Database.Statement

export const updateTaskRating = db.prepare(
  'UPDATE tasks SET rating = ? WHERE id = ?'
) as unknown as Database.Statement

export const getTasksByPublisher = db.prepare(
  'SELECT * FROM tasks WHERE publisher_id = ? ORDER BY created_at DESC'
) as unknown as Database.Statement

export const insertTaskApplication = db.prepare(
  'INSERT INTO task_applications (id, task_id, user_id, message) VALUES (?, ?, ?, ?)'
) as unknown as Database.Statement

export const getTaskApplicationsByTaskId = db.prepare(`
  SELECT task_applications.*, users.username as user_username, users.avatar as user_avatar
  FROM task_applications
  JOIN users ON task_applications.user_id = users.id
  WHERE task_applications.task_id = ?
  ORDER BY task_applications.created_at DESC
`) as unknown as Database.Statement

export const updateTaskApplicationStatus = db.prepare(
  'UPDATE task_applications SET status = ? WHERE id = ?'
) as unknown as Database.Statement

export const insertTransaction = db.prepare(
  'INSERT INTO transactions (id, type, user_id, target_id, points, description) VALUES (?, ?, ?, ?, ?, ?)'
) as unknown as Database.Statement

export const getTransactionsByUserId = db.prepare(
  'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC'
) as unknown as Database.Statement

export const getRecentActivities = db.prepare(`
  SELECT transactions.*, users.username as user_username
  FROM transactions
  JOIN users ON transactions.user_id = users.id
  ORDER BY transactions.created_at DESC
  LIMIT 5
`) as unknown as Database.Statement

export default db
