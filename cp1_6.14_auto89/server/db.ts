// ============================================================
// lowdb 数据库实例
// 数据流向：JSON 文件 ↔ 内存数据 ↔ 路由操作
// 调用关系：server/routes/*.ts 中导入 db 实例进行数据操作
// ============================================================

import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import type { User, Cloth, Outfit, SwapRequest } from '../src/types/index.js';

// ESM 模式下获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 关注关系数据结构
 */
export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
}

/**
 * 数据库数据结构
 * 包含五个核心集合：users, clothes, outfits, follows, swapRequests
 */
export interface Data {
  users: User[];
  clothes: Cloth[];
  outfits: Outfit[];
  follows: Follow[];
  swapRequests: SwapRequest[];
}

// db.json 文件路径
const dbFilePath = path.join(__dirname, 'db.json');

// 创建 JSONFile adapter
const adapter = new JSONFile<Data>(dbFilePath);

/**
 * 默认空数据
 * 当 db.json 不存在时使用此初始数据
 */
const defaultData: Data = {
  users: [],
  clothes: [],
  outfits: [],
  follows: [],
  swapRequests: [],
};

// 创建 lowdb 实例
const db = new Low<Data>(adapter, defaultData);

/**
 * 生成 Mock 示例数据
 * 包含 2 个用户，每人 8 件衣服，3 套搭配
 */
