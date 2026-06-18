import express from "express";
import cors from "cors";
import { v4 as generateId } from "uuid";

const app = express();

app.use(cors());
app.use(express.json());

interface EmotionTag {
  id: string;
  name: string;
  color: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface Bill {
  id: string;
  amount: number;
  categoryId: string;
  emotionTagId: string;
  note: string;
  createdAt: string;
}

interface Budget {
  id: string;
  weeklyLimit: number;
}

const emotionTags: EmotionTag[] = [
  { id: generateId(), name: "开心", color: "#FFD700" },
  { id: generateId(), name: "焦虑", color: "#FF6B6B" },
  { id: generateId(), name: "满足", color: "#6BCB77" },
  { id: generateId(), name: "后悔", color: "#A66CFF" },
  { id: generateId(), name: "平静", color: "#4FC3F7" },
];

const categories: Category[] = [
  { id: generateId(), name: "餐饮", icon: "🍜", color: "#FF7043" },
  { id: generateId(), name: "交通", icon: "🚗", color: "#42A5F5" },
  { id: generateId(), name: "娱乐", icon: "🎮", color: "#AB47BC" },
  { id: generateId(), name: "购物", icon: "🛍", color: "#FFA726" },
  { id: generateId(), name: "居住", icon: "🏠", color: "#66BB6A" },
  { id: generateId(), name: "医疗", icon: "💊", color: "#EF5350" },
  { id: generateId(), name: "教育", icon: "📚", color: "#5C6BC0" },
  { id: generateId(), name: "其他", icon: "📌", color: "#78909C" },
];

const budget: Budget = {
  id: generateId(),
  weeklyLimit: 2000,
};

function getStartOfWeek(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getStartOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function getStartOfDay(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

const monday = getStartOfWeek();

function daysAgo(n: number): string {
  const d = new Date(monday);
  d.setDate(d.getDate() + n);
  d.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60), 0, 0);
  return d.toISOString();
}

const bills: Bill[] = [
  {
    id: generateId(),
    amount: 35.5,
    categoryId: categories[0].id,
    emotionTagId: emotionTags[0].id,
    note: "和朋友聚餐",
    createdAt: daysAgo(0),
  },
  {
    id: generateId(),
    amount: 12,
    categoryId: categories[1].id,
    emotionTagId: emotionTags[4].id,
    note: "地铁通勤",
    createdAt: daysAgo(0),
  },
  {
    id: generateId(),
    amount: 199,
    categoryId: categories[3].id,
    emotionTagId: emotionTags[1].id,
    note: "冲动买衣服",
    createdAt: daysAgo(1),
  },
  {
    id: generateId(),
    amount: 68,
    categoryId: categories[2].id,
    emotionTagId: emotionTags[0].id,
    note: "看电影",
    createdAt: daysAgo(1),
  },
  {
    id: generateId(),
    amount: 2800,
    categoryId: categories[4].id,
    emotionTagId: emotionTags[2].id,
    note: "月租分摊",
    createdAt: daysAgo(2),
  },
  {
    id: generateId(),
    amount: 45,
    categoryId: categories[0].id,
    emotionTagId: emotionTags[3].id,
    note: "外卖凑单浪费",
    createdAt: daysAgo(3),
  },
  {
    id: generateId(),
    amount: 150,
    categoryId: categories[5].id,
    emotionTagId: emotionTags[1].id,
    note: "感冒买药",
    createdAt: daysAgo(4),
  },
  {
    id: generateId(),
    amount: 89,
    categoryId: categories[6].id,
    emotionTagId: emotionTags[2].id,
    note: "在线课程",
    createdAt: daysAgo(5),
  },
];

app.get("/api/emotions", (_req, res) => {
  res.json(emotionTags);
});

app.get("/api/categories", (_req, res) => {
  res.json(categories);
});

app.get("/api/bills", (_req, res) => {
  res.json(bills);
});

app.post("/api/bills", (req, res) => {
  const { amount, categoryId, emotionTagId, note } = req.body;
  const bill: Bill = {
    id: generateId(),
    amount,
    categoryId,
    emotionTagId,
    note,
    createdAt: new Date().toISOString(),
  };
  bills.push(bill);
  res.json(bill);
});

app.put("/api/bills/:id", (req, res) => {
  const { id } = req.params;
  const index = bills.findIndex((b) => b.id === id);
  if (index === -1) {
    res.status(404).json({ error: "Bill not found" });
    return;
  }
  const { amount, categoryId, emotionTagId, note } = req.body;
  bills[index] = {
    ...bills[index],
    ...(amount !== undefined && { amount }),
    ...(categoryId !== undefined && { categoryId }),
    ...(emotionTagId !== undefined && { emotionTagId }),
    ...(note !== undefined && { note }),
  };
  res.json(bills[index]);
});

app.delete("/api/bills/:id", (req, res) => {
  const { id } = req.params;
  const index = bills.findIndex((b) => b.id === id);
  if (index === -1) {
    res.status(404).json({ error: "Bill not found" });
    return;
  }
  const deleted = bills.splice(index, 1)[0];
  res.json(deleted);
});

app.get("/api/budget", (_req, res) => {
  res.json(budget);
});

app.put("/api/budget", (req, res) => {
  const { weeklyLimit } = req.body;
  budget.weeklyLimit = weeklyLimit;
  res.json(budget);
});

app.get("/api/stats/emotion", (req, res) => {
  const range = req.query.range as string;
  let startDate: Date;

  if (range === "day") {
    startDate = getStartOfDay();
  } else if (range === "month") {
    startDate = getStartOfMonth();
  } else {
    startDate = getStartOfWeek();
  }

  const filtered = bills.filter((b) => new Date(b.createdAt) >= startDate);
  const totalAmount = filtered.reduce((sum, b) => sum + b.amount, 0);

  const grouped: Record<string, Bill[]> = {};
  for (const bill of filtered) {
    if (!grouped[bill.emotionTagId]) {
      grouped[bill.emotionTagId] = [];
    }
    grouped[bill.emotionTagId].push(bill);
  }

  const result = Object.entries(grouped).map(([emotionTagId, groupBills]) => {
    const tag = emotionTags.find((e) => e.id === emotionTagId);
    const groupTotal = groupBills.reduce((sum, b) => sum + b.amount, 0);
    return {
      emotionTagId,
      emotionName: tag?.name ?? "",
      color: tag?.color ?? "",
      totalAmount: groupTotal,
      percentage: totalAmount > 0 ? Math.round((groupTotal / totalAmount) * 10000) / 100 : 0,
      bills: groupBills,
    };
  });

  res.json(result);
});

app.get("/api/stats/budget-usage", (_req, res) => {
  const startOfWeek = getStartOfWeek();
  const weekBills = bills.filter((b) => new Date(b.createdAt) >= startOfWeek);
  const used = weekBills.reduce((sum, b) => sum + b.amount, 0);
  const limit = budget.weeklyLimit;
  const percentage = limit > 0 ? Math.round((used / limit) * 10000) / 100 : 0;
  const now = new Date();
  const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const daysRemaining = 7 - dayOfWeek - 1;

  res.json({ used, limit, percentage, daysRemaining });
});

app.listen(4000, () => {
  console.log("Server running on port 4000");
});
