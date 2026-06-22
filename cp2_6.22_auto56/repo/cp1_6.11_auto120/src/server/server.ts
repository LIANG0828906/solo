import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import {
  Dish,
  Ingredient,
  CookingMethod,
  Comment,
  Paginated,
  DEFAULT_EMOJI_MAP,
} from '../shared/types';
import { buildTopology } from './topology';
import { buildSeedDishes, DishSeedIngredient } from './seed';

const app = express();
const PORT = 5000;

app.use(express.json({ limit: '20mb' }));
app.use(cors());

const dishes = new Map<string, Dish>();
const comments = new Map<string, Comment[]>();

const avatarColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];

const buildAvatar = (name: string, idx: number): string => {
  const color = avatarColors[idx % avatarColors.length];
  const initial = name.charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="24" fill="${color}"/>
    <text x="24" y="30" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">${initial}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const commentTemplates = [
  { usernames: ['美食家小王', '吃货阿明', '厨艺达人', '厨房小白', '家常菜爱好者', '川菜狂热者', '养生达人', '夜宵党'], texts: [
    '太好吃了！全家都爱吃，下次还要做！',
    '按照菜谱做出来味道很正宗，谢谢分享！',
    '步骤清晰，新手也能轻松上手，太棒了！',
    '色香味俱全，朋友来做客都赞不绝口！',
    '这个搭配绝了，比外面餐厅做的还好吃！',
    '收藏了，周末就动手试试！',
    '用料很讲究，味道果然不一样~',
    '简单快手，工作日晚餐首选！',
  ]},
];

const generateComments = (dishId: string, count: number): Comment[] => {
  const result: Comment[] = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const usernameIdx = Math.floor(Math.random() * commentTemplates[0].usernames.length);
    const textIdx = Math.floor(Math.random() * commentTemplates[0].texts.length);
    const username = commentTemplates[0].usernames[usernameIdx];
    result.push({
      id: uuidv4(),
      dishId,
      userId: `u_${i}_${uuidv4().slice(0, 6)}`,
      username,
      avatar: buildAvatar(username, usernameIdx),
      isOnline: Math.random() > 0.5,
      date: now - (i * 3600000 + Math.floor(Math.random() * 86400000)),
      text: commentTemplates[0].texts[textIdx],
      likes: Math.floor(Math.random() * 50),
      replies: [],
      liked: false,
    });
  }
  return result;
};

const seedIngredientToIngredient = (si: DishSeedIngredient, idx: number, dishIdx: number): Ingredient => ({
  id: `ing_${dishIdx}_${idx}_${si.name}`,
  name: si.name,
  emoji: si.emoji || DEFAULT_EMOJI_MAP[si.name] || '🍽️',
  origin: si.origin,
  seasonMonths: si.seasonMonths,
  importance: si.importance,
  rating: si.rating,
});

const seedDishes = buildSeedDishes();
seedDishes.forEach((seed, i) => {
  const ingredients = seed.ingredients.map((si, idx) => seedIngredientToIngredient(si, idx, i));
  const id = uuidv4();
  const dish: Dish = {
    id,
    userId: `u_seed_${i}`,
    author: ['老陈厨房', '家的味道', '小厨娘', '深夜食堂', '妈妈的味道', '阿杰私厨'][i],
    name: seed.name,
    coverImage: seed.coverImage,
    rating: seed.rating,
    ingredients,
    methods: seed.methods as CookingMethod[],
    relations: [],
    topology: buildTopology(ingredients, seed.methods as CookingMethod[]),
    tags: seed.tags,
    createdAt: Date.now() - i * 86400000,
  };
  dishes.set(id, dish);
  comments.set(id, generateComments(id, 3 + Math.floor(Math.random() * 3)));
});

app.get('/api/dishes', async (req, res) => {
  const delay = 200 + Math.floor(Math.random() * 600);
  await new Promise((resolve) => setTimeout(resolve, delay));

  const { tag, userId, q } = req.query;
  let result = Array.from(dishes.values());

  if (tag && typeof tag === 'string') {
    result = result.filter((d) => d.tags.includes(tag));
  }
  if (userId && typeof userId === 'string') {
    result = result.filter((d) => d.userId === userId);
  }
  if (q && typeof q === 'string') {
    const query = q.toLowerCase();
    result = result.filter(
      (d) =>
        d.name.toLowerCase().includes(query) ||
        d.tags.some((t) => t.toLowerCase().includes(query)) ||
        d.ingredients.some((ing) => ing.name.toLowerCase().includes(query))
    );
  }

  res.json(result);
});

