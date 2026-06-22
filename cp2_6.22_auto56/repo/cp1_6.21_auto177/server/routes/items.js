import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

let items = [
  {
    id: uuidv4(),
    name: '珍稀艺术品',
    startPrice: 500,
    description: '一件来自著名艺术家的限量版画作品，装裱精美，极具收藏价值。',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=400&fit=crop',
    sold: false,
    currentPrice: 500
  },
  {
    id: uuidv4(),
    name: '手工皮具套装',
    startPrice: 300,
    description: '采用头层牛皮手工制作的皮具套装，包含钱包和卡包各一件。',
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=400&fit=crop',
    sold: false,
    currentPrice: 300
  },
  {
    id: uuidv4(),
    name: '精品咖啡礼盒',
    startPrice: 200,
    description: '精选来自埃塞俄比亚和哥伦比亚的单品咖啡豆，附赠手冲壶套装。',
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop',
    sold: false,
    currentPrice: 200
  },
  {
    id: uuidv4(),
    name: '高级腕表',
    startPrice: 1500,
    description: '经典机械腕表，蓝宝石表镜，真皮表带，附原厂保修卡。',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
    sold: false,
    currentPrice: 1500
  },
  {
    id: uuidv4(),
    name: '珍藏红酒',
    startPrice: 800,
    description: '法国波尔多产区2015年份红酒，酒体饱满，适合陈年收藏。',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=400&fit=crop',
    sold: false,
    currentPrice: 800
  },
  {
    id: uuidv4(),
    name: '定制书法作品',
    startPrice: 400,
    description: '本地知名书法家亲笔题写的墨宝，可根据需求定制内容。',
    image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=400&fit=crop',
    sold: false,
    currentPrice: 400
  },
  {
    id: uuidv4(),
    name: '智能家居套装',
    startPrice: 600,
    description: '包含智能音箱、智能灯泡和智能插座的入门级智能家居方案。',
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=400&h=400&fit=crop',
    sold: false,
    currentPrice: 600
  },
  {
    id: uuidv4(),
    name: '运动健身年卡',
    startPrice: 1000,
    description: '高端健身会所年度会员卡，含私教课程10节。',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=400&fit=crop',
    sold: false,
    currentPrice: 1000
  }
];

let auctionActive = true;

router.get('/', (req, res) => {
  res.json(items);
});

router.get('/status', (req, res) => {
  res.json({ active: auctionActive });
});

router.post('/status', (req, res) => {
  const { active } = req.body;
  auctionActive = active;
  res.json({ success: true, active: auctionActive });
});

router.post('/', (req, res) => {
  const { name, startPrice, description, image } = req.body;
  if (!name || !startPrice) {
    return res.status(400).json({ error: '物品名称和起拍价不能为空' });
  }
  const newItem = {
    id: uuidv4(),
    name,
    startPrice: Number(startPrice),
    description: description || '',
    image: image || '',
    sold: false,
    currentPrice: Number(startPrice)
  };
  items.push(newItem);
  res.status(201).json(newItem);
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, startPrice, description, image, sold, currentPrice } = req.body;
  const index = items.findIndex(item => item.id === id);
  if (index === -1) {
    return res.status(404).json({ error: '物品不存在' });
  }
  items[index] = {
    ...items[index],
    name: name !== undefined ? name : items[index].name,
    startPrice: startPrice !== undefined ? Number(startPrice) : items[index].startPrice,
    description: description !== undefined ? description : items[index].description,
    image: image !== undefined ? image : items[index].image,
    sold: sold !== undefined ? sold : items[index].sold,
    currentPrice: currentPrice !== undefined ? Number(currentPrice) : items[index].currentPrice
  };
  res.json(items[index]);
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const index = items.findIndex(item => item.id === id);
  if (index === -1) {
    return res.status(404).json({ error: '物品不存在' });
  }
  items.splice(index, 1);
  res.json({ success: true });
});

export default router;
