import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { Recipe } from './types';
import recommendRecipes from './recommendation';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const db = new Database('recipes.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS recipes (
    id TEXT PRIMARY KEY,
    name TEXT,
    ingredients TEXT,
    steps TEXT,
    imageUrl TEXT,
    likes INTEGER DEFAULT 0,
    author TEXT,
    cuisineTags TEXT
  )
`);

function rowToRecipe(row: any): Recipe {
  return {
    id: row.id,
    name: row.name,
    ingredients: JSON.parse(row.ingredients),
    steps: row.steps,
    imageUrl: row.imageUrl,
    likes: row.likes,
    author: row.author,
    cuisineTags: JSON.parse(row.cuisineTags),
  };
}

const sampleRecipes: Recipe[] = [
  {
    id: uuidv4(),
    name: '番茄炒蛋',
    ingredients: ['番茄', '鸡蛋', '葱花', '盐', '糖'],
    steps: '1. 番茄切块，鸡蛋打散。2. 热锅下油，倒入蛋液炒至凝固盛出。3. 锅中再放少许油，下番茄翻炒出汁。4. 加入炒好的鸡蛋，调入盐和糖，撒葱花出锅。',
    imageUrl: '',
    likes: 128,
    author: '厨神小王',
    cuisineTags: ['家常', '快手'],
  },
  {
    id: uuidv4(),
    name: '红烧肉',
    ingredients: ['五花肉', '冰糖', '生抽', '老抽', '八角', '桂皮', '姜片', '葱段'],
    steps: '1. 五花肉切块焯水。2. 锅中放少许油，加冰糖炒糖色。3. 放入肉块翻炒上色。4. 加生抽、老抽、八角、桂皮、姜片、葱段，加开水没过肉。5. 小火炖45分钟，大火收汁。',
    imageUrl: '',
    likes: 256,
    author: '美食达人',
    cuisineTags: ['家常', '下饭菜', '肉类'],
  },
  {
    id: uuidv4(),
    name: '土豆丝',
    ingredients: ['土豆', '青椒', '醋', '盐', '蒜末', '干辣椒'],
    steps: '1. 土豆和青椒切丝，土豆丝泡水去淀粉。2. 热锅凉油，爆香蒜末和干辣椒。3. 下土豆丝大火快炒，加醋。4. 加入青椒丝，调盐，翻炒均匀出锅。',
    imageUrl: '',
    likes: 89,
    author: '素菜馆',
    cuisineTags: ['家常', '素菜', '快手'],
  },
  {
    id: uuidv4(),
    name: '宫保鸡丁',
    ingredients: ['鸡胸肉', '花生米', '干辣椒', '花椒', '葱', '姜', '蒜', '生抽', '醋', '糖', '淀粉'],
    steps: '1. 鸡肉切丁用淀粉腌制。2. 调碗汁：生抽、醋、糖、淀粉、水。3. 热锅下油，爆香干辣椒和花椒。4. 下鸡丁滑炒变色。5. 加葱姜蒜翻炒，倒入碗汁，最后加花生米翻匀出锅。',
    imageUrl: '',
    likes: 312,
    author: '川菜师傅',
    cuisineTags: ['川菜', '下饭菜', '经典'],
  },
];

const countRow = db.prepare('SELECT COUNT(*) as count FROM recipes').get() as { count: number };
if (countRow.count === 0) {
  const insertStmt = db.prepare(
    'INSERT INTO recipes (id, name, ingredients, steps, imageUrl, likes, author, cuisineTags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  for (const recipe of sampleRecipes) {
    insertStmt.run(
      recipe.id,
      recipe.name,
      JSON.stringify(recipe.ingredients),
      recipe.steps,
      recipe.imageUrl,
      recipe.likes,
      recipe.author,
      JSON.stringify(recipe.cuisineTags)
    );
  }
}

app.post('/api/recipes', (req, res) => {
  try {
    const { name, ingredients, steps, imageUrl, author, cuisineTags } = req.body;
    const id = uuidv4();
    const likes = 0;

    const stmt = db.prepare(
      'INSERT INTO recipes (id, name, ingredients, steps, imageUrl, likes, author, cuisineTags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run(
      id,
      name,
      JSON.stringify(ingredients || []),
      steps || '',
      imageUrl || '',
      likes,
      author || '',
      JSON.stringify(cuisineTags || [])
    );

    const newRecipe: Recipe = {
      id,
      name,
      ingredients: ingredients || [],
      steps: steps || '',
      imageUrl: imageUrl || '',
      likes,
      author: author || '',
      cuisineTags: cuisineTags || [],
    };

    res.json(newRecipe);
  } catch (err: any) {
    res.status(500).json({ error: err.message || '服务器错误' });
  }
});

app.get('/api/recipes', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM recipes').all();
    const recipes = rows.map(rowToRecipe);
    res.json(recipes);
  } catch (err: any) {
    res.status(500).json({ error: err.message || '服务器错误' });
  }
});

app.get('/api/recommend', (req, res) => {
  try {
    const ingredientsParam = req.query.ingredients as string;
    const ingredients = ingredientsParam
      ? ingredientsParam.split(',').filter((s) => s.trim().length > 0)
      : [];

    const rows = db.prepare('SELECT * FROM recipes').all();
    const recipes = rows.map(rowToRecipe);

    const results = recommendRecipes(ingredients, recipes);
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message || '服务器错误' });
  }
});

app.put('/api/recipes/:id/like', (req, res) => {
  try {
    const { id } = req.params;
    const row = db.prepare('SELECT * FROM recipes WHERE id = ?').get(id);

    if (!row) {
      res.status(500).json({ error: '菜谱不存在' });
      return;
    }

    const newLikes = (row as any).likes + 1;
    db.prepare('UPDATE recipes SET likes = ? WHERE id = ?').run(newLikes, id);

    const updatedRow = db.prepare('SELECT * FROM recipes WHERE id = ?').get(id);
    res.json(rowToRecipe(updatedRow));
  } catch (err: any) {
    res.status(500).json({ error: err.message || '服务器错误' });
  }
});

app.listen(PORT, () => {
  console.log('Server running on http://localhost:3001');
});
