import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const menuData = [
  {
    id: 'iced-1',
    name: '冰美式',
    category: 'iced',
    price: 18,
    image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=iced%20americano%20coffee%20in%20clear%20glass%20with%20ice%20cubes%20on%20wooden%20table%20cafe%20aesthetic&image_size=square',
    description: '经典美式咖啡，加入冰块，清爽醒神'
  },
  {
    id: 'iced-2',
    name: '冰拿铁',
    category: 'iced',
    price: 22,
    image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=iced%20latte%20coffee%20with%20milk%20foam%20art%20in%20tall%20glass%20cafe%20style&image_size=square',
    description: '香浓浓缩咖啡与冷牛奶的完美融合'
  },
  {
    id: 'iced-3',
    name: '冰摩卡',
    category: 'iced',
    price: 26,
    image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=iced%20mocha%20coffee%20with%20chocolate%20drizzle%20whipped%20cream%20cafe&image_size=square',
    description: '巧克力与咖啡的甜蜜邂逅，加冰更清爽'
  },
  {
    id: 'iced-4',
    name: '冰焦糖玛奇朵',
    category: 'iced',
    price: 28,
    image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=iced%20caramel%20macchiato%20coffee%20with%20caramel%20drizzle%20cafe%20beverage&image_size=square',
    description: '焦糖风味与香草牛奶的层次口感'
  },
  {
    id: 'hot-1',
    name: '热美式',
    category: 'hot',
    price: 16,
    image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=hot%20americano%20coffee%20in%20ceramic%20cup%20steam%20rising%20cozy%20cafe&image_size=square',
    description: '经典美式咖啡，醇厚浓香，温暖身心'
  },
  {
    id: 'hot-2',
    name: '热拿铁',
    category: 'hot',
    price: 20,
    image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=hot%20latte%20coffee%20with%20beautiful%20latte%20art%20heart%20shape%20cafe&image_size=square',
    description: '丝滑牛奶与浓缩咖啡的经典组合'
  },
  {
    id: 'hot-3',
    name: '热卡布奇诺',
    category: 'hot',
    price: 22,
    image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=hot%20cappuccino%20coffee%20with%20foam%20art%20cinnamon%20dust%20cozy%20cafe&image_size=square',
    description: '浓郁奶泡与意式浓缩的完美平衡'
  },
  {
    id: 'hot-4',
    name: '热巧克力',
    category: 'hot',
    price: 24,
    image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=hot%20chocolate%20drink%20with%20whipped%20cream%20marshmallow%20cozy%20cafe&image_size=square',
    description: '浓郁可可，温暖甜蜜的治愈之选'
  },
  {
    id: 'light-1',
    name: '牛角包',
    category: 'light',
    price: 12,
    image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fresh%20buttery%20croissant%20on%20plate%20bakery%20cafe%20golden%20flaky&image_size=square',
    description: '法式经典，外酥里软，黄油香浓'
  },
  {
    id: 'light-2',
    name: '芝士蛋糕',
    category: 'light',
    price: 28,
    image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=creamy%20cheesecake%20slice%20with%20berry%20topping%20cafe%20dessert&image_size=square',
    description: '绵密芝士，入口即化的甜蜜享受'
  },
  {
    id: 'light-3',
    name: '提拉米苏',
    category: 'light',
    price: 32,
    image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tiramisu%20dessert%20italian%20cafe%20style%20cocoa%20powder%20elegant&image_size=square',
    description: '意式经典，咖啡与奶油的浪漫邂逅'
  },
  {
    id: 'light-4',
    name: '三明治',
    category: 'light',
    price: 26,
    image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=gourmet%20sandwich%20with%20vegetables%20ham%20cheese%20fresh%20cafe%20lunch&image_size=square',
    description: '新鲜蔬菜搭配火腿芝士，营养美味'
  }
];

const orders = new Map();

const statusFlow = ['submitted', 'preparing', 'ready', 'completed'];

app.get('/api/menu', (req, res) => {
  setTimeout(() => {
    res.json(menuData);
  }, 200);
});

app.post('/api/orders', (req, res) => {
  const { items, pickupTime, total } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: '订单商品不能为空' });
  }

  if (!pickupTime) {
    return res.status(400).json({ error: '请选择取餐时间' });
  }

  const orderId = uuidv4();
  const now = new Date().toISOString();

  const order = {
    id: orderId,
    status: 'submitted',
    items: items.map(item => ({
      menuItemId: item.menuItemId,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    })),
    pickupTime,
    total,
    createdAt: now,
    updatedAt: now
  };

  orders.set(orderId, order);

  simulateStatusProgress(orderId);

  res.status(201).json(order);
});

function simulateStatusProgress(orderId) {
  const delays = [8000, 15000, 25000];
  
  delays.forEach((delay, index) => {
    setTimeout(() => {
      const order = orders.get(orderId);
      if (order && order.status === statusFlow[index]) {
        order.status = statusFlow[index + 1];
        order.updatedAt = new Date().toISOString();
        orders.set(orderId, order);
      }
    }, delay);
  });
}

app.get('/api/orders/:id', (req, res) => {
  const orderId = req.params.id;
  const order = orders.get(orderId);

  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  res.json(order);
});

app.listen(PORT, () => {
  console.log(`Cafe server is running on port ${PORT}`);
});
