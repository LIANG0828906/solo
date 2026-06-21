import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  startTime: string;
  endTime: string;
  createdAt: string;
}

let menuItems: MenuItem[] = [
  {
    id: uuidv4(),
    name: '招牌红烧牛肉面',
    price: 28.00,
    description: '精选牛腩慢炖3小时，秘制汤底，手工拉面，筋道入味，回味无穷。',
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&h=300&fit=crop',
    startTime: '11:00',
    endTime: '14:00',
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: '法式焦糖布丁',
    price: 18.80,
    description: '传统法式工艺，丝滑口感，焦糖微苦与奶香完美融合，精致甜点首选。',
    image: 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=300&h=300&fit=crop',
    startTime: '14:00',
    endTime: '21:00',
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: '意式玛格丽特披萨',
    price: 45.00,
    description: '那不勒斯风味，手抛薄饼，新鲜罗勒叶，莫扎里拉芝士，番茄酱汁。',
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300&h=300&fit=crop',
    startTime: '17:00',
    endTime: '21:30',
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: '现磨拿铁咖啡',
    price: 22.00,
    description: '阿拉比卡咖啡豆现磨萃取，丝滑牛奶泡沫，可选择冷热，香醇浓郁。',
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=300&h=300&fit=crop',
    startTime: '08:00',
    endTime: '22:00',
    createdAt: new Date().toISOString(),
  },
];

router.get('/', (_req: Request, res: Response) => {
  res.json(menuItems);
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { name, price, description, image, startTime, endTime } = req.body;

    if (!name || name.length > 40) {
      return res.status(400).json({ error: '菜品名称不能为空且最多40字' });
    }
    if (price === undefined || price === null || isNaN(Number(price))) {
      return res.status(400).json({ error: '请输入有效的价格' });
    }
    if (description && description.length > 200) {
      return res.status(400).json({ error: '描述最多200字' });
    }

    const newItem: MenuItem = {
      id: uuidv4(),
      name,
      price: Number(price),
      description: description || '',
      image: image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=300&fit=crop',
      startTime: startTime || '09:00',
      endTime: endTime || '22:00',
      createdAt: new Date().toISOString(),
    };

    menuItems.push(newItem);
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: '创建菜品失败' });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, price, description, image, startTime, endTime } = req.body;
    const index = menuItems.findIndex((item) => item.id === id);

    if (index === -1) {
      return res.status(404).json({ error: '菜品不存在' });
    }

    if (name && name.length > 40) {
      return res.status(400).json({ error: '菜品名称最多40字' });
    }
    if (description && description.length > 200) {
      return res.status(400).json({ error: '描述最多200字' });
    }

    menuItems[index] = {
      ...menuItems[index],
      name: name !== undefined ? name : menuItems[index].name,
      price: price !== undefined ? Number(price) : menuItems[index].price,
      description: description !== undefined ? description : menuItems[index].description,
      image: image !== undefined ? image : menuItems[index].image,
      startTime: startTime !== undefined ? startTime : menuItems[index].startTime,
      endTime: endTime !== undefined ? endTime : menuItems[index].endTime,
    };

    res.json(menuItems[index]);
  } catch (err) {
    res.status(500).json({ error: '更新菜品失败' });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const index = menuItems.findIndex((item) => item.id === id);

    if (index === -1) {
      return res.status(404).json({ error: '菜品不存在' });
    }

    menuItems.splice(index, 1);
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    res.status(500).json({ error: '删除菜品失败' });
  }
});

export default router;
