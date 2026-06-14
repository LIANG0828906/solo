export interface User {
  id: string;
  nickname: string;
  avatar: string;
  bio: string;
  contact: string;
  swapCount: number;
}

export interface Plant {
  id: string;
  ownerId: string;
  name: string;
  variety: string;
  images: string[];
  habits: string;
  swapRequirements: string;
  isAvailable: boolean;
}

export interface SwapRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  plantId: string;
  reason: string;
  expectation: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface AdoptionPoint {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  plants: string[];
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  requiredSwaps: number;
}

export const badges: Badge[] = [
  { id: 'b1', name: '绿手指', icon: '🌱', description: '成功交换5次绿植', requiredSwaps: 5 },
  { id: 'b2', name: '园艺达人', icon: '🌿', description: '成功交换15次绿植', requiredSwaps: 15 },
  { id: 'b3', name: '扦插高手', icon: '🪴', description: '成功交换10次扦插苗', requiredSwaps: 10 },
  { id: 'b4', name: '多肉专家', icon: '🌵', description: '成功交换8次多肉植物', requiredSwaps: 8 },
  { id: 'b5', name: '花卉爱好者', icon: '🌸', description: '成功交换12次花卉', requiredSwaps: 12 },
  { id: 'b6', name: '植物收藏家', icon: '🌳', description: '成功交换20次绿植', requiredSwaps: 20 }
];

export const mockUsers: User[] = [
  {
    id: 'u1',
    nickname: '小绿',
    avatar: 'https://i.pravatar.cc/100?img=1',
    bio: '热爱植物的城市女孩，家里有30多盆绿植',
    contact: '微信：xiaolv123',
    swapCount: 8
  },
  {
    id: 'u2',
    nickname: '多肉控阿明',
    avatar: 'https://i.pravatar.cc/100?img=12',
    bio: '多肉植物深度爱好者，收集各种品种',
    contact: '电话：138****5678',
    swapCount: 15
  },
  {
    id: 'u3',
    nickname: '园丁老王',
    avatar: 'https://i.pravatar.cc/100?img=33',
    bio: '退休园艺师，喜欢分享扦插经验',
    contact: '微信：laowang_garden',
    swapCount: 25
  },
  {
    id: 'u4',
    nickname: '花花世界',
    avatar: 'https://i.pravatar.cc/100?img=45',
    bio: '阳台党，专注月季花和绿萝',
    contact: 'QQ：123456789',
    swapCount: 6
  },
  {
    id: 'me',
    nickname: '植物新手',
    avatar: 'https://i.pravatar.cc/100?img=68',
    bio: '刚刚入坑的植物爱好者，请多指教',
    contact: '微信：plant_lover',
    swapCount: 3
  }
];

const plantImages = [
  'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1546448396-6aef80193ceb?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=600&h=600&fit=crop'
];

const getPlantImg = (idx: number, count: number = 3) => {
  const imgs: string[] = [];
  for (let i = 0; i < count; i++) {
    imgs.push(plantImages[(idx + i) % plantImages.length]);
  }
  return imgs;
};

