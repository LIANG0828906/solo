const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 内存数据存储
let users = [];
let artworks = [];
let favorites = [];
let purchases = [];

// 初始化一些示例数据
const sampleImages = [
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=miniature%20garden%20diorama%20miniature%20landscape%20model&image_size=square_hd',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=miniature%20street%20scene%20diorama%20model&image_size=square_hd',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=miniature%20building%20architecture%20model&image_size=square_hd',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=miniature%20forest%20scene%20diorama&image_size=square_hd',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=miniature%20city%20skyline%20model&image_size=square_hd',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=miniature%20village%20landscape%20diorama&image_size=square_hd',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=miniature%20castle%20model%20fantasy&image_size=square_hd',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=miniature%20desert%20oasis%20diorama&image_size=square_hd',
];

const sampleArtworks = [
  {
    id: uuidv4(),
    name: '秘境花园',
    description: '精心打造的微缩花园景观，包含数十种迷你植物和复古长椅，呈现出宁静优雅的英式花园风情。每一朵花都由手工捏制，细节栩栩如生。',
    dimensions: '30cm × 20cm × 15cm',
    material: '木质',
    price: 1280,
    images: [sampleImages[0], sampleImages[1], sampleImages[2], sampleImages[3], sampleImages[4]],
    sellerId: 'user-1',
    sellerName: '模型匠人老王',
    likes: 156,
    createdAt: Date.now() - 86400000 * 2,
    status: 'active'
  },
  {
    id: uuidv4(),
    name: '怀旧老街',
    description: '复刻上世纪80年代的中国老街场景，包括老式照相馆、粮油店、自行车修理铺等，充满时代记忆。',
    dimensions: '40cm × 30cm × 20cm',
    material: '树脂',
    price: 2580,
    images: [sampleImages[1], sampleImages[0], sampleImages[2], sampleImages[4], sampleImages[3]],
    sellerId: 'user-2',
    sellerName: '时光工坊',
    likes: 234,
    createdAt: Date.now() - 86400000 * 5,
    status: 'active'
  },
  {
    id: uuidv4(),
    name: '中世纪城堡',
    description: '精雕细琢的中世纪欧洲城堡模型，带有完整的城墙、塔楼、护城河和吊桥，可作为收藏或场景摆件。',
    dimensions: '50cm × 35cm × 25cm',
    material: '石膏',
    price: 3680,
    images: [sampleImages[6], sampleImages[2], sampleImages[4], sampleImages[1], sampleImages[3]],
    sellerId: 'user-3',
    sellerName: '奇幻模型室',
    likes: 312,
    createdAt: Date.now() - 86400000 * 1,
    status: 'active'
  },
  {
    id: uuidv4(),
    name: '樱花庭院',
    description: '日式禅意庭院微缩景观，粉色樱花飘落于枯山水之间，茶室与石灯笼相映成趣。',
    dimensions: '25cm × 25cm × 18cm',
    material: '木质',
    price: 1680,
    images: [sampleImages[3], sampleImages[0], sampleImages[5], sampleImages[2], sampleImages[1]],
    sellerId: 'user-1',
    sellerName: '模型匠人老王',
    likes: 198,
    createdAt: Date.now() - 86400000 * 3,
    status: 'active'
  },
  {
    id: uuidv4(),
    name: '沙漠绿洲',
    description: '微型沙漠中的一片绿洲，棕榈树、骆驼商队和清澈的泉水构成了一幅壮美的西域画卷。',
    dimensions: '35cm × 25cm × 12cm',
    material: '其他',
    price: 980,
    images: [sampleImages[7], sampleImages[4], sampleImages[0], sampleImages[2], sampleImages[5]],
    sellerId: 'user-2',
    sellerName: '时光工坊',
    likes: 87,
    createdAt: Date.now() - 86400000 * 7,
    status: 'active'
  },
  {
    id: uuidv4(),
    name: '都市天际线',
    description: '现代都市微缩天际线，包含摩天大楼、立交桥和行驶中的车辆，夜晚灯光效果璀璨夺目。',
    dimensions: '60cm × 40cm × 30cm',
    material: '树脂',
    price: 4580,
    images: [sampleImages[4], sampleImages[6], sampleImages[1], sampleImages[3], sampleImages[7]],
    sellerId: 'user-3',
    sellerName: '奇幻模型室',
    likes: 276,
    createdAt: Date.now() - 86400000 * 4,
    status: 'active'
  },
  {
    id: uuidv4(),
    name: '山村晨雾',
    description: '中国风山村微缩景观，晨雾缭绕的山间小村，炊烟袅袅，展现世外桃源般的宁静。',
    dimensions: '45cm × 30cm × 22cm',
    material: '石膏',
    price: 2280,
    images: [sampleImages[5], sampleImages[3], sampleImages[0], sampleImages[6], sampleImages[2]],
    sellerId: 'user-1',
    sellerName: '模型匠人老王',
    likes: 145,
    createdAt: Date.now() - 86400000 * 6,
    status: 'active'
  },
  {
    id: uuidv4(),
    name: '海底世界',
    description: '微缩海底景观，色彩斑斓的珊瑚礁、游动的热带鱼群和神秘的沉船残骸。',
    dimensions: '30cm × 20cm × 25cm',
    material: '树脂',
    price: 1880,
    images: [sampleImages[2], sampleImages[7], sampleImages[4], sampleImages[0], sampleImages[5]],
    sellerId: 'user-2',
    sellerName: '时光工坊',
    likes: 203,
    createdAt: Date.now() - 86400000 * 8,
    status: 'active'
  },
];

