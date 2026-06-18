export type Category = '电子产品' | '书籍' | '家居' | '服饰' | '其他';

export interface Item {
  id: string;
  name: string;
  description: string;
  category: Category;
  imageUrl: string;
  ownerName: string;
  ownerAvatar: string;
  createdAt: Date;
}

export interface ExchangeRecord {
  id: string;
  itemAName: string;
  itemBName: string;
  exchangeTime: Date;
  status: '已完成' | '进行中';
}

export interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  isSelf: boolean;
}

export const categoryColors: Record<Category, string> = {
  '电子产品': '#6C63FF',
  '书籍': '#FF6584',
  '家居': '#FFD700',
  '服饰': '#4CAF50',
  '其他': '#9E9E9E'
};

const avatarColors = ['#6C63FF', '#FF6584', '#4CAF50', '#FF9800', '#00BCD4', '#E91E63', '#9C27B0'];

export const getRandomAvatarColor = (): string => {
  return avatarColors[Math.floor(Math.random() * avatarColors.length)];
};

const initialItems: Item[] = [
  {
    id: '1',
    name: 'iPad Pro 2022 11英寸',
    description: '自用iPad Pro，256G WiFi版，成色95新，带原装键盘和笔，平时看视频做笔记用，现在想换个相机。',
    category: '电子产品',
    imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop',
    ownerName: '数码小王子',
    ownerAvatar: '#6C63FF',
    createdAt: new Date(Date.now() - 2 * 60 * 1000)
  },
  {
    id: '2',
    name: '《人类简史》+《未来简史》',
    description: '尤瓦尔·赫拉利经典著作，两本打包交换，书脊有轻微折痕，内页干净无笔记。想换心理学相关书籍。',
    category: '书籍',
    imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=300&fit=crop',
    ownerName: '书虫阿杰',
    ownerAvatar: '#FF6584',
    createdAt: new Date(Date.now() - 35 * 60 * 1000)
  },
  {
    id: '3',
    name: '北欧风实木床头柜',
    description: '纯实木床头柜，宽45cm深40cm高55cm，两个抽屉，9成新，搬家带不走。想换台灯或装饰画。',
    category: '家居',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop',
    ownerName: '家居达人Lily',
    ownerAvatar: '#4CAF50',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: '4',
    name: 'UNIQLO羊毛呢大衣M码',
    description: '优衣库羊毛混纺大衣，驼色M码，版型挺括，穿过两次，原价799。想换卫衣或运动鞋。',
    category: '服饰',
    imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=300&fit=crop',
    ownerName: '时尚买手Sam',
    ownerAvatar: '#FF9800',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
  },
  {
    id: '5',
    name: 'Sony WH-1000XM4 头戴耳机',
    description: '索尼旗舰降噪耳机，黑色，配件齐全，用了半年，降噪效果一流。想换机械键盘。',
    category: '电子产品',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',
    ownerName: '音乐发烧友',
    ownerAvatar: '#00BCD4',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  },
  {
    id: '6',
    name: 'LEGO 城市系列消防站',
    description: '乐高城市系列消防站套装，拼过一次已拆回原盒，零件完整说明书齐全。想换其他乐高套装。',
    category: '其他',
    imageUrl: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&h=300&fit=crop',
    ownerName: '积木收藏家',
    ownerAvatar: '#E91E63',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  },
  {
    id: '7',
    name: 'Kindle Paperwhite 电子书阅读器',
    description: 'Kindle Paperwhite第10代，8G，带背光，保护壳一起出，屏幕无划痕。想换实体书。',
    category: '电子产品',
    imageUrl: 'https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=400&h=300&fit=crop',
    ownerName: '文艺青年',
    ownerAvatar: '#9C27B0',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  },
  {
    id: '8',
    name: '景德镇手绘陶瓷茶具套装',
    description: '景德镇手工陶瓷茶具，一壶四杯，青花瓷风格，朋友送的用不上。想换咖啡器具。',
    category: '家居',
    imageUrl: 'https://images.unsplash.com/photo-1563822249366-3efb22b08e37?w=400&h=300&fit=crop',
    ownerName: '茶香袅袅',
    ownerAvatar: '#6C63FF',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  }
];

const initialRecords: ExchangeRecord[] = [
  {
    id: 'r1',
    itemAName: 'iPad Pro 2022',
    itemBName: 'Sony α7 相机',
    exchangeTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: '进行中'
  },
  {
    id: 'r2',
    itemAName: '《人类简史》',
    itemBName: '《思考，快与慢》',
    exchangeTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: '已完成'
  },
  {
    id: 'r3',
    itemAName: 'Sony WH-1000XM4',
    itemBName: 'Filco 机械键盘',
    exchangeTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    status: '已完成'
  },
  {
    id: 'r4',
    itemAName: 'LEGO 消防站',
    itemBName: 'LEGO 海盗船',
    exchangeTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    status: '已完成'
  }
];

export let items: Item[] = [...initialItems];
export let exchangeRecords: ExchangeRecord[] = [...initialRecords];

export const addItem = (item: Omit<Item, 'id' | 'createdAt'>): Item => {
  const newItem: Item = {
    ...item,
    id: Date.now().toString(),
    createdAt: new Date()
  };
  items = [newItem, ...items];
  return newItem;
};

export const addExchangeRecord = (record: Omit<ExchangeRecord, 'id' | 'exchangeTime'>): ExchangeRecord => {
  const newRecord: ExchangeRecord = {
    ...record,
    id: 'r' + Date.now().toString(),
    exchangeTime: new Date()
  };
  exchangeRecords = [newRecord, ...exchangeRecords];
  return newRecord;
};

export const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  return date.toLocaleDateString('zh-CN');
};

export const formatDateTime = (date: Date): string => {
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};