app.get('/api/dishes/:id', (req, res) => {
  const dish = dishes.get(req.params.id);
  if (!dish) {
    res.status(404).json({ error: 'Dish not found' });
    return;
  }
  res.json(dish);
});

app.post('/api/dishes', (req, res) => {
  const body = req.body;
  const id = uuidv4();
  const ingredients: Ingredient[] = body.ingredients.map((ing: any, idx: number) => ({
    id: `ing_new_${idx}_${ing.name}`,
    name: ing.name,
    emoji: ing.emoji || DEFAULT_EMOJI_MAP[ing.name] || '🍽️',
    origin: ing.origin || '全国',
    seasonMonths: ing.seasonMonths || [1,2,3,4,5,6,7,8,9,10,11,12],
    importance: ing.importance,
    rating: ing.rating || 4,
  }));
  const methods: CookingMethod[] = body.methods || [];
  const dish: Dish = {
    id,
    userId: 'u_self',
    author: '我',
    name: body.name,
    coverImage: body.coverImage,
    rating: body.rating || 4.5,
    ingredients,
    methods,
    relations: body.relations || [],
    topology: buildTopology(ingredients, methods),
    tags: body.tags || [],
    createdAt: Date.now(),
  };
  dishes.set(id, dish);
  comments.set(id, []);
  res.status(201).json(dish);
});

app.put('/api/dishes/:id', (req, res) => {
  const existing = dishes.get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Dish not found' });
    return;
  }
  const body = req.body;
  const ingredients: Ingredient[] = body.ingredients.map((ing: any, idx: number) => ({
    id: ing.id || `ing_upd_${idx}_${ing.name}`,
    name: ing.name,
    emoji: ing.emoji || DEFAULT_EMOJI_MAP[ing.name] || '🍽️',
    origin: ing.origin || '全国',
    seasonMonths: ing.seasonMonths || [1,2,3,4,5,6,7,8,9,10,11,12],
    importance: ing.importance,
    rating: ing.rating || 4,
  }));
  const methods: CookingMethod[] = body.methods || [];
  const dish: Dish = {
    ...existing,
    name: body.name,
    coverImage: body.coverImage,
    rating: body.rating,
    ingredients,
    methods,
    relations: body.relations || existing.relations,
    topology: buildTopology(ingredients, methods),
    tags: body.tags || existing.tags,
  };
  dishes.set(req.params.id, dish);
  res.json(dish);
});

app.delete('/api/dishes/:id', (req, res) => {
  const deleted = dishes.delete(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Dish not found' });
    return;
  }
  comments.delete(req.params.id);
  res.json({ success: true });
});

app.get('/api/dishes/:id/comments', (req, res) => {
  const dishComments = comments.get(req.params.id) || [];
  const page = parseInt(req.query.page as string, 10) || 1;
  const size = parseInt(req.query.size as string, 10) || 5;
  const total = dishComments.length;
  const start = (page - 1) * size;
  const data = dishComments.slice(start, start + size);
  const result: Paginated<Comment> = { data, page, size, total };
  res.json(result);
});

app.post('/api/dishes/:id/comments', (req, res) => {
  const { username, text } = req.body;
  const dishComments = comments.get(req.params.id) || [];
  const comment: Comment = {
    id: uuidv4(),
    dishId: req.params.id,
    userId: 'u_self',
    username,
    avatar: buildAvatar(username, dishComments.length),
    isOnline: true,
    date: Date.now(),
    text,
    likes: 0,
    replies: [],
    liked: false,
  };
  dishComments.unshift(comment);
  comments.set(req.params.id, dishComments);
  res.status(201).json(comment);
});

app.post('/api/dishes/:id/comments/:cid/like', (req, res) => {
  const dishComments = comments.get(req.params.id) || [];
  const comment = dishComments.find((c) => c.id === req.params.cid);
  if (!comment) {
    res.status(404).json({ error: 'Comment not found' });
    return;
  }
  comment.likes += 1;
  comment.liked = true;
  res.json(comment);
});

app.get('/api/tags', (req, res) => {
  const tagCounts = new Map<string, number>();
  dishes.forEach((dish) => {
    dish.tags.forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });
  const result = Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
  res.json(result);
});

app.listen(PORT, () => {
  console.log('🍜 Flavor Topology API server listening on :5000');
});
