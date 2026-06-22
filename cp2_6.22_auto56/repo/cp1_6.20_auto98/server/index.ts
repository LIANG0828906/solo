import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Recipe {
  id: string;
  name: string;
  image: string;
  description: string;
  cookTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  cuisine: string;
  ingredients: { name: string; amount: string }[];
  steps: { description: string; images: string[] }[];
  authorId: string;
  authorName: string;
  authorAvatar: string;
  isPublic: boolean;
  createdAt: string;
  rating: number;
  ratingCount: number;
}

interface User {
  id: string;
  username: string;
  passwordHash: string;
  avatar: string;
  favorites: string[];
  createdAt: string;
}

interface Comment {
  id: string;
  recipeId: string;
  userId: string;
  username: string;
  userAvatar: string;
  content: string;
  rating: number;
  createdAt: string;
}

interface DataSchema {
  recipes: Recipe[];
  users: User[];
  comments: Comment[];
}

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const recipesFile = path.join(dataDir, 'recipes.json');
const usersFile = path.join(dataDir, 'users.json');
const commentsFile = path.join(dataDir, 'comments.json');

if (!fs.existsSync(recipesFile)) {
  fs.writeFileSync(recipesFile, JSON.stringify({ recipes: [] }, null, 2));
}
if (!fs.existsSync(usersFile)) {
  fs.writeFileSync(usersFile, JSON.stringify({ users: [] }, null, 2));
}
if (!fs.existsSync(commentsFile)) {
  fs.writeFileSync(commentsFile, JSON.stringify({ comments: [] }, null, 2));
}

const recipesAdapter = new JSONFile<{ recipes: Recipe[] }>(recipesFile);
const usersAdapter = new JSONFile<{ users: User[] }>(usersFile);
const commentsAdapter = new JSONFile<{ comments: Comment[] }>(commentsFile);

const recipesDb = new Low(recipesAdapter, { recipes: [] });
const usersDb = new Low(usersAdapter, { users: [] });
const commentsDb = new Low(commentsAdapter, { comments: [] });

await recipesDb.read();
await usersDb.read();
await commentsDb.read();

