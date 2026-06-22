import { PrismaClient, RoastLevel } from '@prisma/client';

const prisma = new PrismaClient();

const FLAVOR_TAGS = [
  { name: '花香', color: '#E91E63' },
  { name: '果酸', color: '#FF9800' },
  { name: '巧克力', color: '#795548' },
  { name: '坚果', color: '#A1887F' },
  { name: '焦糖', color: '#FFB74D' },
  { name: '烟熏', color: '#455A64' },
  { name: '草本', color: '#66BB6A' },
  { name: '酒香', color: '#7E57C2' },
];

type SeedRoast = RoastLevel;

const SAMPLE_RECORDS: Array<{
  coffeeName: string;
  roastLevel: SeedRoast;
  rating: number;
  notes?: string;
  tags: string[];
  daysAgo: number;
}> = [
  {
    coffeeName: '埃塞俄比亚 耶加雪菲',
    roastLevel: 'LIGHT',
    rating: 5,
    notes: '明亮的柑橘酸，茉莉花香气扑鼻',
    tags: ['花香', '果酸', '花香'],
    daysAgo: 0,
  },
  {
    coffeeName: '哥伦比亚 慧兰',
    roastLevel: 'MEDIUM',
    rating: 4,
    notes: '焦糖甜感，坚果余韵',
    tags: ['焦糖', '坚果', '巧克力'],
    daysAgo: 1,
  },
  {
    coffeeName: '巴西 喜拉多',
    roastLevel: 'MEDIUM',
    rating: 4,
    notes: '巧克力浓郁，低酸醇厚',
    tags: ['巧克力', '坚果', '焦糖'],
    daysAgo: 2,
  },
  {
    coffeeName: '苏门答腊 曼特宁',
    roastLevel: 'DARK',
    rating: 4,
    notes: '草本气息，木质调深沉',
    tags: ['草本', '烟熏', '烟熏'],
    daysAgo: 3,
  },
  {
    coffeeName: '肯尼亚 AA',
    roastLevel: 'LIGHT',
    rating: 5,
    notes: '黑醋栗酸质，红酒般发酵感',
    tags: ['果酸', '酒香', '花香'],
    daysAgo: 4,
  },
  {
    coffeeName: '危地马拉 薇薇特南果',
    roastLevel: 'MEDIUM',
    rating: 4,
    notes: '可可与坚果平衡，甜感持久',
    tags: ['巧克力', '坚果', '焦糖'],
    daysAgo: 5,
  },
  {
    coffeeName: '牙买加 蓝山',
    roastLevel: 'MEDIUM',
    rating: 5,
    notes: '完美平衡，花香果酸巧克力兼具',
    tags: ['花香', '果酸', '巧克力'],
    daysAgo: 7,
  },
  {
    coffeeName: '印尼 猫屎咖啡',
    roastLevel: 'DARK',
    tags: ['烟熏', '草本', '巧克力'],
    rating: 3,
    notes: '独特的厚重口感',
    daysAgo: 10,
  },
  {
    coffeeName: '也门 摩卡玛塔利',
    roastLevel: 'EXTRA_DARK',
    rating: 5,
    notes: '酒香浓郁，香料复杂',
    tags: ['酒香', '烟熏', '巧克力'],
    daysAgo: 14,
  },
  {
    coffeeName: '云南 小粒咖啡',
    roastLevel: 'MEDIUM',
    rating: 4,
    notes: '坚果调性，顺滑易入口',
    tags: ['坚果', '焦糖', '草本'],
    daysAgo: 20,
  },
];

async function main() {
  console.log('开始播种数据...');

  for (const tag of FLAVOR_TAGS) {
    await prisma.flavorTag.upsert({
      where: { name: tag.name },
      update: {},
      create: tag,
    });
  }
  console.log('风味标签已创建');

  const defaultUser = await prisma.user.upsert({
    where: { id: 'default-user' },
    update: {},
    create: {
      id: 'default-user',
      name: '咖啡品鉴师',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=coffee',
    },
  });
  console.log('默认用户已创建');

  const allTags = await prisma.flavorTag.findMany();
  const tagMap = new Map(allTags.map((t) => [t.name, t.id]));

  for (const rec of SAMPLE_RECORDS) {
    const uniqueTagNames = Array.from(new Set(rec.tags)).slice(0, 3);
    const tagIds = uniqueTagNames
      .map((name) => tagMap.get(name))
      .filter((id): id is string => !!id);

    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - rec.daysAgo);
    createdAt.setHours(9 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));

    await prisma.record.create({
      data: {
        userId: defaultUser.id,
        coffeeName: rec.coffeeName,
        roastLevel: rec.roastLevel,
        rating: rec.rating,
        notes: rec.notes,
        createdAt,
        flavorTags: {
          connect: tagIds.map((id) => ({ id })),
        },
      },
    });
    console.log(`创建示例记录: ${rec.coffeeName}`);
  }

  console.log('播种完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