artworks = sampleArtworks;

// 默认用户
users = [
  { id: 'user-1', username: 'demo', password: '123456', nickname: '模型爱好者' }
];

// 用户注册
app.post('/api/auth/register', (req, res) => {
  const { username, password, nickname } = req.body;
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ message: '用户名已存在' });
  }
  const user = { id: uuidv4(), username, password, nickname: nickname || username };
  users.push(user);
  res.json({ user: { id: user.id, username: user.username, nickname: user.nickname } });
});

// 用户登录
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({ message: '用户名或密码错误' });
  }
  res.json({ user: { id: user.id, username: user.username, nickname: user.nickname } });
});

// 获取作品列表（支持排序、筛选、分页）
app.get('/api/artworks', (req, res) => {
  const { sort = 'latest', material, minPrice, maxPrice, page = 1, limit = 20 } = req.query;
  let filtered = artworks.filter(a => a.status === 'active');

  if (material && material !== 'all') {
    filtered = filtered.filter(a => a.material === material);
  }

  if (minPrice) {
    filtered = filtered.filter(a => a.price >= Number(minPrice));
  }

  if (maxPrice) {
    filtered = filtered.filter(a => a.price <= Number(maxPrice));
  }

  if (sort === 'hot') {
    filtered.sort((a, b) => b.likes - a.likes);
  } else if (sort === 'price_asc') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sort === 'price_desc') {
    filtered.sort((a, b) => b.price - a.price);
  } else {
    filtered.sort((a, b) => b.createdAt - a.createdAt);
  }

  const start = (Number(page) - 1) * Number(limit);
  const paginated = filtered.slice(start, start + Number(limit));

  res.json({
    items: paginated,
    total: filtered.length,
    page: Number(page),
    totalPages: Math.ceil(filtered.length / Number(limit))
  });
});

// 获取单个作品详情
app.get('/api/artworks/:id', (req, res) => {
  const artwork = artworks.find(a => a.id === req.params.id);
  if (!artwork) {
    return res.status(404).json({ message: '作品不存在' });
  }
  res.json(artwork);
});

// 上传作品
app.post('/api/artworks', (req, res) => {
  const { name, description, dimensions, material, price, images, sellerId, sellerName } = req.body;
  const artwork = {
    id: uuidv4(),
    name,
    description: description || '',
    dimensions: dimensions || '',
    material,
    price: Number(price),
    images: images || [],
    sellerId,
    sellerName: sellerName || '匿名卖家',
    likes: 0,
    createdAt: Date.now(),
    status: 'active'
  };
  artworks.unshift(artwork);
  res.status(201).json(artwork);
});

// 更新作品
app.put('/api/artworks/:id', (req, res) => {
  const index = artworks.findIndex(a => a.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: '作品不存在' });
  }
  artworks[index] = { ...artworks[index], ...req.body };
  res.json(artworks[index]);
});

// 下架/上架作品
app.patch('/api/artworks/:id/status', (req, res) => {
  const { status } = req.body;
  const artwork = artworks.find(a => a.id === req.params.id);
  if (!artwork) {
    return res.status(404).json({ message: '作品不存在' });
  }
  artwork.status = status;
  res.json(artwork);
});

