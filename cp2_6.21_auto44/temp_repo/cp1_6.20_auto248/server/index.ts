import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import type {
  Dish,
  Member,
  Group,
  MergedDish,
  DiscountRule,
  CheckoutResult,
  DishCategory,
} from '../src/types';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const DISHES: Dish[] = [
  { id: 'd1', name: '口水鸡', price: 38, category: 'cold', spiciness: 2, rating: 5, emoji: '🍗' },
  { id: 'd2', name: '凉拌黄瓜', price: 12, category: 'cold', spiciness: 1, rating: 3, emoji: '🥒' },
  { id: 'd3', name: '皮蛋豆腐', price: 16, category: 'cold', spiciness: 1, rating: 4, emoji: '🥚' },
  { id: 'd4', name: '夫妻肺片', price: 42, category: 'cold', spiciness: 3, rating: 5, emoji: '🥩' },
  { id: 'd5', name: '爽口木耳', price: 18, category: 'cold', spiciness: 2, rating: 4, emoji: '🍄' },
  { id: 'd6', name: '麻婆豆腐', price: 22, category: 'hot', spiciness: 3, rating: 5, emoji: '🍲' },
  { id: 'd7', name: '宫保鸡丁', price: 32, category: 'hot', spiciness: 2, rating: 5, emoji: '🥜' },
  { id: 'd8', name: '鱼香肉丝', price: 30, category: 'hot', spiciness: 2, rating: 4, emoji: '🥕' },
  { id: 'd9', name: '回锅肉', price: 38, category: 'hot', spiciness: 2, rating: 5, emoji: '🥓' },
  { id: 'd10', name: '水煮牛肉', price: 58, category: 'hot', spiciness: 3, rating: 5, emoji: '🌶️' },
  { id: 'd11', name: '糖醋里脊', price: 42, category: 'hot', spiciness: 1, rating: 4, emoji: '🍖' },
  { id: 'd12', name: '蒜蓉西兰花', price: 20, category: 'hot', spiciness: 1, rating: 3, emoji: '🥦' },
  { id: 'd13', name: '米饭', price: 3, category: 'staple', spiciness: 1, rating: 5, emoji: '🍚' },
  { id: 'd14', name: '扬州炒饭', price: 22, category: 'staple', spiciness: 1, rating: 4, emoji: '🍛' },
  { id: 'd15', name: '葱油拌面', price: 18, category: 'staple', spiciness: 1, rating: 4, emoji: '🍜' },
  { id: 'd16', name: '担担面', price: 20, category: 'staple', spiciness: 3, rating: 5, emoji: '🍝' },
  { id: 'd17', name: '酸梅汤', price: 8, category: 'drink', spiciness: 1, rating: 4, emoji: '🥤' },
  { id: 'd18', name: '鲜榨橙汁', price: 15, category: 'drink', spiciness: 1, rating: 4, emoji: '🧃' },
  { id: 'd19', name: '可乐', price: 6, category: 'drink', spiciness: 1, rating: 3, emoji: '🥤' },
  { id: 'd20', name: '柠檬蜜茶', price: 12, category: 'drink', spiciness: 1, rating: 4, emoji: '🍋' },
];

const dishMap = new Map<string, Dish>();
DISHES.forEach((d) => dishMap.set(d.id, d));

const groups = new Map<string, Group>();

app.get('/api/dishes', (req, res) => {
  const { category, spiciness } = req.query;
  let result = [...DISHES];
  if (category) {
    result = result.filter((d) => d.category === (category as DishCategory));
  }
  if (spiciness) {
    const level = Number(spiciness);
    result = result.filter((d) => d.spiciness === level);
  }
  res.json(result);
});

app.get('/api/dishes/:id', (req, res) => {
  const dish = dishMap.get(req.params.id);
  if (!dish) return res.status(404).json({ error: '菜品不存在' });
  res.json(dish);
});

app.post('/api/groups', (req, res) => {
  const { creatorName } = req.body || {};
  if (!creatorName || typeof creatorName !== 'string') {
    return res.status(400).json({ error: '请输入创建者昵称' });
  }
  const creatorId = uuidv4();
  const member: Member = { id: creatorId, name: creatorName.trim(), selectedDishIds: [] };
  const group: Group = {
    id: uuidv4(),
    createdAt: Date.now(),
    members: [member],
    maxMembers: 6,
  };
  groups.set(group.id, group);
  res.json({ group, currentMember: member });
});

app.get('/api/groups/:id', (req, res) => {
  const group = groups.get(req.params.id);
  if (!group) return res.status(404).json({ error: '小组不存在' });
  res.json(group);
});