if (recipesDb.data.recipes.length === 0) {
  const sampleRecipes: Recipe[] = [
    {
      id: uuidv4(),
      name: '红烧肉',
      image: 'https://images.unsplash.com/photo-1623689046286-f48be6fa12de?w=800&q=80',
      description: '经典家常菜，肥而不腻，入口即化',
      cookTime: 90,
      difficulty: 'medium',
      cuisine: '中餐',
      ingredients: [
        { name: '五花肉', amount: '500g' },
        { name: '冰糖', amount: '30g' },
        { name: '生抽', amount: '2勺' },
        { name: '老抽', amount: '1勺' },
        { name: '料酒', amount: '2勺' },
        { name: '姜片', amount: '5片' },
        { name: '八角', amount: '2个' },
        { name: '桂皮', amount: '1小块' }
      ],
      steps: [
        { description: '五花肉切成3厘米见方的块，冷水下锅焯水，撇去浮沫后捞出沥干。', images: ['https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&q=80'] },
        { description: '锅中放少许油，加入冰糖小火炒出糖色，注意不要炒糊。', images: ['https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80'] },
        { description: '放入五花肉翻炒均匀，让每块肉都裹上糖色。', images: ['https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=600&q=80'] },
        { description: '加入姜片、八角、桂皮、生抽、老抽、料酒翻炒出香味。', images: [] },
        { description: '加入没过肉的热水，大火烧开后转小火慢炖60分钟。', images: [] },
        { description: '最后大火收汁，汤汁浓稠裹满肉块即可出锅。', images: ['https://images.unsplash.com/photo-1623689046286-f48be6fa12de?w=600&q=80'] }
      ],
      authorId: 'sample-user-1',
      authorName: '美食达人',
      authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=foodie',
      isPublic: true,
      createdAt: new Date().toISOString(),
      rating: 4.5,
      ratingCount: 12
    },
    {
      id: uuidv4(),
      name: '意大利肉酱面',
      image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80',
      description: '正宗意式风味，浓郁肉酱配上Q弹意面',
      cookTime: 45,
      difficulty: 'easy',
      cuisine: '西餐',
      ingredients: [
        { name: '意大利面', amount: '200g' },
        { name: '牛肉末', amount: '200g' },
        { name: '番茄酱', amount: '3勺' },
        { name: '洋葱', amount: '半个' },
        { name: '大蒜', amount: '3瓣' },
        { name: '橄榄油', amount: '2勺' },
        { name: '盐', amount: '适量' },
        { name: '黑胡椒', amount: '适量' },
        { name: '帕玛森芝士', amount: '适量' }
      ],
      steps: [
        { description: '洋葱和大蒜切末备用。', images: [] },
        { description: '锅中放橄榄油，炒香洋葱和大蒜。', images: ['https://images.unsplash.com/photo-1596097635121-14b63bca1f57?w=600&q=80'] },
        { description: '加入牛肉末炒至变色。', images: [] },
        { description: '加入番茄酱，小火炖煮20分钟。', images: ['https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&q=80'] },
        { description: '同时另起一锅煮意大利面至八分熟。', images: [] },
        { description: '将煮好的意面拌入肉酱中，撒上芝士和黑胡椒即可。', images: ['https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80'] }
      ],
      authorId: 'sample-user-2',
      authorName: '西餐小厨',
      authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chef',
      isPublic: true,
      createdAt: new Date().toISOString(),
      rating: 4.2,
      ratingCount: 8
    },
    {
      id: uuidv4(),
      name: '日式照烧鸡腿',
      image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800&q=80',
      description: '甜咸适口的照烧酱汁，配上嫩滑鸡腿肉',
      cookTime: 30,
      difficulty: 'easy',
      cuisine: '日料',
      ingredients: [
        { name: '鸡腿', amount: '2只' },
        { name: '酱油', amount: '3勺' },
        { name: '味醂', amount: '2勺' },
        { name: '清酒', amount: '1勺' },
        { name: '白糖', amount: '1勺' },
        { name: '姜末', amount: '少许' },
        { name: '白芝麻', amount: '适量' }
      ],
      steps: [
        { description: '鸡腿去骨，用叉子在肉面戳几下方便入味。', images: [] },
        { description: '将酱油、味醂、清酒、白糖、姜末混合调成照烧汁。', images: [] },
        { description: '平底锅不放油，鸡皮朝下放入鸡腿，中小火煎至金黄。', images: ['https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&q=80'] },
        { description: '翻面继续煎至熟透。', images: [] },
        { description: '倒入照烧汁，小火收汁至浓稠，不断翻动让鸡肉均匀裹上酱汁。', images: [] },
        { description: '切片装盘，撒上白芝麻即可。', images: ['https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=600&q=80'] }
      ],
      authorId: 'sample-user-1',
      authorName: '美食达人',
      authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=foodie',
      isPublic: true,
      createdAt: new Date().toISOString(),
      rating: 4.7,
      ratingCount: 15
    },
    {
      id: uuidv4(),
      name: '番茄炒蛋',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
      description: '最简单也最经典的家常菜，酸甜可口',
      cookTime: 15,
      difficulty: 'easy',
      cuisine: '中餐',
      ingredients: [
        { name: '番茄', amount: '2个' },
        { name: '鸡蛋', amount: '3个' },
        { name: '葱花', amount: '适量' },
        { name: '盐', amount: '适量' },
        { name: '白糖', amount: '1勺' }
      ],
      steps: [
        { description: '番茄切块，鸡蛋打散备用。', images: [] },
        { description: '锅中热油，倒入蛋液炒至凝固盛出。', images: [] },
        { description: '锅中再放少许油，放入番茄翻炒出汁。', images: ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80'] },
        { description: '加入盐和白糖调味。', images: [] },
        { description: '倒入炒好的鸡蛋，翻炒均匀，撒上葱花即可。', images: [] }
      ],
      authorId: 'sample-user-2',
      authorName: '西餐小厨',
      authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chef',
      isPublic: true,
      createdAt: new Date().toISOString(),
      rating: 4.0,
      ratingCount: 20
    },
    {
      id: uuidv4(),
      name: '提拉米苏',
      image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&q=80',
      description: '意式经典甜点，浓郁咖啡香配上绵密口感',
      cookTime: 120,
      difficulty: 'hard',
      cuisine: '西餐',
      ingredients: [
        { name: '马斯卡彭奶酪', amount: '250g' },
        { name: '手指饼干', amount: '200g' },
        { name: '浓缩咖啡', amount: '200ml' },
        { name: '淡奶油', amount: '200ml' },
        { name: '细砂糖', amount: '50g' },
        { name: '蛋黄', amount: '3个' },
        { name: '可可粉', amount: '适量' },
        { name: '朗姆酒', amount: '1勺' }
      ],
      steps: [
        { description: '蛋黄加糖打发至颜色变浅、体积膨胀。', images: [] },
        { description: '加入马斯卡彭奶酪搅拌均匀。', images: [] },
        { description: '淡奶油打发至六成发，与奶酪糊混合。', images: ['https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&q=80'] },
        { description: '咖啡中加入朗姆酒，手指饼干快速蘸取咖啡液。', images: [] },
        { description: '一层饼干一层奶酪糊交替铺放，冷藏4小时以上。', images: [] },
        { description: '食用前筛上可可粉即可。', images: ['https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&q=80'] }
      ],
      authorId: 'sample-user-1',
      authorName: '美食达人',
      authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=foodie',
      isPublic: true,
      createdAt: new Date().toISOString(),
      rating: 4.8,
      ratingCount: 25
    },
    {
      id: uuidv4(),
      name: '寿司卷',
      image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80',
      description: '新鲜食材搭配醋饭，清爽美味的日式料理',
      cookTime: 60,
      difficulty: 'medium',
      cuisine: '日料',
      ingredients: [
        { name: '寿司米', amount: '300g' },
        { name: '海苔', amount: '4片' },
        { name: '黄瓜', amount: '1根' },
        { name: '胡萝卜', amount: '半根' },
        { name: '牛油果', amount: '1个' },
        { name: '蟹肉棒', amount: '4根' },
        { name: '寿司醋', amount: '3勺' },
        { name: '酱油', amount: '适量' },
        { name: '芥末', amount: '适量' }
      ],
      steps: [
        { description: '寿司米淘洗干净，加水浸泡30分钟后蒸熟。', images: [] },
        { description: '趁热拌入寿司醋，用扇子扇凉。', images: [] },
        { description: '黄瓜、胡萝卜、牛油果切成细条。', images: ['https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600&q=80'] },
        { description: '海苔铺在寿司帘上，均匀铺上一层米饭。', images: [] },
        { description: '中间放上馅料，用寿司帘卷紧。', images: [] },
        { description: '刀沾水，切成适口大小即可。', images: ['https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600&q=80'] }
      ],
      authorId: 'sample-user-2',
      authorName: '西餐小厨',
      authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chef',
      isPublic: true,
      createdAt: new Date().toISOString(),
      rating: 4.3,
      ratingCount: 10
    }
  ];
  recipesDb.data.recipes = sampleRecipes;
  await recipesDb.write();
}

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

app.use('/uploads', express.static(uploadDir));

app.get('/api/recipes', async (req, res) => {
  try {
    await recipesDb.read();
    let recipes = recipesDb.data.recipes.filter(r => r.isPublic);

    const { cuisine, difficulty, maxTime, search } = req.query;

    if (cuisine && cuisine !== 'all') {
      recipes = recipes.filter(r => r.cuisine === cuisine);
    }
    if (difficulty && difficulty !== 'all') {
      recipes = recipes.filter(r => r.difficulty === difficulty);
    }
    if (maxTime) {
      recipes = recipes.filter(r => r.cookTime <= Number(maxTime));
    }
    if (search) {
      const searchLower = String(search).toLowerCase();
      recipes = recipes.filter(r =>
        r.name.toLowerCase().includes(searchLower) ||
        r.description.toLowerCase().includes(searchLower)
      );
    }

    res.json(recipes);
  } catch (error) {
    res.status(500).json({ error: '获取菜谱列表失败' });
  }
});

app.get('/api/recipes/:id', async (req, res) => {
  try {
    await recipesDb.read();
    const recipe = recipesDb.data.recipes.find(r => r.id === req.params.id);
    if (!recipe) {
      return res.status(404).json({ error: '菜谱不存在' });
    }
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ error: '获取菜谱详情失败' });
  }
});