// 点赞
app.post('/api/artworks/:id/like', (req, res) => {
  const artwork = artworks.find(a => a.id === req.params.id);
  if (!artwork) {
    return res.status(404).json({ message: '作品不存在' });
  }
  artwork.likes += 1;
  res.json({ likes: artwork.likes });
});

// 获取用户的作品
app.get('/api/users/:userId/artworks', (req, res) => {
  const userArtworks = artworks.filter(a => a.sellerId === req.params.userId);
  userArtworks.sort((a, b) => b.createdAt - a.createdAt);
  res.json(userArtworks);
});

// 获取收藏列表
app.get('/api/users/:userId/favorites', (req, res) => {
  const userFavorites = favorites.filter(f => f.userId === req.params.userId);
  const artworkIds = userFavorites.map(f => f.artworkId);
  const favoriteArtworks = artworks.filter(a => artworkIds.includes(a.id));
  const result = userFavorites.map(f => {
    const artwork = artworks.find(a => a.id === f.artworkId);
    return artwork ? { ...f, artwork } : null;
  }).filter(Boolean);
  result.sort((a, b) => b.createdAt - a.createdAt);
  res.json(result);
});

// 添加收藏
app.post('/api/favorites', (req, res) => {
  const { userId, artworkId } = req.body;
  const existing = favorites.find(f => f.userId === userId && f.artworkId === artworkId);
  if (existing) {
    return res.status(400).json({ message: '已收藏' });
  }
  const favorite = { id: uuidv4(), userId, artworkId, createdAt: Date.now() };
  favorites.push(favorite);
  const artwork = artworks.find(a => a.id === artworkId);
  res.status(201).json({ ...favorite, artwork });
});

// 取消收藏
app.delete('/api/favorites/:id', (req, res) => {
  const index = favorites.findIndex(f => f.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: '收藏不存在' });
  }
  favorites.splice(index, 1);
  res.json({ message: '已取消收藏' });
});

// 检查是否已收藏
app.get('/api/favorites/check', (req, res) => {
  const { userId, artworkId } = req.query;
  const existing = favorites.find(f => f.userId === userId && f.artworkId === artworkId);
  res.json({ isFavorite: !!existing, favorite: existing });
});

// 获取购买记录
app.get('/api/users/:userId/purchases', (req, res) => {
  const userPurchases = purchases.filter(p => p.userId === req.params.userId);
  const result = userPurchases.map(p => {
    const artwork = artworks.find(a => a.id === p.artworkId);
    return artwork ? { ...p, artwork } : null;
  }).filter(Boolean);
  result.sort((a, b) => b.createdAt - a.createdAt);
  res.json(result);
});

// 购买作品
app.post('/api/purchases', (req, res) => {
  const { userId, artworkId } = req.body;
  const artwork = artworks.find(a => a.id === artworkId);
  if (!artwork) {
    return res.status(404).json({ message: '作品不存在' });
  }
  const purchase = {
    id: uuidv4(),
    userId,
    artworkId,
    price: artwork.price,
    status: 'completed',
    createdAt: Date.now()
  };
  purchases.push(purchase);
  res.status(201).json({ ...purchase, artwork });
});

// 获取用户活动时间线
app.get('/api/users/:userId/activity', (req, res) => {
  const { userId } = req.params;
  const userArtworks = artworks.filter(a => a.sellerId === userId).map(a => ({
    id: a.id,
    type: 'upload',
    artwork: a,
    date: a.createdAt,
    status: a.status
  }));

  const userFavorites = favorites.filter(f => f.userId === userId).map(f => {
    const artwork = artworks.find(a => a.id === f.artworkId);
    return {
      id: f.id,
      type: 'favorite',
      artwork,
      date: f.createdAt,
      status: artwork ? artwork.status : 'removed'
    };
  }).filter(f => f.artwork);

  const userPurchases = purchases.filter(p => p.userId === userId).map(p => {
    const artwork = artworks.find(a => a.id === p.artworkId);
    return {
      id: p.id,
      type: 'purchase',
      artwork,
      date: p.createdAt,
      status: p.status
    };
  }).filter(p => p.artwork);

  const allActivity = [...userArtworks, ...userFavorites, ...userPurchases];
  allActivity.sort((a, b) => b.date - a.date);
  res.json(allActivity);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
