import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'data.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    image TEXT,
    prep_time INTEGER,
    cook_time INTEGER,
    servings INTEGER,
    difficulty TEXT,
    user_id INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount TEXT
  );

  CREATE TABLE IF NOT EXISTS recipe_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    description TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS recipe_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
    tag TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    rating INTEGER CHECK(rating >= 1 AND rating <= 5),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, recipe_id)
  );
`);

export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  avatar: string | null;
  created_at: string;
}

export interface Recipe {
  id: number;
  title: string;
  description: string | null;
  image: string | null;
  prep_time: number | null;
  cook_time: number | null;
  servings: number | null;
  difficulty: string | null;
  user_id: number | null;
  created_at: string;
  ingredients?: RecipeIngredient[];
  steps?: RecipeStep[];
  tags?: RecipeTag[];
  avg_rating?: number;
  comment_count?: number;
}

export interface RecipeIngredient {
  id: number;
  recipe_id: number;
  name: string;
  amount: string | null;
}

export interface RecipeStep {
  id: number;
  recipe_id: number;
  step_order: number;
  description: string;
}

export interface RecipeTag {
  id: number;
  recipe_id: number;
  tag: string;
}

export interface Comment {
  id: number;
  recipe_id: number;
  user_id: number;
  content: string;
  rating: number | null;
  created_at: string;
  username?: string;
  avatar?: string | null;
}

export interface Favorite {
  id: number;
  user_id: number;
  recipe_id: number;
  created_at: string;
}

export const createUser = db.transaction(
  (username: string, email: string, password: string): number => {
    const stmt = db.prepare(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)'
    );
    const result = stmt.run(username, email, password);
    return Number(result.lastInsertRowid);
  }
);

export const getUserByUsername = (username: string): User | undefined => {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;
};

export const getUserById = (id: number): User | undefined => {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
};

export const getUserByEmail = (email: string): User | undefined => {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
};

export const createRecipe = db.transaction(
  (
    data: Omit<Recipe, 'id' | 'created_at' | 'ingredients' | 'steps' | 'tags' | 'avg_rating' | 'comment_count'>
  ): number => {
    const stmt = db.prepare(`
      INSERT INTO recipes (title, description, image, prep_time, cook_time, servings, difficulty, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.title,
      data.description ?? null,
      data.image ?? null,
      data.prep_time ?? null,
      data.cook_time ?? null,
      data.servings ?? null,
      data.difficulty ?? null,
      data.user_id ?? null
    );
    return Number(result.lastInsertRowid);
  }
);

const attachRecipeExtras = (recipe: Recipe): Recipe => {
  if (!recipe) return recipe;
  recipe.ingredients = db
    .prepare('SELECT * FROM recipe_ingredients WHERE recipe_id = ? ORDER BY id')
    .all(recipe.id) as RecipeIngredient[];
  recipe.steps = db
    .prepare('SELECT * FROM recipe_steps WHERE recipe_id = ? ORDER BY step_order')
    .all(recipe.id) as RecipeStep[];
  recipe.tags = db
    .prepare('SELECT * FROM recipe_tags WHERE recipe_id = ? ORDER BY id')
    .all(recipe.id) as RecipeTag[];
  const ratingRow = db
    .prepare('SELECT AVG(rating) as avg, COUNT(*) as count FROM comments WHERE recipe_id = ? AND rating IS NOT NULL')
    .get(recipe.id) as { avg: number | null; count: number };
  recipe.avg_rating = ratingRow.avg ? Math.round(ratingRow.avg * 10) / 10 : 0;
  recipe.comment_count = ratingRow.count;
  return recipe;
};

export const getRecipeById = (id: number): Recipe | undefined => {
  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(id) as Recipe | undefined;
  if (!recipe) return undefined;
  return attachRecipeExtras(recipe);
};