app.post('/api/recipes', upload.single('image'), async (req, res) => {
  try {
    await recipesDb.read();

    const recipeData = JSON.parse(req.body.recipe);
    const newRecipe: Recipe = {
      id: uuidv4(),
      ...recipeData,
      image: req.file ? `/uploads/${req.file.filename}` : recipeData.image,
      steps: recipeData.steps.map((step: any, index: number) => ({
        ...step,
        images: step.images || []
      })),
      createdAt: new Date().toISOString(),
      rating: 0,
      ratingCount: 0
    };

    recipesDb.data.recipes.unshift(newRecipe);
    await recipesDb.write();

    res.status(201).json(newRecipe);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '创建菜谱失败' });
  }
});

app.put('/api/recipes/:id', upload.single('image'), async (req, res) => {
  try {
    await recipesDb.read();
    const index = recipesDb.data.recipes.findIndex(r => r.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: '菜谱不存在' });
    }

    const recipeData = JSON.parse(req.body.recipe);
    const existingRecipe = recipesDb.data.recipes[index];

    const updatedRecipe: Recipe = {
      ...existingRecipe,
      ...recipeData,
      image: req.file ? `/uploads/${req.file.filename}` : (recipeData.image || existingRecipe.image),
      steps: recipeData.steps || existingRecipe.steps
    };

    recipesDb.data.recipes[index] = updatedRecipe;
    await recipesDb.write();

    res.json(updatedRecipe);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '更新菜谱失败' });
  }
});

