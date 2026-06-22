import { Market, Booth } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const generateBooths = (count: number, marketType: string): Booth[] => {
  const types = ['手作文艺', '二手复古', '美食小吃', '创意设计', '绿植花卉', '潮玩手办'];
  const booths: Booth[] = [];
  
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const radius = 50 + Math.random() * 180;
    const x = 300 + Math.cos(angle) * radius;
    const y = 250 + Math.sin(angle) * radius;
    
    booths.push({
      id: uuidv4(),
      name: `${types[i % types.length]}摊位${i + 1}`,
      type: types[i % types.length],
      x,
      y,
      heat: Math.random() * 100,
      size: i % 3 === 0 ? 'large' : i % 3 === 1 ? 'medium' : 'small',
      status: 'approved',
      ownerName: `摊主${i + 1}`,
      description: `这是一个很棒的${types[i % types.length]}摊位，欢迎来逛！`,
    });
  }
  
  return booths;
};

export const mockMarkets: Market[] = [
  {
    id: uuidv4(),
    name: '周末阳光二手市集',
    date: '2026-06-21',
    location: '城市中央公园',
    type: 'secondhand',
    popularity: 4,
    description: '汇聚各类二手好物，复古衣物、老物件、书籍唱片应有尽有。',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=flea%20market%20with%20vintage%20items%20outdoor%20sunny&image_size=landscape_16_9',
    booths: generateBooths(25, 'secondhand'),
    entrance: { x: 50, y: 250 },
  },
  {
    id: uuidv4(),
    name: '手作创意市集',
    date: '2026-06-22',
    location: '老厂房艺术区',
    type: 'handmade',
    popularity: 5,
    description: '手工匠人聚集地，原创首饰、皮具、陶艺、编织，每件都是独一无二。',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=handmade%20craft%20market%20artisan%20booths%20colorful&image_size=landscape_16_9',
    booths: generateBooths(30, 'handmade'),
    entrance: { x: 50, y: 250 },
  },
  {
    id: uuidv4(),
    name: '美食嘉年华',
    date: '2026-06-28',
    location: '滨江美食街',
    type: 'food',
    popularity: 5,
    description: '汇聚各地特色小吃、网红美食、手工甜品，让味蕾来一场旅行。',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=food%20market%20festival%20delicious%20street%20food%20stalls&image_size=landscape_16_9',
    booths: generateBooths(20, 'food'),
    entrance: { x: 50, y: 250 },
  },
  {
    id: uuidv4(),
    name: '复古生活市集',
    date: '2026-06-29',
    location: '文化广场',
    type: 'mixed',
    popularity: 3,
    description: '复古与现代的交融，二手好物与手作美食的完美结合。',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=vintage%20lifestyle%20market%20retro%20booths%20cozy&image_size=landscape_16_9',
    booths: generateBooths(35, 'mixed'),
    entrance: { x: 50, y: 250 },
  },
  {
    id: uuidv4(),
    name: '文创青年市集',
    date: '2026-07-05',
    location: '大学城商业街',
    type: 'handmade',
    popularity: 4,
    description: '青年创意人才的展示平台，插画、周边、手作、设计作品。',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=creative%20youth%20market%20illustration%20design%20booths&image_size=landscape_16_9',
    booths: generateBooths(28, 'handmade'),
    entrance: { x: 50, y: 250 },
  },
  {
    id: uuidv4(),
    name: '亲子趣味市集',
    date: '2026-07-12',
    location: '儿童公园',
    type: 'mixed',
    popularity: 4,
    description: '适合全家出游的市集，儿童玩具、亲子手作、美食小吃一应俱全。',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=family%20kids%20market%20colorful%20playful%20booths&image_size=landscape_16_9',
    booths: generateBooths(22, 'mixed'),
    entrance: { x: 50, y: 250 },
  },
];
