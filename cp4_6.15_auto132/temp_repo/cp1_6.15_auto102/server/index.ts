import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

interface Material {
  id: string;
  name: string;
  image: string;
  quantity: number;
  description: string;
  usageScene: string;
}

interface GuideStep {
  id: number;
  image: string;
  description: string;
}

interface Guide {
  title: string;
  thumbnail: string;
  steps: GuideStep[];
}

interface TimelineItem {
  id: string;
  month: string;
  date: string;
  title: string;
  coverImage: string;
  isSubscribed: boolean;
  guide: Guide;
}

const materials: Material[] = [
  {
    id: uuidv4(),
    name: '天然亚麻布料',
    image: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=300&h=300&fit=crop',
    quantity: 3,
    description: '高品质天然亚麻，柔软透气，适合各种手工布艺项目',
    usageScene: '布艺手作、家居装饰、服装改造'
  },
  {
    id: uuidv4(),
    name: '纯棉刺绣线套装',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=300&fit=crop',
    quantity: 12,
    description: '12色精选纯棉绣线，色泽饱满，不易褪色',
    usageScene: '刺绣、十字绣、布艺装饰'
  },
  {
    id: uuidv4(),
    name: '榉木雕刻工具组',
    image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=300&h=300&fit=crop',
    quantity: 6,
    description: '优质榉木手柄雕刻刀，锋利耐用，手感舒适',
    usageScene: '木雕、橡皮章、皮具雕刻'
  },
  {
    id: uuidv4(),
    name: '羊毛毡材料包',
    image: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=300&h=300&fit=crop',
    quantity: 8,
    description: '多彩羊毛毡条，质地柔软，易于塑形',
    usageScene: '羊毛毡玩偶、胸针、小摆件'
  },
  {
    id: uuidv4(),
    name: '手工皮革套装',
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=300&h=300&fit=crop',
    quantity: 5,
    description: '头层牛皮边角料，含蜡线、菱斩、针等工具',
    usageScene: '皮具制作、钱包、钥匙扣'
  },
  {
    id: uuidv4(),
    name: '串珠饰品配件',
    image: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=300&h=300&fit=crop',
    quantity: 200,
    description: '精选天然石珠、金属配件，样式丰富',
    usageScene: '手链、项链、耳饰DIY'
  },
  {
    id: uuidv4(),
    name: '陶艺工具套装',
    image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=300&h=300&fit=crop',
    quantity: 10,
    description: '专业陶艺塑形工具，含刻刀、刮板、海绵等',
    usageScene: '陶艺创作、泥塑、手工陶器'
  },
  {
    id: uuidv4(),
    name: '植物染材料包',
    image: 'https://images.unsplash.com/photo-1523456382015-20d6828b1828?w=300&h=300&fit=crop',
    quantity: 6,
    description: '天然植物染料，苏木、栀子、靛蓝等多种颜色',
    usageScene: '草木染、布料染色、丝巾DIY'
  }
];

