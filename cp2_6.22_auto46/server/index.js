import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(express.json());

const categories = {
  fruit: { name: '水果', items: ['红富士苹果', '阳光玫瑰葡萄', '丹东草莓', '海南芒果', '智利车厘子', '泰国山竹', '云南蓝莓', '新疆哈密瓜', '福建柚子', '四川猕猴桃'] },
  vegetable: { name: '蔬菜', items: ['有机番茄', '水果黄瓜', '荷兰豆', '彩椒组合', '芦笋', '西蓝花', '胡萝卜', '娃娃菜', '香菇', '金针菇'] },
  meat: { name: '肉类', items: ['黑猪五花肉', '澳洲牛腱子', '清远鸡', '羊排', '猪里脊', '牛肋条', '鸡翅中', '鸡腿', '培根', '香肠'] },
  seafood: { name: '海鲜', items: ['厄瓜多尔白虾', '挪威三文鱼', '舟山带鱼', '阳澄湖大闸蟹', '扇贝', '生蚝', '鲈鱼', '多宝鱼', '鱿鱼', '蛤蜊'] }
};

const reviewTemplates = [
  '非常新鲜，下次还会买！',
  '品质不错，家人都喜欢',
  '价格实惠，值得推荐',
  '包装很好，配送很快',
  '口感极佳，物超所值',
  '比超市新鲜多了',
  '回购无数次了',
  '团购价很划算',
  '质量稳定，放心购买',
  '推荐给朋友了'
];

const userNames = ['小明', '李姐', '王哥', '张阿姨', '陈先生', '刘女士', '赵师傅', '孙同学', '周经理', '吴大厨'];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function generateSalesHistory() {
  const history = [];
  const baseSales = randomInt(50, 200);
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const variation = randomInt(-30, 30);
    const trendFactor = (29 - i) * randomFloat(-0.5, 1);
    const sales = Math.max(10, Math.round(baseSales + variation + trendFactor));
    history.push({
      date: date.toISOString().split('T')[0],
      sales
    });
  }
  return history;
}

function generateRatingDistribution(avgRating) {
  const distribution = [0, 0, 0, 0, 0];
  const totalReviews = randomInt(50, 500);
  
  for (let i = 0; i < totalReviews; i++) {
    const rand = Math.random();
    let rating;
    if (rand < 0.6) rating = 5;
    else if (rand < 0.85) rating = 4;
    else if (rand < 0.95) rating = 3;
    else if (rand < 0.99) rating = 2;
    else rating = 1;
    
    const adjustment = Math.round((avgRating - 4.2) * 20);
    rating = Math.max(1, Math.min(5, rating + (adjustment > 0 ? randomInt(0, adjustment) : randomInt(adjustment, 0))));
    distribution[rating - 1]++;
  }
  
  return distribution;
}

function calculateAvgRating(distribution) {
  const total = distribution.reduce((a, b) => a + b, 0);
  const sum = distribution.reduce((acc, count, idx) => acc + count * (idx + 1), 0);
  return total > 0 ? parseFloat((sum / total).toFixed(1)) : 0;
}