export const mockPlants: Plant[] = [
  {
    id: 'p1',
    ownerId: 'u1',
    name: '龟背竹',
    variety: '龟背竹属',
    images: getPlantImg(0),
    habits: '喜温暖湿润环境，耐阴，不耐强光直射。适宜温度20-30℃，冬季不低于5℃。',
    swapRequirements: '希望换到同大小的琴叶榕或者橡皮树，也可考虑花卉类植物。',
    isAvailable: true
  },
  {
    id: 'p2',
    ownerId: 'u2',
    name: '熊童子',
    variety: '景天科银波锦属',
    images: getPlantImg(1),
    habits: '多肉植物，喜阳光充足，耐旱。夏季需遮阴，冬季保持干燥。',
    swapRequirements: '希望换到其他稀有多肉品种，如玉露、生石花等。',
    isAvailable: true
  },
  {
    id: 'p3',
    ownerId: 'u3',
    name: '绿萝扦插苗',
    variety: '绿萝',
    images: getPlantImg(2),
    habits: '极易成活，水培土培均可。喜散射光，勤换水或保持土壤湿润。',
    swapRequirements: '免费分享，自提即可，希望交到更多植物爱好者朋友。',
    isAvailable: true
  },
  {
    id: 'p4',
    ownerId: 'u4',
    name: '月季小苗',
    variety: '丰花月季',
    images: getPlantImg(3),
    habits: '喜阳光充足，每日至少6小时光照。勤修剪可促进多开花。',
    swapRequirements: '希望换到其他颜色的月季品种，或者绣球花苗。',
    isAvailable: true
  },
  {
    id: 'p5',
    ownerId: 'u1',
    name: '虎皮兰',
    variety: '虎尾兰属',
    images: getPlantImg(4),
    habits: '极耐旱，耐阴，几乎不需要怎么打理。适合新手养护。',
    swapRequirements: '希望换到吊兰或常春藤，净化空气组合。',
    isAvailable: true
  },
  {
    id: 'p6',
    ownerId: 'u2',
    name: '吉娃娃多肉',
    variety: '拟石莲花属',
    images: getPlantImg(5),
    habits: '小型多肉，叶尖有红色点缀。喜光照，少浇水。',
    swapRequirements: '可换其他可爱小型多肉，2株换1株也可以。',
    isAvailable: true
  },
  {
    id: 'p7',
    ownerId: 'u3',
    name: '薄荷苗',
    variety: '留兰香薄荷',
    images: getPlantImg(6),
    habits: '生长迅速，喜湿润阳光充足环境。可泡茶、做菜。',
    swapRequirements: '免费分享，量大管够，欢迎来挖。',
    isAvailable: true
  },
  {
    id: 'p8',
    ownerId: 'u4',
    name: '绣球花',
    variety: '大花绣球',
    images: getPlantImg(7),
    habits: '喜半阴环境，土壤酸碱度可调节花色。酸性土开蓝花，碱性土开粉花。',
    swapRequirements: '希望换到蓝色绣球品种，或者杜鹃小苗。',
    isAvailable: true
  },
  {
    id: 'p9',
    ownerId: 'u1',
    name: '琴叶榕',
    variety: '榕属',
    images: getPlantImg(8),
    habits: '大型观叶植物，喜明亮散射光。叶片大需要定期擦拭。',
    swapRequirements: '希望换到大型绿植，如天堂鸟、散尾葵等。',
    isAvailable: true
  },
  {
    id: 'p10',
    ownerId: 'u2',
    name: '玉露',
    variety: '十二卷属',
    images: getPlantImg(9),
    habits: '软叶十二卷，喜明亮散射光，怕暴晒。叶片透明有光泽。',
    swapRequirements: '希望换到寿类或万象类十二卷。',
    isAvailable: true
  },
  {
    id: 'p11',
    ownerId: 'u3',
    name: '迷迭香',
    variety: '迷迭香',
    images: getPlantImg(0, 2),
    habits: '香草植物，喜阳光充足，耐旱。可用于烹饪和香薰。',
    swapRequirements: '希望换到其他香草，如罗勒、百里香。',
    isAvailable: true
  },
  {
    id: 'p12',
    ownerId: 'u4',
    name: '常春藤',
    variety: '常春藤',
    images: getPlantImg(1, 2),
    habits: '垂吊植物，耐阴，生长迅速。可净化空气。',
    swapRequirements: '希望换到其他垂吊植物，如佛珠、情人泪。',
    isAvailable: true
  },
  {
    id: 'p13',
    ownerId: 'me',
    name: '我的小绿萝',
    variety: '绿萝',
    images: getPlantImg(2, 2),
    habits: '水培绿萝，已经长出很多根了，非常好养。',
    swapRequirements: '希望换到任何好养的新手植物~',
    isAvailable: true
  },
  {
    id: 'p14',
    ownerId: 'me',
    name: '多肉拼盘',
    variety: '多种多肉组合',
    images: getPlantImg(3, 2),
    habits: '由3种不同的多肉组成的小拼盘，已服盆。',
    swapRequirements: '希望换到一个漂亮的陶瓷花盆。',
    isAvailable: true
  }
];

export const mockSwapRequests: SwapRequest[] = [
  {
    id: 'r1',
    fromUserId: 'u2',
    toUserId: 'me',
    plantId: 'p13',
    reason: '我家也有很多绿萝，想看看你的水培技术~',
    expectation: '可以用我的熊童子和你换',
    status: 'pending',
    createdAt: '2026-06-10'
  },
  {
    id: 'r2',
    fromUserId: 'me',
    toUserId: 'u1',
    plantId: 'p1',
    reason: '太喜欢这盆龟背竹了！我也是植物爱好者',
    expectation: '我有绿萝扦插苗可以交换',
    status: 'accepted',
    createdAt: '2026-06-08'
  },
  {
    id: 'r3',
    fromUserId: 'me',
    toUserId: 'u3',
    plantId: 'p7',
    reason: '想种薄荷做莫吉托！',
    expectation: '免费就好，我请你喝饮料~',
    status: 'rejected',
    createdAt: '2026-06-05'
  }
];

export const mockAdoptionPoints: AdoptionPoint[] = [
  {
    id: 'a1',
    name: '阳光社区绿植领养点',
    address: '北京市朝阳区阳光路88号社区服务中心',
    lat: 39.9087,
    lng: 116.3975,
    plants: ['绿萝', '吊兰', '多肉植物', '薄荷']
  },
  {
    id: 'a2',
    name: '花花世界花店',
    address: '北京市朝阳区三里屯太古里南区',
    lat: 39.9370,
    lng: 116.4560,
    plants: ['月季小苗', '绣球花', '迷迭香', '常春藤']
  },
  {
    id: 'a3',
    name: '绿色家园社区中心',
    address: '北京市海淀区中关村大街1号',
    lat: 39.9847,
    lng: 116.3057,
    plants: ['虎皮兰', '龟背竹', '琴叶榕', '绿萝']
  },
  {
    id: 'a4',
    name: '都市园艺体验店',
    address: '北京市东城区王府井大街138号',
    lat: 39.9139,
    lng: 116.4105,
    plants: ['多肉拼盘', '玉露', '熊童子', '吉娃娃']
  },
  {
    id: 'a5',
    name: '自然之友公益中心',
    address: '北京市西城区西单北大街120号',
    lat: 39.9152,
    lng: 116.3746,
    plants: ['绿萝扦插苗', '薄荷', '香草类', '吊兰']
  }
];