async function generateMockData(): Promise<void> {
  const now = new Date().toISOString();

  // 创建 2 个用户
  const hashedPassword1 = await bcrypt.hash('123456', 10);
  const hashedPassword2 = await bcrypt.hash('123456', 10);

  const user1: User = {
    id: uuidv4(),
    username: 'demo_user',
    password: hashedPassword1,
    avatar: '',
    bio: '时尚穿搭爱好者，喜欢分享日常穿搭灵感',
    createdAt: now,
  };

  const user2: User = {
    id: uuidv4(),
    username: 'fashion_lover',
    password: hashedPassword2,
    avatar: '',
    bio: '追求简约风格，通勤休闲都要美美的',
    createdAt: now,
  };

  // 为每个用户创建 8 件衣服
  const clothes1: Cloth[] = [
    {
      id: uuidv4(),
      userId: user1.id,
      name: '白色简约衬衫',
      category: 'top',
      imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=white%20minimalist%20shirt%20fashion%20top&image_size=square',
      styles: ['通勤', '正式'],
      seasons: ['春', '秋', '冬'],
      order: 0,
      createdAt: now,
    },
    {
      id: uuidv4(),
      userId: user1.id,
      name: '粉色针织衫',
      category: 'top',
      imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=pink%20knit%20sweater%20fashion&image_size=square',
      styles: ['约会', '休闲'],
      seasons: ['春', '秋'],
      order: 1,
      createdAt: now,
    },
    {
      id: uuidv4(),
      userId: user1.id,
      name: '黑色西装裤',
      category: 'bottom',
      imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=black%20suit%20pants%20fashion&image_size=square',
      styles: ['通勤', '正式'],
      seasons: ['春', '秋', '冬'],
      order: 2,
      createdAt: now,
    },
    {
      id: uuidv4(),
      userId: user1.id,
      name: '牛仔直筒裤',
      category: 'bottom',
      imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=blue%20straight%20jeans%20fashion&image_size=square',
      styles: ['休闲', '街头'],
      seasons: ['四季'],
      order: 3,
      createdAt: now,
    },
    {
      id: uuidv4(),
      userId: user1.id,
      name: '白色小白鞋',
      category: 'shoes',
      imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=white%20sneakers%20fashion&image_size=square',
      styles: ['休闲', '运动'],
      seasons: ['四季'],
      order: 4,
      createdAt: now,
    },
    {
      id: uuidv4(),
      userId: user1.id,
      name: '黑色高跟鞋',
      category: 'shoes',
      imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=black%20high%20heels%20fashion&image_size=square',
      styles: ['正式', '约会'],
      seasons: ['春', '夏', '秋'],
      order: 5,
      createdAt: now,
    },
    {
      id: uuidv4(),
      userId: user1.id,
      name: '珍珠项链',
      category: 'accessory',
      imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=pearl%20necklace%20fashion%20accessory&image_size=square',
      styles: ['通勤', '正式', '约会'],
      seasons: ['四季'],
      order: 6,
      createdAt: now,
    },
    {
      id: uuidv4(),
      userId: user1.id,
      name: '帆布包',
      category: 'accessory',
      imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=canvas%20tote%20bag%20fashion&image_size=square',
      styles: ['休闲', '通勤'],
      seasons: ['四季'],
      order: 7,
      createdAt: now,
    },
  ];

  const clothes2: Cloth[] = [
    {
      id: uuidv4(),
      userId: user2.id,
      name: '复古碎花裙',
      category: 'top',
      imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=vintage%20floral%20dress%20top%20fashion&image_size=square',
      styles: ['复古', '约会'],
      seasons: ['春', '夏'],
      order: 0,
      createdAt: now,
    },
    {
      id: uuidv4(),
      userId: user2.id,
      name: '运动卫衣',
      category: 'top',
      imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sports%20hoodie%20fashion&image_size=square',
      styles: ['运动', '休闲'],
      seasons: ['秋', '冬'],
      order: 1,
      createdAt: now,
    },
    {
      id: uuidv4(),
      userId: user2.id,
      name: '高腰百褶裙',
      category: 'bottom',
      imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=high%20waist%20pleated%20skirt%20fashion&image_size=square',
      styles: ['通勤', '约会'],
      seasons: ['春', '秋'],
      order: 2,
      createdAt: now,
    },
    {
      id: uuidv4(),
      userId: user2.id,
      name: '工装裤',
      category: 'bottom',
      imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cargo%20pants%20street%20fashion&image_size=square',
      styles: ['街头', '休闲'],
      seasons: ['春', '秋', '冬'],
      order: 3,
      createdAt: now,
    },
    {
      id: uuidv4(),
      userId: user2.id,
      name: '马丁靴',
      category: 'shoes',
      imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=martin%20boots%20fashion&image_size=square',
      styles: ['复古', '街头'],
      seasons: ['秋', '冬'],
      order: 4,
      createdAt: now,
    },
    {
      id: uuidv4(),
      userId: user2.id,
      name: '运动鞋',
      category: 'shoes',
      imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=running%20shoes%20sports%20fashion&image_size=square',
      styles: ['运动', '休闲'],
      seasons: ['四季'],
      order: 5,
      createdAt: now,
    },
    {
      id: uuidv4(),
      userId: user2.id,
      name: '棒球帽',
      category: 'accessory',
      imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=baseball%20cap%20street%20fashion&image_size=square',
      styles: ['街头', '运动'],
      seasons: ['春', '夏', '秋'],
      order: 6,
      createdAt: now,
    },
    {
      id: uuidv4(),
      userId: user2.id,
      name: '丝巾',
      category: 'accessory',
      imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=silk%20scarf%20elegant%20fashion&image_size=square',
      styles: ['通勤', '复古'],
      seasons: ['春', '秋', '冬'],
      order: 7,
      createdAt: now,
    },
  ];

  // 为每个用户创建 3 套搭配
  const outfits1: Outfit[] = [
    {
      id: uuidv4(),
      userId: user1.id,
      name: '通勤精英',
      description: '简约干练的职场穿搭，适合日常上班',
      topId: clothes1[0].id,
      bottomId: clothes1[2].id,
      shoesId: clothes1[5].id,
      accessoryId: clothes1[6].id,
      styleTags: ['简约通勤', '干练正式', '知性优雅调调'],
      createdAt: now,
    },
    {
      id: uuidv4(),
      userId: user1.id,
      name: '周末休闲',
      description: '舒适自在的周末穿搭，逛街约会都合适',
      topId: clothes1[1].id,
      bottomId: clothes1[3].id,
      shoesId: clothes1[4].id,
      accessoryId: clothes1[7].id,
      styleTags: ['甜美休闲', '随性约会', '舒适慵懒范儿'],
      createdAt: now,
    },
    {
      id: uuidv4(),
      userId: user1.id,
      name: '简约日常',
      description: '基础百搭的日常穿搭，轻松出门',
      topId: clothes1[0].id,
      bottomId: clothes1[3].id,
      shoesId: clothes1[4].id,
      styleTags: ['简约通勤', '休闲百搭', '利落自在感'],
      createdAt: now,
    },
  ];

  const outfits2: Outfit[] = [
    {
      id: uuidv4(),
      userId: user2.id,
      name: '复古甜心',
      description: '复古风碎花裙搭配，温柔又有气质',
      topId: clothes2[0].id,
      bottomId: clothes2[2].id,
      shoesId: clothes2[4].id,
      accessoryId: clothes2[7].id,
      styleTags: ['怀旧复古', '甜美约会', '经典浪漫风'],
      createdAt: now,
    },
    {
      id: uuidv4(),
      userId: user2.id,
      name: '街头潮酷',
      description: '工装风街头穿搭，个性十足',
      topId: clothes2[1].id,
      bottomId: clothes2[3].id,
      shoesId: clothes2[5].id,
      accessoryId: clothes2[6].id,
      styleTags: ['潮流街头', '个性运动', '酷炫前卫感'],
      createdAt: now,
    },
    {
      id: uuidv4(),
      userId: user2.id,
      name: '运动元气',
      description: '活力满满的运动穿搭，舒适又时尚',
      topId: clothes2[1].id,
      bottomId: clothes2[3].id,
      shoesId: clothes2[5].id,
      styleTags: ['活力运动', '动感休闲', '阳光元气范儿'],
      createdAt: now,
    },
  ];

  // 保存 mock 数据到 db
  db.data.users = [user1, user2];
  db.data.clothes = [...clothes1, ...clothes2];
  db.data.outfits = [...outfits1, ...outfits2];
  db.data.follows = [];
  db.data.swapRequests = [];

  await db.write();
  console.log('Mock data generated successfully!');
  console.log(`Demo user: demo_user / 123456`);
  console.log(`Demo user: fashion_lover / 123456`);
}

/**
 * 初始化数据库
 * 如果 db.json 不存在或为空，则生成 mock 数据
 */
export async function initDb(): Promise<void> {
  await db.read();
  
  // 如果没有用户数据，生成 mock 数据
  if (db.data.users.length === 0) {
    console.log('No data found, generating mock data...');
    await generateMockData();
  }
}

export default db;
