import { Stall, MenuItem, Order, OrderStatus } from './types';
import { v4 as uuidv4 } from 'uuid';

export const stalls: Stall[] = [
  {
    id: 'stall-1',
    name: '老成都串串香',
    cuisine: '川菜',
    cuisineColor: '#E74C3C',
    waitTime: 15,
    position: { x: 15, y: 25 },
    description: '正宗成都味道，麻辣鲜香',
    emoji: '🍢'
  },
  {
    id: 'stall-2',
    name: '樱花寿司屋',
    cuisine: '日料',
    cuisineColor: '#3498DB',
    waitTime: 20,
    position: { x: 40, y: 20 },
    description: '新鲜食材，匠心手作',
    emoji: '🍣'
  },
  {
    id: 'stall-3',
    name: '纽约牛排馆',
    cuisine: '西餐',
    cuisineColor: '#F1C40F',
    waitTime: 25,
    position: { x: 70, y: 30 },
    description: '进口牛排，鲜嫩多汁',
    emoji: '🥩'
  },
  {
    id: 'stall-4',
    name: '粤式茶餐厅',
    cuisine: '粤菜',
    cuisineColor: '#2ECC71',
    waitTime: 12,
    position: { x: 25, y: 55 },
    description: '经典港式点心，早茶首选',
    emoji: '🥟'
  },
  {
    id: 'stall-5',
    name: '泰式酸辣摊',
    cuisine: '泰菜',
    cuisineColor: '#9B59B6',
    waitTime: 18,
    position: { x: 55, y: 50 },
    description: '酸辣鲜香，异域风味',
    emoji: '🍜'
  },
  {
    id: 'stall-6',
    name: '西北羊肉串',
    cuisine: '烧烤',
    cuisineColor: '#E67E22',
    waitTime: 10,
    position: { x: 80, y: 60 },
    description: '炭火烤制，外酥里嫩',
    emoji: '🍖'
  },
  {
    id: 'stall-7',
    name: '韩式炒年糕',
    cuisine: '韩餐',
    cuisineColor: '#E84393',
    waitTime: 14,
    position: { x: 15, y: 75 },
    description: 'Q弹年糕，甜辣可口',
    emoji: '🍡'
  },
  {
    id: 'stall-8',
    name: '闽南蚵仔煎',
    cuisine: '闽菜',
    cuisineColor: '#00CEC9',
    waitTime: 16,
    position: { x: 45, y: 78 },
    description: '外酥内嫩，海味十足',
    emoji: '🦪'
  },
  {
    id: 'stall-9',
    name: '意大利面馆',
    cuisine: '西餐',
    cuisineColor: '#F39C12',
    waitTime: 22,
    position: { x: 75, y: 82 },
    description: '手工意面，浓郁酱料',
    emoji: '🍝'
  },
  {
    id: 'stall-10',
    name: '老北京爆肚',
    cuisine: '京菜',
    cuisineColor: '#C0392B',
    waitTime: 8,
    position: { x: 50, y: 35 },
    description: '脆嫩爽口，地道京味',
    emoji: '🥘'
  }
];

const foodImages = [
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1572441713132-c542fc4fe282?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=400&h=400&fit=crop'
];