app.post('/api/groups/:id/members', (req, res) => {
  const group = groups.get(req.params.id);
  if (!group) return res.status(404).json({ error: '小组不存在' });
  const { name } = req.body || {};
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: '请输入昵称' });
  }
  if (group.members.length >= group.maxMembers) {
    return res.status(400).json({ error: '小组人数已满' });
  }
  const member: Member = { id: uuidv4(), name: name.trim(), selectedDishIds: [] };
  group.members.push(member);
  res.json(member);
});

app.patch('/api/groups/:id/members/:memberId', (req, res) => {
  const group = groups.get(req.params.id);
  if (!group) return res.status(404).json({ error: '小组不存在' });
  const member = group.members.find((m) => m.id === req.params.memberId);
  if (!member) return res.status(404).json({ error: '成员不存在' });
  const { selectedDishIds } = req.body || {};
  if (!Array.isArray(selectedDishIds)) {
    return res.status(400).json({ error: '参数错误' });
  }
  member.selectedDishIds = selectedDishIds.filter((id) => dishMap.has(id));
  res.json(member);
});

app.post('/api/groups/:id/merge', (req, res) => {
  const group = groups.get(req.params.id);
  if (!group) return res.status(404).json({ error: '小组不存在' });
  const dishAggregate = new Map<string, { dish: Dish; memberIds: string[] }>();
  for (const member of group.members) {
    for (const dishId of member.selectedDishIds) {
      const dish = dishMap.get(dishId);
      if (!dish) continue;
      if (!dishAggregate.has(dishId)) {
        dishAggregate.set(dishId, { dish, memberIds: [] });
      }
      const agg = dishAggregate.get(dishId)!;
      if (!agg.memberIds.includes(member.id)) {
        agg.memberIds.push(member.id);
      }
    }
  }
  const merged: MergedDish[] = Array.from(dishAggregate.values()).map((v) => ({
    dish: v.dish,
    count: v.memberIds.length,
    memberIds: v.memberIds,
  }));
  merged.sort((a, b) => b.count - a.count);
  res.json(merged);
});

app.post('/api/groups/:id/checkout', (req, res) => {
  const group = groups.get(req.params.id);
  if (!group) return res.status(404).json({ error: '小组不存在' });
  const { rule } = req.body as { rule?: DiscountRule } || {};
  const discountRule: DiscountRule = rule || { threshold: 200, discount: 20 };

  const dishAggregate = new Map<string, { dish: Dish; memberIds: string[] }>();
  const memberRaw = new Map<string, number>();
  group.members.forEach((m) => memberRaw.set(m.id, 0));

  for (const member of group.members) {
    for (const dishId of member.selectedDishIds) {
      const dish = dishMap.get(dishId);
      if (!dish) continue;
      if (!dishAggregate.has(dishId)) {
        dishAggregate.set(dishId, { dish, memberIds: [] });
      }
      const agg = dishAggregate.get(dishId)!;
      if (!agg.memberIds.includes(member.id)) {
        agg.memberIds.push(member.id);
      }
    }
  }

  let originalTotal = 0;
  for (const { dish, memberIds } of dishAggregate.values()) {
    const unit = dish.price;
    originalTotal += unit;
    const perPerson = unit / memberIds.length;
    for (const mid of memberIds) {
      memberRaw.set(mid, (memberRaw.get(mid) || 0) + perPerson);
    }
  }

  let discountApplied = 0;
  if (originalTotal >= discountRule.threshold) {
    discountApplied = discountRule.discount;
  }
  const finalTotal = Math.max(0, originalTotal - discountApplied);

  const ratio = originalTotal > 0 ? finalTotal / originalTotal : 1;
  const splits = group.members.map((m) => {
    const raw = memberRaw.get(m.id) || 0;
    const discounted = raw * ratio;
    const amount = Math.round(discounted * 10) / 10;
    return { memberId: m.id, memberName: m.name, amount };
  });

  const splitSum = splits.reduce((s, x) => s + x.amount, 0);
  const diff = Math.round((finalTotal - splitSum) * 10) / 10;
  if (Math.abs(diff) >= 0.1 && splits.length > 0) {
    splits[splits.length - 1].amount = Math.round((splits[splits.length - 1].amount + diff) * 10) / 10;
  }

  const result: CheckoutResult = {
    originalTotal: Math.round(originalTotal * 100) / 100,
    discountApplied,
    finalTotal: Math.round(finalTotal * 100) / 100,
    splits,
  };
  res.json(result);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', ts: Date.now() });
});

app.listen(PORT, () => {
  console.log(`[server] 拼单 API 服务已启动: http://localhost:${PORT}`);
});