export const getRecipes = (page: number = 1, limit: number = 10, tag?: string): { recipes: Recipe[]; total: number } => {
  const offset = (page - 1) * limit;
  let recipes: Recipe[];
  let total: number;

  if (tag) {
    recipes = db
      .prepare(
        `SELECT r.* FROM recipes r
         INNER JOIN recipe_tags rt ON r.id = rt.recipe_id
         WHERE rt.tag = ?
         ORDER BY r.created_at DESC
         LIMIT ? OFFSET ?`
      )
      .all(tag, limit, offset) as Recipe[];
    const totalRow = db
      .prepare(
        `SELECT COUNT(DISTINCT r.id) as count FROM recipes r
         INNER JOIN recipe_tags rt ON r.id = rt.recipe_id
         WHERE rt.tag = ?`
      )
      .get(tag) as { count: number };
    total = totalRow.count;
  } else {
    recipes = db
      .prepare('SELECT * FROM recipes ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .all(limit, offset) as Recipe[];
    const totalRow = db.prepare('SELECT COUNT(*) as count FROM recipes').get() as { count: number };
    total = totalRow.count;
  }

  return { recipes: recipes.map(attachRecipeExtras), total };
};

export const getRecipesByTag = (tag: string): Recipe[] => {
  const recipes = db
    .prepare(
      `SELECT r.* FROM recipes r
       INNER JOIN recipe_tags rt ON r.id = rt.recipe_id
       WHERE rt.tag = ?
       ORDER BY r.created_at DESC`
    )
    .all(tag) as Recipe[];
  return recipes.map(attachRecipeExtras);
};

export const searchRecipes = (query: string): Recipe[] => {
  const likeQuery = `%${query}%`;
  const recipes = db
    .prepare(
      `SELECT DISTINCT r.* FROM recipes r
       LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
       LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
       WHERE r.title LIKE ?
          OR r.description LIKE ?
          OR rt.tag LIKE ?
          OR ri.name LIKE ?
       ORDER BY r.created_at DESC`
    )
    .all(likeQuery, likeQuery, likeQuery, likeQuery) as Recipe[];
  return recipes.map(attachRecipeExtras);
};

export const getRecipesByIngredients = (ingredients: string[]): (Recipe & { match_count: number; match_score: number })[] => {
  if (ingredients.length === 0) return [];

  const placeholders = ingredients.map(() => '?').join(',');
  const lowerIngredients = ingredients.map((i) => i.toLowerCase());

  const recipes = db
    .prepare(
      `SELECT DISTINCT r.* FROM recipes r
       INNER JOIN recipe_ingredients ri ON r.id = ri.recipe_id
       WHERE LOWER(ri.name) IN (${placeholders})
       ORDER BY r.created_at DESC`
    )
    .all(...lowerIngredients) as Recipe[];

  const result = recipes.map((recipe) => {
    const ings = db
      .prepare('SELECT LOWER(name) as name FROM recipe_ingredients WHERE recipe_id = ?')
      .all(recipe.id) as { name: string }[];
    const ingredientNames = ings.map((i) => i.name);
    const matches = lowerIngredients.filter((ing) =>
      ingredientNames.some((name) => name.includes(ing) || ing.includes(name))
    );
    return {
      ...attachRecipeExtras(recipe),
      match_count: matches.length,
      match_score: ingredientNames.length > 0 ? matches.length / ingredientNames.length : 0,
    };
  });

  return result.sort((a, b) => b.match_count - a.match_count || b.match_score - a.match_score);
};

export const addIngredients = db.transaction((recipeId: number, ingredients: { name: string; amount?: string }[]) => {
  const stmt = db.prepare('INSERT INTO recipe_ingredients (recipe_id, name, amount) VALUES (?, ?, ?)');
  for (const ing of ingredients) {
    stmt.run(recipeId, ing.name, ing.amount ?? null);
  }
});

export const addSteps = db.transaction((recipeId: number, steps: { step_order: number; description: string }[]) => {
  const stmt = db.prepare('INSERT INTO recipe_steps (recipe_id, step_order, description) VALUES (?, ?, ?)');
  for (const step of steps) {
    stmt.run(recipeId, step.step_order, step.description);
  }
});

export const addTags = db.transaction((recipeId: number, tags: string[]) => {
  const stmt = db.prepare('INSERT INTO recipe_tags (recipe_id, tag) VALUES (?, ?)');
  for (const tag of tags) {
    stmt.run(recipeId, tag);
  }
});

export const createComment = (
  recipeId: number,
  userId: number,
  content: string,
  rating?: number
): number => {
  const stmt = db.prepare(
    'INSERT INTO comments (recipe_id, user_id, content, rating) VALUES (?, ?, ?, ?)'
  );
  const result = stmt.run(recipeId, userId, content, rating ?? null);
  return Number(result.lastInsertRowid);
};

export const getCommentsByRecipeId = (recipeId: number): Comment[] => {
  return db
    .prepare(
      `SELECT c.*, u.username, u.avatar
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.recipe_id = ?
       ORDER BY c.created_at DESC`
    )
    .all(recipeId) as Comment[];
};

export const addRating = (recipeId: number, userId: number, rating: number): void => {
  const existing = db
    .prepare('SELECT id FROM comments WHERE recipe_id = ? AND user_id = ?')
    .get(recipeId, userId) as { id: number } | undefined;
  if (existing) {
    db.prepare('UPDATE comments SET rating = ? WHERE id = ?').run(rating, existing.id);
  } else {
    db.prepare('INSERT INTO comments (recipe_id, user_id, content, rating) VALUES (?, ?, ?, ?)').run(
      recipeId,
      userId,
      '',
      rating
    );
  }
};

export const toggleFavorite = (userId: number, recipeId: number): { favorited: boolean } => {
  const existing = db
    .prepare('SELECT id FROM favorites WHERE user_id = ? AND recipe_id = ?')
    .get(userId, recipeId) as { id: number } | undefined;
  if (existing) {
    db.prepare('DELETE FROM favorites WHERE id = ?').run(existing.id);
    return { favorited: false };
  } else {
    db.prepare('INSERT INTO favorites (user_id, recipe_id) VALUES (?, ?)').run(userId, recipeId);
    return { favorited: true };
  }
};

export const getFavoritesByUserId = (userId: number): Recipe[] => {
  const recipes = db
    .prepare(
      `SELECT r.* FROM recipes r
       INNER JOIN favorites f ON r.id = f.recipe_id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC`
    )
    .all(userId) as Recipe[];
  return recipes.map(attachRecipeExtras);
};

export const isFavorited = (userId: number, recipeId: number): boolean => {
  const row = db
    .prepare('SELECT id FROM favorites WHERE user_id = ? AND recipe_id = ?')
    .get(userId, recipeId) as { id: number } | undefined;
  return !!row;
};

export const getAllTags = (): string[] => {
  const rows = db.prepare('SELECT DISTINCT tag FROM recipe_tags ORDER BY tag').all() as { tag: string }[];
  return rows.map((r) => r.tag);
};

const seedData = () => {
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
  if (userCount > 0) return;

  const hash = bcrypt.hashSync('password123', 10);
  const userId1 = createUser('美食家小明', 'xiaoming@example.com', hash);
  const userId2 = createUser('烘焙达人', 'baker@example.com', hash);

    const sampleRecipes = [
      {
        title: '红烧肉',
        description: '经典家常菜，肥而不腻，入口即化',
        image: 'https://images.unsplash.com/photo-1623595119708-26b1f7500ddd?w=800',
        prep_time: 15,
        cook_time: 90,
        servings: 4,
        difficulty: '中等',
        user_id: userId1,
        ingredients: [
          { name: '五花肉', amount: '500g' },
          { name: '生抽', amount: '3汤匙' },
          { name: '老抽', amount: '1汤匙' },
          { name: '冰糖', amount: '30g' },
          { name: '料酒', amount: '2汤匙' },
          { name: '八角', amount: '2个' },
          { name: '桂皮', amount: '1小块' },
          { name: '葱段', amount: '适量' },
          { name: '姜片', amount: '适量' },
        ],
        steps: [
          { step_order: 1, description: '五花肉切块，冷水下锅焯水去血沫，捞出沥干' },
          { step_order: 2, description: '锅中放少许油，加冰糖小火炒出糖色' },
          { step_order: 3, description: '放入五花肉翻炒上色' },
          { step_order: 4, description: '加入葱姜、八角、桂皮、料酒、生抽、老抽翻炒' },
          { step_order: 5, description: '加入没过肉块的热水，大火烧开后转小火炖60分钟' },
          { step_order: 6, description: '大火收汁至浓稠即可出锅' },
        ],
        tags: ['中餐', '家常菜', '肉类'],
      },
      {
        title: '番茄炒蛋',
        description: '最简单也最下饭的国民家常菜',
        image: 'https://images.unsplash.com/photo-1607532941433-304659e8198a?w=800',
        prep_time: 5,
        cook_time: 10,
        servings: 2,
        difficulty: '简单',
        user_id: userId1,
        ingredients: [
          { name: '番茄', amount: '2个' },
          { name: '鸡蛋', amount: '3个' },
          { name: '葱花', amount: '适量' },
          { name: '盐', amount: '适量' },
          { name: '糖', amount: '1茶匙' },
        ],
        steps: [
          { step_order: 1, description: '番茄切块，鸡蛋打散加少许盐' },
          { step_order: 2, description: '热锅冷油，倒入蛋液炒至凝固盛出' },
          { step_order: 3, description: '锅中再加少许油，放入番茄翻炒出汁' },
          { step_order: 4, description: '加盐和糖调味，倒入炒好的鸡蛋翻炒均匀' },
          { step_order: 5, description: '撒上葱花出锅' },
        ],
        tags: ['中餐', '家常菜', '快手菜', '低卡'],
      },
      {
        title: '提拉米苏',
        description: '意大利经典甜品，浓郁咖啡与马斯卡彭的完美结合',
        image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800',
        prep_time: 30,
        cook_time: 0,
        servings: 6,
        difficulty: '中等',
        user_id: userId2,
        ingredients: [
          { name: '马斯卡彭奶酪', amount: '500g' },
          { name: '手指饼干', amount: '200g' },
          { name: '浓缩咖啡', amount: '200ml' },
          { name: '鸡蛋', amount: '4个' },
          { name: '细砂糖', amount: '100g' },
          { name: '淡奶油', amount: '200ml' },
          { name: '可可粉', amount: '适量' },
        ],
        steps: [
          { step_order: 1, description: '蛋黄加糖隔水加热打发至颜色变浅' },
          { step_order: 2, description: '加入马斯卡彭奶酪搅拌均匀' },
          { step_order: 3, description: '淡奶油打发至6分发，拌入奶酪糊' },
          { step_order: 4, description: '蛋白打发至硬性发泡，分次拌入' },
          { step_order: 5, description: '手指饼干快速蘸咖啡铺底，抹一层奶酪糊' },
          { step_order: 6, description: '重复铺层，冷藏4小时以上，食用前筛可可粉' },
        ],
        tags: ['甜点', '烘焙', '西餐'],
      },
      {
        title: '清蒸鲈鱼',
        description: '鲜嫩滑口的粤式经典，保留鱼的原汁原味',
        image: 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=800',
        prep_time: 15,
        cook_time: 12,
        servings: 3,
        difficulty: '简单',
        user_id: userId1,
        ingredients: [
          { name: '鲈鱼', amount: '1条(约500g)' },
          { name: '姜丝', amount: '适量' },
          { name: '葱丝', amount: '适量' },
          { name: '蒸鱼豉油', amount: '3汤匙' },
          { name: '料酒', amount: '1汤匙' },
        ],
        steps: [
          { step_order: 1, description: '鲈鱼处理干净，两面划几刀，抹少许料酒和盐腌制10分钟' },
          { step_order: 2, description: '鱼身铺姜丝，水烧开后上锅大火蒸8分钟' },
          { step_order: 3, description: '取出倒掉盘中蒸出的水，铺上葱丝' },
          { step_order: 4, description: '淋上蒸鱼豉油，浇上热油激发出香味' },
        ],
        tags: ['中餐', '粤菜', '海鲜', '低卡'],
      },
      {
        title: '巧克力曲奇',
        description: '外酥内软，巧克力颗粒满满的经典曲奇',
        image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800',
        prep_time: 20,
        cook_time: 12,
        servings: 20,
        difficulty: '简单',
        user_id: userId2,
        ingredients: [
          { name: '黄油', amount: '226g' },
          { name: '红糖', amount: '150g' },
          { name: '白砂糖', amount: '100g' },
          { name: '鸡蛋', amount: '2个' },
          { name: '香草精', amount: '2茶匙' },
          { name: '低筋面粉', amount: '340g' },
          { name: '小苏打', amount: '1茶匙' },
          { name: '盐', amount: '1茶匙' },
          { name: '巧克力豆', amount: '300g' },
        ],
        steps: [
          { step_order: 1, description: '黄油软化后加红糖和白砂糖打发至蓬松' },
          { step_order: 2, description: '逐个加入鸡蛋和香草精搅拌均匀' },
          { step_order: 3, description: '面粉、小苏打、盐混合过筛，拌入黄油糊' },
          { step_order: 4, description: '加入巧克力豆拌匀' },
          { step_order: 5, description: '用冰淇淋勺挖取面团放在烤盘上，间隔留出空间' },
          { step_order: 6, description: '190度烤10-12分钟，边缘金黄即可' },
        ],
        tags: ['甜点', '烘焙', '零食'],
      },
      {
        title: '鸡胸肉沙拉',
        description: '高蛋白低脂的健康餐，健身必备',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
        prep_time: 20,
        cook_time: 15,
        servings: 2,
        difficulty: '简单',
        user_id: userId1,
        ingredients: [
          { name: '鸡胸肉', amount: '300g' },
          { name: '生菜', amount: '1棵' },
          { name: '小番茄', amount: '10颗' },
          { name: '黄瓜', amount: '1根' },
          { name: '牛油果', amount: '1个' },
          { name: '橄榄油', amount: '2汤匙' },
          { name: '柠檬汁', amount: '1汤匙' },
          { name: '黑胡椒', amount: '适量' },
          { name: '盐', amount: '适量' },
        ],
        steps: [
          { step_order: 1, description: '鸡胸肉用盐和黑胡椒腌制15分钟' },
          { step_order: 2, description: '平底锅加热，鸡胸肉煎至两面金黄熟透，切片备用' },
          { step_order: 3, description: '生菜切丝，小番茄对半切，黄瓜切片，牛油果切块' },
          { step_order: 4, description: '所有蔬菜放入碗中，加入鸡胸肉片' },
          { step_order: 5, description: '淋上橄榄油、柠檬汁，撒盐和黑胡椒拌匀' },
        ],
        tags: ['低卡', '健康', '健身', '沙拉'],
      },
      {
        title: '麻婆豆腐',
        description: '麻辣鲜香，四川名菜，超级下饭',
        image: 'https://images.unsplash.com/photo-1582452360549-521439210a0e?w=800',
        prep_time: 10,
        cook_time: 15,
        servings: 3,
        difficulty: '简单',
        user_id: userId1,
        ingredients: [
          { name: '嫩豆腐', amount: '400g' },
          { name: '牛肉末', amount: '100g' },
          { name: '豆瓣酱', amount: '2汤匙' },
          { name: '花椒粉', amount: '1茶匙' },
          { name: '蒜末', amount: '适量' },
          { name: '葱花', amount: '适量' },
          { name: '生抽', amount: '1汤匙' },
          { name: '淀粉水', amount: '适量' },
        ],
        steps: [
          { step_order: 1, description: '豆腐切小块，用盐水浸泡5分钟' },
          { step_order: 2, description: '锅中放油，炒香牛肉末至变色' },
          { step_order: 3, description: '加入豆瓣酱和蒜末炒出红油' },
          { step_order: 4, description: '加入适量水烧开，放入豆腐轻推均匀' },
          { step_order: 5, description: '加生抽调味，煮3分钟后淋淀粉水勾芡' },
          { step_order: 6, description: '出锅撒花椒粉和葱花' },
        ],
        tags: ['中餐', '川菜', '家常菜', '素食友好'],
      },
      {
        title: '芒果班戟',
        description: '港式经典甜品，薄软的班戟皮裹着新鲜芒果和奶油',
        image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800',
        prep_time: 40,
        cook_time: 10,
        servings: 8,
        difficulty: '中等',
        user_id: userId2,
        ingredients: [
          { name: '低筋面粉', amount: '80g' },
          { name: '鸡蛋', amount: '2个' },
          { name: '牛奶', amount: '200ml' },
          { name: '糖粉', amount: '30g' },
          { name: '黄油', amount: '20g' },
          { name: '淡奶油', amount: '300ml' },
          { name: '细砂糖', amount: '30g' },
          { name: '芒果', amount: '2个' },
        ],
        steps: [
          { step_order: 1, description: '鸡蛋打散，加糖粉、牛奶、融化黄油混合均匀' },
          { step_order: 2, description: '筛入低筋面粉搅拌至无颗粒，冷藏30分钟' },
          { step_order: 3, description: '平底锅小火，倒入一勺面糊摊成薄饼，凝固即可' },
          { step_order: 4, description: '淡奶油加细砂糖打发至硬性发泡' },
          { step_order: 5, description: '芒果去皮切块' },
          { step_order: 6, description: '班戟皮放凉，中间放奶油和芒果，包成四方形即可' },
        ],
        tags: ['甜点', '港式', '烘焙'],
      },
      {
        title: '酸辣土豆丝',
        description: '爽脆开胃，简单易学的经典素菜',
        image: 'https://images.unsplash.com/photo-1625938144755-652e08e359b7?w=800',
        prep_time: 15,
        cook_time: 8,
        servings: 2,
        difficulty: '简单',
        user_id: userId1,
        ingredients: [
          { name: '土豆', amount: '2个' },
          { name: '干辣椒', amount: '5个' },
          { name: '花椒', amount: '1茶匙' },
          { name: '蒜末', amount: '适量' },
          { name: '白醋', amount: '2汤匙' },
          { name: '生抽', amount: '1汤匙' },
          { name: '盐', amount: '适量' },
        ],
        steps: [
          { step_order: 1, description: '土豆去皮切细丝，用清水浸泡去除淀粉' },
          { step_order: 2, description: '热锅凉油，放入花椒和干辣椒小火炒香' },
          { step_order: 3, description: '捞出花椒，放入蒜末爆香' },
          { step_order: 4, description: '沥干土豆丝放入锅中大火快炒' },
          { step_order: 5, description: '淋白醋、加生抽和盐调味，翻炒均匀出锅' },
        ],
        tags: ['中餐', '家常菜', '素菜', '快手菜', '低卡'],
      },
      {
        title: '芝士蛋糕',
        description: '浓郁丝滑的经典重芝士蛋糕',
        image: 'https://images.unsplash.com/photo-1533134242443-d4fd2153d5c5?w=800',
        prep_time: 30,
        cook_time: 60,
        servings: 8,
        difficulty: '中等',
        user_id: userId2,
        ingredients: [
          { name: '消化饼干', amount: '150g' },
          { name: '黄油', amount: '70g' },
          { name: '奶油奶酪', amount: '500g' },
          { name: '细砂糖', amount: '100g' },
          { name: '鸡蛋', amount: '3个' },
          { name: '淡奶油', amount: '150ml' },
          { name: '柠檬汁', amount: '1汤匙' },
          { name: '香草精', amount: '1茶匙' },
        ],
        steps: [
          { step_order: 1, description: '消化饼干压碎，加入融化黄油拌匀，铺在6寸模底部压实冷藏' },
          { step_order: 2, description: '奶油奶酪软化后加糖搅拌至顺滑' },
          { step_order: 3, description: '逐个加入鸡蛋搅拌均匀，每次都要打匀再加' },
          { step_order: 4, description: '加入淡奶油、柠檬汁、香草精拌匀' },
          { step_order: 5, description: '倒入模具，用水浴法160度烤60分钟' },
          { step_order: 6, description: '关火后焖至自然冷却，冷藏4小时以上食用' },
        ],
        tags: ['甜点', '烘焙', '蛋糕'],
      },
    ];

    for (const recipe of sampleRecipes) {
      const recipeId = createRecipe({
        title: recipe.title,
        description: recipe.description,
        image: recipe.image,
        prep_time: recipe.prep_time,
        cook_time: recipe.cook_time,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        user_id: recipe.user_id,
      });
      addIngredients(recipeId, recipe.ingredients);
      addSteps(recipeId, recipe.steps);
      addTags(recipeId, recipe.tags);
    }
};

seedData();

export { db };
