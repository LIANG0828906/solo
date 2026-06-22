import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const flavorData = {
  id: 'root',
  name: '咖啡风味',
  children: [
    {
      id: 'sour',
      name: '酸',
      description: '明亮活泼的酸度，是咖啡风味的骨架',
      intensity: 4,
      children: [
        {
          id: 'citrus',
          name: '柑橘类',
          description: '清爽的柑橘水果风味',
          roastLevel: ['light', 'medium'],
          origin: ['africa', 'central_south_america'],
          intensity: 3,
          children: [
            { id: 'lemon', name: '柠檬', description: '清新明亮的柠檬酸味', roastLevel: ['light'], origin: ['africa'], intensity: 4 },
            { id: 'orange', name: '橙子', description: '甜蜜的柑橘风味', roastLevel: ['light', 'medium'], origin: ['central_south_america'], intensity: 3 },
            { id: 'grapefruit', name: '西柚', description: '微苦的柑橘风味', roastLevel: ['light'], origin: ['africa'], intensity: 3 }
          ]
        },
        {
          id: 'berry',
          name: '浆果类',
          description: '复杂的莓果酸甜',
          roastLevel: ['light', 'medium'],
          origin: ['africa'],
          intensity: 4,
          children: [
            { id: 'strawberry', name: '草莓', description: '甜蜜的红色浆果', roastLevel: ['light'], origin: ['africa'], intensity: 4 },
            { id: 'blueberry', name: '蓝莓', description: '浓郁的紫色浆果', roastLevel: ['light', 'medium'], origin: ['africa'], intensity: 4 },
            { id: 'raspberry', name: '覆盆子', description: '明亮的酸甜浆果', roastLevel: ['light'], origin: ['africa'], intensity: 4 }
          ]
        },
        {
          id: 'stone_fruit',
          name: '核果类',
          description: '成熟核果的甜美',
          roastLevel: ['medium'],
          origin: ['central_south_america'],
          intensity: 3,
          children: [
            { id: 'peach', name: '桃子', description: '柔软的蜜桃甜香', roastLevel: ['medium'], origin: ['central_south_america'], intensity: 3 },
            { id: 'apricot', name: '杏子', description: '浓郁的杏香', roastLevel: ['medium'], origin: ['central_south_america'], intensity: 3 },
            { id: 'cherry', name: '樱桃', description: '饱满的樱桃酸甜', roastLevel: ['light', 'medium'], origin: ['africa', 'central_south_america'], intensity: 4 }
          ]
        }
      ]
    },
    {
      id: 'sweet',
      name: '甜',
      description: '圆润饱满的甜感，带来愉悦的体验',
      intensity: 3,
      children: [
        {
          id: 'chocolate',
          name: '巧克力',
          description: '浓郁的可可风味',
          roastLevel: ['medium', 'dark'],
          origin: ['central_south_america', 'asia'],
          intensity: 4,
          children: [
            { id: 'dark_chocolate', name: '黑巧克力', description: '醇厚的苦甜可可', roastLevel: ['medium', 'dark'], origin: ['central_south_america'], intensity: 5 },
            { id: 'milk_chocolate', name: '牛奶巧克力', description: '丝滑的甜巧克力', roastLevel: ['medium'], origin: ['central_south_america', 'asia'], intensity: 3 }
          ]
        },
        {
          id: 'caramel',
          name: '焦糖',
          description: '温暖的焦糖化甜感',
          roastLevel: ['medium', 'dark'],
          origin: ['central_south_america', 'asia'],
          intensity: 3,
          children: [
            { id: 'toffee', name: '太妃糖', description: '浓郁的奶油焦糖', roastLevel: ['medium', 'dark'], origin: ['central_south_america'], intensity: 4 },
            { id: 'brown_sugar', name: '红糖', description: '温润的蔗糖甜香', roastLevel: ['medium'], origin: ['asia', 'central_south_america'], intensity: 3 },
            { id: 'maple', name: '枫糖', description: '优雅的木质甜香', roastLevel: ['medium'], origin: ['central_south_america'], intensity: 3 }
          ]
        },
        {
          id: 'nutty',
          name: '坚果类',
          description: '温暖的烘焙坚果香',
          roastLevel: ['medium', 'dark'],
          origin: ['central_south_america', 'asia'],
          intensity: 3,
          children: [
            { id: 'hazelnut', name: '榛子', description: '经典的榛果香气', roastLevel: ['medium', 'dark'], origin: ['central_south_america', 'asia'], intensity: 3 },
            { id: 'almond', name: '杏仁', description: '清雅的杏仁香', roastLevel: ['medium'], origin: ['central_south_america'], intensity: 3 },
            { id: 'peanut', name: '花生', description: '浓郁的烘烤花生', roastLevel: ['dark'], origin: ['asia'], intensity: 4 }
          ]
        }
      ]
    },
    {
      id: 'bitter',
      name: '苦',
      description: '深厚的苦味，增加风味层次',
      intensity: 4,
      children: [
        {
          id: 'roasted',
          name: '烘焙类',
          description: '咖啡豆烘焙带来的焦香',
          roastLevel: ['dark'],
          origin: ['asia', 'central_south_america'],
          intensity: 5,
          children: [
            { id: 'smoky', name: '烟熏', description: '强烈的烟熏风味', roastLevel: ['dark'], origin: ['asia'], intensity: 5 },
            { id: 'burnt', name: '焦香', description: '深度烘焙的焦糖化', roastLevel: ['dark'], origin: ['central_south_america', 'asia'], intensity: 4 },
            { id: 'toast', name: '烤面包', description: '温暖的谷物烘焙香', roastLevel: ['dark'], origin: ['central_south_america'], intensity: 3 }
          ]
        },
        {
          id: 'spice',
          name: '香料类',
          description: '温暖的辛香料风味',
          roastLevel: ['medium', 'dark'],
          origin: ['asia', 'africa'],
          intensity: 4,
          children: [
            { id: 'cinnamon', name: '肉桂', description: '温暖的甜香料', roastLevel: ['medium', 'dark'], origin: ['asia'], intensity: 4 },
            { id: 'clove', name: '丁香', description: '浓郁的辛香', roastLevel: ['dark'], origin: ['asia'], intensity: 5 },
            { id: 'pepper', name: '胡椒', description: '微辣的香料感', roastLevel: ['medium', 'dark'], origin: ['africa', 'asia'], intensity: 4 }
          ]
        },
        {
          id: 'earthy',
          name: '泥土类',
          description: '沉稳的大地气息',
          roastLevel: ['dark'],
          origin: ['asia'],
          intensity: 3,
          children: [
            { id: 'moss', name: '苔藓', description: '湿润的森林气息', roastLevel: ['dark'], origin: ['asia'], intensity: 3 },
            { id: 'wood', name: '木材', description: '干燥的木质香气', roastLevel: ['medium', 'dark'], origin: ['asia'], intensity: 3 },
            { id: 'leather', name: '皮革', description: '深沉的皮革香', roastLevel: ['dark'], origin: ['asia'], intensity: 4 }
          ]
        }
      ]
    }
  ]
};

const logs = [];

app.get('/api/flavors', (_req, res) => {
  res.json(flavorData);
});

app.post('/api/log', (req, res) => {
  const { beanName, flavors, timestamp } = req.body;
  const id = Date.now().toString();
  const log = { id, beanName, flavors, timestamp };
  logs.push(log);
  res.json({ success: true, message: '记录已保存', id });
});

app.listen(PORT, () => {
  console.log(`Flavor API server running on port ${PORT}`);
});