const dishNames: Record<string, string[][]> = {
  'stall-1': [
    ['麻辣牛肉串', '精选牛肉，秘制辣酱'],
    ['香辣土豆片', '薄脆爽口，麻辣鲜香'],
    ['藤椒鸡胗', '藤椒味浓，爽脆有嚼劲'],
    ['蒜蓉茄子', '软糯入味，蒜香四溢'],
    ['五香豆干', '卤味十足，越嚼越香'],
    ['爆浆豆腐', '外酥内嫩，一口爆浆'],
    ['香辣藕片', '脆嫩爽口，麻辣开胃']
  ],
  'stall-2': [
    ['三文鱼刺身', '新鲜挪威三文鱼'],
    ['加州卷', '牛油果蟹肉搭配'],
    ['鳗鱼寿司', '蒲烧鳗鱼，香甜软糯'],
    ['金枪鱼握寿司', '蓝鳍金枪鱼大腹'],
    ['味噌汤', '传统日式味噌汤'],
    ['天妇罗拼盘', '时蔬鲜虾天妇罗'],
    ['日式煎饺', '皮脆馅嫩，蘸酱美味']
  ],
  'stall-3': [
    ['菲力牛排', '精选牛柳，五分熟最佳'],
    ['西冷牛排', '带骨西冷，肉质紧实'],
    ['凯撒沙拉', '新鲜蔬菜，凯撒酱'],
    ['奶油蘑菇汤', '浓郁奶香，鲜美可口'],
    ['芝士焗薯泥', '绵密细腻，芝士香浓'],
    ['黑椒牛柳意面', '黑椒浓郁，牛柳嫩滑'],
    ['提拉米苏', '意式经典甜品'],
    ['法式洋葱汤', '浓郁洋葱香，芝士盖顶']
  ],
  'stall-4': [
    ['虾饺皇', '晶莹剔透，大颗虾仁'],
    ['叉烧包', '蜜汁叉烧，松软可口'],
    ['肠粉', '滑嫩肠粉，鲜香酱汁'],
    ['糯米鸡', '软糯入味，馅料丰富'],
    ['蛋挞', '酥皮嫩滑，蛋香浓郁'],
    ['凤爪', '软烂脱骨，豉汁香浓'],
    ['烧卖皇', '猪肉虾仁，鲜美多汁']
  ],
  'stall-5': [
    ['冬阴功汤', '酸辣鲜香，大虾汤底'],
    ['泰式炒河粉', '酸甜可口，花生碎点缀'],
    ['青木瓜沙拉', '爽脆开胃，酸辣够味'],
    ['绿咖喱鸡', '椰香浓郁，绿咖喱酱'],
    ['芒果糯米饭', '香甜芒果，椰香糯米'],
    ['泰式鱼饼', '外酥内嫩，蘸酸辣酱'],
    ['咖喱牛肉', '黄咖喱配牛腩']
  ],
  'stall-6': [
    ['红柳羊肉串', '红柳枝穿制，炭火烤制'],
    ['烤羊腰', '鲜嫩多汁，孜然飘香'],
    ['烤茄子', '蒜蓉铺满，软糯入味'],
    ['烤韭菜', '香辣过瘾，下酒好菜'],
    ['烤馒头片', '外脆内软，刷酱美味'],
    ['烤鸡中翅', '皮脆肉嫩，秘制腌料'],
    ['烤金针菇', '蒜蓉粉丝，鲜香入味'],
    ['烤土豆片', '薄脆香辣，停不下来']
  ],
  'stall-7': [
    ['辣炒年糕', '经典韩式甜辣味'],
    ['芝士年糕', '芝士夹心，拉丝超长'],
    ['韩式炸鸡', '外酥内嫩，甜辣酱'],
    ['鱼饼串', '鲜香Q弹，汤头鲜美'],
    ['紫菜包饭', '清爽可口，馅料丰富'],
    ['石锅拌饭', '锅巴香脆，配辣酱'],
    ['大酱汤', '韩式传统大酱汤']
  ],
  'stall-8': [
    ['蚵仔煎', '新鲜蚵仔，外酥内嫩'],
    ['大肠包小肠', '台式经典，糯米肠配香肠'],
    ['棺材板', '创意料理，奶香浓郁'],
    ['盐酥鸡', '外酥内嫩，胡椒飘香'],
    ['甜不辣', 'Q弹爽口，甜辣酱'],
    ['珍珠奶茶', '台式正宗，Q弹珍珠'],
    ['芒果冰', '新鲜芒果，绵绵冰']
  ],
  'stall-9': [
    ['奶油培根意面', '浓郁奶香，培根香脆'],
    ['番茄肉酱意面', '经典博洛尼亚风味'],
    ['海鲜意面', '鲜虾蛤蜊，白葡萄酒酱'],
    ['蘑菇松露意面', '黑松露香气，浓郁鲜美'],
    ['凯撒沙拉', '新鲜蔬菜，酥脆面包丁'],
    ['洋葱汤', '法式经典，芝士焗烤'],
    ['提拉米苏', '意式甜品，咖啡酒香'],
    ['蒜蓉面包', '香蒜黄油，外脆内软']
  ],
  'stall-10': [
    ['爆肚', '脆嫩爽口，麻酱料'],
    ['炸酱面', '老北京传统味道'],
    ['卤煮火烧', '猪肠猪肺，汤汁浓郁'],
    ['炒肝', '浓稠蒜香，配包子'],
    ['豆汁焦圈', '老北京特色早餐'],
    ['糖火烧', '香甜酥脆，麻酱味浓'],
    ['艾窝窝', '软糯香甜，豆沙馅']
  ]
};

export const generateMenuItems = (): MenuItem[] => {
  const items: MenuItem[] = [];
  
  stalls.forEach(stall => {
    const dishes = dishNames[stall.id] || [];
    dishes.forEach((dish, index) => {
      const stock = Math.floor(Math.random() * 30) + 5;
      let stockStatus: '充足' | '紧张' | '售罄' = '充足';
      if (stock < 5) stockStatus = '售罄';
      else if (stock < 10) stockStatus = '紧张';
      
      items.push({
        id: `menu-${stall.id}-${index}`,
        stallId: stall.id,
        name: dish[0],
        price: Math.floor(Math.random() * 40) + 15,
        description: dish[1],
        image: foodImages[index % foodImages.length],
        stock,
        stockStatus
      });
    });
  });
  
  return items;
};

export const menuItems = generateMenuItems();

export const initialOrders: Order[] = [
  {
    id: uuidv4(),
    stallId: 'stall-1',
    items: [
      { menuItemId: 'menu-stall-1-0', stallId: 'stall-1', name: '麻辣牛肉串', price: 28, quantity: 2, image: foodImages[0] }
    ],
    totalPrice: 56,
    status: OrderStatus.PREPARING,
    createdAt: Date.now() - 300000
  },
  {
    id: uuidv4(),
    stallId: 'stall-2',
    items: [
      { menuItemId: 'menu-stall-2-1', stallId: 'stall-2', name: '加州卷', price: 38, quantity: 1, image: foodImages[1] },
      { menuItemId: 'menu-stall-2-3', stallId: 'stall-2', name: '金枪鱼握寿司', price: 48, quantity: 1, image: foodImages[3] }
    ],
    totalPrice: 86,
    status: OrderStatus.READY,
    createdAt: Date.now() - 600000
  }
];