app.delete('/api/recipes/:id', async (req, res) => {
  try {
    await recipesDb.read();
    const index = recipesDb.data.recipes.findIndex(r => r.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: '菜谱不存在' });
    }

    recipesDb.data.recipes.splice(index, 1);
    await recipesDb.write();

    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ error: '删除菜谱失败' });
  }
});

app.get('/api/recipes/user/:userId', async (req, res) => {
  try {
    await recipesDb.read();
    const recipes = recipesDb.data.recipes.filter(r => r.authorId === req.params.userId);
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ error: '获取用户菜谱失败' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    await usersDb.read();
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '请填写用户名和密码' });
    }

    const existingUser = usersDb.data.users.find(u => u.username === username);
    if (existingUser) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser: User = {
      id: uuidv4(),
      username,
      passwordHash,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      favorites: [],
      createdAt: new Date().toISOString()
    };

    usersDb.data.users.push(newUser);
    await usersDb.write();

    const { passwordHash: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '注册失败' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    await usersDb.read();
    const { username, password } = req.body;

    const user = usersDb.data.users.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: '登录失败' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    await usersDb.read();
    const user = usersDb.data.users.find(u => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    const { passwordHash: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

app.post('/api/users/:id/favorites', async (req, res) => {
  try {
    await usersDb.read();
    const userIndex = usersDb.data.users.findIndex(u => u.id === req.params.id);

    if (userIndex === -1) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const { recipeId } = req.body;
    const user = usersDb.data.users[userIndex];

    if (!user.favorites.includes(recipeId)) {
      user.favorites.push(recipeId);
      await usersDb.write();
    }

    res.json({ favorites: user.favorites });
  } catch (error) {
    res.status(500).json({ error: '收藏失败' });
  }
});

app.delete('/api/users/:id/favorites/:recipeId', async (req, res) => {
  try {
    await usersDb.read();
    const userIndex = usersDb.data.users.findIndex(u => u.id === req.params.id);

    if (userIndex === -1) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const user = usersDb.data.users[userIndex];
    user.favorites = user.favorites.filter(id => id !== req.params.recipeId);
    await usersDb.write();

    res.json({ favorites: user.favorites });
  } catch (error) {
    res.status(500).json({ error: '取消收藏失败' });
  }
});

app.get('/api/comments/recipe/:recipeId', async (req, res) => {
  try {
    await commentsDb.read();
    const comments = commentsDb.data.comments
      .filter(c => c.recipeId === req.params.recipeId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: '获取评论失败' });
  }
});

app.post('/api/comments', async (req, res) => {
  try {
    await commentsDb.read();
    const { recipeId, userId, username, userAvatar, content, rating } = req.body;

    const newComment: Comment = {
      id: uuidv4(),
      recipeId,
      userId,
      username,
      userAvatar,
      content,
      rating: rating || 0,
      createdAt: new Date().toISOString()
    };

    commentsDb.data.comments.unshift(newComment);
    await commentsDb.write();

    if (rating > 0) {
      await recipesDb.read();
      const recipeIndex = recipesDb.data.recipes.findIndex(r => r.id === recipeId);
      if (recipeIndex !== -1) {
        const recipe = recipesDb.data.recipes[recipeIndex];
        const oldTotal = recipe.rating * recipe.ratingCount;
        recipe.ratingCount += 1;
        recipe.rating = Math.round(((oldTotal + rating) / recipe.ratingCount) * 10) / 10;
        await recipesDb.write();
      }
    }

    res.status(201).json(newComment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '发布评论失败' });
  }
});

app.get('/api/ingredients/suggest', async (req, res) => {
  try {
    await recipesDb.read();
    const { q } = req.query;
    const query = String(q || '').toLowerCase();

    const allIngredients = new Set<string>();
    recipesDb.data.recipes.forEach(recipe => {
      recipe.ingredients.forEach(ing => {
        if (ing.name.toLowerCase().includes(query)) {
          allIngredients.add(ing.name);
        }
      });
    });

    res.json(Array.from(allIngredients).slice(0, 10));
  } catch (error) {
    res.status(500).json({ error: '获取食材建议失败' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
