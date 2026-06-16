import type { Project, Pledge } from './types';
import { v4 as uuidv4 } from 'uuid';

const futureDate = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

export const projects: Project[] = [
  {
    id: uuidv4(),
    name: '手作陶瓷茶具套装',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=handmade%20ceramic%20tea%20set%20warm%20orange%20tones%20elegant&image_size=square',
    targetAmount: 30000,
    currentAmount: 18500,
    deadline: futureDate(30),
    description: `# 手作陶瓷茶具套装\n\n我们是一群热爱传统陶瓷艺术的年轻人，希望通过众筹将这份温润的东方美学带给更多人。\n\n## 项目特色\n- 手工拉坯，每件独一无二\n- 原矿釉料，健康环保\n- 1280℃高温烧制，质地温润\n\n## 回报说明\n所有茶具均附赠精美礼盒包装，适合自用或送礼。`,
    rewardTiers: [
      {
        id: uuidv4(),
        amount: 50,
        description: '感谢卡 + 陶瓷小茶宠',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20ceramic%20tea%20pet%20small%20orange&image_size=square',
        deliveryDate: futureDate(60),
        limit: 200,
        pledged: 85,
      },
      {
        id: uuidv4(),
        amount: 100,
        description: '手绘陶瓷品茗杯（1只）',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=handpainted%20ceramic%20teacup%20elegant%20warm%20tones&image_size=square',
        deliveryDate: futureDate(60),
        limit: 150,
        pledged: 62,
      },
      {
        id: uuidv4(),
        amount: 200,
        description: '功夫茶具套装（一壶两杯）',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=gongfu%20tea%20set%20teapot%20two%20cups%20ceramic&image_size=square',
        deliveryDate: futureDate(75),
        limit: 80,
        pledged: 28,
      },
    ],
    status: 'approved',
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: '原创手绘明信片套装',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=handdrawn%20postcard%20set%20artistic%20watercolor%20warm&image_size=square',
    targetAmount: 10000,
    currentAmount: 8200,
    deadline: futureDate(20),
    description: `# 原创手绘明信片\n\n用画笔记录城市的温度，每一张都是独一无二的艺术品。\n\n## 包含内容\n- 12张原创手绘明信片\n- 配套复古信封\n- 专属编号收藏卡`,
    rewardTiers: [
      {
        id: uuidv4(),
        amount: 50,
        description: '明信片套装（12张）',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=postcard%20set%2012%20cards%20artistic&image_size=square',
        deliveryDate: futureDate(30),
        limit: 300,
        pledged: 110,
      },
      {
        id: uuidv4(),
        amount: 100,
        description: '签名版套装 + 手绘小画',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=signed%20postcard%20set%20with%20small%20painting&image_size=square',
        deliveryDate: futureDate(30),
        limit: 100,
        pledged: 45,
      },
      {
        id: uuidv4(),
        amount: 200,
        description: '定制专属明信片（1张）+ 全套',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=custom%20postcard%20personalized%20artwork&image_size=square',
        deliveryDate: futureDate(45),
        limit: 30,
        pledged: 12,
      },
    ],
    status: 'approved',
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: '手工皮具笔记本',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=handmade%20leather%20notebook%20journal%20vintage%20warm&image_size=square',
    targetAmount: 50000,
    currentAmount: 12000,
    deadline: futureDate(45),
    description: `# 手工皮具笔记本\n\n选用进口头层牛皮，纯手工缝制，一本可以用一辈子的笔记本。\n\n## 工艺特点\n- 头层牛皮，越用越有韵味\n- 手工蜡线缝制，坚固耐用\n- 可替换内芯设计`,
    rewardTiers: [
      {
        id: uuidv4(),
        amount: 50,
        description: '皮具书签 + 感谢卡',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=leather%20bookmark%20handmade%20elegant&image_size=square',
        deliveryDate: futureDate(40),
        limit: 200,
        pledged: 35,
      },
      {
        id: uuidv4(),
        amount: 100,
        description: '小号笔记本（A6）',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=small%20leather%20notebook%20A6%20handmade&image_size=square',
        deliveryDate: futureDate(50),
        limit: 150,
        pledged: 42,
      },
      {
        id: uuidv4(),
        amount: 200,
        description: '标准笔记本（A5）+ 笔袋',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=leather%20notebook%20A5%20with%20pencil%20case&image_size=square',
        deliveryDate: futureDate(60),
        limit: 100,
        pledged: 18,
      },
    ],
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
];

export const pledges: Pledge[] = [
  {
    id: uuidv4(),
    projectId: projects[0].id,
    tierId: projects[0].rewardTiers[0].id,
    nickname: '小明',
    email: 'xiaoming@example.com',
    message: '加油！期待作品~',
    amount: 50,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: uuidv4(),
    projectId: projects[0].id,
    tierId: projects[0].rewardTiers[1].id,
    nickname: '茶友小红',
    email: 'xiaohong@example.com',
    message: '茶具太美了，必须支持！',
    amount: 100,
    createdAt: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    id: uuidv4(),
    projectId: projects[1].id,
    tierId: projects[1].rewardTiers[0].id,
    nickname: '文艺青年',
    email: 'art@example.com',
    message: '',
    amount: 50,
    createdAt: new Date(Date.now() - 21600000).toISOString(),
  },
];