const timelineItems: TimelineItem[] = [
  {
    id: uuidv4(),
    month: '一月',
    date: '2024-01-15',
    title: '冬日暖织·围巾编织套装',
    coverImage: 'https://images.unsplash.com/photo-1578926288207-a90a5366759d?w=600&h=400&fit=crop',
    isSubscribed: true,
    guide: {
      title: '棒针围巾入门教程',
      thumbnail: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
      steps: [
        { id: 1, image: 'https://images.unsplash.com/photo-1578926375605-eaf7559b1458?w=300&h=200&fit=crop', description: '准备材料：毛线、棒针、剪刀' },
        { id: 2, image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=200&fit=crop', description: '起针：学习基本的起针方法' },
        { id: 3, image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=200&fit=crop', description: '编织：平针与反针交替' },
        { id: 4, image: 'https://images.unsplash.com/photo-1578926288207-a90a5366759d?w=300&h=200&fit=crop', description: '收针：完美收尾的技巧' }
      ]
    }
  },
  {
    id: uuidv4(),
    month: '二月',
    date: '2024-02-15',
    title: '花语系列·干花押花相框',
    coverImage: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=600&h=400&fit=crop',
    isSubscribed: true,
    guide: {
      title: '押花艺术入门指南',
      thumbnail: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=300&fit=crop',
      steps: [
        { id: 1, image: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=300&h=200&fit=crop', description: '选材：选择适合押制的花朵' },
        { id: 2, image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=300&h=200&fit=crop', description: '押制：使用押花板压制花朵' },
        { id: 3, image: 'https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=300&h=200&fit=crop', description: '构图：设计你的押花图案' },
        { id: 4, image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=300&h=200&fit=crop', description: '装裱：用相框永久保存作品' }
      ]
    }
  },
  {
    id: uuidv4(),
    month: '三月',
    date: '2024-03-15',
    title: '手作皮革·卡包制作套件',
    coverImage: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&h=400&fit=crop',
    isSubscribed: true,
    guide: {
      title: '手工皮具卡包教程',
      thumbnail: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=300&fit=crop',
      steps: [
        { id: 1, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=200&fit=crop', description: '裁皮：按照版型裁剪皮革' },
        { id: 2, image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop', description: '打洞：使用菱斩打出缝合孔' },
        { id: 3, image: 'https://images.unsplash.com/photo-1518882605630-893818743577?w=300&h=200&fit=crop', description: '缝制：马鞍针法牢固缝合' },
        { id: 4, image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&h=200&fit=crop', description: '封边：打磨封边提升质感' }
      ]
    }
  },
  {
    id: uuidv4(),
    month: '四月',
    date: '2024-04-15',
    title: '陶艺初体验·手捏杯套装',
    coverImage: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&h=400&fit=crop',
    isSubscribed: false,
    guide: {
      title: '手捏陶艺杯制作指南',
      thumbnail: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&h=300&fit=crop',
      steps: [
        { id: 1, image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=300&h=200&fit=crop', description: '揉泥：排除气泡，准备陶土' },
        { id: 2, image: 'https://images.unsplash.com/photo-1581338834647-bfab4714865e?w=300&h=200&fit=crop', description: '塑形：手捏法制作杯身' },
        { id: 3, image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=300&h=200&fit=crop', description: '装饰：雕刻或绘制图案' },
        { id: 4, image: 'https://images.unsplash.com/photo-1581338834647-bfab4714865e?w=300&h=200&fit=crop', description: '烧制：了解素烧与釉烧' }
      ]
    }
  },
  {
    id: uuidv4(),
    month: '五月',
    date: '2024-05-15',
    title: '刺绣物语·花卉图案材料包',
    coverImage: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=400&fit=crop',
    isSubscribed: false,
    guide: {
      title: '花卉刺绣基础教程',
      thumbnail: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop',
      steps: [
        { id: 1, image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=200&fit=crop', description: '描图：将图案转印到布料上' },
        { id: 2, image: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=300&h=200&fit=crop', description: '绣绷：正确使用绣绷固定布料' },
        { id: 3, image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=200&fit=crop', description: '针法：学习缎面绣、锁链绣等' },
        { id: 4, image: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=300&h=200&fit=crop', description: '收尾：藏线头与装裱展示' }
      ]
    }
  },
  {
    id: uuidv4(),
    month: '六月',
    date: '2024-06-15',
    title: '香氛手作·蜡烛制作套装',
    coverImage: 'https://images.unsplash.com/photo-1602607461155-06dd8d0e4f25?w=600&h=400&fit=crop',
    isSubscribed: false,
    guide: {
      title: '手工香薰蜡烛教程',
      thumbnail: 'https://images.unsplash.com/photo-1602607461155-06dd8d0e4f25?w=400&h=300&fit=crop',
      steps: [
        { id: 1, image: 'https://images.unsplash.com/photo-1602607461155-06dd8d0e4f25?w=300&h=200&fit=crop', description: '融蜡：隔水加热融化大豆蜡' },
        { id: 2, image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=300&h=200&fit=crop', description: '加香：添加精油与调色' },
        { id: 3, image: 'https://images.unsplash.com/photo-1602607461155-06dd8d0e4f25?w=300&h=200&fit=crop', description: '浇注：倒入容器并固定烛芯' },
        { id: 4, image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=300&h=200&fit=crop', description: '冷却：等待凝固并修整表面' }
      ]
    }
  }
];

const nextDelivery = new Date();
nextDelivery.setDate(nextDelivery.getDate() + 15);

app.get('/api/subscription', (_req, res) => {
  res.json({
    plan: 'premium',
    planName: '高级版',
    nextDelivery: nextDelivery.toISOString(),
    materials
  });
});

app.get('/api/materials', (_req, res) => {
  res.json({
    items: timelineItems
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