function generateReviews() {
  const reviews = [];
  for (let i = 0; i < 10; i++) {
    const date = new Date();
    date.setDate(date.getDate() - randomInt(0, 20));
    reviews.push({
      id: uuidv4(),
      user: userNames[randomInt(0, userNames.length - 1)],
      rating: randomInt(3, 5),
      content: reviewTemplates[randomInt(0, reviewTemplates.length - 1)],
      date: date.toISOString().split('T')[0]
    });
  }
  return reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function generateProducts() {
  const products = [];
  
  for (const [categoryKey, categoryData] of Object.entries(categories)) {
    for (const productName of categoryData.items) {
      const price = randomFloat(9.9, 99.9);
      const cost = price * randomFloat(0.4, 0.7);
      const salesHistory = generateSalesHistory();
      const totalSales = salesHistory.reduce((acc, day) => acc + day.sales, 0);
      const ratingDistribution = generateRatingDistribution(randomFloat(3.5, 4.9));
      const rating = calculateAvgRating(ratingDistribution);
      const maxStock = randomInt(200, 1000);
      const stock = randomInt(20, maxStock);
      const profitPercent = parseFloat(((price - cost) / price * 100).toFixed(1));
      
      products.push({
        id: uuidv4(),
        name: productName,
        category: categoryKey,
        price,
        cost,
        rating,
        totalSales,
        stock,
        maxStock,
        hotScore: 0,
        profitPercent,
        feedbackCount: 0,
        positiveFeedback: 0,
        salesHistory,
        ratingDistribution,
        reviews: generateReviews()
      });
    }
  }
  
  return products;
}

let products = generateProducts();

function calculateHotScore(product, maxSales, maxProfit) {
  const salesFactor = (product.totalSales / maxSales) * 0.30;
  const ratingFactor = (product.rating / 5) * 0.25;
  const profitFactor = (product.profitPercent / maxProfit) * 0.20;
  const stockFactor = (product.stock / product.maxStock) * 0.15;
  
  let feedbackFactor = 0;
  if (product.feedbackCount > 0) {
    const positiveRate = product.positiveFeedback / product.feedbackCount;
    const feedbackWeight = Math.min(product.feedbackCount / 100, 1);
    feedbackFactor = positiveRate * feedbackWeight * 0.10;
  }
  
  return parseFloat((salesFactor + ratingFactor + profitFactor + stockFactor + feedbackFactor).toFixed(4));
}

function updateAllHotScores() {
  const maxSales = Math.max(...products.map(p => p.totalSales));
  const maxProfit = Math.max(...products.map(p => p.profitPercent));
  
  products.forEach(product => {
    product.hotScore = calculateHotScore(product, maxSales, maxProfit);
  });
}

updateAllHotScores();

function filterProducts(query) {
  let filtered = [...products];
  
  if (query.category && query.category !== 'all') {
    filtered = filtered.filter(p => p.category === query.category);
  }
  
  if (query.minPrice !== undefined && query.minPrice !== null) {
    filtered = filtered.filter(p => p.price >= Number(query.minPrice));
  }
  
  if (query.maxPrice !== undefined && query.maxPrice !== null) {
    filtered = filtered.filter(p => p.price <= Number(query.maxPrice));
  }
  
  if (query.minRating !== undefined && query.minRating !== null) {
    filtered = filtered.filter(p => p.rating >= Number(query.minRating));
  }
  
  const sortBy = query.sortBy || 'hotScore';
  const sortOrder = query.sortOrder || 'desc';
  
  filtered.sort((a, b) => {
    let valA, valB;
    switch (sortBy) {
      case 'sales':
        valA = a.totalSales;
        valB = b.totalSales;
        break;
      case 'rating':
        valA = a.rating;
        valB = b.rating;
        break;
      case 'profit':
        valA = a.profitPercent;
        valB = b.profitPercent;
        break;
      case 'hotScore':
      default:
        valA = a.hotScore;
        valB = b.hotScore;
    }
    return sortOrder === 'asc' ? valA - valB : valB - valA;
  });
  
  return filtered;
}

app.get('/api/products', (req, res) => {
  const filtered = filterProducts(req.query);
  
  const result = filtered.map(p => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    rating: p.rating,
    totalSales: p.totalSales,
    stock: p.stock,
    maxStock: p.maxStock,
    hotScore: p.hotScore,
    profitPercent: p.profitPercent,
    feedbackCount: p.feedbackCount,
    positiveFeedback: p.positiveFeedback
  }));
  
  res.json({
    total: result.length,
    products: result
  });
});

app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  
  if (!product) {
    return res.status(404).json({ error: '商品不存在' });
  }
  
  res.json(product);
});

app.post('/api/products/:id/feedback', (req, res) => {
  const { type } = req.body;
  const product = products.find(p => p.id === req.params.id);
  
  if (!product) {
    return res.status(404).json({ error: '商品不存在' });
  }
  
  if (type !== 'like' && type !== 'dislike') {
    return res.status(400).json({ error: '无效的反馈类型' });
  }
  
  product.feedbackCount++;
  if (type === 'like') {
    product.positiveFeedback++;
  }
  
  const maxSales = Math.max(...products.map(p => p.totalSales));
  const maxProfit = Math.max(...products.map(p => p.profitPercent));
  product.hotScore = calculateHotScore(product, maxSales, maxProfit);
  
  res.json({
    success: true,
    productId: product.id,
    feedbackCount: product.feedbackCount,
    positiveFeedback: product.positiveFeedback,
    hotScore: product.hotScore
  });
});

app.get('/api/recommendations', (req, res) => {
  const sorted = [...products].sort((a, b) => b.hotScore - a.hotScore);
  const topProducts = sorted.slice(0, 10);
  
  res.json({
    recommendations: topProducts.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      hotScore: p.hotScore,
      reason: generateRecommendationReason(p)
    }))
  });
});

function generateRecommendationReason(product) {
  const reasons = [];
  
  if (product.hotScore > 0.7) {
    reasons.push('热度指数高');
  }
  if (product.rating >= 4.5) {
    reasons.push('用户好评如潮');
  }
  if (product.totalSales > 3000) {
    reasons.push('销量领先');
  }
  if (product.profitPercent > 40) {
    reasons.push('利润空间大');
  }
  if (product.stock / product.maxStock < 0.3) {
    reasons.push('库存紧张，补货时机好');
  }
  
  return reasons.length > 0 ? reasons.join('，') : '综合表现优秀';
}

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
