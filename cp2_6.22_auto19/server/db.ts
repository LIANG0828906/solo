import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'data', 'recipes.db');
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS user (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recipe (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      cover_image TEXT,
      author_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      rating REAL DEFAULT 0,
      rating_count INTEGER DEFAULT 0,
      favorite_count INTEGER DEFAULT 0,
      FOREIGN KEY (author_id) REFERENCES user(id)
    );

    CREATE TABLE IF NOT EXISTS ingredient (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      quantity TEXT,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (recipe_id) REFERENCES recipe(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS step (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER NOT NULL,
      "order" INTEGER NOT NULL,
      content TEXT NOT NULL,
      image TEXT,
      FOREIGN KEY (recipe_id) REFERENCES recipe(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS recipe_tag (
      recipe_id INTEGER NOT NULL,
      tag TEXT NOT NULL,
      PRIMARY KEY (recipe_id, tag),
      FOREIGN KEY (recipe_id) REFERENCES recipe(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS rating (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      recipe_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user(id),
      FOREIGN KEY (recipe_id) REFERENCES recipe(id),
      UNIQUE(user_id, recipe_id)
    );

    CREATE TABLE IF NOT EXISTS comment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      recipe_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user(id),
      FOREIGN KEY (recipe_id) REFERENCES recipe(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS favorite (
      user_id INTEGER NOT NULL,
      recipe_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, recipe_id),
      FOREIGN KEY (user_id) REFERENCES user(id),
      FOREIGN KEY (recipe_id) REFERENCES recipe(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_recipe_title ON recipe(title);
    CREATE INDEX IF NOT EXISTS idx_recipe_author ON recipe(author_id);
    CREATE INDEX IF NOT EXISTS idx_recipe_rating ON recipe(rating);
    CREATE INDEX IF NOT EXISTS idx_ingredient_name ON ingredient(name);
    CREATE INDEX IF NOT EXISTS idx_recipe_tag_tag ON recipe_tag(tag);
    CREATE INDEX IF NOT EXISTS idx_comment_recipe ON comment(recipe_id);
    CREATE INDEX IF NOT EXISTS idx_favorite_user ON favorite(user_id);
  `);

  seedData();
}

function seedData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM user').get() as { count: number };
  if (userCount.count > 0) return;

  const insertUser = db.prepare(
    'INSERT INTO user (username, email, password_hash, avatar) VALUES (?, ?, ?, ?)'
  );
  const insertRecipe = db.prepare(
    'INSERT INTO recipe (title, description, cover_image, author_id, rating, rating_count, favorite_count) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const insertIngredient = db.prepare(
    'INSERT INTO ingredient (recipe_id, name, quantity, sort_order) VALUES (?, ?, ?, ?)'
  );
  const insertStep = db.prepare(
    'INSERT INTO step (recipe_id, "order", content, image) VALUES (?, ?, ?, ?)'
  );
  const insertTag = db.prepare(
    'INSERT INTO recipe_tag (recipe_id, tag) VALUES (?, ?)'
  );

  const demoUsers = [
    { username: '美食达人小明', email: 'ming@demo.com', password: '123456', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop' },
    { username: '烘焙爱好者Lily', email: 'lily@demo.com', password: '123456', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop' },
  ];

  const demoRecipes = [
    {
      title: '番茄炒蛋',
      description: '经典家常菜，酸甜可口，营养丰富，10分钟就能上桌。',
      coverImage: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop',
      ingredients: [
        { name: '鸡蛋', quantity: '3个', order: 1 },
        { name: '番茄', quantity: '2个', order: 2 },
        { name: '葱花', quantity: '适量', order: 3 },
        { name: '盐', quantity: '少许', order: 4 },
        { name: '糖', quantity: '1小勺', order: 5 },
      ],
      steps: [
        { order: 1, content: '鸡蛋打散，加少许盐搅拌均匀' },
        { order: 2, content: '番茄切块，葱切葱花备用' },
        { order: 3, content: '热锅倒油，倒入蛋液炒熟盛出' },
        { order: 4, content: '锅中再加少许油，放入番茄翻炒出汁' },
        { order: 5, content: '加入糖和盐调味，倒入炒好的鸡蛋翻炒均匀' },
        { order: 6, content: '撒上葱花即可出锅' },
      ],
      tags: ['中餐', '家常菜', '快手菜', '低卡'],
      rating: 4.5,
      ratingCount: 128,
      favoriteCount: 256,
    },
    {
      title: '提拉米苏',
      description: '意式经典甜点，浓郁咖啡香与马斯卡彭的完美结合。',
      coverImage: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&h=400&fit=crop',
      ingredients: [
        { name: '马斯卡彭奶酪', quantity: '500g', order: 1 },
        { name: '手指饼干', quantity: '200g', order: 2 },
        { name: '浓缩咖啡', quantity: '200ml', order: 3 },
        { name: '蛋黄', quantity: '4个', order: 4 },
        { name: '细砂糖', quantity: '100g', order: 5 },
        { name: '淡奶油', quantity: '300ml', order: 6 },
        { name: '可可粉', quantity: '适量', order: 7 },
      ],
      steps: [
        { order: 1, content: '蛋黄加糖打发至颜色变浅、体积膨大' },
        { order: 2, content: '加入马斯卡彭奶酪搅拌均匀' },
        { order: 3, content: '淡奶油打发至六分发，与奶酪糊混合' },
        { order: 4, content: '咖啡放凉，手指饼干快速蘸取咖啡' },
        { order: 5, content: '一层饼干一层奶酪糊交替铺放' },
        { order: 6, content: '冷藏4小时以上，食用前筛上可可粉' },
      ],
      tags: ['甜点', '意式', '烘焙'],
      rating: 4.8,
      ratingCount: 256,
      favoriteCount: 512,
    },
    {
      title: '香煎鸡胸肉沙拉',
      description: '高蛋白低卡健身餐，鲜嫩多汁的鸡胸肉配清爽蔬菜。',
      coverImage: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=500&fit=crop',
      ingredients: [
        { name: '鸡胸肉', quantity: '2块', order: 1 },
        { name: '生菜', quantity: '1颗', order: 2 },
        { name: '番茄', quantity: '1个', order: 3 },
        { name: '黄瓜', quantity: '1根', order: 4 },
        { name: '橄榄油', quantity: '2勺', order: 5 },
        { name: '柠檬汁', quantity: '1勺', order: 6 },
        { name: '黑胡椒', quantity: '适量', order: 7 },
        { name: '盐', quantity: '适量', order: 8 },
      ],
      steps: [
        { order: 1, content: '鸡胸肉用盐和黑胡椒腌制15分钟' },
        { order: 2, content: '平底锅加少许油，中火煎鸡胸肉至两面金黄' },
        { order: 3, content: '取出静置5分钟后切片' },
        { order: 4, content: '生菜撕成小片，番茄切块，黄瓜切片' },
        { order: 5, content: '橄榄油、柠檬汁、盐、黑胡椒调成酱汁' },
        { order: 6, content: '所有材料混合，淋上酱汁即可' },
      ],
      tags: ['低卡', '健身', '西餐', '沙拉'],
      rating: 4.3,
      ratingCount: 89,
      favoriteCount: 178,
    },
    {
      title: '红烧肉',
      description: '肥而不腻，入口即化的经典中式红烧肉。',
      coverImage: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=400&fit=crop',
      ingredients: [
        { name: '五花肉', quantity: '500g', order: 1 },
        { name: '冰糖', quantity: '30g', order: 2 },
        { name: '生抽', quantity: '2勺', order: 3 },
        { name: '老抽', quantity: '1勺', order: 4 },
        { name: '料酒', quantity: '2勺', order: 5 },
        { name: '八角', quantity: '2个', order: 6 },
        { name: '桂皮', quantity: '1小块', order: 7 },
        { name: '姜片', quantity: '3片', order: 8 },
        { name: '葱段', quantity: '适量', order: 9 },
      ],
      steps: [
        { order: 1, content: '五花肉切块，冷水下锅焯水去腥' },
        { order: 2, content: '锅中放少许油，加入冰糖小火炒出糖色' },
        { order: 3, content: '放入五花肉翻炒上色' },
        { order: 4, content: '加入生抽、老抽、料酒调味' },
        { order: 5, content: '加入八角、桂皮、姜片、葱段和没过肉的热水' },
        { order: 6, content: '大火烧开后转小火炖60分钟' },
        { order: 7, content: '大火收汁，汤汁浓稠即可出锅' },
      ],
      tags: ['中餐', '家常菜', '肉类'],
      rating: 4.9,
      ratingCount: 342,
      favoriteCount: 684,
    },
    {
      title: '芒果班戟',
      description: '港式经典甜品，薄薄的班戟皮裹着新鲜芒果和奶油。',
      coverImage: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&h=450&fit=crop',
      ingredients: [
        { name: '低筋面粉', quantity: '100g', order: 1 },
        { name: '鸡蛋', quantity: '2个', order: 2 },
        { name: '牛奶', quantity: '200ml', order: 3 },
        { name: '糖粉', quantity: '50g', order: 4 },
        { name: '淡奶油', quantity: '200ml', order: 5 },
        { name: '芒果', quantity: '2个', order: 6 },
        { name: '黄油', quantity: '20g', order: 7 },
      ],
      steps: [
        { order: 1, content: '鸡蛋打散，加入牛奶和融化的黄油' },
        { order: 2, content: '筛入低筋面粉和糖粉，搅拌至顺滑无颗粒' },
        { order: 3, content: '平底锅小火，倒入一勺面糊摊成薄饼' },
        { order: 4, content: '每张饼煎至两面微黄，晾凉备用' },
        { order: 5, content: '淡奶油加糖打发至硬性发泡' },
        { order: 6, content: '芒果切块' },
        { order: 7, content: '饼皮中间放奶油和芒果，包成四方形即可' },
      ],
      tags: ['甜点', '港式', '烘焙'],
      rating: 4.6,
      ratingCount: 167,
      favoriteCount: 334,
    },
    {
      title: '麻婆豆腐',
      description: '川菜经典，麻辣鲜香，豆腐嫩滑，配米饭绝配。',
      coverImage: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&h=400&fit=crop',
      ingredients: [
        { name: '嫩豆腐', quantity: '1盒', order: 1 },
        { name: '牛肉末', quantity: '100g', order: 2 },
        { name: '郫县豆瓣酱', quantity: '1勺', order: 3 },
        { name: '豆豉', quantity: '1小勺', order: 4 },
        { name: '花椒粉', quantity: '适量', order: 5 },
        { name: '蒜末', quantity: '适量', order: 6 },
        { name: '葱花', quantity: '适量', order: 7 },
        { name: '生抽', quantity: '1勺', order: 8 },
      ],
      steps: [
        { order: 1, content: '豆腐切块，用盐水浸泡5分钟' },
        { order: 2, content: '锅中放油，炒香牛肉末盛出' },
        { order: 3, content: '锅中留底油，炒香豆瓣酱和豆豉' },
        { order: 4, content: '加入蒜末炒香，加适量水烧开' },
        { order: 5, content: '放入豆腐和牛肉末，轻轻推动' },
        { order: 6, content: '加生抽调味，水淀粉勾芡' },
        { order: 7, content: '出锅前撒花椒粉和葱花' },
      ],
      tags: ['中餐', '川菜', '家常菜', '辣'],
      rating: 4.7,
      ratingCount: 223,
      favoriteCount: 446,
    },
  ];

  const bcrypt = require('bcryptjs');

  for (let i = 0; i < demoUsers.length; i++) {
    const user = demoUsers[i];
    const passwordHash = bcrypt.hashSync(user.password, 10);
    const userId = insertUser.run(user.username, user.email, passwordHash, user.avatar).lastInsertRowid as number;

    for (const recipe of demoRecipes) {
      const recipeId = insertRecipe.run(
        recipe.title,
        recipe.description,
        recipe.coverImage,
        userId,
        recipe.rating,
        recipe.ratingCount,
        recipe.favoriteCount
      ).lastInsertRowid as number;

      for (const ing of recipe.ingredients) {
        insertIngredient.run(recipeId, ing.name, ing.quantity, ing.order);
      }

      for (const step of recipe.steps) {
        insertStep.run(recipeId, step.order, step.content, null);
      }

      for (const tag of recipe.tags) {
        insertTag.run(recipeId, tag);
      }
    }
  }
}

export interface RecipeWithAuthor {
  id: number;
  title: string;
  description: string;
  cover_image: string;
  author_id: number;
  author_name: string;
  author_avatar: string | null;
  created_at: string;
  rating: number;
  rating_count: number;
  favorite_count: number;
}

export interface RecipeDetail extends RecipeWithAuthor {
  ingredients: { name: string; quantity: string }[];
  steps: { order: number; content: string; image: string | null }[];
  tags: string[];
}

const getRecipeWithAuthorStmt = db.prepare(`
  SELECT r.*, u.username as author_name, u.avatar as author_avatar
  FROM recipe r
  JOIN user u ON r.author_id = u.id
  WHERE r.id = ?
`);

const getRecipeListStmt = db.prepare(`
  SELECT r.*, u.username as author_name, u.avatar as author_avatar
  FROM recipe r
  JOIN user u ON r.author_id = u.id
  ORDER BY r.rating DESC, r.created_at DESC
  LIMIT ? OFFSET ?
`);

const getRecipeByTagStmt = db.prepare(`
  SELECT r.*, u.username as author_name, u.avatar as author_avatar
  FROM recipe r
  JOIN user u ON r.author_id = u.id
  JOIN recipe_tag rt ON r.id = rt.recipe_id
  WHERE rt.tag = ?
  ORDER BY r.rating DESC, r.created_at DESC
  LIMIT ? OFFSET ?
`);

const getIngredientsStmt = db.prepare(`
  SELECT name, quantity FROM ingredient WHERE recipe_id = ? ORDER BY sort_order
`);

const getStepsStmt = db.prepare(`
  SELECT "order", content, image FROM step WHERE recipe_id = ? ORDER BY "order"
`);

const getTagsStmt = db.prepare(`
  SELECT tag FROM recipe_tag WHERE recipe_id = ?
`);

const searchRecipesStmt = db.prepare(`
  SELECT DISTINCT r.*, u.username as author_name, u.avatar as author_avatar
  FROM recipe r
  JOIN user u ON r.author_id = u.id
  LEFT JOIN recipe_tag rt ON r.id = rt.recipe_id
  LEFT JOIN ingredient i ON r.id = i.recipe_id
  WHERE r.title LIKE ? OR rt.tag LIKE ? OR i.name LIKE ?
  ORDER BY r.rating DESC, r.created_at DESC
  LIMIT 20
`);

const getAllIngredientsStmt = db.prepare(`
  SELECT DISTINCT name FROM ingredient ORDER BY name
`);

const getRecipeIngredientsStmt = db.prepare(`
  SELECT DISTINCT recipe_id, name FROM ingredient
`);

const insertRecipeStmt = db.prepare(`
  INSERT INTO recipe (title, description, cover_image, author_id)
  VALUES (?, ?, ?, ?)
`);

export function getRecipeById(id: number): RecipeDetail | null {
  const recipe = getRecipeWithAuthorStmt.get(id) as RecipeWithAuthor | undefined;
  if (!recipe) return null;

  const ingredients = getIngredientsStmt.all(id) as { name: string; quantity: string }[];
  const steps = getStepsStmt.all(id) as { order: number; content: string; image: string | null }[];
  const tags = (getTagsStmt.all(id) as { tag: string }[]).map(t => t.tag);

  return {
    ...recipe,
    ingredients,
    steps,
    tags,
  };
}

export function getRecipeList(page: number, limit: number, tag?: string): RecipeWithAuthor[] {
  const offset = (page - 1) * limit;
  if (tag) {
    return getRecipeByTagStmt.all(tag, limit, offset) as RecipeWithAuthor[];
  }
  return getRecipeListStmt.all(limit, offset) as RecipeWithAuthor[];
}

export function searchRecipes(query: string): RecipeWithAuthor[] {
  const searchTerm = `%${query}%`;
  return searchRecipesStmt.all(searchTerm, searchTerm, searchTerm) as RecipeWithAuthor[];
}

export function getAllIngredients(): string[] {
  return (getAllIngredientsStmt.all() as { name: string }[]).map(i => i.name);
}

export interface MatchResult {
  recipe: RecipeDetail;
  matchScore: number;
  matchedIngredients: string[];
  missingIngredients: string[];
}

export function matchRecipesByIngredients(ingredientList: string[]): MatchResult[] {
  const lowerIngredients = ingredientList.map(i => i.toLowerCase().trim());
  const allRecipeIngredients = getRecipeIngredientsStmt.all() as { recipe_id: number; name: string }[];

  const recipeIngredientMap = new Map<number, string[]>();
  for (const ri of allRecipeIngredients) {
    if (!recipeIngredientMap.has(ri.recipe_id)) {
      recipeIngredientMap.set(ri.recipe_id, []);
    }
    recipeIngredientMap.get(ri.recipe_id)!.push(ri.name.toLowerCase());
  }

  const results: MatchResult[] = [];

  for (const [recipeId, recipeIngredients] of recipeIngredientMap) {
    const matched: string[] = [];
    const missing: string[] = [];

    for (const ri of recipeIngredients) {
      if (lowerIngredients.some(li => ri.includes(li) || li.includes(ri))) {
        matched.push(ri);
      } else {
        missing.push(ri);
      }
    }

    if (matched.length > 0) {
      const matchScore = matched.length / recipeIngredients.length;
      const recipe = getRecipeById(recipeId);
      if (recipe) {
        results.push({
          recipe,
          matchScore,
          matchedIngredients: matched,
          missingIngredients: missing,
        });
      }
    }
  }

  results.sort((a, b) => b.matchScore - a.matchScore || b.recipe.rating - a.recipe.rating);
  return results.slice(0, 20);
}

export function createRecipe(
  title: string,
  description: string,
  coverImage: string,
  authorId: number,
  ingredients: { name: string; quantity: string }[],
  steps: { order: number; content: string; image?: string }[],
  tags: string[]
): number {
  const tx = db.transaction(() => {
    const recipeId = insertRecipeStmt.run(title, description, coverImage, authorId).lastInsertRowid as number;

    const insertIng = db.prepare('INSERT INTO ingredient (recipe_id, name, quantity, sort_order) VALUES (?, ?, ?, ?)');
    ingredients.forEach((ing, idx) => {
      insertIng.run(recipeId, ing.name, ing.quantity, idx + 1);
    });

    const insertStep = db.prepare('INSERT INTO step (recipe_id, "order", content, image) VALUES (?, ?, ?, ?)');
    steps.forEach(step => {
      insertStep.run(recipeId, step.order, step.content, step.image || null);
    });

    const insertTag = db.prepare('INSERT OR IGNORE INTO recipe_tag (recipe_id, tag) VALUES (?, ?)');
    tags.forEach(tag => {
      insertTag.run(recipeId, tag);
    });

    return recipeId;
  });

  return tx();
}

export function rateRecipe(userId: number, recipeId: number, rating: number): { newRating: number; ratingCount: number } {
  const tx = db.transaction(() => {
    db.prepare('INSERT OR REPLACE INTO rating (user_id, recipe_id, rating) VALUES (?, ?, ?)').run(userId, recipeId, rating);

    const stats = db.prepare('SELECT AVG(rating) as avg, COUNT(*) as count FROM rating WHERE recipe_id = ?').get(recipeId) as { avg: number; count: number };

    db.prepare('UPDATE recipe SET rating = ?, rating_count = ? WHERE id = ?').run(stats.avg, stats.count, recipeId);

    return { newRating: Math.round(stats.avg * 10) / 10, ratingCount: stats.count };
  });

  return tx();
}

export function toggleFavorite(userId: number, recipeId: number): { isFavorited: boolean; favoriteCount: number } {
  const tx = db.transaction(() => {
    const existing = db.prepare('SELECT 1 FROM favorite WHERE user_id = ? AND recipe_id = ?').get(userId, recipeId);

    let isFavorited: boolean;
    if (existing) {
      db.prepare('DELETE FROM favorite WHERE user_id = ? AND recipe_id = ?').run(userId, recipeId);
      isFavorited = false;
    } else {
      db.prepare('INSERT INTO favorite (user_id, recipe_id) VALUES (?, ?)').run(userId, recipeId);
      isFavorited = true;
    }

    const count = (db.prepare('SELECT COUNT(*) as count FROM favorite WHERE recipe_id = ?').get(recipeId) as { count: number }).count;
    db.prepare('UPDATE recipe SET favorite_count = ? WHERE id = ?').run(count, recipeId);

    return { isFavorited, favoriteCount: count };
  });

  return tx();
}

export function isFavorited(userId: number, recipeId: number): boolean {
  return !!db.prepare('SELECT 1 FROM favorite WHERE user_id = ? AND recipe_id = ?').get(userId, recipeId);
}

export interface CommentWithUser {
  id: number;
  recipe_id: number;
  user_id: number;
  username: string;
  avatar: string | null;
  content: string;
  created_at: string;
}

export function getComments(recipeId: number): CommentWithUser[] {
  return db.prepare(`
    SELECT c.*, u.username, u.avatar
    FROM comment c
    JOIN user u ON c.user_id = u.id
    WHERE c.recipe_id = ?
    ORDER BY c.created_at DESC
  `).all(recipeId) as CommentWithUser[];
}

export function addComment(userId: number, recipeId: number, content: string): CommentWithUser {
  const id = db.prepare('INSERT INTO comment (user_id, recipe_id, content) VALUES (?, ?, ?)').run(userId, recipeId, content).lastInsertRowid as number;

  return db.prepare(`
    SELECT c.*, u.username, u.avatar
    FROM comment c
    JOIN user u ON c.user_id = u.id
    WHERE c.id = ?
  `).get(id) as CommentWithUser;
}

export function getSuggestions(prefix: string): string[] {
  const searchTerm = `${prefix}%`;
  const results = db.prepare(`
    SELECT DISTINCT tag as text FROM recipe_tag WHERE tag LIKE ?
    UNION
    SELECT DISTINCT title as text FROM recipe WHERE title LIKE ?
    UNION
    SELECT DISTINCT name as text FROM ingredient WHERE name LIKE ?
    LIMIT 10
  `).all(searchTerm, searchTerm, searchTerm) as { text: string }[];

  return results.map(r => r.text);
}

export function getRelatedRecipes(recipeId: number, tags: string[], limit: number = 4): RecipeWithAuthor[] {
  if (tags.length === 0) return [];

  const placeholders = tags.map(() => '?').join(',');
  const query = `
    SELECT DISTINCT r.*, u.username as author_name, u.avatar as author_avatar
    FROM recipe r
    JOIN user u ON r.author_id = u.id
    JOIN recipe_tag rt ON r.id = rt.recipe_id
    WHERE r.id != ? AND rt.tag IN (${placeholders})
    ORDER BY r.rating DESC, r.created_at DESC
    LIMIT ?
  `;

  return db.prepare(query).all(recipeId, ...tags, limit) as RecipeWithAuthor[];
}

export { db };
