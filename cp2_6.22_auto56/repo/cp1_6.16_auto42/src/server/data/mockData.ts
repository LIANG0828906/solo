import { v4 as uuidv4 } from 'uuid';
import type { Animal, AdoptionApplication, InventoryItem, User, Notification, InventoryLog } from '../../client/types';

const generateAnimalPhoto = (seed: string, width: number = 400, height: number = 300) => {
  return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(`cute ${seed} pet animal, high quality, professional photography`)}&image_size=square_hd`;
};

export const mockAnimals: Animal[] = [
  {
    id: uuidv4(),
    name: '小黄',
    photos: [
      generateAnimalPhoto('golden retriever puppy'),
      generateAnimalPhoto('happy golden retriever'),
      generateAnimalPhoto('golden retriever playing')
    ],
    breed: '金毛寻回犬',
    age: '1岁',
    gender: 'male',
    personality: '温顺、活泼、喜欢与人亲近，特别喜欢小孩子',
    healthTags: ['已驱虫', '已绝育', '已打疫苗'],
    station: '北京朝阳分站',
    adoptionRequirements: ['有稳定住所', '有养宠经验优先', '承诺科学喂养', '接受定期回访'],
    status: 'available',
    createdAt: new Date('2025-01-15').toISOString()
  },
  {
    id: uuidv4(),
    name: '豆豆',
    photos: [
      generateAnimalPhoto('corgi dog'),
      generateAnimalPhoto('corgi puppy')
    ],
    breed: '柯基',
    age: '8个月',
    gender: 'female',
    personality: '聪明活泼，精力旺盛，喜欢玩球',
    healthTags: ['已驱虫', '已打疫苗'],
    station: '上海浦东分站',
    adoptionRequirements: ['有足够活动空间', '每天能遛狗2次', '了解柯基特性'],
    status: 'available',
    createdAt: new Date('2025-02-10').toISOString()
  },
  {
    id: uuidv4(),
    name: '咪咪',
    photos: [
      generateAnimalPhoto('orange tabby cat'),
      generateAnimalPhoto('cute orange cat')
    ],
    breed: '橘猫',
    age: '2岁',
    gender: 'female',
    personality: '安静温柔，喜欢晒太阳，会在你回家时迎接你',
    healthTags: ['已驱虫', '已绝育', '已打疫苗'],
    station: '北京朝阳分站',
    adoptionRequirements: ['住所封闭安全', '了解猫咪习性', '不离不弃'],
    status: 'available',
    createdAt: new Date('2025-01-20').toISOString()
  },
  {
    id: uuidv4(),
    name: '大黑',
    photos: [
      generateAnimalPhoto('husky dog'),
      generateAnimalPhoto('siberian husky')
    ],
    breed: '哈士奇',
    age: '3岁',
    gender: 'male',
    personality: '热情开朗，表情丰富，是个表情包担当',
    healthTags: ['已驱虫', '已绝育', '已打疫苗'],
    station: '广州天河分站',
    adoptionRequirements: ['有养大型犬经验', '有足够时间陪伴', '能接受拆家风险'],
    status: 'available',
    createdAt: new Date('2025-02-05').toISOString()
  },
  {
    id: uuidv4(),
    name: '雪球',
    photos: [
      generateAnimalPhoto('samoyed dog'),
      generateAnimalPhoto('white fluffy dog')
    ],
    breed: '萨摩耶',
    age: '1岁半',
    gender: 'female',
    personality: '微笑天使，超级黏人，毛发需要经常打理',
    healthTags: ['已驱虫', '已打疫苗'],
    station: '深圳南山分站',
    adoptionRequirements: ['能接受定期美容', '有时间梳毛', '有耐心训练'],
    status: 'available',
    createdAt: new Date('2025-02-15').toISOString()
  },
  {
    id: uuidv4(),
    name: '花花',
    photos: [
      generateAnimalPhoto('calico cat'),
      generateAnimalPhoto('three colored cat')
    ],
    breed: '中华田园犬',
    age: '3个月',
    gender: 'female',
    personality: '小奶猫，好奇心强，喜欢探索新事物',
    healthTags: ['已驱虫'],
    station: '北京海淀分站',
    adoptionRequirements: ['有耐心照顾幼猫', '按时打疫苗', '科学喂养'],
    status: 'available',
    createdAt: new Date('2025-03-01').toISOString()
  },
  {
    id: uuidv4(),
    name: '毛毛',
    photos: [
      generateAnimalPhoto('poodle dog'),
      generateAnimalPhoto('toy poodle')
    ],
    breed: '泰迪',
    age: '2岁',
    gender: 'male',
    personality: '聪明伶俐，会很多技能，喜欢卖萌',
    healthTags: ['已驱虫', '已绝育', '已打疫苗'],
    station: '上海静安分站',
    adoptionRequirements: ['有养宠经验', '定期美容', '不弃养'],
    status: 'pending',
    createdAt: new Date('2025-01-25').toISOString()
  },
  {
    id: uuidv4(),
    name: '团子',
    photos: [
      generateAnimalPhoto('british shorthair cat'),
      generateAnimalPhoto('gray cat')
    ],
    breed: '英短',
    age: '1岁',
    gender: 'male',
    personality: '圆脸大眼，性格稳重，喜欢安静',
    healthTags: ['已驱虫', '已绝育', '已打疫苗'],
    station: '杭州西湖分站',
    adoptionRequirements: ['工作稳定', '了解英短特性', '定期体检'],
    status: 'available',
    createdAt: new Date('2025-02-20').toISOString()
  },
  {
    id: uuidv4(),
    name: '旺财',
    photos: [
      generateAnimalPhoto('chinese rural dog'),
      generateAnimalPhoto('street dog')
    ],
    breed: '中华田园犬',
    age: '4岁',
    gender: 'male',
    personality: '忠诚可靠，看家护院小能手，经历过流浪更懂珍惜',
    healthTags: ['已驱虫', '已绝育', '已打疫苗'],
    station: '成都武侯分站',
    adoptionRequirements: ['有独立住房', '能接受土狗', '真心爱护'],
    status: 'available',
    createdAt: new Date('2025-01-10').toISOString()
  },
  {
    id: uuidv4(),
    name: '雪糕',
    photos: [
      generateAnimalPhoto('bichon frise'),
      generateAnimalPhoto('white fluffy dog')
    ],
    breed: '比熊',
    age: '6个月',
    gender: 'female',
    personality: '棉花糖一样的小可爱，粘人爱撒娇',
    healthTags: ['已驱虫', '已打疫苗'],
    station: '南京鼓楼分站',
    adoptionRequirements: ['有时间陪伴', '定期美容', '科学喂养'],
    status: 'available',
    createdAt: new Date('2025-03-05').toISOString()
  },
  {
    id: uuidv4(),
    name: '布丁',
    photos: [
      generateAnimalPhoto('ragdoll cat'),
      generateAnimalPhoto('blue eyes cat')
    ],
    breed: '布偶猫',
    age: '1岁',
    gender: 'female',
    personality: '蓝眼睛小仙女，性格温顺如布偶',
    healthTags: ['已驱虫', '已打疫苗'],
    station: '武汉洪山分站',
    adoptionRequirements: ['经济条件好', '了解品种猫饲养', '定期体检'],
    status: 'available',
    createdAt: new Date('2025-02-25').toISOString()
  },
  {
    id: uuidv4(),
    name: '阿福',
    photos: [
      generateAnimalPhoto('alaskan malamute'),
      generateAnimalPhoto('big fluffy dog')
    ],
    breed: '阿拉斯加',
    age: '2岁',
    gender: 'male',
    personality: '大型暖男，虽然体型大但是很温柔',
    healthTags: ['已驱虫', '已绝育', '已打疫苗'],
    station: '西安雁塔分站',
    adoptionRequirements: ['有养大型犬经验', '有足够空间', '能接受掉毛'],
    status: 'available',
    createdAt: new Date('2025-02-01').toISOString()
  }
];

export const mockUsers: User[] = [
  {
    id: uuidv4(),
    username: 'admin',
    email: 'admin@petrescue.org',
    role: 'admin',
    createdAt: new Date('2024-01-01').toISOString()
  },
  {
    id: uuidv4(),
    username: 'volunteer1',
    email: 'volunteer1@petrescue.org',
    role: 'volunteer',
    createdAt: new Date('2024-06-01').toISOString()
  },
  {
    id: uuidv4(),
    username: 'adopter1',
    email: 'adopter1@example.com',
    role: 'adopter',
    createdAt: new Date('2025-01-01').toISOString()
  },
  {
    id: uuidv4(),
    username: 'adopter2',
    email: 'adopter2@example.com',
    role: 'adopter',
    createdAt: new Date('2025-01-15').toISOString()
  }
];

export const mockAdoptions: AdoptionApplication[] = [
  {
    id: uuidv4(),
    animalId: mockAnimals[0].id,
    animalName: mockAnimals[0].name,
    applicantId: mockUsers[2].id,
    applicantName: '张三',
    personalIntro: '我是一名程序员，工作时间弹性，有充足的时间照顾宠物。之前养过一只金毛，陪伴了我10年，因为年老去世了。现在想再领养一只，给它一个温暖的家。',
    livingSituation: '住在北京朝阳区，自有住房，120平米三居室，小区有花园，适合遛狗。已安装防护窗。',
    petExperience: '有10年金毛饲养经验，了解狗狗的基本护理、训练方法和常见疾病处理。',
    status: 'pending',
    createdAt: new Date('2025-03-10').toISOString()
  },
  {
    id: uuidv4(),
    animalId: mockAnimals[2].id,
    animalName: mockAnimals[2].name,
    applicantId: mockUsers[3].id,
    applicantName: '李四',
    personalIntro: '女，28岁，单身，做设计工作，喜欢安静。从小就喜欢猫咪，工作稳定后终于可以养一只了。',
    livingSituation: '在上海工作，租的一居室，已经和房东确认可以养猫。窗户都有防护网。',
    petExperience: '之前帮朋友照顾过猫咪，了解猫咪的基本护理，做了很多养猫功课。',
    status: 'approved',
    feedback: '咪咪已经完全适应新家了，每天都会在门口等我下班，太幸福了！',
    createdAt: new Date('2025-02-20').toISOString(),
    reviewedAt: new Date('2025-02-25').toISOString()
  }
];

export const mockInventory: InventoryItem[] = [
  {
    id: uuidv4(),
    name: '成猫猫粮',
    category: 'food',
    quantity: 150,
    unit: '袋',
    expiryDate: '2026-12-31',
    supplier: '皇家宠物食品有限公司',
    threshold: 20,
    createdAt: new Date('2025-01-01').toISOString()
  },
  {
    id: uuidv4(),
    name: '幼犬狗粮',
    category: 'food',
    quantity: 5,
    unit: '袋',
    expiryDate: '2026-06-30',
    supplier: '冠能宠物食品',
    threshold: 10,
    createdAt: new Date('2025-01-05').toISOString()
  },
  {
    id: uuidv4(),
    name: '体内驱虫药',
    category: 'medicine',
    quantity: 80,
    unit: '盒',
    expiryDate: '2026-08-15',
    supplier: '拜耳医药',
    threshold: 15,
    createdAt: new Date('2025-01-10').toISOString()
  },
  {
    id: uuidv4(),
    name: '体外驱虫滴剂',
    category: 'medicine',
    quantity: 8,
    unit: '盒',
    expiryDate: '2026-03-31',
    supplier: '福来恩',
    threshold: 10,
    createdAt: new Date('2025-01-12').toISOString()
  },
  {
    id: uuidv4(),
    name: '宠物沐浴露',
    category: 'supplies',
    quantity: 45,
    unit: '瓶',
    expiryDate: '2027-01-01',
    supplier: '强生宠物护理',
    threshold: 10,
    createdAt: new Date('2025-01-15').toISOString()
  },
  {
    id: uuidv4(),
    name: '猫砂',
    category: 'supplies',
    quantity: 200,
    unit: '袋',
    supplier: '洁珊',
    threshold: 30,
    createdAt: new Date('2025-01-18').toISOString()
  },
  {
    id: uuidv4(),
    name: '宠物笼子（中号）',
    category: 'equipment',
    quantity: 12,
    unit: '个',
    supplier: '宠物用品批发',
    threshold: 5,
    createdAt: new Date('2025-01-20').toISOString()
  },
  {
    id: uuidv4(),
    name: '宠物牵引绳',
    category: 'supplies',
    quantity: 3,
    unit: '根',
    supplier: '宠物用品批发',
    threshold: 10,
    createdAt: new Date('2025-01-22').toISOString()
  },
  {
    id: uuidv4(),
    name: '狂犬疫苗',
    category: 'medicine',
    quantity: 200,
    unit: '支',
    expiryDate: '2026-12-01',
    supplier: '长春生物制药',
    threshold: 50,
    createdAt: new Date('2025-01-25').toISOString()
  },
  {
    id: uuidv4(),
    name: '宠物食盆',
    category: 'supplies',
    quantity: 50,
    unit: '个',
    supplier: '宠物用品批发',
    threshold: 10,
    createdAt: new Date('2025-01-28').toISOString()
  }
];

export const mockInventoryLogs: InventoryLog[] = [
  {
    id: uuidv4(),
    itemId: mockInventory[0].id,
    type: 'inbound',
    quantity: 100,
    supplier: '皇家宠物食品有限公司',
    operatorId: mockUsers[0].id,
    createdAt: new Date('2025-02-01').toISOString()
  },
  {
    id: uuidv4(),
    itemId: mockInventory[0].id,
    type: 'outbound',
    quantity: 10,
    purpose: '朝阳分站日常消耗',
    operatorId: mockUsers[0].id,
    createdAt: new Date('2025-02-15').toISOString()
  }
];

export const mockNotifications: Notification[] = [
  {
    id: uuidv4(),
    userId: mockUsers[0].id,
    type: 'new_application',
    message: '收到新的领养申请：张三申请领养小黄',
    read: false,
    createdAt: new Date('2025-03-10').toISOString()
  },
  {
    id: uuidv4(),
    userId: mockUsers[0].id,
    type: 'low_stock',
    message: '库存预警：幼犬狗粮库存不足（剩余5袋）',
    read: false,
    createdAt: new Date('2025-03-08').toISOString()
  },
  {
    id: uuidv4(),
    userId: mockUsers[3].id,
    type: 'status_update',
    message: '您的领养申请已通过！请尽快联系救助站办理手续',
    read: true,
    createdAt: new Date('2025-02-25').toISOString()
  }
];

export const mockPasswords: Record<string, string> = {
  [mockUsers[0].id]: 'admin123',
  [mockUsers[1].id]: 'volunteer123',
  [mockUsers[2].id]: 'adopter123',
  [mockUsers[3].id]: 'adopter123'
};
